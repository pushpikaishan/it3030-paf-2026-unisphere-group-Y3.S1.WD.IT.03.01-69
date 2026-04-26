package com.unisphere.repository;

import com.unisphere.entity.Announcement;
import com.unisphere.entity.AnnouncementTargetRole;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findAllByOrderByCreatedAtDesc();
    List<Announcement> findAllByTargetRoleOrderByCreatedAtDesc(AnnouncementTargetRole targetRole);
}
