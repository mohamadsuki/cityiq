-- Create tabarim_analysis table
CREATE TABLE public.tabarim_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  year INTEGER NOT NULL DEFAULT EXTRACT(year FROM now()),
  total_approved_budget NUMERIC,
  total_income_actual NUMERIC,
  total_expense_actual NUMERIC,
  total_surplus_deficit NUMERIC,
  analysis_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  analysis_text TEXT NOT NULL,
  analysis_type TEXT DEFAULT 'tabarim'::text
);

-- Enable Row Level Security
ALTER TABLE public.tabarim_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own tabarim analysis" 
ON public.tabarim_analysis 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tabarim analysis" 
ON public.tabarim_analysis 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tabarim analysis" 
ON public.tabarim_analysis 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tabarim analysis" 
ON public.tabarim_analysis 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_tabarim_analysis_updated_at
BEFORE UPDATE ON public.tabarim_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();