create table if not exists public.qualitative_overrides (
  ticker text primary key,
  segments jsonb not null default '[]'::jsonb,
  total_revenue numeric,
  year integer,
  source text,
  notes text,
  locked boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists qualitative_overrides_updated_at_idx
  on public.qualitative_overrides(updated_at);

alter table public.qualitative_overrides enable row level security;
