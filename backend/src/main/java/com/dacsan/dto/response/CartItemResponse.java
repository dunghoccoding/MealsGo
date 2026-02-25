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
public class CartItemResponse {
    private Long id;
    private ProductResponse product;
    private Integer quantity;
    private List<CartItem.SelectedVariant> selectedVariants;
    private BigDecimal itemPrice; // base + variant adjustments
    private BigDecimal subtotal; // itemPrice * quantity
    private String vendorName;
    private Long vendorId;
}
