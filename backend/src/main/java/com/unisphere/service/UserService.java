package com.unisphere.service;

import com.unisphere.entity.AuthProvider;
import com.unisphere.entity.Role;
import com.unisphere.entity.User;
import com.unisphere.entity.UserStatus;
import com.unisphere.repository.UserRepository;
import java.util.List;
import java.util.Objects;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public User findById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public User create(User user) {
        if (user.getProvider() == null) {
            user.setProvider(AuthProvider.LOCAL);
        }
        if (user.getRole() == null) {
            user.setRole(Role.USER);
        }
        if (user.getProvider() == AuthProvider.LOCAL && (user.getPassword() == null || user.getPassword().isBlank())) {
            throw new IllegalArgumentException("Password is required for local users");
        }
        String email = Objects.requireNonNull(user.getEmail(), "Email is required");
        if (email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }
        if (user.getStatus() == null) {
            user.setStatus(UserStatus.APPROVED);
        }
        if (user.getPassword() != null && !user.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        return userRepository.save(user);
    }

    public User update(Long id, User update) {
        User existing = findById(id);
        existing.setName(update.getName());
        existing.setEmail(update.getEmail());
        existing.setProfileImage(update.getProfileImage());
        existing.setRole(update.getRole() != null ? update.getRole() : existing.getRole());
        existing.setStatus(update.getStatus() != null ? update.getStatus() : existing.getStatus());
        if (update.getPassword() != null && !update.getPassword().isBlank()) {
            existing.setPassword(passwordEncoder.encode(update.getPassword()));
        }
        return userRepository.save(existing);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public void delete(Long id) {
        userRepository.deleteById(id);
    }

    public User upsertOAuthUser(String googleId, String name, String email, String pictureUrl, Role desiredRole, UserStatus desiredStatus) {
        String resolvedEmail = Objects.requireNonNull(email, "Email is required");
        Role targetRole = desiredRole != null ? desiredRole : Role.USER;
        UserStatus targetStatus;
        if (desiredStatus != null) {
            targetStatus = desiredStatus;
        } else if (targetRole == Role.TECHNICIAN) {
            targetStatus = UserStatus.PENDING;
        } else {
            targetStatus = UserStatus.APPROVED;
        }

        return userRepository
            .findByEmail(resolvedEmail)
            .map(existing -> {
                existing.setName(name);
                existing.setProfileImage(pictureUrl);
                if (googleId != null && !googleId.isBlank()) {
                    existing.setGoogleId(googleId);
                }
                existing.setProvider(AuthProvider.GOOGLE);
                // Preserve existing role/status unless an explicit desired role/status was provided
                if (desiredRole != null) {
                    existing.setRole(targetRole);
                }
                if (desiredStatus != null) {
                    existing.setStatus(targetStatus);
                }
                // If existing has no role/status, backfill sensible defaults
                if (existing.getRole() == null) {
                    existing.setRole(targetRole);
                }
                if (existing.getStatus() == null) {
                    existing.setStatus(targetStatus);
                }
                return userRepository.save(existing);
            })
            .orElseGet(() -> {
                User user = new User();
                user.setGoogleId(googleId);
                user.setName(name);
                user.setEmail(email);
                user.setProfileImage(pictureUrl);
                user.setRole(targetRole);
                user.setProvider(AuthProvider.GOOGLE);
                user.setStatus(targetStatus);
                return userRepository.save(user);
            });
    }

    public List<User> findPendingTechnicians() {
        return userRepository.findByRoleAndStatus(Role.TECHNICIAN, UserStatus.PENDING);
    }

    public User updateStatus(Long id, UserStatus status) {
        User existing = findById(id);
        existing.setStatus(status);
        return userRepository.save(existing);
    }

    public User updateProfileImage(Long id, String profileImage) {
        User existing = findById(id);
        existing.setProfileImage(profileImage);
        return userRepository.save(existing);
    }

    public User disable(Long id) {
        return updateStatus(id, UserStatus.DISABLED);
    }
}
