/**
 * schedule.js — turn the send_date / send_time a client sends into the single
 * UTC instant the delivery engine compares against (cards.send_date).
 *
 * The web app always sends the UTC calendar date ("2026-10-01") and UTC time
 * ("14:30:00") as a pair. Other callers don't always, and two shapes used to
 * lose the time silently:
 *   • a full ISO instant with no send_time ("2026-10-01T14:30:00Z") was cut to
 *     its date and delivered at 00:00 UTC — the evening BEFORE in the US;
 *   • a send_time on its own (only the time was edited) was ignored, so the
 *     card kept its old delivery time.
 *
 * resolveSchedule(input, existingSendDate) returns the fields to write:
 *   {}                                  — nothing about the schedule changed
 *   { send_date: null, send_time: null } — schedule cleared
 *   { send_date: ISO, send_time: 'HH:MM:SS' } — the new instant
 *   { error }                           — unparseable input (caller → 400)
 */
const TIME_RE = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function normaliseTime(t) {
  const m = TIME_RE.exec(String(t || '').trim());
  if (!m) return null;
  const h = Number(m[1]); const mi = Number(m[2]); const s = Number(m[3] || 0);
  if (h > 23 || mi > 59 || s > 59) return null;
  return [h, mi, s].map(n => String(n).padStart(2, '0')).join(':');
}

function combine(dateStr, timeStr) {
  const d = String(dateStr).slice(0, 10);
  if (!DATE_RE.test(d)) return null;
  const t = normaliseTime(timeStr) || '00:00:00';
  const at = new Date(`${d}T${t}Z`);
  return isNaN(at.getTime()) ? null : at;
}

const hasTimePart = s => /T\d{2}:\d{2}/.test(String(s));

function resolveSchedule(input = {}, existingSendDate = null) {
  const hasDate = Object.prototype.hasOwnProperty.call(input, 'send_date');
  const hasTime = Object.prototype.hasOwnProperty.call(input, 'send_time');
  if (!hasDate && !hasTime) return {};

  const rawDate = hasDate ? input.send_date : undefined;
  const rawTime = hasTime ? input.send_time : undefined;

  // Explicitly cleared.
  if (hasDate && (rawDate === null || rawDate === '')) return { send_date: null, send_time: null };

  let at = null;
  if (hasDate) {
    if (hasTimePart(rawDate) && !normaliseTime(rawTime)) {
      // A full instant and no separate time: it already says exactly when.
      const d = new Date(rawDate);
      at = isNaN(d.getTime()) ? null : d;
    } else {
      at = combine(rawDate, rawTime);
    }
  } else {
    // Only the time changed: keep the stored (UTC) date, apply the new time.
    if (!existingSendDate) return {}; // no date to attach a time to — nothing to schedule
    if (!normaliseTime(rawTime)) return {};
    at = combine(new Date(existingSendDate).toISOString().slice(0, 10), rawTime);
  }

  if (!at) return { error: 'Invalid send date or time' };
  const iso = at.toISOString();
  return { send_date: iso, send_time: iso.slice(11, 19) };
}

module.exports = { resolveSchedule, normaliseTime };
