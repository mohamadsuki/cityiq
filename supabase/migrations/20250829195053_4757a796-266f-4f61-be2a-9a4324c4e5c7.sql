-- Fix RLS issues only if needed
DO $$ 
BEGIN
    -- Only enable RLS if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'collection_data' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.collection_data ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;