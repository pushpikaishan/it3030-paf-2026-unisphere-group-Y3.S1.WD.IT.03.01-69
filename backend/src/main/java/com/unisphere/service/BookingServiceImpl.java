package com.unisphere.service;

import com.unisphere.dto.booking.BookingRequestDTO;
import com.unisphere.dto.booking.BookingResponseDTO;
import com.unisphere.entity.Booking;
import com.unisphere.entity.BookingStatus;
import com.unisphere.entity.Notification;
import com.unisphere.entity.Resource;
import com.unisphere.entity.ResourceStatus;
import com.unisphere.entity.User;
import com.unisphere.exception.BookingConflictException;
import com.unisphere.exception.BookingNotFoundException;
import com.unisphere.exception.ResourceNotFoundException;
import com.unisphere.repository.BookingRepository;
import com.unisphere.repository.ResourceRepository;
import com.unisphere.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.lang.NonNull;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class BookingServiceImpl implements BookingService {

    private static final String CONFLICT_MESSAGE = "This resource is already booked for the selected time.";

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    public BookingResponseDTO requestBooking(BookingRequestDTO request, String requesterEmail) {
        validateTimeRange(request.getStartTime(), request.getEndTime());

        User requester = findUserByEmail(requesterEmail);
        Resource resource = findResource(request.getResourceId());

        ensureResourceIsBookable(resource);
        ensureNoConflictForCreate(resource.getId(), request.getBookingDate(), request.getStartTime(), request.getEndTime());

        Booking booking = Booking.builder()
            .resource(resource)
            .user(requester)
            .bookingDate(request.getBookingDate())
            .startTime(request.getStartTime())
            .endTime(request.getEndTime())
            .purpose(request.getPurpose().trim())
            .expectedAttendees(request.getExpectedAttendees())
            .status(BookingStatus.PENDING)
            .build();

        Booking saved = bookingRepository.save(Objects.requireNonNull(booking));
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getMyBookings(String requesterEmail) {
        User requester = findUserByEmail(requesterEmail);
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(requester.getId()).stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponseDTO> getAllBookings(BookingStatus status, Long resourceId, LocalDate bookingDate, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(safePage, safeSize);

        Specification<Booking> specification = (root, query, cb) -> cb.conjunction();

        if (status != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }

        if (resourceId != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("resource").get("id"), resourceId));
        }

        if (bookingDate != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("bookingDate"), bookingDate));
        }

        return bookingRepository.findAll(specification, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponseDTO getBookingById(Long id, String requesterEmail, boolean isAdmin) {
        Booking booking = findBooking(id);

        if (!isAdmin && !isOwner(booking, requesterEmail)) {
            throw new AccessDeniedException("You are not allowed to view this booking");
        }

        return toResponse(booking);
    }

    @Override
    public BookingResponseDTO approveBooking(Long id) {
        Booking booking = findBooking(id);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalArgumentException("Only pending bookings can be approved");
        }

        ensureResourceIsBookable(booking.getResource());
        ensureNoConflictForApprove(booking);

        booking.setStatus(BookingStatus.APPROVED);
        booking.setAdminReason(null);

        Booking updated = bookingRepository.save(booking);
        notifyUser(
            updated.getUser().getId(),
            "Booking Approved",
            buildStatusMessage(updated, "approved")
        );

        return toResponse(updated);
    }

    @Override
    public BookingResponseDTO rejectBooking(Long id, String reason) {
        Booking booking = findBooking(id);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalArgumentException("Only pending bookings can be rejected");
        }

        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Reject reason is required");
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setAdminReason(reason.trim());

        Booking updated = bookingRepository.save(booking);
        notifyUser(
            updated.getUser().getId(),
            "Booking Rejected",
            buildStatusMessage(updated, "rejected") + " Reason: " + updated.getAdminReason()
        );

        return toResponse(updated);
    }

    @Override
    public BookingResponseDTO cancelBooking(Long id, String requesterEmail, boolean isAdmin) {
        Booking booking = findBooking(id);

        if (!isAdmin && !isOwner(booking, requesterEmail)) {
            throw new AccessDeniedException("You are not allowed to cancel this booking");
        }

        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.APPROVED) {
            throw new IllegalArgumentException("Only pending or approved bookings can be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        if (isAdmin && !isOwner(booking, requesterEmail)) {
            booking.setAdminReason("Cancelled by admin");
        }

        Booking updated = bookingRepository.save(booking);
        notifyUser(
            updated.getUser().getId(),
            "Booking Cancelled",
            buildStatusMessage(updated, "cancelled")
        );

        return toResponse(updated);
    }

    @Override
    public void deleteBooking(Long id) {
        Booking booking = findBooking(id);
        bookingRepository.delete(Objects.requireNonNull(booking));
    }

    private Booking findBooking(@NonNull Long id) {
        return bookingRepository.findById(id).orElseThrow(() -> new BookingNotFoundException(id));
    }

    private Resource findResource(@NonNull Long resourceId) {
        return resourceRepository.findById(resourceId).orElseThrow(() -> new ResourceNotFoundException(resourceId));
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Authenticated user is not found"));
    }

    private void ensureResourceIsBookable(Resource resource) {
        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            throw new IllegalArgumentException("Only active resources can be booked");
        }
    }

    private void validateTimeRange(LocalTime startTime, LocalTime endTime) {
        if (startTime == null || endTime == null || !endTime.isAfter(startTime)) {
            throw new IllegalArgumentException("End time must be after start time");
        }
    }

    private void ensureNoConflictForCreate(Long resourceId, LocalDate bookingDate, LocalTime startTime, LocalTime endTime) {
        boolean conflict = bookingRepository.existsByResourceIdAndBookingDateAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
            resourceId,
            bookingDate,
            List.of(BookingStatus.PENDING, BookingStatus.APPROVED),
            endTime,
            startTime
        );

        if (conflict) {
            throw new BookingConflictException(CONFLICT_MESSAGE);
        }
    }

    private void ensureNoConflictForApprove(Booking booking) {
        boolean conflict = bookingRepository.existsByResourceIdAndBookingDateAndStatusInAndIdNotAndStartTimeLessThanAndEndTimeGreaterThan(
            booking.getResource().getId(),
            booking.getBookingDate(),
            List.of(BookingStatus.APPROVED),
            booking.getId(),
            booking.getEndTime(),
            booking.getStartTime()
        );

        if (conflict) {
            throw new BookingConflictException(CONFLICT_MESSAGE);
        }
    }

    private boolean isOwner(Booking booking, String requesterEmail) {
        return booking.getUser().getEmail() != null
            && booking.getUser().getEmail().toLowerCase(Locale.ROOT).equals(requesterEmail.toLowerCase(Locale.ROOT));
    }

    private void notifyUser(Long userId, String title, String message) {
        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType("BOOKING");
        notificationService.create(notification, userId);
    }

    private String buildStatusMessage(Booking booking, String verb) {
        return "Your booking for " + booking.getResource().getName()
            + " on " + booking.getBookingDate()
            + " (" + booking.getStartTime() + " - " + booking.getEndTime() + ") was " + verb + ".";
    }

    private BookingResponseDTO toResponse(Booking booking) {
        return BookingResponseDTO.builder()
            .id(booking.getId())
            .resourceId(booking.getResource().getId())
            .resourceName(booking.getResource().getName())
            .resourceLocation(booking.getResource().getLocation())
            .userId(booking.getUser().getId())
            .userName(booking.getUser().getName())
            .userEmail(booking.getUser().getEmail())
            .bookingDate(booking.getBookingDate())
            .startTime(booking.getStartTime())
            .endTime(booking.getEndTime())
            .purpose(booking.getPurpose())
            .expectedAttendees(booking.getExpectedAttendees())
            .status(booking.getStatus())
            .adminReason(booking.getAdminReason())
            .createdAt(booking.getCreatedAt())
            .updatedAt(booking.getUpdatedAt())
            .build();
    }
}
