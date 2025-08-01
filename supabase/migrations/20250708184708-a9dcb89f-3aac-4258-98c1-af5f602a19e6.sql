-- Clear newsletters with sync dates (July 8, 2025) to force fresh sync with accurate dates
DELETE FROM public.newsletters 
WHERE (
  -- Remove newsletters that have today's date (sync date) in any date field
  DATE(published_at) = '2025-07-08' OR
  DATE(beehiiv_created_at) = '2025-07-08' OR
  DATE(created_at) = '2025-07-08'
) AND (
  -- Keep newsletters that don't have the sync date in their published_at or beehiiv_created_at
  -- (meaning they only have sync date in created_at but have real dates elsewhere)
  NOT (published_at IS NOT NULL AND DATE(published_at) != '2025-07-08') AND
  NOT (beehiiv_created_at IS NOT NULL AND DATE(beehiiv_created_at) != '2025-07-08')
);