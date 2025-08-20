-- Update the has_role_demo function to work properly with demo users
CREATE OR REPLACE FUNCTION public.has_role_demo(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    CASE 
      WHEN _user_id IS NULL THEN FALSE
      WHEN auth.uid() IS NOT NULL THEN 
        -- Regular auth mode
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = _user_id AND ur.role = _role
        )
      ELSE 
        -- Demo mode - check demo user mapping
        EXISTS (
          SELECT 1 FROM public.demo_user_mapping dum
          WHERE dum.demo_id = _user_id::text AND _role = ANY(dum.roles)
        )
    END;
$function$;

-- Update the has_department_demo function to work properly with demo users  
CREATE OR REPLACE FUNCTION public.has_department_demo(_user_id uuid, _department department_slug)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    CASE 
      WHEN _user_id IS NULL THEN FALSE
      WHEN auth.uid() IS NOT NULL THEN 
        -- Regular auth mode
        EXISTS (
          SELECT 1 FROM public.user_departments ud
          WHERE ud.user_id = _user_id AND ud.department = _department
        )
      ELSE 
        -- Demo mode - check demo user mapping
        EXISTS (
          SELECT 1 FROM public.demo_user_mapping dum
          WHERE dum.demo_id = _user_id::text AND _department = ANY(dum.departments)
        )
    END;
$function$;