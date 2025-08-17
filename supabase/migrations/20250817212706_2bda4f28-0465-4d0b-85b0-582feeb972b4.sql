-- Drop all existing storage policies and create simple ones
DROP POLICY IF EXISTS "Demo users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Demo users can view uploaded files" ON storage.objects;
DROP POLICY IF EXISTS "Demo users can delete their uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated to view uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated to delete uploads" ON storage.objects;

-- Create simple policies that allow anyone to work with uploads bucket
CREATE POLICY "Allow uploads bucket access" 
ON storage.objects 
FOR ALL
USING (bucket_id = 'uploads')
WITH CHECK (bucket_id = 'uploads');