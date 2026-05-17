-- ============================================================
-- IMRA — Fix the admin_stats() sparkline
--
-- Bug: the original `daily_revenue` CTE only returned days that had
-- non-cancelled orders. With one day of activity, the sparkline
-- rendered as a single bar spanning the full width of the card.
--
-- Fix: generate_series() produces all 14 days, and we LEFT JOIN
-- orders onto it. Empty days show as a thin baseline bar.
--
-- Safe to re-run. Paste into Supabase SQL editor.
-- ============================================================

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
  -- ✦ This is the fix ─────────────────────────────────────────
  daily_revenue as (
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
  -- ────────────────────────────────────────────────────────────
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
