/*
  # Add Service Order Details

  1. Changes
    - Add service order items tables:
      - service_order_checklists (checklist items with status)
      - service_order_services (services with quantity and price)
      - service_order_products (products with quantity and price)
      - service_order_feedback (technical feedback)
      - service_order_discounts (discounts applied)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
*/

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
ALTER TABLE service_order_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_discounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for service_order_checklists
CREATE POLICY "Users can view all service order checklists"
  ON service_order_checklists FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create service order checklists"
  ON service_order_checklists FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update service order checklists"
  ON service_order_checklists FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete service order checklists"
  ON service_order_checklists FOR DELETE TO authenticated USING (true);

-- Create RLS policies for service_order_services
CREATE POLICY "Users can view all service order services"
  ON service_order_services FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create service order services"
  ON service_order_services FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update service order services"
  ON service_order_services FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete service order services"
  ON service_order_services FOR DELETE TO authenticated USING (true);

-- Create RLS policies for service_order_products
CREATE POLICY "Users can view all service order products"
  ON service_order_products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create service order products"
  ON service_order_products FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update service order products"
  ON service_order_products FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete service order products"
  ON service_order_products FOR DELETE TO authenticated USING (true);

-- Create RLS policies for service_order_feedback
CREATE POLICY "Users can view all service order feedback"
  ON service_order_feedback FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create service order feedback"
  ON service_order_feedback FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update service order feedback"
  ON service_order_feedback FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete service order feedback"
  ON service_order_feedback FOR DELETE TO authenticated USING (true);

-- Create RLS policies for service_order_discounts
CREATE POLICY "Users can view all service order discounts"
  ON service_order_discounts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create service order discounts"
  ON service_order_discounts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update service order discounts"
  ON service_order_discounts FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete service order discounts"
  ON service_order_discounts FOR DELETE TO authenticated USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating updated_at
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