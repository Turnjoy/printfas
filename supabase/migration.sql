-- PRINTFAS Supabase Database Migration Script
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client')),
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_ref TEXT UNIQUE NOT NULL,
  service_type TEXT NOT NULL,
  is_custom_quote BOOLEAN DEFAULT false,
  upload_channel TEXT CHECK (upload_channel IN ('web', 'email', 'whatsapp')),
  files JSONB DEFAULT '[]'::jsonb,
  delivery_option TEXT NOT NULL CHECK (delivery_option IN ('pickup', 'delivery')),
  delivery_address TEXT,
  delivery_fee NUMERIC DEFAULT 0,
  amount NUMERIC NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'quoted', 'paid')),
  order_status TEXT NOT NULL DEFAULT 'received' CHECK (order_status IN ('received', 'processing', 'printing', 'ready', 'out_for_delivery', 'completed')),
  downloaded_at TIMESTAMPTZ,
  client_email TEXT,
  client_name TEXT,
  client_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_order_ref ON orders(order_ref);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_downloaded_at ON orders(downloaded_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
-- Allow users to see their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow service role to insert profiles (for signup)
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for orders
-- Allow public (anonymous) to create orders
CREATE POLICY "Public can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Allow public to lookup orders by order_ref
CREATE POLICY "Public can view orders by reference"
  ON orders FOR SELECT
  USING (true);

-- Allow admins full access to orders
CREATE POLICY "Admins have full access to orders"
  ON orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create storage bucket for print jobs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('print-jobs', 'print-jobs', false, 26214400, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
-- Allow public upload to print-jobs bucket
CREATE POLICY "Public can upload to print-jobs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'print-jobs');

-- Allow public to read files from print-jobs bucket (temporary signed URLs will be used)
CREATE POLICY "Public can read from print-jobs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'print-jobs');

-- Allow admins full access to print-jobs bucket
CREATE POLICY "Admins have full access to print-jobs"
  ON storage.objects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to generate order reference
CREATE OR REPLACE FUNCTION generate_order_ref()
RETURNS TEXT AS $$
DECLARE
  ref TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    ref := 'PF-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_ref = ref) INTO exists;
    IF NOT exists THEN
      RETURN ref;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate order_ref
CREATE OR REPLACE FUNCTION set_order_ref()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_ref IS NULL OR NEW.order_ref = '' THEN
    NEW.order_ref := generate_order_ref();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_ref_before_insert
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_ref();

-- Create function to handle order status updates
CREATE OR REPLACE FUNCTION update_order_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-update payment_status when order_status changes
  IF NEW.order_status = 'processing' AND OLD.order_status != 'processing' THEN
    IF NEW.payment_status = 'pending' THEN
      NEW.payment_status := 'quoted';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_status_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_order_status();

-- Create initial admin user (password needs to be set separately)
-- This creates a placeholder - you'll need to set up the actual user via Supabase Auth
-- INSERT INTO profiles (id, role, email, full_name)
-- VALUES ('<admin-uuid-from-auth>', 'admin', 'admin@printfas.com', 'PRINTFAS Admin');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
