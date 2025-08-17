-- Fix ingestion_logs table structure
ALTER TABLE ingestion_logs 
ADD COLUMN IF NOT EXISTS context text,
ADD COLUMN IF NOT EXISTS error_rows integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS inserted_rows integer DEFAULT 0;

-- Check current tabar_domain enum values and add 'other' if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'other' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'tabar_domain')) THEN
        ALTER TYPE tabar_domain ADD VALUE 'other';
    END IF;
END $$;