-- Fix function search path security warning
-- Update any functions that don't have search_path set

-- This creates a secure version of the feedback submission policy check
CREATE OR REPLACE FUNCTION public.is_feedback_submission_allowed(p_user_email text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow authenticated users with their email
  IF auth.uid() IS NOT NULL AND p_user_email = auth.email() THEN
    RETURN true;
  END IF;
  
  -- Allow anonymous submissions
  IF auth.uid() IS NULL THEN
    RETURN true;
  END IF;
  
  -- Allow admin submissions
  IF is_current_user_admin_fast() THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;