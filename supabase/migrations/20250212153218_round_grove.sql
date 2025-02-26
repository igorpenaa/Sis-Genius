/*
  # Service Orders Schema

  1. New Tables
    - `service_orders`
      - `id` (uuid, primary key)
      - `number` (bigint, auto-incrementing)
      - `customer_id` (uuid, foreign key)
      - `technician_name` (text)
      - `status` (enum)
      - `start_date` (timestamp)
      - `end_date` (timestamp)
      - `warranty_period` (integer)
      - `warranty_expiration` (timestamp)
      - `total_amount` (decimal)
      - `discounted_amount` (decimal)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `service_orders` table
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
  customer_id uuid REFERENCES customers(id) NOT NULL,
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

-- Enable RLS
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all service orders"
  ON service_orders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create service orders"
  ON service_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update service orders"
  ON service_orders
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create function to update warranty_expiration on warranty_period change
CREATE OR REPLACE FUNCTION update_warranty_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.warranty_period IS NOT NULL AND NEW.start_date IS NOT NULL THEN
    NEW.warranty_expiration := NEW.start_date + (NEW.warranty_period || ' days')::interval;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update warranty_expiration
CREATE TRIGGER update_warranty_expiration_trigger
  BEFORE INSERT OR UPDATE OF warranty_period, start_date
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

-- Create trigger for updating updated_at
CREATE TRIGGER update_service_orders_updated_at
  BEFORE UPDATE
  ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();