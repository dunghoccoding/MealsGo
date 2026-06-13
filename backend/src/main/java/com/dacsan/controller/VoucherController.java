package com.dacsan.controller;

import com.dacsan.dto.request.CreateVoucherRequest;
import com.dacsan.dto.request.ValidateVoucherRequest;
import com.dacsan.dto.response.VoucherResponse;
import com.dacsan.entity.User;
import com.dacsan.entity.UserRole;
import com.dacsan.entity.Vendor;
import com.dacsan.repository.VendorRepository;
import com.dacsan.service.VoucherService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vouchers")
@RequiredArgsConstructor
@Tag(name = "Vouchers", description = "Voucher management endpoints")
public class VoucherController {

    private final VoucherService voucherService;
    private final VendorRepository vendorRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('VENDOR', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create a voucher (Vendor for own store, Admin for system-wide)")
    public ResponseEntity<VoucherResponse> createVoucher(@Valid @RequestBody CreateVoucherRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) auth.getPrincipal();

        Long vendorId = null;
        if (user.getRole() == UserRole.VENDOR) {
            Vendor vendor = vendorRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Vendor not found"));
            vendorId = vendor.getId();
        }
        // ADMIN creates system-wide vouchers (vendorId remains null)

        return ResponseEntity.ok(voucherService.createVoucher(request, vendorId));
    }

    @GetMapping
    @Operation(summary = "Get all active vouchers (public)")
    public ResponseEntity<List<VoucherResponse>> getAllActiveVouchers() {
        return ResponseEntity.ok(voucherService.getAllActiveVouchers());
    }

    @GetMapping("/vendor/{vendorId}")
    @Operation(summary = "Get vouchers for a specific vendor (public)")
    public ResponseEntity<List<VoucherResponse>> getVouchersByVendor(@PathVariable Long vendorId) {
        return ResponseEntity.ok(voucherService.getVouchersByVendor(vendorId));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('VENDOR')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get own vouchers (Vendor only)")
    public ResponseEntity<List<VoucherResponse>> getMyVouchers() {
        Long vendorId = getCurrentVendorId();
        return ResponseEntity.ok(voucherService.getVouchersByVendor(vendorId));
    }

    @GetMapping("/system")
    @Operation(summary = "Get system-wide vouchers (public)")
    public ResponseEntity<List<VoucherResponse>> getSystemVouchers() {
        return ResponseEntity.ok(voucherService.getSystemVouchers());
    }

    @PostMapping("/validate")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Validate a voucher code (authenticated)")
    public ResponseEntity<VoucherResponse> validateVoucher(@Valid @RequestBody ValidateVoucherRequest request) {
        return ResponseEntity.ok(
                voucherService.validateVoucher(request.getCode(), request.getOrderTotal(), request.getVendorId()));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('VENDOR', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update a voucher (owner or Admin)")
    public ResponseEntity<VoucherResponse> updateVoucher(
            @PathVariable Long id,
            @Valid @RequestBody CreateVoucherRequest request) {
        return ResponseEntity.ok(voucherService.updateVoucher(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('VENDOR', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete a voucher (owner or Admin)")
    public ResponseEntity<Void> deleteVoucher(@PathVariable Long id) {
        voucherService.deleteVoucher(id);
        return ResponseEntity.noContent().build();
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
