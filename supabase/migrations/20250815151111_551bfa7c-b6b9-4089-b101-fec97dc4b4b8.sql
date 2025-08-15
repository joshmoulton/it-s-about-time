-- Drop the insecure policy that allows public access
DROP POLICY IF EXISTS "magic_links_public_access" ON public.magic_links;

-- Create a secure policy that only allows service_role access
CREATE POLICY "magic_links_service_role_only" ON public.magic_links
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Clean up any potentially compromised magic links older than 1 hour
DELETE FROM public.magic_links WHERE created_at < now() - INTERVAL '1 hour';