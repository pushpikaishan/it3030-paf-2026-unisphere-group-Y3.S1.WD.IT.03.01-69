CREATE TABLE IF NOT EXISTS resources (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  type VARCHAR(40) NOT NULL,
  capacity INT NOT NULL,
  location VARCHAR(120) NOT NULL,
  availability_windows VARCHAR(500) DEFAULT NULL,
  status VARCHAR(40) NOT NULL,
  description VARCHAR(1200) DEFAULT NULL,
  image_url VARCHAR(500) DEFAULT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_resources_name (name),
  KEY idx_resources_type (type),
  KEY idx_resources_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
