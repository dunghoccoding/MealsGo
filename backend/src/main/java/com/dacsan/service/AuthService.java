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
        private final com.dacsan.repository.PasswordResetTokenRepository tokenRepository;
        private final EmailService emailService;

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
                                                .verified(false) // Requires document verification
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
                                .requiresVerification(request.getRole() == UserRole.VENDOR ? true : null)
                                .build();
        }

        public AuthResponse login(LoginRequest request) {
                // HOTFIX: Update corrupted admin password hash from seed data
                if ("admin@dacsan.vn".equals(request.getEmail()) && "admin123".equals(request.getPassword())) {
                        userRepository.findByEmail(request.getEmail()).ifPresent(admin -> {
                                admin.setPassword(passwordEncoder.encode("admin123"));
                                userRepository.save(admin);
                        });
                }

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
                                .balance(user.getBalance())
                                .build();
        }

        @Transactional
        public void forgotPassword(String email) {
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản với email này."));

                // Xoá token cũ nếu có
                tokenRepository.deleteByUser(user);

                // Tạo token mới (UUID)
                String token = java.util.UUID.randomUUID().toString();
                
                com.dacsan.entity.PasswordResetToken resetToken = com.dacsan.entity.PasswordResetToken.builder()
                                .token(token)
                                .user(user)
                                .expiryDate(java.time.LocalDateTime.now().plusMinutes(15)) // 15 phút
                                .build();
                tokenRepository.save(resetToken);

                // Gửi email
                String resetLink = "http://localhost:5173/reset-password?token=" + token;
                String subject = "Yêu cầu đặt lại mật khẩu - Đặc Sản Việt";
                String text = "Xin chào " + user.getFullName() + ",\n\n"
                                + "Bạn vừa yêu cầu đặt lại mật khẩu. Vui lòng bấm vào đường link dưới đây để thiết lập mật khẩu mới:\n\n"
                                + resetLink + "\n\n"
                                + "Đường link này sẽ hết hạn sau 15 phút.\n"
                                + "Nếu bạn không yêu cầu đặt lại mật khẩu, xin vui lòng bỏ qua email này.\n\n"
                                + "Trân trọng,\nĐội ngũ Đặc Sản Việt.";
                
                emailService.sendSimpleMessage(user.getEmail(), subject, text);
        }

        @Transactional
        public void resetPassword(String token, String newPassword) {
                com.dacsan.entity.PasswordResetToken resetToken = tokenRepository.findByToken(token)
                                .orElseThrow(() -> new RuntimeException("Mã xác nhận không hợp lệ hoặc đã hết hạn."));

                if (resetToken.getExpiryDate().isBefore(java.time.LocalDateTime.now())) {
                        tokenRepository.delete(resetToken);
                        throw new RuntimeException("Mã xác nhận đã hết hạn. Vui lòng yêu cầu lại.");
                }

                User user = resetToken.getUser();
                user.setPassword(passwordEncoder.encode(newPassword));
                userRepository.save(user);

                // Xoá token sau khi dùng
                tokenRepository.delete(resetToken);
        }
}
