-- Remove tier-based RLS policies and replace with authenticated-user policies

-- Drop existing tier-based policies
DROP POLICY IF EXISTS "Feed controls premium access" ON admin_feed_controls;
DROP POLICY IF EXISTS "analyst_signals_authenticated_users" ON analyst_signals;
DROP POLICY IF EXISTS "articles_tier_access" ON articles;
DROP POLICY IF EXISTS "auto_highlights_premium_access" ON auto_highlights;
DROP POLICY IF EXISTS "chat_highlights_premium_access" ON chat_highlights;
DROP POLICY IF EXISTS "course_modules_tier_access" ON course_modules;
DROP POLICY IF EXISTS "courses_tier_access" ON courses;

-- Create new simplified authenticated-user policies
CREATE POLICY "Feed controls authenticated access" 
ON admin_feed_controls 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "analyst_signals_authenticated_read" 
ON analyst_signals 
FOR SELECT 
TO authenticated
USING (status = 'active');

CREATE POLICY "articles_authenticated_read" 
ON articles 
FOR SELECT 
TO authenticated
USING (status = 'published');

CREATE POLICY "auto_highlights_authenticated_read" 
ON auto_highlights 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "chat_highlights_authenticated_read" 
ON chat_highlights 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "course_modules_authenticated_read" 
ON course_modules 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM courses c 
  WHERE c.id = course_modules.course_id 
  AND c.status = 'published'
));

CREATE POLICY "courses_authenticated_read" 
ON courses 
FOR SELECT 
TO authenticated
USING (status = 'published');

-- Update storage policies for avatars bucket to use auth.uid()
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create new avatar storage policies using auth.uid()
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);