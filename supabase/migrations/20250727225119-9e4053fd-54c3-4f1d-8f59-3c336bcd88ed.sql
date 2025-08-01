-- Fix feedback submission for regular users by improving authentication detection
-- The issue is that get_current_user_email_optimized() only works for Supabase auth users,
-- but regular users use Whop authentication which doesn't set auth.uid()

-- Update the get_current_user_email_optimized function to handle more auth methods
CREATE OR REPLACE FUNCTION public.get_current_user_email_optimized()
RETURNS TEXT 
LANGUAGE plpgsql 
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_email TEXT;
    auth_uid UUID;
    jwt_email TEXT;
BEGIN
    -- Get auth.uid() once and store it
    auth_uid := auth.uid();
    
    -- If we have a Supabase auth user, use their email directly
    IF auth_uid IS NOT NULL THEN
        SELECT u.email INTO user_email 
        FROM auth.users u 
        WHERE u.id = auth_uid;
        
        IF user_email IS NOT NULL THEN
            RETURN user_email;
        END IF;
    END IF;
    
    -- Fall back to JWT claims for Whop users
    BEGIN
        jwt_email := current_setting('request.jwt.claims', true)::json->>'email';
        
        IF jwt_email IS NOT NULL AND jwt_email != '' THEN
            RETURN jwt_email;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- JWT parsing failed, continue to other methods
        NULL;
    END;
    
    -- Alternative approach: check app setting that might be set by enhanced auth
    BEGIN
        IF current_setting('app.current_user_email', true) IS NOT NULL THEN
            RETURN current_setting('app.current_user_email', true);
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Return null if no user found
    RETURN NULL;
END;
$$;

-- Create a more permissive RLS policy for feedback that allows authenticated users
-- to submit feedback even if get_current_user_email_optimized() returns null
DROP POLICY IF EXISTS "feedback_user_manage" ON public.feedback;

-- Create a new policy that's more flexible for different auth methods
CREATE POLICY "feedback_user_submit" ON public.feedback
FOR INSERT 
WITH CHECK (
    -- Allow if user email matches current user OR if user is authenticated via any method
    user_email = get_current_user_email_optimized() OR 
    auth.uid() IS NOT NULL OR
    current_setting('request.jwt.claims', true)::json->>'email' IS NOT NULL
);

-- Create a separate policy for reading feedback (users can only read their own)
CREATE POLICY "feedback_user_read" ON public.feedback
FOR SELECT 
USING (
    user_email = get_current_user_email_optimized() OR
    user_email = auth.email() OR
    user_email = current_setting('request.jwt.claims', true)::json->>'email'
);

-- Create a policy for updating feedback (users can only update their own)
CREATE POLICY "feedback_user_update" ON public.feedback
FOR UPDATE 
USING (
    user_email = get_current_user_email_optimized() OR
    user_email = auth.email() OR
    user_email = current_setting('request.jwt.claims', true)::json->>'email'
)
WITH CHECK (
    char_length(title) <= 200 AND char_length(description) <= 2000
);