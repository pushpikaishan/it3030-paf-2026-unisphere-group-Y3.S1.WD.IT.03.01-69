package com.unisphere.controller;

import com.unisphere.dto.support.CreateSupportRequest;
import com.unisphere.dto.support.ResolveSupportRequest;
import com.unisphere.entity.SupportRequest;
import com.unisphere.service.SupportRequestService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/support-requests")
public class SupportRequestController {

    private final SupportRequestService supportRequestService;

    public SupportRequestController(SupportRequestService supportRequestService) {
        this.supportRequestService = supportRequestService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> create(@Valid @RequestBody CreateSupportRequest request) {
        supportRequestService.create(request);
        return ResponseEntity.ok(Map.of("message", "Your message was sent to the admin team."));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public List<SupportRequest> all() {
        return supportRequestService.findAll();
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public SupportRequest resolve(@PathVariable Long id, @Valid @RequestBody ResolveSupportRequest request) {
        return supportRequestService.resolve(id, request);
    }
}
