package com.dacsan.dto.request;

import com.dacsan.entity.DocumentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReviewDocumentRequest {
    @NotNull(message = "Trạng thái không được để trống")
    private DocumentStatus status;
    private String reviewNote;
}
