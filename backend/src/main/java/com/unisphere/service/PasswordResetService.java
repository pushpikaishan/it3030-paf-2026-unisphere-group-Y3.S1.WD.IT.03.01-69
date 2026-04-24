package com.unisphere.service;

import com.unisphere.entity.User;
import com.unisphere.repository.UserRepository;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class PasswordResetService {

    private static final int RESET_CODE_MIN = 100000;
    private static final int RESET_CODE_RANGE = 900000;
    private static final int RESET_CODE_EXPIRES_SECONDS = 180;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;
    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, ResetSession> resetSessions = new ConcurrentHashMap<>();

    @Value("${spring.mail.username:}")
    private String smtpSender;

    public PasswordResetService(UserRepository userRepository, PasswordEncoder passwordEncoder, JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
    }

    public Map<String, Object> sendResetCode(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        User user = userRepository.findByEmail(email.trim())
            .orElseThrow(() -> new IllegalArgumentException("No account found for this email"));

        if (smtpSender == null || smtpSender.isBlank()) {
            throw new IllegalStateException("SMTP sender is not configured");
        }

        String code = String.valueOf(RESET_CODE_MIN + secureRandom.nextInt(RESET_CODE_RANGE));
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(RESET_CODE_EXPIRES_SECONDS);

        ResetSession session = new ResetSession();
        session.email = user.getEmail();
        session.code = code;
        session.expiresAt = expiresAt;
        resetSessions.put(user.getEmail().toLowerCase(), session);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(smtpSender);
        message.setTo(user.getEmail());
        message.setSubject("UniSphere Password Reset Code");
        message.setText("Your password reset code is " + code + ". It expires in 3 minutes.");
        mailSender.send(message);

        return Map.of(
            "message", "Reset code sent to your email.",
            "expiresInSeconds", RESET_CODE_EXPIRES_SECONDS,
            "requestId", UUID.randomUUID().toString()
        );
    }

    public Map<String, Object> resetPassword(String email, String code, String newPassword) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Reset code is required");
        }
        if (newPassword == null || newPassword.isBlank()) {
            throw new IllegalArgumentException("New password is required");
        }
        if (newPassword.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }

        String key = email.trim().toLowerCase();
        ResetSession session = resetSessions.get(key);
        if (session == null) {
            throw new IllegalArgumentException("No active reset request. Please request a new code.");
        }

        if (LocalDateTime.now().isAfter(session.expiresAt)) {
            resetSessions.remove(key);
            throw new IllegalArgumentException("Reset code expired. Please request a new code.");
        }

        if (!session.code.equals(code.trim())) {
            throw new IllegalArgumentException("Invalid reset code.");
        }

        User user = userRepository.findByEmail(session.email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        resetSessions.remove(key);

        return Map.of("message", "Password updated successfully.");
    }

    private static class ResetSession {
        String email;
        String code;
        LocalDateTime expiresAt;
    }
}
