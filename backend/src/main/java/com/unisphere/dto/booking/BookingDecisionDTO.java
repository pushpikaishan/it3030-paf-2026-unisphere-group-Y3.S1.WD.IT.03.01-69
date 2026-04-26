package com.unisphere.dto.booking;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BookingDecisionDTO {

    @NotBlank(message = "Rejection reason is required")
    @Size(max = 500, message = "Reject reason cannot exceed 500 characters")
    @JsonAlias({"reason", "rejectionReason"})
    private String reason;
}
