-- Debug and fix the assigned_by_role function
CREATE OR REPLACE FUNCTION public.set_task_assigned_by_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user has mayor role
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'mayor') THEN
    NEW.assigned_by_role := 'mayor';
  -- Check if user has CEO role  
  ELSIF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'ceo') THEN
    NEW.assigned_by_role := 'ceo';
  END IF;
  
  RETURN NEW;
END;
$function$;