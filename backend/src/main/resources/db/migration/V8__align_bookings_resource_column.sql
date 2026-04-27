SET @resource_id_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'resource_id'
);

SET @sql := IF(
  @resource_id_exists = 0,
  'ALTER TABLE bookings ADD COLUMN resource_id BIGINT NULL',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND INDEX_NAME = 'idx_bookings_resource_date'
);

SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE bookings ADD INDEX idx_bookings_resource_date (resource_id, booking_date)',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
