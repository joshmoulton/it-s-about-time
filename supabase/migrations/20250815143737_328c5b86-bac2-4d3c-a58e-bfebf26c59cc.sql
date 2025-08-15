-- Step 1: Clear all existing sensitive data from magic_link_idempotency table
DELETE FROM public.magic_link_idempotency;

-- Step 2: Add RLS policies for security
ALTER TABLE public.magic_link_idempotency ENABLE ROW LEVEL SECURITY;

-- Only service role and super admins can access idempotency records
CREATE POLICY "magic_link_idempotency_admin_access" 
ON public.magic_link_idempotency 
FOR ALL 
USING (
  ((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR 
  has_admin_role('super_admin'::text)
)
WITH CHECK (
  ((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR 
  has_admin_role('super_admin'::text)
);