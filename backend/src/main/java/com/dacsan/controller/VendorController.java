package com.dacsan.controller;

import com.dacsan.dto.response.VendorResponse;
import com.dacsan.dto.response.VendorStatsResponse;
import com.dacsan.entity.Region;
import com.dacsan.entity.User;
import com.dacsan.security.SecurityUtils;
import com.dacsan.service.VendorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendors")
@RequiredArgsConstructor
@Tag(name = "Vendors", description = "Vendor endpoints")
public class VendorController {

    private final VendorService vendorService;

    @GetMapping("/me/stats")
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(summary = "Get current vendor dashboard stats")
    public ResponseEntity<VendorStatsResponse> getMyStats() {
        User currentUser = SecurityUtils.getCurrentUser();
        // The User entity might not have a direct vendor field mapped if it's OneToOne
        // but not bidirectional in code
        // However, I'll use the vendorService to find by userId which is safer if the
        // relationship isn't direct in User class
        VendorResponse vendor = vendorService.getAllVendors().stream()
                .filter(v -> v.getUserId().equals(currentUser.getId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Vendor profile not found"));
        return ResponseEntity.ok(vendorService.getDashboardStats(vendor.getId()));
    }

    @GetMapping
    @Operation(summary = "Get all verified vendors")
    public ResponseEntity<List<VendorResponse>> getAllVendors(
            @RequestParam(required = false) Region region) {
        if (region != null) {
            return ResponseEntity.ok(vendorService.getVendorsByRegion(region));
        }
        return ResponseEntity.ok(vendorService.getAllVendors());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get vendor by ID")
    public ResponseEntity<VendorResponse> getVendorById(@PathVariable Long id) {
        return ResponseEntity.ok(vendorService.getVendorById(id));
    }
}
