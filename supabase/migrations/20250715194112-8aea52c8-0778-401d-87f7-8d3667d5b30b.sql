-- Insert the premium user to fix immediate access issue
INSERT INTO public.beehiiv_subscribers (
  email, 
  status, 
  subscription_tier, 
  created_at, 
  updated_at,
  metadata
) VALUES (
  'johneus@gmail.com',
  'active',
  'premium',
  NOW(),
  NOW(),
  '{"manual_insert": true, "reason": "Fix missing premium user"}'
)
ON CONFLICT (email) DO UPDATE SET
  subscription_tier = 'premium',
  status = 'active',
  updated_at = NOW(),
  metadata = jsonb_set(
    COALESCE(beehiiv_subscribers.metadata, '{}'::jsonb),
    '{manual_fix}',
    '"true"'
  );