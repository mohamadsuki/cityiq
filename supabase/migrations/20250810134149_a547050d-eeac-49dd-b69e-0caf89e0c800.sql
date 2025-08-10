-- Enable pgcrypto for gen_random_uuid if not enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Enums for priority and status
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
        CREATE TYPE public.task_priority AS ENUM ('low','medium','high','urgent');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE public.task_status AS ENUM ('pending','in_progress','blocked','done');
    END IF;
END $$;

-- 2) Profiles table to hold role and department for RLS decisions
--    If a similar table exists already, this will no-op via IF NOT EXISTS checks
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('mayor','manager')),
    department TEXT,
    display_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Timestamp trigger function (shared)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at'
    ) THEN
        CREATE TRIGGER update_profiles_updated_at
        BEFORE UPDATE ON public.profiles
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- 3) Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    priority public.task_priority NOT NULL DEFAULT 'medium',
    status public.task_status NOT NULL DEFAULT 'pending',
    due_at TIMESTAMPTZ,
    department TEXT NOT NULL,              -- target department
    assignee_id UUID,                      -- optional specific manager
    creator_id UUID NOT NULL,              -- the mayor who created
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- index for filtering
CREATE INDEX IF NOT EXISTS idx_tasks_department ON public.tasks(department);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON public.tasks(due_at);
CREATE INDEX IF NOT EXISTS idx_tasks_creator_id ON public.tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);

-- 4) RLS Enable
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5) Helper: get role and department for current user
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
DECLARE r TEXT; BEGIN
  SELECT p.role INTO r FROM public.profiles p WHERE p.user_id = auth.uid();
  RETURN r;
END; $$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.current_user_department()
RETURNS TEXT AS $$
DECLARE d TEXT; BEGIN
  SELECT p.department INTO d FROM public.profiles p WHERE p.user_id = auth.uid();
  RETURN d;
END; $$ LANGUAGE plpgsql STABLE;

-- 6) Profiles policies
-- Everyone can select their own profile; mayor can see all
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
FOR SELECT USING (
  user_id = auth.uid() OR public.current_user_role() = 'mayor'
);

DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
CREATE POLICY profiles_insert_self ON public.profiles
FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
CREATE POLICY profiles_update_self ON public.profiles
FOR UPDATE USING (
  user_id = auth.uid() OR public.current_user_role() = 'mayor'
) WITH CHECK (
  user_id = auth.uid() OR public.current_user_role() = 'mayor'
);

-- 7) Tasks policies
-- Select: mayor sees all; manager sees tasks of their department or assigned to them
DROP POLICY IF EXISTS tasks_select ON public.tasks;
CREATE POLICY tasks_select ON public.tasks
FOR SELECT USING (
  public.current_user_role() = 'mayor'
  OR department = public.current_user_department()
  OR assignee_id = auth.uid()
);

-- Insert: only mayor can create tasks; target assignee (if set) must be manager
DROP POLICY IF EXISTS tasks_insert_mayor_only ON public.tasks;
CREATE POLICY tasks_insert_mayor_only ON public.tasks
FOR INSERT WITH CHECK (
  public.current_user_role() = 'mayor'
);

-- Update: mayor can update any task
DROP POLICY IF EXISTS tasks_update_mayor ON public.tasks;
CREATE POLICY tasks_update_mayor ON public.tasks
FOR UPDATE USING (
  public.current_user_role() = 'mayor'
);

-- Update: manager can only update status/progress on tasks in their department or assigned to them;
-- enforced via policy + trigger below
DROP POLICY IF EXISTS tasks_update_manager ON public.tasks;
CREATE POLICY tasks_update_manager ON public.tasks
FOR UPDATE USING (
  public.current_user_role() = 'manager' AND (
    department = public.current_user_department() OR assignee_id = auth.uid()
  )
);

-- Delete: only mayor
DROP POLICY IF EXISTS tasks_delete_mayor ON public.tasks;
CREATE POLICY tasks_delete_mayor ON public.tasks
FOR DELETE USING (
  public.current_user_role() = 'mayor'
);

-- 8) Trigger to restrict what managers can change
CREATE OR REPLACE FUNCTION public.enforce_manager_task_update()
RETURNS TRIGGER AS $$
BEGIN
  IF public.current_user_role() = 'manager' THEN
    -- Managers may change only status and progress
    IF (NEW.title IS DISTINCT FROM OLD.title) OR
       (NEW.description IS DISTINCT FROM OLD.description) OR
       (NEW.priority IS DISTINCT FROM OLD.priority) OR
       (NEW.due_at IS DISTINCT FROM OLD.due_at) OR
       (NEW.department IS DISTINCT FROM OLD.department) OR
       (NEW.assignee_id IS DISTINCT FROM OLD.assignee_id) OR
       (NEW.creator_id IS DISTINCT FROM OLD.creator_id) THEN
       RAISE EXCEPTION 'Managers can only update status/progress';
    END IF;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'enforce_manager_task_update_trigger'
    ) THEN
        CREATE TRIGGER enforce_manager_task_update_trigger
        BEFORE UPDATE ON public.tasks
        FOR EACH ROW EXECUTE FUNCTION public.enforce_manager_task_update();
    END IF;
END $$;

-- 9) Auto-updated timestamp for tasks
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_updated_at'
    ) THEN
        CREATE TRIGGER update_tasks_updated_at
        BEFORE UPDATE ON public.tasks
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;
