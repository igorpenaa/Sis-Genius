/*
  # Add Equipment Information to Service Orders

  1. Changes
    - Add equipment information columns to service_orders table:
      - equipment_category (text)
      - equipment_subcategory (text)
      - equipment_brand (text)
      - equipment_model (text)
      - equipment_color (text)
      - equipment_imei (text)
      - equipment_reported_issue (text)
      - equipment_has_power (boolean)
      - customer_name (text)
      - attendant_name (text)

  2. Security
    - Maintain existing RLS policies
*/

-- Add equipment information columns
ALTER TABLE service_orders
  ADD COLUMN equipment_category text NOT NULL,
  ADD COLUMN equipment_subcategory text NOT NULL,
  ADD COLUMN equipment_brand text NOT NULL,
  ADD COLUMN equipment_model text NOT NULL,
  ADD COLUMN equipment_color text,
  ADD COLUMN equipment_imei text,
  ADD COLUMN equipment_reported_issue text NOT NULL,
  ADD COLUMN equipment_has_power boolean NOT NULL DEFAULT true,
  ADD COLUMN customer_name text NOT NULL,
  ADD COLUMN attendant_name text;