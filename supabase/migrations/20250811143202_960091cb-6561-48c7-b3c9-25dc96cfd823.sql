-- Create budgets table for finance
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  department_slug public.department_slug,
  year integer not null default date_part('year', now())::int,
  item_name text,
  amount_approved numeric,
  amount_spent numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.budgets enable row level security;

-- Policies: Users (own rows)
create policy if not exists "Users can view their own budgets"
  on public.budgets for select
  using (auth.uid() = user_id);

create policy if not exists "Users can insert their own budgets"
  on public.budgets for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can update their own budgets"
  on public.budgets for update
  using (auth.uid() = user_id);

create policy if not exists "Users can delete their own budgets"
  on public.budgets for delete
  using (auth.uid() = user_id);

-- Policies: Mayor full access
create policy if not exists "Mayor can select all budgets"
  on public.budgets for select
  using (has_role(auth.uid(), 'mayor'));

create policy if not exists "Mayor can insert budgets"
  on public.budgets for insert
  with check (has_role(auth.uid(), 'mayor'));

create policy if not exists "Mayor can update budgets"
  on public.budgets for update
  using (has_role(auth.uid(), 'mayor'));

create policy if not exists "Mayor can delete budgets"
  on public.budgets for delete
  using (has_role(auth.uid(), 'mayor'));

-- Policies: CEO full access
create policy if not exists "CEO can select all budgets"
  on public.budgets for select
  using (has_role(auth.uid(), 'ceo'));

create policy if not exists "CEO can insert budgets"
  on public.budgets for insert
  with check (has_role(auth.uid(), 'ceo'));

create policy if not exists "CEO can update budgets"
  on public.budgets for update
  using (has_role(auth.uid(), 'ceo'));

create policy if not exists "CEO can delete budgets"
  on public.budgets for delete
  using (has_role(auth.uid(), 'ceo'));

-- Policies: Managers by department
create policy if not exists "Managers can select budgets by department"
  on public.budgets for select
  using (has_role(auth.uid(), 'manager') and has_department(auth.uid(), department_slug));

create policy if not exists "Managers can insert budgets by department"
  on public.budgets for insert
  with check (has_role(auth.uid(), 'manager') and has_department(auth.uid(), department_slug));

create policy if not exists "Managers can update budgets by department"
  on public.budgets for update
  using (has_role(auth.uid(), 'manager') and has_department(auth.uid(), department_slug));

create policy if not exists "Managers can delete budgets by department"
  on public.budgets for delete
  using (has_role(auth.uid(), 'manager') and has_department(auth.uid(), department_slug));

-- Trigger to maintain updated_at
create trigger if not exists update_budgets_updated_at
before update on public.budgets
for each row execute function public.update_updated_at_column();