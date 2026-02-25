package com.dacsan.dto.response;

import com.dacsan.entity.OrderStatus;
import com.dacsan.entity.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private String orderNumber;
    private Long customerId;
    private String customerName;
    private BigDecimal totalAmount;
    private BigDecimal shippingFee;
    private OrderStatus status;
    private PaymentMethod paymentMethod;

    // Delivery info
    private String deliveryName;
    private String deliveryPhone;
    private String deliveryAddress;
    private String notes;

    // Sub-orders (grouped by vendor)
    private List<SubOrderResponse> subOrders = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
