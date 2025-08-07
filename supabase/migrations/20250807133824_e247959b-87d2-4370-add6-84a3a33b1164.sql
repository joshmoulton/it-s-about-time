-- Create assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('assets', 'assets', true, 52428800, ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/*'];

-- Create policies for assets bucket
CREATE POLICY "Assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'assets');

CREATE POLICY "Anyone can upload assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'assets');

CREATE POLICY "Anyone can update assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'assets');

CREATE POLICY "Anyone can delete assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'assets');