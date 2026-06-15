package com.dacsan.controller;

import com.dacsan.dto.response.PendingVendorResponse;
import com.dacsan.service.VendorDocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/test-debug")
@RequiredArgsConstructor
public class TestController {

    private final VendorDocumentService documentService;

    @GetMapping("/pending")
    public List<PendingVendorResponse> testPending() {
        return documentService.getPendingVendors();
    }
}
