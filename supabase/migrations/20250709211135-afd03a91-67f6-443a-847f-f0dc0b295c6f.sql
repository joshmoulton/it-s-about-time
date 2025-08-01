-- Remove beta-related functionality and simplify authentication

-- Drop beta invite tables and functions
DROP TABLE IF EXISTS public.beta_invites CASCADE;

-- Remove beta-related columns from beehiiv_subscribers
ALTER TABLE public.beehiiv_subscribers 
DROP COLUMN IF EXISTS beta_access_expires_at,
DROP COLUMN IF EXISTS beta_access_granted,
DROP COLUMN IF EXISTS beta_user,
DROP COLUMN IF EXISTS requires_password_setup,
DROP COLUMN IF EXISTS magic_link_token,
DROP COLUMN IF EXISTS magic_link_expires_at,
DROP COLUMN IF EXISTS password_reset_token,
DROP COLUMN IF EXISTS password_reset_expires_at,
DROP COLUMN IF EXISTS password_hash,
DROP COLUMN IF EXISTS login_attempts,
DROP COLUMN IF EXISTS locked_until;

-- Remove beta mode from system settings
DELETE FROM public.system_settings WHERE setting_key = 'beta_mode';

-- Drop beta-related functions
DROP FUNCTION IF EXISTS public.accept_beta_invite(text, text);
DROP FUNCTION IF EXISTS public.send_magic_link(text);
DROP FUNCTION IF EXISTS public.validate_password_strength(text);
DROP FUNCTION IF EXISTS public.is_account_locked(text);

-- Simplify beehiiv_subscribers to focus on basic subscriber info
-- Keep only essential fields for newsletter subscribers
COMMENT ON TABLE public.beehiiv_subscribers IS 'Basic newsletter subscriber information from BeehiIV';

-- Update subscription tier logic to focus on WHOP authentication
-- Users get premium access through WHOP, free through beehiiv subscription
UPDATE public.beehiiv_subscribers 
SET subscription_tier = 'free'::subscription_tier 
WHERE subscription_tier IS NULL;