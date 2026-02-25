package com.dacsan.dto.response;

import com.dacsan.entity.SubOrderStatus;
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
public class SubOrderResponse {
    private Long id;
    private String subOrderNumber;
    private Long vendorId;
    private String vendorName;
    private BigDecimal subtotal;
    private SubOrderStatus status;
    private List<OrderItemResponse> items = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
