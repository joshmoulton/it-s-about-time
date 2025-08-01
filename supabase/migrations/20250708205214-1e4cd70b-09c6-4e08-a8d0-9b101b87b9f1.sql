-- Fix the password setup status for existing user
UPDATE public.beehiiv_subscribers 
SET requires_password_setup = false
WHERE email = 'moulton.joshua@gmail.com' 
  AND requires_password_setup = true;