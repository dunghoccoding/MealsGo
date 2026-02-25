package com.dacsan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VariantGroupResponse {
    private Long id;
    private String name;
    private Boolean isMultiSelect;
    private Boolean isRequired;
    private Integer displayOrder;
    private List<VariantResponse> variants = new ArrayList<>();
}
