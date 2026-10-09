-- ============================================================
-- Thread & Form — realistic demo data
-- Run this ONCE in the Supabase SQL editor, AFTER admin_setup.sql.
--
-- Safe to re-run: everything is skipped if it already exists.
--
-- Demo customer logins (all use the same password):
--   sarah.chen@example.com    / password123
--   marcus.reed@example.com   / password123
--   amara.okafor@example.com  / password123
--   lucas.moreau@example.com  / password123
--   priya.sharma@example.com  / password123
--   tom.becker@example.com    / password123
-- ============================================================

-- ------------------------------------------------------------
-- 1. Demo customers: auth users + profiles
-- ------------------------------------------------------------
do $$
declare
  rec record;
  uid uuid;
begin
  for rec in
    select * from (values
      ('sarah.chen@example.com',   'Sarah Chen',   '14 Maple Grove, Apt 3B, Portland, OR 97205'),
      ('marcus.reed@example.com',  'Marcus Reed',  '221B Kingsway Lane, Austin, TX 78704'),
      ('amara.okafor@example.com', 'Amara Okafor', '88 Harbour View Road, Seattle, WA 98101'),
      ('lucas.moreau@example.com', 'Lucas Moreau', '12 Rue des Lilas, Apt 5, Brooklyn, NY 11211'),
      ('priya.sharma@example.com', 'Priya Sharma', '407 Sunset Boulevard, Denver, CO 80203'),
      ('tom.becker@example.com',   'Tom Becker',   '9 Oakfield Terrace, Chicago, IL 60614')
    ) as t(email, full_name, address)
  loop
    select id into uid from auth.users where email = rec.email;

    if uid is null then
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, last_sign_in_at,
        raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, is_sso_user,
        confirmation_token, email_change, email_change_token_new, recovery_token
      ) values (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        rec.email,
        extensions.crypt('password123', extensions.gen_salt('bf')),
        now(),
        null,
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', rec.full_name),
        now() - interval '40 days',
        now(),
        false,
        '', '', '', ''
      )
      returning id into uid;

      insert into auth.identities (
        id, provider_id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(),
        uid::text,
        uid,
        jsonb_build_object(
          'sub', uid::text,
          'email', rec.email,
          'email_verified', true,
          'phone_verified', false
        ),
        'email',
        null, now(), now()
      )
      on conflict (provider_id, provider) do nothing;
    end if;

    -- The handle_new_user trigger usually creates this; make sure it exists.
    insert into public.profiles (id, email, full_name, shipping_address, role)
    values (uid, rec.email, rec.full_name, rec.address, 'customer')
    on conflict (id) do update
      set full_name = excluded.full_name,
          shipping_address = excluded.shipping_address;
  end loop;
end $$;

-- ------------------------------------------------------------
-- 2. Products (21 new items across the three categories)
-- ------------------------------------------------------------
insert into public.products
  (category_id, name, slug, description, price, stock_quantity, image_url, is_featured)
select
  c.id,
  v.name,
  v.slug,
  v.description,
  v.price::numeric,
  v.stock::int,
  v.image,
  v.featured::boolean
from (values
  -- Men
  ('mens-clothing', 'Organic Cotton Crew Tee', 'organic-cotton-crew-tee',
   'A mid-weight crew neck knit from certified organic cotton. Pre-washed so it keeps its shape.',
   28.00, 42, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80', true),
  ('mens-clothing', 'Heritage Leather Jacket', 'heritage-leather-jacket',
   'Full-grain lambskin with a quilted shoulder panel and antique brass hardware.',
   248.00, 7, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80', true),
  ('mens-clothing', 'Oxford Button-Down', 'oxford-button-down',
   'Woven cotton oxford with a soft roll collar. Dressy enough for the office, easy enough for weekends.',
   68.00, 25, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80', false),
  ('mens-clothing', 'Essential Tee 3-Pack', 'essential-tee-3-pack',
   'Three everyday tees in black, white and slate. Cut from a compact spun jersey.',
   54.00, 31, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=80', false),
  ('mens-clothing', 'Washed Denim Jacket', 'washed-denim-jacket',
   'Rigid 13oz selvedge denim, stone-washed for a broken-in feel from day one.',
   96.00, 14, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80', true),
  ('mens-clothing', 'Everyday Crewneck Sweater', 'everyday-crewneck-sweater',
   'Lambswool blend knitted in a fine gauge. Light enough to layer, warm enough on its own.',
   88.00, 22, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80', false),
  ('mens-clothing', 'Slim-Fit Chino', 'slim-fit-chino',
   'Garment-dyed stretch twill with a clean flat front and a slim tapered leg.',
   78.00, 3, 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=900&q=80', false),
  ('mens-clothing', 'Brushed Flannel Overshirt', 'brushed-flannel-overshirt',
   'A heavyweight flannel overshirt with chest pockets, built to be worn open over a tee.',
   82.00, 0, 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=900&q=80', false),

  -- Women
  ('womens-clothing', 'Silk-Blend Camisole', 'silk-blend-camisole',
   'Bias-cut from a silk and viscose blend with adjustable straps and a French seam finish.',
   64.00, 19, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80', false),
  ('womens-clothing', 'Tailored Wool Coat', 'tailored-wool-coat',
   'Double-faced wool with a notched lapel and a long single-breasted line.',
   210.00, 9, 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80', true),
  ('womens-clothing', 'Relaxed Linen Shirt', 'relaxed-linen-shirt',
   'European flax linen in an oversized cut that gets softer with every wash.',
   72.00, 26, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', false),
  ('womens-clothing', 'Pleated Midi Skirt', 'pleated-midi-skirt',
   'Sunray pleats in a fluid recycled satin, finished with an elasticated waistband.',
   86.00, 11, 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80', false),
  ('womens-clothing', 'Cashmere V-Neck Sweater', 'cashmere-vneck-sweater',
   'Two-ply Mongolian cashmere knitted in a relaxed V-neck silhouette.',
   145.00, 5, 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?auto=format&fit=crop&w=900&q=80', false),
  ('womens-clothing', 'High-Rise Straight Jean', 'high-rise-straight-jean',
   'Non-stretch rigid denim with a true high rise and a straight leg from hip to hem.',
   92.00, 17, 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80', false),
  ('womens-clothing', 'Studio Wrap Dress', 'studio-wrap-dress',
   'A true wrap dress in matte crepe with a self-tie belt and a midi length.',
   118.00, 8, 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80', true),

  -- Accessories
  ('accessories', 'Leather Weekender Bag', 'leather-weekender-bag',
   'Vegetable-tanned leather holdall with a cotton canvas lining and solid brass zips.',
   178.00, 6, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80', false),
  ('accessories', 'Canvas Daypack', 'canvas-daypack',
   'A 20-litre waxed canvas daypack with a padded 15" laptop sleeve.',
   68.00, 24, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80', false),
  ('accessories', 'Minimal Steel Watch', 'minimal-steel-watch',
   'A 38mm brushed steel case on a quick-release Italian leather strap.',
   135.00, 12, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80', true),
  ('accessories', 'Acetate Sunglasses', 'acetate-sunglasses',
   'Italian acetate frames with CR-39 lenses and full UV protection.',
   58.00, 4, 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=80', false),
  ('accessories', 'Cotton Twill Cap', 'cotton-twill-cap',
   'Six-panel washed twill cap with an adjustable metal buckle strap.',
   32.00, 38, 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80', false),
  ('accessories', 'Court Leather Sneaker', 'court-leather-sneaker',
   'A low-profile court sneaker in smooth leather on a vulcanised rubber sole.',
   112.00, 2, 'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=900&q=80', false)
) as v(cat, name, slug, description, price, stock, image, featured)
join public.categories c on c.slug = v.cat
where not exists (
  select 1 from public.products p where p.slug = v.slug
);

-- ------------------------------------------------------------
-- 3. Orders + order items for those customers
--    (order ids are derived from the data, so re-running skips them)
-- ------------------------------------------------------------
do $$
declare
  o record;
  it record;
  uid uuid;
  oid uuid;
  addr text;
  total numeric;
begin
  for o in
    select * from (values
      ('sarah.chen@example.com',   21, 'delivered',  'paid'),
      ('marcus.reed@example.com',  18, 'delivered',  'paid'),
      ('amara.okafor@example.com', 15, 'shipped',    'paid'),
      ('sarah.chen@example.com',   12, 'delivered',  'paid'),
      ('lucas.moreau@example.com', 10, 'delivered',  'paid'),
      ('priya.sharma@example.com',  8, 'processing', 'paid'),
      ('tom.becker@example.com',    6, 'processing', 'paid'),
      ('marcus.reed@example.com',   5, 'shipped',    'paid'),
      ('amara.okafor@example.com',  4, 'pending',    'paid'),
      ('lucas.moreau@example.com',  3, 'pending',    'paid'),
      ('priya.sharma@example.com',  2, 'pending',    'paid'),
      ('tom.becker@example.com',    1, 'cancelled',  'refunded'),
      ('sarah.chen@example.com',    0, 'pending',    'paid')
    ) as t(email, days_ago, status, payment)
  loop
    select p.id, coalesce(p.shipping_address, '') into uid, addr
      from public.profiles p
     where p.email = o.email;

    if uid is null then
      continue;
    end if;

    oid := md5('demo-order:' || o.email || ':' || o.days_ago)::uuid;

    if exists (select 1 from public.orders where id = oid) then
      continue;
    end if;

    insert into public.orders (id, user_id, total_amount, shipping_address, status, payment_status, created_at)
    values (
      oid,
      uid,
      0,
      addr,
      o.status::public.order_status_type,
      o.payment::public.payment_status_type,
      date_trunc('day', now()) - (o.days_ago || ' days')::interval + interval '11 hours'
    );

    total := 0;

    for it in
      select * from (values
        ('sarah.chen@example.com',   21, 'organic-cotton-crew-tee', 2),
        ('sarah.chen@example.com',   21, 'canvas-daypack', 1),
        ('marcus.reed@example.com',  18, 'heritage-leather-jacket', 1),
        ('marcus.reed@example.com',  18, 'essential-tee-3-pack', 1),
        ('amara.okafor@example.com', 15, 'silk-blend-camisole', 1),
        ('amara.okafor@example.com', 15, 'pleated-midi-skirt', 2),
        ('sarah.chen@example.com',   12, 'minimal-steel-watch', 1),
        ('lucas.moreau@example.com', 10, 'washed-denim-jacket', 1),
        ('lucas.moreau@example.com', 10, 'slim-fit-chino', 2),
        ('priya.sharma@example.com',  8, 'tailored-wool-coat', 1),
        ('priya.sharma@example.com',  8, 'cashmere-vneck-sweater', 1),
        ('tom.becker@example.com',    6, 'court-leather-sneaker', 2),
        ('tom.becker@example.com',    6, 'cotton-twill-cap', 1),
        ('marcus.reed@example.com',   5, 'oxford-button-down', 3),
        ('amara.okafor@example.com',  4, 'relaxed-linen-shirt', 1),
        ('amara.okafor@example.com',  4, 'acetate-sunglasses', 1),
        ('lucas.moreau@example.com',  3, 'everyday-crewneck-sweater', 1),
        ('lucas.moreau@example.com',  3, 'leather-weekender-bag', 1),
        ('priya.sharma@example.com',  2, 'high-rise-straight-jean', 2),
        ('priya.sharma@example.com',  2, 'studio-wrap-dress', 1),
        ('tom.becker@example.com',    1, 'heritage-leather-jacket', 1),
        ('sarah.chen@example.com',    0, 'organic-cotton-crew-tee', 3),
        ('sarah.chen@example.com',    0, 'cotton-twill-cap', 1)
      ) as x(email, days_ago, slug, qty)
      where x.email = o.email and x.days_ago = o.days_ago
    loop
      insert into public.order_items (id, order_id, product_id, quantity, unit_price)
      select
        md5('demo-item:' || oid::text || ':' || p.slug)::uuid,
        oid,
        p.id,
        it.qty,
        p.price
      from public.products p
      where p.slug = it.slug
      on conflict (id) do nothing;

      total := coalesce(total, 0)
        + coalesce(
            (select p.price from public.products p where p.slug = it.slug),
            0
          ) * it.qty;
    end loop;

    update public.orders set total_amount = total where id = oid;
  end loop;
end $$;

-- ------------------------------------------------------------
-- 4. A couple of abandoned carts
-- ------------------------------------------------------------
insert into public.cart_items (id, user_id, product_id, quantity)
select
  md5('demo-cart:' || u.email || ':' || p.slug)::uuid,
  u.id,
  p.id,
  v.qty
from (values
  ('marcus.reed@example.com',  'washed-denim-jacket', 1),
  ('marcus.reed@example.com',  'cotton-twill-cap', 2),
  ('amara.okafor@example.com', 'cashmere-vneck-sweater', 1),
  ('lucas.moreau@example.com', 'court-leather-sneaker', 1)
) as v(email, slug, qty)
join auth.users u on u.email = v.email
join public.products p on p.slug = v.slug
where not exists (
  select 1 from public.cart_items ci
  where ci.id = md5('demo-cart:' || v.email || ':' || v.slug)::uuid
)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 5. Summary
-- ------------------------------------------------------------
select
  (select count(*) from public.products)   as products,
  (select count(*) from public.profiles)   as profiles,
  (select count(*) from public.orders)     as orders,
  (select count(*) from public.order_items) as order_items,
  (select count(*) from public.cart_items) as cart_items;
