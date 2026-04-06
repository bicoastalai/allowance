-- ============================================================
-- 001_initial_schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------

create table public.profiles (
  id                   uuid        primary key references auth.users on delete cascade,
  monthly_income       numeric     not null default 0,
  savings_goal_percent numeric     not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table public.recurring_expenses (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users on delete cascade,
  name       text        not null,
  amount     numeric     not null,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users on delete cascade,
  amount           numeric     not null,
  category         text        not null,
  note             text,
  transaction_date date        not null default current_date,
  created_at       timestamptz not null default now()
);

create table public.subscriptions (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users on delete cascade,
  tier       text        not null default 'free',
  status     text        not null default 'active',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------

alter table public.profiles           enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.transactions       enable row level security;
alter table public.subscriptions      enable row level security;

-- profiles
create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles: delete own"
  on public.profiles for delete
  using (auth.uid() = id);

-- recurring_expenses
create policy "recurring_expenses: select own"
  on public.recurring_expenses for select
  using (auth.uid() = user_id);

create policy "recurring_expenses: insert own"
  on public.recurring_expenses for insert
  with check (auth.uid() = user_id);

create policy "recurring_expenses: update own"
  on public.recurring_expenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "recurring_expenses: delete own"
  on public.recurring_expenses for delete
  using (auth.uid() = user_id);

-- transactions
create policy "transactions: select own"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "transactions: insert own"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "transactions: update own"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "transactions: delete own"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- subscriptions
create policy "subscriptions: select own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "subscriptions: insert own"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

create policy "subscriptions: update own"
  on public.subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "subscriptions: delete own"
  on public.subscriptions for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Auto-provision function + trigger
-- ------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);

  insert into public.subscriptions (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
