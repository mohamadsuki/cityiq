-- Fix RLS issues for collection_data table
-- Enable RLS if not already enabled
ALTER TABLE public.collection_data ENABLE ROW LEVEL SECURITY;

-- Add comprehensive RLS policies for collection_data
CREATE POLICY "Users can view their own collection data" 
ON public.collection_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collection data" 
ON public.collection_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collection data" 
ON public.collection_data 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collection data" 
ON public.collection_data 
FOR DELETE 
USING (auth.uid() = user_id);

-- Demo users access policy
CREATE POLICY "Demo users comprehensive access for collection data" 
ON public.collection_data 
FOR ALL 
USING (
  user_id::text = ANY (ARRAY[
    '11111111-1111-1111-1111-111111111111'::text, 
    '22222222-2222-2222-2222-222222222222'::text, 
    '33333333-3333-3333-3333-333333333333'::text
  ]) OR auth.uid() IS NULL
) 
WITH CHECK (
  user_id::text = ANY (ARRAY[
    '11111111-1111-1111-1111-111111111111'::text, 
    '22222222-2222-2222-2222-222222222222'::text, 
    '33333333-3333-3333-3333-333333333333'::text
  ]) OR auth.uid() IS NULL
);