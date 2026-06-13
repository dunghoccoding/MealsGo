package com.dacsan.service;

import com.dacsan.dto.response.VendorResponse;
import com.dacsan.dto.response.VendorStatsResponse;
import com.dacsan.entity.OrderStatus;
import com.dacsan.entity.Region;
import com.dacsan.entity.SubOrder;
import com.dacsan.entity.SubOrderStatus;
import com.dacsan.entity.Vendor;
import com.dacsan.repository.SubOrderRepository;
import com.dacsan.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VendorService {

        private final VendorRepository vendorRepository;
        private final SubOrderRepository subOrderRepository;

        public VendorStatsResponse getDashboardStats(Long vendorId) {
                Vendor vendor = vendorRepository.findById(vendorId)
                                .orElseThrow(() -> new RuntimeException("Vendor not found"));
                List<SubOrder> subOrders = subOrderRepository.findByVendorIdOrderByCreatedAtDesc(vendorId);

                BigDecimal totalRevenue = subOrders.stream()
                                .filter(s -> s.getStatus() == SubOrderStatus.DELIVERED ||
                                                s.getOrder().getStatus() == OrderStatus.COMPLETED)
                                .map(SubOrder::getSubtotal)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                long totalOrders = subOrders.size();
                long pending = subOrders.stream()
                                .filter(s -> s.getStatus() == SubOrderStatus.PENDING &&
                                                s.getOrder().getStatus() != OrderStatus.COMPLETED &&
                                                s.getOrder().getStatus() != OrderStatus.CANCELLED)
                                .count();
                long completed = subOrders.stream()
                                .filter(s -> s.getStatus() == SubOrderStatus.DELIVERED ||
                                                s.getOrder().getStatus() == OrderStatus.COMPLETED)
                                .count();
                long cancelled = subOrders.stream()
                                .filter(s -> s.getStatus() == SubOrderStatus.CANCELLED ||
                                                s.getOrder().getStatus() == OrderStatus.CANCELLED)
                                .count();
                long processing = totalOrders - pending - completed - cancelled;

                // Daily revenue for last 7 days
                Map<LocalDate, VendorStatsResponse.DailyRevenue> dailyMap = new TreeMap<>();
                for (int i = 0; i < 7; i++) {
                        LocalDate date = LocalDate.now().minusDays(i);
                        dailyMap.put(date, new VendorStatsResponse.DailyRevenue(date, BigDecimal.ZERO, 0L));
                }

                subOrders.stream()
                                .filter(s -> s.getStatus() == SubOrderStatus.DELIVERED)
                                .forEach(s -> {
                                        LocalDate date = s.getCreatedAt().toLocalDate();
                                        if (dailyMap.containsKey(date)) {
                                                VendorStatsResponse.DailyRevenue dr = dailyMap.get(date);
                                                dr.setRevenue(dr.getRevenue().add(s.getSubtotal()));
                                                dr.setOrderCount(dr.getOrderCount() + 1);
                                        }
                                });

                return VendorStatsResponse.builder()
                                .totalRevenue(totalRevenue)
                                .totalOrders(totalOrders)
                                .pendingOrders(pending)
                                .processingOrders(processing)
                                .completedOrders(completed)
                                .cancelledOrders(cancelled)
                                .revenueChart(new ArrayList<>(dailyMap.values()))
                                .walletBalance(vendor.getBalance())
                                .build();
        }

        public List<VendorResponse> getAllVendors() {
                return vendorRepository.findAll().stream()
                                .filter(Vendor::getVerified)
                                .filter(Vendor::getActive)
                                .map(this::mapToVendorResponse)
                                .collect(Collectors.toList());
        }

        public List<VendorResponse> getVendorsByRegion(Region region) {
                return vendorRepository.findAll().stream()
                                .filter(v -> v.getRegion().equals(region))
                                .filter(Vendor::getVerified)
                                .filter(Vendor::getActive)
                                .map(this::mapToVendorResponse)
                                .collect(Collectors.toList());
        }

        public VendorResponse getVendorById(Long id) {
                Vendor vendor = vendorRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Vendor not found"));

                return mapToVendorResponse(vendor);
        }

        public VendorResponse getVendorByUserId(Long userId) {
                Vendor vendor = vendorRepository.findByUserId(userId)
                                .orElseThrow(() -> new RuntimeException("Vendor profile not found for user"));
                return mapToVendorResponse(vendor);
        }

        public VendorResponse topupWallet(Long vendorId, BigDecimal amount) {
                Vendor vendor = vendorRepository.findById(vendorId)
                                .orElseThrow(() -> new RuntimeException("Vendor not found"));

                if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                        throw new RuntimeException("Amount must be greater than zero");
                }

                // Calculate bonus
                BigDecimal bonus = BigDecimal.ZERO;
                if (amount.compareTo(new BigDecimal("5000000")) >= 0) {
                    bonus = new BigDecimal("1500000");
                } else if (amount.compareTo(new BigDecimal("2000000")) >= 0) {
                    bonus = new BigDecimal("500000");
                } else if (amount.compareTo(new BigDecimal("1000000")) >= 0) {
                    bonus = new BigDecimal("200000");
                }

                BigDecimal totalToAdd = amount.add(bonus);
                BigDecimal currentBalance = vendor.getBalance() != null ? vendor.getBalance() : BigDecimal.ZERO;
                vendor.setBalance(currentBalance.add(totalToAdd));
                vendor = vendorRepository.save(vendor);

                return mapToVendorResponse(vendor);
        }

        private VendorResponse mapToVendorResponse(Vendor vendor) {
                return VendorResponse.builder()
                                .id(vendor.getId())
                                .userId(vendor.getUser().getId())
                                .storeName(vendor.getStoreName())
                                .description(vendor.getDescription())
                                .region(vendor.getRegion())
                                .address(vendor.getAddress())
                                .phone(vendor.getPhone())
                                .logo(vendor.getLogo())
                                .banner(vendor.getBanner())
                                .rating(vendor.getRating())
                                .totalReviews(vendor.getTotalReviews())
                                .active(vendor.getActive())
                                .verified(vendor.getVerified())
                                .createdAt(vendor.getCreatedAt())
                                .balance(vendor.getBalance())
                                .build();
        }
}
