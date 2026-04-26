ALTER TABLE users
  ADD COLUMN app_two_factor_secret VARCHAR(128) NULL,
  ADD COLUMN app_two_factor_pending_secret VARCHAR(128) NULL,
  ADD COLUMN app_two_factor_pending_expires_at DATETIME NULL;
