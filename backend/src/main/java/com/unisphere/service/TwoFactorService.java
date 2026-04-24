package com.unisphere.service;

import com.unisphere.entity.User;
import com.unisphere.repository.UserRepository;
import java.security.SecureRandom;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
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
    private static final int APP_SETUP_EXPIRES_SECONDS = 300;
    private static final int CHALLENGE_EXPIRES_SECONDS = 300;
    private static final int VERIFIED_ACTION_EXPIRES_SECONDS = 180;

    private final UserRepository userRepository;
    private final JavaMailSender mailSender;
    private final TotpService totpService;
    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, ChallengeSession> challenges = new ConcurrentHashMap<>();
    private final Map<String, VerifiedActionToken> verifiedActionTokens = new ConcurrentHashMap<>();

    @Value("${spring.mail.username:}")
    private String smtpSender;

    public TwoFactorService(UserRepository userRepository, JavaMailSender mailSender, TotpService totpService) {
        this.userRepository = userRepository;
        this.mailSender = mailSender;
        this.totpService = totpService;
    }

    public Map<String, Object> getTwoFactorStatus(String email) {
        User user = getUserByEmail(email);

        Map<String, Object> response = new HashMap<>();
        response.put("emailEnabled", user.isEmailTwoFactorEnabled());
        response.put("appEnabled", user.isAppTwoFactorEnabled());
        return response;
    }

    public boolean hasAnyTwoFactorEnabled(User user) {
        return user != null && (user.isEmailTwoFactorEnabled() || user.isAppTwoFactorEnabled());
    }

    public Map<String, Object> startLoginChallenge(User user) {
        if (!hasAnyTwoFactorEnabled(user)) {
            throw new IllegalArgumentException("Two-factor is not enabled for this account");
        }

        String challengeId = UUID.randomUUID().toString();
        ChallengeSession session = new ChallengeSession();
        session.challengeId = challengeId;
        session.userId = user.getId();
        session.email = user.getEmail();
        session.challengeType = "LOGIN";
        session.action = "LOGIN";
        session.emailMethodEnabled = user.isEmailTwoFactorEnabled();
        session.appMethodEnabled = user.isAppTwoFactorEnabled();
        session.expiresAt = LocalDateTime.now().plusSeconds(CHALLENGE_EXPIRES_SECONDS);

        challenges.put(challengeId, session);

        Map<String, Object> methods = new HashMap<>();
        methods.put("email", session.emailMethodEnabled);
        methods.put("app", session.appMethodEnabled);

        Map<String, Object> response = new HashMap<>();
        response.put("twoFactorRequired", true);
        response.put("challengeId", challengeId);
        response.put("methods", methods);
        return response;
    }

    public Map<String, Object> startProtectedActionChallenge(String email, String action) {
        User user = getUserByEmail(email);

        if (!hasAnyTwoFactorEnabled(user)) {
            Map<String, Object> response = new HashMap<>();
            response.put("twoFactorRequired", false);
            return response;
        }

        String challengeId = UUID.randomUUID().toString();
        ChallengeSession session = new ChallengeSession();
        session.challengeId = challengeId;
        session.userId = user.getId();
        session.email = user.getEmail();
        session.challengeType = "PROTECTED_ACTION";
        session.action = action;
        session.emailMethodEnabled = user.isEmailTwoFactorEnabled();
        session.appMethodEnabled = user.isAppTwoFactorEnabled();
        session.expiresAt = LocalDateTime.now().plusSeconds(CHALLENGE_EXPIRES_SECONDS);

        challenges.put(challengeId, session);

        Map<String, Object> methods = new HashMap<>();
        methods.put("email", session.emailMethodEnabled);
        methods.put("app", session.appMethodEnabled);

        Map<String, Object> response = new HashMap<>();
        response.put("twoFactorRequired", true);
        response.put("challengeId", challengeId);
        response.put("methods", methods);
        response.put("action", action);
        return response;
    }

    public Map<String, Object> sendChallengeCode(String challengeId, String method) {
        ChallengeSession session = getValidChallenge(challengeId);
        String normalizedMethod = normalizeMethod(method);

        if ("EMAIL".equals(normalizedMethod)) {
            if (!session.emailMethodEnabled) {
                throw new IllegalArgumentException("Email method is not enabled for this challenge");
            }
            sendChallengeEmail(session);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Verification code sent to your email.");
            response.put("expiresInSeconds", OTP_EXPIRES_SECONDS);
            return response;
        }

        if ("APP".equals(normalizedMethod)) {
            if (!session.appMethodEnabled) {
                throw new IllegalArgumentException("Authenticator app is not enabled for this challenge");
            }
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Enter the code from your authenticator app.");
            response.put("expiresInSeconds", OTP_EXPIRES_SECONDS);
            return response;
        }

        throw new IllegalArgumentException("Unsupported method");
    }

    public User verifyLoginChallenge(String challengeId, String method, String code) {
        ChallengeSession session = getValidChallenge(challengeId);
        if (!"LOGIN".equals(session.challengeType)) {
            throw new IllegalArgumentException("Invalid challenge type");
        }

        verifyChallengeCodeInternal(session, method, code);
        challenges.remove(challengeId);
        return userRepository.findById(session.userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public Map<String, Object> verifyProtectedActionChallenge(String challengeId, String method, String code) {
        ChallengeSession session = getValidChallenge(challengeId);
        if (!"PROTECTED_ACTION".equals(session.challengeType)) {
            throw new IllegalArgumentException("Invalid challenge type");
        }

        verifyChallengeCodeInternal(session, method, code);
        challenges.remove(challengeId);

        String verificationToken = UUID.randomUUID().toString();
        VerifiedActionToken verified = new VerifiedActionToken();
        verified.userId = session.userId;
        verified.action = session.action;
        verified.expiresAt = LocalDateTime.now().plusSeconds(VERIFIED_ACTION_EXPIRES_SECONDS);
        verifiedActionTokens.put(verificationToken, verified);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Two-factor verification successful.");
        response.put("verificationToken", verificationToken);
        response.put("expiresInSeconds", VERIFIED_ACTION_EXPIRES_SECONDS);
        return response;
    }

    public boolean consumeVerifiedActionToken(String token, Long userId, String action) {
        if (token == null || token.isBlank()) return false;
        VerifiedActionToken verified = verifiedActionTokens.get(token);
        if (verified == null) return false;
        if (LocalDateTime.now().isAfter(verified.expiresAt)) {
            verifiedActionTokens.remove(token);
            return false;
        }
        boolean matches = verified.userId != null
            && verified.userId.equals(userId)
            && verified.action != null
            && verified.action.equalsIgnoreCase(action);
        if (matches) {
            verifiedActionTokens.remove(token);
            return true;
        }
        return false;
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

    public Map<String, Object> setupAuthenticatorApp(String email) {
        User user = getUserByEmail(email);

        String secret = totpService.generateBase32Secret();
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(APP_SETUP_EXPIRES_SECONDS);
        String issuer = "UniSphere";
        String accountLabel = issuer + ":" + user.getEmail();

        String otpauth = "otpauth://totp/"
            + URLEncoder.encode(accountLabel, StandardCharsets.UTF_8)
            + "?secret=" + secret
            + "&issuer=" + URLEncoder.encode(issuer, StandardCharsets.UTF_8)
            + "&algorithm=SHA1&digits=6&period=30";

        String qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data="
            + URLEncoder.encode(otpauth, StandardCharsets.UTF_8);

        user.setAppTwoFactorPendingSecret(secret);
        user.setAppTwoFactorPendingExpiresAt(expiresAt);
        userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("secret", secret);
        response.put("otpauthUrl", otpauth);
        response.put("qrUrl", qrUrl);
        response.put("expiresInSeconds", APP_SETUP_EXPIRES_SECONDS);
        return response;
    }

    public Map<String, Object> verifyAuthenticatorApp(String email, String code) {
        User user = getUserByEmail(email);

        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Authenticator code is required");
        }

        if (user.getAppTwoFactorPendingSecret() == null || user.getAppTwoFactorPendingExpiresAt() == null) {
            throw new IllegalArgumentException("No active app setup. Please scan QR again.");
        }

        if (LocalDateTime.now().isAfter(user.getAppTwoFactorPendingExpiresAt())) {
            user.setAppTwoFactorPendingSecret(null);
            user.setAppTwoFactorPendingExpiresAt(null);
            userRepository.save(user);
            throw new IllegalArgumentException("Authenticator setup expired. Please generate a new QR.");
        }

        boolean valid = totpService.verifyCode(user.getAppTwoFactorPendingSecret(), code.trim());
        if (!valid) {
            throw new IllegalArgumentException("Invalid authenticator code.");
        }

        user.setAppTwoFactorSecret(user.getAppTwoFactorPendingSecret());
        user.setAppTwoFactorPendingSecret(null);
        user.setAppTwoFactorPendingExpiresAt(null);
        user.setAppTwoFactorEnabled(true);
        userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Authenticator app two-factor enabled.");
        response.put("appEnabled", true);
        return response;
    }

    public Map<String, Object> disableEmailTwoFactor(String email) {
        User user = getUserByEmail(email);

        user.setEmailTwoFactorEnabled(false);
        user.setEmailOtpCode(null);
        user.setEmailOtpExpiresAt(null);
        userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Email two-factor authentication disabled.");
        response.put("emailEnabled", false);
        return response;
    }

    public Map<String, Object> disableAuthenticatorApp(String email) {
        User user = getUserByEmail(email);

        user.setAppTwoFactorEnabled(false);
        user.setAppTwoFactorSecret(null);
        user.setAppTwoFactorPendingSecret(null);
        user.setAppTwoFactorPendingExpiresAt(null);
        userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Authenticator app two-factor disabled.");
        response.put("appEnabled", false);
        return response;
    }

    private void sendChallengeEmail(ChallengeSession session) {
        if (smtpSender == null || smtpSender.isBlank()) {
            throw new IllegalStateException("SMTP sender is not configured");
        }

        int otp = OTP_MIN + secureRandom.nextInt(OTP_RANGE);
        String otpCode = String.valueOf(otp);
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(OTP_EXPIRES_SECONDS);

        session.emailCode = otpCode;
        session.methodExpiresAt = expiresAt;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(smtpSender);
        message.setTo(session.email);
        message.setSubject("UniSphere Security Verification Code");
        message.setText("Your verification code is " + otpCode + ". It expires in 3 minutes.");
        mailSender.send(message);
    }

    private void verifyChallengeCodeInternal(ChallengeSession session, String method, String code) {
        String normalizedMethod = normalizeMethod(method);
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Verification code is required");
        }

        if ("EMAIL".equals(normalizedMethod)) {
            if (!session.emailMethodEnabled) {
                throw new IllegalArgumentException("Email method is not enabled for this challenge");
            }
            if (session.emailCode == null || session.methodExpiresAt == null) {
                throw new IllegalArgumentException("No active email code. Request a new code.");
            }
            if (LocalDateTime.now().isAfter(session.methodExpiresAt)) {
                session.emailCode = null;
                session.methodExpiresAt = null;
                throw new IllegalArgumentException("Code expired. Request a new code.");
            }
            if (!session.emailCode.equals(code.trim())) {
                throw new IllegalArgumentException("Invalid verification code.");
            }
            return;
        }

        if ("APP".equals(normalizedMethod)) {
            if (!session.appMethodEnabled) {
                throw new IllegalArgumentException("Authenticator app method is not enabled for this challenge");
            }
            User user = userRepository.findById(session.userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
            String secret = user.getAppTwoFactorSecret();
            if (secret == null || secret.isBlank()) {
                throw new IllegalArgumentException("Authenticator app is not configured");
            }
            boolean ok = totpService.verifyCode(secret, code.trim());
            if (!ok) {
                throw new IllegalArgumentException("Invalid authenticator code.");
            }
            return;
        }

        throw new IllegalArgumentException("Unsupported method");
    }

    private ChallengeSession getValidChallenge(String challengeId) {
        if (challengeId == null || challengeId.isBlank()) {
            throw new IllegalArgumentException("Challenge id is required");
        }
        ChallengeSession session = challenges.get(challengeId);
        if (session == null) {
            throw new IllegalArgumentException("Challenge not found");
        }
        if (LocalDateTime.now().isAfter(session.expiresAt)) {
            challenges.remove(challengeId);
            throw new IllegalArgumentException("Challenge expired");
        }
        return session;
    }

    private String normalizeMethod(String method) {
        if (method == null) return "";
        String value = method.trim().toUpperCase();
        if ("AUTHENTICATOR".equals(value)) return "APP";
        return value;
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private static class ChallengeSession {
        String challengeId;
        Long userId;
        String email;
        String challengeType;
        String action;
        boolean emailMethodEnabled;
        boolean appMethodEnabled;
        LocalDateTime expiresAt;
        String emailCode;
        LocalDateTime methodExpiresAt;
    }

    private static class VerifiedActionToken {
        Long userId;
        String action;
        LocalDateTime expiresAt;
    }
}
