package com.unisphere.service;

import com.unisphere.dto.booking.BookingRequestDTO;
import com.unisphere.dto.booking.BookingResponseDTO;
import com.unisphere.entity.BookingStatus;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;

public interface BookingService {

    BookingResponseDTO requestBooking(BookingRequestDTO request, String requesterEmail);

    List<BookingResponseDTO> getMyBookings(String requesterEmail);

    Page<BookingResponseDTO> getAllBookings(BookingStatus status, Long resourceId, LocalDate bookingDate, int page, int size);

    BookingResponseDTO getBookingById(Long id, String requesterEmail, boolean isAdmin);

    BookingResponseDTO approveBooking(Long id);

    BookingResponseDTO rejectBooking(Long id, String reason);

    BookingResponseDTO cancelBooking(Long id, String requesterEmail, boolean isAdmin);

    void deleteBooking(Long id);
}
