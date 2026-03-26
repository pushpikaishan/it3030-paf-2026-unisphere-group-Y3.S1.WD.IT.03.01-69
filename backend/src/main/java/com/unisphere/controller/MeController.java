package com.unisphere.controller;

import java.security.Principal;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
public class MeController {

    @GetMapping
    public Map<String, Object> me(Authentication authentication, Principal principal) {
        if (authentication == null) {
            return Map.of("authenticated", false);
        }
        Object principalObj = authentication.getPrincipal();
        String email = null;
        String name = null;
        String picture = null;
        if (principalObj instanceof OidcUser oidcUser) {
            email = oidcUser.getEmail();
            name = oidcUser.getFullName();
            picture = oidcUser.getPicture();
        }
        return Map.of(
            "authenticated", authentication.isAuthenticated(),
            "name", name,
            "email", email,
            "picture", picture,
            "authorities", authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList()
        );
    }
}
