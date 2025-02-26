/*
  # Add Service Order Custom Numbering

  1. New Fields
    - Add numidos field to service_orders table for custom order numbering
  
  2. Functions
    - Create function to generate next order number based on last numidos
    - Add trigger to automatically set numidos on new orders
*/

-- Add numidos field to service_orders
ALTER TABLE service_orders
  ADD COLUMN IF NOT EXISTS numidos text;

-- Create function to generate next order number
CREATE OR REPLACE FUNCTION generate_next_order_number()
RETURNS text AS $$
DECLARE
  last_number text;
  next_number integer;
BEGIN
  -- Get the last numidos value
  SELECT numidos INTO last_number
  FROM service_orders
  WHERE numidos IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no previous number exists, start from 0001
  IF last_number IS NULL THEN
    RETURN '0001';
  END IF;

  -- Convert last number to integer and increment
  next_number := CAST(last_number AS integer) + 1;
  
  -- Format as 4-digit number with leading zeros
  RETURN LPAD(next_number::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set numidos on insert
CREATE OR REPLACE FUNCTION set_order_numidos()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numidos IS NULL THEN
    NEW.numidos := generate_next_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_numidos_trigger
  BEFORE INSERT ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_numidos();