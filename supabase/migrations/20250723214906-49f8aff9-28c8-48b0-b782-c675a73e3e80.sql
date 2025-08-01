-- Add analyst_id to admin_users table to link admin users to specific analysts
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS analyst_id uuid REFERENCES public.analysts(id);

-- Add an index for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_analyst_id ON public.admin_users(analyst_id);