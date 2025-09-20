-- demo_seed.sql
-- Populates the Evolvencia Solutions schema with sample data for local testing.

insert into categories (id, name, slug, description, position)
values
  ('00000000-0000-0000-0000-000000000001', 'Wellness', 'wellness', 'Self-care essentials', 1),
  ('00000000-0000-0000-0000-000000000002', 'Home Office', 'home-office', 'Stylish productivity upgrades', 2)
on conflict (id) do nothing;

insert into products (id, category_id, name, slug, description, price_cents, currency, sku, status, inventory_count, attributes)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Aromatherapy Diffuser', 'aromatherapy-diffuser', 'Mood lighting diffuser with essential oil kit.', 8900, 'USD', 'AROMA-01', 'active', 120, '{"size": "Medium", "color": "Soft White"}'::jsonb),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000002', 'Ergonomic Desk Mat', 'ergonomic-desk-mat', 'Supports wrists during long sessions.', 4500, 'USD', 'DESKMAT-01', 'active', 75, '{"material": "Vegan leather"}'::jsonb)
on conflict (id) do nothing;

insert into settings (key, value, description)
values
  ('storefront.hero', '{"headline": "Refresh your daily rituals", "subheading": "Limited spring edition"}', 'Homepage hero block copy'),
  ('storefront.support_email', '{"address": "support@evolvencia.test"}', 'Primary support channel')
on conflict (key) do update set value = excluded.value, description = excluded.description;

-- Inventory snapshots for seeded products
insert into inventory_events (id, product_id, quantity_delta, reason, context, resulting_quantity, acted_by)
values
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000101', 120, 'Initial stock', '{"seed": true}'::jsonb, 120, null),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000102', 75, 'Initial stock', '{"seed": true}'::jsonb, 75, null);
