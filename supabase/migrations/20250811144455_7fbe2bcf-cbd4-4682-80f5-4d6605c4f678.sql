-- Add schedule and files to projects
alter table public.projects add column if not exists start_at timestamptz null;
alter table public.projects add column if not exists end_at timestamptz null;
alter table public.projects add column if not exists file_urls text[] null;

-- Add media and schedule to plans
alter table public.plans add column if not exists image_urls text[] null;
alter table public.plans add column if not exists file_urls text[] null;
alter table public.plans add column if not exists start_at timestamptz null;
alter table public.plans add column if not exists end_at timestamptz null;

-- Add media and reason to licenses
alter table public.licenses add column if not exists image_urls text[] null;
alter table public.licenses add column if not exists reason_no_license text null;