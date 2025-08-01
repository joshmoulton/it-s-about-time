-- Create newsletter blacklist table to prevent specific newsletters from syncing
CREATE TABLE public.newsletter_blacklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beehiiv_post_id text NOT NULL UNIQUE,
  title text NOT NULL,
  reason text,
  blacklisted_by text,
  blacklisted_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.newsletter_blacklist ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "newsletter_blacklist_admin_full" 
ON public.newsletter_blacklist 
FOR ALL 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- Add indexes for performance
CREATE INDEX idx_newsletter_blacklist_beehiiv_post_id ON public.newsletter_blacklist(beehiiv_post_id);
CREATE INDEX idx_newsletter_blacklist_created_at ON public.newsletter_blacklist(created_at);

-- Add trigger for updated_at
CREATE TRIGGER update_newsletter_blacklist_updated_at
    BEFORE UPDATE ON public.newsletter_blacklist
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function to add newsletter to blacklist
CREATE OR REPLACE FUNCTION public.blacklist_newsletter(
  p_beehiiv_post_id text,
  p_title text DEFAULT '',
  p_reason text DEFAULT 'Manually blacklisted'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins can blacklist newsletters
  IF NOT is_current_user_admin_fast() THEN
    RAISE EXCEPTION 'Access denied: Admin access required';
  END IF;
  
  INSERT INTO public.newsletter_blacklist (
    beehiiv_post_id,
    title,
    reason,
    blacklisted_by
  ) VALUES (
    p_beehiiv_post_id,
    p_title,
    p_reason,
    get_current_user_email_optimized()
  )
  ON CONFLICT (beehiiv_post_id) DO UPDATE SET
    reason = EXCLUDED.reason,
    blacklisted_by = EXCLUDED.blacklisted_by,
    blacklisted_at = now(),
    updated_at = now();
END;
$$;

-- Add the problematic newsletters to blacklist
INSERT INTO public.newsletter_blacklist (beehiiv_post_id, title, reason, blacklisted_by) VALUES 
('monthly-report-october-2023', 'Monthly Report: October 2023', 'Old newsletter that keeps syncing to top - should not sync', 'system'),
('bracing-for-volatility', 'Bracing For Volatility', 'Old newsletter that keeps syncing to top - should not sync', 'system')
ON CONFLICT (beehiiv_post_id) DO NOTHING;