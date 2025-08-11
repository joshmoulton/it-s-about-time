-- Harden RLS for whop_purchases to protect customer purchase data
DO $$
DECLARE
  p RECORD;
BEGIN
  -- 1) Ensure RLS is enabled on the table
  BEGIN
    EXECUTE 'ALTER TABLE public.whop_purchases ENABLE ROW LEVEL SECURITY';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 2) Drop existing policies to replace with a secure baseline
  FOR p IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'whop_purchases'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.whop_purchases', p.policyname);
  END LOOP;

  -- 3) Admins: full access for operations (read/write/delete)
  EXECUTE 'CREATE POLICY "whop_purchases_admin_all" 
           ON public.whop_purchases 
           FOR ALL 
           USING (is_current_user_admin_fast()) 
           WITH CHECK (is_current_user_admin_fast())';

  -- 4) Users: can only read their own purchase records by email
  EXECUTE 'CREATE POLICY "whop_purchases_user_self_read" 
           ON public.whop_purchases 
           FOR SELECT 
           USING (customer_email = get_current_user_email_optimized())';

  -- 5) Service role (Edge Functions): full access for system operations
  EXECUTE 'CREATE POLICY "whop_purchases_service_all" 
           ON public.whop_purchases 
           FOR ALL 
           USING (((auth.jwt() ->> ''role'') = ''service_role'')) 
           WITH CHECK (((auth.jwt() ->> ''role'') = ''service_role''))';
END $$;