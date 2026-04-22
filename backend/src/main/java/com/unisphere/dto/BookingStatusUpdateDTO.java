package com.unisphere.dto;

import jakarta.validation.constraints.NotBlank;

public class BookingStatusUpdateDTO {

    @NotBlank(message = "Rejection reason is required")
    private String rejectionReason;

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
}