package com.unisphere.security;

import com.unisphere.entity.Role;
import com.unisphere.entity.User;
import com.unisphere.entity.UserStatus;
import com.unisphere.service.TwoFactorService;
import com.unisphere.service.UserService;
import java.io.IOException;
import java.util.Objects;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Cookie;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserService userService;
    private final TwoFactorService twoFactorService;

    @Value("${app.oauth2.redirect-uri:http://localhost:5173/oauth/callback}")
    private String frontendRedirectUri;

    public OAuth2SuccessHandler(JwtService jwtService, UserService userService, TwoFactorService twoFactorService) {
        this.jwtService = jwtService;
        this.userService = userService;
        this.twoFactorService = twoFactorService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
        throws IOException, ServletException {

        if (!(authentication.getPrincipal() instanceof OidcUser oidcUser)) {
            super.onAuthenticationSuccess(request, response, authentication);
            return;
        }

        String email = oidcUser.getEmail();
        String name = oidcUser.getFullName();
        String picture = oidcUser.getPicture();
        String googleId = oidcUser.getSubject();

        Role desiredRole = resolveDesiredRole(request.getCookies());
        UserStatus desiredStatus = desiredRole == Role.TECHNICIAN ? UserStatus.PENDING : null;

        User saved = userService.upsertOAuthUser(googleId, name, email, picture, desiredRole, desiredStatus);
        String redirectUri = Objects.requireNonNull(frontendRedirectUri, "Frontend redirect URI is required");

        clearRoleCookie(response);

        // If the account is pending (e.g., technician flow), do not log in; send the user back with a pending flag.
        if (saved.getStatus() == UserStatus.PENDING) {
            String pendingRedirect = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("pending", true)
                .build()
                .encode()
                .toUriString();

            getRedirectStrategy().sendRedirect(request, response, pendingRedirect);
            return;
        }

        if (twoFactorService.hasAnyTwoFactorEnabled(saved)) {
            Map<String, Object> challenge = twoFactorService.startLoginChallenge(saved);
            @SuppressWarnings("unchecked")
            Map<String, Object> methods = (Map<String, Object>) challenge.get("methods");
            boolean emailEnabled = Boolean.TRUE.equals(methods.get("email"));
            boolean appEnabled = Boolean.TRUE.equals(methods.get("app"));

            String challengeRedirect = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("twoFactorRequired", true)
                .queryParam("challengeId", challenge.get("challengeId"))
                .queryParam("emailMethod", emailEnabled)
                .queryParam("appMethod", appEnabled)
                .build()
                .encode()
                .toUriString();

            getRedirectStrategy().sendRedirect(request, response, challengeRedirect);
            return;
        }

        String token = jwtService.generateToken(
            saved.getEmail(),
            Map.of(
                "id", saved.getId(),
                "name", saved.getName(),
                "email", saved.getEmail(),
                "role", saved.getRole().name(),
                "status", saved.getStatus().name(),
                "picture", saved.getProfileImage(),
                "provider", saved.getProvider().name()
            )
        );

        String redirectUrl = UriComponentsBuilder.fromUriString(redirectUri)
            .queryParam("token", token)
            .build()
            .encode()
            .toUriString();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

    private Role resolveDesiredRole(Cookie[] cookies) {
        if (cookies == null) return null;
        for (Cookie cookie : cookies) {
            if ("oauth_role".equals(cookie.getName())) {
                if ("TECHNICIAN".equalsIgnoreCase(cookie.getValue())) {
                    return Role.TECHNICIAN;
                }
            }
        }
        return null;
    }

    private void clearRoleCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("oauth_role", "");
        cookie.setMaxAge(0);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        response.addCookie(cookie);
    }
}
