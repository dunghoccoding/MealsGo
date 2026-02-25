package com.dacsan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartResponse {
    private Long id;
    private List<CartItemResponse> items = new ArrayList<>();
    private Map<String, List<CartItemResponse>> itemsByVendor; // Grouped by vendor name
    private BigDecimal totalAmount;
    private Integer totalItems;
}
