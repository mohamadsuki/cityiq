-- Temporarily disable RLS on tabarim and ingestion_logs for testing
ALTER TABLE public.tabarim DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_logs DISABLE ROW LEVEL SECURITY;