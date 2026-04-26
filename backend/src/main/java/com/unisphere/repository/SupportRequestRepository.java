package com.unisphere.repository;

import com.unisphere.entity.SupportRequest;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportRequestRepository extends JpaRepository<SupportRequest, Long> {
    List<SupportRequest> findAllByOrderByCreatedAtDesc();
}
