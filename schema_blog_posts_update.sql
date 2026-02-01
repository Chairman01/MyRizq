alter table public.blog_posts
  add column if not exists image_url text;

create index if not exists blog_posts_date_idx
  on public.blog_posts(date desc);
