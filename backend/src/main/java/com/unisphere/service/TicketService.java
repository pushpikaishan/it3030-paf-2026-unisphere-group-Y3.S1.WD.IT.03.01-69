package com.unisphere.service;

import com.unisphere.entity.IncidentTicket;
import com.unisphere.entity.Role;
import com.unisphere.entity.TicketAttachment;
import com.unisphere.entity.TicketCategory;
import com.unisphere.entity.TicketComment;
import com.unisphere.entity.TicketPriority;
import com.unisphere.entity.TicketStatus;
import com.unisphere.entity.User;
import com.unisphere.entity.UserStatus;
import com.unisphere.repository.IncidentTicketRepository;
import com.unisphere.repository.ResourceRepository;
import com.unisphere.repository.TicketAttachmentRepository;
import com.unisphere.repository.TicketCommentRepository;
import com.unisphere.repository.UserRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
public class TicketService {

    private static final int MAX_ATTACHMENTS_PER_TICKET = 3;
    private static final long MAX_IMAGE_SIZE_BYTES = 5L * 1024L * 1024L;

    private final IncidentTicketRepository ticketRepository;
    private final ResourceRepository resourceRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final TicketCommentRepository commentRepository;
    private final UserRepository userRepository;

    public TicketService(
        IncidentTicketRepository ticketRepository,
        ResourceRepository resourceRepository,
        TicketAttachmentRepository attachmentRepository,
        TicketCommentRepository commentRepository,
        UserRepository userRepository
    ) {
        this.ticketRepository = ticketRepository;
        this.resourceRepository = resourceRepository;
        this.attachmentRepository = attachmentRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
    }

    public List<TicketSummaryResponse> listTickets(Authentication authentication, TicketStatus status, TicketPriority priority) {
        User actor = resolveActor(authentication);

        List<IncidentTicket> tickets;
        if (isAdminOrManager(actor)) {
            tickets = ticketRepository.findAllByOrderByCreatedAtDesc();
        } else if (actor.getRole() == Role.TECHNICIAN) {
            tickets = ticketRepository.findByAssignedTechnicianIdOrderByCreatedAtDesc(actor.getId());
        } else {
            tickets = ticketRepository.findByReporterIdOrderByCreatedAtDesc(actor.getId());
        }

        return tickets.stream()
            .filter(ticket -> status == null || ticket.getStatus() == status)
            .filter(ticket -> priority == null || ticket.getPriority() == priority)
            .map(this::toSummary)
            .toList();
    }

    public TicketDetailResponse getTicket(Long ticketId, Authentication authentication) {
        User actor = resolveActor(authentication);
        IncidentTicket ticket = findTicket(ticketId);
        ensureCanView(ticket, actor);
        return toDetail(ticket);
    }

    public TicketDetailResponse createTicket(CreateTicketRequest request, List<MultipartFile> attachments, Authentication authentication) {
        User actor = resolveActor(authentication);
        validateCreateRequest(request);

        IncidentTicket ticket = new IncidentTicket();
        ticket.setReporter(actor);
        ticket.setResourceId(request.resourceId());
        ticket.setLocation(trimToNull(request.location()));
        ticket.setCategory(request.category());
        ticket.setPriority(request.priority());
        ticket.setDescription(request.description().trim());
        ticket.setPreferredContact(request.preferredContact().trim());
        ticket.setStatus(TicketStatus.OPEN);

        IncidentTicket savedTicket = ticketRepository.save(ticket);
        storeAttachments(savedTicket, actor, attachments);

        return toDetail(savedTicket);
    }

    public TicketDetailResponse updateStatus(Long ticketId, UpdateStatusRequest request, Authentication authentication) {
        User actor = resolveActor(authentication);
        IncidentTicket ticket = findTicket(ticketId);
        ensureCanView(ticket, actor);

        TicketStatus target = request.status();
        if (target == null) {
            throw new IllegalArgumentException("Status is required");
        }

        validateStatusTransition(ticket, target, actor, request);

        ticket.setStatus(target);
        if (StringUtils.hasText(request.resolutionNotes())) {
            ticket.setResolutionNotes(request.resolutionNotes().trim());
        }
        if (target == TicketStatus.REJECTED) {
            ticket.setRejectionReason(request.rejectionReason().trim());
        }

        return toDetail(ticketRepository.save(ticket));
    }

    public TicketDetailResponse assignTechnician(Long ticketId, AssignTechnicianRequest request, Authentication authentication) {
        User actor = resolveActor(authentication);
        if (!isAdminOrManager(actor)) {
            throw new IllegalArgumentException("Only admin or manager can assign technicians");
        }

        IncidentTicket ticket = findTicket(ticketId);
        User technician = userRepository.findById(request.technicianId())
            .orElseThrow(() -> new IllegalArgumentException("Technician not found"));

        if (technician.getRole() != Role.TECHNICIAN) {
            throw new IllegalArgumentException("Selected user is not a technician");
        }
        if (technician.getStatus() != UserStatus.APPROVED) {
            throw new IllegalArgumentException("Technician is not approved");
        }

        ticket.setAssignedTechnician(technician);
        return toDetail(ticketRepository.save(ticket));
    }

    public CommentResponse addComment(Long ticketId, CommentRequest request, Authentication authentication) {
        User actor = resolveActor(authentication);
        IncidentTicket ticket = findTicket(ticketId);

        if (!canParticipate(ticket, actor)) {
            throw new IllegalArgumentException("You are not allowed to comment on this ticket");
        }
        if (!StringUtils.hasText(request.message()) || request.message().trim().length() < 2) {
            throw new IllegalArgumentException("Comment message must be at least 2 characters");
        }

        TicketComment comment = new TicketComment();
        comment.setTicket(ticket);
        comment.setAuthor(actor);
        comment.setMessage(request.message().trim());

        return toComment(commentRepository.save(comment));
    }

    public CommentResponse updateComment(Long ticketId, Long commentId, CommentRequest request, Authentication authentication) {
        User actor = resolveActor(authentication);
        IncidentTicket ticket = findTicket(ticketId);
        ensureCanView(ticket, actor);

        TicketComment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!comment.getTicket().getId().equals(ticketId)) {
            throw new IllegalArgumentException("Comment does not belong to this ticket");
        }
        if (!canManageComment(comment, actor)) {
            throw new IllegalArgumentException("You cannot edit this comment");
        }
        if (!StringUtils.hasText(request.message()) || request.message().trim().length() < 2) {
            throw new IllegalArgumentException("Comment message must be at least 2 characters");
        }

        comment.setMessage(request.message().trim());
        return toComment(commentRepository.save(comment));
    }

    public void deleteComment(Long ticketId, Long commentId, Authentication authentication) {
        User actor = resolveActor(authentication);
        IncidentTicket ticket = findTicket(ticketId);
        ensureCanView(ticket, actor);

        TicketComment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!comment.getTicket().getId().equals(ticketId)) {
            throw new IllegalArgumentException("Comment does not belong to this ticket");
        }
        if (!canManageComment(comment, actor)) {
            throw new IllegalArgumentException("You cannot delete this comment");
        }

        commentRepository.delete(comment);
    }

    private void validateCreateRequest(CreateTicketRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request payload is required");
        }
        if (request.category() == null) {
            throw new IllegalArgumentException("Category is required");
        }
        if (request.priority() == null) {
            throw new IllegalArgumentException("Priority is required");
        }
        if (!StringUtils.hasText(request.description()) || request.description().trim().length() < 10) {
            throw new IllegalArgumentException("Description must be at least 10 characters");
        }
        if (!StringUtils.hasText(request.preferredContact()) || request.preferredContact().trim().length() < 5) {
            throw new IllegalArgumentException("Preferred contact must be at least 5 characters");
        }

        boolean hasResourceId = request.resourceId() != null;
        boolean hasLocation = StringUtils.hasText(request.location());
        if (!hasResourceId && !hasLocation) {
            throw new IllegalArgumentException("Provide at least resourceId or location");
        }

        if (hasResourceId && !resourceRepository.existsById(request.resourceId())) {
            throw new IllegalArgumentException("Resource not found for the provided resource ID");
        }
    }

    private void validateStatusTransition(IncidentTicket ticket, TicketStatus target, User actor, UpdateStatusRequest request) {
        TicketStatus current = ticket.getStatus();

        if (current == target) {
            return;
        }

        switch (target) {
            case IN_PROGRESS -> {
                if (current != TicketStatus.OPEN) {
                    throw new IllegalArgumentException("Only OPEN tickets can move to IN_PROGRESS");
                }
                if (!isAdminOrManager(actor) && !isAssignedTechnician(ticket, actor)) {
                    throw new IllegalArgumentException("Only assigned technician or admin/manager can start progress");
                }
            }
            case RESOLVED -> {
                if (current != TicketStatus.IN_PROGRESS) {
                    throw new IllegalArgumentException("Only IN_PROGRESS tickets can move to RESOLVED");
                }
                if (!isAdminOrManager(actor) && !isAssignedTechnician(ticket, actor)) {
                    throw new IllegalArgumentException("Only assigned technician or admin/manager can resolve ticket");
                }
                if (!StringUtils.hasText(request.resolutionNotes()) || request.resolutionNotes().trim().length() < 5) {
                    throw new IllegalArgumentException("Resolution notes are required to resolve a ticket");
                }
            }
            case CLOSED -> {
                if (current != TicketStatus.RESOLVED) {
                    throw new IllegalArgumentException("Only RESOLVED tickets can be closed");
                }
                boolean isReporter = ticket.getReporter() != null && ticket.getReporter().getId().equals(actor.getId());
                if (!isReporter && !isAdminOrManager(actor)) {
                    throw new IllegalArgumentException("Only reporter or admin/manager can close a ticket");
                }
            }
            case REJECTED -> {
                if (current != TicketStatus.OPEN && current != TicketStatus.IN_PROGRESS) {
                    throw new IllegalArgumentException("Only OPEN or IN_PROGRESS tickets can be rejected");
                }
                if (actor.getRole() != Role.ADMIN) {
                    throw new IllegalArgumentException("Only admin can reject a ticket");
                }
                if (!StringUtils.hasText(request.rejectionReason()) || request.rejectionReason().trim().length() < 5) {
                    throw new IllegalArgumentException("Rejection reason is required");
                }
            }
            case OPEN -> throw new IllegalArgumentException("Cannot transition back to OPEN");
            default -> throw new IllegalArgumentException("Unsupported status transition");
        }
    }

    private void storeAttachments(IncidentTicket ticket, User actor, List<MultipartFile> attachments) {
        if (attachments == null || attachments.isEmpty()) {
            return;
        }
        if (attachments.size() > MAX_ATTACHMENTS_PER_TICKET) {
            throw new IllegalArgumentException("A maximum of 3 images is allowed per ticket");
        }

        Path uploadDir = Paths.get("uploads", "tickets").toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to prepare upload directory");
        }

        for (MultipartFile file : attachments) {
            if (file == null || file.isEmpty()) {
                continue;
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new IllegalArgumentException("Only image attachments are allowed");
            }
            if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
                throw new IllegalArgumentException("Each image must be 5MB or less");
            }

            String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
            String uniqueName = UUID.randomUUID() + (extension != null ? "." + extension.toLowerCase() : "");
            Path destination = uploadDir.resolve(uniqueName);

            try {
                Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                throw new IllegalArgumentException("Failed to store attachment");
            }

            TicketAttachment attachment = new TicketAttachment();
            attachment.setTicket(ticket);
            attachment.setUploadedBy(actor);
            attachment.setFileUrl("/uploads/tickets/" + uniqueName);
            attachment.setFileName(
                StringUtils.hasText(file.getOriginalFilename()) ? file.getOriginalFilename() : uniqueName
            );
            attachment.setContentType(contentType);
            attachment.setSizeBytes(file.getSize());

            attachmentRepository.save(attachment);
        }

        long total = attachmentRepository.countByTicketId(ticket.getId());
        if (total > MAX_ATTACHMENTS_PER_TICKET) {
            throw new IllegalArgumentException("A ticket cannot contain more than 3 attachments");
        }
    }

    private User resolveActor(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalArgumentException("Unauthorized");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private IncidentTicket findTicket(Long ticketId) {
        return ticketRepository.findById(ticketId).orElseThrow(() -> new IllegalArgumentException("Ticket not found"));
    }

    private void ensureCanView(IncidentTicket ticket, User actor) {
        if (isAdminOrManager(actor)) {
            return;
        }

        if (actor.getRole() == Role.TECHNICIAN) {
            if (isAssignedTechnician(ticket, actor) || ticket.getReporter().getId().equals(actor.getId())) {
                return;
            }
            throw new IllegalArgumentException("Forbidden");
        }

        if (!ticket.getReporter().getId().equals(actor.getId())) {
            throw new IllegalArgumentException("Forbidden");
        }
    }

    private boolean canParticipate(IncidentTicket ticket, User actor) {
        if (isAdminOrManager(actor)) {
            return true;
        }
        if (ticket.getReporter().getId().equals(actor.getId())) {
            return true;
        }
        return isAssignedTechnician(ticket, actor);
    }

    private boolean canManageComment(TicketComment comment, User actor) {
        if (isAdminOrManager(actor)) {
            return true;
        }
        return comment.getAuthor().getId().equals(actor.getId());
    }

    private boolean isAssignedTechnician(IncidentTicket ticket, User actor) {
        return ticket.getAssignedTechnician() != null
            && ticket.getAssignedTechnician().getId() != null
            && ticket.getAssignedTechnician().getId().equals(actor.getId());
    }

    private boolean isAdminOrManager(User user) {
        return user.getRole() == Role.ADMIN || user.getRole() == Role.MANAGER;
    }

    private TicketSummaryResponse toSummary(IncidentTicket ticket) {
        return new TicketSummaryResponse(
            ticket.getId(),
            ticket.getStatus(),
            ticket.getPriority(),
            ticket.getCategory(),
            ticket.getDescription(),
            ticket.getResourceId(),
            ticket.getLocation(),
            toUserInfo(ticket.getReporter()),
            toUserInfo(ticket.getAssignedTechnician()),
            ticket.getCreatedAt(),
            ticket.getUpdatedAt()
        );
    }

    private TicketDetailResponse toDetail(IncidentTicket ticket) {
        List<AttachmentResponse> attachments = attachmentRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId()).stream()
            .map(this::toAttachment)
            .toList();

        List<CommentResponse> comments = commentRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId()).stream()
            .map(this::toComment)
            .toList();

        return new TicketDetailResponse(
            ticket.getId(),
            ticket.getStatus(),
            ticket.getPriority(),
            ticket.getCategory(),
            ticket.getDescription(),
            ticket.getPreferredContact(),
            ticket.getResolutionNotes(),
            ticket.getRejectionReason(),
            ticket.getResourceId(),
            ticket.getLocation(),
            toUserInfo(ticket.getReporter()),
            toUserInfo(ticket.getAssignedTechnician()),
            attachments,
            comments,
            ticket.getCreatedAt(),
            ticket.getUpdatedAt()
        );
    }

    private AttachmentResponse toAttachment(TicketAttachment attachment) {
        return new AttachmentResponse(
            attachment.getId(),
            attachment.getFileUrl(),
            attachment.getFileName(),
            attachment.getContentType(),
            attachment.getSizeBytes(),
            toUserInfo(attachment.getUploadedBy()),
            attachment.getCreatedAt()
        );
    }

    private CommentResponse toComment(TicketComment comment) {
        return new CommentResponse(
            comment.getId(),
            comment.getTicket().getId(),
            comment.getMessage(),
            toUserInfo(comment.getAuthor()),
            comment.getCreatedAt(),
            comment.getUpdatedAt()
        );
    }

    private UserInfoResponse toUserInfo(User user) {
        if (user == null) {
            return null;
        }
        return new UserInfoResponse(user.getId(), user.getName(), user.getEmail(), user.getRole());
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    public record CreateTicketRequest(
        Long resourceId,
        String location,
        TicketCategory category,
        TicketPriority priority,
        String description,
        String preferredContact
    ) {}

    public record UpdateStatusRequest(TicketStatus status, String resolutionNotes, String rejectionReason) {}

    public record AssignTechnicianRequest(Long technicianId) {}

    public record CommentRequest(String message) {}

    public record UserInfoResponse(Long id, String name, String email, Role role) {}

    public record AttachmentResponse(
        Long id,
        String fileUrl,
        String fileName,
        String contentType,
        long sizeBytes,
        UserInfoResponse uploadedBy,
        LocalDateTime createdAt
    ) {}

    public record CommentResponse(
        Long id,
        Long ticketId,
        String message,
        UserInfoResponse author,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {}

    public record TicketSummaryResponse(
        Long id,
        TicketStatus status,
        TicketPriority priority,
        TicketCategory category,
        String description,
        Long resourceId,
        String location,
        UserInfoResponse reporter,
        UserInfoResponse assignedTechnician,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {}

    public record TicketDetailResponse(
        Long id,
        TicketStatus status,
        TicketPriority priority,
        TicketCategory category,
        String description,
        String preferredContact,
        String resolutionNotes,
        String rejectionReason,
        Long resourceId,
        String location,
        UserInfoResponse reporter,
        UserInfoResponse assignedTechnician,
        List<AttachmentResponse> attachments,
        List<CommentResponse> comments,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {}
}
