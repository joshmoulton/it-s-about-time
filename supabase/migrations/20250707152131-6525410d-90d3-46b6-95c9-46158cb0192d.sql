-- Fix RLS policies for beta_invites to work with admin users
DROP POLICY IF EXISTS "Admins and analysts can view beta invites" ON public.beta_invites;
DROP POLICY IF EXISTS "Admins and analysts can create beta invites" ON public.beta_invites;
DROP POLICY IF EXISTS "Admins and analysts can update beta invites" ON public.beta_invites;

-- Create new policies that work with the is_current_user_admin function
CREATE POLICY "Admin users can view beta invites" 
ON public.beta_invites 
FOR SELECT 
USING (is_current_user_admin());

CREATE POLICY "Admin users can create beta invites" 
ON public.beta_invites 
FOR INSERT 
WITH CHECK (is_current_user_admin());

CREATE POLICY "Admin users can update beta invites" 
ON public.beta_invites 
FOR UPDATE 
USING (is_current_user_admin());

CREATE POLICY "Admin users can delete beta invites" 
ON public.beta_invites 
FOR DELETE 
USING (is_current_user_admin());