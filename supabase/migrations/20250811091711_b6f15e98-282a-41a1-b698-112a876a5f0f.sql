-- Add assigned_by_role to tasks and acknowledgements support
-- 1) Add column to tasks to mark who assigned the task (mayor/ceo)
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS assigned_by_role app_role;

-- Create trigger to populate assigned_by_role on insert based on creator role
CREATE OR REPLACE FUNCTION public.set_task_assigned_by_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'mayor') THEN
    NEW.assigned_by_role := 'mayor';
  ELSIF public.has_role(auth.uid(), 'ceo') THEN
    NEW.assigned_by_role := 'ceo';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_task_assigned_by_role ON public.tasks;
CREATE TRIGGER trg_set_task_assigned_by_role
BEFORE INSERT ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.set_task_assigned_by_role();

-- 2) Create task_acknowledgements table
CREATE TABLE IF NOT EXISTS public.task_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  manager_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_acknowledgements ENABLE ROW LEVEL SECURITY;

-- Update timestamp trigger
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_task_acknowledgements_updated_at'
  ) THEN
    CREATE TRIGGER update_task_acknowledgements_updated_at
    BEFORE UPDATE ON public.task_acknowledgements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- RLS Policies
-- Managers can insert acknowledgement for tasks in their own departments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_acknowledgements' AND policyname = 'Managers can insert own acknowledgements'
  ) THEN
    CREATE POLICY "Managers can insert own acknowledgements"
    ON public.task_acknowledgements
    FOR INSERT
    WITH CHECK (
      auth.uid() = manager_user_id AND EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = task_id AND public.has_department(auth.uid(), t.department_slug)
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_acknowledgements' AND policyname = 'Managers can select own acknowledgements'
  ) THEN
    CREATE POLICY "Managers can select own acknowledgements"
    ON public.task_acknowledgements
    FOR SELECT
    USING (auth.uid() = manager_user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_acknowledgements' AND policyname = 'Mayor can select all acknowledgements'
  ) THEN
    CREATE POLICY "Mayor can select all acknowledgements"
    ON public.task_acknowledgements
    FOR SELECT
    USING (public.has_role(auth.uid(), 'mayor'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_acknowledgements' AND policyname = 'CEO can select all acknowledgements'
  ) THEN
    CREATE POLICY "CEO can select all acknowledgements"
    ON public.task_acknowledgements
    FOR SELECT
    USING (public.has_role(auth.uid(), 'ceo'));
  END IF;
END $$;