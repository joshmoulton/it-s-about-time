-- Make the assets bucket public so logos can load
UPDATE storage.buckets 
SET public = true 
WHERE id = 'assets';