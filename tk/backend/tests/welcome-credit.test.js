/**
 * The welcome credit and the "your card is live" receipt.
 *
 * These are structural checks against the real source. They cannot hit
 * Supabase, but they can prove the wiring exists and — more usefully — that
 * the specific mistakes that would make it silently do nothing are absent.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const read = (rel) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const AUTH   = read('controllers/authController.js');
const CREDIT = read('controllers/creditController.js');
const EMAIL  = read('utils/email.js');

describe('no welcome credit (retired — cards are Create Now, Pay Later)', () => {
  it('no signup path grants a free credit any more', () => {
    assert.equal((AUTH.match(/plan_type_v2:\s*'welcome_free'/g) || []).length, 0);
    assert.ok(!/credits_remaining:\s*1\b/.test(AUTH), 'a signup path still grants a credit');
  });

  it('quick-start never uses a shared or guessable password', () => {
    const start = AUTH.indexOf('const quickStart = async');
    const body  = AUTH.slice(start, start + 3000);
    assert.match(body, /crypto\.randomBytes\(32\)/);
    assert.ok(!/password[_a-z]*\s*[:=]\s*['"][^'"]{4,}['"]/i.test(body),
      'a hard-coded password literal in the quick-start path');
  });

  it('quick-start refuses to sign in an email that already has an account', () => {
    const start = AUTH.indexOf('const quickStart = async');
    const body  = AUTH.slice(start, start + 3000);
    assert.match(body, /existing/);
    assert.match(body, /return res\.json\(\{ existing: true/);
  });
});

describe('spending a credit', () => {
  it('reads total_purchased, so a granted credit can be told from a bought one', () => {
    assert.match(CREDIT, /select\('id, credits_remaining, total_purchased'\)/);
  });

  it('emails the creator their sharing link', () => {
    assert.match(CREDIT, /template:\s*'cardCreated'/);
    assert.match(CREDIT, /require\('\.\.\/utils\/email'\)/);
  });

  it('a failed email cannot fail the activation', () => {
    const idx = CREDIT.indexOf("template: 'cardCreated'");
    const around = CREDIT.slice(Math.max(0, idx - 500), idx + 800);
    assert.match(around, /try\s*\{/);
    assert.match(around, /catch\s*\(mailErr\)/);
  });

  it('still deducts before activating, and refunds if activation fails', () => {
    assert.ok(CREDIT.indexOf('Deduct credit first') < CREDIT.indexOf('Activate the card'));
    assert.match(CREDIT, /Refund the credit if activation fails/);
  });

  it('keeps the optimistic lock on the deduction', () => {
    // Without this a double-submit spends one credit and activates two cards.
    assert.match(CREDIT, /\.eq\('credits_remaining', balance\.credits_remaining\)/);
  });
});

describe('cardCreated email', () => {
  it('exists and links to the signing page', () => {
    assert.match(EMAIL, /cardCreated:\s*\(data\)\s*=>/);
    const start = EMAIL.indexOf('cardCreated: (data) =>');
    const body  = EMAIL.slice(start, start + 1600);
    assert.match(body, /\/sign\/\$\{data\.cardSlug\}/);
    assert.match(body, /subject:/);
  });

  it('mentions the free credit only when one was actually used', () => {
    const start = EMAIL.indexOf('cardCreated: (data) =>');
    const body  = EMAIL.slice(start, start + 1600);
    assert.match(body, /data\.usedFreeCredit\s*\?/);
  });
});
