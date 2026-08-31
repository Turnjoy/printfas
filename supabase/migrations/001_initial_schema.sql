-- PRINTFAS Database Schema
-- Supabase Migration Script

-- Enable UUID extension if not already enabled
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
    order_ref TEXT NOT NULL UNIQUE,
    service_type TEXT NOT NULL,
    is_custom_quote BOOLEAN DEFAULT false,
    upload_channel TEXT NOT NULL CHECK (upload_channel IN ('web', 'email', 'whatsapp')),
    files JSONB DEFAULT '[]'::jsonb,
    delivery_option TEXT NOT NULL CHECK (delivery_option IN ('pickup', 'delivery')),
    delivery_address TEXT,
    delivery_fee NUMERIC DEFAULT 0,
    amount NUMERIC NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'quoted', 'paid')),
    order_status TEXT NOT NULL DEFAULT 'received' CHECK (order_status IN ('received', 'processing', 'printing', 'ready', 'out_for_delivery', 'completed')),
    downloaded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_order_ref ON orders(order_ref);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Allow admins full access to profiles
CREATE POLICY "Admins have full access to profiles"
    ON profiles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for orders
-- Allow public (anonymous) creation of orders
CREATE POLICY "Public can create orders"
    ON orders FOR INSERT
    WITH CHECK (true);

-- Allow public lookup by order_ref
CREATE POLICY "Public can view orders by reference"
    ON orders FOR SELECT
    USING (order_ref IS NOT NULL);

-- Allow admins full read/write access to orders
CREATE POLICY "Admins have full access to orders"
    ON orders FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create storage bucket for print jobs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'print-jobs',
    'print-jobs',
    false,
    26214400, -- 25MB in bytes
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for storage bucket
-- Allow public upload to print-jobs bucket
CREATE POLICY "Public can upload to print-jobs"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'print-jobs');

-- Allow admins full access to print-jobs bucket
CREATE POLICY "Admins have full access to print-jobs"
    ON storage.objects FOR ALL
    USING (
        bucket_id = 'print-jobs' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow public read access to their own uploaded files (temporary signed URLs will be used)
CREATE POLICY "Public can read own print-jobs"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'print-jobs' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Function to generate unique order reference
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-generate order_ref if not provided
CREATE TRIGGER generate_order_ref_trigger
    BEFORE INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.order_ref IS NULL OR NEW.order_ref = '')
    EXECUTE FUNCTION generate_order_ref();
