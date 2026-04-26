package com.unisphere.controller;

import com.unisphere.dto.resource.ResourceCreateDTO;
import com.unisphere.dto.resource.ResourceResponseDTO;
import com.unisphere.dto.resource.ResourceStatusUpdateDTO;
import com.unisphere.dto.resource.ResourceUpdateDTO;
import com.unisphere.entity.ResourceStatus;
import com.unisphere.entity.ResourceType;
import com.unisphere.entity.User;
import com.unisphere.repository.UserRepository;
import io.jsonwebtoken.Claims;
import com.unisphere.service.ResourceService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<Page<ResourceResponseDTO>> getResources(
        @RequestParam(required = false) ResourceType type,
        @RequestParam(required = false) Integer minCapacity,
        @RequestParam(required = false) String location,
        @RequestParam(required = false) ResourceStatus status,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(resourceService.getResources(type, minCapacity, location, status, search, page, size));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ResourceResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(resourceService.getResourceById(id));
    }

    @GetMapping("/types")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<List<ResourceType>> getTypes() {
        return ResponseEntity.ok(Arrays.asList(ResourceType.values()));
    }

    @GetMapping("/my-selections")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ResourceResponseDTO>> getMySelections(Authentication authentication) {
        Long userId = extractCurrentUserId(authentication);
        return ResponseEntity.ok(resourceService.getSelectedResourcesForUser(userId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceResponseDTO> create(@Valid @RequestBody ResourceCreateDTO request) {
        ResourceResponseDTO created = resourceService.createResource(request);
        return ResponseEntity.created(URI.create("/api/resources/" + created.getId())).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceResponseDTO> update(@PathVariable Long id, @Valid @RequestBody ResourceUpdateDTO request) {
        return ResponseEntity.ok(resourceService.updateResource(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        resourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceResponseDTO> updateStatus(@PathVariable Long id, @Valid @RequestBody ResourceStatusUpdateDTO request) {
        return ResponseEntity.ok(resourceService.updateStatus(id, request));
    }

    private Long extractCurrentUserId(Authentication authentication) {
        if (authentication == null) {
            return null;
        }

        Object details = authentication.getDetails();
        if (details instanceof Claims claims) {
            Number id = claims.get("id", Number.class);
            if (id != null) {
                return id.longValue();
            }
        }

        String email = authentication.getName();
        if (email == null || email.isBlank()) {
            return null;
        }

        return userRepository.findByEmail(email).map(User::getId).orElse(null);
    }
}
