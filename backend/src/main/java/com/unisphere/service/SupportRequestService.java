package com.unisphere.service;

import com.unisphere.dto.support.CreateSupportRequest;
import com.unisphere.dto.support.ResolveSupportRequest;
import com.unisphere.entity.SupportRequest;
import com.unisphere.repository.SupportRequestRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SupportRequestService {

    private final SupportRequestRepository supportRequestRepository;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String smtpSender;

    public SupportRequestService(SupportRequestRepository supportRequestRepository, JavaMailSender mailSender) {
        this.supportRequestRepository = supportRequestRepository;
        this.mailSender = mailSender;
    }

    public SupportRequest create(CreateSupportRequest request) {
        SupportRequest supportRequest = new SupportRequest();
        supportRequest.setEmail(request.email().trim());
        supportRequest.setUserMessage(request.message().trim());
        return supportRequestRepository.save(supportRequest);
    }

    @Transactional(readOnly = true)
    public List<SupportRequest> findAll() {
        return supportRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    public SupportRequest resolve(Long id, ResolveSupportRequest request) {
        SupportRequest supportRequest = supportRequestRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Support request not found"));

        if (supportRequest.isResolved()) {
            throw new IllegalArgumentException("This support request is already resolved");
        }

        if (smtpSender == null || smtpSender.isBlank()) {
            throw new IllegalStateException("SMTP sender is not configured");
        }

        String adminMessage = request.adminMessage().trim();
        sendReplyEmail(supportRequest, adminMessage);

        supportRequest.setAdminReply(adminMessage);
        supportRequest.setResolved(true);
        supportRequest.setResolvedAt(LocalDateTime.now());
        return supportRequestRepository.save(supportRequest);
    }

    private void sendReplyEmail(SupportRequest supportRequest, String adminMessage) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(smtpSender);
        message.setTo(supportRequest.getEmail());
        message.setSubject("UniSphere Support Response");
        message.setText(
            "Hello,\n\n" +
            "We reviewed your request and responded below.\n\n" +
            "Your message:\n" + supportRequest.getUserMessage() + "\n\n" +
            "Admin response:\n" + adminMessage + "\n\n" +
            "Regards,\nUniSphere Admin Team"
        );
        mailSender.send(message);
    }
}
