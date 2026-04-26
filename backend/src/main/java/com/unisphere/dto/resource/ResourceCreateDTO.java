package com.unisphere.dto.resource;

import com.unisphere.entity.ResourceStatus;
import com.unisphere.entity.ResourceType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResourceCreateDTO {

    @NotBlank(message = "Resource name is required")
    @Size(max = 120, message = "Name cannot exceed 120 characters")
    private String name;

    @NotNull(message = "Resource type is required")
    private ResourceType type;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @NotBlank(message = "Location is required")
    @Size(max = 120, message = "Location cannot exceed 120 characters")
    private String location;

    @Size(max = 500, message = "Availability windows cannot exceed 500 characters")
    private String availabilityWindows;

    @NotNull(message = "Status is required")
    private ResourceStatus status;

    @Size(max = 1200, message = "Description cannot exceed 1200 characters")
    private String description;

    @Size(max = 500, message = "Image URL cannot exceed 500 characters")
    private String imageUrl;
}
