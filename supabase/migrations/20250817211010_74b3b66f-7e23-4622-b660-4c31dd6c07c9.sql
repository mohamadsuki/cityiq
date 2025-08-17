-- Drop existing storage policies and create new ones that work with demo users
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view uploaded files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their uploads" ON storage.objects;

-- Create policies that work with demo users and the existing demo system
CREATE POLICY "Demo users can upload files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'uploads' AND (
    -- Allow demo users with finance access
    EXISTS (
      SELECT 1 FROM public.demo_user_mapping dum
      WHERE dum.demo_id = COALESCE(auth.uid()::text, owner::text)
      AND 'finance'::department_slug = ANY(dum.departments)
    )
    OR
    -- Allow specific demo user UUIDs
    COALESCE(auth.uid()::text, owner::text) IN (
      '11111111-1111-1111-1111-111111111111', -- mayor
      '22222222-2222-2222-2222-222222222222', -- ceo  
      '33333333-3333-3333-3333-333333333333'  -- finance
    )
    OR
    -- Regular authenticated users
    auth.uid() IS NOT NULL
  )
);

CREATE POLICY "Demo users can view uploaded files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'uploads' AND (
    -- Allow demo users with finance access
    EXISTS (
      SELECT 1 FROM public.demo_user_mapping dum
      WHERE dum.demo_id = COALESCE(auth.uid()::text, owner::text)
      AND 'finance'::department_slug = ANY(dum.departments)
    )
    OR
    -- Allow specific demo user UUIDs
    COALESCE(auth.uid()::text, owner::text) IN (
      '11111111-1111-1111-1111-111111111111', -- mayor
      '22222222-2222-2222-2222-222222222222', -- ceo  
      '33333333-3333-3333-3333-333333333333'  -- finance
    )
    OR
    -- Regular authenticated users can view their own uploads
    (auth.uid() IS NOT NULL AND auth.uid()::text = owner)
  )
);

CREATE POLICY "Demo users can delete their uploads" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'uploads' AND (
    -- Allow demo users with finance access
    EXISTS (
      SELECT 1 FROM public.demo_user_mapping dum
      WHERE dum.demo_id = COALESCE(auth.uid()::text, owner::text)
      AND 'finance'::department_slug = ANY(dum.departments)
    )
    OR
    -- Allow specific demo user UUIDs
    COALESCE(auth.uid()::text, owner::text) IN (
      '11111111-1111-1111-1111-111111111111', -- mayor
      '22222222-2222-2222-2222-222222222222', -- ceo  
      '33333333-3333-3333-3333-333333333333'  -- finance
    )
    OR
    -- Regular authenticated users can delete their own uploads
    (auth.uid() IS NOT NULL AND auth.uid()::text = owner)
  )
);