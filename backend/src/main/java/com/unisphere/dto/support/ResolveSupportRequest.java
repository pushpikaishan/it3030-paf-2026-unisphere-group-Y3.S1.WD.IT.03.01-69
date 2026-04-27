package com.unisphere.dto.support;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResolveSupportRequest(
    @NotBlank(message = "Admin message is required")
    @Size(max = 4000, message = "Admin message is too long")
    String adminMessage
) {}
