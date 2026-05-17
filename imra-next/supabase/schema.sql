-- ============================================================
-- IMRA Accessories — Supabase schema
-- Run this in Supabase SQL editor (or `supabase db push`)
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- PRODUCTS
-- ============================================================
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  name         text        not null,
  slug         text        unique not null,
  description  text,
  price        numeric(10,2) not null check (price >= 0),
  currency     text        not null default 'DT',
  image_url    text        not null,
  collection   text        not null default 'red-carpet',
  stock        integer     not null default 999,
  is_active    boolean     not null default true,
  display_order integer    not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists products_collection_idx on public.products(collection);
create index if not exists products_active_order_idx on public.products(is_active, display_order);

-- ============================================================
-- ORDERS
-- ============================================================
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete set null, -- nullable for guest checkout
  customer_name    text not null,
  customer_email   text not null,
  customer_phone   text not null,
  customer_address text not null,
  total            numeric(10,2) not null check (total >= 0),
  currency         text not null default 'DT',
  status           text not null default 'pending' check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_idx on public.orders(created_at desc);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    uuid references public.products(id) on delete set null,
  product_name  text not null,   -- snapshot at time of order
  unit_price    numeric(10,2) not null check (unit_price >= 0),
  quantity      integer not null check (quantity > 0),
  line_total    numeric(10,2) generated always as (unit_price * quantity) stored,
  created_at    timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items(order_id);

-- ============================================================
-- updated_at trigger
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- Products: anyone can read active products
drop policy if exists "products read active" on public.products;
create policy "products read active"
  on public.products for select
  using (is_active = true);

-- Orders / order_items: no direct INSERT policies for REST.
-- Clients MUST go through the create_order() RPC (defined below),
-- which is SECURITY DEFINER and bypasses RLS atomically. This lets
-- guests check out, prevents client-supplied totals, and keeps the
-- row-level rules simple.

drop policy if exists "orders select own" on public.orders;
create policy "orders select own"
  on public.orders for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "order_items select own" on public.order_items;
create policy "order_items select own"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
    )
  );

-- ============================================================
-- create_order() — atomic checkout RPC
-- ============================================================
create or replace function public.create_order(
  p_customer_name    text,
  p_customer_email   text,
  p_customer_phone   text,
  p_customer_address text,
  p_notes            text,
  p_items            jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_total    numeric(10,2);
  v_item     jsonb;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  if length(coalesce(p_customer_name, ''))    = 0
     or length(coalesce(p_customer_email, '')) = 0
     or length(coalesce(p_customer_phone, '')) = 0
     or length(coalesce(p_customer_address,'')) = 0 then
    raise exception 'Missing required customer fields';
  end if;

  select coalesce(sum((item->>'price')::numeric * (item->>'quantity')::int), 0)
    into v_total
  from jsonb_array_elements(p_items) item;

  insert into public.orders (
    user_id, customer_name, customer_email, customer_phone,
    customer_address, total, notes, status
  ) values (
    auth.uid(),
    p_customer_name, p_customer_email, p_customer_phone,
    p_customer_address, v_total, nullif(p_notes, ''), 'pending'
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.order_items (
      order_id, product_id, product_name, unit_price, quantity
    ) values (
      v_order_id,
      nullif(v_item->>'product_id', '')::uuid,
      v_item->>'name',
      (v_item->>'price')::numeric,
      (v_item->>'quantity')::int
    );
  end loop;

  return v_order_id;
end;
$$;

grant execute on function public.create_order(text, text, text, text, text, jsonb) to anon, authenticated;

-- ============================================================
-- CONTACT MESSAGES
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

alter table public.contact_messages enable row level security;

drop policy if exists "contact_insert" on public.contact_messages;
create policy "contact_insert"
  on public.contact_messages for insert
  to anon, authenticated
  with check (
    length(coalesce(name, ''))    > 0
    and length(coalesce(email, '')) > 0
    and length(coalesce(message,'')) > 0
  );

-- ============================================================
-- SITE PAGES + FAQS (editable content)
-- ============================================================
create table if not exists public.site_pages (
  slug         text primary key,
  title        text not null,
  eyebrow      text,
  content_html text not null,
  is_published boolean not null default true,
  updated_at   timestamptz not null default now()
);
alter table public.site_pages enable row level security;
drop policy if exists "site_pages read published" on public.site_pages;
create policy "site_pages read published"
  on public.site_pages for select
  using (is_published = true);
drop trigger if exists trg_site_pages_updated on public.site_pages;
create trigger trg_site_pages_updated before update on public.site_pages
  for each row execute function public.set_updated_at();

create table if not exists public.faqs (
  id           uuid primary key default gen_random_uuid(),
  question     text not null,
  answer       text not null,
  position     integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists faqs_position_idx on public.faqs(position);
alter table public.faqs enable row level security;
drop policy if exists "faqs read published" on public.faqs;
create policy "faqs read published"
  on public.faqs for select
  using (is_published = true);

-- ============================================================
-- SEED PRODUCTS (the 6 from the original IMRA.html)
-- ============================================================
insert into public.products (name, slug, description, price, image_url, collection, display_order) values
  ('Bracelet en chaine dorée', 'bracelet-chaine-doree', 'Bracelet en chaîne dorée, fait main avec passion.', 9,  '/products/bracelet-chaine-doree.png', 'red-carpet', 1),
  ('Bracelet Perlé',           'bracelet-perle',         'Bracelet perlé, raffinement et élégance.',       9,  '/products/bracelet-perle.png',         'red-carpet', 2),
  ('Parure Rouge',             'parure-rouge',           'Parure rouge éclatante pour vos moments d''exception.', 16, '/products/parure-rouge.png',           'red-carpet', 3),
  ('Bracelet Infini',          'bracelet-infini',        'Bracelet Infini, symbole d''éternité.',          15, '/products/bracelet-infini.png',        'red-carpet', 4),
  ('Parure Tortue',            'parure-tortue',          'Parure tortue, motif raffiné et original.',      16, '/products/parure-tortue.png',          'red-carpet', 5),
  ('Collier Perlé Royale',     'collier-perle-royale',   'Collier perlé royale, pièce d''exception.',      15, '/products/collier-perle-royale.png',   'red-carpet', 6)
on conflict (slug) do nothing;
