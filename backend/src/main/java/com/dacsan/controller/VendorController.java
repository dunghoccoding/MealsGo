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

import java.util.Map;
import java.math.BigDecimal;
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
        VendorResponse vendor = vendorService.getVendorByUserId(currentUser.getId());
        return ResponseEntity.ok(vendorService.getDashboardStats(vendor.getId()));
    }

    @PostMapping("/wallet/topup")
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(summary = "Top up current vendor's wallet (Mock)")
    public ResponseEntity<VendorResponse> topupWallet(@RequestBody Map<String, Object> payload) {
        User currentUser = SecurityUtils.getCurrentUser();
        VendorResponse vendor = vendorService.getVendorByUserId(currentUser.getId());
        
        Object amountObj = payload.get("amount");
        if (amountObj == null) {
            throw new RuntimeException("Amount is required");
        }
        
        BigDecimal amount = new BigDecimal(amountObj.toString());
        return ResponseEntity.ok(vendorService.topupWallet(vendor.getId(), amount));
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
