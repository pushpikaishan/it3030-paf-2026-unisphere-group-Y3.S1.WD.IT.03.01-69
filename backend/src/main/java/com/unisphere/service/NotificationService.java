package com.unisphere.service;

import com.unisphere.entity.Notification;
import com.unisphere.entity.User;
import com.unisphere.repository.NotificationRepository;
import com.unisphere.repository.UserRepository;
import java.util.List;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public List<Notification> findAll() {
        return notificationRepository.findAll();
    }

    public List<Notification> findByUserId(@NonNull Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public List<Notification> findByUserEmail(@NonNull String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("User not found"));
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public Notification findById(@NonNull Long id) {
        return notificationRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Notification not found"));
    }

    public Notification create(@NonNull Notification notification, @NonNull Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        notification.setUser(user);
        return notificationRepository.save(notification);
    }

    public Notification update(@NonNull Long id, @NonNull Notification update, Long userId) {
        Notification existing = findById(id);
        if (userId != null) {
            User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
            existing.setUser(user);
        }
        existing.setTitle(update.getTitle());
        existing.setMessage(update.getMessage());
        existing.setType(update.getType());
        existing.setRead(update.isRead());
        return notificationRepository.save(existing);
    }

    public void delete(@NonNull Long id) {
        notificationRepository.deleteById(id);
    }
}
