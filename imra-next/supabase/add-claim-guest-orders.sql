-- ============================================================
-- IMRA — claim_guest_orders()
--
-- When a customer checks out as a guest, their order is saved with
-- user_id = NULL and customer_email = whatever they entered. Later
-- they may sign up OR sign in with that same email — and they
-- expect to see the order in /account/orders. This function does
-- the linking.
--
-- It is SECURITY DEFINER so it can read auth.users.email; it only
-- touches orders that (a) have user_id IS NULL and (b) whose
-- customer_email (case-insensitive) matches the caller's auth email.
--
-- Returns the number of orders that were claimed. Idempotent.
--
-- Safe to re-run. Paste into Supabase SQL editor.
-- ============================================================

create or replace function public.claim_guest_orders()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id   uuid := auth.uid();
  v_email     text;
  v_count     int;
begin
  if v_user_id is null then
    return 0;
  end if;

  select email into v_email from auth.users where id = v_user_id;
  if v_email is null or length(trim(v_email)) = 0 then
    return 0;
  end if;

  update public.orders
     set user_id = v_user_id
   where user_id is null
     and lower(customer_email) = lower(v_email);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.claim_guest_orders() to authenticated;
