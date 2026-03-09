create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamp with time zone default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('Entrada', 'Saída')),
  created_at timestamp with time zone default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  description text not null,
  type text not null check (type in ('Entrada', 'Saída')),
  amount numeric(12,2) not null,
  transaction_date date not null,
  payment_source text default 'Conta',
  is_fixed boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

create policy "users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "users can view own categories" on public.categories for select using (auth.uid() = user_id);
create policy "users can insert own categories" on public.categories for insert with check (auth.uid() = user_id);
create policy "users can update own categories" on public.categories for update using (auth.uid() = user_id);
create policy "users can delete own categories" on public.categories for delete using (auth.uid() = user_id);

create policy "users can view own transactions" on public.transactions for select using (auth.uid() = user_id);
create policy "users can insert own transactions" on public.transactions for insert with check (auth.uid() = user_id);
create policy "users can update own transactions" on public.transactions for update using (auth.uid() = user_id);
create policy "users can delete own transactions" on public.transactions for delete using (auth.uid() = user_id);
