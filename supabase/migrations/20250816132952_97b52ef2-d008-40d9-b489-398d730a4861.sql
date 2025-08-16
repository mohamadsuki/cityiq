-- Fix security issues by setting search_path for functions

-- Update has_role_demo function with secure search path
CREATE OR REPLACE FUNCTION public.has_role_demo(user_id_param uuid, role_param app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- First check regular users
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = user_id_param AND ur.role = role_param
  )
  OR
  -- Then check demo users
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id = user_id_param::text AND dum.role = role_param
  );
$$;

-- Update has_department_demo function with secure search path
CREATE OR REPLACE FUNCTION public.has_department_demo(user_id_param uuid, department_param department_slug)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- First check regular users
  SELECT EXISTS (
    SELECT 1 FROM public.user_departments ud
    WHERE ud.user_id = user_id_param AND ud.department = department_param
  )
  OR
  -- Then check demo users
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id = user_id_param::text AND department_param = ANY(dum.departments)
  );
$$;