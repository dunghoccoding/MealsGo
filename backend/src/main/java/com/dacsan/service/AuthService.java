package com.dacsan.service;

import com.dacsan.dto.request.LoginRequest;
import com.dacsan.dto.request.RegisterRequest;
import com.dacsan.dto.response.AuthResponse;
import com.dacsan.dto.response.UserResponse;
import com.dacsan.entity.Region;
import com.dacsan.entity.User;
import com.dacsan.entity.UserRole;
import com.dacsan.entity.Vendor;
import com.dacsan.repository.UserRepository;
import com.dacsan.repository.VendorRepository;
import com.dacsan.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

        private final UserRepository userRepository;
        private final VendorRepository vendorRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtTokenProvider jwtTokenProvider;
        private final AuthenticationManager authenticationManager;

        @Transactional
        public AuthResponse register(RegisterRequest request) {
                log.info("Registration attempt for email: {}, role: {}", request.getEmail(), request.getRole());

                // 1. Check if email already exists
                if (userRepository.existsByEmail(request.getEmail())) {
                        log.warn("Registration failed: Email already exists: {}", request.getEmail());
                        throw new RuntimeException("Email already exists");
                }

                // 2. Create user
                User user = User.builder()
                                .fullName(request.getFullName())
                                .email(request.getEmail())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .phone(request.getPhone())
                                .role(request.getRole())
                                .active(true)
                                .build();

                user = userRepository.save(user);

                // 3. If vendor, create vendor profile
                Long vendorId = null;
                if (request.getRole() == UserRole.VENDOR) {
                        if (request.getStoreName() == null || request.getStoreAddress() == null
                                        || request.getRegion() == null) {
                                throw new RuntimeException("Store name, address, and region are required for vendors");
                        }

                        try {
                                Vendor vendor = Vendor.builder()
                                                .user(user)
                                                .storeName(request.getStoreName())
                                                .address(request.getStoreAddress())
                                                .region(Region.valueOf(request.getRegion().toUpperCase()))
                                                .phone(request.getPhone())
                                                .active(true)
                                                .verified(true) // Auto-verify for now
                                                .build();

                                vendor = vendorRepository.save(vendor);
                                vendorId = vendor.getId();
                                log.info("Vendor profile created for user: {}, store: {}", user.getEmail(),
                                                request.getStoreName());
                        } catch (IllegalArgumentException e) {
                                log.error("Invalid region provided: {}", request.getRegion());
                                throw new RuntimeException("Miền (Region) phải là NORTH, CENTRAL hoặc SOUTH (ghi hoa)");
                        } catch (Exception e) {
                                log.error("Error creating vendor profile: {}", e.getMessage(), e);
                                throw new RuntimeException("Lỗi khi tạo hồ sơ nhà bán hàng: " + e.getMessage());
                        }
                }

                log.info("User registered successfully: {}", user.getEmail());

                // 4. Generate JWT token
                String token = jwtTokenProvider.generateToken(user);

                return AuthResponse.builder()
                                .token(token)
                                .userId(user.getId())
                                .email(user.getEmail())
                                .fullName(user.getFullName())
                                .role(user.getRole())
                                .vendorId(vendorId)
                                .build();
        }

        public AuthResponse login(LoginRequest request) {
                // Authenticate
                Authentication authentication = authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

                SecurityContextHolder.getContext().setAuthentication(authentication);

                // Get user
                User user = userRepository.findByEmail(request.getEmail())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                // Get vendor ID if vendor
                Long vendorId = null;
                if (user.getRole() == UserRole.VENDOR) {
                        vendorId = vendorRepository.findByUserId(user.getId())
                                        .map(Vendor::getId)
                                        .orElse(null);
                }

                // Generate JWT token
                String token = jwtTokenProvider.generateToken(user);

                return AuthResponse.builder()
                                .token(token)
                                .userId(user.getId())
                                .email(user.getEmail())
                                .fullName(user.getFullName())
                                .role(user.getRole())
                                .vendorId(vendorId)
                                .build();
        }

        public UserResponse getCurrentUser() {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                String email = authentication.getName();

                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                Long vendorId = null;
                if (user.getRole() == UserRole.VENDOR) {
                        vendorId = vendorRepository.findByUserId(user.getId())
                                        .map(Vendor::getId)
                                        .orElse(null);
                }

                return UserResponse.builder()
                                .id(user.getId())
                                .fullName(user.getFullName())
                                .email(user.getEmail())
                                .phone(user.getPhone())
                                .role(user.getRole())
                                .avatar(user.getAvatar())
                                .active(user.getActive())
                                .createdAt(user.getCreatedAt())
                                .vendorId(vendorId)
                                .build();
        }
}
