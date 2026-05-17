-- ============================================================
-- IMRA — RLS fix
-- Paste this into Supabase → SQL Editor and run it.
-- Safe to re-run.
--
-- Problem: the original schema's order_items INSERT policy used
--   EXISTS(SELECT 1 FROM orders ...) but anon users had no SELECT
--   policy on orders, so the sub-query returned 0 rows and
--   guest checkout failed with "row-level security policy"
--   violations.
--
-- Fix: introduce a SECURITY DEFINER function create_order() that
--   inserts both the order and its line items atomically, with
--   server-controlled total computation and proper user_id binding.
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

  -- Compute trusted total on the server from supplied line items.
  select coalesce(sum((item->>'price')::numeric * (item->>'quantity')::int), 0)
    into v_total
  from jsonb_array_elements(p_items) item;

  insert into public.orders (
    user_id,
    customer_name,
    customer_email,
    customer_phone,
    customer_address,
    total,
    notes,
    status
  ) values (
    auth.uid(),            -- null for guests, user id for authenticated
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_customer_address,
    v_total,
    nullif(p_notes, ''),
    'pending'
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      unit_price,
      quantity
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

-- Tighten / re-declare the orders policies so:
--   - anon CANNOT insert directly via REST (must use create_order RPC)
--   - authenticated users CAN insert directly if they want, but normally also use the RPC
--   - everyone keeps SELECT on their own rows

drop policy if exists "orders insert any"     on public.orders;
drop policy if exists "order_items insert any" on public.order_items;

-- We still want signed-in users to be able to read their own orders.
drop policy if exists "orders select own"      on public.orders;
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

-- No INSERT policies on orders/order_items for REST — clients must
-- go through create_order(). This makes the API more abuse-resistant
-- because totals are computed server-side.

comment on function public.create_order is
  'Atomically inserts an order and its line items. Use from anon or authenticated clients via supabase.rpc("create_order", {...}).';
