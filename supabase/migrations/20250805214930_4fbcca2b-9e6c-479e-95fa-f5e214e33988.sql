-- Update ness.envee@gmail.com to be marked as admin_created user
UPDATE public.beehiiv_subscribers 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'),
  '{source}',
  '"admin_created"'
)
WHERE email = 'ness.envee@gmail.com';