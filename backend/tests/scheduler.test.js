/**
 * Regression tests for the card delivery scheduler.
 *
 * The bug these lock down: a card rescheduled after its timer was armed kept
 * the ORIGINAL timer, because scheduleCardDelivery bailed out on
 * `_scheduledTimers.has(slug)` and nothing ever called cancelSchedule. The
 * card was then delivered at the old time — early, and unrecoverably so.
 *
 * Run with:  node tests/scheduler.test.js
 */
const assert = require('assert');

// Fresh module instance per scenario so timer state never leaks between tests.
const load = () => {
  delete require.cache[require.resolve('../utils/scheduler')];
  return require('../utils/scheduler');
};

const MIN = 60 * 1000;
const at = (ms) => new Date(Date.now() + ms).toISOString();
const card = (over = {}) => ({
  slug: 'demo', send_date: at(10 * MIN), recipient_email: 'x@y.test', status: 'active', ...over,
});

let passed = 0;
const test = (name, fn) => {
  try { fn(); console.log(`  ok  ${name}`); passed += 1; }
  catch (e) { console.error(`  FAIL ${name}\n       ${e.message}`); process.exitCode = 1; }
};

console.log('scheduler');

test('arms a timer for a future card', () => {
  const s = load();
  s.init(async () => {});
  s.scheduleCardDelivery(card());
  assert.strictEqual(s.scheduledCount(), 1);
  s.cancelSchedule('demo');
});

test('re-arming with the same time is a no-op (keeps one timer)', () => {
  const s = load();
  s.init(async () => {});
  const c = card();
  s.scheduleCardDelivery(c);
  const first = s.scheduledFireAt('demo');
  s.scheduleCardDelivery(c);
  assert.strictEqual(s.scheduledCount(), 1);
  assert.strictEqual(s.scheduledFireAt('demo'), first);
  s.cancelSchedule('demo');
});

test('RESCHEDULING replaces the stale timer (the reported bug)', () => {
  const s = load();
  s.init(async () => {});
  const early = at(5 * MIN);
  const later = at(90 * MIN);
  s.scheduleCardDelivery(card({ send_date: early }));
  assert.strictEqual(s.scheduledFireAt('demo'), new Date(early).getTime(), 'armed for the early time');

  s.scheduleCardDelivery(card({ send_date: later }));
  assert.strictEqual(s.scheduledCount(), 1, 'still exactly one timer');
  assert.strictEqual(
    s.scheduledFireAt('demo'), new Date(later).getTime(),
    'timer must now point at the NEW time — before the fix it kept the old one',
  );
  s.cancelSchedule('demo');
});

test('clearing the schedule cancels the timer', () => {
  const s = load();
  s.init(async () => {});
  s.scheduleCardDelivery(card());
  s.scheduleCardDelivery(card({ send_date: null }));
  assert.strictEqual(s.scheduledCount(), 0);
});

test('removing the recipient cancels the timer', () => {
  const s = load();
  s.init(async () => {});
  s.scheduleCardDelivery(card());
  s.scheduleCardDelivery(card({ recipient_email: null }));
  assert.strictEqual(s.scheduledCount(), 0);
});

test('a past-due card delivers immediately and arms nothing', () => {
  const s = load();
  let delivered = 0;
  s.init(async () => { delivered += 1; });
  s.scheduleCardDelivery(card({ send_date: at(-5 * MIN) }));
  assert.strictEqual(delivered, 1);
  assert.strictEqual(s.scheduledCount(), 0);
});

test('a card beyond the setTimeout ceiling is left to the cron sweep', () => {
  const s = load();
  s.init(async () => {});
  s.scheduleCardDelivery(card({ send_date: at(40 * 24 * 60 * MIN) }));
  assert.strictEqual(s.scheduledCount(), 0);
});

test('an unparseable send_date cancels rather than throwing', () => {
  const s = load();
  s.init(async () => {});
  s.scheduleCardDelivery(card());
  s.scheduleCardDelivery(card({ send_date: 'not-a-date' }));
  assert.strictEqual(s.scheduledCount(), 0);
});

test('a rescheduled card actually fires at the new time, not the old', (done) => {
  const s = load();
  const fired = [];
  s.init(async (c) => { fired.push(c.send_date); });
  // Arm for ~40ms, then immediately move it to ~250ms.
  s.scheduleCardDelivery(card({ send_date: at(40) }));
  const later = at(250);
  s.scheduleCardDelivery(card({ send_date: later }));
  // At 120ms the OLD timer would already have fired if it survived.
  setTimeout(() => {
    assert.strictEqual(fired.length, 0, 'must not have fired at the old time');
  }, 120);
  setTimeout(() => {
    assert.strictEqual(fired.length, 1, 'fires once, at the new time');
    console.log('  ok  a rescheduled card actually fires at the new time, not the old');
    passed += 1;
    console.log(`\n${passed} passed`);
  }, 400);
});
