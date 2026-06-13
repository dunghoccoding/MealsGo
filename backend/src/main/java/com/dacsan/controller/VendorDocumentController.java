package com.dacsan.controller;

import com.dacsan.dto.response.VendorDocumentResponse;
import com.dacsan.entity.DocumentType;
import com.dacsan.entity.User;
import com.dacsan.entity.Vendor;
import com.dacsan.repository.VendorRepository;
import com.dacsan.service.VendorDocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/vendors/documents")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Vendor Documents", description = "Vendor document verification endpoints")
public class VendorDocumentController {

    private final VendorDocumentService vendorDocumentService;
    private final VendorRepository vendorRepository;

    @PostMapping
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(summary = "Upload a verification document (Vendor only)")
    public ResponseEntity<VendorDocumentResponse> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") DocumentType documentType) {
        Long vendorId = getCurrentVendorId();
        return ResponseEntity.ok(vendorDocumentService.uploadDocument(vendorId, file, documentType));
    }

    @GetMapping
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(summary = "Get current vendor's documents")
    public ResponseEntity<List<VendorDocumentResponse>> getMyDocuments() {
        Long vendorId = getCurrentVendorId();
        return ResponseEntity.ok(vendorDocumentService.getDocumentsByVendor(vendorId));
    }

    private Long getCurrentVendorId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth.getPrincipal() instanceof User user) {
            Vendor vendor = vendorRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Vendor not found for current user"));
            return vendor.getId();
        }
        throw new RuntimeException("User not authenticated");
    }
}
