package com.dacsan.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "variant_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VariantGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnore
    private Product product;

    @Column(nullable = false)
    private String name; // Example: "Size", "Topping", "Tùy chỉnh"

    @Column(nullable = false)
    private Boolean isMultiSelect = false; // true = Checkbox (nhiều), false = Radio (1)

    @Column(nullable = false)
    private Boolean isRequired = false; // User must select at least one

    @Column(nullable = false)
    private Integer displayOrder = 0; // For sorting groups in UI

    @OneToMany(mappedBy = "variantGroup", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Variant> variants = new ArrayList<>();
}
