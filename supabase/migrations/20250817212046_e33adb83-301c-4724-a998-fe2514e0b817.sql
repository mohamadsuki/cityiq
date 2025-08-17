-- Also create a permissive policy for ingestion_logs
CREATE POLICY "Temporary permissive ingestion logs access" 
ON public.ingestion_logs 
FOR ALL
USING (true)
WITH CHECK (true);