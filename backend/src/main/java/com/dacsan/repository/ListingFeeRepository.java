package com.dacsan.repository;

import com.dacsan.entity.ListingFee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ListingFeeRepository extends JpaRepository<ListingFee, Long> {
    long countByVendorId(Long vendorId);

    List<ListingFee> findByVendorId(Long vendorId);
}
