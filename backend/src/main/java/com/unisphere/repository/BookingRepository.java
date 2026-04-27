package com.unisphere.repository;

import com.unisphere.entity.Booking;
import com.unisphere.entity.BookingStatus;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface BookingRepository extends JpaRepository<Booking, Long>, JpaSpecificationExecutor<Booking> {

    List<Booking> findByUserIdOrderByIdDesc(Long userId);

    boolean existsByResourceIdAndBookingDateAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
        Long resourceId,
        LocalDate bookingDate,
        Collection<BookingStatus> statuses,
        LocalTime endTime,
        LocalTime startTime
    );

    boolean existsByResourceIdAndBookingDateAndStatusInAndIdNotAndStartTimeLessThanAndEndTimeGreaterThan(
        Long resourceId,
        LocalDate bookingDate,
        Collection<BookingStatus> statuses,
        Long id,
        LocalTime endTime,
        LocalTime startTime
    );
}
