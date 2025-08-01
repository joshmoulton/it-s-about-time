-- Debug and check the current newsletters table structure and recent data
SELECT 
  title, 
  status,
  published_at,
  beehiiv_created_at,
  beehiiv_updated_at,
  created_at,
  updated_at,
  beehiiv_post_id
FROM newsletters 
ORDER BY created_at DESC 
LIMIT 5;