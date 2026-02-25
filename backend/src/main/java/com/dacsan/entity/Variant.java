package com.dacsan.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "variants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Variant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_group_id", nullable = false)
    @JsonIgnore
    private VariantGroup variantGroup;

    @Column(nullable = false)
    private String name; // Example: "Lớn", "Thêm trứng", "Ít hành"

    @Column(precision = 10, scale = 2)
    private BigDecimal priceAdjustment = BigDecimal.ZERO; // +10000 for "Lớn", +5000 for "Thêm trứng"

    @Column(nullable = false)
    private Boolean available = true;

    @Column(nullable = false)
    private Integer displayOrder = 0;
}
