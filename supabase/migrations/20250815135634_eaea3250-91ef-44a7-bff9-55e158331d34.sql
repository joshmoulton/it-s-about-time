-- CRITICAL SECURITY FIX: Implement proper RLS policies for magic_link_tokens table
-- Current issue: Table is publicly readable exposing user emails and tokens

-- Drop the dangerous public policy that allows everything
DROP POLICY IF EXISTS "Service role can manage magic link tokens" ON public.magic_link_tokens;

-- Create secure RLS policies that protect user data

-- 1. Allow service role access for system operations (token generation/cleanup)
CREATE POLICY "Service role access for magic link tokens" 
ON public.magic_link_tokens 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 2. Allow users to read only their own unused, non-expired tokens
CREATE POLICY "Users can read their own valid tokens" 
ON public.magic_link_tokens 
FOR SELECT 
TO authenticated, anon
USING (
  email = get_current_user_email_optimized() 
  AND expires_at > now() 
  AND used_at IS NULL
);

-- 3. Allow token validation by matching token value (for login process)
CREATE POLICY "Token validation for authentication" 
ON public.magic_link_tokens 
FOR SELECT 
TO authenticated, anon
USING (
  expires_at > now() 
  AND used_at IS NULL
  AND token = current_setting('request.jwt.claims', true)::json->>'magic_token'
);

-- 4. Allow users to update their own tokens (mark as used)
CREATE POLICY "Users can update their own tokens" 
ON public.magic_link_tokens 
FOR UPDATE 
TO authenticated
USING (email = get_current_user_email_optimized())
WITH CHECK (email = get_current_user_email_optimized());

-- 5. Admin access for management and debugging
CREATE POLICY "Admin access for magic link tokens" 
ON public.magic_link_tokens 
FOR ALL 
TO authenticated
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- Add security comment
COMMENT ON TABLE public.magic_link_tokens IS 'Secure magic link tokens table with RLS policies protecting user email addresses and authentication tokens from unauthorized access';