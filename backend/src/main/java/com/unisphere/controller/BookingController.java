package com.unisphere.controller;

import com.unisphere.dto.booking.BookingDecisionDTO;
import com.unisphere.dto.booking.BookingRequestDTO;
import com.unisphere.dto.booking.BookingResponseDTO;
import com.unisphere.entity.BookingStatus;
import com.unisphere.service.BookingService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/request")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<BookingResponseDTO> requestBooking(@Valid @RequestBody BookingRequestDTO request, Authentication authentication) {
        BookingResponseDTO created = bookingService.requestBooking(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<List<BookingResponseDTO>> getMyBookings(Authentication authentication) {
        return ResponseEntity.ok(bookingService.getMyBookings(authentication.getName()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Page<BookingResponseDTO>> getAllBookings(
        @RequestParam(required = false) BookingStatus status,
        @RequestParam(required = false) Long resourceId,
        @RequestParam(required = false) LocalDate date,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(bookingService.getAllBookings(status, resourceId, date, page, size));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<BookingResponseDTO> getBookingById(@PathVariable Long id, Authentication authentication) {
        boolean isAdmin = hasRole(authentication, "ROLE_ADMIN");
        return ResponseEntity.ok(bookingService.getBookingById(id, authentication.getName(), isAdmin));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<BookingResponseDTO> approveBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.approveBooking(id));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<BookingResponseDTO> rejectBooking(@PathVariable Long id, @Valid @RequestBody BookingDecisionDTO request) {
        return ResponseEntity.ok(bookingService.rejectBooking(id, request.getReason()));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<BookingResponseDTO> cancelBooking(@PathVariable Long id, Authentication authentication) {
        boolean isAdmin = hasRole(authentication, "ROLE_ADMIN");
        return ResponseEntity.ok(bookingService.cancelBooking(id, authentication.getName(), isAdmin));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.noContent().build();
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream().anyMatch(authority -> authority.getAuthority().equals(role));
    }
}
