-- PRINTFAS Express Printing - Supabase schema
-- Run this in the Supabase SQL editor or with the Supabase CLI.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_role') then
    create type public.profile_role as enum ('admin', 'client');
  end if;
  if not exists (select 1 from pg_type where typname = 'upload_channel') then
    create type public.upload_channel as enum ('web', 'email', 'whatsapp');
  end if;
  if not exists (select 1 from pg_type where typname = 'delivery_option') then
    create type public.delivery_option as enum ('pickup', 'delivery');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('pending', 'quoted', 'paid');
  end if;
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum ('received', 'processing', 'printing', 'ready', 'out_for_delivery', 'completed');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.profile_role not null default 'client',
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_ref text not null unique,
  customer_email text,
  customer_name text,
  service_type text not null,
  quantity integer not null default 1 check (quantity > 0),
  pages_per_document integer not null default 1 check (pages_per_document > 0),
  copies integer not null default 1 check (copies > 0),
  add_ons jsonb not null default '[]'::jsonb,
  customer_note text,
  is_custom_quote boolean not null default false,
  upload_channel public.upload_channel not null default 'web',
  file_path text,
  file_paths jsonb not null default '[]'::jsonb,
  files jsonb not null default '[]'::jsonb,
  proof_path text,
  resume_data jsonb,
  delivery_option public.delivery_option not null default 'pickup',
  delivery_address text,
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  amount numeric(12,2) not null default 0 check (amount >= 0),
  payment_status public.payment_status not null default 'pending',
  order_status public.order_status not null default 'received',
  downloaded_at timestamptz,
  created_at timestamptz not null default now(),
  constraint delivery_address_required check (
    delivery_option = 'pickup' or nullif(trim(delivery_address), '') is not null
  )
);

create table if not exists public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_role public.profile_role not null default 'admin',
  message text not null check (length(trim(message)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists orders_order_ref_idx on public.orders(order_ref);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists order_messages_order_id_idx on public.order_messages(order_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_messages enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create policy "Users can view their own profile"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "Admins can manage profiles"
on public.profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public can create print orders"
on public.orders for insert
to anon, authenticated
with check (true);

create policy "Admins can manage all orders"
on public.orders for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage order messages"
on public.order_messages for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
