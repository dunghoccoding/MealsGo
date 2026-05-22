package com.dacsan.service;

import com.dacsan.dto.request.ChangePasswordRequest;
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

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

        // ── OTP store (in-memory) ────────────────────────────────────────────────
        private record OtpEntry(String otp, LocalDateTime expiresAt) {}
        private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

        private final UserRepository userRepository;
        private final VendorRepository vendorRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtTokenProvider jwtTokenProvider;
        private final AuthenticationManager authenticationManager;
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

        @Transactional
        public void changePassword(ChangePasswordRequest request) {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                String email = authentication.getName();

                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                // Verify current password
                if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                        throw new RuntimeException("Mật khẩu hiện tại không đúng");
                }

                // Check new password matches confirm
                if (!request.getNewPassword().equals(request.getConfirmPassword())) {
                        throw new RuntimeException("Mật khẩu mới và xác nhận mật khẩu không khớp");
                }

                user.setPassword(passwordEncoder.encode(request.getNewPassword()));
                userRepository.save(user);
                log.info("Password changed successfully for user: {}", email);
        }

        // ── FORGOT PASSWORD ──────────────────────────────────────────────────────

        /**
         * Bước 1: Nhận email, tạo OTP 6 chữ số, gửi qua email.
         * OTP có hiệu lực 5 phút.
         */
        public void forgotPassword(String email) {
                // Kiểm tra email tồn tại (không tiết lộ có hay không vì bảo mật)
                boolean exists = userRepository.existsByEmail(email);
                if (!exists) {
                        // Trả về thành công giả để không tiết lộ email có tồn tại
                        log.warn("Forgot password requested for non-existent email: {}", email);
                        return;
                }

                // Sinh OTP 6 chữ số
                String otp = generateOtp();
                LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(5);
                otpStore.put(email, new OtpEntry(otp, expiresAt));

                log.info("OTP generated for email: {} (expires at {})", email, expiresAt);

                // Gửi email (async)
                emailService.sendOtpEmail(email, otp);
        }

        /**
         * Bước 2: Xác thực OTP, trả về resetToken JWT 10 phút.
         */
        public String verifyOtp(String email, String otp) {
                OtpEntry entry = otpStore.get(email);

                if (entry == null) {
                        throw new RuntimeException("Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã mới.");
                }

                if (LocalDateTime.now().isAfter(entry.expiresAt())) {
                        otpStore.remove(email);
                        throw new RuntimeException("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
                }

                if (!entry.otp().equals(otp)) {
                        throw new RuntimeException("Mã OTP không đúng. Vui lòng kiểm tra lại.");
                }

                // OTP hợp lệ – xoá khỏi store
                otpStore.remove(email);
                log.info("OTP verified successfully for email: {}", email);

                // Sinh resetToken JWT 10 phút
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại."));

                return jwtTokenProvider.generateResetToken(user);
        }

        /**
         * Bước 3: Đặt lại mật khẩu mới bằng resetToken.
         */
        @Transactional
        public void resetPassword(String resetToken, String newPassword, String confirmPassword) {
                if (!newPassword.equals(confirmPassword)) {
                        throw new RuntimeException("Mật khẩu mới và xác nhận mật khẩu không khớp.");
                }

                // Xác thực resetToken
                if (!jwtTokenProvider.validateToken(resetToken)) {
                        throw new RuntimeException("Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
                }

                String email = jwtTokenProvider.getEmailFromToken(resetToken);
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại."));

                user.setPassword(passwordEncoder.encode(newPassword));
                userRepository.save(user);
                log.info("Password reset successfully for user: {}", email);
        }

        // ── HELPERS ──────────────────────────────────────────────────────────────

        private String generateOtp() {
                SecureRandom random = new SecureRandom();
                int otp = 100000 + random.nextInt(900000);
                return String.valueOf(otp);
        }
}
