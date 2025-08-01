-- Create a function to manually clean up stale newsletters that return 404s
-- We'll delete the specific problematic newsletters mentioned by the user

-- Delete the specific "market-recap-bfa0" newsletter that was causing 404s
DELETE FROM public.newsletters 
WHERE beehiiv_post_id LIKE '%market-recap%' 
   OR beehiiv_post_id LIKE '%newsletter-sneak-peek%'
   OR title ILIKE '%market recap%'
   OR title ILIKE '%sneak peek%';

-- Also delete any newsletters with the specific IDs that were mentioned in the 404 URLs
DELETE FROM public.newsletters 
WHERE beehiiv_post_id IN (
  'market-recap-bfa0',
  'newsletter-sneak-peek-8afe'
);