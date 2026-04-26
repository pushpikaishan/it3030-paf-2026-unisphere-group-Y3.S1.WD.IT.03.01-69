package com.unisphere.controller;

import com.unisphere.entity.TicketPriority;
import com.unisphere.entity.TicketStatus;
import com.unisphere.service.TicketService;
import com.unisphere.service.TicketService.AssignTechnicianRequest;
import com.unisphere.service.TicketService.CommentRequest;
import com.unisphere.service.TicketService.CreateTicketRequest;
import com.unisphere.service.TicketService.TicketDetailResponse;
import com.unisphere.service.TicketService.TicketSummaryResponse;
import com.unisphere.service.TicketService.UpdateStatusRequest;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @GetMapping
    public ResponseEntity<?> list(
        Authentication authentication,
        @RequestParam(required = false) TicketStatus status,
        @RequestParam(required = false) TicketPriority priority
    ) {
        try {
            List<TicketSummaryResponse> tickets = ticketService.listTickets(authentication, status, priority);
            return ResponseEntity.ok(tickets);
        } catch (IllegalArgumentException ex) {
            return badRequest(ex.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> byId(@PathVariable Long id, Authentication authentication) {
        try {
            TicketDetailResponse ticket = ticketService.getTicket(id, authentication);
            return ResponseEntity.ok(ticket);
        } catch (IllegalArgumentException ex) {
            return badRequest(ex.getMessage());
        }
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<?> create(
        @RequestPart("payload") CreateTicketRequest request,
        @RequestPart(name = "attachments", required = false) List<MultipartFile> attachments,
        Authentication authentication
    ) {
        try {
            TicketDetailResponse created = ticketService.createTicket(request, attachments, authentication);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException ex) {
            return badRequest(ex.getMessage());
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
        @PathVariable Long id,
        @org.springframework.web.bind.annotation.RequestBody UpdateStatusRequest request,
        Authentication authentication
    ) {
        try {
            TicketDetailResponse updated = ticketService.updateStatus(id, request, authentication);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException ex) {
            return badRequest(ex.getMessage());
        }
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<?> assignTechnician(
        @PathVariable Long id,
        @org.springframework.web.bind.annotation.RequestBody AssignTechnicianRequest request,
        Authentication authentication
    ) {
        try {
            TicketDetailResponse updated = ticketService.assignTechnician(id, request, authentication);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException ex) {
            return badRequest(ex.getMessage());
        }
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<?> addComment(
        @PathVariable Long id,
        @org.springframework.web.bind.annotation.RequestBody CommentRequest request,
        Authentication authentication
    ) {
        try {
            return ResponseEntity.ok(ticketService.addComment(id, request, authentication));
        } catch (IllegalArgumentException ex) {
            return badRequest(ex.getMessage());
        }
    }

    @PutMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<?> updateComment(
        @PathVariable Long ticketId,
        @PathVariable Long commentId,
        @org.springframework.web.bind.annotation.RequestBody CommentRequest request,
        Authentication authentication
    ) {
        try {
            return ResponseEntity.ok(ticketService.updateComment(ticketId, commentId, request, authentication));
        } catch (IllegalArgumentException ex) {
            return badRequest(ex.getMessage());
        }
    }

    @DeleteMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<?> deleteComment(
        @PathVariable Long ticketId,
        @PathVariable Long commentId,
        Authentication authentication
    ) {
        try {
            ticketService.deleteComment(ticketId, commentId, authentication);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException ex) {
            return badRequest(ex.getMessage());
        }
    }

    private ResponseEntity<Map<String, String>> badRequest(String message) {
        String normalized = (message == null || message.isBlank()) ? "Request failed" : message;
        if ("Forbidden".equalsIgnoreCase(normalized)) {
            return ResponseEntity.status(403).body(Map.of("message", normalized));
        }
        if (normalized.toLowerCase().contains("not found")) {
            return ResponseEntity.status(404).body(Map.of("message", normalized));
        }
        if ("Unauthorized".equalsIgnoreCase(normalized)) {
            return ResponseEntity.status(401).body(Map.of("message", normalized));
        }
        return ResponseEntity.badRequest().body(Map.of("message", normalized));
    }
}
