package com.unisphere.dto.booking;

import com.unisphere.entity.BookingStatus;
import java.time.LocalTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingSlotDTO {
    private Long bookingId;
    private LocalTime startTime;
    private LocalTime endTime;
    private BookingStatus status;
}
