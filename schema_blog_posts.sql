create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text not null,
  category text not null,
  author text not null,
  date date not null,
  read_time text not null,
  featured boolean not null default false,
  content text not null default '',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_featured_idx
  on public.blog_posts(featured);

alter table public.blog_posts enable row level security;

create policy "public read blog posts"
  on public.blog_posts for select
  using (true);

create policy "admin write blog posts"
  on public.blog_posts for all
  using ((auth.jwt()->'user_metadata'->>'is_admin')::boolean = true)
  with check ((auth.jwt()->'user_metadata'->>'is_admin')::boolean = true);
