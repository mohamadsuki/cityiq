-- Enable RLS on all tables that need it
-- Check which tables are missing RLS and enable it

-- Enable RLS on tabarim table (if not already enabled)
ALTER TABLE public.tabarim ENABLE ROW LEVEL SECURITY;

-- Enable RLS on ingestion_logs table (if not already enabled) 
ALTER TABLE public.ingestion_logs ENABLE ROW LEVEL SECURITY;