-- Drop existing policies on user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;

-- Create updated policies using the correct functions
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (
  auth.uid() = user_id OR
  user_email = get_current_user_email_optimized() OR
  whop_email = get_current_user_email_optimized()
);

CREATE POLICY "Users can create their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR
  user_email = get_current_user_email_optimized() OR
  whop_email = get_current_user_email_optimized()
);

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (
  auth.uid() = user_id OR
  user_email = get_current_user_email_optimized() OR
  whop_email = get_current_user_email_optimized()
);

CREATE POLICY "Admins can manage all profiles" 
ON public.user_profiles 
FOR ALL 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());