-- Enable RLS on user_trading_profiles if not already enabled
ALTER TABLE public.user_trading_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_trading_profiles table
CREATE POLICY "Users can view their own trading profiles" 
ON public.user_trading_profiles 
FOR SELECT 
USING (user_email = ((current_setting('request.jwt.claims', true))::json ->> 'email'));

CREATE POLICY "Users can insert their own trading profiles" 
ON public.user_trading_profiles 
FOR INSERT 
WITH CHECK (user_email = ((current_setting('request.jwt.claims', true))::json ->> 'email'));

CREATE POLICY "Users can update their own trading profiles" 
ON public.user_trading_profiles 
FOR UPDATE 
USING (user_email = ((current_setting('request.jwt.claims', true))::json ->> 'email'))
WITH CHECK (user_email = ((current_setting('request.jwt.claims', true))::json ->> 'email'));

CREATE POLICY "Users can delete their own trading profiles" 
ON public.user_trading_profiles 
FOR DELETE 
USING (user_email = ((current_setting('request.jwt.claims', true))::json ->> 'email'));

-- Create storage policies for assets bucket to allow authenticated users to upload avatars
CREATE POLICY "Authenticated users can upload to assets bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'assets');

CREATE POLICY "Users can update their own assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'assets' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'assets' AND auth.role() = 'authenticated');