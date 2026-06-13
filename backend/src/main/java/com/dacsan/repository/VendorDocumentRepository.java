package com.dacsan.repository;

import com.dacsan.entity.DocumentStatus;
import com.dacsan.entity.VendorDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VendorDocumentRepository extends JpaRepository<VendorDocument, Long> {
    List<VendorDocument> findByVendorId(Long vendorId);

    List<VendorDocument> findByStatus(DocumentStatus status);
}
