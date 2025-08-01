-- Ensure RLS is enabled on storage.objects (it should be by default)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Create new storage policies that work with Whop authentication
-- Allow anyone to view files in assets bucket (since it's public)
CREATE POLICY "Assets are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'assets');

-- Allow uploads to assets bucket for any authenticated user
CREATE POLICY "Authenticated users can upload assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'assets' AND 
  current_setting('request.jwt.claims', true)::json->>'email' IS NOT NULL
);

-- Allow updates to assets bucket for any authenticated user
CREATE POLICY "Authenticated users can update assets" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'assets' AND 
  current_setting('request.jwt.claims', true)::json->>'email' IS NOT NULL
);

-- Allow deletions from assets bucket for any authenticated user
CREATE POLICY "Authenticated users can delete assets" ON storage.objects
FOR DELETE USING (
  bucket_id = 'assets' AND 
  current_setting('request.jwt.claims', true)::json->>'email' IS NOT NULL
);