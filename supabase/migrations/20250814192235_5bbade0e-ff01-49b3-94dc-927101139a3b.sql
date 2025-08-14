-- Create magic_links table for storing magic link tokens
CREATE TABLE IF NOT EXISTS public.magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on magic_links table
ALTER TABLE public.magic_links ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to manage magic links
CREATE POLICY "Service role can manage magic links" ON public.magic_links
  FOR ALL USING (true)
  WITH CHECK (true);

-- Create index for efficient token lookups
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON public.magic_links(token);
CREATE INDEX IF NOT EXISTS idx_magic_links_email_expires ON public.magic_links(email, expires_at);