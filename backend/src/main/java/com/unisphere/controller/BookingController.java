package com.unisphere.controller;

import com.unisphere.dto.BookingRequestDTO;
import com.unisphere.dto.BookingResponseDTO;
import com.unisphere.dto.BookingStatusUpdateDTO;
import com.unisphere.entity.User;
import com.unisphere.exception.ResourceNotFoundException;
import com.unisphere.repository.UserRepository;
import com.unisphere.service.BookingService;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final UserRepository userRepository;

    public BookingController(BookingService bookingService, UserRepository userRepository) {
        this.bookingService = bookingService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<BookingResponseDTO> create(@Valid @RequestBody BookingRequestDTO request, Authentication authentication) {
        // MEMBER 2: booking creation stays authenticated and is tied to the current user.
        User currentUser = resolveCurrentUser(authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(currentUser, request));
    }

    @GetMapping("/my")
    public List<BookingResponseDTO> myBookings(Authentication authentication) {
        return bookingService.getMyBookings(resolveCurrentUser(authentication));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<BookingResponseDTO> allBookings(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String resource,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return bookingService.getAllBookings(status, resource, date);
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public BookingResponseDTO approve(@PathVariable Long id) {
        // MEMBER 2: approval runs conflict validation again before status changes.
        return bookingService.approveBooking(id);
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public BookingResponseDTO reject(@PathVariable Long id, @Valid @RequestBody BookingStatusUpdateDTO request) {
        return bookingService.rejectBooking(id, request.getRejectionReason());
    }

    @PutMapping("/{id}/cancel")
    public BookingResponseDTO cancel(@PathVariable Long id, Authentication authentication) {
        return bookingService.cancelBooking(id, resolveCurrentUser(authentication));
    }

    private User resolveCurrentUser(Authentication authentication) {
        if (authentication == null) {
            throw new ResourceNotFoundException("Authenticated user not found");
        }

        String email = authentication.getName();
        if (authentication.getDetails() instanceof Claims claims) {
            String claimEmail = claims.get("email", String.class);
            if (claimEmail != null && !claimEmail.isBlank()) {
                email = claimEmail;
            }
        }

        return userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }
}