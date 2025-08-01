-- Add password reset fields to admin_users table
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS requires_password_reset BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS temp_password_set_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_reset_required_reason TEXT;