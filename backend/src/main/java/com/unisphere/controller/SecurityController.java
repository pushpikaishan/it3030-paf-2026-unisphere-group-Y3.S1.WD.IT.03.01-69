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

    @PostMapping("/2fa/app/setup")
    public ResponseEntity<?> setupAuthenticatorApp(Authentication authentication) {
        try {
            return ResponseEntity.ok(twoFactorService.setupAuthenticatorApp(authentication.getName()));
        } catch (Exception ex) {
            String message = ex.getMessage() != null ? ex.getMessage() : "Failed to prepare authenticator setup";
            return ResponseEntity.badRequest().body(Map.of("message", message));
        }
    }

    @PostMapping("/2fa/app/verify")
    public ResponseEntity<?> verifyAuthenticatorApp(Authentication authentication, @RequestBody VerifyOtpRequest request) {
        try {
            return ResponseEntity.ok(twoFactorService.verifyAuthenticatorApp(authentication.getName(), request.getOtpCode()));
        } catch (Exception ex) {
            String message = ex.getMessage() != null ? ex.getMessage() : "Failed to verify authenticator code";
            return ResponseEntity.badRequest().body(Map.of("message", message));
        }
    }

    @PostMapping("/2fa/email/disable")
    public ResponseEntity<?> disableEmailOtp(Authentication authentication) {
        try {
            return ResponseEntity.ok(twoFactorService.disableEmailTwoFactor(authentication.getName()));
        } catch (Exception ex) {
            String message = ex.getMessage() != null ? ex.getMessage() : "Failed to disable email two-factor";
            return ResponseEntity.badRequest().body(Map.of("message", message));
        }
    }

    @PostMapping("/2fa/app/disable")
    public ResponseEntity<?> disableAuthenticatorApp(Authentication authentication) {
        try {
            return ResponseEntity.ok(twoFactorService.disableAuthenticatorApp(authentication.getName()));
        } catch (Exception ex) {
            String message = ex.getMessage() != null ? ex.getMessage() : "Failed to disable authenticator app";
            return ResponseEntity.badRequest().body(Map.of("message", message));
        }
    }

    @PostMapping("/2fa/challenge/start")
    public ResponseEntity<?> startProtectedActionChallenge(Authentication authentication, @RequestBody ProtectedActionRequest request) {
        try {
            return ResponseEntity.ok(twoFactorService.startProtectedActionChallenge(authentication.getName(), request.getAction()));
        } catch (Exception ex) {
            String message = ex.getMessage() != null ? ex.getMessage() : "Failed to start two-factor challenge";
            return ResponseEntity.badRequest().body(Map.of("message", message));
        }
    }

    @PostMapping("/2fa/challenge/send-code")
    public ResponseEntity<?> sendProtectedActionCode(Authentication authentication, @RequestBody ChallengeSendRequest request) {
        try {
            return ResponseEntity.ok(twoFactorService.sendChallengeCode(request.getChallengeId(), request.getMethod()));
        } catch (Exception ex) {
            String message = ex.getMessage() != null ? ex.getMessage() : "Failed to send challenge code";
            return ResponseEntity.badRequest().body(Map.of("message", message));
        }
    }

    @PostMapping("/2fa/challenge/verify")
    public ResponseEntity<?> verifyProtectedActionChallenge(Authentication authentication, @RequestBody ChallengeVerifyRequest request) {
        try {
            return ResponseEntity.ok(twoFactorService.verifyProtectedActionChallenge(request.getChallengeId(), request.getMethod(), request.getCode()));
        } catch (Exception ex) {
            String message = ex.getMessage() != null ? ex.getMessage() : "Failed to verify challenge code";
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

    public static class ProtectedActionRequest {
        private String action;

        public String getAction() {
            return action;
        }

        public void setAction(String action) {
            this.action = action;
        }
    }

    public static class ChallengeSendRequest {
        private String challengeId;
        private String method;

        public String getChallengeId() {
            return challengeId;
        }

        public void setChallengeId(String challengeId) {
            this.challengeId = challengeId;
        }

        public String getMethod() {
            return method;
        }

        public void setMethod(String method) {
            this.method = method;
        }
    }

    public static class ChallengeVerifyRequest {
        private String challengeId;
        private String method;
        private String code;

        public String getChallengeId() {
            return challengeId;
        }

        public void setChallengeId(String challengeId) {
            this.challengeId = challengeId;
        }

        public String getMethod() {
            return method;
        }

        public void setMethod(String method) {
            this.method = method;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }
    }
}
