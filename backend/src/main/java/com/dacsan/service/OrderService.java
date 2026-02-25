package com.dacsan.service;

import com.dacsan.dto.request.CreateOrderRequest;
import com.dacsan.dto.request.UpdateSubOrderStatusRequest;
import com.dacsan.dto.response.OrderItemResponse;
import com.dacsan.dto.response.OrderResponse;
import com.dacsan.dto.response.SubOrderResponse;
import com.dacsan.entity.*;
import com.dacsan.exception.NotFoundException;
import com.dacsan.repository.*;
import com.dacsan.security.SecurityUtils;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

        private final OrderRepository orderRepository;
        private final SubOrderRepository subOrderRepository;
        private final OrderItemRepository orderItemRepository;
        private final AddressRepository addressRepository;
        private final CartRepository cartRepository;
        private final CartItemRepository cartItemRepository;
        private final VendorRepository vendorRepository;
        private final ObjectMapper objectMapper;
        private final NotificationService notificationService; // WebSocket notifications

        @Transactional
        public OrderResponse createOrder(CreateOrderRequest request) {
                User currentUser = SecurityUtils.getCurrentUser();

                // 1. Get user's cart
                Cart cart = cartRepository.findByUserId(currentUser.getId())
                                .orElseThrow(() -> new IllegalArgumentException("Cart not found"));

                if (cart.getItems().isEmpty()) {
                        throw new IllegalArgumentException("Cart is empty");
                }

                // 2. Get delivery address
                Address address = addressRepository.findById(request.getAddressId())
                                .orElseThrow(() -> new NotFoundException("Address not found"));

                // Verify address belongs to user
                if (!address.getUser().getId().equals(currentUser.getId())) {
                        throw new IllegalArgumentException("Address does not belong to current user");
                }

                // 3. Group cart items by vendor ⭐ KEY LOGIC
                Map<Long, List<CartItem>> itemsByVendor = cart.getItems().stream()
                                .collect(Collectors.groupingBy(item -> item.getProduct().getVendor().getId()));

                log.info("Creating order for user {} with {} vendors",
                                currentUser.getId(), itemsByVendor.size());

                // 4. Calculate total
                BigDecimal totalAmount = calculateTotalAmount(cart.getItems());

                // 5. Create main order
                String orderNumber = generateOrderNumber();
                Order order = Order.builder()
                                .orderNumber(orderNumber)
                                .customer(currentUser)
                                .totalAmount(totalAmount)
                                .shippingFee(calculateShippingFee(address, totalAmount))
                                .status(OrderStatus.PENDING)
                                .paymentMethod(request.getPaymentMethod())
                                .deliveryName(address.getRecipientName())
                                .deliveryPhone(address.getRecipientPhone())
                                .deliveryAddress(String.format("%s, %s, %s, %s",
                                                address.getAddressLine(),
                                                address.getWard(),
                                                address.getDistrict(),
                                                address.getCity()))
                                .notes(request.getNotes())
                                .build();

                order = orderRepository.save(order);
                log.info("Created order {} for customer {}", orderNumber, currentUser.getId());

                // 6. Create sub-orders for each vendor ⭐ VENDOR SPLITTING LOGIC
                List<SubOrder> subOrders = new ArrayList<>();
                int vendorIndex = 0;

                for (Map.Entry<Long, List<CartItem>> entry : itemsByVendor.entrySet()) {
                        Long vendorId = entry.getKey();
                        List<CartItem> vendorItems = entry.getValue();

                        Vendor vendor = vendorRepository.findById(vendorId)
                                        .orElseThrow(() -> new NotFoundException("Vendor not found: " + vendorId));

                        BigDecimal subtotal = calculateSubtotal(vendorItems);

                        // Generate sub-order number with vendor suffix
                        char vendorSuffix = (char) ('A' + vendorIndex);
                        String subOrderNumber = orderNumber + "-" + vendorSuffix;

                        SubOrder subOrder = SubOrder.builder()
                                        .subOrderNumber(subOrderNumber)
                                        .order(order)
                                        .vendor(vendor)
                                        .subtotal(subtotal)
                                        .status(SubOrderStatus.PENDING)
                                        .build();

                        subOrder = subOrderRepository.save(subOrder);

                        log.info("Created sub-order {} for vendor {} ({})",
                                        subOrderNumber, vendor.getId(), vendor.getStoreName());

                        // Create order items for this sub-order
                        for (CartItem cartItem : vendorItems) {
                                BigDecimal itemPrice = calculateItemPrice(cartItem);

                                OrderItem orderItem = OrderItem.builder()
                                                .subOrder(subOrder)
                                                .product(cartItem.getProduct())
                                                .quantity(cartItem.getQuantity())
                                                .price(itemPrice)
                                                .selectedVariantsJson(cartItem.getSelectedVariantsJson())
                                                .build();

                                orderItemRepository.save(orderItem);
                        }

                        subOrders.add(subOrder);
                        vendorIndex++;
                }

                log.info("Created {} sub-orders for order {}", subOrders.size(), orderNumber);

                // 7. Clear cart
                cartItemRepository.deleteAll(cart.getItems());
                log.info("Cleared cart for user {}", currentUser.getId());

                // 8. Send WebSocket notifications to vendors
                log.info("Preparing vendor notifications for order {}", order.getOrderNumber());
                for (SubOrder subOrder : subOrders) {
                        try {
                                log.info("Notifying vendor {} for sub-order {}", subOrder.getVendor().getId(),
                                                subOrder.getSubOrderNumber());
                                SubOrderResponse subOrderResponse = buildSubOrderResponse(subOrder);
                                // Filter OrderResponse to only show this vendor's sub-order in notification
                                OrderResponse filteredResponse = buildOrderResponse(order, List.of(subOrder));

                                notificationService.notifyVendorNewOrder(
                                                subOrder.getVendor().getId(),
                                                filteredResponse,
                                                subOrderResponse);
                                log.info("Successfully notified vendor {}", subOrder.getVendor().getId());
                        } catch (Exception e) {
                                log.error("Error notifying vendor {}: {}", subOrder.getVendor().getId(), e.getMessage(),
                                                e);
                                // Don't rethrow, one vendor notification failure shouldn't kill order creation
                        }
                }

                // 9. Return response with sub-orders
                log.info("Order {} creation complete, returning response", order.getOrderNumber());
                return buildOrderResponse(order, subOrders);
        }

        @Transactional(readOnly = true)
        public List<OrderResponse> getOrders() {
                User currentUser = SecurityUtils.getCurrentUser();

                if (currentUser.getRole() == UserRole.VENDOR) {
                        // Vendor: get their sub-orders only
                        Long vendorId = vendorRepository.findByUserId(currentUser.getId())
                                        .orElseThrow(() -> new NotFoundException("Vendor profile not found"))
                                        .getId();

                        List<SubOrder> subOrders = subOrderRepository.findByVendorIdOrderByCreatedAtDesc(vendorId);

                        // Group sub-orders by main order, preserving order of appearance
                        Map<Long, List<SubOrder>> subOrdersByOrder = subOrders.stream()
                                        .collect(Collectors.groupingBy(
                                                        sub -> sub.getOrder().getId(),
                                                        LinkedHashMap::new,
                                                        Collectors.toList()));

                        return subOrdersByOrder.values().stream()
                                        .map(list -> buildOrderResponse(list.get(0).getOrder(), list))
                                        .collect(Collectors.toList());
                } else {
                        // Customer: get their orders
                        List<Order> orders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(currentUser.getId());
                        return orders.stream()
                                        .map(order -> buildOrderResponse(order, order.getSubOrders()))
                                        .collect(Collectors.toList());
                }
        }

        @Transactional(readOnly = true)
        public OrderResponse getOrderById(Long orderId) {
                log.info("Fetching order by ID: {}", orderId);
                Order order = orderRepository.findById(orderId)
                                .orElseThrow(() -> new NotFoundException("Order not found"));

                User currentUser = SecurityUtils.getCurrentUser();
                log.info("Current user: {}, role: {}", currentUser.getEmail(), currentUser.getRole());

                if (currentUser.getRole() == UserRole.VENDOR) {
                        log.info("User is VENDOR, identifying vendor profile...");
                        // Vendor: can only see their own sub-order(s) within this order
                        Long vendorId = vendorRepository.findByUserId(currentUser.getId())
                                        .orElseThrow(() -> new NotFoundException("Vendor profile not found"))
                                        .getId();

                        log.info("Vendor ID: {}, filtering sub-orders for main order {}...", vendorId, order.getId());

                        List<SubOrder> filteredSubOrders = order.getSubOrders().stream()
                                        .filter(sub -> {
                                                boolean match = sub.getVendor().getId().equals(vendorId);
                                                log.debug("SubOrder {} vendor check: result={}",
                                                                sub.getSubOrderNumber(), match);
                                                return match;
                                        })
                                        .collect(Collectors.toList());

                        log.info("Found {} filtered sub-orders", filteredSubOrders.size());

                        if (filteredSubOrders.isEmpty()) {
                                log.warn("Vendor {} attempted to view order {} but has no sub-orders", vendorId,
                                                orderId);
                                throw new IllegalArgumentException("You do not have permission to view this order");
                        }

                        OrderResponse response = buildOrderResponse(order, filteredSubOrders);
                        log.info("Returning filtered response to vendor");
                        return response;
                }

                // Customer: verify access to their own orders
                if (currentUser.getRole() == UserRole.CUSTOMER) {
                        if (!order.getCustomer().getId().equals(currentUser.getId())) {
                                log.warn("Customer {} attempted to view order {} belonging to {}",
                                                currentUser.getId(), orderId, order.getCustomer().getId());
                                throw new IllegalArgumentException("Order does not belong to current user");
                        }
                }

                log.info("Returning full order response to Admin/Customer");
                return buildOrderResponse(order, order.getSubOrders());
        }

        @Transactional
        public SubOrderResponse updateSubOrderStatus(Long subOrderId, UpdateSubOrderStatusRequest request) {
                SubOrder subOrder = subOrderRepository.findById(subOrderId)
                                .orElseThrow(() -> new NotFoundException("Sub-order not found"));

                // Verify vendor owns this sub-order
                User currentUser = SecurityUtils.getCurrentUser();
                Long vendorId = vendorRepository.findByUserId(currentUser.getId())
                                .orElseThrow(() -> new NotFoundException("Vendor profile not found"))
                                .getId();

                log.info("Update Status Attempt: subOrderId={}, userEmail={}, userVendorId={}, subOrderVendorId={}",
                                subOrderId, currentUser.getEmail(), vendorId, subOrder.getVendor().getId());

                if (!subOrder.getVendor().getId().equals(vendorId)) {
                        log.error("SECURITY ALERT: Vendor mismatch! User's VendorID: {}, SubOrder's VendorID: {}",
                                        vendorId, subOrder.getVendor().getId());
                        throw new IllegalArgumentException("Sub-order does not belong to current vendor");
                }

                // Store old status for notification
                SubOrderStatus oldStatus = subOrder.getStatus();

                subOrder.setStatus(request.getStatus());
                subOrder = subOrderRepository.save(subOrder);

                log.info("Updated sub-order {} status to {}",
                                subOrder.getSubOrderNumber(), request.getStatus());

                // Update main order status based on sub-order statuses
                updateMainOrderStatus(subOrder.getOrder());

                // Send WebSocket notification to customer
                notificationService.notifyCustomerOrderUpdate(
                                subOrder.getOrder().getCustomer().getId(),
                                subOrder,
                                oldStatus);

                return buildSubOrderResponse(subOrder);
        }

        // Helper methods

        private BigDecimal calculateTotalAmount(List<CartItem> items) {
                return items.stream()
                                .map(item -> calculateItemPrice(item).multiply(BigDecimal.valueOf(item.getQuantity())))
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        private BigDecimal calculateSubtotal(List<CartItem> items) {
                return items.stream()
                                .map(item -> calculateItemPrice(item).multiply(BigDecimal.valueOf(item.getQuantity())))
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        private BigDecimal calculateItemPrice(CartItem cartItem) {
                BigDecimal basePrice = cartItem.getProduct().getBasePrice();

                if (cartItem.getSelectedVariants() == null || cartItem.getSelectedVariants().isEmpty()) {
                        return basePrice;
                }

                BigDecimal variantAdjustment = cartItem.getSelectedVariants().stream()
                                .map(CartItem.SelectedVariant::getPriceAdjustment)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                return basePrice.add(variantAdjustment);
        }

        private String generateOrderNumber() {
                String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
                long count = orderRepository.count() + 1;
                return String.format("ORD%s%05d", datePart, count);
        }

        private void updateMainOrderStatus(Order order) {
                List<SubOrder> subOrders = order.getSubOrders();

                boolean allDelivered = subOrders.stream()
                                .allMatch(sub -> sub.getStatus() == SubOrderStatus.DELIVERED);

                boolean anyPickedUp = subOrders.stream()
                                .anyMatch(sub -> sub.getStatus() == SubOrderStatus.PICKED_UP);

                boolean anyReady = subOrders.stream()
                                .anyMatch(sub -> sub.getStatus() == SubOrderStatus.READY);

                boolean anyCooking = subOrders.stream()
                                .anyMatch(sub -> sub.getStatus() == SubOrderStatus.COOKING);

                boolean allCancelled = subOrders.stream()
                                .allMatch(sub -> sub.getStatus() == SubOrderStatus.CANCELLED);

                if (allDelivered) {
                        order.setStatus(OrderStatus.COMPLETED);
                } else if (allCancelled) {
                        order.setStatus(OrderStatus.CANCELLED);
                } else if (anyPickedUp) {
                        order.setStatus(OrderStatus.DELIVERING);
                } else if (anyReady) {
                        order.setStatus(OrderStatus.READY);
                } else if (anyCooking) {
                        order.setStatus(OrderStatus.PREPARING);
                } else {
                        // If it's not any of the above, it's either PENDING or CONFIRMED
                        // We'll use CONFIRMED as the default "in-progress" state allowed by DB
                        order.setStatus(OrderStatus.CONFIRMED);
                }

                log.info("Updating Order {} status to {} (Sub-orders: {})",
                                order.getOrderNumber(), order.getStatus(),
                                subOrders.stream().map(s -> s.getStatus().name()).collect(Collectors.joining(",")));

                orderRepository.save(order);
        }

        private OrderResponse buildOrderResponse(Order order, List<SubOrder> subOrders) {
                List<SubOrderResponse> subOrderResponses = subOrders.stream()
                                .map(this::buildSubOrderResponse)
                                .collect(Collectors.toList());

                return OrderResponse.builder()
                                .id(order.getId())
                                .orderNumber(order.getOrderNumber())
                                .customerId(order.getCustomer().getId())
                                .customerName(order.getCustomer().getFullName())
                                .totalAmount(order.getTotalAmount())
                                .shippingFee(order.getShippingFee())
                                .status(order.getStatus())
                                .paymentMethod(order.getPaymentMethod())
                                .deliveryName(order.getDeliveryName())
                                .deliveryPhone(order.getDeliveryPhone())
                                .deliveryAddress(order.getDeliveryAddress())
                                .notes(order.getNotes())
                                .subOrders(subOrderResponses)
                                .createdAt(order.getCreatedAt())
                                .updatedAt(order.getUpdatedAt())
                                .build();
        }

        private SubOrderResponse buildSubOrderResponse(SubOrder subOrder) {
                List<OrderItem> items = orderItemRepository.findBySubOrderId(subOrder.getId());

                List<OrderItemResponse> itemResponses = items.stream()
                                .map(this::buildOrderItemResponse)
                                .collect(Collectors.toList());

                return SubOrderResponse.builder()
                                .id(subOrder.getId())
                                .subOrderNumber(subOrder.getSubOrderNumber())
                                .vendorId(subOrder.getVendor().getId())
                                .vendorName(subOrder.getVendor().getStoreName())
                                .subtotal(subOrder.getSubtotal())
                                .status(subOrder.getStatus())
                                .items(itemResponses)
                                .createdAt(subOrder.getCreatedAt())
                                .updatedAt(subOrder.getUpdatedAt())
                                .build();
        }

        private OrderItemResponse buildOrderItemResponse(OrderItem orderItem) {
                List<CartItem.SelectedVariant> selectedVariants = new ArrayList<>();

                if (orderItem.getSelectedVariantsJson() != null && !orderItem.getSelectedVariantsJson().isEmpty()) {
                        try {
                                selectedVariants = objectMapper.readValue(
                                                orderItem.getSelectedVariantsJson(),
                                                new TypeReference<List<CartItem.SelectedVariant>>() {
                                                });
                        } catch (Exception e) {
                                log.error("Failed to deserialize variants", e);
                        }
                }

                BigDecimal subtotal = orderItem.getPrice().multiply(BigDecimal.valueOf(orderItem.getQuantity()));

                return OrderItemResponse.builder()
                                .id(orderItem.getId())
                                .productName(orderItem.getProduct().getName())
                                .quantity(orderItem.getQuantity())
                                .price(orderItem.getPrice())
                                .subtotal(subtotal)
                                .selectedVariants(selectedVariants)
                                .productImage(
                                                orderItem.getProduct().getImages() != null
                                                                && !orderItem.getProduct().getImages().isEmpty()
                                                                                ? orderItem.getProduct().getImages()
                                                                                                .get(0)
                                                                                : null)
                                .build();
        }

        /**
         * Calculate shipping fee based on delivery location and order amount
         * 
         * Shipping Rules:
         * 1. FREE SHIPPING: Orders >= 100,000 VND
         * 2. MAJOR CITIES (Hanoi, HCMC, Da Nang): 30,000 VND
         * 3. REMOTE AREAS (mountainous provinces): 35,000 VND
         * 4. OTHER CITIES: 20,000 VND
         * 
         * @param address     Delivery address containing city information
         * @param totalAmount Total order amount before shipping
         * @return Calculated shipping fee in VND
         */
        private BigDecimal calculateShippingFee(Address address, BigDecimal totalAmount) {
                // Rule 1: Free shipping for orders >= 100,000 VND
                if (totalAmount.compareTo(BigDecimal.valueOf(100000)) >= 0) {
                        log.info("Free shipping applied for order total: {}", totalAmount);
                        return BigDecimal.ZERO;
                }

                String city = address.getCity().toLowerCase().trim();

                // Rule 2: Major cities - 30,000 VND
                if (city.contains("hà nội") || city.contains("ha noi") ||
                                city.contains("hồ chí minh") || city.contains("ho chi minh") ||
                                city.contains("tp.hcm") || city.contains("sài gòn") || city.contains("saigon") ||
                                city.contains("đà nẵng") || city.contains("da nang")) {
                        log.info("Major city shipping fee (30k) for: {}", city);
                        return BigDecimal.valueOf(30000);
                }

                // Rule 3: Remote/mountainous provinces - 35,000 VND
                if (city.contains("lai châu") || city.contains("điện biên") ||
                                city.contains("sơn la") || city.contains("hà giang") ||
                                city.contains("cao bằng") || city.contains("bắc kạn") ||
                                city.contains("lào cai")) {
                        log.info("Remote area shipping fee (35k) for: {}", city);
                        return BigDecimal.valueOf(35000);
                }

                // Rule 4: Other cities - 20,000 VND (standard)
                log.info("Standard shipping fee (20k) for: {}", city);
                return BigDecimal.valueOf(20000);
        }
}
