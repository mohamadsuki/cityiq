-- Add department_slug column to domain tables
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS department_slug public.department_slug;
ALTER TABLE public.grants ADD COLUMN IF NOT EXISTS department_slug public.department_slug;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS department_slug public.department_slug;
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS department_slug public.department_slug;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS department_slug public.department_slug;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS department_slug public.department_slug;
ALTER TABLE public.welfare_services ADD COLUMN IF NOT EXISTS department_slug public.department_slug;

-- Basic index for filtering
CREATE INDEX IF NOT EXISTS idx_activities_department_slug ON public.activities(department_slug);
CREATE INDEX IF NOT EXISTS idx_grants_department_slug ON public.grants(department_slug);
CREATE INDEX IF NOT EXISTS idx_institutions_department_slug ON public.institutions(department_slug);
CREATE INDEX IF NOT EXISTS idx_licenses_department_slug ON public.licenses(department_slug);
CREATE INDEX IF NOT EXISTS idx_plans_department_slug ON public.plans(department_slug);
CREATE INDEX IF NOT EXISTS idx_projects_department_slug ON public.projects(department_slug);
CREATE INDEX IF NOT EXISTS idx_welfare_services_department_slug ON public.welfare_services(department_slug);

-- RLS policies for department-level access (managers) in addition to existing owner-based and mayor policies
-- Activities
DO $$ BEGIN
  CREATE POLICY "Managers can select activities by department" ON public.activities
  FOR SELECT USING (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Managers can insert activities by department" ON public.activities
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Managers can update activities by department" ON public.activities
  FOR UPDATE USING (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Managers can delete activities by department" ON public.activities
  FOR DELETE USING (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Grants
DO $$ BEGIN
  CREATE POLICY "Managers can select grants by department" ON public.grants
  FOR SELECT USING (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Managers can insert grants by department" ON public.grants
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Managers can update grants by department" ON public.grants
  FOR UPDATE USING (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Managers can delete grants by department" ON public.grants
  FOR DELETE USING (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Institutions
DO $$ BEGIN
  CREATE POLICY "Managers can select institutions by department" ON public.institutions
  FOR SELECT USING (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Managers can insert institutions by department" ON public.institutions
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Managers can update institutions by department" ON public.institutions
  FOR UPDATE USING (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Managers can delete institutions by department" ON public.institutions
  FOR DELETE USING (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Licenses
DO $$ BEGIN
  CREATE POLICY "Managers can select licenses by department" ON public.licenses
  FOR SELECT USING (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Managers can insert licenses by department" ON public.licenses
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Managers can update licenses by department" ON public.licenses
  FOR UPDATE USING (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Managers can delete licenses by department" ON public.licenses
  FOR DELETE USING (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Plans
DO $$ BEGIN
  CREATE POLICY "Managers can select plans by department" ON public.plans
  FOR SELECT USING (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Managers can insert plans by department" ON public.plans
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Managers can update plans by department" ON public.plans
  FOR UPDATE USING (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Managers can delete plans by department" ON public.plans
  FOR DELETE USING (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Projects
DO $$ BEGIN
  CREATE POLICY "Managers can select projects by department" ON public.projects
  FOR SELECT USING (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Managers can insert projects by department" ON public.projects
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Managers can update projects by department" ON public.projects
  FOR UPDATE USING (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Managers can delete projects by department" ON public.projects
  FOR DELETE USING (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Welfare Services
DO $$ BEGIN
  CREATE POLICY "Managers can select welfare services by department" ON public.welfare_services
  FOR SELECT USING (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Managers can insert welfare services by department" ON public.welfare_services
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Managers can update welfare services by department" ON public.welfare_services
  FOR UPDATE USING (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Managers can delete welfare services by department" ON public.welfare_services
  FOR DELETE USING (
    public.has_role(auth.uid(),'manager') AND public.has_department(auth.uid(), department_slug)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;