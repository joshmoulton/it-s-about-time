
-- Extension Configuration and Security Settings

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Note: Auth OTP Long Expiry fix
-- This needs to be configured in the Supabase dashboard under Authentication > Settings
-- Set JWT expiry to a reasonable value (3600 seconds = 1 hour is recommended)

-- Note: Enable leaked password protection
-- This also needs to be configured in the Supabase dashboard under Authentication > Settings
-- Enable "Leaked Password Protection" option
