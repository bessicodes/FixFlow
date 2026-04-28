-- FixFlow Supabase setup
-- Run this in Supabase SQL Editor before using the live signup/admin features.

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  business_name text not null,
  email text not null,
  whatsapp text,
  website_type text not null,
  current_website text,
  message text,
  status text not null default 'new'
);

create table if not exists public.page_visits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  path text,
  referrer text,
  user_agent text,
  screen_width integer,
  screen_height integer,
  timezone text
);

alter table public.admins enable row level security;
alter table public.leads enable row level security;
alter table public.page_visits enable row level security;

drop policy if exists "Admins can view themselves" on public.admins;
create policy "Admins can view themselves"
on public.admins
for select
to authenticated
using (email = auth.jwt() ->> 'email');

drop policy if exists "Anyone can submit FixFlow leads" on public.leads;
create policy "Anyone can submit FixFlow leads"
on public.leads
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can view FixFlow leads" on public.leads;
create policy "Admins can view FixFlow leads"
on public.leads
for select
to authenticated
using (
  exists (
    select 1
    from public.admins
    where admins.email = auth.jwt() ->> 'email'
  )
);

drop policy if exists "Anyone can record page visits" on public.page_visits;
create policy "Anyone can record page visits"
on public.page_visits
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can view page visits" on public.page_visits;
create policy "Admins can view page visits"
on public.page_visits
for select
to authenticated
using (
  exists (
    select 1
    from public.admins
    where admins.email = auth.jwt() ->> 'email'
  )
);

-- After creating an admin user in Authentication > Users, add that email here.
-- Replace the email below with your real admin email before running, or run it later.
-- insert into public.admins (email)
-- values ('your-admin-email@example.com')
-- on conflict (email) do nothing;
