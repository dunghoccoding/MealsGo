package com.dacsan.service;

import com.dacsan.dto.request.CreateVoucherRequest;
import com.dacsan.dto.response.VoucherResponse;
import com.dacsan.entity.DiscountType;
import com.dacsan.entity.Vendor;
import com.dacsan.entity.Voucher;
import com.dacsan.repository.VendorRepository;
import com.dacsan.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VoucherService {

    private final VoucherRepository voucherRepository;
    private final VendorRepository vendorRepository;

    @Transactional
    public VoucherResponse createVoucher(CreateVoucherRequest request, Long vendorId) {
        // Check if code already exists
        if (voucherRepository.findByCode(request.getCode()).isPresent()) {
            throw new RuntimeException("Voucher code already exists: " + request.getCode());
        }

        Vendor vendor = null;
        if (vendorId != null) {
            vendor = vendorRepository.findById(vendorId)
                    .orElseThrow(() -> new RuntimeException("Vendor not found"));
        }

        Voucher voucher = Voucher.builder()
                .code(request.getCode().toUpperCase())
                .description(request.getDescription())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minOrderValue(request.getMinOrderValue())
                .maxDiscount(request.getMaxDiscount())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .usageLimit(request.getUsageLimit())
                .usedCount(0)
                .vendor(vendor)
                .active(true)
                .build();

        voucher = voucherRepository.save(voucher);
        log.info("Voucher created: {} (vendor: {})", voucher.getCode(), vendorId);

        return mapToResponse(voucher);
    }

    public List<VoucherResponse> getVouchersByVendor(Long vendorId) {
        return voucherRepository.findByVendorId(vendorId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<VoucherResponse> getSystemVouchers() {
        return voucherRepository.findByVendorIsNull().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<VoucherResponse> getAllActiveVouchers() {
        LocalDateTime now = LocalDateTime.now();
        return voucherRepository.findByActiveTrue().stream()
                .filter(v -> v.getStartDate().isBefore(now) && v.getEndDate().isAfter(now))
                .filter(v -> v.getUsageLimit() == null || v.getUsedCount() < v.getUsageLimit())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public VoucherResponse validateVoucher(String code, BigDecimal orderTotal, Long vendorId) {
        Voucher voucher = voucherRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Voucher not found: " + code));

        // Check if active
        if (!voucher.getActive()) {
            throw new RuntimeException("Voucher is not active");
        }

        // Check date range
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(voucher.getStartDate()) || now.isAfter(voucher.getEndDate())) {
            throw new RuntimeException("Voucher is expired or not yet valid");
        }

        // Check usage limit
        if (voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit()) {
            throw new RuntimeException("Voucher usage limit reached");
        }

        // Check vendor scope
        if (voucher.getVendor() != null && vendorId != null
                && !voucher.getVendor().getId().equals(vendorId)) {
            throw new RuntimeException("Voucher is not valid for this vendor");
        }

        // Check minimum order value
        if (voucher.getMinOrderValue() != null && orderTotal.compareTo(voucher.getMinOrderValue()) < 0) {
            throw new RuntimeException("Order total does not meet minimum value of " + voucher.getMinOrderValue());
        }

        // Calculate discount
        BigDecimal discount;
        if (voucher.getDiscountType() == DiscountType.PERCENTAGE) {
            discount = orderTotal.multiply(voucher.getDiscountValue()).divide(BigDecimal.valueOf(100));
            if (voucher.getMaxDiscount() != null && discount.compareTo(voucher.getMaxDiscount()) > 0) {
                discount = voucher.getMaxDiscount();
            }
        } else {
            discount = voucher.getDiscountValue();
        }

        // Don't let discount exceed order total
        if (discount.compareTo(orderTotal) > 0) {
            discount = orderTotal;
        }

        VoucherResponse response = mapToResponse(voucher);
        response.setDiscountValue(discount); // Override with calculated discount
        return response;
    }

    @Transactional
    public void applyVoucher(String code) {
        Voucher voucher = voucherRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Voucher not found: " + code));

        voucher.setUsedCount(voucher.getUsedCount() + 1);
        voucherRepository.save(voucher);
        log.info("Voucher applied: {} (used count: {})", code, voucher.getUsedCount());
    }

    @Transactional
    public VoucherResponse updateVoucher(Long id, CreateVoucherRequest request) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));

        if (request.getCode() != null) {
            voucher.setCode(request.getCode().toUpperCase());
        }
        if (request.getDescription() != null) {
            voucher.setDescription(request.getDescription());
        }
        if (request.getDiscountType() != null) {
            voucher.setDiscountType(request.getDiscountType());
        }
        if (request.getDiscountValue() != null) {
            voucher.setDiscountValue(request.getDiscountValue());
        }
        voucher.setMinOrderValue(request.getMinOrderValue());
        voucher.setMaxDiscount(request.getMaxDiscount());
        if (request.getStartDate() != null) {
            voucher.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            voucher.setEndDate(request.getEndDate());
        }
        voucher.setUsageLimit(request.getUsageLimit());

        voucher = voucherRepository.save(voucher);
        log.info("Voucher updated: {}", voucher.getCode());

        return mapToResponse(voucher);
    }

    @Transactional
    public void deleteVoucher(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));
        voucherRepository.delete(voucher);
        log.info("Voucher deleted: {}", voucher.getCode());
    }

    private VoucherResponse mapToResponse(Voucher voucher) {
        return VoucherResponse.builder()
                .id(voucher.getId())
                .code(voucher.getCode())
                .description(voucher.getDescription())
                .discountType(voucher.getDiscountType())
                .discountValue(voucher.getDiscountValue())
                .minOrderValue(voucher.getMinOrderValue())
                .maxDiscount(voucher.getMaxDiscount())
                .startDate(voucher.getStartDate())
                .endDate(voucher.getEndDate())
                .usageLimit(voucher.getUsageLimit())
                .usedCount(voucher.getUsedCount())
                .vendorId(voucher.getVendor() != null ? voucher.getVendor().getId() : null)
                .vendorName(voucher.getVendor() != null ? voucher.getVendor().getStoreName() : null)
                .active(voucher.getActive())
                .createdAt(voucher.getCreatedAt())
                .updatedAt(voucher.getUpdatedAt())
                .build();
    }
}
