SET @admin_reason_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'admin_reason'
);

SET @sql := IF(
  @admin_reason_exists = 0,
  'ALTER TABLE bookings ADD COLUMN admin_reason VARCHAR(500) DEFAULT NULL',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
