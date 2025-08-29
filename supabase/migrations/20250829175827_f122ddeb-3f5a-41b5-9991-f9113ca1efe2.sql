-- Drop and recreate the trigger to ensure it works properly
DROP TRIGGER IF EXISTS set_task_assigned_by_role_trigger ON public.tasks;

CREATE TRIGGER set_task_assigned_by_role_trigger
  BEFORE INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_task_assigned_by_role();