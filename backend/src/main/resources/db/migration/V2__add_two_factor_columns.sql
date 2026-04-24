ALTER TABLE users
  ADD COLUMN email_two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN app_two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN email_otp_code VARCHAR(10) NULL,
  ADD COLUMN email_otp_expires_at DATETIME NULL;
