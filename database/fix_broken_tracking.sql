-- ════════════════════════════════════════════════════════════════════════
-- ONE-TIME FIX: Clear broken occasion_tracking from failed import runs
-- 
-- The previous imports saved dept_notified=true to tracking BUT never
-- actually sent notification emails (company.id was undefined).
-- This clears the tracking so the next import re-triggers notifications.
--
-- Run ONCE in Supabase SQL Editor before re-importing.
-- ════════════════════════════════════════════════════════════════════════

-- Clear ALL occasion_tracking so catchUp re-runs for everyone on next import.
-- Only clears members where tracking exists but has no notified_at timestamp
-- (meaning emails were never actually sent).
UPDATE company_members
SET occasion_tracking = NULL,
    updated_at = NOW()
WHERE
  occasion_tracking IS NOT NULL
  AND (
    -- tracking exists but has no notified_at (broken run)
    NOT (occasion_tracking::text LIKE '%notified_at%')
  );

-- Verify how many rows were cleared
SELECT COUNT(*) AS cleared FROM company_members WHERE occasion_tracking IS NULL;
