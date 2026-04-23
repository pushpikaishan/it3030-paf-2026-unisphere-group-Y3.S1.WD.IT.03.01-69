package com.unisphere.controller;

import com.unisphere.service.TwoFactorService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/security")
public class SecurityController {

    private final TwoFactorService twoFactorService;

    public SecurityController(TwoFactorService twoFactorService) {
        this.twoFactorService = twoFactorService;
    }

    @GetMapping("/2fa/status")
    public ResponseEntity<?> twoFactorStatus(Authentication authentication) {
        try {
            return ResponseEntity.ok(twoFactorService.getTwoFactorStatus(authentication.getName()));
        } catch (Exception ex) {
            String message = ex.getMessage() != null ? ex.getMessage() : "Failed to load two-factor status";
            return ResponseEntity.badRequest().body(Map.of("message", message));
        }
    }

    @PostMapping("/2fa/email/send-otp")
    public ResponseEntity<?> sendEmailOtp(Authentication authentication) {
        try {
            return ResponseEntity.ok(twoFactorService.sendEmailOtp(authentication.getName()));
        } catch (Exception ex) {
            String message = ex.getMessage() != null ? ex.getMessage() : "Failed to send verification code";
            return ResponseEntity.badRequest().body(Map.of("message", message));
        }
    }

    @PostMapping("/2fa/email/verify")
    public ResponseEntity<?> verifyEmailOtp(Authentication authentication, @RequestBody VerifyOtpRequest request) {
        try {
            return ResponseEntity.ok(twoFactorService.verifyEmailOtp(authentication.getName(), request.getOtpCode()));
        } catch (Exception ex) {
            String message = ex.getMessage() != null ? ex.getMessage() : "Failed to verify OTP code";
            return ResponseEntity.badRequest().body(Map.of("message", message));
        }
    }

    public static class VerifyOtpRequest {
        private String otpCode;

        public String getOtpCode() {
            return otpCode;
        }

        public void setOtpCode(String otpCode) {
            this.otpCode = otpCode;
        }
    }
}
