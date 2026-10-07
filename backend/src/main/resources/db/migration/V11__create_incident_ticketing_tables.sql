CREATE TABLE IF NOT EXISTS incident_tickets (
  id BIGINT NOT NULL AUTO_INCREMENT,
  reporter_id BIGINT NOT NULL,
  assigned_technician_id BIGINT DEFAULT NULL,
  resource_id BIGINT DEFAULT NULL,
  location VARCHAR(120) DEFAULT NULL,
  category VARCHAR(40) NOT NULL,
  priority VARCHAR(40) NOT NULL,
  description VARCHAR(2000) NOT NULL,
  preferred_contact VARCHAR(200) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'OPEN',
  resolution_notes VARCHAR(2000) DEFAULT NULL,
  rejection_reason VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_incident_tickets_reporter (reporter_id),
  KEY idx_incident_tickets_assigned_technician (assigned_technician_id),
  KEY idx_incident_tickets_status (status),
  KEY idx_incident_tickets_priority (priority),
  KEY idx_incident_tickets_resource (resource_id),
  CONSTRAINT fk_incident_tickets_reporter FOREIGN KEY (reporter_id) REFERENCES users (id),
  CONSTRAINT fk_incident_tickets_assigned_technician FOREIGN KEY (assigned_technician_id) REFERENCES users (id),
  CONSTRAINT fk_incident_tickets_resource FOREIGN KEY (resource_id) REFERENCES resources (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS ticket_attachments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  ticket_id BIGINT NOT NULL,
  uploaded_by BIGINT NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  content_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ticket_attachments_ticket (ticket_id),
  CONSTRAINT fk_ticket_attachments_ticket FOREIGN KEY (ticket_id) REFERENCES incident_tickets (id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_attachments_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS ticket_comments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  ticket_id BIGINT NOT NULL,
  author_id BIGINT NOT NULL,
  message VARCHAR(1000) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ticket_comments_ticket (ticket_id),
  KEY idx_ticket_comments_author (author_id),
  CONSTRAINT fk_ticket_comments_ticket FOREIGN KEY (ticket_id) REFERENCES incident_tickets (id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_comments_author FOREIGN KEY (author_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
