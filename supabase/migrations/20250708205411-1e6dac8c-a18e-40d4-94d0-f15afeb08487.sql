-- Update user to bypass password hash requirement for Supabase auth users
UPDATE public.beehiiv_subscribers 
SET 
  password_hash = 'SUPABASE_AUTH_USER',  -- Dummy value to indicate Supabase auth
  requires_password_setup = false
WHERE email = 'moulton.joshua@gmail.com';