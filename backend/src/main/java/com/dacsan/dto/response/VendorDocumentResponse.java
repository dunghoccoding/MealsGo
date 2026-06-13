package com.dacsan.dto.response;

import com.dacsan.entity.DocumentStatus;
import com.dacsan.entity.DocumentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorDocumentResponse {
    private Long id;
    private Long vendorId;
    private String vendorName;
    private DocumentType documentType;
    private String fileUrl;
    private String fileName;
    private DocumentStatus status;
    private String reviewNote;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
