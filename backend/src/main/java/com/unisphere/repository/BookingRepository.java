package com.unisphere.repository;

import com.unisphere.entity.Booking;
import com.unisphere.entity.BookingStatus;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserIdOrderByBookingDateDescStartTimeDesc(Long userId);

    List<Booking> findAllByOrderByBookingDateDescStartTimeDescCreatedAtDesc();

    @Query("""
        select count(b)
        from Booking b
        where (:bookingId is null or b.id <> :bookingId)
          and lower(b.resourceName) = lower(:resourceName)
          and b.bookingDate = :bookingDate
          and b.status in :statuses
          and b.startTime < :endTime
          and b.endTime > :startTime
    """)
    long countConflicts(
        @Param("bookingId") Long bookingId,
        @Param("resourceName") String resourceName,
        @Param("bookingDate") LocalDate bookingDate,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime,
        @Param("statuses") List<BookingStatus> statuses
    );
}