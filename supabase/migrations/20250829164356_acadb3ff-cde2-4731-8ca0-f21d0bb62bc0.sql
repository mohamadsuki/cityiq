-- Create trigger for setting assigned_by_role automatically
DROP TRIGGER IF EXISTS set_assigned_by_role_trigger ON public.tasks;

CREATE TRIGGER set_assigned_by_role_trigger
BEFORE INSERT ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.set_task_assigned_by_role();