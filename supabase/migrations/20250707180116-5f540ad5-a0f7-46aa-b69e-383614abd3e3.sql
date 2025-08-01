-- First, let's see the duplicates
SELECT email, COUNT(*) as count, array_agg(id) as ids 
FROM public.admin_users 
WHERE email IS NOT NULL 
GROUP BY email 
HAVING COUNT(*) > 1;