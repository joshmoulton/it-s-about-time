-- Create a function to assign progressive dates to newsletters
CREATE OR REPLACE FUNCTION assign_progressive_newsletter_dates()
RETURNS TABLE(updated_count INTEGER, message TEXT) AS $$
DECLARE
  newsletter_record RECORD;
  start_date DATE := '2022-07-01';
  end_date DATE := CURRENT_DATE;
  total_newsletters INTEGER;
  day_increment NUMERIC;
  current_index INTEGER := 0;
  assigned_date TIMESTAMP WITH TIME ZONE;
  updated_count INTEGER := 0;
BEGIN
  -- Count newsletters needing date assignment
  SELECT COUNT(*) INTO total_newsletters 
  FROM newsletters 
  WHERE beehiiv_created_at IS NULL;
  
  -- Calculate day increment for even distribution
  day_increment := (end_date - start_date)::NUMERIC / GREATEST(total_newsletters - 1, 1);
  
  -- Process each newsletter without dates (ordered by created_at desc = newest first)
  FOR newsletter_record IN 
    SELECT id, title 
    FROM newsletters 
    WHERE beehiiv_created_at IS NULL 
    ORDER BY created_at DESC
  LOOP
    -- Calculate progressive date (newest newsletters get recent dates)
    assigned_date := end_date - (current_index * day_increment * INTERVAL '1 day');
    
    -- Add random time within the day
    assigned_date := assigned_date + (EXTRACT(hour FROM NOW()) || ' hours')::INTERVAL;
    assigned_date := assigned_date + (floor(random() * 60) || ' minutes')::INTERVAL;
    
    -- Update the newsletter
    UPDATE newsletters 
    SET 
      beehiiv_created_at = assigned_date,
      published_at = assigned_date,
      updated_at = NOW()
    WHERE id = newsletter_record.id;
    
    updated_count := updated_count + 1;
    current_index := current_index + 1;
    
    -- Log progress every 50 updates
    IF updated_count % 50 = 0 THEN
      RAISE NOTICE 'Updated % newsletters so far...', updated_count;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT updated_count, 'Successfully assigned progressive dates to ' || updated_count || ' newsletters from ' || start_date || ' to ' || end_date;
END;
$$ LANGUAGE plpgsql;