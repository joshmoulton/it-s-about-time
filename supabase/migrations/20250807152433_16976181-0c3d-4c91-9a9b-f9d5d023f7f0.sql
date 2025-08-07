-- Fix storage policies for avatar uploads and create proper user profile handling

-- First, ensure we have proper storage policies for the assets bucket
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own avatars" ON storage.objects;

-- Create comprehensive storage policies for avatars
CREATE POLICY "Anyone can view avatar images" ON storage.objects
FOR SELECT USING (bucket_id = 'assets');

CREATE POLICY "Authenticated users can upload to assets bucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'assets' AND 
  (auth.uid() IS NOT NULL OR get_current_user_email_optimized() IS NOT NULL)
);

CREATE POLICY "Users can update their own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'assets' AND 
  (auth.uid() = owner OR auth.uid() IS NOT NULL OR get_current_user_email_optimized() IS NOT NULL)
);

CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'assets' AND 
  (auth.uid() = owner OR auth.uid() IS NOT NULL OR get_current_user_email_optimized() IS NOT NULL)
);

-- Add user_email column to user_profiles if it doesn't exist (for better email-based lookups)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'user_email') THEN
        ALTER TABLE public.user_profiles ADD COLUMN user_email text;
        CREATE INDEX IF NOT EXISTS idx_user_profiles_user_email ON public.user_profiles(user_email);
    END IF;
END $$;