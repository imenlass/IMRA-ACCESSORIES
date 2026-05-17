-- ============================================================
-- IMRA — Add contact_messages table
-- Paste into Supabase → SQL Editor. Safe to re-run.
-- ============================================================

create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  subject     text,
  message     text not null,
  user_id     uuid references auth.users(id) on delete set null,
  handled     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists contact_messages_created_idx
  on public.contact_messages(created_at desc);
create index if not exists contact_messages_unhandled_idx
  on public.contact_messages(handled) where handled = false;

alter table public.contact_messages enable row level security;

-- Anyone (anon or authenticated) can submit a contact message.
drop policy if exists "contact_insert" on public.contact_messages;
create policy "contact_insert"
  on public.contact_messages for insert
  to anon, authenticated
  with check (
    length(coalesce(name, ''))    > 0
    and length(coalesce(email, '')) > 0
    and length(coalesce(message,'')) > 0
  );

-- No SELECT policy for public. Admin reads via dashboard / service_role.
