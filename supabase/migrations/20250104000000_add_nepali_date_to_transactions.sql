
-- Add nepali_date column to transactions table
ALTER TABLE transactions ADD COLUMN nepali_date TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN transactions.nepali_date IS 'Nepali date in YYYY/MM/DD format (BS)';
