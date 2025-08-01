
-- Create tables for Whop integration
CREATE TABLE public.whop_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  whop_product_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.whop_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  whop_purchase_id TEXT NOT NULL UNIQUE,
  whop_product_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on Whop tables
ALTER TABLE public.whop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whop_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for Whop tables (accessible to authenticated users for now)
CREATE POLICY "Allow authenticated users to view Whop products" 
  ON public.whop_products 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to view Whop purchases" 
  ON public.whop_purchases 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_whop_products_whop_id ON public.whop_products(whop_product_id);
CREATE INDEX idx_whop_purchases_whop_id ON public.whop_purchases(whop_purchase_id);
CREATE INDEX idx_whop_purchases_email ON public.whop_purchases(customer_email);
CREATE INDEX idx_whop_purchases_product ON public.whop_purchases(whop_product_id);

-- Add trigger to update updated_at column
CREATE TRIGGER update_whop_products_updated_at
  BEFORE UPDATE ON public.whop_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whop_purchases_updated_at
  BEFORE UPDATE ON public.whop_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
