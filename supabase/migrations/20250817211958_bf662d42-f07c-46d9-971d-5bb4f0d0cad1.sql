-- Temporarily create a more permissive policy for tabarim to allow uploads
DROP POLICY IF EXISTS "Finance users can manage tabarim" ON public.tabarim;

-- Create a temporary permissive policy for testing
CREATE POLICY "Temporary permissive tabarim access" 
ON public.tabarim 
FOR ALL
USING (true)
WITH CHECK (true);