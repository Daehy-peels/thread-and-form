-- Atomic checkout: creates the order, its items, decrements stock, and clears
-- the cart in a single transaction. Security definer so it can write to
-- order_items / products despite their restrictive RLS policies.
-- Any raised exception rolls the whole transaction back (no orphan orders).
create or replace function public.place_order(
  p_shipping_address text,
  p_total_amount numeric,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_unit_price numeric;
  v_stock integer;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to place an order.';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;

  insert into public.orders (user_id, total_amount, shipping_address, status, payment_status)
  values (v_user_id, p_total_amount, p_shipping_address, 'pending', 'paid')
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity   := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price')::numeric;

    select stock_quantity into v_stock
    from public.products
    where id = v_product_id
    for update;

    if v_stock is null then
      raise exception 'A product in your cart no longer exists.';
    end if;

    if v_stock < v_quantity then
      raise exception 'Not enough stock remaining for one of your items.';
    end if;

    insert into public.order_items (order_id, product_id, quantity, unit_price)
    values (v_order_id, v_product_id, v_quantity, v_unit_price);

    update public.products
    set stock_quantity = stock_quantity - v_quantity
    where id = v_product_id;
  end loop;

  delete from public.cart_items where user_id = v_user_id;

  return v_order_id;
end;
$$;

grant execute on function public.place_order(text, numeric, jsonb) to authenticated;
