package com.unisphere.controller;

import com.unisphere.entity.Notification;
import com.unisphere.service.NotificationService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<Notification> all(@RequestParam(name = "userId", required = false) Long userId) {
        if (userId != null) {
            return notificationService.findByUserId(userId);
        }
        return notificationService.findAll();
    }

    @GetMapping("/me")
    public List<Notification> mine(Authentication authentication) {
        return notificationService.findByUserEmail(authentication.getName());
    }

    @GetMapping("/{id}")
    public Notification byId(@PathVariable Long id) {
        return notificationService.findById(id);
    }

    @PostMapping
    public ResponseEntity<Notification> create(@RequestBody Notification notification, @RequestParam Long userId) {
        return ResponseEntity.ok(notificationService.create(notification, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Notification> update(
        @PathVariable Long id,
        @RequestBody Notification notification,
        @RequestParam(required = false) Long userId
    ) {
        return ResponseEntity.ok(notificationService.update(id, notification, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        notificationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
