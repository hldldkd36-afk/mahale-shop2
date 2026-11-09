-- لوازم جانبی محله | PostgreSQL / Supabase
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price bigint not null check (price >= 0),
  compare_price bigint check (compare_price is null or compare_price >= price),
  image_url text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  image_url text not null default '',
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  phone text not null,
  address text not null,
  note text not null default '',
  subtotal bigint not null check (subtotal >= 0),
  total bigint not null check (total >= 0),
  payment_method text not null default 'test',
  payment_status text not null default 'not_paid',
  status text not null default 'new'
    check (status in ('new','confirmed','preparing','shipped','completed','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price bigint not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total bigint not null check (line_total >= 0)
);

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text not null default '',
  image_url text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_active_idx on public.products(is_active);
create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists posts_created_idx on public.posts(created_at desc);

-- ساخت پروفایل خودکار هنگام ثبت‌نام
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name',''))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.posts enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.banners enable row level security;
alter table public.site_settings enable row level security;

-- نقش مدیر از پروفایل خوانده می‌شود؛ نقش را فقط مدیر/سرویس می‌تواند تغییر دهد.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy "public read categories" on public.categories for select using (true);
create policy "public read active products" on public.products for select using (is_active = true or public.is_admin());
create policy "public read published posts" on public.posts for select using (published = true or public.is_admin());
create policy "public read active banners" on public.banners for select using (active = true or public.is_admin());
create policy "admin manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage posts" on public.posts for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage banners" on public.banners for all using (public.is_admin()) with check (public.is_admin());
create policy "admin read profiles" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "admin update profiles" on public.profiles for update using (public.is_admin()) with check (public.is_admin());
create policy "customer read own orders" on public.orders for select using (customer_id = auth.uid() or public.is_admin());
create policy "admin manage orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());
create policy "customer read own order items" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or public.is_admin()))
);
create policy "admin manage order items" on public.order_items for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage settings" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "public read settings" on public.site_settings for select using (true);

-- هیچ policy برای درج مستقیم سفارش از anon تعریف نشده؛ ثبت سفارش فقط از API سرور انجام می‌شود.
