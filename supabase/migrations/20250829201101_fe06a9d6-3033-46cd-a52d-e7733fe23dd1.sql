-- Add demo user access for collection_data table
CREATE POLICY "Demo users comprehensive access for collection data" 
ON public.collection_data 
FOR ALL 
USING (
  (user_id::text = ANY (ARRAY['11111111-1111-1111-1111-111111111111'::text, '22222222-2222-2222-2222-222222222222'::text, '33333333-3333-3333-3333-333333333333'::text])) 
  OR (auth.uid() IS NULL)
) 
WITH CHECK (
  (user_id::text = ANY (ARRAY['11111111-1111-1111-1111-111111111111'::text, '22222222-2222-2222-2222-222222222222'::text, '33333333-3333-3333-3333-333333333333'::text])) 
  OR (auth.uid() IS NULL)
);