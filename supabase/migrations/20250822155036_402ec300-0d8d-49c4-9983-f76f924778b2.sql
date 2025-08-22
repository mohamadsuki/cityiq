-- Drop the current simple policy
DROP POLICY IF EXISTS "Authenticated users can manage public inquiries" ON public.public_inquiries;

-- Create policies similar to projects and tasks tables that work
-- Policy for authenticated users (when auth.uid() IS NOT NULL)
CREATE POLICY "Authenticated access" 
ON public.public_inquiries 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for demo mode (when auth.uid() IS NULL)
CREATE POLICY "Demo mode access" 
ON public.public_inquiries 
FOR ALL 
USING (auth.uid() IS NULL)
WITH CHECK (auth.uid() IS NULL);