
-- Create a storage bucket for logos and assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true);

-- Create policy to allow public read access to assets
CREATE POLICY "Public read access for assets" ON storage.objects
FOR SELECT USING (bucket_id = 'assets');

-- Create policy to allow authenticated users to upload assets (for admin purposes)
CREATE POLICY "Authenticated users can upload assets" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'assets' AND auth.role() = 'authenticated');
