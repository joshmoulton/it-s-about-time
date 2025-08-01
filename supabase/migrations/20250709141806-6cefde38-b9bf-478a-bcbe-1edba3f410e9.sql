-- Add RLS policy to allow users to update their own beehiiv_subscribers record
CREATE POLICY "Users can update their own subscriber data" 
ON public.beehiiv_subscribers 
FOR UPDATE 
USING (email = ((current_setting('request.jwt.claims', true))::json ->> 'email'))
WITH CHECK (email = ((current_setting('request.jwt.claims', true))::json ->> 'email'));