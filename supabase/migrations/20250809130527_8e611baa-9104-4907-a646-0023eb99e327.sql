-- Fix ambiguous overloaded function causing PostgREST PGRST203 errors
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'create_unified_session'
      AND pg_get_function_identity_arguments(p.oid) = 'p_email text, p_session_token text, p_tier text, p_source text, p_expires_at timestamp with time zone'
  ) THEN
    DROP FUNCTION public.create_unified_session(p_email text, p_session_token text, p_tier text, p_source text, p_expires_at timestamptz);
  END IF;
END $$;

-- Optional: ensure the enum-typed function exists (no-op if already present)
-- NOTE: We intentionally do not recreate functions here to avoid overwriting existing logic.
