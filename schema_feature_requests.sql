-- Store user feature requests and bug reports
create table if not exists public.feature_requests (
    id uuid primary key default gen_random_uuid(),
    email text,
    title text not null,
    details text,
    user_id uuid,
    created_at timestamptz default now()
);

create index if not exists feature_requests_created_at_idx on public.feature_requests(created_at desc);

alter table public.feature_requests enable row level security;

-- Allow users to read their own requests (optional)
drop policy if exists "Users can view own feature requests" on public.feature_requests;
create policy "Users can view own feature requests"
on public.feature_requests
for select
using (auth.uid() = user_id);
