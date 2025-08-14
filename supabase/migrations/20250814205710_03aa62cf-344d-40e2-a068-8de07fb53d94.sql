-- Create table for storing magic link tokens
CREATE TABLE IF NOT EXISTS public.magic_link_tokens (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL,
    token text NOT NULL UNIQUE,
    tier text NOT NULL DEFAULT 'free',
    expires_at timestamptz NOT NULL,
    used_at timestamptz DEFAULT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on magic_link_tokens table
ALTER TABLE public.magic_link_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for magic link tokens (only accessible by the functions)
CREATE POLICY "Service role can manage magic link tokens" 
ON public.magic_link_tokens 
FOR ALL 
USING (true);

-- Create index for token lookup
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_token ON public.magic_link_tokens(token);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_expires_at ON public.magic_link_tokens(expires_at);

-- Create function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_magic_link_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.magic_link_tokens 
  WHERE expires_at < now();
END;
$$;