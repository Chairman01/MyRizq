-- Create a table to store subscription details
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  status text not null, -- 'active', 'trialing', 'canceled', 'past_due', etc.
  plan_id text, -- 'monthly-4.99' or 'yearly-50'
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- One row per user (current subscription state)
create unique index if not exists subscriptions_user_id_key on public.subscriptions(user_id);

-- Protect against Stripe webhook retries creating duplicates
create unique index if not exists subscriptions_stripe_subscription_id_key on public.subscriptions(stripe_subscription_id)
  where stripe_subscription_id is not null;

create index if not exists subscriptions_stripe_customer_id_idx on public.subscriptions(stripe_customer_id)
  where stripe_customer_id is not null;

-- Enable Row Level Security (RLS)
alter table public.subscriptions enable row level security;

-- Policy: Users can view their own subscription
drop policy if exists "Users can view own subscription" on public.subscriptions;
create policy "Users can view own subscription" 
  on public.subscriptions for select 
  using (auth.uid() = user_id);

-- Policy: Service role (webhooks) can insert/update (implicit admin access, but good to note)
