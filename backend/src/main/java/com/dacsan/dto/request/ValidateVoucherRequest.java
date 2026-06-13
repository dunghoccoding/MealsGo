package com.dacsan.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ValidateVoucherRequest {
    @NotBlank(message = "Voucher code is required")
    private String code;

    @NotNull(message = "Order total is required")
    private BigDecimal orderTotal;

    private Long vendorId;
}
