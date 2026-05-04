package com.dacsan.repository;

import com.dacsan.entity.Product;
import com.dacsan.entity.ProductCategory;
import com.dacsan.entity.Region;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByAvailableTrue(Pageable pageable);

    Page<Product> findByRegion(Region region, Pageable pageable);

    Page<Product> findByCategory(ProductCategory category, Pageable pageable);

    Page<Product> findByVendorId(Long vendorId, Pageable pageable);

    Page<Product> findByRegionAndCategory(Region region, ProductCategory category, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE " +
            "(:region IS NULL OR p.region = :region) AND " +
            "(:category IS NULL OR p.category = :category) AND " +
            "(:vendorId IS NULL OR p.vendor.id = :vendorId) AND " +
            "(:available IS NULL OR p.available = :available) AND " +
            "(:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Product> findByFilters(
            @Param("region") Region region,
            @Param("category") ProductCategory category,
            @Param("vendorId") Long vendorId,
            @Param("available") Boolean available,
            @Param("search") String search,
            Pageable pageable);

    List<Product> findByFeaturedTrueAndAvailableTrue();

    List<Product> findTop10ByAvailableTrueOrderBySoldCountDesc();

    // --- Recommendation queries ---

    @Query("SELECT p FROM Product p WHERE p.available = true AND p.id <> :productId " +
            "AND (p.category = :category OR p.region = :region OR p.vendor.id = :vendorId) " +
            "ORDER BY CASE " +
            "  WHEN p.category = :category AND p.region = :region THEN 0 " +
            "  WHEN p.category = :category THEN 1 " +
            "  WHEN p.region = :region THEN 2 " +
            "  ELSE 3 END, p.soldCount DESC")
    List<Product> findRelatedProducts(
            @Param("productId") Long productId,
            @Param("category") ProductCategory category,
            @Param("region") Region region,
            @Param("vendorId") Long vendorId,
            Pageable pageable);

    /**
     * Tìm sản phẩm có tên chứa keyword (ví dụ: "Phở" sẽ match "Phở Hà Nội", "Phở Nam Định"...)
     * Dùng cho gợi ý theo tên tương tự.
     */
    @Query("SELECT p FROM Product p WHERE p.available = true AND p.id <> :excludeId " +
            "AND LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "ORDER BY p.soldCount DESC, p.rating DESC")
    List<Product> findByNameContaining(
            @Param("excludeId") Long excludeId,
            @Param("keyword") String keyword,
            Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.available = true " +
            "AND p.id NOT IN :purchasedProductIds " +
            "AND (p.category IN :categories OR p.region IN :regions) " +
            "ORDER BY p.soldCount DESC, p.rating DESC")
    List<Product> findRecommendedByPreferences(
            @Param("purchasedProductIds") List<Long> purchasedProductIds,
            @Param("categories") List<ProductCategory> categories,
            @Param("regions") List<Region> regions,
            Pageable pageable);
}
