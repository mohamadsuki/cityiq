-- Fix ingestion_logs table completely 
ALTER TABLE ingestion_logs 
ADD COLUMN IF NOT EXISTS file_name text;