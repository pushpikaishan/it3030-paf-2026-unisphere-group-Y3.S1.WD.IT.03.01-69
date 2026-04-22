package com.unisphere.service;

import com.unisphere.dto.BookingRequestDTO;
import com.unisphere.dto.BookingResponseDTO;
import com.unisphere.entity.User;
import java.time.LocalDate;
import java.util.List;

public interface BookingService {

    BookingResponseDTO createBooking(User currentUser, BookingRequestDTO request);

    List<BookingResponseDTO> getMyBookings(User currentUser);

    List<BookingResponseDTO> getAllBookings(String status, String resourceName, LocalDate bookingDate);

    BookingResponseDTO approveBooking(Long bookingId);

    BookingResponseDTO rejectBooking(Long bookingId, String rejectionReason);

    BookingResponseDTO cancelBooking(Long bookingId, User currentUser);
}