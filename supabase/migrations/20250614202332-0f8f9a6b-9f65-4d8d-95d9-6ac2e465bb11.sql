
-- Remove problematic RLS policies from newsletters (if any)
DROP POLICY IF EXISTS "Admin users can manage newsletters" ON public.newsletters;
DROP POLICY IF EXISTS "Admin users can create newsletters" ON public.newsletters;

-- Create a security definer function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users au
    JOIN public.beehiiv_subscribers bs ON au.subscriber_id = bs.id
    WHERE bs.email = current_setting('request.jwt.claims', true)::json->>'email'
      AND au.is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Re-create the admin policies using the security definer function (avoids referencing admin_users with policies)
CREATE POLICY "Admin users can manage newsletters"
  ON public.newsletters
  FOR ALL
  USING (public.is_current_user_admin());

CREATE POLICY "Admin users can create newsletters"
  ON public.newsletters
  FOR INSERT
  WITH CHECK (public.is_current_user_admin());
