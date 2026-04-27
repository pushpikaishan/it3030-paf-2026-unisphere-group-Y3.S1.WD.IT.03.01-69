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
    private static final LocalTime BOOKING_START_WINDOW = LocalTime.of(8, 0);
    private static final LocalTime BOOKING_END_WINDOW = LocalTime.of(19, 0);

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
            .resourceName(resource.getName())
            .status(BookingStatus.PENDING)
            .build();

        Booking saved = bookingRepository.save(Objects.requireNonNull(booking));
        notifyUserIfPossible(saved, "Booking Request Submitted", buildPendingMessage(saved));
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getMyBookings(String requesterEmail) {
        User requester = findUserByEmail(requesterEmail);
        return bookingRepository.findByUserIdOrderByIdDesc(requester.getId()).stream()
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

        Resource resource = booking.getResource();
        if (resource == null) {
            throw new IllegalArgumentException("Cannot approve booking because the linked resource no longer exists");
        }
        ensureResourceIsBookable(resource);
        ensureNoConflictForApprove(booking);

        booking.setStatus(BookingStatus.APPROVED);
        booking.setAdminReason(null);

        Booking updated = bookingRepository.save(booking);
        notifyUserIfPossible(updated, "Booking Approved", buildStatusMessage(updated, "approved"));

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
        notifyUserIfPossible(
            updated,
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
        notifyUserIfPossible(updated, "Booking Cancelled", buildStatusMessage(updated, "cancelled"));

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
        if (startTime == null || endTime == null) {
            throw new IllegalArgumentException("Start time and end time are required");
        }
        if (startTime.getMinute() != 0 || startTime.getSecond() != 0 || startTime.getNano() != 0
            || endTime.getMinute() != 0 || endTime.getSecond() != 0 || endTime.getNano() != 0) {
            throw new IllegalArgumentException("Bookings must be on the hour (for example, 08:00 to 10:00)");
        }
        if (!endTime.equals(startTime.plusHours(2))) {
            throw new IllegalArgumentException("Bookings must be exactly 2 hours");
        }
        if (startTime.isBefore(BOOKING_START_WINDOW) || endTime.isAfter(BOOKING_END_WINDOW)) {
            throw new IllegalArgumentException("Bookings must be within 08:00 to 19:00");
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
        if (booking.getResource() == null) {
            throw new IllegalArgumentException("Cannot approve booking because the linked resource no longer exists");
        }
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
        return booking.getUser() != null
            && booking.getUser().getEmail() != null
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
        return "Your booking for " + getSafeResourceName(booking)
            + " on " + booking.getBookingDate()
            + " (" + booking.getStartTime() + " - " + booking.getEndTime() + ") was " + verb + ".";
    }

    private String buildPendingMessage(Booking booking) {
        return "Your booking request for " + getSafeResourceName(booking)
            + " on " + booking.getBookingDate()
            + " (" + booking.getStartTime() + " - " + booking.getEndTime() + ") is pending admin approval.";
    }

    private String getSafeResourceName(Booking booking) {
        if (booking.getResource() != null && booking.getResource().getName() != null && !booking.getResource().getName().isBlank()) {
            return booking.getResource().getName();
        }
        if (booking.getResourceName() != null && !booking.getResourceName().isBlank()) {
            return booking.getResourceName();
        }
        return "Unknown Resource";
    }

    private void notifyUserIfPossible(Booking booking, String title, String message) {
        if (booking.getUser() == null || booking.getUser().getId() == null) {
            return;
        }
        notifyUser(booking.getUser().getId(), title, message);
    }

    private BookingResponseDTO toResponse(Booking booking) {
        Resource resource = booking.getResource();
        User user = booking.getUser();
        Long resourceId = resource != null ? resource.getId() : null;
        String resourceName = resource != null ? resource.getName() : booking.getResourceName();
        if (resourceName == null || resourceName.isBlank()) {
            resourceName = "Unknown Resource";
        }
        String resourceLocation = resource != null ? resource.getLocation() : null;

        return BookingResponseDTO.builder()
            .id(booking.getId())
            .resourceId(resourceId)
            .resourceName(resourceName)
            .resourceLocation(resourceLocation)
            .userId(user != null ? user.getId() : null)
            .userName(user != null ? user.getName() : null)
            .userEmail(user != null ? user.getEmail() : null)
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
