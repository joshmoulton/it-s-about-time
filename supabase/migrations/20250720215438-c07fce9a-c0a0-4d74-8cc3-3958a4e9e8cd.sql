-- Fix CORS configuration for video streaming
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'image/*']
WHERE id = 'assets';

-- Update CORS configuration to allow video streaming
UPDATE storage.cors 
SET 
  allowed_origins = ARRAY['*'],
  allowed_methods = ARRAY['GET', 'HEAD', 'OPTIONS'],
  allowed_headers = ARRAY['*', 'Range', 'Content-Range', 'Accept-Ranges'],
  max_age_seconds = 86400
WHERE bucket_id = 'assets';

-- If no CORS record exists, insert one
INSERT INTO storage.cors (bucket_id, allowed_origins, allowed_methods, allowed_headers, max_age_seconds)
SELECT 'assets', ARRAY['*'], ARRAY['GET', 'HEAD', 'OPTIONS'], ARRAY['*', 'Range', 'Content-Range', 'Accept-Ranges'], 86400
WHERE NOT EXISTS (SELECT 1 FROM storage.cors WHERE bucket_id = 'assets');