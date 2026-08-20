-- Fertigo ERP Phase 1 Schema
-- Clean production schema for Supabase Postgres SQL Editor (No Dummy Seed Data)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Shops Table
create table if not exists public.shops (
  id uuid not null default gen_random_uuid(),
  user_id uuid null,                  -- Supabase Auth User ID or owner ID
  name text not null,
  gst_number text null,
  phone text null,
  email text null,
  address text null,
  village text null,
  district text null,
  state text null,
  pincode text null,
  created_at timestamp with time zone not null default now(),
  constraint shops_pkey primary key (id)
);

create index if not exists idx_shops_user_id on public.shops(user_id);

-- 2. Categories Table
create table if not exists public.categories (
  id uuid not null default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone not null default now(),
  constraint categories_pkey primary key (id),
  constraint categories_shop_name_unique unique (shop_id, name)
);

create index if not exists idx_categories_shop_id on public.categories(shop_id);

-- 3. Products Table (Parent Product)
create table if not exists public.products (
  id uuid not null default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  company text null,
  category_id uuid null references public.categories(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  constraint products_pkey primary key (id)
);

create index if not exists idx_products_shop_id on public.products(shop_id);
create index if not exists idx_products_shop_name on public.products(shop_id, name);

-- 4. Product Variants Table (Pack Sizes & Stock)
create table if not exists public.product_variants (
  id uuid not null default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_name text not null,       -- e.g., '500 ml', '1 L', '50 kg Bag'
  pack_quantity numeric null,       -- e.g., 500
  unit text null,                   -- e.g., 'ml', 'L', 'g', 'kg', 'piece'
  cost_price numeric(12, 2) not null default 0.00,
  selling_price numeric(12, 2) not null default 0.00,
  stock_quantity numeric(12, 2) not null default 0.00,
  expiry_date date null,             -- Expiry date for pesticide/fertilizer batch
  created_at timestamp with time zone not null default now(),
  constraint product_variants_pkey primary key (id),
  constraint variants_product_name_unique unique (product_id, variant_name)
);

create index if not exists idx_variants_product_id on public.product_variants(product_id);

-- Enable Row Level Security (RLS) or public access for custom auth
alter table public.shops enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;

-- Permissive RLS Policies for Supabase anon/authenticated roles
create policy "Allow full access to shops" on public.shops for all using (true) with check (true);
create policy "Allow full access to categories" on public.categories for all using (true) with check (true);
create policy "Allow full access to products" on public.products for all using (true) with check (true);
create policy "Allow full access to product_variants" on public.product_variants for all using (true) with check (true);

