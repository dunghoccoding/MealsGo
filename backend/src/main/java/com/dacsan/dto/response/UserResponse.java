package com.dacsan.dto.response;

import com.dacsan.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private UserRole role;
    private String avatar;
    private Boolean active;
    private LocalDateTime createdAt;
    private Long vendorId; // null if not vendor
}
