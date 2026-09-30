'use strict';
const test = require('node:test');
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'test';
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_test';
const assert = require('node:assert');
const { resolveSchedule, normaliseTime } = require('../../utils/schedule');
const { createDeliveryEngine } = require('../../utils/deliveryEngine');
const { reminderStageFor, MAX_REMINDERS } = require('../../utils/payLaterEmails');

// ── A small in-memory PostgREST imitation (only what the engine uses) ────────
function fakeDb(tables) {
  const from = (name) => {
    const rows = tables[name] || (tables[name] = []);
    const filters = []; let op = 'select'; let patch = null; let wantRows = false; let lim = Infinity; let order = null;
    const parseOr = (expr) => expr.split(',').map((p) => {
      const [col, kind, val] = p.split('.');
      return kind === 'is' ? (r) => (r[col] ?? null) === null : (r) => String(r[col]) === val;
    });
    const q = {
      select() { if (op !== 'select') wantRows = true; return q; },
      update(p) { op = 'update'; patch = p; return q; },
      insert(p) { rows.push(...[].concat(p)); op = 'insert'; return q; },
      eq(c, v) { filters.push(r => r[c] === v); return q; },
      is(c, v) { filters.push(r => (r[c] ?? null) === v); return q; },
      not(c, _o, v) { filters.push(r => (r[c] ?? null) !== v); return q; },
      in(c, vs) { filters.push(r => vs.includes(r[c])); return q; },
      lte(c, v) { filters.push(r => r[c] != null && new Date(r[c]) <= new Date(v)); return q; },
      gte(c, v) { filters.push(r => r[c] != null && new Date(r[c]) >= new Date(v)); return q; },
      or(expr) { const alts = parseOr(expr); filters.push(r => alts.some(f => f(r))); return q; },
      order(c) { order = c; return q; },
      limit(n) { lim = n; return q; },
      run() {
        let hit = rows.filter(r => filters.every(f => f(r)));
        if (op === 'update') { hit.forEach(r => Object.assign(r, patch)); return { data: wantRows ? hit.map(r => ({ id: r.id })) : null, error: null }; }
        if (op === 'insert') return { data: null, error: null };
        if (order) hit = [...hit].sort((a, b) => new Date(a[order]) - new Date(b[order]));
        return { data: hit.slice(0, lim).map(r => ({ ...r })), error: null, count: hit.length };
      },
      maybeSingle: async () => { const r = q.run(); return { data: Array.isArray(r.data) ? r.data[0] || null : r.data, error: r.error }; },
      then: (res, rej) => Promise.resolve(q.run()).then(res, rej),
    };
    return q;
  };
  return { from };
}

function makeEngine(cards, { mailOk = true } = {}) {
  const db = fakeDb({ cards, users: [{ id: 'u1', email: 'creator@x.com', full_name: 'Ann Lee' }], messages: [], memory_movies: [] });
  const sent = [];
  const engine = createDeliveryEngine({
    supabase: db,
    sendEmail: async (m) => { sent.push(m); return { success: mailOk }; },
    scheduler: { cancelSchedule() {}, scheduleCardDelivery() {} },
    cardPayment: {
      isPaymentPending: async (id) => !!cards.find(c => c.id === id)?.payment_pending,
      queryExcludingUnpaid: async (build) => build(true),
      humanSendDate: (d) => String(d),
    },
  });
  return { engine, sent };
}

const past = (min) => new Date(Date.now() - min * 60000).toISOString();
const card = (o) => ({ id: o.slug, status: 'active', recipient_notified: false, payment_pending: false,
  recipient_email: 'r@x.com', recipient_name: 'Rita', creator_id: 'u1', send_date: past(1), ...o });

// ── resolveSchedule ──────────────────────────────────────────────────────────
test('resolveSchedule: date + UTC time pair (US client, 9am New York = 13:00Z)', () => {
  assert.deepStrictEqual(resolveSchedule({ send_date: '2026-10-05', send_time: '13:00' }),
    { send_date: '2026-10-05T13:00:00.000Z', send_time: '13:00:00' });
});
test('resolveSchedule: full ISO instant without send_time keeps its time', () => {
  assert.deepStrictEqual(resolveSchedule({ send_date: '2026-10-05T23:30:00-04:00' }),
    { send_date: '2026-10-06T03:30:00.000Z', send_time: '03:30:00' });
});
test('resolveSchedule: time-only edit applies to the stored date', () => {
  assert.deepStrictEqual(resolveSchedule({ send_time: '18:45' }, '2026-10-05T13:00:00Z'),
    { send_date: '2026-10-05T18:45:00.000Z', send_time: '18:45:00' });
});
test('resolveSchedule: clear, untouched, invalid', () => {
  assert.deepStrictEqual(resolveSchedule({ send_date: null }), { send_date: null, send_time: null });
  assert.deepStrictEqual(resolveSchedule({ title: 'x' }), {});
  assert.ok(resolveSchedule({ send_date: 'not-a-date' }).error);
  assert.strictEqual(normaliseTime('25:00'), null);
  assert.strictEqual(normaliseTime('7:05'), '07:05:00');
});

// ── delivery engine ──────────────────────────────────────────────────────────
test('sweep delivers a due card whose recipient_notified is NULL', async () => {
  const cards = [card({ slug: 'nullflag', recipient_notified: null })];
  const { engine, sent } = makeEngine(cards);
  const r = await engine.autoSendDueCards();
  assert.strictEqual(r.delivered, 1);
  assert.strictEqual(cards[0].status, 'sent');
  assert.strictEqual(sent[0].template, 'cardDelivery');
});

test('sweep does not deliver future or unpaid cards', async () => {
  const cards = [card({ slug: 'future', send_date: past(-10) }), card({ slug: 'unpaid', payment_pending: true })];
  const { engine, sent } = makeEngine(cards);
  const r = await engine.autoSendDueCards();
  assert.strictEqual(r.delivered, 0);
  assert.strictEqual(sent.length, 0);
});

test('failed email reverts the card to undelivered for retry', async () => {
  const cards = [card({ slug: 'mailfail' })];
  const { engine } = makeEngine(cards, { mailOk: false });
  const r = await engine.deliverCard(cards[0]);
  assert.ok(r.error);
  assert.strictEqual(cards[0].status, 'active');
  assert.strictEqual(cards[0].recipient_notified, false);
});

test('card already claimed by another instance is not emailed twice', async () => {
  const cards = [card({ slug: 'race' })];
  const { engine, sent } = makeEngine(cards);
  await engine.deliverCard(cards[0]);
  await engine.deliverCard({ ...cards[0] });
  assert.strictEqual(sent.length, 1);
});

test('due card with no recipient email alerts the creator exactly once', async () => {
  const cards = [card({ slug: 'noemail', recipient_email: null, delivery_issue_notified_at: null })];
  const { engine, sent } = makeEngine(cards);
  await engine.alertBlockedDueCards();
  await engine.alertBlockedDueCards();
  assert.strictEqual(sent.length, 1);
  assert.strictEqual(sent[0].template, 'deliveryBlockedNoEmail');
  assert.strictEqual(sent[0].to, 'creator@x.com');
});

test('deliveryStatus explains why overdue cards are waiting', async () => {
  const cards = [card({ slug: 'a', payment_pending: true }), card({ slug: 'b', recipient_email: null })];
  const { engine } = makeEngine(cards);
  const s = await engine.deliveryStatus();
  assert.match(s.overdue.find(c => c.slug === 'a').reason, /unpaid/);
  assert.match(s.overdue.find(c => c.slug === 'b').reason, /no recipient email/);
});

// ── pay-later: the "on hold" notice survives the reminder cap ────────────────
test('overdue notice is sent once even after MAX_REMINDERS reminders', () => {
  const now = Date.now();
  const c = { payment_reminder_count: MAX_REMINDERS, payment_reminder_sent_at: new Date(now - 3600e3).toISOString(),
    send_date: new Date(now - 60e3).toISOString() };
  assert.strictEqual(reminderStageFor(c, now), 'overdue');
  assert.strictEqual(reminderStageFor({ ...c, payment_reminder_sent_at: new Date(now).toISOString() }, now), null);
});
