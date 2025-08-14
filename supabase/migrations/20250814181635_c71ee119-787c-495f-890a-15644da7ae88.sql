-- Create storage policies for branding bucket to allow public uploads
-- First, make sure the bucket allows public uploads
UPDATE storage.buckets SET public = true WHERE id = 'branding';

-- Create policies for public access to branding bucket
INSERT INTO storage.objects (bucket_id, name, owner, metadata) VALUES ('branding', '.emptyFolderPlaceholder', null, '{}') ON CONFLICT DO NOTHING;

-- Allow anyone to upload to branding bucket
CREATE POLICY "Anyone can upload branding files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'branding');

-- Allow anyone to view branding files
CREATE POLICY "Anyone can view branding files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'branding');

-- Allow anyone to update branding files
CREATE POLICY "Anyone can update branding files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'branding');

-- Allow anyone to delete branding files (for overwriting)
CREATE POLICY "Anyone can delete branding files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'branding');