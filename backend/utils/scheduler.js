// scheduler.js — shared card delivery scheduler
// Exports scheduleCardDelivery so controllers can call it without
// circular-requiring server.js.
//
// deliverCard and scheduleAllActive are defined in server.js and
// registered here after server boot via scheduler.init().
//
// ── Why this file changed ────────────────────────────────────────────────────
// Cards were being delivered at the wrong time. The cause was a stale timer:
//
//   1. A card is scheduled for Friday 09:00 → a setTimeout is armed.
//   2. The creator edits the card and moves it to Sunday 18:00. updateCard
//      writes the new send_date but nothing re-armed the timer, and this
//      function REFUSED to re-arm because the slug was already in the map
//      (`if (_scheduledTimers.has(card.slug)) return;`).
//   3. Friday 09:00 arrives, the old timer fires, the card is still active and
//      unnotified — so it is delivered two days early.
//
// `cancelSchedule` existed for exactly this, but was never called from
// anywhere in the codebase. The fix has three parts: this file now re-arms
// when the fire time changes, updateCard/deleteCard now call it, and
// deliverCard refuses to send a card that is not actually due yet.

let _deliverCard = null;
// slug → { timer, fireAtMs }. Keeping fireAtMs lets us detect a reschedule.
const _scheduledTimers = new Map();

// setTimeout is only reliable to ~24.8 days (2^31-1 ms). Anything further out
// is left to the per-minute sweep in server.js.
const MAX_TIMEOUT_MS = 24 * 24 * 60 * 60 * 1000;

function init(deliverFn) {
  _deliverCard = deliverFn;
}

function cancelSchedule(slug) {
  const entry = _scheduledTimers.get(slug);
  if (entry) {
    clearTimeout(entry.timer);
    _scheduledTimers.delete(slug);
    console.log(`[scheduler] Cancelled timer for ${slug}`);
  }
}

function scheduleCardDelivery(card) {
  if (!card || !card.slug) return;
  if (!card.send_date || !card.recipient_email) {
    // A card that no longer qualifies must not keep an old timer armed.
    cancelSchedule(card.slug);
    return;
  }
  if (!_deliverCard) return; // scheduler not yet initialised — cron will catch it

  const fireAt = new Date(card.send_date);
  if (isNaN(fireAt.getTime())) {
    console.warn(`[scheduler] Card ${card.slug} has unparseable send_date: ${card.send_date}`);
    cancelSchedule(card.slug);
    return;
  }

  const fireAtMs = fireAt.getTime();
  const existing = _scheduledTimers.get(card.slug);
  if (existing) {
    // Already armed for exactly this moment — nothing to do.
    if (existing.fireAtMs === fireAtMs) return;
    // Rescheduled: drop the stale timer before arming the new one. This is the
    // case that used to deliver cards early.
    console.log(`[scheduler] Card ${card.slug} rescheduled ${new Date(existing.fireAtMs).toISOString()} → ${fireAt.toISOString()}`);
    cancelSchedule(card.slug);
  }

  const msUntilFire = fireAtMs - Date.now();

  if (msUntilFire <= 0) {
    console.log(`[scheduler] Card ${card.slug} past due (${fireAt.toISOString()}), delivering now`);
    _deliverCard(card).catch(e => console.error('[scheduler] immediate deliver error:', e.message));
    return;
  }

  if (msUntilFire > MAX_TIMEOUT_MS) {
    console.log(`[scheduler] Card ${card.slug} too far out (${fireAt.toISOString()}), cron will handle it`);
    return;
  }

  console.log(`[scheduler] Card ${card.slug} armed for ${fireAt.toISOString()} (in ${Math.round(msUntilFire / 1000)}s)`);
  const timer = setTimeout(async () => {
    _scheduledTimers.delete(card.slug);
    if (_deliverCard) {
      await _deliverCard(card).catch(e => console.error('[scheduler] deliver error:', e.message));
    }
  }, msUntilFire);

  _scheduledTimers.set(card.slug, { timer, fireAtMs });
}

/** Introspection for diagnostics and tests. */
function scheduledCount() { return _scheduledTimers.size; }
function scheduledFireAt(slug) {
  const entry = _scheduledTimers.get(slug);
  return entry ? entry.fireAtMs : null;
}

module.exports = { init, scheduleCardDelivery, cancelSchedule, scheduledCount, scheduledFireAt };
