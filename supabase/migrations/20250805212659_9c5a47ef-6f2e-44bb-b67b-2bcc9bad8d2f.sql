-- Remove ness.envee@gmail.com from admin_users table since they should only be a premium user
DELETE FROM public.admin_users WHERE email = 'ness.envee@gmail.com';

-- Verify they exist in beehiiv_subscribers with premium tier (they do, just confirming)
-- This user will now be treated as a regular premium subscriber without admin rights