-- Check current storage policies
SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';

-- Create permissive storage policies for assets bucket
-- This allows uploads for authenticated users (both Supabase and Whop)

-- Allow public access to view files in assets bucket
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'assets');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'assets' AND
  (auth.uid() IS NOT NULL OR 
   EXISTS (
     SELECT 1 FROM beehiiv_subscribers 
     WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
   ))
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'assets' AND
  (auth.uid() IS NOT NULL OR 
   EXISTS (
     SELECT 1 FROM beehiiv_subscribers 
     WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
   ))
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'assets' AND
  (auth.uid() IS NOT NULL OR 
   EXISTS (
     SELECT 1 FROM beehiiv_subscribers 
     WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
   ))
);