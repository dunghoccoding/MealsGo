package com.dacsan.service;

import com.dacsan.dto.request.AddToCartRequest;
import com.dacsan.dto.request.UpdateCartItemRequest;
import com.dacsan.dto.response.CartItemResponse;
import com.dacsan.dto.response.CartResponse;
import com.dacsan.dto.response.ProductResponse;
import com.dacsan.entity.*;
import com.dacsan.exception.NotFoundException;
import com.dacsan.repository.CartItemRepository;
import com.dacsan.repository.CartRepository;
import com.dacsan.repository.ProductRepository;
import com.dacsan.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;

    @Transactional(readOnly = true)
    public CartResponse getCart() {
        Cart cart = getOrCreateCart();
        return buildCartResponse(cart);
    }

    @Transactional
    public CartItemResponse addToCart(AddToCartRequest request) {
        // Get or create cart
        Cart cart = getOrCreateCart();

        // Validate product
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new NotFoundException("Product not found"));

        if (!product.getAvailable()) {
            throw new IllegalArgumentException("Product is not available");
        }

        // Calculate item price (base + variant adjustments)
        BigDecimal basePrice = product.getBasePrice();
        BigDecimal variantAdjustment = request.getSelectedVariants().stream()
                .map(CartItem.SelectedVariant::getPriceAdjustment)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal itemPrice = basePrice.add(variantAdjustment);

        // Create cart item
        CartItem cartItem = CartItem.builder()
                .cart(cart)
                .product(product)
                .quantity(request.getQuantity())
                .selectedVariants(request.getSelectedVariants())
                .build();

        cartItem = cartItemRepository.save(cartItem);

        log.info("Added {} x {} to cart (item price: {})",
                request.getQuantity(), product.getName(), itemPrice);

        return buildCartItemResponse(cartItem);
    }

    @Transactional
    public CartItemResponse updateCartItem(Long itemId, UpdateCartItemRequest request) {
        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Cart item not found"));

        // Verify ownership
        User currentUser = SecurityUtils.getCurrentUser();
        if (!cartItem.getCart().getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Cart item does not belong to current user");
        }

        cartItem.setQuantity(request.getQuantity());
        cartItem = cartItemRepository.save(cartItem);

        log.info("Updated cart item {} quantity to {}", itemId, request.getQuantity());

        return buildCartItemResponse(cartItem);
    }

    @Transactional
    public void removeCartItem(Long itemId) {
        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Cart item not found"));

        // Verify ownership
        User currentUser = SecurityUtils.getCurrentUser();
        if (!cartItem.getCart().getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Cart item does not belong to current user");
        }

        cartItemRepository.delete(cartItem);
        log.info("Removed cart item {}", itemId);
    }

    @Transactional
    public void clearCart() {
        Cart cart = getOrCreateCart();
        cartItemRepository.deleteByCartId(cart.getId());
        log.info("Cleared cart for user {}", SecurityUtils.getCurrentUser().getId());
    }

    // Helper methods

    private Cart getOrCreateCart() {
        User currentUser = SecurityUtils.getCurrentUser();
        return cartRepository.findByUserId(currentUser.getId())
                .orElseGet(() -> {
                    Cart newCart = Cart.builder()
                            .user(currentUser)
                            .build();
                    return cartRepository.save(newCart);
                });
    }

    private CartResponse buildCartResponse(Cart cart) {
        List<CartItemResponse> items = cart.getItems().stream()
                .map(this::buildCartItemResponse)
                .collect(Collectors.toList());

        // Group items by vendor
        Map<String, List<CartItemResponse>> itemsByVendor = items.stream()
                .collect(Collectors.groupingBy(
                        CartItemResponse::getVendorName,
                        LinkedHashMap::new,
                        Collectors.toList()));

        // Calculate total
        BigDecimal totalAmount = items.stream()
                .map(CartItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponse.builder()
                .id(cart.getId())
                .items(items)
                .itemsByVendor(itemsByVendor)
                .totalAmount(totalAmount)
                .totalItems(items.size())
                .build();
    }

    private CartItemResponse buildCartItemResponse(CartItem cartItem) {
        Product product = cartItem.getProduct();
        ProductResponse productResponse = productService.buildProductResponse(product);

        // Calculate item price
        BigDecimal basePrice = product.getBasePrice();
        BigDecimal variantAdjustment = cartItem.getSelectedVariants().stream()
                .map(CartItem.SelectedVariant::getPriceAdjustment)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal itemPrice = basePrice.add(variantAdjustment);
        BigDecimal subtotal = itemPrice.multiply(BigDecimal.valueOf(cartItem.getQuantity()));

        return CartItemResponse.builder()
                .id(cartItem.getId())
                .product(productResponse)
                .quantity(cartItem.getQuantity())
                .selectedVariants(cartItem.getSelectedVariants())
                .itemPrice(itemPrice)
                .subtotal(subtotal)
                .vendorName(product.getVendor().getStoreName())
                .vendorId(product.getVendor().getId())
                .build();
    }
}
