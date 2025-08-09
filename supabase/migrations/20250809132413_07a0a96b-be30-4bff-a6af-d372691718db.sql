-- Grant local admin access to pidgeon@avium.trade without changing creation permissions
-- Idempotent insert-or-update to ensure correct status

-- 1) Insert if missing
INSERT INTO public.admin_users (email, role, user_type, is_active, subscriber_id)
SELECT 'pidgeon@avium.trade', 'admin', 'supabase_admin', true, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_users WHERE email = 'pidgeon@avium.trade'
);

-- 2) Ensure the record has the correct attributes and is active
UPDATE public.admin_users
SET 
  role = 'admin',
  user_type = 'supabase_admin',
  is_active = true,
  updated_at = now()
WHERE email = 'pidgeon@avium.trade';