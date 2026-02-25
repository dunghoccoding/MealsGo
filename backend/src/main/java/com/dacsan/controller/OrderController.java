package com.dacsan.controller;

import com.dacsan.dto.request.CreateOrderRequest;
import com.dacsan.dto.request.UpdateSubOrderStatusRequest;
import com.dacsan.dto.response.OrderResponse;
import com.dacsan.dto.response.SubOrderResponse;
import com.dacsan.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Order management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Create order from cart", description = "Creates main order and splits into sub-orders by vendor. Clears cart after creation.")
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        return ResponseEntity.ok(orderService.createOrder(request));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get orders", description = "Customers see their orders. Vendors see sub-orders for their products.")
    public ResponseEntity<List<OrderResponse>> getOrders() {
        return ResponseEntity.ok(orderService.getOrders());
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get order by ID", description = "Get order details with all sub-orders and items")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.getOrderById(orderId));
    }

    @PatchMapping("/sub/{subOrderId}/status")
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(summary = "Update sub-order status", description = "Vendor updates status of their sub-order (PENDING → COOKING → READY → DELIVERING → DELIVERED)")
    public ResponseEntity<SubOrderResponse> updateSubOrderStatus(
            @PathVariable Long subOrderId,
            @Valid @RequestBody UpdateSubOrderStatusRequest request) {
        return ResponseEntity.ok(orderService.updateSubOrderStatus(subOrderId, request));
    }
}
