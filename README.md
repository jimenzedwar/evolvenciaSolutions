# CozyCommerce Starter

This repository bootstraps a Vite + React + TypeScript playground for experimenting with the CozyCommerce demo look and feel. Supabase, React Router, and Tailwind CSS are prewired so you can begin stitching together product, cart, and auth experiences immediately.

## Prerequisites

- Node.js 20+ (the project was created with Node 22)
- npm 10+
- A Supabase project with access to the project URL and anon key

## Environment variables

Copy `.env.example` to `.env.local` (or `.env`) and provide your Supabase credentials:

```
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

These variables are consumed by `src/supabaseClient.ts` to configure the client SDK.

## Getting started

Install dependencies and start the Vite dev server:

```bash
npm install
npm run dev
```

By default the app runs at [http://localhost:5173](http://localhost:5173). The CozyCommerce-inspired landing page demonstrates Tailwind theming and React Router navigation.

## Available scripts

- `npm run dev` – start Vite in development mode with hot module replacement.
- `npm run build` – type-check the project and create an optimized production build in `dist/`.
- `npm run preview` – preview the production build locally after running `npm run build`.

## Project structure

```
.
├── index.html
├── package.json
├── public/
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── supabaseClient.ts
├── tailwind.config.ts
├── tsconfig.app.json
├── tsconfig.json
└── tsconfig.node.json
```

Use the `supabase` instance exported from `src/supabaseClient.ts` inside your React components or data loaders to interact with your backend.

## Database schema & migrations

The `supabase/migrations/0001_ecommerce_schema.sql` migration provisions the full commerce schema, including:

- Catalog entities (`categories`, `products`, `media`, `settings`).
- Customer lifecycle tables (`customers`, `orders`, `order_items`).
- Operational helpers (`inventory_events`, `admin_audit_logs`).
- Role-based access control (`app_user_roles` with helper functions `is_admin()` / `is_customer()`).

Row-level security (RLS) is enabled everywhere. Policies ensure shoppers can read public data and access only their own records while administrators (members of `app_user_roles` with role `admin`) receive full CRUD rights. Three RPC helpers are included for complex workflows:

- `admin_adjust_inventory` – adjusts stock levels, persists an inventory event, and writes to the audit log.
- `admin_update_order_status` – transitions an order to a new status, stamping fulfillment/cancellation timestamps and logging the action.
- `admin_register_media_asset` – stores metadata for files uploaded through the admin console and logs the change.

The `supabase/functions/admin-upload-media` edge function issues signed upload URLs for Supabase Storage, verifies that the caller is an admin, and invokes `admin_register_media_asset` for bookkeeping.

## Authentication & roles

Email-based sign-in (password or OTP) is supported out of the box by enabling the **Email** provider in the Supabase dashboard (`Authentication → Providers`). A trigger created in the migration keeps the `customers` table synchronized with new `auth.users` entries and ensures every sign-up gets at least the `customer` role in `app_user_roles`.

To promote a user to an administrator run the following SQL (replace the `user_id` with a valid UUID from `auth.users`):

```sql
insert into app_user_roles (user_id, role)
values ('00000000-0000-0000-0000-000000000000', 'admin')
on conflict (user_id) do update set role = excluded.role;
```

## Admin console

Navigate to `/admin` after signing in. Routes are protected by Supabase session checks and the `app_user_roles` table:

- **Catalog** – manage products/categories, perform inventory adjustments via the `admin_adjust_inventory` RPC, and toggle product statuses.
- **Orders** – monitor recent orders, update fulfillment states (calls `admin_update_order_status`), and leave audit-trailed notes.
- **Analytics** – visualize 30-day revenue, review recent inventory adjustments, and inspect audit log entries.
- **Content** – edit JSON storefront settings, request media upload URLs through the `admin-upload-media` edge function, and review recent assets.

Every critical action (inventory adjustments, status changes, settings updates, media uploads) asks for confirmation before calling the backend and results in an `admin_audit_logs` entry.

## Seeding demo data

Load `supabase/seeds/demo_seed.sql` to quickly populate the catalog:

```bash
supabase db remote commit supabase/seeds/demo_seed.sql
# or, when using the local CLI:
supabase db execute --file supabase/seeds/demo_seed.sql
```

The seed file creates sample categories, products, settings, and inventory snapshots so the storefront and admin dashboards have realistic data.
