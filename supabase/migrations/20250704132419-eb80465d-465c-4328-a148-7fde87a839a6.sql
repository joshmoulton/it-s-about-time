-- Update Whop environment variables to use standard naming convention
-- User needs to update these in Supabase Dashboard under Project Settings > Edge Functions:

-- Change WHOP_CLIENT_ID to WHOP_APP_ID (or keep NEXT_PUBLIC_WHOP_APP_ID if using that)
-- Keep WHOP_API_KEY as is
-- Remove WHOP_CLIENT_SECRET as it's not needed (API key serves dual purpose)

-- Required environment variables for Whop OAuth (standard naming):
-- WHOP_APP_ID=app_znQLR3LTbWRBy3 (or alternatively NEXT_PUBLIC_WHOP_APP_ID)
-- WHOP_API_KEY=OWuwuDkzQISXhJGH1r_I2IK1LXE-8h8PK_UkBDv7TmU

-- This migration documents the environment variable changes needed