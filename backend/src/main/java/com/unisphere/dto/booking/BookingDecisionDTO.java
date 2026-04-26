package com.unisphere.dto.booking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BookingDecisionDTO {

    @NotBlank(message = "Reject reason is required")
    @Size(max = 500, message = "Reject reason cannot exceed 500 characters")
    private String reason;
}
