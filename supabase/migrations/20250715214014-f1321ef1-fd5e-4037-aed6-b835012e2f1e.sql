-- Remove the admin tier override setting directly
DELETE FROM public.system_settings 
WHERE setting_key = 'admin_tier_override';