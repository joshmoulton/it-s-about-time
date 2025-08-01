
-- Create a system settings table to store beta mode configuration
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on system settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Only admins can access system settings"
  ON public.system_settings
  FOR ALL
  TO authenticated
  USING (public.is_current_user_admin() = true);

-- Insert initial beta mode setting
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES (
  'beta_mode',
  '{"enabled": true, "started_at": null, "ended_at": null}',
  'Controls whether the platform is in beta mode with universal premium access'
);

-- Create trigger to update updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
