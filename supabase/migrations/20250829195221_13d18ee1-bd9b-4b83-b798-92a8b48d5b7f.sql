-- Enable RLS on all public tables that don't have it enabled
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN (
            SELECT t.tablename 
            FROM pg_tables t
            JOIN pg_class c ON c.relname = t.tablename
            WHERE c.relrowsecurity = true 
            AND t.schemaname = 'public'
        )
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(table_name) || ' ENABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'Enabled RLS on table: %', table_name;
    END LOOP;
END $$;