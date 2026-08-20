-- Fertigo ERP Schema
-- Clean production schema for Supabase Postgres SQL Editor

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

-- 3. Companies / Manufacturers / Suppliers Table
create table if not exists public.companies (
  id uuid not null default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,                       -- e.g., 'Gentech', 'IFFCO', 'Bayer'
  contact_person text null,                -- e.g., 'Srinivas Rao (Sales Officer)'
  phone text null,                         -- e.g., '9876543210'
  account_number text null,                -- Bank Account Number for payments
  bank_name text null,                     -- e.g., 'State Bank of India'
  ifsc_code text null,                     -- e.g., 'SBIN0001234'
  gstin text null,                         -- Supplier GSTIN
  address text null,                       -- Distributor Address / Branch
  created_at timestamp with time zone not null default now(),
  constraint companies_pkey primary key (id),
  constraint companies_shop_name_unique unique (shop_id, name)
);

create index if not exists idx_companies_shop_id on public.companies(shop_id);

-- 4. Products Table (Parent Product)
create table if not exists public.products (
  id uuid not null default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  company text null,                        -- Company name text
  company_id uuid null references public.companies(id) on delete set null,
  category_id uuid null references public.categories(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  constraint products_pkey primary key (id)
);

create index if not exists idx_products_shop_id on public.products(shop_id);
create index if not exists idx_products_company_id on public.products(company_id);
create index if not exists idx_products_shop_name on public.products(shop_id, name);

-- 5. Product Variants Table (Pack Sizes & Stock)
create table if not exists public.product_variants (
  id uuid not null default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_name text not null,       -- e.g., '500 ml', '1 L', '45 kg Bag'
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

-- 6. Customers / Farmers Table
create table if not exists public.customers (
  id uuid not null default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  mobile text null,
  village text null,
  created_at timestamp with time zone not null default now(),
  constraint customers_pkey primary key (id)
);

create index if not exists idx_customers_shop_id on public.customers(shop_id);

-- 7. Sales / Bills Table
create table if not exists public.sales (
  id uuid not null default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  bill_number text not null,                -- e.g. 'BILL-2026-0001'
  customer_name text not null,              -- e.g. 'Lade Sai Teja'
  customer_mobile text null,                -- e.g. '9912313633'
  total_amount numeric(12, 2) not null default 0.00,
  discount_amount numeric(12, 2) not null default 0.00,
  net_amount numeric(12, 2) not null default 0.00,
  payment_mode text not null default 'CASH', -- 'CASH', 'UPI', 'CREDIT'
  created_at timestamp with time zone not null default now(),
  constraint sales_pkey primary key (id)
);

create index if not exists idx_sales_shop_id on public.sales(shop_id);

-- 8. Sale Line Items Table
create table if not exists public.sale_items (
  id uuid not null default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid null references public.products(id) on delete set null,
  variant_id uuid null references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_name text not null,
  quantity numeric(12, 2) not null default 1,
  unit_price numeric(12, 2) not null default 0.00,
  total_price numeric(12, 2) not null default 0.00,
  created_at timestamp with time zone not null default now(),
  constraint sale_items_pkey primary key (id)
);

create index if not exists idx_sale_items_sale_id on public.sale_items(sale_id);

-- 8. Farmers Table
create table if not exists public.farmers (
  id uuid not null default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  mobile text null,
  aadhar_number text null,          -- Full 12-digit Aadhaar number
  village text null,
  land_acres numeric(6, 2) null,
  crop_types text[] null,           -- e.g. ARRAY['Rice', 'Cotton', 'Maize']
  notes text null,
  katha_balance numeric(12, 2) not null default 0.00,  -- Running Katha balance
  created_at timestamp with time zone not null default now(),
  constraint farmers_pkey primary key (id)
);

create index if not exists idx_farmers_shop_id on public.farmers(shop_id);
create index if not exists idx_farmers_mobile on public.farmers(mobile);

-- 9. Katha Payments Table (farmer pays back their running balance)
create table if not exists public.katha_payments (
  id uuid not null default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  farmer_id uuid not null references public.farmers(id) on delete cascade,
  amount numeric(12, 2) not null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  constraint katha_payments_pkey primary key (id)
);

create index if not exists idx_katha_payments_farmer_id on public.katha_payments(farmer_id);

-- Add farmer_id to sales table (link a sale to a registered farmer)
alter table public.sales
  add column if not exists farmer_id uuid null references public.farmers(id) on delete set null;

-- Enable Row Level Security (RLS)
alter table public.shops enable row level security;
alter table public.categories enable row level security;
alter table public.companies enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.farmers enable row level security;
alter table public.katha_payments enable row level security;

-- Permissive RLS Policies
create policy "Allow full access to shops" on public.shops for all using (true) with check (true);
create policy "Allow full access to categories" on public.categories for all using (true) with check (true);
create policy "Allow full access to companies" on public.companies for all using (true) with check (true);
create policy "Allow full access to products" on public.products for all using (true) with check (true);
create policy "Allow full access to product_variants" on public.product_variants for all using (true) with check (true);
create policy "Allow full access to customers" on public.customers for all using (true) with check (true);
create policy "Allow full access to sales" on public.sales for all using (true) with check (true);
create policy "Allow full access to sale_items" on public.sale_items for all using (true) with check (true);
create policy "Allow full access to farmers" on public.farmers for all using (true) with check (true);
create policy "Allow full access to katha_payments" on public.katha_payments for all using (true) with check (true);
