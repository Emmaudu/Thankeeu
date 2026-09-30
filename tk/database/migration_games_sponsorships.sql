-- Thankeeu Games sponsorships, rewards and player payout bank fields

alter table games_players
  add column if not exists bank_code text,
  add column if not exists bank_name text,
  add column if not exists account_number text,
  add column if not exists account_name text,
  add column if not exists bank_verified boolean not null default false,
  add column if not exists bank_updated_at timestamptz;

create table if not exists games_sponsorships (
  id uuid primary key default gen_random_uuid(),
  week_key text not null,
  sponsor_company text not null,
  contact_name text not null,
  contact_email text not null,
  sponsor_website text,
  message text,
  amount integer not null check (amount >= 0),
  currency text not null default 'NGN',
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  flw_reference text not null unique,
  flw_transaction_id text,
  paid_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists games_sponsorship_allocations (
  id uuid primary key default gen_random_uuid(),
  sponsorship_id uuid not null references games_sponsorships(id) on delete cascade,
  week_key text not null,
  department_id uuid not null references games_departments(id) on delete cascade,
  percentage numeric(5,2) not null check (percentage > 0 and percentage <= 100),
  amount integer not null check (amount >= 0),
  currency text not null default 'NGN',
  created_at timestamptz default now()
);

create index if not exists idx_games_sponsorships_week_status
  on games_sponsorships(week_key, status);

create index if not exists idx_games_sponsorship_allocations_week_department
  on games_sponsorship_allocations(week_key, department_id);

