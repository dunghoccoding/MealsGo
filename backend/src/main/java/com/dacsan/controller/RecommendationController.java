package com.dacsan.controller;

import com.dacsan.dto.response.ProductResponse;
import com.dacsan.service.RecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
@Tag(name = "Recommendations", description = "Product recommendation endpoints")
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/related/{productId}")
    @Operation(summary = "Get related products",
            description = "Returns products related to the given product based on category, region, and vendor")
    public ResponseEntity<List<ProductResponse>> getRelatedProducts(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "4") int limit) {
        return ResponseEntity.ok(recommendationService.getRelatedProducts(productId, limit));
    }

    @GetMapping("/personalized")
    @Operation(summary = "Get personalized recommendations",
            description = "Returns personalized product recommendations based on user's order history. Falls back to best-sellers if not authenticated or no order history.")
    public ResponseEntity<List<ProductResponse>> getPersonalizedRecommendations(
            @RequestParam(defaultValue = "4") int limit) {
        return ResponseEntity.ok(recommendationService.getPersonalizedRecommendations(limit));
    }
}
