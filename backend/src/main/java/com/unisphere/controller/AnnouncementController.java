package com.unisphere.controller;

import com.unisphere.entity.Announcement;
import com.unisphere.entity.AnnouncementTargetRole;
import com.unisphere.service.AnnouncementService;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    private final AnnouncementService announcementService;

    public AnnouncementController(AnnouncementService announcementService) {
        this.announcementService = announcementService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public List<Announcement> all() {
        return announcementService.findAll();
    }

    @GetMapping("/me")
    public List<Announcement> myAnnouncements(Authentication authentication) {
        boolean isTechnician = authentication.getAuthorities().stream()
            .anyMatch(a -> "ROLE_TECHNICIAN".equals(a.getAuthority()));
        boolean isUser = authentication.getAuthorities().stream()
            .anyMatch(a -> "ROLE_USER".equals(a.getAuthority()));

        if (isTechnician) {
            return announcementService.findByTargetRole(AnnouncementTargetRole.TECHNICIAN);
        }

        if (isUser) {
            return announcementService.findByTargetRole(AnnouncementTargetRole.USER);
        }

        return List.of();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Announcement create(
        @RequestParam("targetRole") AnnouncementTargetRole targetRole,
        @RequestParam(value = "title", required = false) String title,
        @RequestParam("message") String message,
        @RequestParam(value = "attachment", required = false) MultipartFile attachment
    ) {
        return announcementService.create(targetRole, title, message, attachment);
    }
}
