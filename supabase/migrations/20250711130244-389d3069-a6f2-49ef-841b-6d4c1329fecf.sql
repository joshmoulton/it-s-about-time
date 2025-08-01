-- Update RLS policy for beehiiv_subscribers to allow super admins full access for dashboard stats
DROP POLICY IF EXISTS "Enhanced admins can view subscribers with restrictions" ON public.beehiiv_subscribers;

-- Create new policy that allows super admins full access and regular admins restricted access
CREATE POLICY "Super admins can view all subscribers for dashboard stats" 
ON public.beehiiv_subscribers 
FOR SELECT 
USING (
  has_admin_role('super_admin'::text) OR 
  (has_admin_role('admin'::text) AND email = get_current_user_email())
);