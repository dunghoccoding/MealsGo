package com.dacsan.service;

import com.dacsan.dto.notification.NewOrderNotification;
import com.dacsan.dto.notification.OrderStatusUpdateNotification;
import com.dacsan.dto.response.OrderResponse;
import com.dacsan.dto.response.SubOrderResponse;
import com.dacsan.entity.SubOrder;
import com.dacsan.entity.SubOrderStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Service for sending real-time notifications via WebSocket
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Notify vendor when a new order is created
     * 
     * @param vendorId The vendor to notify
     * @param order    The complete order
     * @param subOrder The sub-order for this specific vendor
     */
    public void notifyVendorNewOrder(Long vendorId, OrderResponse order, SubOrderResponse subOrder) {
        String destination = "/topic/vendor/" + vendorId + "/orders";

        NewOrderNotification notification = NewOrderNotification.builder()
                .orderNumber(order.getOrderNumber())
                .subOrderNumber(subOrder.getSubOrderNumber())
                .subtotal(subOrder.getSubtotal())
                .itemCount(subOrder.getItems().size())
                .customerName(order.getCustomerName())
                .deliveryAddress(order.getDeliveryAddress())
                .timestamp(LocalDateTime.now())
                .message("Bạn có đơn hàng mới!")
                .build();

        messagingTemplate.convertAndSend(destination, notification);
        log.info("🔔 Sent new order notification to vendor {}: {} ({})",
                vendorId, subOrder.getSubOrderNumber(), destination);
    }

    /**
     * Notify customer when order status is updated
     * 
     * @param customerId The customer to notify
     * @param subOrder   The updated sub-order
     * @param oldStatus  The previous status
     */
    public void notifyCustomerOrderUpdate(Long customerId,
            SubOrder subOrder,
            SubOrderStatus oldStatus) {
        String destination = "/topic/customer/" + customerId + "/order-updates";

        OrderStatusUpdateNotification notification = OrderStatusUpdateNotification.builder()
                .orderNumber(subOrder.getOrder().getOrderNumber())
                .subOrderNumber(subOrder.getSubOrderNumber())
                .vendorName(subOrder.getVendor().getStoreName())
                .oldStatus(oldStatus)
                .newStatus(subOrder.getStatus())
                .message(getStatusMessage(subOrder.getStatus()))
                .timestamp(LocalDateTime.now())
                .build();

        messagingTemplate.convertAndSend(destination, notification);
        log.info("🔔 Sent status update to customer {}: {} {} -> {} ({})",
                customerId,
                subOrder.getSubOrderNumber(),
                oldStatus,
                subOrder.getStatus(),
                destination);
    }

    /**
     * Get user-friendly message for each status
     */
    private String getStatusMessage(SubOrderStatus status) {
        return switch (status) {
            case PENDING -> "Đơn hàng đang chờ xác nhận";
            // User requested: "Preparing to deliver" notification when Confirmed
            case COOKING -> "Bếp đang nấu! Đơn hàng sẽ được giao trong giây lát";
            case READY -> "Món ăn đã sẵn sàng";
            case PICKED_UP -> "Đơn hàng đang được giao đến bạn";
            case DELIVERED -> "Đơn hàng đã được giao thành công";
            case CANCELLED -> "Đơn hàng đã bị hủy";
        };
    }
}
