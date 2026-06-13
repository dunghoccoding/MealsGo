package com.dacsan.service;

import com.dacsan.dto.response.ProductResponse;
import com.dacsan.entity.Product;
import com.dacsan.entity.ProductCategory;
import com.dacsan.entity.Region;
import com.dacsan.entity.User;
import com.dacsan.repository.OrderItemRepository;
import com.dacsan.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductService productService;

    // Stop-words tiếng Việt không dùng làm keyword tìm kiếm
    private static final Set<String> STOP_WORDS = Set.of(
            "của", "và", "với", "theo", "các", "từ", "cho", "đặc", "biệt",
            "món", "ăn", "đồ", "thức", "bữa", "đĩa", "tô", "bát", "dĩa"
    );

    /**
     * Gợi ý sản phẩm liên quan đến sản phẩm đang xem (tối đa 4 món).
     * Thuật toán:
     *   1. Tìm theo TÊN tương tự (ví dụ: "Phở" → match "Phở Hà Nội", "Phở Nam Định")
     *   2. Bổ sung theo category/region nếu chưa đủ 4
     */
    @Transactional(readOnly = true)
    public List<ProductResponse> getRelatedProducts(Long productId, int limit) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found: " + productId));

        Set<Long> seenIds = new HashSet<>();
        seenIds.add(productId);
        List<Product> results = new ArrayList<>();

        // === Bước 1: Tìm theo TÊN tương tự ===
        List<String> keywords = extractKeywords(product.getName());
        log.info("[Related] Product='{}' -> keywords={}", product.getName(), keywords);

        for (String keyword : keywords) {
            if (results.size() >= limit) break;
            List<Product> nameMatches = productRepository.findByNameContaining(
                    productId, keyword, PageRequest.of(0, limit));
            for (Product p : nameMatches) {
                if (results.size() >= limit) break;
                if (seenIds.add(p.getId())) {
                    results.add(p);
                }
            }
        }

        log.info("[Related] Name-match found {} products", results.size());

        // === Bước 2: Bổ sung theo category/region/vendor nếu chưa đủ ===
        if (results.size() < limit) {
            List<Product> catMatches = productRepository.findRelatedProducts(
                    productId,
                    product.getCategory(),
                    product.getRegion(),
                    product.getVendor().getId(),
                    PageRequest.of(0, limit * 2));

            for (Product p : catMatches) {
                if (results.size() >= limit) break;
                if (seenIds.add(p.getId())) {
                    results.add(p);
                }
            }
        }

        log.info("[Related] Total result: {} products", results.size());
        return results.stream()
                .map(productService::buildProductResponse)
                .collect(Collectors.toList());
    }

    /**
     * Gợi ý cá nhân hóa dựa trên lịch sử đặt hàng (tối đa 4 món).
     * Thuật toán:
     *   1. Ưu tiên các món đã đặt NHIỀU LẦN (gợi ý lại để người dùng tái đặt)
     *   2. Bổ sung món mới cùng category/region đã mua nếu chưa đủ 4
     *   3. Fallback: best-sellers nếu chưa có lịch sử
     */
    @Transactional(readOnly = true)
    public List<ProductResponse> getPersonalizedRecommendations(int limit) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            log.info("[Personalized] No auth user -> fallback best-sellers");
            return getBestSellersFallback(limit);
        }

        // Lấy sản phẩm đã đặt, sắp xếp theo tổng số lượng giảm dần
        List<Object[]> frequentlyOrdered = orderItemRepository.findFrequentlyOrderedProductIds(userId);
        log.info("[Personalized] User {} -> {} distinct ordered products", userId, frequentlyOrdered.size());

        if (frequentlyOrdered.isEmpty()) {
            return getBestSellersFallback(limit);
        }

        Set<Long> seenIds = new HashSet<>();
        List<Product> results = new ArrayList<>();

        // === Bước 1: Gợi ý lại các món đã đặt nhiều lần ===
        // MySQL GROUP BY trả về BigInteger cho product.id nên dùng Number.longValue()
        for (Object[] row : frequentlyOrdered) {
            if (results.size() >= limit) break;
            Long productId = ((Number) row[0]).longValue();
            long totalQty = ((Number) row[1]).longValue();
            productRepository.findById(productId).ifPresent(p -> {
                if (Boolean.TRUE.equals(p.getAvailable()) && seenIds.add(p.getId())) {
                    results.add(p);
                    log.info("[Personalized] Added frequent product: '{}' (ordered {} times)", p.getName(), totalQty);
                }
            });
        }

        log.info("[Personalized] After step 1 (favorites): {} products", results.size());

        // === Bước 2: Bổ sung món mới cùng sở thích nếu chưa đủ limit ===
        if (results.size() < limit) {
            // Lấy danh sách product IDs đã mua (để loại khỏi "món mới")
            List<Long> purchasedIds = frequentlyOrdered.stream()
                    .map(row -> ((Number) row[0]).longValue())
                    .collect(Collectors.toList());

            // Lấy category và region từ các sản phẩm đã mua
            List<Product> purchasedProducts = productRepository.findAllById(purchasedIds);
            List<ProductCategory> preferredCategories = purchasedProducts.stream()
                    .map(Product::getCategory)
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());
            List<Region> preferredRegions = purchasedProducts.stream()
                    .map(Product::getRegion)
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());

            // Guard: chỉ query nếu có category/region, và purchasedIds không rỗng
            if (!preferredCategories.isEmpty() || !preferredRegions.isEmpty()) {
                if (preferredCategories.isEmpty()) {
                    // Không thể dùng IN rỗng -> chỉ tìm theo region
                    List<Product> byRegion = productRepository.findByAvailableTrue(PageRequest.of(0, limit * 3))
                            .getContent().stream()
                            .filter(p -> preferredRegions.contains(p.getRegion()))
                            .filter(p -> !purchasedIds.contains(p.getId()))
                            .collect(Collectors.toList());
                    addToResults(byRegion, seenIds, results, limit);
                } else if (preferredRegions.isEmpty()) {
                    List<Product> byCat = productRepository.findByAvailableTrue(PageRequest.of(0, limit * 3))
                            .getContent().stream()
                            .filter(p -> preferredCategories.contains(p.getCategory()))
                            .filter(p -> !purchasedIds.contains(p.getId()))
                            .collect(Collectors.toList());
                    addToResults(byCat, seenIds, results, limit);
                } else {
                    List<Product> newRecs = productRepository.findRecommendedByPreferences(
                            purchasedIds, preferredCategories, preferredRegions,
                            PageRequest.of(0, limit * 2));
                    addToResults(newRecs, seenIds, results, limit);
                }
            }
        }

        log.info("[Personalized] After step 2 (preference): {} products", results.size());

        // === Bước 3: Fallback best-sellers nếu vẫn thiếu ===
        if (results.size() < limit) {
            List<Product> bestSellers = productRepository.findTop10ByAvailableTrueOrderBySoldCountDesc();
            addToResults(bestSellers, seenIds, results, limit);
        }

        log.info("[Personalized] Final result: {} products for user {}", results.size(), userId);
        return results.stream()
                .map(productService::buildProductResponse)
                .collect(Collectors.toList());
    }

    /**
     * Trích xuất keyword có ý nghĩa từ tên sản phẩm.
     * Ví dụ: "Phở Bò Hà Nội"  → ["Phở Bò", "Phở"]
     *         "Bún Chả Hà Nội" → ["Bún Chả", "Bún"]
     *         "Mì Quảng"       → ["Mì Quảng", "Mì"]
     */
    private List<String> extractKeywords(String productName) {
        if (productName == null || productName.isBlank()) return Collections.emptyList();

        String[] words = productName.trim().split("\\s+");
        List<String> keywords = new ArrayList<>();

        // Keyword 1: Hai từ đầu (tên món chính: "Phở Bò", "Bún Chả")
        if (words.length >= 2 && !isStopWord(words[0]) && !isStopWord(words[1])) {
            keywords.add(words[0] + " " + words[1]);
        }

        // Keyword 2: Từ đầu tiên (loại món: "Phở", "Bún", "Mì", "Cơm")
        if (words.length >= 1 && !isStopWord(words[0]) && words[0].length() >= 2) {
            if (!keywords.contains(words[0])) {
                keywords.add(words[0]);
            }
        }

        return keywords;
    }

    private boolean isStopWord(String word) {
        return STOP_WORDS.contains(word.toLowerCase());
    }

    private void addToResults(List<Product> candidates, Set<Long> seenIds, List<Product> results, int limit) {
        for (Product p : candidates) {
            if (results.size() >= limit) break;
            if (seenIds.add(p.getId())) {
                results.add(p);
            }
        }
    }

    private List<ProductResponse> getBestSellersFallback(int limit) {
        List<Product> bestSellers = productRepository.findTop10ByAvailableTrueOrderBySoldCountDesc();
        return bestSellers.stream()
                .limit(limit)
                .map(productService::buildProductResponse)
                .collect(Collectors.toList());
    }

    private Long getCurrentUserId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof User user) {
                return user.getId();
            }
        } catch (Exception e) {
            log.debug("No authenticated user for recommendations");
        }
        return null;
    }
}
