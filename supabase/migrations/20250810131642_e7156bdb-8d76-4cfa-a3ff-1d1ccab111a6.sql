-- Create enums for task priority and status if not exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
    CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'blocked', 'done', 'cancelled');
  END IF;
END $$;

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  department_slug department_slug NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority task_priority NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'todo',
  due_at TIMESTAMPTZ,
  progress_percent NUMERIC,
  progress_notes TEXT,
  tags TEXT[]
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_department ON public.tasks(department_slug);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON public.tasks(due_at);

-- Timestamp update trigger
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Policies
-- Mayor full access
DROP POLICY IF EXISTS "Mayor can select all tasks" ON public.tasks;
CREATE POLICY "Mayor can select all tasks" ON public.tasks
FOR SELECT USING (has_role(auth.uid(), 'mayor'));

DROP POLICY IF EXISTS "Mayor can insert tasks" ON public.tasks;
CREATE POLICY "Mayor can insert tasks" ON public.tasks
FOR INSERT WITH CHECK (has_role(auth.uid(), 'mayor'));

DROP POLICY IF EXISTS "Mayor can update tasks" ON public.tasks;
CREATE POLICY "Mayor can update tasks" ON public.tasks
FOR UPDATE USING (has_role(auth.uid(), 'mayor'));

DROP POLICY IF EXISTS "Mayor can delete tasks" ON public.tasks;
CREATE POLICY "Mayor can delete tasks" ON public.tasks
FOR DELETE USING (has_role(auth.uid(), 'mayor'));

-- Managers can view tasks for their departments
DROP POLICY IF EXISTS "Managers can select department tasks" ON public.tasks;
CREATE POLICY "Managers can select department tasks" ON public.tasks
FOR SELECT USING (
  has_role(auth.uid(), 'manager') AND has_department(auth.uid(), department_slug)
);

-- Managers can update status/progress of tasks in their departments (enforced by trigger below)
DROP POLICY IF EXISTS "Managers can update department tasks" ON public.tasks;
CREATE POLICY "Managers can update department tasks" ON public.tasks
FOR UPDATE USING (
  has_role(auth.uid(), 'manager') AND has_department(auth.uid(), department_slug)
);

-- Prevent managers from altering protected fields via trigger
CREATE OR REPLACE FUNCTION public.enforce_task_update_permissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Allow mayors to update anything
  IF has_role(auth.uid(), 'mayor') THEN
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
$$;

DROP TRIGGER IF EXISTS enforce_task_update_permissions ON public.tasks;
CREATE TRIGGER enforce_task_update_permissions
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.enforce_task_update_permissions();