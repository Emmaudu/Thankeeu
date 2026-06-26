// scheduler.js — shared card delivery scheduler
// Exports scheduleCardDelivery so controllers can call it without
// circular-requiring server.js.
//
// deliverCard and scheduleAllActive are defined in server.js and
// registered here after server boot via scheduler.init().

let _deliverCard = null;
let _scheduledTimers = new Map();

function init(deliverFn) {
  _deliverCard = deliverFn;
}

function scheduleCardDelivery(card) {
  if (!card || !card.slug || !card.send_date || !card.recipient_email) return;
  if (_scheduledTimers.has(card.slug)) return; // already scheduled
  if (!_deliverCard) return; // scheduler not yet initialised — cron will catch it

  const fireAt = new Date(card.send_date);
  if (isNaN(fireAt.getTime())) {
    console.warn(`[scheduler] Card ${card.slug} has unparseable send_date: ${card.send_date}`);
    return;
  }

  const msUntilFire = fireAt.getTime() - Date.now();

  if (msUntilFire <= 0) {
    // Already past due — deliver immediately
    console.log(`[scheduler] Card ${card.slug} past due (${fireAt.toISOString()}), delivering now`);
    _deliverCard(card).catch(e => console.error('[scheduler] immediate deliver error:', e.message));
    return;
  }

  // setTimeout max reliable range ~24 days; further-out cards handled by cron
  const MAX_TIMEOUT_MS = 24 * 24 * 60 * 60 * 1000;
  if (msUntilFire > MAX_TIMEOUT_MS) {
    console.log(`[scheduler] Card ${card.slug} too far out (${fireAt.toISOString()}), cron will handle it`);
    return;
  }

  console.log(`[scheduler] Card ${card.slug} armed for ${fireAt.toISOString()} (in ${Math.round(msUntilFire/1000)}s)`);
  const timer = setTimeout(async () => {
    _scheduledTimers.delete(card.slug);
    if (_deliverCard) {
      await _deliverCard(card).catch(e => console.error('[scheduler] deliver error:', e.message));
    }
  }, msUntilFire);

  _scheduledTimers.set(card.slug, timer);
}

function cancelSchedule(slug) {
  const timer = _scheduledTimers.get(slug);
  if (timer) { clearTimeout(timer); _scheduledTimers.delete(slug); }
}

module.exports = { init, scheduleCardDelivery, cancelSchedule };
