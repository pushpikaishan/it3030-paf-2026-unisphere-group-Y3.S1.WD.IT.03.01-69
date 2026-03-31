package com.unisphere.controller;

import java.security.Principal;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import io.jsonwebtoken.Claims;
import com.unisphere.security.JwtService;
import com.unisphere.repository.UserRepository;
import com.unisphere.entity.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
public class MeController {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public MeController(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> me(Authentication authentication, Principal principal, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        // If unauthenticated, try to parse the bearer token directly so the client can keep state
        if (authentication == null) {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                try {
                    Claims claims = jwtService.parse(authHeader.substring(7));
                    return ResponseEntity.ok(Map.of(
                        "authenticated", true,
                        "id", claims.get("id"),
                        "name", claims.get("name"),
                        "email", claims.get("email"),
                        "role", claims.get("role")
                    ));
                } catch (Exception ex) {
                    return ResponseEntity.ok(Map.of("authenticated", false));
                }
            }
            return ResponseEntity.ok(Map.of("authenticated", false));
        }

        Object principalObj = authentication.getPrincipal();
        String email = null;
        String name = null;
        String picture = null;
        String role = null;
        Long id = null;
        String status = null;

        if (principalObj instanceof OidcUser oidcUser) {
            email = oidcUser.getEmail();
            name = oidcUser.getFullName();
            picture = oidcUser.getPicture();
            role = authentication.getAuthorities().stream().findFirst().map(GrantedAuthority::getAuthority).orElse(null);
        } else if (authentication.getDetails() instanceof Claims claims) {
            email = claims.get("email", String.class);
            name = claims.get("name", String.class);
            role = claims.get("role", String.class);
            id = claims.get("id", Number.class) != null ? claims.get("id", Number.class).longValue() : null;
            status = claims.get("status", String.class);
        } else {
            email = principalObj != null ? principalObj.toString() : null;
        }

        // Prefer live data from DB so profile shows updated info immediately
        User dbUser = null;
        if (email != null) {
            dbUser = userRepository.findByEmail(email).orElse(null);
        } else if (id != null) {
            dbUser = userRepository.findById(id).orElse(null);
        }

        if (dbUser != null) {
            id = dbUser.getId();
            name = dbUser.getName();
            email = dbUser.getEmail();
            role = dbUser.getRole() != null ? dbUser.getRole().name() : role;
            picture = dbUser.getProfileImage();
            status = dbUser.getStatus() != null ? dbUser.getStatus().name() : status;
        }

        return ResponseEntity.ok(Map.of(
            "authenticated", authentication.isAuthenticated(),
            "id", id,
            "name", name,
            "email", email,
            "role", role,
            "picture", picture,
            "status", status,
            "authorities", authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList()
        ));
    }
}
