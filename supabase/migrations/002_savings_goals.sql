create table if not exists savings_goals (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users not null,
  name             text not null,
  target_amount    numeric not null,
  daily_contribution numeric not null,
  created_at       timestamptz default now()
);

alter table savings_goals enable row level security;

create policy "Users can manage their own savings goals"
  on savings_goals
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
