package com.dacsan.repository;

import com.dacsan.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    Optional<Voucher> findByCode(String code);

    List<Voucher> findByVendorId(Long vendorId);

    List<Voucher> findByVendorIsNull();

    List<Voucher> findByActiveTrue();
}
