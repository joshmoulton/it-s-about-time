
-- First, let's drop the existing problematic policies
DROP POLICY IF EXISTS "Admins can manage video tutorials" ON public.video_tutorials;
DROP POLICY IF EXISTS "Users can view published videos" ON public.video_tutorials;

-- Create a security definer function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    JOIN public.beehiiv_subscribers bs ON au.subscriber_id = bs.id
    WHERE bs.email = current_setting('request.jwt.claims', true)::json->>'email'
    AND au.is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create a function to check user subscription tier
CREATE OR REPLACE FUNCTION public.get_current_user_tier()
RETURNS subscription_tier AS $$
BEGIN
  RETURN (
    SELECT bs.subscription_tier 
    FROM public.beehiiv_subscribers bs
    WHERE bs.email = current_setting('request.jwt.claims', true)::json->>'email'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new policies using the security definer functions
CREATE POLICY "Admins can manage video tutorials"
  ON public.video_tutorials
  FOR ALL
  TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY "Users can view published videos"
  ON public.video_tutorials
  FOR SELECT
  TO authenticated
  USING (
    status = 'published' 
    AND (
      required_tier = 'free' OR
      (required_tier = 'paid' AND public.get_current_user_tier() IN ('paid', 'premium')) OR
      (required_tier = 'premium' AND public.get_current_user_tier() = 'premium') OR
      public.is_current_user_admin()
    )
  );
