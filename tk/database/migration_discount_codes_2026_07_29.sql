-- Discount codes for card-fee checkout.
-- Percentage-off only, with an optional max-discount cap (protects against
-- a high % code applying to a large converted-currency amount), optional
-- max total uses, and optional expiry date. Admin-managed via /admin/discount-codes.

create table if not exists discount_codes (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,               -- stored uppercase, e.g. "LAUNCH20"
  percent_off       integer not null check (percent_off > 0 and percent_off <= 100),
  max_discount_ngn  integer,                             -- optional cap, in NGN (null = uncapped)
  max_uses          integer,                             -- optional, null = unlimited
  used_count        integer not null default 0,
  expires_at        timestamptz,                         -- optional, null = no expiry
  is_active         boolean not null default true,
  banner_enabled    boolean not null default false,      -- show a site-wide banner above the navbar for this code
  banner_text       text,                                -- custom banner copy, e.g. "20% off all cards — use LAUNCH20"
  created_by        uuid references users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_discount_codes_code on discount_codes (code);

-- Safe to re-run: adds banner columns if this table already existed from an
-- earlier version of this migration (CREATE TABLE IF NOT EXISTS is a no-op
-- on an existing table, so new columns need an explicit ALTER).
alter table discount_codes add column if not exists banner_enabled boolean not null default false;
alter table discount_codes add column if not exists banner_text text;

-- Tracks each redemption so the same paying customer/email can't be blocked
-- from reusing a still-valid code, but gives us an audit trail and lets
-- used_count be derived/verified independently of the counter column.
create table if not exists discount_code_redemptions (
  id                uuid primary key default gen_random_uuid(),
  discount_code_id  uuid not null references discount_codes(id) on delete cascade,
  card_slug         text not null,
  tx_ref            text,                                -- filled in once payment is verified
  email             text,
  amount_before_ngn integer,
  amount_after_ngn  integer,
  created_at        timestamptz not null default now()
);

create index if not exists idx_discount_redemptions_code on discount_code_redemptions (discount_code_id);
create index if not exists idx_discount_redemptions_card on discount_code_redemptions (card_slug);
