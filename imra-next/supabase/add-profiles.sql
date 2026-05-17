-- ============================================================
-- IMRA — Profiles table
--
-- One row per auth.users user, auto-created via trigger on signup.
-- Customers and admins both use the same profile structure.
--
-- Safe to re-run.
-- ============================================================

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  address     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ─── Users can read/update their own profile ─────────────
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- ─── Admins can do anything ──────────────────────────────
drop policy if exists "profiles admin all" on public.profiles;
create policy "profiles admin all"
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─── updated_at trigger ──────────────────────────────────
drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─── Auto-create profile when an auth user is created ────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_auth_users_create_profile on auth.users;
create trigger trg_auth_users_create_profile
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Backfill existing users that don't have a profile row ──
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;
