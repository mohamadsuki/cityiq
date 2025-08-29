-- Create trigger to set assigned_by_role on task creation
CREATE TRIGGER set_task_assigned_by_role_trigger
  BEFORE INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_task_assigned_by_role();