-- PRINTFAS Express Printing - Supabase schema, RLS, and storage setup.
-- Run this in the Supabase SQL editor or through `supabase db push`.

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
  downloaded_at timestamptz default null,
  created_at timestamptz not null default now(),
  constraint delivery_address_required check (
    delivery_option = 'pickup'
    or nullif(trim(delivery_address), '') is not null
  )
);

alter table public.orders
  add column if not exists pages_per_document integer not null default 1 check (pages_per_document > 0),
  add column if not exists copies integer not null default 1 check (copies > 0),
  add column if not exists add_ons jsonb not null default '[]'::jsonb,
  add column if not exists customer_note text,
  add column if not exists file_paths jsonb not null default '[]'::jsonb,
  add column if not exists files jsonb not null default '[]'::jsonb,
  add column if not exists resume_data jsonb;

create table if not exists public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_role public.profile_role not null default 'admin',
  message text not null check (length(trim(message)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists orders_order_ref_idx on public.orders(order_ref);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_downloaded_at_idx on public.orders(downloaded_at) where downloaded_at is not null;
create index if not exists order_messages_order_id_idx on public.order_messages(order_id, created_at desc);

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

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_messages enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
on public.profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can create print orders" on public.orders;
create policy "Public can create print orders"
on public.orders for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can manage all orders" on public.orders;
create policy "Admins can manage all orders"
on public.orders for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage order messages" on public.order_messages;
create policy "Admins can manage order messages"
on public.order_messages for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.track_order(lookup_ref text)
returns table (
  order_ref text,
  service_type text,
  delivery_option public.delivery_option,
  payment_status public.payment_status,
  order_status public.order_status,
  downloaded_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    orders.order_ref,
    orders.service_type,
    orders.delivery_option,
    orders.payment_status,
    orders.order_status,
    orders.downloaded_at,
    orders.created_at
  from public.orders
  where upper(orders.order_ref) = upper(lookup_ref)
  limit 1;
$$;

grant execute on function public.track_order(text) to anon, authenticated;

create or replace function public.get_order_messages(lookup_ref text)
returns table (
  message text,
  sender_role public.profile_role,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    order_messages.message,
    order_messages.sender_role,
    order_messages.created_at
  from public.order_messages
  join public.orders on orders.id = order_messages.order_id
  where upper(orders.order_ref) = upper(lookup_ref)
  order by order_messages.created_at desc;
$$;

grant execute on function public.get_order_messages(text) to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'print-jobs',
  'print-jobs',
  false,
  26214400,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table storage.objects enable row level security;

drop policy if exists "Public can upload print job files" on storage.objects;
create policy "Public can upload print job files"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'print-jobs');

drop policy if exists "Public can upload payment proofs" on storage.objects;
create policy "Public can upload payment proofs"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'print-jobs' and name like 'proofs/%');

drop policy if exists "Admins can manage print job files" on storage.objects;
create policy "Admins can manage print job files"
on storage.objects for all
to authenticated
using (bucket_id = 'print-jobs' and public.is_admin())
with check (bucket_id = 'print-jobs' and public.is_admin());
