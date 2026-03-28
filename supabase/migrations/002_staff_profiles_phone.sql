-- =============================================================
-- Legend Farm Shop - Staff phone support for secure user admin
-- =============================================================

ALTER TABLE IF EXISTS staff_profiles
ADD COLUMN IF NOT EXISTS phone TEXT;
