package com.unisphere.service;

import com.unisphere.dto.resource.ResourceCreateDTO;
import com.unisphere.dto.resource.ResourceResponseDTO;
import com.unisphere.dto.resource.ResourceStatusUpdateDTO;
import com.unisphere.dto.resource.ResourceUpdateDTO;

import com.unisphere.entity.ResourceStatus;
import com.unisphere.entity.ResourceType;
import java.util.List;
import org.springframework.data.domain.Page;

public interface ResourceService {

    Page<ResourceResponseDTO> getResources(

        ResourceType type,
        Integer minCapacity,
        String location,
        ResourceStatus status,
        String search,
        int page,
        int size

    );

    ResourceResponseDTO getResourceById(Long id);

    ResourceResponseDTO createResource(ResourceCreateDTO request);

    ResourceResponseDTO updateResource(Long id, ResourceUpdateDTO request);

    void deleteResource(Long id);

    ResourceResponseDTO updateStatus(Long id, ResourceStatusUpdateDTO request);


}
