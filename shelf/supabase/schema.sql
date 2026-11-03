-- Run this in the Supabase SQL editor. Safe to re-run.

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  isbn text,
  title text not null,
  authors text[] not null default '{}',
  cover_url text,
  page_count integer check (page_count is null or page_count > 0),
  subjects text[] not null default '{}',
  publish_year integer,
  status text not null default 'want_to_read'
    check (status in ('want_to_read', 'reading', 'finished')),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reading_logs (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  log_date date not null default current_date,
  pages integer not null check (pages > 0 and pages <= 5000),
  created_at timestamptz not null default now()
);

-- Upgrades a database created with the earlier login-based schema.
alter table public.books drop column if exists user_id;
alter table public.reading_logs drop column if exists user_id;

-- ISBN is optional (e.g. regional-language books); NULLs don't clash in the unique index.
alter table public.books alter column isbn drop not null;

create unique index if not exists books_isbn_unique on public.books (isbn);
create index if not exists reading_logs_date_idx on public.reading_logs (log_date);

alter table public.books enable row level security;
alter table public.reading_logs enable row level security;

-- No login: anyone with the project URL + anon key can read/write.
drop policy if exists "Own books" on public.books;
drop policy if exists "Public books" on public.books;
create policy "Public books" on public.books
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "Own logs" on public.reading_logs;
drop policy if exists "Public logs" on public.reading_logs;
create policy "Public logs" on public.reading_logs
  for all to anon, authenticated using (true) with check (true);

notify pgrst, 'reload schema';
