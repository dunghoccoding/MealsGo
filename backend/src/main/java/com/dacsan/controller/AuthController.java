package com.dacsan.controller;

import com.dacsan.dto.request.ChangePasswordRequest;
import com.dacsan.dto.request.ForgotPasswordRequest;
import com.dacsan.dto.request.LoginRequest;
import com.dacsan.dto.request.RegisterRequest;
import com.dacsan.dto.request.ResetPasswordRequest;
import com.dacsan.dto.request.VerifyOtpRequest;
import com.dacsan.dto.response.AuthResponse;
import com.dacsan.dto.response.UserResponse;
import com.dacsan.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication endpoints")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user (Customer/Vendor)")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Login and get JWT token")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<UserResponse> getCurrentUser() {
        return ResponseEntity.ok(authService.getCurrentUser());
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password for authenticated user")
    public ResponseEntity<String> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);
        return ResponseEntity.ok("Đổi mật khẩu thành công");
    }

    // ── FORGOT PASSWORD ──────────────────────────────────────────────────────

    @PostMapping("/forgot-password")
    @Operation(summary = "Bước 1: Gửi OTP đến email để đặt lại mật khẩu")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(Map.of("message", "Nếu email tồn tại trong hệ thống, mã OTP đã được gửi."));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Bước 2: Xác thực OTP và nhận reset token")
    public ResponseEntity<Map<String, String>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        String resetToken = authService.verifyOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(Map.of("resetToken", resetToken));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Bước 3: Đặt lại mật khẩu mới bằng reset token")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getResetToken(), request.getNewPassword(), request.getConfirmPassword());
        return ResponseEntity.ok(Map.of("message", "Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới."));
    }
}
