package com.unisphere.service;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Locale;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

@Service
public class TotpService {

    private static final String BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final int SECRET_BYTES = 20;
    private static final int STEP_SECONDS = 30;
    private static final int DIGITS = 6;

    private final SecureRandom secureRandom = new SecureRandom();

    public String generateBase32Secret() {
        byte[] bytes = new byte[SECRET_BYTES];
        secureRandom.nextBytes(bytes);
        return base32Encode(bytes);
    }

    public boolean verifyCode(String base32Secret, String code) {
        if (base32Secret == null || base32Secret.isBlank() || code == null || code.isBlank()) {
            return false;
        }

        String normalized = code.trim();
        long now = Instant.now().getEpochSecond();
        long currentStep = now / STEP_SECONDS;

        for (long delta = -1; delta <= 1; delta++) {
            String generated = generateCode(base32Secret, currentStep + delta);
            if (normalized.equals(generated)) {
                return true;
            }
        }

        return false;
    }

    private String generateCode(String base32Secret, long counter) {
        try {
            byte[] key = base32Decode(base32Secret);
            byte[] data = ByteBuffer.allocate(8).putLong(counter).array();

            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);

            int offset = hash[hash.length - 1] & 0x0F;
            int binary = ((hash[offset] & 0x7F) << 24)
                | ((hash[offset + 1] & 0xFF) << 16)
                | ((hash[offset + 2] & 0xFF) << 8)
                | (hash[offset + 3] & 0xFF);

            int otp = binary % (int) Math.pow(10, DIGITS);
            return String.format(Locale.ROOT, "%0" + DIGITS + "d", otp);
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Failed to generate TOTP", ex);
        }
    }

    private byte[] base32EncodeToBytes(String input) {
        return input.getBytes(StandardCharsets.UTF_8);
    }

    private String base32Encode(byte[] data) {
        StringBuilder result = new StringBuilder((data.length * 8 + 4) / 5);
        int buffer = 0;
        int bitsLeft = 0;

        for (byte b : data) {
            buffer = (buffer << 8) | (b & 0xFF);
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                int index = (buffer >> (bitsLeft - 5)) & 0x1F;
                bitsLeft -= 5;
                result.append(BASE32_ALPHABET.charAt(index));
            }
        }

        if (bitsLeft > 0) {
            int index = (buffer << (5 - bitsLeft)) & 0x1F;
            result.append(BASE32_ALPHABET.charAt(index));
        }

        return result.toString();
    }

    private byte[] base32Decode(String value) {
        String normalized = value.replace("=", "").replace(" ", "").toUpperCase(Locale.ROOT);
        byte[] output = new byte[normalized.length() * 5 / 8];

        int buffer = 0;
        int bitsLeft = 0;
        int index = 0;

        for (char c : normalized.toCharArray()) {
            int charValue = BASE32_ALPHABET.indexOf(c);
            if (charValue < 0) {
                throw new IllegalArgumentException("Invalid base32 character");
            }

            buffer = (buffer << 5) | charValue;
            bitsLeft += 5;

            if (bitsLeft >= 8) {
                output[index++] = (byte) ((buffer >> (bitsLeft - 8)) & 0xFF);
                bitsLeft -= 8;
            }
        }

        if (index == output.length) {
            return output;
        }

        byte[] truncated = new byte[index];
        System.arraycopy(output, 0, truncated, 0, index);
        return truncated;
    }
}
