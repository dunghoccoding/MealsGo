package com.dacsan.repository;

import com.dacsan.entity.SubOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubOrderRepository extends JpaRepository<SubOrder, Long> {
    List<SubOrder> findByOrderIdOrderByCreatedAtDesc(Long orderId);

    List<SubOrder> findByVendorIdOrderByCreatedAtDesc(Long vendorId);

    Optional<SubOrder> findBySubOrderNumber(String subOrderNumber);
}
