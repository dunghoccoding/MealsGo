package com.dacsan.dto.request;

import com.dacsan.entity.ProductCategory;
import com.dacsan.entity.Region;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CreateProductRequest {

    @NotBlank(message = "Product name is required")
    private String name;

    private String description;

    @NotNull(message = "Base price is required")
    @DecimalMin(value = "0.0", message = "Price must be positive")
    private BigDecimal basePrice;

    @NotNull(message = "Region is required")
    private Region region;

    @NotNull(message = "Category is required")
    private ProductCategory category;

    private List<String> images = new ArrayList<>();

    private Boolean available = true;

    private Boolean featured = false;
}
