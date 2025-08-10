-- Create helper function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Projects table (Finance projects / tenders)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code TEXT,
  name TEXT,
  department TEXT,
  domain TEXT,
  funding_source TEXT,
  budget_approved NUMERIC,
  budget_executed NUMERIC,
  status TEXT,
  progress NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own projects"
ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own projects"
ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects"
ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects"
ON public.projects FOR DELETE USING (auth.uid() = user_id);
CREATE OR REPLACE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grants table
CREATE TABLE IF NOT EXISTS public.grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT,
  ministry TEXT,
  amount NUMERIC,
  status TEXT,
  submitted_at DATE,
  decision_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own grants"
ON public.grants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own grants"
ON public.grants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own grants"
ON public.grants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own grants"
ON public.grants FOR DELETE USING (auth.uid() = user_id);
CREATE OR REPLACE TRIGGER update_grants_updated_at
BEFORE UPDATE ON public.grants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Education institutions
CREATE TABLE IF NOT EXISTS public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT,
  level TEXT,
  students INTEGER,
  classes INTEGER,
  occupancy NUMERIC,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own institutions"
ON public.institutions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own institutions"
ON public.institutions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own institutions"
ON public.institutions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own institutions"
ON public.institutions FOR DELETE USING (auth.uid() = user_id);
CREATE OR REPLACE TRIGGER update_institutions_updated_at
BEFORE UPDATE ON public.institutions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Engineering plans
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_number TEXT,
  name TEXT,
  address TEXT,
  block TEXT,
  parcel TEXT,
  status TEXT,
  land_use TEXT,
  area NUMERIC,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own plans"
ON public.plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own plans"
ON public.plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own plans"
ON public.plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own plans"
ON public.plans FOR DELETE USING (auth.uid() = user_id);
CREATE OR REPLACE TRIGGER update_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Welfare services/cases summary rows
CREATE TABLE IF NOT EXISTS public.welfare_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  service_type TEXT,
  recipients INTEGER,
  budget_allocated NUMERIC,
  utilization NUMERIC,
  waitlist INTEGER,
  period TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.welfare_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own welfare services"
ON public.welfare_services FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own welfare services"
ON public.welfare_services FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own welfare services"
ON public.welfare_services FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own welfare services"
ON public.welfare_services FOR DELETE USING (auth.uid() = user_id);
CREATE OR REPLACE TRIGGER update_welfare_services_updated_at
BEFORE UPDATE ON public.welfare_services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Non-formal education activities
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  program TEXT,
  name TEXT,
  category TEXT,
  age_group TEXT,
  participants INTEGER,
  scheduled_at TIMESTAMPTZ,
  location TEXT,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own activities"
ON public.activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activities"
ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own activities"
ON public.activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own activities"
ON public.activities FOR DELETE USING (auth.uid() = user_id);
CREATE OR REPLACE TRIGGER update_activities_updated_at
BEFORE UPDATE ON public.activities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Business licenses
CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  license_number TEXT,
  business_name TEXT,
  owner TEXT,
  address TEXT,
  type TEXT,
  status TEXT,
  expires_at DATE,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own licenses"
ON public.licenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own licenses"
ON public.licenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own licenses"
ON public.licenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own licenses"
ON public.licenses FOR DELETE USING (auth.uid() = user_id);
CREATE OR REPLACE TRIGGER update_licenses_updated_at
BEFORE UPDATE ON public.licenses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ingestion logs
CREATE TABLE IF NOT EXISTS public.ingestion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  source_file TEXT,
  table_name TEXT,
  rows INTEGER,
  status TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ingestion_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own ingestion logs"
ON public.ingestion_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own ingestion logs"
ON public.ingestion_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage bucket for uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for uploads bucket
CREATE POLICY "Users can view their own uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload to their folder"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own uploads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);