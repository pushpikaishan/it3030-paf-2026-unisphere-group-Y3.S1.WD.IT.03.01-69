CREATE TABLE IF NOT EXISTS support_requests (
  id BIGINT NOT NULL AUTO_INCREMENT,
  email VARCHAR(100) NOT NULL,
  user_message TEXT NOT NULL,
  admin_reply TEXT DEFAULT NULL,
  resolved TINYINT(1) NOT NULL DEFAULT 0,
  resolved_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_support_requests_created_at (created_at),
  KEY idx_support_requests_resolved (resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
