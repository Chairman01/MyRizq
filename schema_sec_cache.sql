-- Cache SEC qualitative screening results
create table if not exists public.sec_qualitative_cache (
  ticker text primary key,
  payload jsonb not null,
  updated_at timestamptz default now()
);

create index if not exists sec_qualitative_cache_updated_at_idx
  on public.sec_qualitative_cache(updated_at);

alter table public.sec_qualitative_cache enable row level security;
