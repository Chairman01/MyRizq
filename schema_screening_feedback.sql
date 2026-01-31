-- Store user feedback on screening results
create table if not exists public.screening_feedback (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  overall_status text,
  qualitative_method text,
  agree boolean not null,
  comment text,
  user_id uuid,
  created_at timestamptz default now()
);

create index if not exists screening_feedback_ticker_idx
  on public.screening_feedback(ticker);

alter table public.screening_feedback enable row level security;
