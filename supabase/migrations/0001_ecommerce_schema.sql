-- 0001_ecommerce_schema.sql
-- Foundational schema for Evolvencia Solutions commerce experience

-- Extensions -----------------------------------------------------------------
create extension if not exists pgcrypto with schema public;
create extension if not exists "uuid-ossp" with schema public;

-- Utility tables and helpers --------------------------------------------------
create table if not exists app_user_roles (
  user_id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('admin', 'customer')),
  created_at timestamptz not null default timezone('utc', now())
);

comment on table app_user_roles is 'Maps Supabase auth users to application roles used for authorization.';

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
select exists (
  select 1
  from app_user_roles r
  where r.user_id = auth.uid()
    and r.role = 'admin'
);
$$;

comment on function public.is_admin is 'Returns true when the current authenticated user has the admin role.';

create or replace function public.is_customer()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
select exists (
  select 1
  from app_user_roles r
  where r.user_id = auth.uid()
    and r.role in ('customer', 'admin')
);
$$;

comment on function public.is_customer is 'Returns true when the current authenticated user is a customer (admins are also treated as customers).';

-- Catalog ---------------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'USD',
  sku text,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  inventory_count integer not null default 0 check (inventory_count >= 0),
  attributes jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  bucket text not null default 'product-assets',
  path text not null,
  media_type text not null,
  alt_text text,
  is_primary boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default timezone('utc', now())
);

-- Customers & Orders ----------------------------------------------------------
create table if not exists customers (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  phone text,
  marketing_consent boolean not null default false,
  address jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.ensure_customer_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into customers (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do update set email = excluded.email;
  insert into app_user_roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.ensure_customer_profile();
  end if;
end $$;


create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'processing', 'fulfilled', 'cancelled', 'refunded')),
  total_cents integer not null default 0,
  currency text not null default 'USD',
  shipping_address jsonb,
  billing_address jsonb,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  placed_at timestamptz not null default timezone('utc', now()),
  fulfilled_at timestamptz,
  cancelled_at timestamptz
);

create table if not exists order_items (
  id bigserial primary key,
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  subtotal_cents integer generated always as (quantity * unit_price_cents) stored,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists inventory_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  quantity_delta integer not null,
  reason text,
  context jsonb not null default '{}'::jsonb,
  resulting_quantity integer not null,
  acted_by uuid references auth.users,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists admin_audit_logs (
  id bigserial primary key,
  actor uuid references auth.users,
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

-- Row Level Security ----------------------------------------------------------
alter table app_user_roles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table media enable row level security;
alter table settings enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table inventory_events enable row level security;
alter table admin_audit_logs enable row level security;

-- app_user_roles policies
create policy "Users can view own role" on app_user_roles
  for select using (auth.uid() = user_id);

create policy "Admins manage roles" on app_user_roles
  using (public.is_admin())
  with check (public.is_admin());

-- categories policies
create policy "Public categories read" on categories
  for select using (true);

create policy "Admin manage categories" on categories
  using (public.is_admin())
  with check (public.is_admin());

-- products policies
create policy "Public products read" on products
  for select using (status = 'active' or public.is_admin());

create policy "Admins manage products" on products
  using (public.is_admin())
  with check (public.is_admin());

-- media policies
create policy "Public media read" on media
  for select using (true);

create policy "Admins manage media" on media
  using (public.is_admin())
  with check (public.is_admin());

-- settings policies
create policy "Admins read settings" on settings
  for select using (public.is_admin());

create policy "Admins manage settings" on settings
  using (public.is_admin())
  with check (public.is_admin());

-- customers policies
create policy "Customer can view self" on customers
  for select using (auth.uid() = id or public.is_admin());

create policy "Customer can update self" on customers
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins manage customers" on customers
  using (public.is_admin())
  with check (public.is_admin());

-- orders policies
create policy "Customer view own orders" on orders
  for select using (auth.uid() = customer_id or public.is_admin());

create policy "Customer manage own orders" on orders
  for update using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);

create policy "Admins manage orders" on orders
  using (public.is_admin())
  with check (public.is_admin());

-- order_items policies
create policy "Customer view order items" on order_items
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and (o.customer_id = auth.uid() or public.is_admin())
    )
  );

create policy "Admins manage order items" on order_items
  using (public.is_admin())
  with check (public.is_admin());

-- inventory_events policies
create policy "Admins read inventory events" on inventory_events
  for select using (public.is_admin());

create policy "Admins insert inventory events" on inventory_events
  for insert with check (public.is_admin());

-- admin_audit_logs policies
create policy "Admins read audit logs" on admin_audit_logs
  for select using (public.is_admin());

create policy "Admins insert audit logs" on admin_audit_logs
  for insert with check (public.is_admin());

-- Functions / RPCs ------------------------------------------------------------
create or replace function public.admin_adjust_inventory(
  p_product_id uuid,
  p_quantity_delta integer,
  p_reason text default null,
  p_context jsonb default '{}'::jsonb
)
returns products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product products;
begin
  if not public.is_admin() then
    raise exception 'You must be an admin to adjust inventory';
  end if;

  update products
     set inventory_count = greatest(0, inventory_count + p_quantity_delta),
         updated_at = timezone('utc', now())
   where id = p_product_id
  returning * into v_product;

  if not found then
    raise exception 'Product not found: %', p_product_id;
  end if;

  insert into inventory_events (product_id, quantity_delta, reason, context, resulting_quantity, acted_by)
  values (p_product_id, p_quantity_delta, p_reason, coalesce(p_context, '{}'::jsonb), v_product.inventory_count, auth.uid());

  insert into admin_audit_logs (actor, action, target_table, target_id, metadata)
  values (auth.uid(), 'inventory.adjust', 'products', p_product_id,
          jsonb_build_object('delta', p_quantity_delta, 'reason', p_reason, 'context', coalesce(p_context, '{}'::jsonb)));

  return v_product;
end;
$$;

create or replace function public.admin_update_order_status(
  p_order_id uuid,
  p_status text,
  p_notes text default null
)
returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders;
  v_now timestamptz := timezone('utc', now());
begin
  if not public.is_admin() then
    raise exception 'You must be an admin to update orders';
  end if;

  if p_status not in ('pending', 'processing', 'fulfilled', 'cancelled', 'refunded') then
    raise exception 'Invalid status value: %', p_status;
  end if;

  update orders
     set status = p_status,
         fulfilled_at = case when p_status = 'fulfilled' then v_now else fulfilled_at end,
         cancelled_at = case when p_status = 'cancelled' then v_now else cancelled_at end,
         notes = coalesce(p_notes, notes)
   where id = p_order_id
  returning * into v_order;

  if not found then
    raise exception 'Order not found: %', p_order_id;
  end if;

  insert into admin_audit_logs (actor, action, target_table, target_id, metadata)
  values (auth.uid(), 'orders.status_change', 'orders', p_order_id,
          jsonb_build_object('status', p_status, 'notes', p_notes));

  return v_order;
end;
$$;

create or replace function public.admin_register_media_asset(
  p_product_id uuid,
  p_bucket text,
  p_path text,
  p_media_type text,
  p_alt_text text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns media
language plpgsql
security definer
set search_path = public
as $$
declare
  v_media media;
begin
  if not public.is_admin() then
    raise exception 'You must be an admin to register media';
  end if;

  insert into media (product_id, bucket, path, media_type, alt_text, metadata, is_primary)
  values (p_product_id, p_bucket, p_path, p_media_type, p_alt_text, coalesce(p_metadata, '{}'::jsonb), false)
  returning * into v_media;

  insert into admin_audit_logs (actor, action, target_table, target_id, metadata)
  values (auth.uid(), 'media.register', 'media', v_media.id,
          jsonb_build_object('product_id', p_product_id, 'path', p_path, 'bucket', p_bucket));

  return v_media;
end;
$$;

-- Views -----------------------------------------------------------------------
create or replace view admin_order_summary as
select
  o.id,
  o.status,
  o.total_cents,
  o.currency,
  o.placed_at,
  o.fulfilled_at,
  c.email,
  c.full_name,
  count(oi.id) as item_count
from orders o
join customers c on c.id = o.customer_id
left join order_items oi on oi.order_id = o.id
group by o.id, c.email, c.full_name;

grants ------------------------------------------------------------------------
grant usage on schema public to authenticated, anon;

grant select on admin_order_summary to authenticated;

-- Trigger helpers -------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_timestamp_categories'
  ) then
    create trigger set_timestamp_categories
      before update on categories
      for each row execute function public.set_updated_at();
  end if;
  if not exists (
    select 1 from pg_trigger where tgname = 'set_timestamp_products'
  ) then
    create trigger set_timestamp_products
      before update on products
      for each row execute function public.set_updated_at();
  end if;
  if not exists (
    select 1 from pg_trigger where tgname = 'set_timestamp_customers'
  ) then
    create trigger set_timestamp_customers
      before update on customers
      for each row execute function public.set_updated_at();
  end if;
  if not exists (
    select 1 from pg_trigger where tgname = 'set_timestamp_settings'
  ) then
    create trigger set_timestamp_settings
      before update on settings
      for each row execute function public.set_updated_at();
  end if;
end $$;

