-- ============================================================
-- Thread & Form — canonical database schema (reference copy)
--
-- This is the schema that was applied by hand in the Supabase
-- SQL editor when the project was created. It is kept in the
-- repo so the backend schema is versioned alongside the code.
--
-- Run order on a FRESH Supabase project:
--   1. this file (schema.sql)
--   2. place_order.sql        (atomic checkout RPC)
--   3. admin_setup.sql        (is_admin() + admin RLS policies)
--   4. seed_realistic_data.sql (optional demo data)
--
-- Do NOT re-run this on the live project: the objects already
-- exist and the seed inserts at the bottom would duplicate.
-- ============================================================

-- 1. Extensions
create extension if not exists "pgcrypto";

-- 2. Enums
create type order_status_type as enum ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
create type payment_status_type as enum ('unpaid', 'paid', 'refunded');
create type user_role_type as enum ('customer', 'admin');

-- 3. Profiles table (extends the Supabase built-in auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text not null,
  phone text,
  shipping_address text,
  role user_role_type default 'customer'::user_role_type,
  updated_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- 4. Categories table
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamp with time zone default now()
);

-- 5. Products table
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  image_url text,
  is_featured boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 6. Orders table
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  status order_status_type default 'pending'::order_status_type,
  payment_status payment_status_type default 'unpaid'::payment_status_type,
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  shipping_address text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 7. Order items table
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  created_at timestamp with time zone default now()
);

-- 8. Cart items table (for logged-in users)
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer not null check (quantity > 0),
  created_at timestamp with time zone default now(),
  unique(user_id, product_id)
);

-- ================================================
-- Row Level Security (RLS) policies
-- ================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.cart_items enable row level security;

-- Categories & products: anyone can read, only admins can modify
-- (admin write policies are added by admin_setup.sql)
create policy "Allow public read access on categories" on public.categories for select using (true);
create policy "Allow public read access on products" on public.products for select using (true);

-- Profiles: users can view and update their own profile
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Cart items: users can manage their own shopping cart
create policy "Users can view own cart" on public.cart_items for select using (auth.uid() = user_id);
create policy "Users can insert own cart" on public.cart_items for insert with check (auth.uid() = user_id);
create policy "Users can update own cart" on public.cart_items for update using (auth.uid() = user_id);
create policy "Users can delete own cart" on public.cart_items for delete using (auth.uid() = user_id);

-- Orders: users can view and create their own orders
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users can create own orders" on public.orders for insert with check (auth.uid() = user_id);

-- Order items: users can view items belonging to their orders
create policy "Users can view own order items" on public.order_items
  for select using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

-- ================================================
-- Trigger: create a profile row on signup
-- ================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ================================================
-- Seed: starter categories & products
-- ================================================
insert into public.categories (name, slug, description) values
  ('Men''s Clothing', 'mens-clothing', 'Apparel and accessories for men'),
  ('Women''s Clothing', 'womens-clothing', 'Apparel and accessories for women'),
  ('Accessories', 'accessories', 'Hats, bags, and belts');

insert into public.products (category_id, name, slug, description, price, stock_quantity, image_url, is_featured) values
  ((select id from public.categories where slug = 'mens-clothing'), 'Classic Cotton T-Shirt', 'classic-cotton-tshirt', 'Premium 100% heavy cotton crew neck t-shirt.', 25.00, 50, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518', true),
  ((select id from public.categories where slug = 'womens-clothing'), 'Oversized Denim Jacket', 'oversized-denim-jacket', 'Vintage style light wash denim jacket.', 75.00, 30, 'https://images.unsplash.com/photo-1544441893-675973e31985', true),
  ((select id from public.categories where slug = 'accessories'), 'Minimalist Leather Cap', 'minimalist-leather-cap', 'Structured 6-panel strapback leather cap.', 35.00, 20, 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b', false);
