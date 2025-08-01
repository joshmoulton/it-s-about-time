-- Fix user type for local admin user
UPDATE public.admin_users 
SET user_type = 'supabase_admin' 
WHERE email = 'moulton.joshua@gmail.com' AND user_type = 'whop_admin';