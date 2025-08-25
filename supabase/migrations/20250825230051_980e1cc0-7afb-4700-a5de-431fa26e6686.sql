-- Create budget analysis table
CREATE TABLE public.budget_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  year INTEGER NOT NULL DEFAULT EXTRACT(year FROM now()),
  analysis_text TEXT NOT NULL,
  total_income NUMERIC,
  total_expenses NUMERIC,
  income_deviation NUMERIC,
  expense_deviation NUMERIC,
  analysis_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.budget_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own budget analysis" 
ON public.budget_analysis 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budget analysis" 
ON public.budget_analysis 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget analysis" 
ON public.budget_analysis 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget analysis" 
ON public.budget_analysis 
FOR DELETE 
USING (auth.uid() = user_id);

-- CEO and Mayor can access all analysis
CREATE POLICY "CEO can access all budget analysis" 
ON public.budget_analysis 
FOR ALL 
USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "Mayor can access all budget analysis" 
ON public.budget_analysis 
FOR ALL 
USING (has_role(auth.uid(), 'mayor'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_budget_analysis_updated_at
BEFORE UPDATE ON public.budget_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();