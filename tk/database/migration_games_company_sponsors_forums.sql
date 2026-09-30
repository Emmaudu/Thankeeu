-- Thankeeu Games company sponsor dashboards and department forums

alter table games_players
  add column if not exists username text;

create unique index if not exists idx_games_players_username_unique
  on games_players(lower(username))
  where username is not null and username <> '';

create table if not exists games_companies (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  slug text not null unique,
  contact_name text not null,
  contact_email text not null unique,
  password_hash text not null,
  sponsor_website text,
  bank_code text,
  bank_name text,
  account_number text,
  account_name text,
  bank_verified boolean not null default false,
  bank_updated_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table games_sponsorships
  add column if not exists games_company_id uuid references games_companies(id) on delete set null;

create index if not exists idx_games_sponsorships_company
  on games_sponsorships(games_company_id, created_at desc);

create table if not exists games_forum_posts (
  id uuid primary key default gen_random_uuid(),
  week_key text not null,
  department_id uuid not null references games_departments(id) on delete cascade,
  player_id uuid not null references games_players(id) on delete cascade,
  message text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_games_forum_posts_department_week
  on games_forum_posts(department_id, week_key, created_at);
