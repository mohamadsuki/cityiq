-- Add demo support for projects table
CREATE POLICY "Demo users can select all projects" 
ON public.projects 
FOR SELECT 
USING (auth.uid() IS NULL);

CREATE POLICY "Demo users can insert projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NULL AND 
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id = user_id::text
  )
);

CREATE POLICY "Demo users can update projects" 
ON public.projects 
FOR UPDATE 
USING (
  auth.uid() IS NULL AND 
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id = user_id::text
  )
);

CREATE POLICY "Demo users can delete projects" 
ON public.projects 
FOR DELETE 
USING (
  auth.uid() IS NULL AND 
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id = user_id::text
  )
);

-- Add demo support for grants table
CREATE POLICY "Demo users can select all grants" 
ON public.grants 
FOR SELECT 
USING (auth.uid() IS NULL);

CREATE POLICY "Demo users can insert grants" 
ON public.grants 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NULL AND 
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id = user_id::text
  )
);

CREATE POLICY "Demo users can update grants" 
ON public.grants 
FOR UPDATE 
USING (
  auth.uid() IS NULL AND 
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id = user_id::text
  )
);

CREATE POLICY "Demo users can delete grants" 
ON public.grants 
FOR DELETE 
USING (
  auth.uid() IS NULL AND 
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id = user_id::text
  )
);

-- Add demo support for storage uploads
CREATE POLICY "Demo users can view uploads" 
ON storage.objects 
FOR SELECT 
USING (
  auth.uid() IS NULL AND 
  bucket_id = 'uploads'
);

CREATE POLICY "Demo users can upload files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NULL AND 
  bucket_id = 'uploads'
);

CREATE POLICY "Demo users can update uploads" 
ON storage.objects 
FOR UPDATE 
USING (
  auth.uid() IS NULL AND 
  bucket_id = 'uploads'
);

CREATE POLICY "Demo users can delete uploads" 
ON storage.objects 
FOR DELETE 
USING (
  auth.uid() IS NULL AND 
  bucket_id = 'uploads'
);