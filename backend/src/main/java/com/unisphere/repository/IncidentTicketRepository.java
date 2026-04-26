package com.unisphere.repository;

import com.unisphere.entity.IncidentTicket;
import com.unisphere.entity.TicketStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IncidentTicketRepository extends JpaRepository<IncidentTicket, Long> {
    List<IncidentTicket> findByReporterIdOrderByCreatedAtDesc(Long reporterId);
    List<IncidentTicket> findByAssignedTechnicianIdOrderByCreatedAtDesc(Long technicianId);
    List<IncidentTicket> findByStatusOrderByCreatedAtDesc(TicketStatus status);
    List<IncidentTicket> findAllByOrderByCreatedAtDesc();
}
