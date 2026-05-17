-- ============================================================
-- IMRA — Admin setup
-- Paste into Supabase SQL editor and run. Safe to re-run.
--
-- After running:
--   1. Sign up a regular user in the app (e.g. your own email)
--   2. Promote them to admin:
--        select public.grant_admin('your-email@example.com');
--   3. Visit /admin while logged in as that user.
-- ============================================================

-- ─── ADMINS TABLE ────────────────────────────────────────────
create table if not exists public.admins (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Admins themselves can read the admins table; no one else
drop policy if exists "admins read self" on public.admins;
create policy "admins read self"
  on public.admins for select
  to authenticated
  using (user_id = auth.uid());

-- ─── is_admin() HELPER ───────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ─── grant_admin() helper (run manually) ─────────────────────
create or replace function public.grant_admin(p_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = p_email;
  if v_user_id is null then
    raise exception 'No user found with email %', p_email;
  end if;
  insert into public.admins (user_id) values (v_user_id)
  on conflict (user_id) do nothing;
  return v_user_id;
end;
$$;

-- Restrict execution to service_role only (run from SQL editor)
revoke all on function public.grant_admin(text) from public, anon, authenticated;

-- ─── EXTEND RLS: admins can do anything ──────────────────────

-- Products
drop policy if exists "products admin all" on public.products;
create policy "products admin all"
  on public.products for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Orders
drop policy if exists "orders admin all" on public.orders;
create policy "orders admin all"
  on public.orders for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Order items
drop policy if exists "order_items admin all" on public.order_items;
create policy "order_items admin all"
  on public.order_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Contact messages
drop policy if exists "contact admin all" on public.contact_messages;
create policy "contact admin all"
  on public.contact_messages for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- FAQs
drop policy if exists "faqs admin all" on public.faqs;
create policy "faqs admin all"
  on public.faqs for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Site pages
drop policy if exists "site_pages admin all" on public.site_pages;
create policy "site_pages admin all"
  on public.site_pages for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─── TIGHTEN STORAGE WRITE POLICY: admin only ────────────────
drop policy if exists "product-images write"  on storage.objects;
drop policy if exists "product-images update" on storage.objects;
drop policy if exists "product-images delete" on storage.objects;

create policy "product-images write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product-images update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product-images delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- ─── ADMIN STATS RPC (single round-trip for the dashboard) ──
create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  with month_revenue as (
    select coalesce(sum(total), 0)::numeric as v
    from public.orders
    where created_at >= date_trunc('month', now())
      and status <> 'cancelled'
  ),
  total_revenue as (
    select coalesce(sum(total), 0)::numeric as v
    from public.orders
    where status <> 'cancelled'
  ),
  orders_status as (
    select coalesce(jsonb_object_agg(status, c), '{}'::jsonb) as v
    from (
      select status, count(*)::int as c from public.orders group by status
    ) t
  ),
  totals as (
    select
      (select count(*) from public.products where is_active = true)::int as products,
      (select count(*) from public.orders)::int                          as orders,
      (select count(*) from public.contact_messages where handled = false)::int as unread_messages,
      (select count(*) from public.admins)::int                          as admins
  ),
  top_products as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'product_id', product_id,
      'name', name,
      'quantity', quantity,
      'revenue', revenue
    )), '[]'::jsonb) as v
    from (
      select
        oi.product_id,
        coalesce(p.name, oi.product_name) as name,
        sum(oi.quantity)::int             as quantity,
        sum(oi.line_total)::numeric       as revenue
      from public.order_items oi
      left join public.products p on p.id = oi.product_id
      left join public.orders o on o.id = oi.order_id
      where o.status <> 'cancelled'
      group by oi.product_id, p.name, oi.product_name
      order by quantity desc
      limit 5
    ) t
  ),
  recent_orders as (
    select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) as v
    from (
      select id, customer_name, total, status, created_at
      from public.orders
      order by created_at desc
      limit 5
    ) t
  ),
  daily_revenue as (
    -- Always returns 14 rows (today + previous 13 days), so the
    -- sparkline renders consistently even with a single day of data.
    select coalesce(jsonb_agg(jsonb_build_object('day', day, 'revenue', revenue)
                              order by day), '[]'::jsonb) as v
    from (
      select
        d::date as day,
        coalesce(sum(o.total) filter (where o.status <> 'cancelled'), 0)::numeric as revenue
      from generate_series(
             (now() - interval '13 days')::date,
             (now())::date,
             interval '1 day'
           ) d
      left join public.orders o
        on date_trunc('day', o.created_at)::date = d::date
      group by d
      order by d
    ) t
  )
  select jsonb_build_object(
    'month_revenue',    (select v from month_revenue),
    'total_revenue',    (select v from total_revenue),
    'orders_by_status', (select v from orders_status),
    'totals',           (select row_to_json(totals) from totals),
    'top_products',     (select v from top_products),
    'recent_orders',    (select v from recent_orders),
    'daily_revenue',    (select v from daily_revenue)
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.admin_stats() to authenticated;
