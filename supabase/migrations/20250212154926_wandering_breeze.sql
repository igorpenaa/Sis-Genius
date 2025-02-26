/*
  # Create Service Orders Schema

  1. New Tables
    - service_orders (main table with basic info)
    - service_order_equipment (equipment details)
    - service_order_checklists (checklist items with status)
    - service_order_services (services with quantity and price)
    - service_order_products (products with quantity and price)
    - service_order_feedback (technical feedback)
    - service_order_discounts (discounts applied)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create service order status enum
CREATE TYPE service_order_status AS ENUM (
  'quote',
  'open',
  'in_progress',
  'completed',
  'canceled',
  'awaiting_parts',
  'approved',
  'warranty_return'
);

-- Create service orders table
CREATE TABLE service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  customer_id uuid REFERENCES auth.users(id) NOT NULL,
  customer_name text NOT NULL,
  attendant_id uuid REFERENCES auth.users(id) NOT NULL,
  attendant_name text NOT NULL,
  technician_name text NOT NULL,
  status service_order_status NOT NULL DEFAULT 'open',
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  warranty_period integer NOT NULL DEFAULT 90,
  warranty_expiration timestamptz,
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  discounted_amount decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create service order equipment table
CREATE TABLE service_order_equipment (
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

-- Create service order checklists table
CREATE TABLE service_order_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE,
  checklist_id uuid REFERENCES checklists(id),
  items jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create service order services table
CREATE TABLE service_order_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id),
  service_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price decimal(10,2) NOT NULL,
  subtotal decimal(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create service order products table
CREATE TABLE service_order_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price decimal(10,2) NOT NULL,
  subtotal decimal(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create service order feedback table
CREATE TABLE service_order_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create service order discounts table
CREATE TABLE service_order_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_discounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for service_orders
CREATE POLICY "Users can view all service orders"
  ON service_orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create service orders"
  ON service_orders FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update service orders"
  ON service_orders FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for service_order_equipment
CREATE POLICY "Users can view all service order equipment"
  ON service_order_equipment FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create service order equipment"
  ON service_order_equipment FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update service order equipment"
  ON service_order_equipment FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for service_order_checklists
CREATE POLICY "Users can view all service order checklists"
  ON service_order_checklists FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create service order checklists"
  ON service_order_checklists FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update service order checklists"
  ON service_order_checklists FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for service_order_services
CREATE POLICY "Users can view all service order services"
  ON service_order_services FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create service order services"
  ON service_order_services FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update service order services"
  ON service_order_services FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for service_order_products
CREATE POLICY "Users can view all service order products"
  ON service_order_products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create service order products"
  ON service_order_products FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update service order products"
  ON service_order_products FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for service_order_feedback
CREATE POLICY "Users can view all service order feedback"
  ON service_order_feedback FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create service order feedback"
  ON service_order_feedback FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update service order feedback"
  ON service_order_feedback FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for service_order_discounts
CREATE POLICY "Users can view all service order discounts"
  ON service_order_discounts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create service order discounts"
  ON service_order_discounts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update service order discounts"
  ON service_order_discounts FOR UPDATE TO authenticated USING (true);

-- Create function to update warranty_expiration on warranty_period change
CREATE OR REPLACE FUNCTION update_warranty_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.warranty_period IS NOT NULL AND NEW.end_date IS NOT NULL THEN
    NEW.warranty_expiration := NEW.end_date + (NEW.warranty_period || ' days')::interval;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update warranty_expiration
CREATE TRIGGER update_warranty_expiration_trigger
  BEFORE INSERT OR UPDATE OF warranty_period, end_date
  ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_warranty_expiration();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating updated_at
CREATE TRIGGER update_service_orders_updated_at
  BEFORE UPDATE ON service_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_order_equipment_updated_at
  BEFORE UPDATE ON service_order_equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_order_checklists_updated_at
  BEFORE UPDATE ON service_order_checklists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_order_services_updated_at
  BEFORE UPDATE ON service_order_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_order_products_updated_at
  BEFORE UPDATE ON service_order_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_order_feedback_updated_at
  BEFORE UPDATE ON service_order_feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_order_discounts_updated_at
  BEFORE UPDATE ON service_order_discounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();