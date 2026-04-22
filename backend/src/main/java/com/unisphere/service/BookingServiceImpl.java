package com.unisphere.service;

import com.unisphere.dto.BookingRequestDTO;
import com.unisphere.dto.BookingResponseDTO;
import com.unisphere.entity.Booking;
import com.unisphere.entity.BookingStatus;
import com.unisphere.entity.User;
import com.unisphere.exception.BookingConflictException;
import com.unisphere.exception.ResourceNotFoundException;
import com.unisphere.repository.BookingRepository;
import com.unisphere.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class BookingServiceImpl implements BookingService {

    private static final List<BookingStatus> ACTIVE_STATUSES = List.of(BookingStatus.PENDING, BookingStatus.APPROVED);

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    public BookingServiceImpl(BookingRepository bookingRepository, UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
    }

    @Override
    public BookingResponseDTO createBooking(User currentUser, BookingRequestDTO request) {
        // MEMBER 2: overlap validation is enforced before a booking is persisted.
        validateRequest(request);
        ensureNoConflict(null, request.getResourceName(), request.getBookingDate(), request.getStartTime(), request.getEndTime());

        Booking booking = new Booking();
        booking.setUser(resolveManagedUser(currentUser));
        booking.setResourceName(request.getResourceName().trim());
        booking.setBookingDate(request.getBookingDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose().trim());
        booking.setExpectedAttendees(request.getExpectedAttendees());
        booking.setStatus(BookingStatus.PENDING);

        return BookingResponseDTO.fromEntity(bookingRepository.save(booking));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getMyBookings(User currentUser) {
        return bookingRepository.findByUserIdOrderByBookingDateDescStartTimeDesc(currentUser.getId()).stream()
            .map(BookingResponseDTO::fromEntity)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getAllBookings(String status, String resourceName, LocalDate bookingDate) {
        return bookingRepository.findAllByOrderByBookingDateDescStartTimeDescCreatedAtDesc().stream()
            .filter(booking -> status == null || booking.getStatus().name().equalsIgnoreCase(status))
            .filter(booking -> resourceName == null || booking.getResourceName().toLowerCase(Locale.ROOT).contains(resourceName.toLowerCase(Locale.ROOT).trim()))
            .filter(booking -> bookingDate == null || booking.getBookingDate().equals(bookingDate))
            .map(BookingResponseDTO::fromEntity)
            .toList();
    }

    @Override
    public BookingResponseDTO approveBooking(Long bookingId) {
        // MEMBER 2: approval repeats the conflict check so pending bookings cannot be approved into a clash.
        Booking booking = getBookingOrThrow(bookingId);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalArgumentException("Only pending bookings can be approved");
        }
        ensureNoConflict(booking.getId(), booking.getResourceName(), booking.getBookingDate(), booking.getStartTime(), booking.getEndTime());
        booking.setStatus(BookingStatus.APPROVED);
        booking.setRejectionReason(null);
        return BookingResponseDTO.fromEntity(bookingRepository.save(booking));
    }

    @Override
    public BookingResponseDTO rejectBooking(Long bookingId, String rejectionReason) {
        Booking booking = getBookingOrThrow(bookingId);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalArgumentException("Only pending bookings can be rejected");
        }
        if (rejectionReason == null || rejectionReason.isBlank()) {
            throw new IllegalArgumentException("Rejection reason is required");
        }
        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(rejectionReason.trim());
        return BookingResponseDTO.fromEntity(bookingRepository.save(booking));
    }

    @Override
    public BookingResponseDTO cancelBooking(Long bookingId, User currentUser) {
        Booking booking = getBookingOrThrow(bookingId);
        if (booking.getUser() == null || !Objects.equals(booking.getUser().getId(), currentUser.getId())) {
            throw new AccessDeniedException("You can only cancel your own bookings");
        }
        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new IllegalArgumentException("Only approved bookings can be cancelled");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setRejectionReason(null);
        return BookingResponseDTO.fromEntity(bookingRepository.save(booking));
    }

    private void validateRequest(BookingRequestDTO request) {
        if (request == null) {
            throw new IllegalArgumentException("Booking request is required");
        }
        if (request.getResourceName() == null || request.getResourceName().isBlank()) {
            throw new IllegalArgumentException("Resource is required");
        }
        if (request.getBookingDate() == null) {
            throw new IllegalArgumentException("Booking date is required");
        }
        if (request.getStartTime() == null) {
            throw new IllegalArgumentException("Start time is required");
        }
        if (request.getEndTime() == null) {
            throw new IllegalArgumentException("End time is required");
        }
        if (request.getPurpose() == null || request.getPurpose().isBlank()) {
            throw new IllegalArgumentException("Purpose is required");
        }
        if (request.getExpectedAttendees() == null || request.getExpectedAttendees() < 1) {
            throw new IllegalArgumentException("Expected attendees must be at least 1");
        }
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new IllegalArgumentException("End time must be after start time");
        }
    }

    private void ensureNoConflict(Long bookingId, String resourceName, LocalDate bookingDate, LocalTime startTime, LocalTime endTime) {
        long conflicts = bookingRepository.countConflicts(bookingId, resourceName.trim(), bookingDate, startTime, endTime, ACTIVE_STATUSES);
        if (conflicts > 0) {
            throw new BookingConflictException("This resource is already booked for the selected date and time");
        }
    }

    private Booking getBookingOrThrow(Long bookingId) {
        return bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
    }

    private User resolveManagedUser(User currentUser) {
        if (currentUser.getId() != null) {
            return userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        }
        return userRepository.findByEmail(currentUser.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}