package com.dacsan.service;

import com.dacsan.dto.response.VendorDocumentResponse;
import com.dacsan.entity.*;
import com.dacsan.repository.VendorDocumentRepository;
import com.dacsan.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VendorDocumentService {

    private final VendorDocumentRepository vendorDocumentRepository;
    private final VendorRepository vendorRepository;
    private final UploadService uploadService;

    @Transactional
    public VendorDocumentResponse uploadDocument(Long vendorId, MultipartFile file, DocumentType type) {
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));

        try {
            var uploadResponse = uploadService.uploadDocument(file);

            VendorDocument document = VendorDocument.builder()
                    .vendor(vendor)
                    .documentType(type)
                    .fileUrl(uploadResponse.getUrl())
                    .fileName(file.getOriginalFilename())
                    .status(DocumentStatus.PENDING)
                    .build();

            document = vendorDocumentRepository.save(document);
            log.info("Document uploaded for vendor {}: {} ({})", vendorId, file.getOriginalFilename(), type);

            return mapToResponse(document);
        } catch (IOException e) {
            log.error("Failed to upload document for vendor {}: {}", vendorId, e.getMessage());
            throw new RuntimeException("Failed to upload document: " + e.getMessage());
        }
    }

    public List<VendorDocumentResponse> getDocumentsByVendor(Long vendorId) {
        return vendorDocumentRepository.findByVendorId(vendorId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<VendorDocumentResponse> getAllPendingDocuments() {
        return vendorDocumentRepository.findByStatus(DocumentStatus.PENDING).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public VendorDocumentResponse reviewDocument(Long documentId, DocumentStatus status, String note) {
        VendorDocument document = vendorDocumentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        document.setStatus(status);
        document.setReviewNote(note);
        document = vendorDocumentRepository.save(document);

        log.info("Document {} reviewed: status={}, note={}", documentId, status, note);

        // Check if all documents of this vendor are approved
        if (status == DocumentStatus.APPROVED) {
            Long vendorId = document.getVendor().getId();
            List<VendorDocument> vendorDocs = vendorDocumentRepository.findByVendorId(vendorId);

            boolean allApproved = vendorDocs.stream()
                    .allMatch(d -> d.getStatus() == DocumentStatus.APPROVED);

            if (allApproved && !vendorDocs.isEmpty()) {
                Vendor vendor = document.getVendor();
                vendor.setVerified(true);
                vendorRepository.save(vendor);
                log.info("All documents approved for vendor {}. Vendor is now verified.", vendorId);
            }
        }

        return mapToResponse(document);
    }

    private VendorDocumentResponse mapToResponse(VendorDocument document) {
        return VendorDocumentResponse.builder()
                .id(document.getId())
                .vendorId(document.getVendor().getId())
                .vendorName(document.getVendor().getStoreName())
                .documentType(document.getDocumentType())
                .fileUrl(document.getFileUrl())
                .fileName(document.getFileName())
                .status(document.getStatus())
                .reviewNote(document.getReviewNote())
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();
    }
}
