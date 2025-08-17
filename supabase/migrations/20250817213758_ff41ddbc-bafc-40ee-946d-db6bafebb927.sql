-- Fix ingestion_logs table structure completely
ALTER TABLE ingestion_logs 
ADD COLUMN IF NOT EXISTS file_path text,
ADD COLUMN IF NOT EXISTS detected_table text;