-- Add new columns to existing pantry_items table
ALTER TABLE pantry_items 
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

ALTER TABLE pantry_items 
ADD COLUMN IF NOT EXISTS is_replaced BOOLEAN DEFAULT FALSE;

-- Update existing records to have default values
UPDATE pantry_items 
SET reminder_count = 0 
WHERE reminder_count IS NULL;

UPDATE pantry_items 
SET is_replaced = FALSE 
WHERE is_replaced IS NULL;

-- Add comments to the new columns
COMMENT ON COLUMN pantry_items.reminder_count IS 'Number of times this item has been reminded via email';
COMMENT ON COLUMN pantry_items.is_replaced IS 'Whether this item has been marked as replaced by the user';
