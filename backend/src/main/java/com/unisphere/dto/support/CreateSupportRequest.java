package com.unisphere.dto.support;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateSupportRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Email is invalid")
    @Size(max = 100, message = "Email is too long")
    String email,

    @NotBlank(message = "Message is required")
    @Size(max = 4000, message = "Message is too long")
    String message
) {}
