package com.unisphere.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "security.jwt")
public class JwtProperties {
    // 64-char hex (~256-bit) default; override in application.properties or env
    private String secret = "6d92c4b1e5f7496aaed3120f9c1b7a3f6c0d4e8a9273b5f1c2d8e4f6a1b3c5d7";
    private long expirationMs = 3600000; // 1 hour

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public long getExpirationMs() {
        return expirationMs;
    }

    public void setExpirationMs(long expirationMs) {
        this.expirationMs = expirationMs;
    }
}
