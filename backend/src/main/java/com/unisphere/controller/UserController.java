package com.unisphere.controller;

import com.unisphere.entity.User;
import com.unisphere.service.UserService;
import com.unisphere.entity.UserStatus;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import io.jsonwebtoken.Claims;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;

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

            // Prevent self-service escalation
            user.setRole(null);
            user.setStatus(null);
        }

        return ResponseEntity.ok(userService.update(id, user));
    }

    @PostMapping("/{id}/avatar")
    public ResponseEntity<?> uploadAvatar(@PathVariable Long id, @RequestParam("file") MultipartFile file, Authentication authentication) {
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

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "No file uploaded"));
        }

        Path uploadDir = Paths.get("uploads").toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadDir);
            String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID().toString() + (extension != null ? "." + extension : "");
            Path target = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), target);
            String publicUrl = "/uploads/" + filename;
            User updated = userService.updateProfileImage(id, publicUrl);
            return ResponseEntity.ok(Map.of("url", publicUrl, "user", updated));
        } catch (IOException ex) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to store file"));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/disable")
    public ResponseEntity<?> disable(@PathVariable Long id, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        boolean isPrivileged = authentication.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MANAGER"));

        User existing = userService.findById(id);

        if (!isPrivileged) {
            String email = authentication.getName();
            Long tokenUserId = null;
            if (authentication.getDetails() instanceof Claims claims) {
                Number n = claims.get("id", Number.class);
                if (n != null) tokenUserId = n.longValue();
            }

            boolean sameUserById = tokenUserId != null && tokenUserId.equals(id);
            boolean sameUserByEmail = email != null && existing != null && email.equalsIgnoreCase(existing.getEmail());

            if (!sameUserById && !sameUserByEmail) {
                return ResponseEntity.status(403).body(Map.of("message", "Only admins can disable other accounts"));
            }
        }

        User updated = userService.disable(id);
        return ResponseEntity.ok(Map.of(
            "message", "Account temporarily disabled. It will be deleted permanently in 1 month.",
            "user", updated
        ));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public User approve(@PathVariable Long id) {
        return userService.updateStatus(id, UserStatus.APPROVED);
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public User reject(@PathVariable Long id) {
        return userService.updateStatus(id, UserStatus.REJECTED);
    }

    @GetMapping("/technicians/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> pendingTechnicians() {
        return userService.findPendingTechnicians();
    }

    @PostMapping("/technicians/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public User approveTechnician(@PathVariable Long id) {
        return userService.updateStatus(id, UserStatus.APPROVED);
    }

    @PostMapping("/technicians/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public User rejectTechnician(@PathVariable Long id) {
        return userService.updateStatus(id, UserStatus.REJECTED);
    }
}