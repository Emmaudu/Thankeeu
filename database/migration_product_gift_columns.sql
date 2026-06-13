-- ════════════════════════════════════════════════════════════════════════
-- MIGRATION: Add product gift columns to messages table
-- The addMessage controller writes these fields when gift_type='product',
-- but the columns were never created.
-- Run in Supabase SQL Editor → New Query → Run
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE messages ADD COLUMN IF NOT EXISTS gift_type            TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS product_vendor_id    UUID;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS product_vendor_name  TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS product_id           UUID;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS product_name         TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS product_price        NUMERIC(12,2);
