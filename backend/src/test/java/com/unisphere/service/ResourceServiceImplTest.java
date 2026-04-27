package com.unisphere.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.unisphere.dto.resource.ResourceCreateDTO;
import com.unisphere.dto.resource.ResourceStatusUpdateDTO;
import com.unisphere.entity.Resource;
import com.unisphere.entity.ResourceStatus;
import com.unisphere.entity.ResourceType;
import com.unisphere.exception.DuplicateResourceException;
import com.unisphere.exception.ResourceHasActiveBookingsException;
import com.unisphere.exception.ResourceNotFoundException;
import com.unisphere.repository.ResourceRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;

@ExtendWith(MockitoExtension.class)
class ResourceServiceImplTest {

    @Mock
    private ResourceRepository resourceRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private ResourceServiceImpl resourceService;

    private Resource resource;

    @BeforeEach
    void setUp() {
        resource = Resource.builder()
            .id(1L)
            .name("Hall A")
            .type(ResourceType.LECTURE_HALL)
            .capacity(150)
            .location("Block A")
            .status(ResourceStatus.ACTIVE)
            .description("Main lecture hall")
            .availabilityWindows("Mon-Fri 8:00-17:00")
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
    }

    @Test
    void createResource_shouldSaveWhenNameUnique() {
        ResourceCreateDTO dto = new ResourceCreateDTO();
        dto.setName("Hall A");
        dto.setType(ResourceType.LECTURE_HALL);
        dto.setCapacity(100);
        dto.setLocation("Block A");
        dto.setStatus(ResourceStatus.ACTIVE);

        when(resourceRepository.existsByNameIgnoreCase("Hall A")).thenReturn(false);
        when(resourceRepository.save(any(Resource.class))).thenReturn(resource);

        var result = resourceService.createResource(dto);

        assertEquals("Hall A", result.getName());
        verify(resourceRepository).save(any(Resource.class));
    }

    @Test
    void createResource_shouldThrowWhenDuplicateName() {
        ResourceCreateDTO dto = new ResourceCreateDTO();
        dto.setName("Hall A");
        dto.setType(ResourceType.LECTURE_HALL);
        dto.setCapacity(100);
        dto.setLocation("Block A");
        dto.setStatus(ResourceStatus.ACTIVE);

        when(resourceRepository.existsByNameIgnoreCase("Hall A")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> resourceService.createResource(dto));
        verify(resourceRepository, never()).save(any(Resource.class));
    }

    @Test
    void getResourceById_shouldThrowWhenMissing() {
        when(resourceRepository.findById(404L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> resourceService.getResourceById(404L));
    }

    @Test
    void updateStatus_shouldUpdateStatus() {
        ResourceStatusUpdateDTO dto = new ResourceStatusUpdateDTO();
        dto.setStatus(ResourceStatus.OUT_OF_SERVICE);

        when(resourceRepository.findById(1L)).thenReturn(Optional.of(resource));
        when(resourceRepository.save(any(Resource.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = resourceService.updateStatus(1L, dto);

        assertEquals(ResourceStatus.OUT_OF_SERVICE, result.getStatus());
    }

    @Test
    void deleteResource_shouldThrowWhenActiveBookingsExist() {
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(resource));
        when(jdbcTemplate.queryForObject(any(String.class), eq(Integer.class), eq(1L))).thenReturn(2);

        assertThrows(ResourceHasActiveBookingsException.class, () -> resourceService.deleteResource(1L));
        verify(resourceRepository, never()).delete(any(Resource.class));
    }

    @Test
    void deleteResource_shouldDeleteWhenBookingTableUnavailable() {
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(resource));
        when(jdbcTemplate.queryForObject(any(String.class), eq(Integer.class), eq(1L)))
            .thenThrow(new DataAccessResourceFailureException("bookings table missing"));

        resourceService.deleteResource(1L);

        verify(resourceRepository).delete(resource);
    }

    @Test
    void getResources_shouldApplyPageDefaults() {
        when(resourceRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(PageRequest.class)))
            .thenReturn(new PageImpl<>(java.util.List.of(resource), PageRequest.of(0, 10), 1));

        var page = resourceService.getResources(null, null, null, null, null, -1, 0);

        assertEquals(1, page.getTotalElements());
        assertTrue(page.getContent().stream().anyMatch(r -> "Hall A".equals(r.getName())));
    }
}
