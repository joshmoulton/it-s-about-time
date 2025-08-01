-- Create table to link Supabase users with BeehiIV subscribers
CREATE TABLE IF NOT EXISTS public.user_beehiiv_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  beehiiv_subscriber_id TEXT,
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_beehiiv_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_beehiiv_links
CREATE POLICY "Users can view their own BeehiIV link"
ON public.user_beehiiv_links
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all BeehiIV links"
ON public.user_beehiiv_links
FOR ALL
USING (public.is_current_user_admin());

-- Update beehiiv_subscribers table structure for new flow
ALTER TABLE public.beehiiv_subscribers 
ADD COLUMN IF NOT EXISTS beehiiv_id TEXT,
ADD COLUMN IF NOT EXISTS sync_source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS beehiiv_data JSONB;

-- Create unique constraint on beehiiv_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_beehiiv_subscribers_beehiiv_id 
ON public.beehiiv_subscribers(beehiiv_id) 
WHERE beehiiv_id IS NOT NULL;

-- Function to automatically sync new users to BeehiIV
CREATE OR REPLACE FUNCTION public.sync_new_user_to_beehiiv()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email TEXT;
  account_type TEXT;
BEGIN
  -- Get user email and account type from metadata
  user_email := NEW.email;
  account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'free');
  
  -- Only sync free accounts to BeehiIV (premium goes through Whop)
  IF account_type = 'free' AND user_email IS NOT NULL THEN
    -- Call BeehiIV sync function asynchronously
    PERFORM net.http_post(
      url := 'https://wrvvlmevpvcenauglcyz.supabase.co/functions/v1/beehiiv-subscriber-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydnZsbWV2cHZjZW5hdWdsY3l6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg1Mzk1MCwiZXhwIjoyMDY1NDI5OTUwfQ.H_srIeAcaWEtM3a2u9-dxLLmpU7mmHOHqrHCvWOwlEg'
      ),
      body := jsonb_build_object(
        'action', 'subscribe_user',
        'email', user_email,
        'userId', NEW.id::text
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user sync
DROP TRIGGER IF EXISTS trigger_sync_new_user_to_beehiiv ON auth.users;
CREATE TRIGGER trigger_sync_new_user_to_beehiiv
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL) -- Only trigger when email is confirmed
  EXECUTE FUNCTION public.sync_new_user_to_beehiiv();

-- Function to handle email confirmation and trigger BeehiIV sync
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If email just got confirmed and it's a free account
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    IF COALESCE(NEW.raw_user_meta_data->>'account_type', 'free') = 'free' THEN
      -- Trigger BeehiIV sync
      PERFORM net.http_post(
        url := 'https://wrvvlmevpvcenauglcyz.supabase.co/functions/v1/beehiiv-subscriber-sync',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydnZsbWV2cHZjZW5hdWdsY3l6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg1Mzk1MCwiZXhwIjoyMDY1NDI5OTUwfQ.H_srIeAcaWEtM3a2u9-dxLLmpU7mmHOHqrHCvWOwlEg'
        ),
        body := jsonb_build_object(
          'action', 'subscribe_user',
          'email', NEW.email,
          'userId', NEW.id::text
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for email confirmation
DROP TRIGGER IF EXISTS trigger_handle_email_confirmation ON auth.users;
CREATE TRIGGER trigger_handle_email_confirmation
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_email_confirmation();