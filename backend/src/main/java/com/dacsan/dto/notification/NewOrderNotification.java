package com.dacsan.dto.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Notification sent to vendor when a new order is created
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewOrderNotification {

    private String orderNumber;
    private String subOrderNumber;
    private BigDecimal subtotal;
    private Integer itemCount;
    private String customerName;
    private String deliveryAddress;
    private LocalDateTime timestamp;

    @Builder.Default
    private String message = "Bạn có đơn hàng mới!";
}
