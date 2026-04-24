package com.unisphere.controller;

import com.unisphere.entity.User;
import com.unisphere.entity.Role;
import com.unisphere.entity.UserStatus;
import com.unisphere.repository.UserRepository;
import com.unisphere.security.JwtService;
import com.unisphere.service.PasswordResetService;
import com.unisphere.service.TwoFactorService;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final TwoFactorService twoFactorService;
    private final PasswordResetService passwordResetService;

    public AuthController(AuthenticationManager authenticationManager, UserRepository userRepository, JwtService jwtService, PasswordEncoder passwordEncoder, TwoFactorService twoFactorService, PasswordResetService passwordResetService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.twoFactorService = twoFactorService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid email or password"));
        }

        if (user.getStatus() == UserStatus.PENDING) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Account pending approval"));
        }

        if (user.getStatus() == UserStatus.REJECTED) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Account has been rejected"));
        }

        if (user.getStatus() == UserStatus.DISABLED) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Account disabled contact admin"));
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            if (!authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid email or password"));
            }
        } catch (DisabledException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Account pending approval"));
        } catch (BadCredentialsException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid email or password"));
        }

        if (twoFactorService.hasAnyTwoFactorEnabled(user)) {
            return ResponseEntity.ok(twoFactorService.startLoginChallenge(user));
        }

        String token = jwtService.generateToken(
            user.getEmail(),
            Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole().name(),
                "status", user.getStatus().name()
            )
        );

        return ResponseEntity.ok(Map.of(
            "token", token,
            "user", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole(),
                "status", user.getStatus()
            )
        ));
    }

    @PostMapping("/2fa/send-code")
    public ResponseEntity<?> sendLoginTwoFactorCode(@RequestBody TwoFactorSendRequest request) {
        try {
            return ResponseEntity.ok(twoFactorService.sendChallengeCode(request.getChallengeId(), request.getMethod()));
        } catch (Exception ex) {
            String message = ex.getMessage() != null ? ex.getMessage() : "Failed to send verification code";
            return ResponseEntity.badRequest().body(Map.of("message", message));
        }
    }

    @PostMapping("/2fa/verify")
    public ResponseEntity<?> verifyLoginTwoFactor(@RequestBody TwoFactorVerifyRequest request) {
        try {
            User user = twoFactorService.verifyLoginChallenge(request.getChallengeId(), request.getMethod(), request.getCode());

            String token = jwtService.generateToken(
                user.getEmail(),
                Map.of(
                    "id", user.getId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "role", user.getRole().name(),
                    "status", user.getStatus().name()
                )
            );

            return ResponseEntity.ok(Map.of(
                "token", token,
                "user", Map.of(
                    "id", user.getId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "role", user.getRole(),
                    "status", user.getStatus()
                )
            ));
        } catch (Exception ex) {
            String message = ex.getMessage() != null ? ex.getMessage() : "Failed to verify code";
            return ResponseEntity.badRequest().body(Map.of("message", message));
        }
    }

    @PostMapping("/forgot-password/send-code")
    public ResponseEntity<?> sendForgotPasswordCode(@RequestBody ForgotPasswordSendRequest request) {
        try {
            return ResponseEntity.ok(passwordResetService.sendResetCode(request.getEmail()));
        } catch (Exception ex) {
            String message = ex.getMessage() != null ? ex.getMessage() : "Failed to send reset code";
            return ResponseEntity.badRequest().body(Map.of("message", message));
        }
    }

    @PostMapping("/forgot-password/verify-code")
    public ResponseEntity<?> verifyForgotPasswordCode(@RequestBody ForgotPasswordVerifyRequest request) {
        try {
            return ResponseEntity.ok(passwordResetService.verifyResetCode(request.getEmail(), request.getCode()));
        } catch (Exception ex) {
            String message = ex.getMessage() != null ? ex.getMessage() : "Failed to verify reset code";
            return ResponseEntity.badRequest().body(Map.of("message", message));
        }
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<?> resetForgotPassword(@RequestBody ForgotPasswordResetRequest request) {
        try {
            return ResponseEntity.ok(
                passwordResetService.resetPassword(request.getEmail(), request.getCode(), request.getNewPassword())
            );
        } catch (Exception ex) {
            String message = ex.getMessage() != null ? ex.getMessage() : "Failed to reset password";
            return ResponseEntity.badRequest().body(Map.of("message", message));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank() || request.getPassword() == null || request.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required"));
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Email already exists"));
        }

        Role role = request.getRole() != null ? request.getRole() : Role.USER;
        UserStatus status = role == Role.TECHNICIAN ? UserStatus.PENDING : UserStatus.APPROVED;

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setStatus(status);

        user = userRepository.save(user);

        if (status == UserStatus.APPROVED) {
            String token = jwtService.generateToken(
                user.getEmail(),
                Map.of(
                    "id", user.getId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "role", user.getRole().name(),
                    "status", user.getStatus().name()
                )
            );

            return ResponseEntity.ok(Map.of(
                "token", token,
                "user", Map.of(
                    "id", user.getId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "role", user.getRole(),
                    "status", user.getStatus()
                )
            ));
        }

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
            "message", "Technician registration submitted for approval",
            "user", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole(),
                "status", user.getStatus()
            )
        ));
    }

    public static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;
        private Role role;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public Role getRole() {
            return role;
        }

        public void setRole(Role role) {
            this.role = role;
        }
    }

    public static class ForgotPasswordSendRequest {
        private String email;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }

    public static class ForgotPasswordResetRequest {
        private String email;
        private String code;
        private String newPassword;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getNewPassword() {
            return newPassword;
        }

        public void setNewPassword(String newPassword) {
            this.newPassword = newPassword;
        }
    }

    public static class ForgotPasswordVerifyRequest {
        private String email;
        private String code;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }
    }

    public static class TwoFactorSendRequest {
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

    public static class TwoFactorVerifyRequest {
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
