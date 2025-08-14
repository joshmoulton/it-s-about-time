-- Add used_at column to magic_links table for tracking when tokens are used
ALTER TABLE public.magic_links ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;