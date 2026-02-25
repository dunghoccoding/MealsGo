package com.dacsan.dto.notification;

import com.dacsan.entity.SubOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Notification sent to customer when order status is updated
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusUpdateNotification {

    private String orderNumber;
    private String subOrderNumber;
    private String vendorName;
    private SubOrderStatus oldStatus;
    private SubOrderStatus newStatus;
    private String message;
    private LocalDateTime timestamp;
}
