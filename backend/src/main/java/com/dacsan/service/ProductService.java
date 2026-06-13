package com.dacsan.service;

import com.dacsan.dto.request.CreateProductRequest;
import com.dacsan.dto.request.UpdateProductRequest;
import com.dacsan.dto.response.ProductResponse;
import com.dacsan.dto.response.VariantGroupResponse;
import com.dacsan.dto.response.VariantResponse;
import com.dacsan.entity.*;
import com.dacsan.repository.ListingFeeRepository;
import com.dacsan.repository.ProductRepository;
import com.dacsan.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final VendorRepository vendorRepository;
    private final ListingFeeRepository listingFeeRepository;

    private static final BigDecimal PRODUCT_FEE = new BigDecimal("200000");
    private static final BigDecimal MIN_MAINTENANCE_BALANCE = new BigDecimal("500000");

    public Page<ProductResponse> getAllProducts(
            Region region,
            ProductCategory category,
            Long vendorId,
            Boolean available,
            String search,
            Pageable pageable) {
        Page<Product> products = productRepository.findByFilters(
                region, category, vendorId, available, search, pageable);

        return products.map(this::buildProductResponse);
    }

    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        return mapToProductResponseWithVariants(product);
    }

    public List<ProductResponse> getFeaturedProducts() {
        List<Product> products = productRepository.findByFeaturedTrueAndAvailableTrue();
        return products.stream()
                .map(this::buildProductResponse)
                .collect(Collectors.toList());
    }

    public List<ProductResponse> getBestSellers() {
        List<Product> products = productRepository.findTop10ByAvailableTrueOrderBySoldCountDesc();
        return products.stream()
                .map(this::buildProductResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductResponse createProduct(CreateProductRequest request) {
        // Get current user
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        // Get vendor for this user
        Vendor vendor = vendorRepository.findByUserId(getCurrentUserId())
                .orElseThrow(() -> new RuntimeException("Vendor not found"));

        if (!vendor.getVerified()) {
            throw new RuntimeException("Vendor is not verified yet");
        }

        Product product = Product.builder()
                .vendor(vendor)
                .name(request.getName())
                .description(request.getDescription())
                .basePrice(request.getBasePrice())
                .region(request.getRegion())
                .category(request.getCategory())
                .images(request.getImages())
                .available(request.getAvailable())
                .featured(request.getFeatured())
                .build();

        product = productRepository.save(product);

        // Calculate and save listing fee
        long totalProductsListed = listingFeeRepository.countByVendorId(vendor.getId());
        BigDecimal feeAmount = (totalProductsListed == 0) ? BigDecimal.ZERO : PRODUCT_FEE;

        // Check wallet balance
        BigDecimal currentBalance = vendor.getBalance() != null ? vendor.getBalance() : BigDecimal.ZERO;
        BigDecimal remainingBalance = currentBalance.subtract(feeAmount);
        if (remainingBalance.compareTo(MIN_MAINTENANCE_BALANCE) < 0) {
            throw new RuntimeException("Số dư ví điện tử không đủ. Yêu cầu duy trì tối thiểu 500.000đ sau khi trừ phí đăng. Vui lòng nạp thêm tiền!");
        }

        // Deduct balance
        vendor.setBalance(remainingBalance);
        vendorRepository.save(vendor);

        ListingFee listingFee = ListingFee.builder()
                .vendor(vendor)
                .product(product)
                .amount(feeAmount)
                .paidAt(LocalDateTime.now())
                .build();
        listingFeeRepository.save(listingFee);

        ProductResponse response = buildProductResponse(product);
        response.setListingFee(feeAmount);
        return response;
    }

    @Transactional
    public ProductResponse updateProduct(Long id, UpdateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Verify vendor owns this product
        Long currentVendorId = vendorRepository.findByUserId(getCurrentUserId())
                .map(Vendor::getId)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));

        if (!product.getVendor().getId().equals(currentVendorId)) {
            throw new RuntimeException("You don't have permission to update this product");
        }

        // Update fields if present
        if (request.getName() != null)
            product.setName(request.getName());
        if (request.getDescription() != null)
            product.setDescription(request.getDescription());
        if (request.getBasePrice() != null)
            product.setBasePrice(request.getBasePrice());
        if (request.getRegion() != null)
            product.setRegion(request.getRegion());
        if (request.getCategory() != null)
            product.setCategory(request.getCategory());
        if (request.getImages() != null)
            product.setImages(request.getImages());
        if (request.getAvailable() != null)
            product.setAvailable(request.getAvailable());
        if (request.getFeatured() != null)
            product.setFeatured(request.getFeatured());

        product = productRepository.save(product);

        return buildProductResponse(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Verify vendor owns this product
        Long currentVendorId = vendorRepository.findByUserId(getCurrentUserId())
                .map(Vendor::getId)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));

        if (!product.getVendor().getId().equals(currentVendorId)) {
            throw new RuntimeException("You don't have permission to delete this product");
        }

        productRepository.delete(product);
    }

    @Transactional
    public ProductResponse adminUpdateProduct(Long id, UpdateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (request.getName() != null)
            product.setName(request.getName());
        if (request.getDescription() != null)
            product.setDescription(request.getDescription());
        if (request.getBasePrice() != null)
            product.setBasePrice(request.getBasePrice());
        if (request.getRegion() != null)
            product.setRegion(request.getRegion());
        if (request.getCategory() != null)
            product.setCategory(request.getCategory());
        if (request.getImages() != null)
            product.setImages(request.getImages());
        if (request.getAvailable() != null)
            product.setAvailable(request.getAvailable());
        if (request.getFeatured() != null)
            product.setFeatured(request.getFeatured());

        product = productRepository.save(product);
        return buildProductResponse(product);
    }

    @Transactional
    public void adminDeleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        productRepository.delete(product);
    }

    public Map<String, Object> getListingFeeInfo() {
        Vendor vendor = vendorRepository.findByUserId(getCurrentUserId())
                .orElseThrow(() -> new RuntimeException("Vendor not found"));

        long totalProductsListed = listingFeeRepository.countByVendorId(vendor.getId());
        BigDecimal nextFee = (totalProductsListed == 0) ? BigDecimal.ZERO : PRODUCT_FEE;

        Map<String, Object> result = new HashMap<>();
        result.put("nextFee", nextFee);
        result.put("totalProductsListed", totalProductsListed);
        return result;
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth.getPrincipal() instanceof User user) {
            return user.getId();
        }
        throw new RuntimeException("User not authenticated");
    }

    public ProductResponse buildProductResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .vendorId(product.getVendor().getId())
                .vendorName(product.getVendor().getStoreName())
                .name(product.getName())
                .description(product.getDescription())
                .basePrice(product.getBasePrice())
                .region(product.getRegion())
                .category(product.getCategory())
                .images(product.getImages())
                .available(product.getAvailable())
                .featured(product.getFeatured())
                .soldCount(product.getSoldCount())
                .rating(product.getRating())
                .reviewCount(product.getReviewCount())
                .build();
    }

    private ProductResponse mapToProductResponseWithVariants(Product product) {
        ProductResponse response = buildProductResponse(product);

        List<VariantGroupResponse> variantGroups = product.getVariantGroups().stream()
                .map(this::mapToVariantGroupResponse)
                .collect(Collectors.toList());

        response.setVariantGroups(variantGroups);

        return response;
    }

    private VariantGroupResponse mapToVariantGroupResponse(VariantGroup group) {
        List<VariantResponse> variants = group.getVariants().stream()
                .map(v -> VariantResponse.builder()
                        .id(v.getId())
                        .name(v.getName())
                        .priceAdjustment(v.getPriceAdjustment())
                        .available(v.getAvailable())
                        .displayOrder(v.getDisplayOrder())
                        .build())
                .collect(Collectors.toList());

        return VariantGroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .isMultiSelect(group.getIsMultiSelect())
                .isRequired(group.getIsRequired())
                .displayOrder(group.getDisplayOrder())
                .variants(variants)
                .build();
    }
}
