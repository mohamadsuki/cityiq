-- Create enum for budget category types
CREATE TYPE budget_category_type AS ENUM ('income', 'expense');

-- Create enum for tabar domains
CREATE TYPE tabar_domain AS ENUM (
  'energy', 'organizational', 'digital', 'veterinary', 
  'education_buildings', 'public_buildings', 'environment', 
  'activities', 'welfare', 'public_spaces', 'planning', 
  'infrastructure_roads'
);

-- Create enum for tabar status
CREATE TYPE tabar_status AS ENUM ('planning', 'active', 'closed', 'delayed');

-- Create enum for funding sources
CREATE TYPE funding_source AS ENUM (
  'environmental_protection', 'lottery', 'education_ministry', 
  'construction_housing_ministry', 'loan', 'interior_ministry', 
  'economy_ministry', 'rmi', 'negev_galilee_resilience_ministry',
  'national_digital_ministry', 'environmental_protection_ministry',
  'culture_ministry', 'science_technology_ministry', 'planning_administration',
  'transportation_ministry', 'health_ministry', 'municipality',
  'energy_ministry', 'agriculture_ministry'
);

-- Create regular_budget table
CREATE TABLE public.regular_budget (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  year INTEGER NOT NULL DEFAULT EXTRACT(year FROM now()),
  category_type budget_category_type NOT NULL,
  category_name TEXT NOT NULL,
  budget_amount NUMERIC,
  actual_amount NUMERIC,
  excel_cell_ref TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tabarim table
CREATE TABLE public.tabarim (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tabar_number TEXT,
  tabar_name TEXT NOT NULL,
  domain tabar_domain,
  funding_source1 funding_source,
  funding_source2 funding_source,
  funding_source3 funding_source,
  approved_budget NUMERIC,
  income_actual NUMERIC,
  expense_actual NUMERIC,
  surplus_deficit NUMERIC,
  status tabar_status DEFAULT 'planning',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create property_tax_collection table
CREATE TABLE public.property_tax_collection (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  year INTEGER NOT NULL DEFAULT EXTRACT(year FROM now()),
  property_type TEXT NOT NULL,
  annual_budget NUMERIC,
  relative_budget NUMERIC,
  actual_collection NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create salary_data table
CREATE TABLE public.salary_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  year INTEGER NOT NULL DEFAULT EXTRACT(year FROM now()),
  quarter INTEGER NOT NULL,
  employee_count INTEGER DEFAULT 530,
  general_salary NUMERIC,
  education_salary NUMERIC,
  welfare_salary NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.regular_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabarim ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_tax_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for regular_budget
CREATE POLICY "Users can view their own regular budget" ON public.regular_budget FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own regular budget" ON public.regular_budget FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own regular budget" ON public.regular_budget FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own regular budget" ON public.regular_budget FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Mayor can select all regular budget" ON public.regular_budget FOR SELECT USING (has_role(auth.uid(), 'mayor'::app_role));
CREATE POLICY "Mayor can insert regular budget" ON public.regular_budget FOR INSERT WITH CHECK (has_role(auth.uid(), 'mayor'::app_role));
CREATE POLICY "Mayor can update regular budget" ON public.regular_budget FOR UPDATE USING (has_role(auth.uid(), 'mayor'::app_role));
CREATE POLICY "Mayor can delete regular budget" ON public.regular_budget FOR DELETE USING (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "CEO can select all regular budget" ON public.regular_budget FOR SELECT USING (has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "CEO can insert regular budget" ON public.regular_budget FOR INSERT WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "CEO can update regular budget" ON public.regular_budget FOR UPDATE USING (has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "CEO can delete regular budget" ON public.regular_budget FOR DELETE USING (has_role(auth.uid(), 'ceo'::app_role));

-- RLS Policies for tabarim
CREATE POLICY "Users can view their own tabarim" ON public.tabarim FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tabarim" ON public.tabarim FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tabarim" ON public.tabarim FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tabarim" ON public.tabarim FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Mayor can select all tabarim" ON public.tabarim FOR SELECT USING (has_role(auth.uid(), 'mayor'::app_role));
CREATE POLICY "Mayor can insert tabarim" ON public.tabarim FOR INSERT WITH CHECK (has_role(auth.uid(), 'mayor'::app_role));
CREATE POLICY "Mayor can update tabarim" ON public.tabarim FOR UPDATE USING (has_role(auth.uid(), 'mayor'::app_role));
CREATE POLICY "Mayor can delete tabarim" ON public.tabarim FOR DELETE USING (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "CEO can select all tabarim" ON public.tabarim FOR SELECT USING (has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "CEO can insert tabarim" ON public.tabarim FOR INSERT WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "CEO can update tabarim" ON public.tabarim FOR UPDATE USING (has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "CEO can delete tabarim" ON public.tabarim FOR DELETE USING (has_role(auth.uid(), 'ceo'::app_role));

-- RLS Policies for property_tax_collection
CREATE POLICY "Users can view their own property tax collection" ON public.property_tax_collection FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own property tax collection" ON public.property_tax_collection FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own property tax collection" ON public.property_tax_collection FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own property tax collection" ON public.property_tax_collection FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Mayor can select all property tax collection" ON public.property_tax_collection FOR SELECT USING (has_role(auth.uid(), 'mayor'::app_role));
CREATE POLICY "Mayor can insert property tax collection" ON public.property_tax_collection FOR INSERT WITH CHECK (has_role(auth.uid(), 'mayor'::app_role));
CREATE POLICY "Mayor can update property tax collection" ON public.property_tax_collection FOR UPDATE USING (has_role(auth.uid(), 'mayor'::app_role));
CREATE POLICY "Mayor can delete property tax collection" ON public.property_tax_collection FOR DELETE USING (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "CEO can select all property tax collection" ON public.property_tax_collection FOR SELECT USING (has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "CEO can insert property tax collection" ON public.property_tax_collection FOR INSERT WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "CEO can update property tax collection" ON public.property_tax_collection FOR UPDATE USING (has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "CEO can delete property tax collection" ON public.property_tax_collection FOR DELETE USING (has_role(auth.uid(), 'ceo'::app_role));

-- RLS Policies for salary_data
CREATE POLICY "Users can view their own salary data" ON public.salary_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own salary data" ON public.salary_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own salary data" ON public.salary_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own salary data" ON public.salary_data FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Mayor can select all salary data" ON public.salary_data FOR SELECT USING (has_role(auth.uid(), 'mayor'::app_role));
CREATE POLICY "Mayor can insert salary data" ON public.salary_data FOR INSERT WITH CHECK (has_role(auth.uid(), 'mayor'::app_role));
CREATE POLICY "Mayor can update salary data" ON public.salary_data FOR UPDATE USING (has_role(auth.uid(), 'mayor'::app_role));
CREATE POLICY "Mayor can delete salary data" ON public.salary_data FOR DELETE USING (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "CEO can select all salary data" ON public.salary_data FOR SELECT USING (has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "CEO can insert salary data" ON public.salary_data FOR INSERT WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "CEO can update salary data" ON public.salary_data FOR UPDATE USING (has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "CEO can delete salary data" ON public.salary_data FOR DELETE USING (has_role(auth.uid(), 'ceo'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_regular_budget_updated_at
  BEFORE UPDATE ON public.regular_budget
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tabarim_updated_at
  BEFORE UPDATE ON public.tabarim
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_property_tax_collection_updated_at
  BEFORE UPDATE ON public.property_tax_collection
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_salary_data_updated_at
  BEFORE UPDATE ON public.salary_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();