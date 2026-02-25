package com.dacsan.dto.response;

import com.dacsan.entity.ProductCategory;
import com.dacsan.entity.Region;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private Long vendorId;
    private String vendorName;
    private String name;
    private String description;
    private BigDecimal basePrice;
    private Region region;
    private ProductCategory category;
    private List<String> images = new ArrayList<>();
    private Boolean available;
    private Boolean featured;
    private Integer soldCount;
    private Double rating;
    private Integer reviewCount;
    private List<VariantGroupResponse> variantGroups = new ArrayList<>();
}
