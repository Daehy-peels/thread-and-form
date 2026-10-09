-- ============================================================
-- Admin access setup for Thread & Form
-- Run this in the Supabase SQL editor, then promote your account.
-- ============================================================

-- Helper: is the current authenticated user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- Products: admins can create / edit / delete
create policy "Admins can insert products"
  on public.products for insert to authenticated
  with check (public.is_admin());
create policy "Admins can update products"
  on public.products for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete products"
  on public.products for delete to authenticated
  using (public.is_admin());

-- Categories: admins can create / edit / delete
create policy "Admins can insert categories"
  on public.categories for insert to authenticated
  with check (public.is_admin());
create policy "Admins can update categories"
  on public.categories for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete categories"
  on public.categories for delete to authenticated
  using (public.is_admin());

-- Orders: admins can view all and update status
create policy "Admins can view all orders"
  on public.orders for select to authenticated
  using (public.is_admin());
create policy "Admins can update orders"
  on public.orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Order items: admins can view all
create policy "Admins can view all order items"
  on public.order_items for select to authenticated
  using (public.is_admin());

-- Profiles: admins can view all (for customer names on orders)
create policy "Admins can view all profiles"
  on public.profiles for select to authenticated
  using (public.is_admin());

-- ============================================================
-- Promote your account to admin (run once, use YOUR email):
-- update public.profiles set role = 'admin' where email = 'you@example.com';
-- ============================================================
