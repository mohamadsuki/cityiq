-- Enable RLS on regular_budget table
ALTER TABLE public.regular_budget ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for regular_budget table
CREATE POLICY "Users can view their own regular budget data" 
ON public.regular_budget 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own regular budget data" 
ON public.regular_budget 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own regular budget data" 
ON public.regular_budget 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own regular budget data" 
ON public.regular_budget 
FOR DELETE 
USING (auth.uid() = user_id);

-- CEO and Mayor policies
CREATE POLICY "CEO can manage all regular budget data" 
ON public.regular_budget 
FOR ALL 
USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "Mayor can manage all regular budget data" 
ON public.regular_budget 
FOR ALL 
USING (has_role(auth.uid(), 'mayor'::app_role);

-- Demo access policy
CREATE POLICY "Demo users comprehensive access for regular budget" 
ON public.regular_budget 
FOR ALL 
USING (((user_id)::text = ANY (ARRAY['11111111-1111-1111-1111-111111111111'::text, '22222222-2222-2222-2222-222222222222'::text, '33333333-3333-3333-3333-333333333333'::text])) OR (auth.uid() IS NULL))
WITH CHECK (((user_id)::text = ANY (ARRAY['11111111-1111-1111-1111-111111111111'::text, '22222222-2222-2222-2222-222222222222'::text, '33333333-3333-3333-3333-333333333333'::text])) OR (auth.uid() IS NULL));