SET @has_booking_date := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'booking_date'
);
SET @sql_booking_date := IF(
  @has_booking_date = 0,
  'ALTER TABLE bookings ADD COLUMN booking_date DATE NULL',
  'SELECT 1'
);
PREPARE stmt_booking_date FROM @sql_booking_date;
EXECUTE stmt_booking_date;
DEALLOCATE PREPARE stmt_booking_date;

SET @has_start_time := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'start_time'
);
SET @sql_start_time := IF(
  @has_start_time = 0,
  'ALTER TABLE bookings ADD COLUMN start_time TIME NULL',
  'SELECT 1'
);
PREPARE stmt_start_time FROM @sql_start_time;
EXECUTE stmt_start_time;
DEALLOCATE PREPARE stmt_start_time;

SET @has_end_time := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'end_time'
);
SET @sql_end_time := IF(
  @has_end_time = 0,
  'ALTER TABLE bookings ADD COLUMN end_time TIME NULL',
  'SELECT 1'
);
PREPARE stmt_end_time FROM @sql_end_time;
EXECUTE stmt_end_time;
DEALLOCATE PREPARE stmt_end_time;

SET @has_expected_attendees := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'expected_attendees'
);
SET @sql_expected_attendees := IF(
  @has_expected_attendees = 0,
  'ALTER TABLE bookings ADD COLUMN expected_attendees INT NULL',
  'SELECT 1'
);
PREPARE stmt_expected_attendees FROM @sql_expected_attendees;
EXECUTE stmt_expected_attendees;
DEALLOCATE PREPARE stmt_expected_attendees;

SET @has_status := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'status'
);
SET @sql_status := IF(
  @has_status = 0,
  'ALTER TABLE bookings ADD COLUMN status VARCHAR(20) NULL',
  'SELECT 1'
);
PREPARE stmt_status FROM @sql_status;
EXECUTE stmt_status;
DEALLOCATE PREPARE stmt_status;

SET @has_created_at := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'created_at'
);
SET @sql_created_at := IF(
  @has_created_at = 0,
  'ALTER TABLE bookings ADD COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP',
  'SELECT 1'
);
PREPARE stmt_created_at FROM @sql_created_at;
EXECUTE stmt_created_at;
DEALLOCATE PREPARE stmt_created_at;

SET @has_updated_at := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'updated_at'
);
SET @sql_updated_at := IF(
  @has_updated_at = 0,
  'ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  'SELECT 1'
);
PREPARE stmt_updated_at FROM @sql_updated_at;
EXECUTE stmt_updated_at;
DEALLOCATE PREPARE stmt_updated_at;

UPDATE bookings
SET booking_date = DATE(created_at)
WHERE booking_date IS NULL;

UPDATE bookings
SET start_time = '08:00:00'
WHERE start_time IS NULL;

UPDATE bookings
SET end_time = '10:00:00'
WHERE end_time IS NULL;

UPDATE bookings
SET expected_attendees = 1
WHERE expected_attendees IS NULL OR expected_attendees <= 0;

UPDATE bookings
SET status = 'PENDING'
WHERE status IS NULL OR status = '';
