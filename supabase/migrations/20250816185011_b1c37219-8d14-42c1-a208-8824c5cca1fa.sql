-- Create collection_data table for "טיוטת מאזן RAW" Excel uploads
CREATE TABLE public.collection_data (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  year integer NOT NULL DEFAULT EXTRACT(year FROM now()),
  property_type text NOT NULL, -- סוג נכס
  annual_budget numeric, -- תקציב שנתי (עמודה H)
  relative_budget numeric, -- תקציב יחסי (עמודה I) 
  actual_collection numeric, -- גביה בפועל (עמודה M)
  excel_cell_ref text, -- הפנייה לתא באקסל
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collection_data ENABLE ROW LEVEL SECURITY;

-- Create policies similar to regular_budget table
CREATE POLICY "CEO can delete collection data" ON public.collection_data
FOR DELETE USING (has_role_demo(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can insert collection data" ON public.collection_data
FOR INSERT WITH CHECK (has_role_demo(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can select all collection data" ON public.collection_data
FOR SELECT USING (has_role_demo(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can update collection data" ON public.collection_data
FOR UPDATE USING (has_role_demo(auth.uid(), 'ceo'::app_role));

CREATE POLICY "Mayor can delete collection data" ON public.collection_data
FOR DELETE USING (has_role_demo(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can insert collection data" ON public.collection_data
FOR INSERT WITH CHECK (has_role_demo(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can select all collection data" ON public.collection_data
FOR SELECT USING (has_role_demo(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can update collection data" ON public.collection_data
FOR UPDATE USING (has_role_demo(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Managers can access finance collection data" ON public.collection_data
FOR ALL USING (
  has_role_demo(auth.uid(), 'manager'::app_role) AND 
  has_department_demo(auth.uid(), 'finance'::department_slug)
)
WITH CHECK (
  has_role_demo(auth.uid(), 'manager'::app_role) AND 
  has_department_demo(auth.uid(), 'finance'::department_slug)
);

CREATE POLICY "Users can delete their own collection data" ON public.collection_data
FOR DELETE USING (user_owns_budget_record(user_id));

CREATE POLICY "Users can insert their own collection data" ON public.collection_data
FOR INSERT WITH CHECK (user_owns_budget_record(user_id));

CREATE POLICY "Users can update their own collection data" ON public.collection_data
FOR UPDATE USING (user_owns_budget_record(user_id));

CREATE POLICY "Users can view their own collection data" ON public.collection_data
FOR SELECT USING (user_owns_budget_record(user_id));

-- Add trigger for updated_at
CREATE TRIGGER update_collection_data_updated_at
BEFORE UPDATE ON public.collection_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();