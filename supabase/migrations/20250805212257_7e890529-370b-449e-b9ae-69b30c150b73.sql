-- Add performance indexes for frequently queried columns
-- Index for get_current_user_email_optimized() function performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email_active ON public.admin_users (email, is_active);

-- Index for user authentication queries
CREATE INDEX IF NOT EXISTS idx_beehiiv_subscribers_email_status ON public.beehiiv_subscribers (email, status);

-- Index for user profile lookups by email
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_email_tour ON public.user_profiles (user_email, tour_disabled);

-- Index for whop user lookups
CREATE INDEX IF NOT EXISTS idx_whop_users_email_tier ON public.whop_authenticated_users (user_email, subscription_tier);