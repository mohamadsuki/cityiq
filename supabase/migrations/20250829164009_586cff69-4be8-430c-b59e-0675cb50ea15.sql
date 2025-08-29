-- Fix the set_task_assigned_by_role function to use the correct has_role function
CREATE OR REPLACE FUNCTION public.set_task_assigned_by_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check for regular and demo users
  IF public.has_role(auth.uid(), 'mayor') THEN
    NEW.assigned_by_role := 'mayor';
  ELSIF public.has_role(auth.uid(), 'ceo') THEN
    NEW.assigned_by_role := 'ceo';
  END IF;
  RETURN NEW;
END;
$function$;