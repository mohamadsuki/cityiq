-- Create budget_authorizations table for government budget authorizations
CREATE TABLE IF NOT EXISTS public.budget_authorizations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  authorization_number text,
  ministry text,
  program text,
  amount numeric,
  status text DEFAULT 'pending',
  submitted_at date,
  approved_at date,
  valid_until date,
  purpose text,
  department_slug department_slug,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.budget_authorizations ENABLE ROW LEVEL SECURITY;

-- Create temporary permissive policy similar to grants and tabarim
CREATE POLICY "Temporary permissive budget authorizations access" 
ON public.budget_authorizations 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add trigger for timestamp updates
CREATE TRIGGER update_budget_authorizations_updated_at
BEFORE UPDATE ON public.budget_authorizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();