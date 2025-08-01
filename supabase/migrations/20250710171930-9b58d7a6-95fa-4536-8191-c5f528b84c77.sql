-- Create very permissive storage policies for assets bucket
-- Since the bucket is already public, we'll make the policies very open

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Assets are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete assets" ON storage.objects;

-- Create simple, permissive policies
CREATE POLICY "Allow all access to assets bucket" ON storage.objects
FOR ALL USING (bucket_id = 'assets');

CREATE POLICY "Allow all operations on assets bucket" ON storage.objects
FOR ALL WITH CHECK (bucket_id = 'assets');