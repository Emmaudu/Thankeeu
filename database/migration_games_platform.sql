-- Thankeeu Games: inter-company employee engagement league
create extension if not exists pgcrypto;

create table if not exists games_departments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text default 'Business',
  description text,
  image_theme text default 'indigo',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists games_weeks (
  id uuid primary key default gen_random_uuid(),
  week_key text not null unique,
  starts_on date not null,
  play_at timestamptz not null,
  registration_closes_at timestamptz not null,
  status text default 'open',
  created_at timestamptz default now()
);

create table if not exists games_questions (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references games_departments(id) on delete cascade,
  week_key text not null,
  question_no integer not null check (question_no between 1 and 10),
  prompt text not null,
  options jsonb not null,
  correct_option integer not null check (correct_option between 0 and 3),
  explanation text,
  created_at timestamptz default now(),
  unique(department_id, week_key, question_no)
);

create table if not exists games_players (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  company_domain text not null,
  company_name text not null,
  job_title text,
  avatar_url text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists games_registrations (
  id uuid primary key default gen_random_uuid(),
  week_key text not null,
  department_id uuid not null references games_departments(id) on delete cascade,
  player_id uuid not null references games_players(id) on delete cascade,
  company_domain text not null,
  status text default 'registered',
  registered_at timestamptz default now(),
  unique(week_key, department_id, player_id)
);

create index if not exists idx_games_registrations_game_company
  on games_registrations(week_key, department_id, company_domain);

create table if not exists games_attempts (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references games_registrations(id) on delete cascade,
  player_id uuid not null references games_players(id) on delete cascade,
  department_id uuid not null references games_departments(id) on delete cascade,
  week_key text not null,
  answers jsonb not null default '[]'::jsonb,
  score integer not null default 0,
  total integer not null default 10,
  duration_seconds integer default 0,
  poster_url text,
  completed_at timestamptz default now(),
  unique(registration_id)
);

create table if not exists games_congrats_cards (
  id uuid primary key default gen_random_uuid(),
  week_key text not null,
  department_id uuid not null references games_departments(id) on delete cascade,
  winner_player_id uuid not null references games_players(id) on delete cascade,
  winner_registration_id uuid references games_registrations(id) on delete set null,
  winner_attempt_id uuid references games_attempts(id) on delete set null,
  title text not null,
  message text,
  status text not null default 'active',
  send_at timestamptz not null,
  delivered_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(week_key, department_id)
);

create table if not exists games_congrats_signatures (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references games_congrats_cards(id) on delete cascade,
  signer_player_id uuid references games_players(id) on delete set null,
  signer_email text not null,
  signer_name text,
  signer_company text,
  status text not null default 'pending',
  message text,
  gif_url text,
  photo_url text,
  video_url text,
  voice_note_url text,
  signed_at timestamptz,
  first_reminder_sent_at timestamptz,
  monday_reminder_sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(card_id, signer_email)
);

alter table games_congrats_signatures
  alter column signer_email drop not null;

alter table games_congrats_signatures
  add column if not exists signer_type text not null default 'player';

alter table games_congrats_signatures
  add column if not exists gif_url text,
  add column if not exists photo_url text,
  add column if not exists video_url text,
  add column if not exists voice_note_url text;

create index if not exists idx_games_congrats_cards_winner
  on games_congrats_cards(winner_player_id, status);

create index if not exists idx_games_congrats_signatures_signer
  on games_congrats_signatures(signer_email, status);

create or replace view games_public_leaderboard as
select
  a.id,
  a.week_key,
  a.department_id,
  d.slug as department_slug,
  d.name as department_name,
  p.id as player_id,
  p.full_name,
  p.company_name,
  p.company_domain,
  p.avatar_url,
  a.score,
  a.total,
  a.duration_seconds,
  a.completed_at
from games_attempts a
join games_players p on p.id = a.player_id
join games_departments d on d.id = a.department_id;
