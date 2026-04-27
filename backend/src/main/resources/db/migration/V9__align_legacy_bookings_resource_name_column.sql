SET @has_resource_name := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'resource_name'
);

SET @sql_add_resource_name := IF(
  @has_resource_name = 0,
  'ALTER TABLE bookings ADD COLUMN resource_name VARCHAR(120) NULL',
  'SELECT 1'
);
PREPARE stmt_add_resource_name FROM @sql_add_resource_name;
EXECUTE stmt_add_resource_name;
DEALLOCATE PREPARE stmt_add_resource_name;

UPDATE bookings b
JOIN resources r ON r.id = b.resource_id
SET b.resource_name = r.name
WHERE b.resource_name IS NULL OR b.resource_name = '';

ALTER TABLE bookings
  MODIFY COLUMN resource_name VARCHAR(120) NULL;
