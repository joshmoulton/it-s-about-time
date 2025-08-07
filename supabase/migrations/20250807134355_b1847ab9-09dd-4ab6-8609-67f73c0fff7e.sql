-- Update user_sessions table to reference unified identity
-- and fix the ON CONFLICT issue by ensuring proper unique constraints

-- First, let's add a column to reference unified identity
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS unified_identity_id UUID REFERENCES public.unified_user_identities(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_unified_identity 
ON public.user_sessions(unified_identity_id);

-- Update the existing get_current_user_tier function to use the new system
CREATE OR REPLACE FUNCTION public.get_current_user_tier()
RETURNS subscription_tier
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT get_effective_user_tier();
$$;

-- Function to create or update session using unified identity
CREATE OR REPLACE FUNCTION public.create_unified_session(
    p_email TEXT,
    p_session_token TEXT,
    p_tier subscription_tier DEFAULT 'free',
    p_source TEXT DEFAULT 'beehiiv',
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    identity_id UUID;
    auth_user_id UUID;
    session_id UUID;
    actual_tier subscription_tier;
    actual_role TEXT;
BEGIN
    -- Ensure we have a valid expiration time
    IF p_expires_at IS NULL THEN
        p_expires_at := now() + INTERVAL '30 minutes';
    END IF;
    
    -- Get or create auth user if doesn't exist
    SELECT id INTO auth_user_id FROM auth.users WHERE email = p_email;
    
    -- Get or create unified identity
    identity_id := get_or_create_unified_identity(p_email, auth_user_id);
    
    -- Sync the identity to get latest permissions
    PERFORM sync_unified_identity(p_email);
    
    -- Get the effective tier and role
    SELECT effective_tier, effective_role 
    INTO actual_tier, actual_role
    FROM public.unified_user_identities 
    WHERE id = identity_id;
    
    -- Create or update session using the unified identity
    INSERT INTO public.user_sessions (
        unified_identity_id,
        user_id,
        session_token,
        tier,
        source,
        expires_at
    ) VALUES (
        identity_id,
        auth_user_id,
        p_session_token,
        actual_tier,
        p_source,
        p_expires_at
    )
    ON CONFLICT (session_token) 
    DO UPDATE SET
        unified_identity_id = EXCLUDED.unified_identity_id,
        user_id = EXCLUDED.user_id,
        tier = EXCLUDED.tier,
        source = EXCLUDED.source,
        expires_at = EXCLUDED.expires_at,
        updated_at = now()
    RETURNING id INTO session_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'session_id', session_id,
        'identity_id', identity_id,
        'effective_tier', actual_tier,
        'effective_role', actual_role,
        'is_local_admin', (SELECT is_local_admin FROM public.unified_user_identities WHERE id = identity_id),
        'is_beehiiv_subscriber', (SELECT is_beehiiv_subscriber FROM public.unified_user_identities WHERE id = identity_id)
    );
END;
$$;

-- Create a trigger to automatically sync unified identity when admin_users changes
CREATE OR REPLACE FUNCTION public.sync_admin_identity_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM sync_unified_identity(NEW.email);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM sync_unified_identity(OLD.email);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Create a trigger to automatically sync unified identity when beehiiv_subscribers changes
CREATE OR REPLACE FUNCTION public.sync_beehiiv_identity_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM sync_unified_identity(NEW.email);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM sync_unified_identity(OLD.email);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Add triggers to keep unified identity in sync
DROP TRIGGER IF EXISTS sync_admin_identity ON public.admin_users;
CREATE TRIGGER sync_admin_identity
    AFTER INSERT OR UPDATE OR DELETE ON public.admin_users
    FOR EACH ROW EXECUTE FUNCTION sync_admin_identity_trigger();

DROP TRIGGER IF EXISTS sync_beehiiv_identity ON public.beehiiv_subscribers;
CREATE TRIGGER sync_beehiiv_identity
    AFTER INSERT OR UPDATE OR DELETE ON public.beehiiv_subscribers
    FOR EACH ROW EXECUTE FUNCTION sync_beehiiv_identity_trigger();

-- Populate existing unified identities for current users
INSERT INTO public.unified_user_identities (email, auth_user_id, is_local_admin, is_beehiiv_subscriber)
SELECT 
    COALESCE(au.email, bs.email) as email,
    NULL as auth_user_id,
    au.email IS NOT NULL as is_local_admin,
    bs.email IS NOT NULL as is_beehiiv_subscriber
FROM (
    SELECT email FROM admin_users WHERE is_active = true
    UNION 
    SELECT email FROM beehiiv_subscribers
) emails(email)
LEFT JOIN admin_users au ON au.email = emails.email AND au.is_active = true
LEFT JOIN beehiiv_subscribers bs ON bs.email = emails.email
ON CONFLICT (email) DO NOTHING;

-- Sync all existing identities to populate correct permissions
DO $$
DECLARE
    identity_record RECORD;
BEGIN
    FOR identity_record IN SELECT email FROM unified_user_identities LOOP
        PERFORM sync_unified_identity(identity_record.email);
    END LOOP;
END;
$$;