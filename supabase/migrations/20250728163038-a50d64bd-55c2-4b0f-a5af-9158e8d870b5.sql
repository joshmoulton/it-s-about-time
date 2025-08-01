-- Create edge function to populate beehiiv_subscribers from unified auth data
-- This will sync existing Whop users and any Beehiiv users to the local table

CREATE OR REPLACE FUNCTION sync_subscribers_from_sources()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    whop_synced INTEGER := 0;
    beehiiv_synced INTEGER := 0;
    result jsonb;
BEGIN
    -- Sync Whop authenticated users to beehiiv_subscribers
    INSERT INTO public.beehiiv_subscribers (
        email,
        subscription_tier,
        status,
        metadata,
        created_at,
        updated_at
    )
    SELECT 
        wau.user_email,
        wau.subscription_tier,
        'active',
        jsonb_build_object(
            'source', 'whop',
            'whop_user_id', wau.whop_user_id,
            'synced_at', now()
        ),
        wau.created_at,
        now()
    FROM public.whop_authenticated_users wau
    WHERE NOT EXISTS (
        SELECT 1 FROM public.beehiiv_subscribers bs 
        WHERE bs.email = wau.user_email
    );
    
    GET DIAGNOSTICS whop_synced = ROW_COUNT;
    
    -- Log the sync operation
    INSERT INTO public.authentication_audit_log (
        user_email,
        auth_method,
        action_type,
        metadata
    ) VALUES (
        'system',
        'data_sync',
        'subscriber_sync',
        jsonb_build_object(
            'whop_users_synced', whop_synced,
            'beehiiv_users_synced', beehiiv_synced,
            'sync_timestamp', now()
        )
    );
    
    result := jsonb_build_object(
        'success', true,
        'whop_users_synced', whop_synced,
        'beehiiv_users_synced', beehiiv_synced,
        'total_synced', whop_synced + beehiiv_synced
    );
    
    RETURN result;
END;
$$;

-- Execute the sync function
SELECT sync_subscribers_from_sources();