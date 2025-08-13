-- Close the old ETH LONG call that should have been auto-closed
UPDATE analyst_signals 
SET status = 'closed', updated_at = now()
WHERE id = '1b812e26-0d4c-449d-b0cb-2767798c8cf9' 
AND ticker = 'ETH' 
AND trade_direction = 'long' 
AND status = 'active';