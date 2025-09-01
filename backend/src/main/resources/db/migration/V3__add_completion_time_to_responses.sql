-- Add completion_time_seconds column to responses table
ALTER TABLE responses ADD COLUMN completion_time_seconds INTEGER;

-- Add comment to explain the column
COMMENT ON COLUMN responses.completion_time_seconds IS 'Time taken to complete the survey in seconds';