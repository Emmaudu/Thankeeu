-- Thankeeu Mentorship — subdomain app (mentorship.thankeeu.com)
-- Separate tables; admin is the existing thankeeu admin (role = 'admin').

-- Parent applications: two-step flow (parent+child details, then career paths).
create table if not exists mentorship_applications (
  id            uuid primary key default gen_random_uuid(),
  parent_name   text not null,
  parent_email  text not null,
  parent_phone  text not null,
  child_class   text not null,                       -- e.g. "JSS2", "SS1", "Primary 5"
  career_paths  text[] not null default '{}',        -- selected aspiration fields
  status        text not null default 'new',         -- new | contacted | enrolled | closed
  admin_notes   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_mentorship_apps_status  on mentorship_applications (status);
create index if not exists idx_mentorship_apps_created on mentorship_applications (created_at desc);

-- Contact-us form submissions.
create table if not exists mentorship_contacts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  message     text not null,
  status      text not null default 'new',           -- new | replied | closed
  created_at  timestamptz not null default now()
);
create index if not exists idx_mentorship_contacts_status on mentorship_contacts (status);

-- Subscription payments (Flutterwave — same account as main thankeeu).
create table if not exists mentorship_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  parent_name   text,
  parent_email  text not null,
  plan          text not null,                        -- 'monthly' | 'weekly'
  amount_ngn    integer not null,                     -- 50000 monthly, 12500 weekly
  currency      text not null default 'NGN',
  flw_reference text unique,
  status        text not null default 'pending',      -- pending | paid | failed
  application_id uuid references mentorship_applications(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_mentorship_subs_status on mentorship_subscriptions (status);
create index if not exists idx_mentorship_subs_ref    on mentorship_subscriptions (flw_reference);
