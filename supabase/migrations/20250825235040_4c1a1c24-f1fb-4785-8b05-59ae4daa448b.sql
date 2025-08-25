-- Fix RLS policies for budget_analysis table
DROP POLICY IF EXISTS "CEO can access all budget analysis" ON budget_analysis;
DROP POLICY IF EXISTS "Mayor can access all budget analysis" ON budget_analysis;
DROP POLICY IF EXISTS "Users can delete their own budget analysis" ON budget_analysis;
DROP POLICY IF EXISTS "Users can insert their own budget analysis" ON budget_analysis;
DROP POLICY IF EXISTS "Users can update their own budget analysis" ON budget_analysis;
DROP POLICY IF EXISTS "Users can view their own budget analysis" ON budget_analysis;

-- Enable RLS if not already enabled
ALTER TABLE budget_analysis ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for budget_analysis
CREATE POLICY "Users can insert their own budget analysis" 
ON budget_analysis 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select their own budget analysis" 
ON budget_analysis 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget analysis" 
ON budget_analysis 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget analysis" 
ON budget_analysis 
FOR DELETE 
USING (auth.uid() = user_id);

-- Policies for CEO role
CREATE POLICY "CEO can manage all budget analysis" 
ON budget_analysis 
FOR ALL 
USING (has_role(auth.uid(), 'ceo'::app_role));

-- Policies for Mayor role
CREATE POLICY "Mayor can manage all budget analysis" 
ON budget_analysis 
FOR ALL 
USING (has_role(auth.uid(), 'mayor'::app_role));

-- Demo users access
CREATE POLICY "Demo users comprehensive access for budget analysis" 
ON budget_analysis 
FOR ALL 
USING (((user_id)::text = ANY (ARRAY['11111111-1111-1111-1111-111111111111'::text, '22222222-2222-2222-2222-222222222222'::text, '33333333-3333-3333-3333-333333333333'::text])) OR (auth.uid() IS NULL))
WITH CHECK (((user_id)::text = ANY (ARRAY['11111111-1111-1111-1111-111111111111'::text, '22222222-2222-2222-2222-222222222222'::text, '33333333-3333-3333-3333-333333333333'::text])) OR (auth.uid() IS NULL));