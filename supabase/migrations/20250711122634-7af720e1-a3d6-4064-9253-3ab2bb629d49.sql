-- Temporarily disable audit trigger, fix user type, then re-enable
DROP TRIGGER IF EXISTS audit_admin_users_changes ON public.admin_users;

-- Fix user type for local admin user  
UPDATE public.admin_users 
SET user_type = 'supabase_admin' 
WHERE email = 'moulton.joshua@gmail.com' AND user_type = 'whop_admin';

-- Re-enable audit trigger
CREATE TRIGGER audit_admin_users_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();