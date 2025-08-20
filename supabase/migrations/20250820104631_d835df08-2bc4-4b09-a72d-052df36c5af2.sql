-- Add demo support for avatars storage bucket
CREATE POLICY "Demo users can view avatars" 
ON storage.objects 
FOR SELECT 
USING (
  auth.uid() IS NULL AND 
  bucket_id = 'avatars'
);

CREATE POLICY "Demo users can upload avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NULL AND 
  bucket_id = 'avatars'
);

CREATE POLICY "Demo users can update avatars" 
ON storage.objects 
FOR UPDATE 
USING (
  auth.uid() IS NULL AND 
  bucket_id = 'avatars'
);

CREATE POLICY "Demo users can delete avatars" 
ON storage.objects 
FOR DELETE 
USING (
  auth.uid() IS NULL AND 
  bucket_id = 'avatars'
);