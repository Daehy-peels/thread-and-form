# Thread & Form — Clothing Store

A full-stack e-commerce web app built for a Business IT college assignment. It covers
product browsing, a shopping cart, authentication, a simulated checkout, and an admin
dashboard — with a Postgres backend secured by Row Level Security.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 ·
Supabase (Postgres + Auth + RLS)

> **Note for graders:** this is a student project. Payment at checkout is **simulated** —
> no real charges are made.

---

## 1. Prerequisites

Install these on your PC before starting:

- **Node.js 18.18 or newer** (20+ recommended) — includes `npm`.
  Download from <https://nodejs.org>. Verify with `node -v` and `npm -v`.
- A **Supabase account** (free tier is fine) — only needed if you want to run the project
  against your own database. See [option B](#option-b-use-your-own-supabase-project) below.
  <https://supabase.com>

No database needs to be installed locally — Supabase is a hosted Postgres service.

---

## 2. Get the code running

From the project folder:

```bash
# 1. Install dependencies
npm install

# 2. Create the environment file (see section 3)
#    then start the dev server
npm run dev
```

Open <http://localhost:3000> in your browser.

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server (hot reload) on port 3000 |
| `npm run build` | Type-check, lint, and build the production bundle |
| `npm start` | Serve the production build (run `npm run build` first) |
| `npm run lint` | Run ESLint |

---

## 3. Configure the environment

The app talks to Supabase using two **public** values (these are safe to expose in the
browser — that is exactly what Supabase's publishable/anon key is for; RLS protects the data).

Create a file named `.env.local` in the project root:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-or-publishable-key
```

You have two ways to fill these in:

### Option A — Use the student's existing Supabase project (quickest)

If `.env.local` was included with the submission, the values are already filled in and you
can skip straight to `npm run dev`. Nothing else to do.

> `.env.local` is listed in `.gitignore`, so it is not committed to version control. If it
> was not included with the files you received, ask the student for the two values, or use
> Option B.

### Option B — Use your own Supabase project

1. Go to <https://supabase.com>, sign in, and click **New project**. Choose a name,
   a database password, and a region. Wait for it to finish provisioning.
2. Copy the two values from **Project Settings → API**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / publishable key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Put them in `.env.local` as shown above.
4. **Disable email confirmation** so demo sign-ups work instantly:
   **Authentication → Sign In / Providers → Email → turn OFF "Confirm email" → Save.**
   (The app treats a `signUp` call as an immediate login, which relies on this.)
5. Set up the database — see [section 4](#4-database-setup-option-b-only).

---

## 4. Database setup (Option B only)

If you are using your own Supabase project, you must create the schema. Open
**SQL Editor** in the Supabase dashboard, and run the scripts in the `supabase/` folder
**in this exact order** (paste each file's contents and click Run):

| Order | File | Purpose | Required? |
| --- | --- | --- | --- |
| 1 | `supabase/schema.sql` | Enums, tables, RLS policies, `handle_new_user` trigger, starter products | **Yes** |
| 2 | `supabase/place_order.sql` | `place_order()` RPC — atomic, stock-safe checkout | **Yes** (checkout fails without it) |
| 3 | `supabase/admin_setup.sql` | `is_admin()` helper + admin RLS policies | **Yes** (admin writes fail without it) |
| 4 | `supabase/seed_realistic_data.sql` | Demo customers, ~21 products, orders, cart items | Optional (makes the dashboard look realistic) |

All four scripts are **idempotent** — safe to run more than once.

> If you are using **Option A** (the student's project), the database is already set up.
> Skip this section.

### Promote an admin account

The admin dashboard is gated behind a `role = 'admin'` on the user's profile. After signing
up a normal account through the app (or seeding), promote it in the SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'your-email@example.com';
```

Then sign in to the app with that account and open **/admin** (the "Admin" link appears in
the navbar).

---

## 5. Demo accounts

If you ran `seed_realistic_data.sql`, these customer accounts exist (password for all of
them is **`password123`**):

| Email | Name |
| --- | --- |
| `sarah.chen@example.com` | Sarah Chen |
| `marcus.reed@example.com` | Marcus Reed |
| `amara.okafor@example.com` | Amara Okafor |
| `lucas.moreau@example.com` | Lucas Moreau |
| `priya.sharma@example.com` | Priya Sharma |
| `tom.becker@example.com` | Tom Becker |

You can also create your own account on the sign-up page (any email works when
"Confirm email" is disabled).

---

## 6. Features & routes

| Route | Description |
| --- | --- |
| `/` | Home — hero, featured products, categories, perks |
| `/products` | Shop — search, sort, and category filter chips |
| `/products/[slug]` | Product detail page |
| `/cart` | Cart — quantity steppers, free-shipping progress bar, summary |
| `/checkout` | Shipping + (simulated) payment → creates an order |
| `/auth` | Sign in / sign up |
| `/admin` | Admin dashboard — overview stats, products, orders, categories (admin only) |

Highlights: responsive layout for mobile/tablet/desktop, hover and transition polish,
skeleton loading states, and `prefers-reduced-motion` support.

---

## 7. Project structure

```
clothing-store/
├─ docs/                     # Written deliverables
│  ├─ project-structure.md   # Folder & project structure (text tree)
│  └─ database-schema.md     # Database & backend schema (mermaid ERD + tables)
├─ supabase/                 # SQL scripts (run in order — see section 4)
│  ├─ schema.sql
│  ├─ place_order.sql
│  ├─ admin_setup.sql
│  └─ seed_realistic_data.sql
├─ src/
│  ├─ app/                   # App Router pages & layout (routes above)
│  ├─ components/            # Navbar, Footer, ProductCard, SiteChrome, …
│  ├─ lib/
│  │  ├─ supabase/           # client.ts, server.ts, middleware.ts
│  │  ├─ cart.ts             # cart helpers, shipping rules
│  │  ├─ types.ts            # re-exports from types/database.types.ts
│  │  └─ types/
│  │     └─ database.types.ts  # generated-style Supabase Database types
│  └─ proxy.ts               # Next 16 middleware (session refresh)
├─ public/                   # logo.png and static assets
├─ .env.local                # your Supabase URL + key (not committed)
├─ next.config.ts
├─ package.json
└─ tsconfig.json
```

For the two written assignment deliverables, see:

- **Folder & Project Structure** → [`docs/project-structure.md`](docs/project-structure.md)
- **Database & Backend Schema** → [`docs/database-schema.md`](docs/database-schema.md)
  (with the mermaid ER diagram) and the canonical DDL in [`supabase/schema.sql`](supabase/schema.sql)
  and TypeScript types in [`src/lib/types/database.types.ts`](src/lib/types/database.types.ts).

---

## 8. Troubleshooting

| Symptom | Fix |
| --- | --- |
| Clicks seem to do nothing / page looks stale after an edit | Hard reload the browser (`Ctrl+Shift+R` on Windows, `Cmd+Shift+R` on Mac). Dev-server HMR can go stale. |
| "invalid login credentials" on sign-up | Make sure **"Confirm email" is disabled** in Supabase → Authentication → Email. |
| Checkout errors with something like `place_order does not exist` | Run `supabase/place_order.sql` (section 4, step 2). |
| Admin page says "Access denied" | Your account isn't admin — run the `update public.profiles set role='admin' …` query (section 4). |
| Admin writes (add/edit product, change order status) fail | Run `supabase/admin_setup.sql` (section 4, step 3). |
| Dashboard looks empty | Run the optional `supabase/seed_realistic_data.sql` (section 4, step 4). |
| Port 3000 already in use | Stop the other process, or run `npm run dev -- -p 3001`. |

---

## 9. Security model (brief)

All tables have **Row Level Security** enabled. Customers can only read/write their own
`profiles`, `orders`, `order_items`, and `cart_items`; `products` and `categories` are
publicly readable. Admin-only access is enforced by a `security definer` `is_admin()`
function plus admin policies. Checkout runs through the `security definer` `place_order()`
function so stock is decremented and orders created atomically — the client cannot write
to `orders` or decrement stock directly.

See [`docs/database-schema.md`](docs/database-schema.md) for the full RLS matrix.
