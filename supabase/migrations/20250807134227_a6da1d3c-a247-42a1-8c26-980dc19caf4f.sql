-- Create a unified user management system that handles both local admins and beehiiv users
-- This will prevent conflicts when someone is both a local admin and beehiiv subscriber

-- First, create a unified user identity table
CREATE TABLE IF NOT EXISTS public.unified_user_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- User type flags
    is_local_admin BOOLEAN DEFAULT FALSE,
    is_beehiiv_subscriber BOOLEAN DEFAULT FALSE,
    
    -- Primary source of identity (determines which system takes precedence)
    primary_source TEXT NOT NULL DEFAULT 'local', -- 'local' or 'beehiiv'
    
    -- Subscription info (from beehiiv)
    beehiiv_subscription_tier subscription_tier DEFAULT 'free',
    beehiiv_subscriber_id UUID,
    
    -- Admin info (from local system)
    admin_role TEXT DEFAULT NULL, -- 'admin', 'super_admin', etc.
    admin_user_id UUID,
    
    -- Effective permissions (computed)
    effective_tier subscription_tier DEFAULT 'free',
    effective_role TEXT DEFAULT 'user',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.unified_user_identities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own identity" 
ON public.unified_user_identities 
FOR SELECT 
USING (email = get_current_user_email_optimized() OR auth_user_id = auth.uid());

CREATE POLICY "Admins can view all identities" 
ON public.unified_user_identities 
FOR ALL 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- Function to get or create unified identity
CREATE OR REPLACE FUNCTION public.get_or_create_unified_identity(
    p_email TEXT,
    p_auth_user_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    identity_id UUID;
    existing_admin RECORD;
    existing_beehiiv RECORD;
    primary_source_val TEXT := 'local';
    admin_role_val TEXT := NULL;
    beehiiv_tier subscription_tier := 'free';
    effective_tier_val subscription_tier := 'free';
    effective_role_val TEXT := 'user';
BEGIN
    -- Check if identity already exists
    SELECT id INTO identity_id 
    FROM public.unified_user_identities 
    WHERE email = p_email;
    
    IF identity_id IS NOT NULL THEN
        RETURN identity_id;
    END IF;
    
    -- Check for existing admin user
    SELECT * INTO existing_admin 
    FROM public.admin_users 
    WHERE email = p_email AND is_active = true;
    
    -- Check for existing beehiiv subscriber
    SELECT * INTO existing_beehiiv 
    FROM public.beehiiv_subscribers 
    WHERE email = p_email;
    
    -- Determine primary source and effective permissions
    IF existing_admin.email IS NOT NULL THEN
        primary_source_val := 'local';
        admin_role_val := existing_admin.role;
        effective_role_val := existing_admin.role;
        -- Admins get premium access unless they have beehiiv premium
        effective_tier_val := 'premium';
    END IF;
    
    IF existing_beehiiv.email IS NOT NULL THEN
        beehiiv_tier := existing_beehiiv.subscription_tier;
        -- If user is beehiiv subscriber but not admin, beehiiv takes precedence
        IF existing_admin.email IS NULL THEN
            primary_source_val := 'beehiiv';
            effective_tier_val := existing_beehiiv.subscription_tier;
        ELSE
            -- User is both admin and beehiiv - use higher tier
            IF existing_beehiiv.subscription_tier = 'premium' THEN
                effective_tier_val := 'premium';
            END IF;
        END IF;
    END IF;
    
    -- Create unified identity
    INSERT INTO public.unified_user_identities (
        email,
        auth_user_id,
        is_local_admin,
        is_beehiiv_subscriber,
        primary_source,
        beehiiv_subscription_tier,
        beehiiv_subscriber_id,
        admin_role,
        admin_user_id,
        effective_tier,
        effective_role
    ) VALUES (
        p_email,
        p_auth_user_id,
        existing_admin.email IS NOT NULL,
        existing_beehiiv.email IS NOT NULL,
        primary_source_val,
        beehiiv_tier,
        existing_beehiiv.id,
        admin_role_val,
        existing_admin.id,
        effective_tier_val,
        effective_role_val
    ) RETURNING id INTO identity_id;
    
    RETURN identity_id;
END;
$$;

-- Function to update unified identity when admin or beehiiv status changes
CREATE OR REPLACE FUNCTION public.sync_unified_identity(p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    existing_admin RECORD;
    existing_beehiiv RECORD;
    effective_tier_val subscription_tier := 'free';
    effective_role_val TEXT := 'user';
BEGIN
    -- Check current admin status
    SELECT * INTO existing_admin 
    FROM public.admin_users 
    WHERE email = p_email AND is_active = true;
    
    -- Check current beehiiv status
    SELECT * INTO existing_beehiiv 
    FROM public.beehiiv_subscribers 
    WHERE email = p_email;
    
    -- Calculate effective permissions
    IF existing_admin.email IS NOT NULL THEN
        effective_role_val := existing_admin.role;
        effective_tier_val := 'premium'; -- Admins get premium by default
    END IF;
    
    IF existing_beehiiv.email IS NOT NULL THEN
        -- If user has beehiiv premium, use that tier
        IF existing_beehiiv.subscription_tier = 'premium' THEN
            effective_tier_val := 'premium';
        ELSIF existing_admin.email IS NULL THEN
            -- Non-admin beehiiv user uses their beehiiv tier
            effective_tier_val := existing_beehiiv.subscription_tier;
            effective_role_val := 'user';
        END IF;
    END IF;
    
    -- Update unified identity
    UPDATE public.unified_user_identities SET
        is_local_admin = existing_admin.email IS NOT NULL,
        is_beehiiv_subscriber = existing_beehiiv.email IS NOT NULL,
        beehiiv_subscription_tier = COALESCE(existing_beehiiv.subscription_tier, 'free'),
        beehiiv_subscriber_id = existing_beehiiv.id,
        admin_role = existing_admin.role,
        admin_user_id = existing_admin.id,
        effective_tier = effective_tier_val,
        effective_role = effective_role_val,
        updated_at = now()
    WHERE email = p_email;
    
    -- If no unified identity exists, create one
    IF NOT FOUND THEN
        PERFORM get_or_create_unified_identity(p_email);
    END IF;
END;
$$;

-- Function to get effective user tier (replaces get_current_user_tier)
CREATE OR REPLACE FUNCTION public.get_effective_user_tier()
RETURNS subscription_tier
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_email TEXT;
    user_tier subscription_tier := 'free';
BEGIN
    user_email := get_current_user_email_optimized();
    
    IF user_email IS NULL THEN
        RETURN 'free';
    END IF;
    
    -- Get from unified identity first
    SELECT effective_tier INTO user_tier
    FROM public.unified_user_identities
    WHERE email = user_email;
    
    -- If not found, sync and try again
    IF NOT FOUND THEN
        PERFORM sync_unified_identity(user_email);
        
        SELECT effective_tier INTO user_tier
        FROM public.unified_user_identities
        WHERE email = user_email;
    END IF;
    
    RETURN COALESCE(user_tier, 'free');
END;
$$;

-- Function to get effective user role
CREATE OR REPLACE FUNCTION public.get_effective_user_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_email TEXT;
    user_role TEXT := 'user';
BEGIN
    user_email := get_current_user_email_optimized();
    
    IF user_email IS NULL THEN
        RETURN 'user';
    END IF;
    
    -- Get from unified identity
    SELECT effective_role INTO user_role
    FROM public.unified_user_identities
    WHERE email = user_email;
    
    -- If not found, sync and try again
    IF NOT FOUND THEN
        PERFORM sync_unified_identity(user_email);
        
        SELECT effective_role INTO user_role
        FROM public.unified_user_identities
        WHERE email = user_email;
    END IF;
    
    RETURN COALESCE(user_role, 'user');
END;
$$;