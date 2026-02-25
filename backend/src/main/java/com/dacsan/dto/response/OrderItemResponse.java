package com.dacsan.dto.response;

import com.dacsan.entity.CartItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {
    private Long id;
    private String productName;
    private Integer quantity;
    private BigDecimal price; // Unit price (base + variant adjustments)
    private BigDecimal subtotal; // price * quantity
    private List<CartItem.SelectedVariant> selectedVariants;
    private String productImage;
}
