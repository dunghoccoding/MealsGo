package com.dacsan.repository;

import com.dacsan.entity.VariantGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VariantGroupRepository extends JpaRepository<VariantGroup, Long> {
    List<VariantGroup> findByProductIdOrderByDisplayOrderAsc(Long productId);
}
