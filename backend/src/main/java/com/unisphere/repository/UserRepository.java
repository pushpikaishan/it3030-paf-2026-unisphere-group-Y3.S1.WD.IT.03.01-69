package com.unisphere.repository;

import com.unisphere.entity.User;
import com.unisphere.entity.Role;
import com.unisphere.entity.UserStatus;
import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRoleAndStatus(Role role, UserStatus status);
}
