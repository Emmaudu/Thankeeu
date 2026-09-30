/**
 * "Create Now, Pay Later" — behaviour tests against an in-memory Supabase.
 *
 * What these lock down:
 *   • an individual card can be published unpaid, and is then held — never
 *     delivered, never "Send now"-able — until the fee is paid;
 *   • paying (redirect verify, webhook, credit) clears the hold exactly once
 *     and never downgrades a delivered card;
 *   • publishing unpaid fails CLOSED on a database without the migration;
 *   • company cards stay free; anonymous drafts cannot publish themselves;
 *   • foreign-currency card fees are compared in the charged currency.
 *
 * Run: node --test tests/pay-later.test.js
 */
'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test';

// ── In-memory Supabase ───────────────────────────────────────────────────────
function makeDb({ cards = [], users = [], missingColumns = [], messages = [], missingTables = [] } = {}) {
  const tables = { cards, users, messages, site_settings: [], card_credits: [], message_replies: [], received_cards: [], member_received_cards: [] };
  const missing = new Set(missingColumns);
  const from = (table) => {
    const st = { op: 'select', filters: [], keys: [], payload: null, cols: '*' };
    const exec = async (single) => {
      if (missingTables.includes(table)) return { data: null, error: { code: '42P01', message: `relation "${table}" does not exist` } };
      const touched = [...st.keys, ...Object.keys(st.payload || {})];
      if (st.op === 'select' && st.cols && st.cols !== '*') {
        touched.push(...st.cols.split(',').map(c => c.trim().split('(')[0]).filter(c => c && c !== '*'));
      }
      const bad = touched.find(c => missing.has(c));
      if (bad) return { data: null, error: { code: '42703', message: `column cards.${bad} does not exist` } };
      const rows = tables[table] || (tables[table] = []);
      if (st.op === 'upsert') {
        for (const r of [].concat(st.payload)) {
          const hit = rows.find(x => x.key === r.key);
          if (hit) Object.assign(hit, r); else rows.push({ ...r });
        }
        return { data: null, error: null };
      }
      const hits = rows.filter(r => st.filters.every(f => f(r)));
      if (st.op === 'insert') {
        const row = { id: `id-${rows.length + 1}`, created_at: new Date().toISOString(), ...st.payload };
        rows.push(row);
        return single ? { data: { ...row }, error: null } : { data: [{ ...row }], error: null };
      }
      if (st.op === 'delete') { hits.forEach(h => rows.splice(rows.indexOf(h), 1)); return { data: null, error: null }; }
      if (st.op === 'update') hits.forEach(r => Object.assign(r, st.payload));
      const data = hits.map(r => ({ ...r }));
      if (single) {
        if (data.length > 1) return { data: null, error: { message: 'multiple rows' } };
        return { data: data[0] || null, error: null };
      }
      return { data, error: null, count: data.length };
    };
    const b = {
      select(cols) { if (st.op === 'select') st.cols = cols || '*'; return b; },
      update(p) { st.op = 'update'; st.payload = p; return b; },
      upsert(p) { st.op = 'upsert'; st.payload = p; return b; },
      insert(p) { st.op = 'insert'; st.payload = p; return b; },
      delete() { st.op = 'delete'; return b; },
      eq(k, v) { st.keys.push(k); st.filters.push(r => r[k] === v); return b; },
      neq(k, v) { st.keys.push(k); st.filters.push(r => r[k] !== v); return b; },
      is(k, v) { st.keys.push(k); st.filters.push(r => (r[k] ?? null) === v); return b; },
      in(k, vs) { st.keys.push(k); st.filters.push(r => vs.includes(r[k])); return b; },
      not() { return b; }, lte() { return b; }, gte() { return b; },
      limit() { return b; }, order() { return b; }, range() { return b; },
      maybeSingle() { return exec(true); },
      single() { return exec(true); },
      then(res, rej) { return exec(false).then(res, rej); },
    };
    return b;
  };
  return { from, tables, rpc: async () => ({ data: null, error: null }) };
}

// ── Module wiring: fake supabase + email, fresh modules per test ─────────────
const ROOT = path.join(__dirname, '..');
const mod = (p) => require.resolve(path.join(ROOT, p));
let db;
let sentEmails;

function install(dbInstance) {
  db = dbInstance;
  sentEmails = [];
  for (const k of Object.keys(require.cache)) {
    if (k.startsWith(path.join(ROOT, 'controllers')) || k.startsWith(path.join(ROOT, 'utils'))) delete require.cache[k];
  }
  require.cache[mod('utils/supabase.js')] = { id: 'sb', filename: 'sb', loaded: true, exports: dbInstance };
  require.cache[mod('utils/email.js')] = {
    id: 'em', filename: 'em', loaded: true,
    exports: { sendEmail: async (m) => { sentEmails.push(m); return { success: true }; } },
  };
}

const resMock = () => {
  const r = { statusCode: 200, body: null, headersSent: false };
  r.status = (c) => { r.statusCode = c; return r; };
  r.json = (b) => { r.body = b; r.headersSent = true; return r; };
  return r;
};
const flush = () => new Promise(r => setImmediate(r));

const individualDraft = (over = {}) => ({
  id: 'c1', slug: 'ada-birthday-abc123', status: 'draft', creator_id: 'u1',
  company_id: null, pal_group_id: null, recipient_name: 'Ada', recipient_email: 'ada@x.test',
  send_date: new Date(Date.now() + 3 * 86400000).toISOString(), recipient_notified: false,
  is_gift_enabled: true, total_collected: 0, payment_pending: false,
  ...over,
});

// ─────────────────────────────────────────────────────────────────────────────
describe('activateCard — Create Now, Pay Later', () => {
  it('publishes an individual draft unpaid: live, payment_pending, congratulations email', async () => {
    install(makeDb({ cards: [individualDraft()], users: [{ id: 'u1', email: 'me@x.test', full_name: 'Tola Ade' }] }));
    const { activateCard } = require(path.join(ROOT, 'controllers/cardController'));
    const res = resMock();
    await activateCard({ params: { slug: 'ada-birthday-abc123' }, body: {}, headers: {}, user: { id: 'u1', full_name: 'Tola Ade' } }, res);
    await flush(); await flush();
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.payment_pending, true);
    const row = db.tables.cards[0];
    assert.equal(row.status, 'active');
    assert.equal(row.payment_pending, true);
    assert.ok(row.payment_reminder_sent_at, 'first nudge timestamp set');
    const congrats = sentEmails.find(m => m.template === 'cardCreatedPayLater');
    assert.ok(congrats, 'congratulations email sent');
    assert.equal(congrats.to, 'me@x.test');
    assert.equal(congrats.data.cardSlug, 'ada-birthday-abc123');
  });

  it('fails CLOSED when the migration has not been run (card stays a draft)', async () => {
    install(makeDb({ cards: [individualDraft()], missingColumns: ['payment_pending', 'payment_reminder_count', 'payment_reminder_sent_at'] }));
    const { activateCard } = require(path.join(ROOT, 'controllers/cardController'));
    const res = resMock();
    await activateCard({ params: { slug: 'ada-birthday-abc123' }, body: {}, headers: {}, user: { id: 'u1' } }, res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.code, 'PAY_LATER_SCHEMA_MISSING');
    assert.equal(db.tables.cards[0].status, 'draft');
  });

  it('an anonymous draft (edit token only) cannot publish itself', async () => {
    install(makeDb({ cards: [individualDraft({ creator_id: null, is_draft: true, draft_edit_token: 'tok' })] }));
    const { activateCard } = require(path.join(ROOT, 'controllers/cardController'));
    const res = resMock();
    await activateCard({ params: { slug: 'ada-birthday-abc123' }, body: {}, headers: { 'x-draft-edit-token': 'tok' } }, res);
    assert.equal(res.statusCode, 401);
    assert.equal(db.tables.cards[0].status, 'draft');
  });

  it('company cards stay free: active, not payment_pending', async () => {
    install(makeDb({ cards: [individualDraft({ creator_id: null, company_id: 'co1' })] }));
    const { activateCard } = require(path.join(ROOT, 'controllers/cardController'));
    const res = resMock();
    await activateCard({ params: { slug: 'ada-birthday-abc123' }, body: {}, headers: {}, company: { id: 'co1', name: 'Acme' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(db.tables.cards[0].status, 'active');
    assert.equal(db.tables.cards[0].payment_pending, false);
    assert.equal(res.body.payment_pending, false);
  });

  it('re-activating a live, paid card (to send invites) never marks it unpaid', async () => {
    install(makeDb({ cards: [individualDraft({ status: 'active', payment_pending: false })] }));
    const { activateCard } = require(path.join(ROOT, 'controllers/cardController'));
    const res = resMock();
    await activateCard({ params: { slug: 'ada-birthday-abc123' }, body: { inviteEmails: ['a@b.test'] }, headers: {}, user: { id: 'u1' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(db.tables.cards[0].payment_pending, false);
    assert.ok(!sentEmails.some(m => m.template === 'cardCreatedPayLater'));
  });
});

describe('sendCard — an unpaid card is never delivered', () => {
  it('returns 402 PAYMENT_REQUIRED and leaves the card untouched', async () => {
    install(makeDb({ cards: [individualDraft({ status: 'active', payment_pending: true })] }));
    const { sendCard } = require(path.join(ROOT, 'controllers/cardController'));
    const res = resMock();
    await sendCard({ params: { slug: 'ada-birthday-abc123' }, user: { id: 'u1' } }, res);
    assert.equal(res.statusCode, 402);
    assert.equal(res.body.code, 'PAYMENT_REQUIRED');
    assert.equal(db.tables.cards[0].status, 'active');
    assert.ok(!sentEmails.some(m => m.template === 'cardDelivery'));
  });

  it('refuses to send an unpublished individual draft', async () => {
    install(makeDb({ cards: [individualDraft()] }));
    const { sendCard } = require(path.join(ROOT, 'controllers/cardController'));
    const res = resMock();
    await sendCard({ params: { slug: 'ada-birthday-abc123' }, user: { id: 'u1' } }, res);
    assert.equal(res.statusCode, 402);
    assert.equal(db.tables.cards[0].status, 'draft');
  });
});

describe('markCardFeePaid', () => {
  it('clears pay-later exactly once (redirect + webhook both landing)', async () => {
    install(makeDb({ cards: [individualDraft({ status: 'active', payment_pending: true })] }));
    const { markCardFeePaid } = require(path.join(ROOT, 'utils/cardPayment'));
    const first = await markCardFeePaid('ada-birthday-abc123');
    const second = await markCardFeePaid('ada-birthday-abc123');
    assert.equal(first.wasPending, true);
    assert.equal(second.wasPending, false);
    assert.equal(db.tables.cards[0].payment_pending, false);
    assert.ok(db.tables.cards[0].fee_paid_at);
    assert.equal(db.tables.cards[0].status, 'active');
  });

  it('publishes a draft (pay-now path)', async () => {
    install(makeDb({ cards: [individualDraft()] }));
    const { markCardFeePaid } = require(path.join(ROOT, 'utils/cardPayment'));
    const r = await markCardFeePaid('ada-birthday-abc123');
    assert.equal(r.wasDraft, true);
    assert.equal(db.tables.cards[0].status, 'active');
    assert.equal(db.tables.cards[0].payment_pending, false);
  });

  it('never downgrades a delivered card back to active', async () => {
    install(makeDb({ cards: [individualDraft({ status: 'sent', recipient_notified: true })] }));
    const { markCardFeePaid } = require(path.join(ROOT, 'utils/cardPayment'));
    await markCardFeePaid('ada-birthday-abc123');
    assert.equal(db.tables.cards[0].status, 'sent');
  });

  it('still works on a database without the migration', async () => {
    install(makeDb({ cards: [individualDraft()], missingColumns: ['payment_pending', 'fee_paid_at'] }));
    const { markCardFeePaid } = require(path.join(ROOT, 'utils/cardPayment'));
    const r = await markCardFeePaid('ada-birthday-abc123');
    assert.equal(r.wasDraft, true);
    assert.equal(db.tables.cards[0].status, 'active');
  });

  it('isPaymentPending treats a missing column as "not pending"', async () => {
    install(makeDb({ cards: [individualDraft({ status: 'active' })], missingColumns: ['payment_pending'] }));
    const { isPaymentPending } = require(path.join(ROOT, 'utils/cardPayment'));
    assert.equal(await isPaymentPending('c1'), false);
  });
});

describe('card-fee amount check (currency-aware)', () => {
  const { isCardFeeAmountOk } = (() => { install(makeDb()); return require(path.join(ROOT, 'utils/cardPayment')); })();
  it('accepts the full NGN fee and a discounted NGN fee', () => {
    assert.equal(isCardFeeAmountOk({ amount: 5000, currency: 'NGN', meta: { expected_ngn: 5000 } }), true);
    assert.equal(isCardFeeAmountOk({ amount: 4000, currency: 'NGN', meta: { expected_ngn: 4000 } }), true);
  });
  it('rejects an NGN underpayment', () => {
    assert.equal(isCardFeeAmountOk({ amount: 100, currency: 'NGN', meta: { expected_ngn: 5000 } }), false);
  });
  it('accepts a USD payment of the USD fee (used to be rejected as ₦3.15 < ₦5,000)', () => {
    assert.equal(isCardFeeAmountOk({ amount: 3.15, currency: 'USD', meta: { expected_ngn: 5000, expected_amount: 3.15, currency: 'USD' } }), true);
  });
  it('falls back to the FX table for older transactions without expected_amount', () => {
    assert.equal(isCardFeeAmountOk({ amount: 3.15, currency: 'USD', meta: { expected_ngn: 5000 } }), true);
    assert.equal(isCardFeeAmountOk({ amount: 0.5, currency: 'USD', meta: { expected_ngn: 5000 } }), false);
  });
  it('refuses an unknown currency', () => {
    assert.equal(isCardFeeAmountOk({ amount: 999, currency: 'XYZ', meta: {} }), false);
  });
});

describe('payment reminder schedule', () => {
  const { reminderStageFor, MAX_REMINDERS } = (() => { install(makeDb()); return require(path.join(ROOT, 'utils/payLaterEmails')); })();
  const H = 3600000; const D = 24 * H; const now = Date.parse('2026-10-01T12:00:00Z');
  const iso = (ms) => new Date(ms).toISOString();
  it('far-off delivery: every 3 days', () => {
    assert.equal(reminderStageFor({ send_date: iso(now + 10 * D), payment_reminder_sent_at: iso(now - 2 * D) }, now), null);
    assert.equal(reminderStageFor({ send_date: iso(now + 10 * D), payment_reminder_sent_at: iso(now - 3 * D) }, now), 'general');
  });
  it('delivery within 72h: daily "soon"', () => {
    assert.equal(reminderStageFor({ send_date: iso(now + 2 * D), payment_reminder_sent_at: iso(now - 25 * H) }, now), 'soon');
    assert.equal(reminderStageFor({ send_date: iso(now + 2 * D), payment_reminder_sent_at: iso(now - 5 * H) }, now), null);
  });
  it('date passed while unpaid: tells them at once, then daily', () => {
    assert.equal(reminderStageFor({ send_date: iso(now - H), payment_reminder_sent_at: iso(now - 5 * H) }, now), 'overdue');
    assert.equal(reminderStageFor({ send_date: iso(now - 2 * H), payment_reminder_sent_at: iso(now - H) }, now), null);
    assert.equal(reminderStageFor({ send_date: iso(now - 30 * H), payment_reminder_sent_at: iso(now - 25 * H) }, now), 'overdue');
  });
  it('stops after the cap and 14 days after a missed date', () => {
    assert.equal(reminderStageFor({ payment_reminder_count: MAX_REMINDERS, payment_reminder_sent_at: iso(now - 9 * D) }, now), null);
    assert.equal(reminderStageFor({ send_date: iso(now - 15 * D), payment_reminder_sent_at: iso(now - 9 * D) }, now), null);
  });
  it('no delivery date: every 3 days', () => {
    assert.equal(reminderStageFor({ payment_reminder_sent_at: iso(now - 4 * D) }, now), 'general');
  });
});

describe('scheduler never arms an unpaid card', () => {
  it('cancels instead of arming when payment_pending is true', () => {
    delete require.cache[mod('utils/scheduler.js')];
    const s = require(path.join(ROOT, 'utils/scheduler'));
    let delivered = 0;
    s.init(async () => { delivered += 1; });
    s.scheduleCardDelivery({ slug: 'x', send_date: new Date(Date.now() - 1000).toISOString(), recipient_email: 'a@b.test', payment_pending: true });
    assert.equal(s.scheduledCount(), 0);
    assert.equal(delivered, 0, 'an overdue unpaid card must not be delivered immediately');
  });
});

describe('pay-later email templates', () => {
  beforeEach(() => {
    for (const k of Object.keys(require.cache)) if (k.includes(`${path.sep}utils${path.sep}email.js`)) delete require.cache[k];
  });
  it('congratulations email links to signing AND the pay page, and escapes names', () => {
    const src = require('fs').readFileSync(path.join(ROOT, 'utils/email.js'), 'utf8');
    assert.match(src, /cardCreatedPayLater:\s*\(d\)\s*=>/);
    assert.match(src, /\/pay\/\$\{d\.cardSlug\}/);
    assert.match(src, /\/sign\/\$\{d\.cardSlug\}/);
    assert.match(src, /ready to receive signatures/);
    assert.match(src, /payLaterReminder:\s*\(d\)\s*=>/);
    assert.match(src, /cardFeePaid:\s*\(d\)\s*=>/);
  });
});

describe('cover layout sanitising', () => {
  const load = () => { install(makeDb()); return require(path.join(ROOT, 'controllers/cardController')).sanitizeCoverLayout; };
  it('keeps show:false (text removed from the cover) and the shadow settings', () => {
    const clean = load()({
      title: { x: 50, y: 60, size: 15, color: 'auto', show: false, shadow: true, shadowColor: '#112233', shadowOpacity: 0.4 },
      recipient: { x: 50, y: 44, size: 30, color: '#ffffff', show: true },
      sender: { x: 50, y: 84, size: 11, color: 'auto', show: false },
    });
    assert.equal(clean.title.show, false);
    assert.equal(clean.sender.show, false);
    assert.equal(clean.recipient.show, true);
    assert.equal(clean.title.shadow, true);
    assert.equal(clean.title.shadowColor, '#112233');
    assert.equal(clean.title.shadowOpacity, 0.4);
  });
  it('defaults a missing show to visible and rejects junk', () => {
    const s = load();
    assert.equal(s({ title: { x: 1, y: 2 } }).title.show, true);
    assert.equal(s('not json'), null);
    assert.equal(s([1, 2]), null);
    assert.equal(s({ title: { color: 'red; background:url(x)', shadowColor: 'javascript:1' } }).title.color, 'auto');
  });
});

describe('hero header settings validation', () => {
  const { validateHeroInput } = (() => { install(makeDb()); return require(path.join(ROOT, 'utils/heroSettings')); })();
  it('trims, and treats empty as "back to default" (null)', () => {
    assert.deepEqual(validateHeroInput({ title: '  Hello  ', subtitle: '' }).values, { title: 'Hello', subtitle: null });
  });
  it('enforces length limits and a single {word} token', () => {
    assert.ok(validateHeroInput({ title: 'x'.repeat(161) }).error);
    assert.ok(validateHeroInput({ title: '{word} and {word}' }).error);
    assert.equal(validateHeroInput({ title: 'Send a {word} card' }).values.title, 'Send a {word} card');
  });
  it('rejects non-text and empty payloads', () => {
    assert.ok(validateHeroInput({ title: 5 }).error);
    assert.ok(validateHeroInput({}).error);
  });
  it('strips control characters', () => {
    assert.equal(validateHeroInput({ tagline: 'a\u0000b\nc' }).values.tagline, 'a b c');
  });
});

describe('abandoned draft reminders: day 1, day 3, final day 8', () => {
  const { abandonedStageFor } = (() => { install(makeDb()); return require(path.join(ROOT, 'utils/abandonedCardReminders')); })();
  const D = 86400000; const now = Date.parse('2026-10-01T12:00:00Z');
  const iso = (ms) => new Date(ms).toISOString();
  it('first reminder the next day, not before', () => {
    assert.equal(abandonedStageFor({ updated_at: iso(now - 20 * 3600000) }, now), null);
    assert.equal(abandonedStageFor({ updated_at: iso(now - D - 1) }, now), 1);
  });
  it('second two days after the first', () => {
    assert.equal(abandonedStageFor({ updated_at: iso(now - 3 * D), abandoned_reminder_count: 1, abandoned_reminder_sent_at: iso(now - D) }, now), null);
    assert.equal(abandonedStageFor({ updated_at: iso(now - 3 * D), abandoned_reminder_count: 1, abandoned_reminder_sent_at: iso(now - 2 * D) }, now), 2);
  });
  it('final five days after the second, then nothing', () => {
    assert.equal(abandonedStageFor({ updated_at: iso(now - 8 * D), abandoned_reminder_count: 2, abandoned_reminder_sent_at: iso(now - 4 * D) }, now), null);
    assert.equal(abandonedStageFor({ updated_at: iso(now - 8 * D), abandoned_reminder_count: 2, abandoned_reminder_sent_at: iso(now - 5 * D) }, now), 'final');
    assert.equal(abandonedStageFor({ updated_at: iso(now - 20 * D), abandoned_reminder_count: 3, abandoned_reminder_sent_at: iso(now - 9 * D) }, now), null);
  });
  it('ignores long-dead drafts from before the feature', () => {
    assert.equal(abandonedStageFor({ updated_at: iso(now - 11 * D) }, now), null);
  });
});

describe('email send failures are reported (Resend v4 resolves { error })', () => {
  it('sendEmail returns success:false when Resend returns an error', async () => {
    for (const k of Object.keys(require.cache)) if (k.includes('node_modules/resend') || k.endsWith(`${path.sep}utils${path.sep}email.js`)) delete require.cache[k];
    const resendPath = require.resolve('resend', { paths: [ROOT] });
    require.cache[resendPath] = { id: resendPath, filename: resendPath, loaded: true,
      exports: { Resend: class { constructor() { this.emails = { send: async () => ({ data: null, error: { message: 'domain not verified' } }) }; } } } };
    const { sendEmail } = require(path.join(ROOT, 'utils/email.js'));
    const r = await sendEmail({ to: 'a@b.test', subject: 's', html: '<p>x</p>' });
    assert.equal(r.success, false);
    delete require.cache[resendPath];
  });
});


describe('replies to individual signers', () => {
  const card = () => ({ id: 'c1', slug: 'ada-bday', title: "Ada's card", recipient_name: 'Ada', recipient_email: 'ada@x.test',
    access_token: 'tok123', creator_id: 'u1', created_by_member_id: null, company_id: null });
  const msgs = () => [
    { id: '11111111-1111-4111-8111-111111111111', card_id: 'c1', author_name: 'Tunde', author_email: 'tunde@x.test', is_private: false },
    { id: '22222222-2222-4222-8222-222222222222', card_id: 'c1', author_name: 'Kemi', author_email: 'kemi@x.test', is_private: true },
    { id: '33333333-3333-4333-8333-333333333333', card_id: 'OTHER', author_name: 'X', author_email: null, is_private: false },
  ];
  const ctl = () => require(path.join(ROOT, 'controllers/replyController'));
  const req = (over = {}) => ({ params: { card_slug: 'ada-bday', message_id: msgs()[0].id }, query: {}, body: { content: 'Thank you!' }, headers: {}, ...over });

  it('the creator can reply; the signer is emailed', async () => {
    install(makeDb({ cards: [card()], messages: msgs() }));
    const res = resMock();
    await ctl().addReply(req({ user: { id: 'u1', full_name: 'Tola Ade', email: 'tola@x.test' } }), res);
    await flush();
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.reply.author_role, 'creator');
    assert.equal(db.tables.message_replies.length, 1);
    assert.ok(sentEmails.some(m => m.to === 'tunde@x.test'));
  });

  it('the recipient can reply with the private-link token (no login)', async () => {
    install(makeDb({ cards: [card()], messages: msgs() }));
    const res = resMock();
    await ctl().addReply(req({ query: { access_token: 'tok123' } }), res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.reply.author_role, 'recipient');
    assert.equal(res.body.reply.author_name, 'Ada');
  });

  it('a visitor must give a name; then their reply reaches only that signer', async () => {
    install(makeDb({ cards: [card()], messages: msgs() }));
    ctl()._guestHits.clear();
    const noName = resMock();
    await ctl().addReply(req({ user: { id: 'u9', email: 'someone@x.test' }, query: { access_token: 'wrong' } }), noName);
    assert.equal(noName.statusCode, 400);
    assert.equal(db.tables.message_replies.length, 0);
    const res = resMock();
    await ctl().addReply(req({ body: { content: 'Lovely words!', author_name: '  Bola  ' }, ip: '1.1.1.1' }), res);
    await flush();
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.reply.author_role, 'guest');
    assert.equal(res.body.reply.author_name, 'Bola');
    assert.ok(res.body.delete_token);
    assert.ok(db.tables.message_replies[0].delete_token_hash);
    assert.notEqual(db.tables.message_replies[0].delete_token_hash, res.body.delete_token);
    const mails = sentEmails.filter(m => /Bola replied/.test(m.subject));
    assert.deepEqual(mails.map(m => m.to), ['tunde@x.test']);
  });

  it('a signed-in visitor replies under their account name', async () => {
    install(makeDb({ cards: [card()], messages: msgs() }));
    ctl()._guestHits.clear();
    const res = resMock();
    await ctl().addReply(req({ user: { id: 'u7', full_name: 'Grace M.', email: 'grace@x.test' }, body: { content: 'So true', author_name: 'Fake' } }), res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.reply.author_name, 'Grace M.');
    assert.equal(db.tables.message_replies[0].author_user_id, 'u7');
  });

  it('visitors cannot reply to private messages, and are rate-limited', async () => {
    install(makeDb({ cards: [card()], messages: msgs() }));
    ctl()._guestHits.clear();
    const priv = resMock();
    await ctl().addReply(req({ params: { card_slug: 'ada-bday', message_id: msgs()[1].id }, body: { content: 'hi', author_name: 'Bo' } }), priv);
    assert.equal(priv.statusCode, 403);
    let last;
    for (let i = 0; i < 9; i++) { last = resMock(); await ctl().addReply(req({ body: { content: 'hi ' + i, author_name: 'Bo' }, ip: '9.9.9.9' }), last); }
    assert.equal(last.statusCode, 429);
    assert.equal(db.tables.message_replies.length, 8);
  });

  it('guest delete: own token works, a stranger cannot, the creator can moderate', async () => {
    install(makeDb({ cards: [card()], messages: msgs() }));
    ctl()._guestHits.clear();
    const a = resMock(); await ctl().addReply(req({ body: { content: 'one', author_name: 'Bo' } }), a);
    const b = resMock(); await ctl().addReply(req({ body: { content: 'two', author_name: 'Bo' } }), b);
    const stranger = resMock();
    await ctl().deleteReply(req({ params: { card_slug: 'ada-bday', reply_id: a.body.reply.id }, body: { delete_token: 'nope' } }), stranger);
    assert.equal(stranger.statusCode, 403);
    const own = resMock();
    await ctl().deleteReply(req({ params: { card_slug: 'ada-bday', reply_id: a.body.reply.id }, body: { delete_token: a.body.delete_token } }), own);
    assert.equal(own.statusCode, 200);
    const mod = resMock();
    await ctl().deleteReply(req({ user: { id: 'u1' }, params: { card_slug: 'ada-bday', reply_id: b.body.reply.id } }), mod);
    assert.equal(mod.statusCode, 200);
    assert.equal(db.tables.message_replies.length, 0);
  });

  it('cannot reply to a message from another card', async () => {
    install(makeDb({ cards: [card()], messages: msgs() }));
    const res = resMock();
    await ctl().addReply(req({ user: { id: 'u1' }, params: { card_slug: 'ada-bday', message_id: msgs()[2].id } }), res);
    assert.equal(res.statusCode, 404);
  });

  it('outsiders do not see replies on private messages; creator sees all', async () => {
    const d = makeDb({ cards: [card()], messages: msgs() });
    d.tables.message_replies.push(
      { id: 'r1', card_id: 'c1', message_id: msgs()[0].id, author_role: 'creator', author_name: 'Tola', content: 'a', created_at: '2026-01-01' },
      { id: 'r2', card_id: 'c1', message_id: msgs()[1].id, author_role: 'recipient', author_name: 'Ada', content: 'b', created_at: '2026-01-02' });
    install(d);
    const pub = resMock();
    await ctl().listReplies(req(), pub);
    assert.deepEqual(pub.body.replies.map(r => r.id), ['r1']);
    assert.equal(pub.body.can_reply, true);
    assert.equal(pub.body.can_moderate, false);
    const own = resMock();
    await ctl().listReplies(req({ user: { id: 'u1' } }), own);
    assert.deepEqual(own.body.replies.map(r => r.id), ['r1', 'r2']);
    assert.equal(own.body.can_reply, true);
    assert.equal(own.body.can_moderate, true);
  });

  it('without the migration: the card still loads (empty list) and replying says why', async () => {
    install(makeDb({ cards: [card()], messages: msgs(), missingTables: ['message_replies'] }));
    const list = resMock();
    await ctl().listReplies(req(), list);
    assert.equal(list.statusCode, 200);
    assert.deepEqual(list.body.replies, []);
    const add = resMock();
    await ctl().addReply(req({ user: { id: 'u1' } }), add);
    assert.equal(add.statusCode, 503);
  });

  it('only the author role can delete a reply', async () => {
    const d = makeDb({ cards: [card()], messages: msgs() });
    d.tables.message_replies.push({ id: 'r1', card_id: 'c1', message_id: msgs()[0].id, author_role: 'recipient', author_name: 'Ada', content: 'a' });
    install(d);
    const asCreator = resMock();
    await ctl().deleteReply(req({ user: { id: 'u1' }, params: { card_slug: 'ada-bday', reply_id: 'r1' } }), asCreator);
    assert.equal(asCreator.statusCode, 403);
    const asRecipient = resMock();
    await ctl().deleteReply(req({ query: { access_token: 'tok123' }, params: { card_slug: 'ada-bday', reply_id: 'r1' } }), asRecipient);
    assert.equal(asRecipient.statusCode, 200);
    assert.equal(db.tables.message_replies.length, 0);
  });

  it('reply-all still works for the recipient and is refused for strangers', async () => {
    install(makeDb({ cards: [card()], messages: msgs() }));
    const { sendReply } = require(path.join(ROOT, 'controllers/messageController'));
    const ok = resMock();
    await sendReply({ params: { card_slug: 'ada-bday' }, query: { access_token: 'tok123' }, body: { content: 'Thank you all!' }, headers: {}, accessTokenReply: true, recipientName: 'Ada' }, ok);
    assert.equal(ok.statusCode, 200);
    assert.ok(sentEmails.filter(m => /thank-you/i.test(m.html || '')).length >= 2, 'every signer is emailed');
    install(makeDb({ cards: [card()], messages: msgs() }));
    const no = resMock();
    await sendReply({ params: { card_slug: 'ada-bday' }, query: {}, body: { content: 'hi' }, headers: {}, user: { id: 'u9', email: 'x@y.test', full_name: 'X' } }, no);
    assert.equal(no.statusCode, 403);
  });
});

describe('admin card details', () => {
  it('returns creator, links, signers, gift total and a timeline', async () => {
    const d = makeDb({
      cards: [{ id: 'c1', slug: 'ada-bday', title: "Ada's card", recipient_name: 'Ada', recipient_email: 'ada@x.test', access_token: 'tok',
        creator_id: 'u1', users: { full_name: 'Tola Ade', email: 'tola@x.test' }, status: 'sent', created_at: '2026-09-01T10:00:00Z',
        delivered_at: '2026-09-10T08:00:00Z', total_collected: 7500, send_date: '2026-09-10T08:00:00Z' }],
      messages: [
        { id: 'm1', card_id: 'c1', author_name: 'Tunde', author_email: 't@x.test', content: 'hi', created_at: '2026-09-02T10:00:00Z' },
        { id: 'm2', card_id: 'c1', author_name: 'Kemi', author_email: 'k@x.test', content: 'yo', created_at: '2026-09-03T10:00:00Z', is_private: true },
      ],
    });
    d.tables.contributions = [
      { id: 'g1', card_id: 'c1', amount: 5000, status: 'success', contributor_name: 'Tunde', created_at: '2026-09-02T11:00:00Z' },
      { id: 'g2', card_id: 'c1', amount: 2500, status: 'success', contributor_name: 'Kemi', created_at: '2026-09-03T11:00:00Z' },
      { id: 'g3', card_id: 'c1', amount: 1000, status: 'pending', contributor_name: 'X', created_at: '2026-09-04T11:00:00Z' },
    ];
    install(d);
    const { getCardDetails } = require(path.join(ROOT, 'controllers/adminController'));
    const res = resMock();
    await getCardDetails({ params: { cardId: 'c1' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.card.creator_name, 'Tola Ade');
    assert.equal(res.body.card.creator_type, 'individual');
    assert.equal(res.body.links.private_view, '/card/ada-bday?token=tok');
    assert.equal(res.body.stats.signers, 2);
    assert.equal(res.body.stats.gift_total, 7500);
    assert.equal(res.body.stats.pending_gifts, 1);
    const types = res.body.timeline.map(e => e.type);
    assert.deepEqual(types.slice(0, 2), ['created', 'signed']);
    assert.ok(types.includes('delivered'));
  });
});

describe('announcement banner settings', () => {
  const db = makeDb();
  const A = (() => { install(db); return require(path.join(ROOT, 'utils/announcementSettings')); })();
  it('rejects unsafe links and accepts https / site paths', () => {
    for (const bad of ['javascript:alert(1)', 'data:text/html,x', '//evil.com', 'ftp://x.com', 'hello world']) {
      assert.ok(A.validateAnnouncementInput({ text: 'Hi', link_url: bad }).error, bad);
    }
    assert.equal(A.validateAnnouncementInput({ text: 'Hi', link_url: '/pricing' }).values.link_url, '/pricing');
    assert.equal(A.validateAnnouncementInput({ text: 'Hi', link_url: 'https://thankeeu.com/blog' }).values.link_url, 'https://thankeeu.com/blog');
  });
  it('needs text to go live, enforces limits and date order', () => {
    assert.ok(A.validateAnnouncementInput({ enabled: true, text: '  ' }).error);
    assert.ok(A.validateAnnouncementInput({ text: 'x'.repeat(201) }).error);
    assert.ok(A.validateAnnouncementInput({ text: 'Hi', starts_at: '2026-10-02', ends_at: '2026-10-01' }).error);
    const v = A.validateAnnouncementInput({ enabled: true, text: 'New\nfeature', link_label: 'See', theme: 'nope', new_tab: true }).values;
    assert.equal(v.text, 'New feature');
    assert.equal(v.theme, 'purple');
    assert.equal(v.link_label, '');   // no link → no button text
    assert.equal(v.new_tab, false);
  });
  it('round-trips through site_settings and is only public while live', async () => {
    const { values } = A.validateAnnouncementInput({ enabled: true, text: 'Voice notes are here', link_url: '/blog', link_label: 'Read more' });
    const saved = await A.writeAnnouncement(values);
    assert.equal(saved.text, 'Voice notes are here');
    const pub = A.publicView(await A.readAnnouncement());
    assert.equal(pub.link_url, '/blog');
    assert.ok(pub.version);
    assert.equal(A.publicView({ ...saved, enabled: false }), null);
    assert.equal(A.publicView({ ...saved, ends_at: '2000-01-01T00:00:00Z' }), null);
    assert.equal(A.publicView({ ...saved, starts_at: '2999-01-01T00:00:00Z' }), null);
  });
  it('treats a corrupt stored value as no announcement', async () => {
    db.tables.site_settings.length = 0;
    db.tables.site_settings.push({ key: A.KEY, value: '{broken' });
    assert.equal(A.publicView(await A.readAnnouncement()), null);
  });
});

describe('like emails to the signer', () => {
  const msg = { id: '11111111-1111-4111-8111-111111111111', card_id: 'c1', author_name: 'Tunde', author_email: 'tunde@x.test', content: 'Happy birthday!', reactions: {} };
  const cardRow = { id: 'c1', slug: 'ada-bday', title: "Ada's card", recipient_name: 'Ada' };
  const ctl = () => require(path.join(ROOT, 'controllers/messageController'));
  const like = (over = {}) => ({ params: { message_id: msg.id }, body: { emoji: 'heart' }, headers: {}, ip: '5.5.5.5', ...over });

  it('names a signed-in liker, says "Someone" otherwise, once per person per day', async () => {
    install(makeDb({ cards: [cardRow], messages: [{ ...msg }] }));
    const r1 = resMock(); await ctl().reactToMessage(like({ user: { id: 'u7', full_name: 'Grace M.', email: 'grace@x.test' } }), r1);
    await flush();
    assert.ok(sentEmails.some(m => m.to === 'tunde@x.test' && /Grace M\. liked your message/.test(m.subject)));
    const before = sentEmails.length;
    const r2 = resMock(); await ctl().reactToMessage(like({ user: { id: 'u7', full_name: 'Grace M.', email: 'grace@x.test' } }), r2);
    await flush();
    assert.equal(sentEmails.length, before);           // same person again → no second email
    const r3 = resMock(); await ctl().reactToMessage(like({ ip: '6.6.6.6' }), r3);
    await flush();
    assert.ok(sentEmails.some(m => /^Someone liked your message/.test(m.subject)));
    assert.equal(db.tables.messages[0].reactions.heart, 3);
  });

  it('never emails a signer about liking their own message', async () => {
    install(makeDb({ cards: [cardRow], messages: [{ ...msg, id: '22222222-2222-4222-8222-222222222222' }] }));
    const before = sentEmails.length;
    const r = resMock(); await ctl().reactToMessage(like({ params: { message_id: '22222222-2222-4222-8222-222222222222' }, user: { id: 'u8', full_name: 'Tunde', email: 'TUNDE@x.test' } }), r);
    await flush();
    assert.equal(sentEmails.length, before);
  });
});
