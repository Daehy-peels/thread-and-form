# Project structure

Thread & Form is a **Next.js 15 (App Router) + TypeScript** front end talking to a
**Supabase** backend (Postgres + Auth + Row Level Security) through
`@supabase/ssr`. There is no custom API layer: pages and server components query
Supabase directly, and RLS enforces per-user access in the database.

## Folder & file tree

```text
thread-form/
├── docs/                          # project documentation (this folder)
│   ├── project-structure.md
│   └── database-schema.md
│
├── supabase/                      # backend schema & migrations (SQL)
│   ├── schema.sql                 # canonical schema: enums, tables, RLS, trigger, seed
│   ├── place_order.sql            # atomic checkout RPC (order + stock + cart in one tx)
│   ├── admin_setup.sql            # is_admin() + admin write policies
│   └── seed_realistic_data.sql    # optional demo categories/products/orders
│
├── src/
│   ├── app/                       # App Router: routes, layout, global styles
│   │   ├── layout.tsx             # root layout: html/body, metadata, providers
│   │   ├── page.tsx               # route "/" — home / storefront landing
│   │   ├── globals.css            # Tailwind entry + CSS custom properties
│   │   ├── favicon.ico
│   │   └── products/
│   │       └── page.tsx           # route "/products" — product catalogue
│   │
│   ├── components/                # shared React components
│   │   ├── Navbar.tsx             # top navigation + cart link
│   │   ├── Footer.tsx             # site footer
│   │   ├── ProductCard.tsx        # product tile used by the catalogue
│   │   └── SiteChrome.tsx         # wraps routes with navbar + footer
│   │
│   ├── lib/                       # framework-agnostic helpers
│   │   ├── cart.ts                # cart maths (totals, quantities)
│   │   ├── types.ts               # public re-export of the row types
│   │   ├── types/
│   │   │   └── database.types.ts  # typed mirror of the Supabase schema
│   │   └── supabase/
│   │       ├── client.ts          # browser Supabase client
│   │       ├── server.ts          # server-side Supabase client (cookies)
│   │       └── middleware.ts      # session refresh on every request
│   │
│   └── proxy.ts                   # Next middleware entry (auth proxy)
│
├── tsconfig.json                  # TS config incl. the "@/*" path alias
└── package.json
```

## Route map

| Route        | File                     | Purpose                                        |
| ------------ | ------------------------ | ---------------------------------------------- |
| `/`          | `src/app/page.tsx`       | Storefront landing: hero + featured products   |
| `/products`  | `src/app/products/page.tsx` | Full product catalogue from `public.products` |

## Folder responsibilities

- **`src/app`** — one folder per route (App Router convention). Only route-level
  code lives here; shared UI is imported from `components`.
- **`src/components`** — presentational components. `SiteChrome` composes
  `Navbar` + `Footer` so routes stay one-liners.
- **`src/lib`** — code with no React dependency: cart maths, row types and the
  three Supabase client factories (browser / server / middleware).
- **`supabase`** — the backend, versioned as SQL. `schema.sql` is the reference
  copy of what was applied in the Supabase project; the other files are applied
  on top of it in order (see `docs/database-schema.md`).

## Conventions

- Path alias `@/*` → `src/*` (e.g. `import { ProductCard } from "@/components/ProductCard"`).
- Components are `PascalCase.tsx`; routes are `page.tsx` inside a kebab-case folder.
- Database row types live in **one** place (`src/lib/types/database.types.ts`)
  and are re-exported from `src/lib/types.ts`; call sites never redefine them.
- Money is stored as `numeric(10,2)` in Postgres and handled as `number` in TS.
