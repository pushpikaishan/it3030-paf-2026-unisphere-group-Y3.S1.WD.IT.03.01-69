package com.unisphere.security;

import java.io.IOException;
import java.util.Objects;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class OAuth2FailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Value("${app.oauth2.redirect-uri:http://localhost:5173/oauth/callback}")
    private String frontendRedirectUri;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception)
        throws IOException, ServletException {

        String redirectUri = Objects.requireNonNull(frontendRedirectUri, "Frontend redirect URI is required");

        String redirectUrl = UriComponentsBuilder.fromUriString(redirectUri)
            .queryParam("error", "google_login_failed")
            .build()
            .encode()
            .toUriString();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
