-- Create Portfolios Table
create table if not exists public.portfolios (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text default 'tracker', -- 'tracker' or 'simulator'
  items jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.portfolios enable row level security;

-- Policies
create policy "Users can view their own portfolios"
  on public.portfolios for select
  using (auth.uid() = user_id);

create policy "Users can insert their own portfolios"
  on public.portfolios for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own portfolios"
  on public.portfolios for update
  using (auth.uid() = user_id);

create policy "Users can delete their own portfolios"
  on public.portfolios for delete
  using (auth.uid() = user_id);
