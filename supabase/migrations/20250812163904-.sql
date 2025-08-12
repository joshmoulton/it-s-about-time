-- Security-definer upsert helpers for user settings and profiles
-- Ensure supporting unique indexes exist
CREATE UNIQUE INDEX IF NOT EXISTS user_preferences_user_email_preference_type_idx
ON public.user_preferences (user_email, preference_type);

CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_user_email_idx
ON public.user_profiles (user_email);

-- Upsert user preference for the currently authenticated user
CREATE OR REPLACE FUNCTION public.upsert_user_preference(
  p_preference_type text,
  p_preference_data jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_email text;
  v_row public.user_preferences%ROWTYPE;
BEGIN
  v_email := get_current_user_email();
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.user_preferences (user_email, preference_type, preference_data)
  VALUES (v_email, p_preference_type, p_preference_data)
  ON CONFLICT (user_email, preference_type)
  DO UPDATE SET 
    preference_data = EXCLUDED.preference_data,
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN to_jsonb(v_row);
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_user_preference(text, jsonb) TO anon, authenticated;

-- Upsert basic profile fields for the current user (email is taken from context)
CREATE OR REPLACE FUNCTION public.upsert_user_profile_basic(
  p_display_name text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_tour_disabled boolean DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_email text;
  v_row public.user_profiles%ROWTYPE;
BEGIN
  v_email := get_current_user_email();
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.user_profiles (user_email, display_name, avatar_url, tour_disabled, updated_at)
  VALUES (
    v_email,
    p_display_name,
    p_avatar_url,
    COALESCE(p_tour_disabled, false),
    now()
  )
  ON CONFLICT (user_email)
  DO UPDATE SET 
    display_name   = COALESCE(p_display_name, user_profiles.display_name),
    avatar_url     = COALESCE(p_avatar_url,   user_profiles.avatar_url),
    tour_disabled  = COALESCE(p_tour_disabled, user_profiles.tour_disabled),
    updated_at     = now()
  RETURNING * INTO v_row;

  RETURN to_jsonb(v_row);
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_user_profile_basic(text, text, boolean) TO anon, authenticated;