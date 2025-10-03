-- Create the pantry_items table
CREATE TABLE pantry_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_quantity DECIMAL(10,2) NOT NULL,
  unit_unit TEXT NOT NULL CHECK (unit_unit IN ('g', 'ml', 'mg')),
  expiry DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on created_at for better performance
CREATE INDEX idx_pantry_items_created_at ON pantry_items(created_at);

-- Create an index on expiry for better performance when filtering by expiry
CREATE INDEX idx_pantry_items_expiry ON pantry_items(expiry);

-- Enable Row Level Security (RLS)
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on pantry_items" ON pantry_items
  FOR ALL USING (true);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_pantry_items_updated_at
  BEFORE UPDATE ON pantry_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
