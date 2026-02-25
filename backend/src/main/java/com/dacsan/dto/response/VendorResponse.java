package com.dacsan.dto.response;

import com.dacsan.entity.Region;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorResponse {
    private Long id;
    private Long userId;
    private String storeName;
    private String description;
    private Region region;
    private String address;
    private String phone;
    private String logo;
    private String banner;
    private Double rating;
    private Integer totalReviews;
    private Boolean active;
    private Boolean verified;
    private LocalDateTime createdAt;
}
