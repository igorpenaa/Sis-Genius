/*
  # Add Counter Table and Functions

  1. New Tables
    - `counters` table for storing auto-incrementing counters
      - `id` (text, primary key)
      - `value` (bigint)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Functions
    - Function to get next counter value
    - Function to update counter value
    
  3. Security
    - Enable RLS on counters table
    - Add policies for authenticated users
*/

-- Create counters table
CREATE TABLE IF NOT EXISTS counters (
  id text PRIMARY KEY,
  value bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view counters"
  ON counters FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update counters"
  ON counters FOR UPDATE
  TO authenticated
  USING (true);

-- Create function to get next counter value
CREATE OR REPLACE FUNCTION get_next_counter_value(counter_id text)
RETURNS bigint AS $$
DECLARE
  next_value bigint;
BEGIN
  -- Insert counter if it doesn't exist
  INSERT INTO counters (id, value)
  VALUES (counter_id, 1)
  ON CONFLICT (id) DO NOTHING;

  -- Get and increment counter value
  UPDATE counters
  SET value = value + 1,
      updated_at = now()
  WHERE id = counter_id
  RETURNING value INTO next_value;

  RETURN next_value;
END;
$$ LANGUAGE plpgsql;

-- Create function to format order number
CREATE OR REPLACE FUNCTION format_order_number(value bigint)
RETURNS text AS $$
BEGIN
  RETURN LPAD(value::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Initialize service order counter if it doesn't exist
INSERT INTO counters (id, value)
VALUES ('service_order', 1)
ON CONFLICT (id) DO NOTHING;