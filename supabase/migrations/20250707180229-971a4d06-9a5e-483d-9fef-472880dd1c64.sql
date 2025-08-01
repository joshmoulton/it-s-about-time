-- Clean up duplicate records, keeping only the most recent one for each email
DELETE FROM public.admin_users 
WHERE id NOT IN (
  SELECT DISTINCT ON (email) id 
  FROM public.admin_users 
  WHERE email IS NOT NULL
  ORDER BY email, created_at DESC
);