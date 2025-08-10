-- Attach manager update enforcement trigger to tasks using existing schema
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'enforce_task_update_permissions_trg'
    ) THEN
        CREATE TRIGGER enforce_task_update_permissions_trg
        BEFORE UPDATE ON public.tasks
        FOR EACH ROW
        EXECUTE FUNCTION public.enforce_task_update_permissions();
    END IF;
END $$;

-- Ensure updated_at is maintained on tasks
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_updated_at'
    ) THEN
        CREATE TRIGGER update_tasks_updated_at
        BEFORE UPDATE ON public.tasks
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;