-- City settings table for global branding
create table if not exists public.city_settings (
  id text primary key default 'global',
  city_name text,
  logo_url text,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure updated_at maintenance
drop trigger if exists update_city_settings_updated_at on public.city_settings;
create trigger update_city_settings_updated_at
before update on public.city_settings
for each row execute function public.update_updated_at_column();

-- Enable RLS
alter table public.city_settings enable row level security;

-- Policies: anyone can read, only mayor/ceo can insert/update
drop policy if exists "City settings readable by everyone" on public.city_settings;
create policy "City settings readable by everyone"
  on public.city_settings for select
  using (true);

drop policy if exists "Mayor/Ceo can insert city settings" on public.city_settings;
create policy "Mayor/Ceo can insert city settings"
  on public.city_settings for insert
  with check (public.has_role(auth.uid(), 'mayor') or public.has_role(auth.uid(), 'ceo'));

drop policy if exists "Mayor/Ceo can update city settings" on public.city_settings;
create policy "Mayor/Ceo can update city settings"
  on public.city_settings for update
  using (public.has_role(auth.uid(), 'mayor') or public.has_role(auth.uid(), 'ceo'));

-- Storage bucket for branding assets
insert into storage.buckets (id, name, public)
values ('branding','branding', true)
on conflict (id) do nothing;

-- Storage policies for branding bucket
drop policy if exists "Branding public read" on storage.objects;
create policy "Branding public read"
  on storage.objects for select
  using (bucket_id = 'branding');

drop policy if exists "Branding insert by mayor/ceo" on storage.objects;
create policy "Branding insert by mayor/ceo"
  on storage.objects for insert
  with check (bucket_id = 'branding' and (public.has_role(auth.uid(), 'mayor') or public.has_role(auth.uid(), 'ceo')));

drop policy if exists "Branding update by mayor/ceo" on storage.objects;
create policy "Branding update by mayor/ceo"
  on storage.objects for update
  using (bucket_id = 'branding' and (public.has_role(auth.uid(), 'mayor') or public.has_role(auth.uid(), 'ceo')));

drop policy if exists "Branding delete by mayor/ceo" on storage.objects;
create policy "Branding delete by mayor/ceo"
  on storage.objects for delete
  using (bucket_id = 'branding' and (public.has_role(auth.uid(), 'mayor') or public.has_role(auth.uid(), 'ceo')));

-- Trigger to set assigned_by_role automatically on tasks
drop trigger if exists set_task_assigned_by_role_trg on public.tasks;
create trigger set_task_assigned_by_role_trg
before insert on public.tasks
for each row execute function public.set_task_assigned_by_role();

-- Improve realtime payloads
alter table public.tasks replica identity full;
alter table public.task_acknowledgements replica identity full;
alter table public.city_settings replica identity full;