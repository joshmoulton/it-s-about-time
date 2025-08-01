-- Create storage bucket for video uploads and thumbnails
INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', false);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('thumbnails', 'thumbnails', true);

-- Create policies for video uploads (admin only)
CREATE POLICY "Admins can upload videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'videos' AND is_current_user_admin_fast());

CREATE POLICY "Admins can view videos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'videos' AND is_current_user_admin_fast());

CREATE POLICY "Admins can update videos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'videos' AND is_current_user_admin_fast());

CREATE POLICY "Admins can delete videos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'videos' AND is_current_user_admin_fast());

-- Create policies for thumbnails (admins upload, everyone can view)
CREATE POLICY "Admins can upload thumbnails" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'thumbnails' AND is_current_user_admin_fast());

CREATE POLICY "Everyone can view thumbnails" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'thumbnails');

CREATE POLICY "Admins can update thumbnails" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'thumbnails' AND is_current_user_admin_fast());

CREATE POLICY "Admins can delete thumbnails" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'thumbnails' AND is_current_user_admin_fast());