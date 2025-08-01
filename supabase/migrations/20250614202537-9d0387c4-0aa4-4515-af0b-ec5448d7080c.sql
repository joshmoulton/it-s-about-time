
-- Allow admin users to view all subscribers
CREATE POLICY "Admin users can view all subscribers"
  ON public.beehiiv_subscribers
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());
