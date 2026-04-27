package com.unisphere.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.unisphere.dto.booking.BookingRequestDTO;
import com.unisphere.entity.Booking;
import com.unisphere.entity.BookingStatus;
import com.unisphere.entity.Resource;
import com.unisphere.entity.ResourceStatus;
import com.unisphere.entity.ResourceType;
import com.unisphere.entity.User;
import com.unisphere.exception.BookingConflictException;
import com.unisphere.exception.BookingNotFoundException;
import com.unisphere.repository.BookingRepository;
import com.unisphere.repository.ResourceRepository;
import com.unisphere.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BookingServiceImplTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ResourceRepository resourceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private BookingServiceImpl bookingService;

    private Resource resource;
    private User user;
    private Booking booking;

    @BeforeEach
    void setUp() {
        resource = Resource.builder()
            .id(10L)
            .name("Lab A")
            .location("Block A")
            .type(ResourceType.LAB)
            .capacity(40)
            .status(ResourceStatus.ACTIVE)
            .build();

        user = new User();
        user.setName("Alice");
        user.setEmail("alice@unisphere.com");

        booking = Booking.builder()
            .id(1L)
            .resource(resource)
            .user(user)
            .bookingDate(LocalDate.now().plusDays(1))
            .startTime(LocalTime.of(9, 0))
            .endTime(LocalTime.of(11, 0))
            .purpose("Workshop")
            .expectedAttendees(20)
            .status(BookingStatus.PENDING)
            .build();
    }

    @Test
    void requestBooking_shouldCreatePendingBookingWhenNoConflict() {
        BookingRequestDTO dto = new BookingRequestDTO();
        dto.setResourceId(10L);
        dto.setBookingDate(LocalDate.now().plusDays(1));
        dto.setStartTime(LocalTime.of(9, 0));
        dto.setEndTime(LocalTime.of(11, 0));
        dto.setPurpose("Workshop");
        dto.setExpectedAttendees(25);

        when(userRepository.findByEmail("alice@unisphere.com")).thenReturn(Optional.of(user));
        when(resourceRepository.findById(10L)).thenReturn(Optional.of(resource));
        when(bookingRepository.existsByResourceIdAndBookingDateAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
            eq(10L), eq(dto.getBookingDate()), any(List.class), eq(dto.getEndTime()), eq(dto.getStartTime())
        )).thenReturn(false);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking saved = invocation.getArgument(0);
            saved.setId(99L);
            return saved;
        });

        var result = bookingService.requestBooking(dto, "alice@unisphere.com");

        assertEquals(BookingStatus.PENDING, result.getStatus());
        assertEquals(99L, result.getId());
    }

    @Test
    void requestBooking_shouldThrowConflictWhenOverlapExists() {
        BookingRequestDTO dto = new BookingRequestDTO();
        dto.setResourceId(10L);
        dto.setBookingDate(LocalDate.now().plusDays(1));
        dto.setStartTime(LocalTime.of(9, 30));
        dto.setEndTime(LocalTime.of(11, 30));
        dto.setPurpose("Overlap test");
        dto.setExpectedAttendees(10);

        when(userRepository.findByEmail("alice@unisphere.com")).thenReturn(Optional.of(user));
        when(resourceRepository.findById(10L)).thenReturn(Optional.of(resource));
        when(bookingRepository.existsByResourceIdAndBookingDateAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
            eq(10L), eq(dto.getBookingDate()), any(List.class), eq(dto.getEndTime()), eq(dto.getStartTime())
        )).thenReturn(true);

        assertThrows(BookingConflictException.class, () -> bookingService.requestBooking(dto, "alice@unisphere.com"));
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void approveBooking_shouldThrowConflictWhenApprovedOverlapExists() {
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(bookingRepository.existsByResourceIdAndBookingDateAndStatusInAndIdNotAndStartTimeLessThanAndEndTimeGreaterThan(
            eq(10L), eq(booking.getBookingDate()), any(List.class), eq(1L), eq(booking.getEndTime()), eq(booking.getStartTime())
        )).thenReturn(true);

        assertThrows(BookingConflictException.class, () -> bookingService.approveBooking(1L));
    }

    @Test
    void cancelBooking_shouldFailForDifferentUser() {
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        assertThrows(
            org.springframework.security.access.AccessDeniedException.class,
            () -> bookingService.cancelBooking(1L, "bob@unisphere.com", false)
        );
    }

    @Test
    void rejectBooking_shouldStoreReason() {
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = bookingService.rejectBooking(1L, "Resource under maintenance");

        assertEquals(BookingStatus.REJECTED, result.getStatus());
        assertEquals("Resource under maintenance", result.getAdminReason());
    }

    @Test
    void getBookingById_shouldThrowWhenNotFound() {
        when(bookingRepository.findById(404L)).thenReturn(Optional.empty());
        assertThrows(BookingNotFoundException.class, () -> bookingService.getBookingById(404L, "alice@unisphere.com", true));
    }

    @Test
    void requestBooking_shouldThrowWhenOutsideTwoHourSlotRules() {
        BookingRequestDTO dto = new BookingRequestDTO();
        dto.setResourceId(10L);
        dto.setBookingDate(LocalDate.now().plusDays(1));
        dto.setStartTime(LocalTime.of(7, 0));
        dto.setEndTime(LocalTime.of(9, 0));
        dto.setPurpose("Too early");
        dto.setExpectedAttendees(10);

        assertThrows(IllegalArgumentException.class, () -> bookingService.requestBooking(dto, "alice@unisphere.com"));
        verify(userRepository, never()).findByEmail(any());
        verify(resourceRepository, never()).findById(any());
    }
}
