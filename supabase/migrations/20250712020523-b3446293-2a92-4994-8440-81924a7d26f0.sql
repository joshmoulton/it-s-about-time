-- Create user preferences table for syncing local data
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  preference_type TEXT NOT NULL, -- 'trading_profile', 'ui_settings', 'notifications', etc.
  preference_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_email, preference_type)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own preferences
CREATE POLICY "Users can manage their own preferences" 
ON public.user_preferences 
FOR ALL 
USING (user_email = get_current_user_email())
WITH CHECK (user_email = get_current_user_email());

-- Admins can read all preferences
CREATE POLICY "Admins can read all preferences" 
ON public.user_preferences 
FOR SELECT 
USING (is_current_user_admin());

-- Add updated_at trigger
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();