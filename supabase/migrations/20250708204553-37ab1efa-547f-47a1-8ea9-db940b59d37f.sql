-- Add magic link columns to beehiiv_subscribers table
ALTER TABLE public.beehiiv_subscribers 
ADD COLUMN IF NOT EXISTS magic_link_token text,
ADD COLUMN IF NOT EXISTS magic_link_expires_at timestamp with time zone;