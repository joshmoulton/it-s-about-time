-- Update CORS configuration for the assets bucket to allow video embedding
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/ogg', 'image/*']
WHERE id = 'assets';

-- Insert CORS configuration for the assets bucket
INSERT INTO storage.cors (bucket_id, allowed_origins, allowed_methods, allowed_headers, max_age_seconds)
VALUES (
  'assets',
  ARRAY['*'], -- Allow all origins, or specify your domain like ['https://yourdomain.com']
  ARRAY['GET', 'HEAD'],
  ARRAY['*'],
  3600
)
ON CONFLICT (bucket_id) DO UPDATE SET
  allowed_origins = EXCLUDED.allowed_origins,
  allowed_methods = EXCLUDED.allowed_methods,
  allowed_headers = EXCLUDED.allowed_headers,
  max_age_seconds = EXCLUDED.max_age_seconds;