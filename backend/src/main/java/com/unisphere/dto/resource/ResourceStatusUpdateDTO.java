package com.unisphere.dto.resource;

import com.unisphere.entity.ResourceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResourceStatusUpdateDTO {

    @NotNull(message = "Status is required")
    private ResourceStatus status;
}
