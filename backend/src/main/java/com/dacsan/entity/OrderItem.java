package com.dacsan.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sub_order_id", nullable = false)
    @JsonIgnore
    private SubOrder subOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price; // Price snapshot at time of order

    // Store selected variants as JSON
    // Example: [{"groupName": "Size", "variantName": "Lớn", "priceAdjustment":
    // 10000}, ...]
    @Column(columnDefinition = "TEXT")
    private String selectedVariantsJson;

    @Transient
    private List<SelectedVariant> selectedVariants = new ArrayList<>();

    @PostLoad
    private void deserializeVariants() {
        if (selectedVariantsJson != null && !selectedVariantsJson.isEmpty()) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                selectedVariants = mapper.readValue(selectedVariantsJson,
                        new TypeReference<List<SelectedVariant>>() {
                        });
            } catch (Exception e) {
                selectedVariants = new ArrayList<>();
            }
        }
    }

    @PrePersist
    @PreUpdate
    private void serializeVariants() {
        if (selectedVariants != null && !selectedVariants.isEmpty()) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                selectedVariantsJson = mapper.writeValueAsString(selectedVariants);
            } catch (Exception e) {
                selectedVariantsJson = "[]";
            }
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SelectedVariant {
        private String groupName;
        private String variantName;
        private BigDecimal priceAdjustment;
    }
}
