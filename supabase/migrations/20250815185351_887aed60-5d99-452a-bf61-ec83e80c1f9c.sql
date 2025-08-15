-- Fix the existing FART signal that got incorrectly created with ticker LONG
UPDATE analyst_signals 
SET ticker = 'FART'
WHERE ticker = 'LONG' 
AND full_description LIKE '%fart%' 
AND analyst_name = 'iamjoshmoulton';

-- Also update any related signal events
UPDATE signal_events 
SET detail = jsonb_set(detail, '{ticker}', '"FART"')
WHERE signal_id IN (
  SELECT id FROM analyst_signals 
  WHERE ticker = 'FART' 
  AND full_description LIKE '%fart%' 
  AND analyst_name = 'iamjoshmoulton'
);