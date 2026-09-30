-- ============================================================================
-- Send Money — money tucked inside a single greeting card.
--
-- This is deliberately NOT the group-card tables. A group card has many
-- signers, a gift pot and a board/album of messages; a money transfer has
-- exactly one sender, one recipient and one amount. Reusing `cards` would have
-- meant nullable-everything, and `gift_claims.card_id` is UNIQUE and NOT NULL
-- against `cards`, so a standalone send cannot record a claim there.
--
-- Money model (matches the existing gift rails in bankController.js):
--   gift_amount   what the recipient receives, gross, in NGN
--   card_fee      the platform's card fee for the send, in NGN
--   total_paid    what the sender was actually charged (gift + fee)
--   payout_fee    3% taken at CLAIM time, exactly as withdrawGift does
--
-- Idempotency: `payment_ref` and `claim_reference` are UNIQUE so a replayed
-- Flutterwave webhook can never double-credit or double-pay.
--
-- Safe to run more than once.
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.money_transfers (
  id                  uuid primary key default gen_random_uuid(),
  slug                varchar(40)  not null unique,

  -- ── Sender (always an authenticated user) ────────────────────────────────
  sender_user_id      uuid         references public.users(id) on delete set null,
  sender_name         varchar(120) not null,
  sender_email        varchar(200) not null,

  -- ── Recipient ────────────────────────────────────────────────────────────
  recipient_name      varchar(120) not null,
  recipient_email     varchar(200) not null,

  -- ── The card itself (mirrors the cards table's cover model) ──────────────
  title               varchar(200),
  occasion            varchar(40)  default 'other',
  custom_occasion     varchar(60),
  design_theme        varchar(80),
  background_color    text,
  cover_text_color    varchar(20)  default 'auto',
  cover_layout        jsonb,
  album_background_theme varchar(32) default 'cover_blur',
  font_style          varchar(30)  default 'elegant',

  -- ── The message (one page, one author) ───────────────────────────────────
  message             text,
  message_font_style  varchar(30)  default 'handwritten',
  message_font_size   integer      default 18,
  message_font_color  varchar(20),
  media_url           text,
  media_type          varchar(20),
  media_gallery       jsonb,

  -- ── Money, all NGN minor-unit-free (whole naira, like cards.total_collected)
  gift_amount         numeric(12,2) not null default 0,
  card_fee            numeric(12,2) not null default 0,
  total_paid          numeric(12,2) not null default 0,
  currency            varchar(8)   not null default 'NGN',
  paid_currency       varchar(8),
  paid_amount         numeric(12,2),

  -- ── Payment (sender side) ────────────────────────────────────────────────
  payment_ref         varchar(80)  unique,
  payment_status      varchar(20)  not null default 'pending'
                      check (payment_status in ('pending','paid','failed')),
  paid_at             timestamptz,

  -- ── Delivery ─────────────────────────────────────────────────────────────
  status              varchar(20)  not null default 'draft'
                      check (status in ('draft','paid','sent','claimed','refunded')),
  send_date           timestamptz,
  delivered_at        timestamptz,
  recipient_notified  boolean      not null default false,
  claim_token         varchar(80),

  -- ── Claim (recipient side) ───────────────────────────────────────────────
  claimed             boolean      not null default false,
  claimed_at          timestamptz,
  claim_type          varchar(20)  check (claim_type in ('bank','giftcard')),
  claim_reference     varchar(80)  unique,
  claim_status        varchar(20)  check (claim_status in ('processing','paid','failed')),
  claim_amount        numeric(12,2),
  claim_fee           numeric(12,2),
  claim_bank_name     varchar(120),
  claim_account_last4 varchar(8),
  claim_product_name  varchar(160),
  claim_redemption_code text,
  claim_failure_reason text,

  created_at          timestamptz  not null default now(),
  updated_at          timestamptz  not null default now()
);

-- Sender's dashboard list.
create index if not exists idx_money_transfers_sender
  on public.money_transfers (sender_user_id, created_at desc);

-- Recipient lookup when they sign in with the email it was sent to.
create index if not exists idx_money_transfers_recipient_email
  on public.money_transfers (lower(recipient_email));

-- The scheduled-send sweep: mirrors idx on cards (status, recipient_notified, send_date).
create index if not exists idx_money_transfers_due
  on public.money_transfers (status, recipient_notified, send_date)
  where status = 'paid' and recipient_notified = false;

-- Webhook lookups.
create index if not exists idx_money_transfers_payment_ref on public.money_transfers (payment_ref);
create index if not exists idx_money_transfers_claim_ref   on public.money_transfers (claim_reference);

comment on table  public.money_transfers is
  'Single-recipient money gift wrapped in a greeting card. Sender pays gift_amount + card_fee; recipient claims to bank (Flutterwave transfer) or as a Reloadly gift card.';
comment on column public.money_transfers.claim_reference is
  'Flutterwave transfer reference (TK-SEND-WD-...) — UNIQUE so a replayed webhook cannot double-pay.';
comment on column public.money_transfers.payment_ref is
  'Flutterwave tx_ref (TK-SEND-...) — UNIQUE so a replayed verify/webhook cannot double-credit.';

-- updated_at maintenance
create or replace function public.touch_money_transfers_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_money_transfers_updated_at on public.money_transfers;
create trigger trg_money_transfers_updated_at
  before update on public.money_transfers
  for each row execute function public.touch_money_transfers_updated_at();
