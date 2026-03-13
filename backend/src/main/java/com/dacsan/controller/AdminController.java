package com.dacsan.controller;

import com.dacsan.dto.request.UpdateProductRequest;
import com.dacsan.dto.response.ProductResponse;
import com.dacsan.entity.ProductCategory;
import com.dacsan.entity.Region;
import com.dacsan.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin", description = "Admin management endpoints")
public class AdminController {

    private final ProductService productService;

    @GetMapping("/products")
    @Operation(summary = "Get all products (Admin)")
    public ResponseEntity<Page<ProductResponse>> getAllProducts(
            @RequestParam(required = false) Region region,
            @RequestParam(required = false) ProductCategory category,
            @RequestParam(required = false) Long vendorId,
            @RequestParam(required = false) Boolean available,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        Sort.Direction direction = Sort.Direction.fromString(sortDirection);
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        return ResponseEntity.ok(productService.getAllProducts(
                region, category, vendorId, available, search, pageable));
    }

    @PatchMapping("/products/{id}")
    @Operation(summary = "Update any product (Admin)")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProductRequest request) {
        return ResponseEntity.ok(productService.adminUpdateProduct(id, request));
    }

    @DeleteMapping("/products/{id}")
    @Operation(summary = "Delete any product (Admin)")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.adminDeleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}
