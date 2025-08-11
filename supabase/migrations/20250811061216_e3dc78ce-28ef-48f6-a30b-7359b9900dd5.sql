-- STEP 2: Create CEO policies and update task enforcement function

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

-- Update enforcement function to grant CEO full update permissions like Mayor
CREATE OR REPLACE FUNCTION public.enforce_task_update_permissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow mayors and CEOs to update anything
  IF has_role(auth.uid(), 'mayor') OR has_role(auth.uid(), 'ceo') THEN
    RETURN NEW;
  END IF;

  -- Allow managers to only change status/progress fields on tasks in their department
  IF has_role(auth.uid(), 'manager') AND has_department(auth.uid(), NEW.department_slug) THEN
    IF NEW.title IS DISTINCT FROM OLD.title
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.priority IS DISTINCT FROM OLD.priority
       OR NEW.due_at IS DISTINCT FROM OLD.due_at
       OR NEW.department_slug IS DISTINCT FROM OLD.department_slug
       OR NEW.created_by IS DISTINCT FROM OLD.created_by
       OR NEW.tags IS DISTINCT FROM OLD.tags
    THEN
      RAISE EXCEPTION 'Managers can only update status and progress fields';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Not allowed to update this task';
END;
$function$;