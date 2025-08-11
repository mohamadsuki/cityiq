-- Extend institutions with principal and teachers count
alter table public.institutions add column if not exists principal text null;
alter table public.institutions add column if not exists teachers integer null;