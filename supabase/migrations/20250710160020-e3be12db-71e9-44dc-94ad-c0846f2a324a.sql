-- Add UPDATE policy for beehiiv_subscribers table so users can update their own profiles
CREATE POLICY "Users can update their own subscriber profile"
ON public.beehiiv_subscribers
FOR UPDATE
USING (email = (current_setting('request.jwt.claims', true)::json ->> 'email'))
WITH CHECK (email = (current_setting('request.jwt.claims', true)::json ->> 'email'));