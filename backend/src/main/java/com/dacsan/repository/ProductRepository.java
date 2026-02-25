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
}
