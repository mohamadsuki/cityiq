-- Ensure tasks triggers exist
create trigger if not exists set_task_assigned_by_role_trg
before insert on public.tasks
for each row execute function public.set_task_assigned_by_role();

create trigger if not exists update_tasks_updated_at
before update on public.tasks
for each row execute function public.update_updated_at_column();