-- Update storage policies for avatars bucket to support magic link users

-- Drop existing policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create new policies that support both auth.uid() and email-based authentication
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND (
    -- Support regular Supabase users
    (auth.uid() IS NOT NULL AND auth.uid()::text = (storage.foldername(name))[1]) OR
    -- Support magic link users via email
    (get_current_user_email_optimized() IS NOT NULL AND get_current_user_email_optimized() = (storage.foldername(name))[1]) OR
    -- Support admin users
    is_current_user_admin_fast()
  )
);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' AND (
    -- Support regular Supabase users
    (auth.uid() IS NOT NULL AND auth.uid()::text = (storage.foldername(name))[1]) OR
    -- Support magic link users via email
    (get_current_user_email_optimized() IS NOT NULL AND get_current_user_email_optimized() = (storage.foldername(name))[1]) OR
    -- Support admin users
    is_current_user_admin_fast()
  )
);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' AND (
    -- Support regular Supabase users
    (auth.uid() IS NOT NULL AND auth.uid()::text = (storage.foldername(name))[1]) OR
    -- Support magic link users via email
    (get_current_user_email_optimized() IS NOT NULL AND get_current_user_email_optimized() = (storage.foldername(name))[1]) OR
    -- Support admin users
    is_current_user_admin_fast()
  )
);

-- Enhanced upsert_user_profile_basic function for better magic link support
CREATE OR REPLACE FUNCTION public.upsert_user_profile_basic(
  p_display_name text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_email text;
  v_subscriber_id uuid;
  v_user_id uuid;
  v_whop_email text;
  v_result jsonb;
BEGIN
  -- Get current user email using optimized function
  v_user_email := get_current_user_email_optimized();
  
  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No authenticated user found'
    );
  END IF;

  -- Get subscriber ID from beehiiv_subscribers
  SELECT id INTO v_subscriber_id
  FROM public.beehiiv_subscribers
  WHERE email = v_user_email
  LIMIT 1;

  -- Get user_id from auth.users if available
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_user_email
  LIMIT 1;

  -- For whop users, use their email as whop_email
  IF v_user_id IS NULL THEN
    v_whop_email := v_user_email;
  END IF;

  -- Upsert the user profile
  INSERT INTO public.user_profiles (
    subscriber_id,
    user_id,
    whop_email,
    user_email,
    display_name,
    avatar_url,
    created_at,
    updated_at
  ) VALUES (
    v_subscriber_id,
    v_user_id,
    v_whop_email,
    v_user_email,
    COALESCE(p_display_name, v_user_email),
    p_avatar_url,
    now(),
    now()
  )
  ON CONFLICT (COALESCE(subscriber_id, gen_random_uuid()), COALESCE(user_id, gen_random_uuid()), COALESCE(whop_email, ''))
  DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
    updated_at = now()
  RETURNING 
    id,
    display_name,
    avatar_url,
    user_email,
    created_at,
    updated_at
  INTO v_result;

  RETURN jsonb_build_object(
    'success', true,
    'profile', to_jsonb(v_result)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;