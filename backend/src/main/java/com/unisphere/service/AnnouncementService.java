package com.unisphere.service;

import com.unisphere.entity.Announcement;
import com.unisphere.entity.AnnouncementTargetRole;
import com.unisphere.repository.AnnouncementRepository;
import jakarta.persistence.EntityNotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;

    public AnnouncementService(AnnouncementRepository announcementRepository) {
        this.announcementRepository = announcementRepository;
    }

    @Transactional(readOnly = true)
    public List<Announcement> findAll() {
        return announcementRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<Announcement> findByTargetRole(AnnouncementTargetRole targetRole) {
        return announcementRepository.findAllByTargetRoleOrderByCreatedAtDesc(targetRole);
    }

    public Announcement create(AnnouncementTargetRole targetRole, String title, String message, MultipartFile attachment) {
        if (targetRole == null) {
            throw new IllegalArgumentException("Target role is required");
        }
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Message is required");
        }

        Announcement announcement = new Announcement();
        announcement.setTargetRole(targetRole);
        announcement.setTitle(resolveTitle(title, targetRole));
        announcement.setMessage(message.trim());

        if (attachment != null && !attachment.isEmpty()) {
            announcement.setAttachmentUrl(storeAttachment(attachment));
        }

        return announcementRepository.save(announcement);
    }

    public void delete(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Announcement id is required");
        }
        if (!announcementRepository.existsById(id)) {
            throw new EntityNotFoundException("Announcement not found: " + id);
        }
        announcementRepository.deleteById(id);
    }

    private String resolveTitle(String title, AnnouncementTargetRole targetRole) {
        if (title != null && !title.isBlank()) {
            return title.trim();
        }
        return "Announcement for " + targetRole.name();
    }

    private String storeAttachment(MultipartFile file) {
        Path uploadDir = Paths.get("uploads", "announcements").toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadDir);
            String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID() + (extension != null ? "." + extension : "");
            Path target = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/announcements/" + filename;
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to store attachment", ex);
        }
    }
}
