package com.unisphere.service;

import com.unisphere.dto.resource.ResourceCreateDTO;
import com.unisphere.dto.resource.ResourceResponseDTO;
import com.unisphere.dto.resource.ResourceStatusUpdateDTO;
import com.unisphere.dto.resource.ResourceUpdateDTO;
import com.unisphere.entity.Resource;
import com.unisphere.entity.ResourceStatus;
import com.unisphere.entity.ResourceType;
import com.unisphere.exception.DuplicateResourceException;
import com.unisphere.exception.ResourceHasActiveBookingsException;
import com.unisphere.exception.ResourceNotFoundException;
import com.unisphere.repository.ResourceRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional(readOnly = true)
    public Page<ResourceResponseDTO> getResources(
        ResourceType type,
        Integer minCapacity,
        String location,
        ResourceStatus status,
        String search,
        int page,
        int size
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(safePage, safeSize);

        Specification<Resource> specification = Specification.where(null);

        if (type != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("type"), type));
        }
        if (minCapacity != null) {
            specification = specification.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("capacity"), minCapacity));
        }
        if (location != null && !location.isBlank()) {
            String locationLike = "%" + location.trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, query, cb) -> cb.like(cb.lower(root.get("location")), locationLike));
        }
        if (status != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (search != null && !search.isBlank()) {
            String likeSearch = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("name")), likeSearch),
                cb.like(cb.lower(root.get("location")), likeSearch),
                cb.like(cb.lower(cb.coalesce(root.get("description"), "")), likeSearch)
            ));
        }

        return resourceRepository.findAll(specification, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ResourceResponseDTO getResourceById(Long id) {
        return toResponse(findResource(id));
    }

    @Override
    public ResourceResponseDTO createResource(ResourceCreateDTO request) {
        validateCapacity(request.getCapacity());

        if (resourceRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new DuplicateResourceException(request.getName().trim());
        }

        Resource resource = Resource.builder()
            .name(request.getName().trim())
            .type(request.getType())
            .capacity(request.getCapacity())
            .location(request.getLocation().trim())
            .availabilityWindows(request.getAvailabilityWindows())
            .status(request.getStatus())
            .description(request.getDescription())
            .imageUrl(request.getImageUrl())
            .build();

        return toResponse(resourceRepository.save(resource));
    }

    @Override
    public ResourceResponseDTO updateResource(Long id, ResourceUpdateDTO request) {
        validateCapacity(request.getCapacity());

        Resource existing = findResource(id);
        String updatedName = request.getName().trim();

        if (resourceRepository.existsByNameIgnoreCaseAndIdNot(updatedName, id)) {
            throw new DuplicateResourceException(updatedName);
        }

        existing.setName(updatedName);
        existing.setType(request.getType());
        existing.setCapacity(request.getCapacity());
        existing.setLocation(request.getLocation().trim());
        existing.setAvailabilityWindows(request.getAvailabilityWindows());
        existing.setStatus(request.getStatus());
        existing.setDescription(request.getDescription());
        existing.setImageUrl(request.getImageUrl());

        return toResponse(resourceRepository.save(existing));
    }

    @Override
    public void deleteResource(Long id) {
        Resource existing = findResource(id);

        if (hasActiveBookings(existing.getId())) {
            throw new ResourceHasActiveBookingsException(id);
        }

        resourceRepository.delete(existing);
    }

    @Override
    public ResourceResponseDTO updateStatus(Long id, ResourceStatusUpdateDTO request) {
        Resource existing = findResource(id);
        existing.setStatus(request.getStatus());
        return toResponse(resourceRepository.save(existing));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResourceResponseDTO> getSelectedResourcesForUser(Long userId) {
        if (userId == null) {
            return List.of();
        }

        try {
            return jdbcTemplate.query(
                """
                SELECT DISTINCT r.id, r.name, r.type, r.capacity, r.location, r.availability_windows,
                                r.status, r.description, r.image_url, r.created_at, r.updated_at
                FROM bookings b
                JOIN resources r ON r.id = b.resource_id
                WHERE b.user_id = ?
                  AND (b.status IS NULL OR UPPER(b.status) NOT IN ('CANCELLED', 'COMPLETED', 'REJECTED'))
                ORDER BY r.name ASC
                """,
                (rs, rowNum) -> ResourceResponseDTO.builder()
                    .id(rs.getLong("id"))
                    .name(rs.getString("name"))
                    .type(parseResourceType(rs.getString("type")))
                    .capacity(rs.getObject("capacity", Integer.class))
                    .location(rs.getString("location"))
                    .availabilityWindows(rs.getString("availability_windows"))
                    .status(parseResourceStatus(rs.getString("status")))
                    .description(rs.getString("description"))
                    .imageUrl(rs.getString("image_url"))
                    .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
                    .updatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null)
                    .build(),
                userId
            );
        } catch (DataAccessException ex) {
            return new ArrayList<>();
        }
    }

    private Resource findResource(Long id) {
        return resourceRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException(id));
    }

    private void validateCapacity(Integer capacity) {
        if (capacity == null || capacity < 1) {
            throw new IllegalArgumentException("Capacity must be positive");
        }
    }

    private boolean hasActiveBookings(Long resourceId) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM bookings WHERE resource_id = ? AND (status IS NULL OR UPPER(status) NOT IN ('CANCELLED', 'COMPLETED', 'REJECTED'))",
                Integer.class,
                resourceId
            );
            return count != null && count > 0;
        } catch (DataAccessException ex) {
            return false;
        }
    }

    private ResourceType parseResourceType(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return ResourceType.valueOf(value.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private ResourceStatus parseResourceStatus(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return ResourceStatus.valueOf(value.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private ResourceResponseDTO toResponse(Resource resource) {
        return ResourceResponseDTO.builder()
            .id(resource.getId())
            .name(resource.getName())
            .type(resource.getType())
            .capacity(resource.getCapacity())
            .location(resource.getLocation())
            .availabilityWindows(resource.getAvailabilityWindows())
            .status(resource.getStatus())
            .description(resource.getDescription())
            .imageUrl(resource.getImageUrl())
            .createdAt(resource.getCreatedAt())
            .updatedAt(resource.getUpdatedAt())
            .build();
    }
}
