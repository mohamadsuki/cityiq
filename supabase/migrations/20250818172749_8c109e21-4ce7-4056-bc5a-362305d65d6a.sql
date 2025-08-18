-- Fix the trigger for setting assigned_by_role to work with demo users too
CREATE OR REPLACE FUNCTION public.set_task_assigned_by_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check for regular and demo users
  IF public.has_role_demo(auth.uid(), 'mayor') THEN
    NEW.assigned_by_role := 'mayor';
  ELSIF public.has_role_demo(auth.uid(), 'ceo') THEN
    NEW.assigned_by_role := 'ceo';
  END IF;
  RETURN NEW;
END;
$function$;

-- Make sure the trigger exists on the tasks table
DROP TRIGGER IF EXISTS set_task_assigned_by_role_trigger ON public.tasks;
CREATE TRIGGER set_task_assigned_by_role_trigger
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_task_assigned_by_role();