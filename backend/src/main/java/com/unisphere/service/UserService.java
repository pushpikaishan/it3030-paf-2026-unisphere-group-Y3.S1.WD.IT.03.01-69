package com.unisphere.service;

import com.unisphere.entity.AuthProvider;
import com.unisphere.entity.Role;
import com.unisphere.entity.User;
import com.unisphere.repository.UserRepository;
import java.util.List;
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
        if (user.getProvider() == AuthProvider.LOCAL && (user.getPassword() == null || user.getPassword().isBlank())) {
            throw new IllegalArgumentException("Password is required for local users");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
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
        if (update.getPassword() != null && !update.getPassword().isBlank()) {
            existing.setPassword(passwordEncoder.encode(update.getPassword()));
        }
        return userRepository.save(existing);
    }

    public void delete(Long id) {
        userRepository.deleteById(id);
    }

    public User upsertOAuthUser(String name, String email, String pictureUrl) {
        return userRepository
            .findByEmail(email)
            .map(existing -> {
                existing.setName(name);
                existing.setProfileImage(pictureUrl);
                return userRepository.save(existing);
            })
            .orElseGet(() -> {
                User user = new User();
                user.setName(name);
                user.setEmail(email);
                user.setProfileImage(pictureUrl);
                user.setRole(Role.USER);
                return userRepository.save(user);
            });
    }
}
