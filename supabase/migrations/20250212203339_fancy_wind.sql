/*
  # Update Service Order Schema
  
  1. Changes
    - Add auto-incrementing ID for service orders
    - Add multiple equipment support
    - Add last modified tracking
    - Update existing records
    
  2. Security
    - Maintain existing RLS policies
    - Add policies for new tables
*/

-- Create sequence for service order numbers if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS service_order_number_seq;

-- Update service_orders table
ALTER TABLE service_orders
  ADD COLUMN IF NOT EXISTS order_number bigint DEFAULT nextval('service_order_number_seq'),
  ADD COLUMN IF NOT EXISTS last_modified timestamptz DEFAULT now();

-- Create equipment items table for multiple equipment per order
CREATE TABLE service_order_equipment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE,
  category text NOT NULL,
  subcategory text NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  color text,
  imei text,
  reported_issue text NOT NULL,
  has_power boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create history table for tracking changes
CREATE TABLE service_order_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES auth.users(id),
  change_type text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE service_order_equipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view equipment items"
  ON service_order_equipment_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert equipment items"
  ON service_order_equipment_items FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update equipment items"
  ON service_order_equipment_items FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete equipment items"
  ON service_order_equipment_items FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view history"
  ON service_order_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert history"
  ON service_order_history FOR INSERT TO authenticated WITH CHECK (true);

-- Create trigger to update last_modified
CREATE OR REPLACE FUNCTION update_service_order_last_modified()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE service_orders 
  SET last_modified = now()
  WHERE id = NEW.service_order_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for last_modified updates
CREATE TRIGGER update_service_order_last_modified_equipment
  AFTER INSERT OR UPDATE ON service_order_equipment_items
  FOR EACH ROW
  EXECUTE FUNCTION update_service_order_last_modified();

CREATE TRIGGER update_service_order_last_modified_services
  AFTER INSERT OR UPDATE ON service_order_services
  FOR EACH ROW
  EXECUTE FUNCTION update_service_order_last_modified();

CREATE TRIGGER update_service_order_last_modified_products
  AFTER INSERT OR UPDATE ON service_order_products
  FOR EACH ROW
  EXECUTE FUNCTION update_service_order_last_modified();

-- Update existing service orders to use order_number
UPDATE service_orders
SET order_number = nextval('service_order_number_seq')
WHERE order_number IS NULL;