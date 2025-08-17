-- Create RLS policies for uploads bucket
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Allow authenticated users to view their own uploads
CREATE POLICY "Users can view uploaded files" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'uploads');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their uploads" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'uploads');