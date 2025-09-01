-- Add end_date column to surveys table
-- This migration adds support for survey expiration dates

ALTER TABLE surveys
ADD COLUMN end_date TIMESTAMP NULL
COMMENT 'Optional end date/time when survey stops accepting responses';

-- Add index for better query performance on active surveys
CREATE INDEX idx_surveys_end_date ON surveys(end_date);

-- Update existing surveys to have no end date (NULL means no expiration)
-- This is the default behavior, so no UPDATE statement needed