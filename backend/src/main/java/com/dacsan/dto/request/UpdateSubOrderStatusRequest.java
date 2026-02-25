package com.dacsan.dto.request;

import com.dacsan.entity.SubOrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSubOrderStatusRequest {

    @NotNull(message = "Status is required")
    private SubOrderStatus status;

    private String note;
}
