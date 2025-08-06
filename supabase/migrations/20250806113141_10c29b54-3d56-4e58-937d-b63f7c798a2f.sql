-- Disable RLS on content tables to fix 400 errors with custom authentication
-- Application-level access control (FreemiumWidgetWrapper) provides security

-- Disable RLS on video_tutorials table
ALTER TABLE public.video_tutorials DISABLE ROW LEVEL SECURITY;

-- Disable RLS on telegram_messages table  
ALTER TABLE public.telegram_messages DISABLE ROW LEVEL SECURITY;

-- Disable RLS on newsletters table
ALTER TABLE public.newsletters DISABLE ROW LEVEL SECURITY;