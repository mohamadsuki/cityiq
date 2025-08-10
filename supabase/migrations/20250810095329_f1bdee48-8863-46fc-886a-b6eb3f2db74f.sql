-- 1) Enums for roles and departments
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('mayor', 'manager');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.department_slug AS ENUM ('finance','education','engineering','welfare','non-formal','business');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Role and department mapping tables
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policies for user_roles (avoid recursion: do not use has_role here)
DO $$ BEGIN
  CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Only service role or future admin UI should manage roles. For now, block INSERT/UPDATE/DELETE from clients.
-- (No permissive policies for those commands)

CREATE TABLE IF NOT EXISTS public.user_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department public.department_slug NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, department)
);

ALTER TABLE public.user_departments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view their own departments" ON public.user_departments
  FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Helper functions for RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_department(_user_id uuid, _department public.department_slug)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_departments ud
    WHERE ud.user_id = _user_id AND ud.department = _department
  );
$$;

-- 4) Add permissive policies for "mayor" to access all rows on domain tables
-- Activities
DO $$ BEGIN
  CREATE POLICY "Mayor can select all activities" ON public.activities
  FOR SELECT USING (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Mayor can insert activities" ON public.activities
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Mayor can update activities" ON public.activities
  FOR UPDATE USING (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Mayor can delete activities" ON public.activities
  FOR DELETE USING (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Grants
DO $$ BEGIN
  CREATE POLICY "Mayor can select all grants" ON public.grants
  FOR SELECT USING (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Mayor can insert grants" ON public.grants
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Mayor can update grants" ON public.grants
  FOR UPDATE USING (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Mayor can delete grants" ON public.grants
  FOR DELETE USING (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Institutions
DO $$ BEGIN
  CREATE POLICY "Mayor can select all institutions" ON public.institutions
  FOR SELECT USING (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Mayor can insert institutions" ON public.institutions
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Mayor can update institutions" ON public.institutions
  FOR UPDATE USING (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Mayor can delete institutions" ON public.institutions
  FOR DELETE USING (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Licenses
DO $$ BEGIN
  CREATE POLICY "Mayor can select all licenses" ON public.licenses
  FOR SELECT USING (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Mayor can insert licenses" ON public.licenses
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Mayor can update licenses" ON public.licenses
  FOR UPDATE USING (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Mayor can delete licenses" ON public.licenses
  FOR DELETE USING (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Plans
DO $$ BEGIN
  CREATE POLICY "Mayor can select all plans" ON public.plans
  FOR SELECT USING (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Mayor can insert plans" ON public.plans
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Mayor can update plans" ON public.plans
  FOR UPDATE USING (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Mayor can delete plans" ON public.plans
  FOR DELETE USING (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Projects
DO $$ BEGIN
  CREATE POLICY "Mayor can select all projects" ON public.projects
  FOR SELECT USING (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Mayor can insert projects" ON public.projects
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Mayor can update projects" ON public.projects
  FOR UPDATE USING (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Mayor can delete projects" ON public.projects
  FOR DELETE USING (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Welfare Services
DO $$ BEGIN
  CREATE POLICY "Mayor can select all welfare services" ON public.welfare_services
  FOR SELECT USING (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Mayor can insert welfare services" ON public.welfare_services
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Mayor can update welfare services" ON public.welfare_services
  FOR UPDATE USING (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Mayor can delete welfare services" ON public.welfare_services
  FOR DELETE USING (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ingestion logs (read own, allow mayor select all)
DO $$ BEGIN
  CREATE POLICY "Mayor can select all ingestion logs" ON public.ingestion_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'mayor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5) Optional: seed demo role assignments (will be no-ops if users don't exist yet)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'mayor'::public.app_role FROM auth.users WHERE email = 'mayor@city.gov.il'
ON CONFLICT (user_id, role) DO NOTHING;

-- Department managers demo (assign department and manager role if exist)
WITH candidates AS (
  SELECT email, 'finance'::public.department_slug AS dep FROM (VALUES ('finance@city.gov.il')) t(email)
  UNION ALL SELECT 'education@city.gov.il', 'education'
  UNION ALL SELECT 'engineering@city.gov.il', 'engineering'
  UNION ALL SELECT 'welfare@city.gov.il', 'welfare'
  UNION ALL SELECT 'non-formal@city.gov.il', 'non-formal'
  UNION ALL SELECT 'business@city.gov.il', 'business'
)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'manager'::public.app_role
FROM auth.users u
JOIN candidates c ON c.email = u.email
ON CONFLICT (user_id, role) DO NOTHING;

WITH candidates AS (
  SELECT email, 'finance'::public.department_slug AS dep FROM (VALUES ('finance@city.gov.il')) t(email)
  UNION ALL SELECT 'education@city.gov.il', 'education'
  UNION ALL SELECT 'engineering@city.gov.il', 'engineering'
  UNION ALL SELECT 'welfare@city.gov.il', 'welfare'
  UNION ALL SELECT 'non-formal@city.gov.il', 'non-formal'
  UNION ALL SELECT 'business@city.gov.il', 'business'
)
INSERT INTO public.user_departments (user_id, department)
SELECT u.id, c.dep
FROM auth.users u
JOIN candidates c ON c.email = u.email
ON CONFLICT (user_id, department) DO NOTHING;
