-- ═══════════════════════════════════════════════════════════════════════════
-- FIX_AMOUNTS_NOW.sql
-- Run this in Supabase SQL Editor to fix contribution amounts not showing.
-- Safe to run multiple times.
-- ═══════════════════════════════════════════════════════════════════════════

-- STEP 1: Mark ALL contributions that have a flw_reference as 'success'
-- (They are in the DB because the payment happened — status stuck on 'pending')
UPDATE contributions
SET status = 'success'
WHERE flw_reference IS NOT NULL
  AND flw_reference != ''
  AND status != 'success';

-- STEP 2: Backfill messages.contributed_amount via message_id
UPDATE messages AS m
SET contributed_amount = c.amount,
    payment_verified   = TRUE
FROM contributions AS c
WHERE c.message_id = m.id
  AND c.status = 'success'
  AND (m.contributed_amount IS NULL OR m.contributed_amount = 0);

-- STEP 3: Backfill messages.contributed_amount via card_id + email match
-- (for contributions that have no message_id stored)
UPDATE messages AS m
SET contributed_amount = c.amount,
    payment_verified   = TRUE
FROM contributions AS c
WHERE c.status = 'success'
  AND c.message_id IS NULL
  AND c.card_id = m.card_id
  AND c.contributor_email IS NOT NULL
  AND c.contributor_email != ''
  AND LOWER(TRIM(c.contributor_email)) = LOWER(TRIM(m.author_email))
  AND (m.contributed_amount IS NULL OR m.contributed_amount = 0);

-- STEP 4: Recalculate total_collected on ALL cards from scratch
-- (replaces whatever was there, correct and accurate)
UPDATE cards AS ca
SET total_collected = COALESCE((
  SELECT SUM(c.amount)
  FROM contributions c
  WHERE c.card_id = ca.id
    AND c.status = 'success'
), 0);

-- Check results (run this SELECT after to verify):
-- SELECT c.contributor_email, c.amount, c.status, m.contributed_amount, m.author_email
-- FROM contributions c
-- LEFT JOIN messages m ON m.id = c.message_id OR (c.message_id IS NULL AND m.card_id = c.card_id AND LOWER(m.author_email) = LOWER(c.contributor_email))
-- ORDER BY c.created_at DESC LIMIT 20;
