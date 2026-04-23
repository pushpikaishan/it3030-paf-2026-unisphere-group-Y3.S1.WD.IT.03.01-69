package com.unisphere.service;

import com.unisphere.entity.User;
import com.unisphere.repository.UserRepository;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TwoFactorService {

    private static final int OTP_MIN = 100000;
    private static final int OTP_RANGE = 900000;
    private static final int OTP_EXPIRES_SECONDS = 180;

    private final UserRepository userRepository;
    private final JavaMailSender mailSender;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${spring.mail.username:}")
    private String smtpSender;

    public TwoFactorService(UserRepository userRepository, JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.mailSender = mailSender;
    }

    public Map<String, Object> getTwoFactorStatus(String email) {
        User user = getUserByEmail(email);

        Map<String, Object> response = new HashMap<>();
        response.put("emailEnabled", user.isEmailTwoFactorEnabled());
        response.put("appEnabled", user.isAppTwoFactorEnabled());
        return response;
    }

    public Map<String, Object> sendEmailOtp(String email) {
        User user = getUserByEmail(email);

        if (smtpSender == null || smtpSender.isBlank()) {
            throw new IllegalStateException("SMTP sender is not configured");
        }

        int otp = OTP_MIN + secureRandom.nextInt(OTP_RANGE);
        String otpCode = String.valueOf(otp);
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(OTP_EXPIRES_SECONDS);

        user.setEmailOtpCode(otpCode);
        user.setEmailOtpExpiresAt(expiresAt);
        userRepository.save(user);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(smtpSender);
        message.setTo(user.getEmail());
        message.setSubject("UniSphere Security Verification Code");
        message.setText("Your verification code is " + otpCode + ". It expires in 3 minutes.");
        mailSender.send(message);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Verification code sent to your email.");
        response.put("expiresInSeconds", OTP_EXPIRES_SECONDS);
        return response;
    }

    public Map<String, Object> verifyEmailOtp(String email, String otpCode) {
        User user = getUserByEmail(email);

        if (otpCode == null || otpCode.isBlank()) {
            throw new IllegalArgumentException("OTP code is required");
        }

        if (user.getEmailOtpCode() == null || user.getEmailOtpExpiresAt() == null) {
            throw new IllegalArgumentException("No active OTP request. Please request a new code.");
        }

        if (LocalDateTime.now().isAfter(user.getEmailOtpExpiresAt())) {
            user.setEmailOtpCode(null);
            user.setEmailOtpExpiresAt(null);
            userRepository.save(user);
            throw new IllegalArgumentException("OTP expired. Please request a new code.");
        }

        if (!user.getEmailOtpCode().equals(otpCode.trim())) {
            throw new IllegalArgumentException("Invalid OTP code.");
        }

        user.setEmailTwoFactorEnabled(true);
        user.setEmailOtpCode(null);
        user.setEmailOtpExpiresAt(null);
        userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Email two-factor authentication enabled.");
        response.put("emailEnabled", true);
        return response;
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }
}
