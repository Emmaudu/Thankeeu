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

describe('welcome credit', () => {
  it('is granted on EVERY signup path', () => {
    // /auth/signup, /auth/verify-code and /auth/quick-start each create a user;
    // a credit granted on only some means those accounts silently get nothing.
    const grants = AUTH.match(/plan_type_v2:\s*'welcome_free'/g) || [];
    assert.equal(grants.length, 3, 'expected a welcome credit on all three signup paths');
    assert.match(AUTH, /const quickStart = async/);
  });

  it('quick-start never uses a shared or guessable password', () => {
    const start = AUTH.indexOf('const quickStart = async');
    const body  = AUTH.slice(start, start + 3000);
    // The password must come from crypto, and must not be a literal.
    assert.match(body, /crypto\.randomBytes\(32\)/);
    assert.ok(!/password[_a-z]*\s*[:=]\s*['"][^'"]{4,}['"]/i.test(body),
      'a hard-coded password literal in the quick-start path');
  });

  it('quick-start refuses to sign in an email that already has an account', () => {
    const start = AUTH.indexOf('const quickStart = async');
    const body  = AUTH.slice(start, start + 3000);
    // Otherwise knowing someone's address would be enough to enter their account.
    assert.match(body, /existing/);
    assert.match(body, /return res\.json\(\{ existing: true/);
  });

  it('grants exactly one credit, and records it as granted rather than purchased', () => {
    assert.match(AUTH, /credits_remaining:\s*1/);
    assert.match(AUTH, /total_purchased:\s*0/);
  });

  it('cannot block a signup if the credit insert fails', () => {
    // The grant must be inside a try/catch — a credits table hiccup must never
    // stop someone creating an account.
    const idx = AUTH.indexOf("plan_type_v2:      'welcome_free'");
    const before = AUTH.slice(Math.max(0, idx - 600), idx);
    assert.match(before, /try\s*\{/);
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
