-- Update RLS policies for tasks table to support demo mode

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "CEO can select all tasks" ON public.tasks;
DROP POLICY IF EXISTS "CEO can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "CEO can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "CEO can delete tasks" ON public.tasks;

DROP POLICY IF EXISTS "Mayor can select all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Mayor can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Mayor can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Mayor can delete tasks" ON public.tasks;

DROP POLICY IF EXISTS "Managers can select department tasks" ON public.tasks;
DROP POLICY IF EXISTS "Managers can update department tasks" ON public.tasks;

-- Create new policies that support both real and demo users
CREATE POLICY "CEO can select all tasks" ON public.tasks
FOR SELECT
USING (
  public.has_role_demo(COALESCE(auth.uid(), '22222222-2222-2222-2222-222222222222'::uuid), 'ceo'::app_role)
);

CREATE POLICY "CEO can insert tasks" ON public.tasks
FOR INSERT
WITH CHECK (
  public.has_role_demo(COALESCE(auth.uid(), '22222222-2222-2222-2222-222222222222'::uuid), 'ceo'::app_role)
);

CREATE POLICY "CEO can update tasks" ON public.tasks
FOR UPDATE
USING (
  public.has_role_demo(COALESCE(auth.uid(), '22222222-2222-2222-2222-222222222222'::uuid), 'ceo'::app_role)
);

CREATE POLICY "CEO can delete tasks" ON public.tasks
FOR DELETE
USING (
  public.has_role_demo(COALESCE(auth.uid(), '22222222-2222-2222-2222-222222222222'::uuid), 'ceo'::app_role)
);

-- Mayor policies
CREATE POLICY "Mayor can select all tasks" ON public.tasks
FOR SELECT
USING (
  public.has_role_demo(COALESCE(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid), 'mayor'::app_role)
);

CREATE POLICY "Mayor can insert tasks" ON public.tasks
FOR INSERT
WITH CHECK (
  public.has_role_demo(COALESCE(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid), 'mayor'::app_role)
);

CREATE POLICY "Mayor can update tasks" ON public.tasks
FOR UPDATE
USING (
  public.has_role_demo(COALESCE(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid), 'mayor'::app_role)
);

CREATE POLICY "Mayor can delete tasks" ON public.tasks
FOR DELETE
USING (
  public.has_role_demo(COALESCE(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid), 'mayor'::app_role)
);

-- Manager policies - allow them to see tasks in their departments
CREATE POLICY "Managers can select department tasks" ON public.tasks
FOR SELECT
USING (
  (public.has_role_demo(COALESCE(auth.uid(), '44444444-4444-4444-4444-444444444444'::uuid), 'manager'::app_role) 
   AND public.has_department_demo(COALESCE(auth.uid(), '44444444-4444-4444-4444-444444444444'::uuid), department_slug))
  OR
  -- Allow specific demo manager UUIDs to see tasks in their departments
  (COALESCE(auth.uid(), '33333333-3333-3333-3333-333333333333'::uuid) = '33333333-3333-3333-3333-333333333333'::uuid AND department_slug = 'finance'::department_slug)
  OR
  (COALESCE(auth.uid(), '44444444-4444-4444-4444-444444444444'::uuid) = '44444444-4444-4444-4444-444444444444'::uuid AND department_slug = 'education'::department_slug)
  OR
  (COALESCE(auth.uid(), '55555555-5555-5555-5555-555555555555'::uuid) = '55555555-5555-5555-5555-555555555555'::uuid AND department_slug = 'engineering'::department_slug)
  OR
  (COALESCE(auth.uid(), '66666666-6666-6666-6666-666666666666'::uuid) = '66666666-6666-6666-6666-666666666666'::uuid AND department_slug = 'welfare'::department_slug)
  OR
  (COALESCE(auth.uid(), '77777777-7777-7777-7777-777777777777'::uuid) = '77777777-7777-7777-7777-777777777777'::uuid AND department_slug = 'non-formal'::department_slug)
  OR
  (COALESCE(auth.uid(), '88888888-8888-8888-8888-888888888888'::uuid) = '88888888-8888-8888-8888-888888888888'::uuid AND department_slug = 'business'::department_slug)
);

CREATE POLICY "Managers can update department tasks" ON public.tasks
FOR UPDATE
USING (
  (public.has_role_demo(COALESCE(auth.uid(), '44444444-4444-4444-4444-444444444444'::uuid), 'manager'::app_role) 
   AND public.has_department_demo(COALESCE(auth.uid(), '44444444-4444-4444-4444-444444444444'::uuid), department_slug))
  OR
  -- Allow specific demo manager UUIDs to update tasks in their departments
  (COALESCE(auth.uid(), '33333333-3333-3333-3333-333333333333'::uuid) = '33333333-3333-3333-3333-333333333333'::uuid AND department_slug = 'finance'::department_slug)
  OR
  (COALESCE(auth.uid(), '44444444-4444-4444-4444-444444444444'::uuid) = '44444444-4444-4444-4444-444444444444'::uuid AND department_slug = 'education'::department_slug)
  OR
  (COALESCE(auth.uid(), '55555555-5555-5555-5555-555555555555'::uuid) = '55555555-5555-5555-5555-555555555555'::uuid AND department_slug = 'engineering'::department_slug)
  OR
  (COALESCE(auth.uid(), '66666666-6666-6666-6666-666666666666'::uuid) = '66666666-6666-6666-6666-666666666666'::uuid AND department_slug = 'welfare'::department_slug)
  OR
  (COALESCE(auth.uid(), '77777777-7777-7777-7777-777777777777'::uuid) = '77777777-7777-7777-7777-777777777777'::uuid AND department_slug = 'non-formal'::department_slug)
  OR
  (COALESCE(auth.uid(), '88888888-8888-8888-8888-888888888888'::uuid) = '88888888-8888-8888-8888-888888888888'::uuid AND department_slug = 'business'::department_slug)
);

-- Allow demo mode access - when no auth.uid(), allow access based on hardcoded demo user patterns
CREATE POLICY "Demo mode tasks access" ON public.tasks
FOR ALL
USING (
  -- When auth.uid() is null (demo mode), allow broader access
  CASE 
    WHEN auth.uid() IS NULL THEN true
    ELSE false
  END
)
WITH CHECK (
  -- When auth.uid() is null (demo mode), allow broader access  
  CASE 
    WHEN auth.uid() IS NULL THEN true
    ELSE false
  END
);