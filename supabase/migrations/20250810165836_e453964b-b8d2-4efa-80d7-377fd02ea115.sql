-- 1) Add 'ceo' role to app_role enum if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'ceo'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'ceo';
  END IF;
END $$;

-- 2) Add 'ceo' to department_slug enum if used and missing
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'department_slug') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'department_slug' AND e.enumlabel = 'ceo'
    ) THEN
      ALTER TYPE public.department_slug ADD VALUE 'ceo';
    END IF;
  END IF;
END $$;

-- 3) CEO RLS policies mirroring Mayor across domain tables

-- activities
CREATE POLICY "CEO can select all activities"
ON public.activities
FOR SELECT
USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can insert activities"
ON public.activities
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can update activities"
ON public.activities
FOR UPDATE
USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can delete activities"
ON public.activities
FOR DELETE
USING (has_role(auth.uid(), 'ceo'::app_role));

-- grants
CREATE POLICY "CEO can select all grants"
ON public.grants
FOR SELECT
USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can insert grants"
ON public.grants
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can update grants"
ON public.grants
FOR UPDATE
USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can delete grants"
ON public.grants
FOR DELETE
USING (has_role(auth.uid(), 'ceo'::app_role));

-- institutions
CREATE POLICY "CEO can select all institutions"
ON public.institutions
FOR SELECT
USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can insert institutions"
ON public.institutions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can update institutions"
ON public.institutions
FOR UPDATE
USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can delete institutions"
ON public.institutions
FOR DELETE
USING (has_role(auth.uid(), 'ceo'::app_role));

-- licenses
CREATE POLICY "CEO can select all licenses"
ON public.licenses
FOR SELECT
USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can insert licenses"
ON public.licenses
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can update licenses"
ON public.licenses
FOR UPDATE
USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can delete licenses"
ON public.licenses
FOR DELETE
USING (has_role(auth.uid(), 'ceo'::app_role));

-- plans
CREATE POLICY "CEO can select all plans"
ON public.plans
FOR SELECT
USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can insert plans"
ON public.plans
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can update plans"
ON public.plans
FOR UPDATE
USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can delete plans"
ON public.plans
FOR DELETE
USING (has_role(auth.uid(), 'ceo'::app_role));

-- projects
CREATE POLICY "CEO can select all projects"
ON public.projects
FOR SELECT
USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can insert projects"
ON public.projects
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can update projects"
ON public.projects
FOR UPDATE
USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can delete projects"
ON public.projects
FOR DELETE
USING (has_role(auth.uid(), 'ceo'::app_role));

-- welfare_services
CREATE POLICY "CEO can select all welfare services"
ON public.welfare_services
FOR SELECT
USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can insert welfare services"
ON public.welfare_services
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can update welfare services"
ON public.welfare_services
FOR UPDATE
USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can delete welfare services"
ON public.welfare_services
FOR DELETE
USING (has_role(auth.uid(), 'ceo'::app_role));

-- tasks
CREATE POLICY "CEO can select all tasks"
ON public.tasks
FOR SELECT
USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can insert tasks"
ON public.tasks
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can update tasks"
ON public.tasks
FOR UPDATE
USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can delete tasks"
ON public.tasks
FOR DELETE
USING (has_role(auth.uid(), 'ceo'::app_role));

-- ingestion_logs (read-only)
CREATE POLICY "CEO can select all ingestion logs"
ON public.ingestion_logs
FOR SELECT
USING (has_role(auth.uid(), 'ceo'::app_role));