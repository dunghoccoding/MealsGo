package com.dacsan.dto.request;

import com.dacsan.entity.ProductCategory;
import com.dacsan.entity.Region;
import jakarta.validation.constraints.DecimalMin;
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
public class UpdateProductRequest {

    private String name;

    private String description;

    @DecimalMin(value = "0.0", message = "Price must be positive")
    private BigDecimal basePrice;

    private Region region;

    private ProductCategory category;

    private List<String> images;

    private Boolean available;

    private Boolean featured;
}
