-- Fix the remaining critical RLS security issues

-- Enable RLS on tables that still need it (identified by linter)
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.video_tutorials ENABLE ROW LEVEL SECURITY;

-- Only add policies that don't exist yet
DO $$
BEGIN
  -- Newsletters policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'newsletters' AND policyname = 'newsletters_public_read') THEN
    CREATE POLICY "newsletters_public_read" 
    ON public.newsletters 
    FOR SELECT 
    USING (
      status = 'published' AND (
        required_tier = 'free' OR 
        (required_tier = 'paid' AND get_current_user_tier() IN ('paid', 'premium')) OR
        (required_tier = 'premium' AND get_current_user_tier() = 'premium') OR
        is_current_user_admin_fast()
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'newsletters' AND policyname = 'newsletters_admin_manage') THEN
    CREATE POLICY "newsletters_admin_manage" 
    ON public.newsletters 
    FOR ALL 
    USING (is_current_user_admin_fast())
    WITH CHECK (is_current_user_admin_fast());
  END IF;

  -- Telegram messages policies  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'telegram_messages' AND policyname = 'telegram_messages_premium_read') THEN
    CREATE POLICY "telegram_messages_premium_read" 
    ON public.telegram_messages 
    FOR SELECT 
    USING (
      get_current_user_tier() = 'premium' OR 
      is_current_user_admin_fast()
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'telegram_messages' AND policyname = 'telegram_messages_admin_manage') THEN
    CREATE POLICY "telegram_messages_admin_manage" 
    ON public.telegram_messages 
    FOR ALL 
    USING (is_current_user_admin_fast())
    WITH CHECK (is_current_user_admin_fast());
  END IF;
END $$;

-- Fix function search path security issues (set search_path to 'public')
ALTER FUNCTION public.get_current_user_email() SET search_path = 'public';
ALTER FUNCTION public.get_current_user_tier() SET search_path = 'public';
ALTER FUNCTION public.is_current_user_admin_fast() SET search_path = 'public';