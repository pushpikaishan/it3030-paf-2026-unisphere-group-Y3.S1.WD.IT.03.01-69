package com.unisphere.controller;

import com.unisphere.entity.User;
import com.unisphere.service.UserService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import io.jsonwebtoken.Claims;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<User> all() {
        return userService.findAll();
    }

    @GetMapping("/{id}")
    public User byId(@PathVariable Long id) {
        return userService.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<?> create(@RequestBody User user) {
        try {
            return ResponseEntity.ok(userService.create(user));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody User user, Authentication authentication) {
        boolean isPrivileged = authentication.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MANAGER"));

        if (!isPrivileged) {
            String email = authentication.getName();
            Long tokenUserId = null;
            if (authentication.getDetails() instanceof Claims claims) {
                Number n = claims.get("id", Number.class);
                if (n != null) tokenUserId = n.longValue();
            }

            User existing = userService.findById(id);
            boolean sameUserById = tokenUserId != null && tokenUserId.equals(id);
            boolean sameUserByEmail = email != null && existing != null && email.equalsIgnoreCase(existing.getEmail());

            if (!sameUserById && !sameUserByEmail) {
                return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
            }
        }

        return ResponseEntity.ok(userService.update(id, user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
