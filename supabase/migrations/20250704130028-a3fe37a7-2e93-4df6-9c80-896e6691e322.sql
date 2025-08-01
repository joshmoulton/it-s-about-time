-- Update Whop OAuth environment variables with correct credentials
-- Note: The user needs to update these in the Supabase Dashboard under Project Settings > Edge Functions

-- Based on Whop OAuth guide, the correct environment variables should be:
-- WHOP_CLIENT_ID=app_znQLR3LTbWRBy3 (this is the APP ID in Whop terms)
-- WHOP_CLIENT_SECRET=OWuwuDkzQISXhJGH1r_I2IK1LXE-8h8PK_UkBDv7TmU (this is the API KEY in Whop terms)
-- WHOP_API_KEY=OWuwuDkzQISXhJGH1r_I2IK1LXE-8h8PK_UkBDv7TmU (same as client secret)

-- This migration documents the required environment variables with the updated values
-- The actual values need to be updated in Supabase Dashboard