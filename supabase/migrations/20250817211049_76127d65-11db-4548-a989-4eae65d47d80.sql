-- Create simple policies that allow all authenticated users to work with uploads bucket
CREATE POLICY "Allow authenticated uploads" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Allow authenticated to view uploads" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'uploads');

CREATE POLICY "Allow authenticated to delete uploads" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'uploads');