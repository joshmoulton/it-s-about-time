-- Create whop_authenticated_users table if it doesn't exist (based on the function references)
CREATE TABLE IF NOT EXISTS public.whop_authenticated_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email text NOT NULL UNIQUE,
    whop_user_id text,
    subscription_tier subscription_tier NOT NULL DEFAULT 'free',
    subscription_status text DEFAULT 'active',
    whop_product_id text,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whop_authenticated_users ENABLE ROW LEVEL SECURITY;

-- Create policies for whop_authenticated_users
CREATE POLICY "Users can view their own whop data" 
ON public.whop_authenticated_users 
FOR SELECT 
USING (user_email = get_current_user_email());

CREATE POLICY "Service role can manage whop users" 
ON public.whop_authenticated_users 
FOR ALL 
USING (true);

-- Insert your user into whop_authenticated_users if not exists
INSERT INTO public.whop_authenticated_users (user_email, subscription_tier, subscription_status)
VALUES ('moulton.joshua@gmail.com', 'premium', 'active')
ON CONFLICT (user_email) DO UPDATE SET
    subscription_tier = EXCLUDED.subscription_tier,
    subscription_status = EXCLUDED.subscription_status,
    updated_at = now();