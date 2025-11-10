-- Remove the category constraint to allow any string
ALTER TABLE contents DROP CONSTRAINT IF EXISTS contents_category_check;

-- Update the category column to allow any string (keeping VARCHAR(20) for now, can be increased if needed)
-- If you want longer category names, you can change this to VARCHAR(50) or TEXT
ALTER TABLE contents ALTER COLUMN category TYPE VARCHAR(50);