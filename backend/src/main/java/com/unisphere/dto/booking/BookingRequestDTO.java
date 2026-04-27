package com.unisphere.dto.booking;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BookingRequestDTO {
    private static final LocalTime BOOKING_START_WINDOW = LocalTime.of(8, 0);
    private static final LocalTime BOOKING_END_WINDOW = LocalTime.of(19, 0);

    @NotNull(message = "Resource is required")
    private Long resourceId;

    @NotNull(message = "Booking date is required")
    @FutureOrPresent(message = "Booking date cannot be in the past")
    private LocalDate bookingDate;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @NotBlank(message = "Purpose is required")
    @Size(max = 500, message = "Purpose cannot exceed 500 characters")
    private String purpose;

    @NotNull(message = "Expected attendees is required")
    @Positive(message = "Expected attendees must be positive")
    private Integer expectedAttendees;

    @AssertTrue(message = "Bookings must be exactly 2 hours")
    public boolean isTimeRangeValid() {
        if (startTime == null || endTime == null) {
            return true;
        }
        return endTime.equals(startTime.plusHours(2));
    }

    @AssertTrue(message = "Bookings must be within 08:00 to 19:00")
    public boolean isWithinBookingWindow() {
        if (startTime == null || endTime == null) {
            return true;
        }
        return !startTime.isBefore(BOOKING_START_WINDOW) && !endTime.isAfter(BOOKING_END_WINDOW);
    }

    @AssertTrue(message = "Bookings must be on the hour")
    public boolean isOnHourBoundary() {
        if (startTime == null || endTime == null) {
            return true;
        }
        return startTime.getMinute() == 0
            && startTime.getSecond() == 0
            && startTime.getNano() == 0
            && endTime.getMinute() == 0
            && endTime.getSecond() == 0
            && endTime.getNano() == 0;
    }
}
