// Signature drafts: autosave, closing on submit, admin post (no duplicates).
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_test';
const { test, beforeEach } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

let db;
let seq = 0;
function query(table) {
  const rows = () => (db[table] = db[table] || []);
  const filters = [];
  let op = 'select', patch = null, ins = null, head = false, wantCount = false;
  const match = (r) => filters.every(f => f(r));
  const q = {
    select(_c, opts) { if (opts?.head) head = true; if (opts?.count) wantCount = true; return q; },
    insert(r) { op = 'insert'; ins = r; return q; },
    update(p) { op = 'update'; patch = p; return q; },
    eq(k, v) { filters.push(r => r[k] === v); return q; },
    in(k, vs) { filters.push(r => vs.includes(r[k])); return q; },
    order() { return q; }, limit() { return q; },
    maybeSingle() { return q.then(x => ({ data: Array.isArray(x.data) ? x.data[0] || null : x.data, error: x.error })); },
    then(res, rej) {
      let out;
      if (op === 'insert') {
        if (table === 'signature_drafts' && rows().some(r => r.draft_key === ins.draft_key)) out = { data: null, error: { code: '23505', message: 'dup' } };
        else { const row = { id: `id-${++seq}`, created_at: new Date().toISOString(), ...ins }; rows().push(row); out = { data: [row], error: null }; }
      } else if (op === 'update') {
        const hit = rows().filter(match); hit.forEach(r => Object.assign(r, patch)); out = { data: hit.map(r => ({ ...r })), error: null };
      } else {
        const hit = rows().filter(match); out = { data: head ? null : hit.map(r => ({ ...r })), error: null, ...(wantCount ? { count: hit.length } : {}) };
      }
      return Promise.resolve(out).then(res, rej);
    },
  };
  return q;
}
require.cache[path.resolve(__dirname, '../../utils/supabase.js')] = { id: 's', filename: 's', loaded: true, exports: { from: query } };
const d = require('../../utils/signatureDrafts');

const KEY = 'a'.repeat(32);
beforeEach(() => {
  d._resetForTests();
  db = {
    cards: [{ id: 'c1', slug: 'bday', status: 'active', allow_private_messages: true, title: 'T', recipient_name: 'Ada' }],
    messages: [], signature_drafts: [],
  };
});

test('saves, then updates the same draft', async () => {
  let r = await d.saveDraft('bday', { draft_key: KEY, author_name: 'Bola', author_email: 'B@x.com', content: 'Happy day' });
  assert.equal(r.status, 201);
  r = await d.saveDraft('bday', { draft_key: KEY, author_name: 'Bola', author_email: 'b@x.com', content: 'Happy day!!' });
  assert.equal(r.status, 200);
  assert.equal(db.signature_drafts.length, 1);
  assert.equal(db.signature_drafts[0].content, 'Happy day!!');
  assert.equal(db.signature_drafts[0].author_email, 'b@x.com');
});

test('rejects bad keys, skips empty text, refuses unpublished cards', async () => {
  assert.equal((await d.saveDraft('bday', { draft_key: 'x', content: 'hi' })).status, 400);
  assert.equal((await d.saveDraft('bday', { draft_key: KEY, content: '   ' })).body.skipped, true);
  db.cards[0].status = 'draft';
  assert.equal((await d.saveDraft('bday', { draft_key: KEY, content: 'hi' })).status, 403);
  assert.equal(db.signature_drafts.length, 0);
});

test('submitting closes the draft, and a late page-close save cannot reopen it', async () => {
  await d.saveDraft('bday', { draft_key: KEY, author_email: 'b@x.com', content: 'Hi' });
  const msg = { id: 'm1', author_email: 'b@x.com', content: 'Hi' };
  db.messages.push({ ...msg, card_id: 'c1' });
  await d.closeDraftsForMessage('c1', msg, KEY);
  assert.equal(db.signature_drafts[0].status, 'posted');
  await d.saveDraft('bday', { draft_key: KEY, author_email: 'b@x.com', content: 'Hi' });
  assert.equal(db.signature_drafts[0].status, 'posted');
  assert.deepEqual(await d.listOpenDrafts('c1'), []);
});

test('a first save arriving after the signature is already on the card is not kept', async () => {
  db.messages.push({ id: 'm1', card_id: 'c1', author_email: 'b@x.com', content: 'Hi there' });
  const r = await d.saveDraft('bday', { draft_key: KEY, author_email: 'b@x.com', content: 'Hi there ' });
  assert.equal(r.body.status, 'posted');
  assert.equal(db.signature_drafts.length, 0);
});

test('admin post adds the message once; second click is refused', async () => {
  await d.saveDraft('bday', { draft_key: KEY, author_name: 'Bola', author_email: 'b@x.com', content: 'Hi', is_private: true });
  const id = db.signature_drafts[0].id;
  const r = await d.postDraft('c1', id);
  assert.equal(r.status, 201);
  assert.equal(db.messages.length, 1);
  assert.equal(db.messages[0].author_name, 'Bola');
  assert.equal(db.messages[0].is_private, true);
  assert.equal(db.signature_drafts[0].status, 'posted');
  assert.equal(db.signature_drafts[0].posted_by, 'admin');
  const again = await d.postDraft('c1', id);
  assert.equal(again.status, 409);
  assert.equal(db.messages.length, 1);
});

test('admin post links to an identical signature instead of duplicating it', async () => {
  await d.saveDraft('bday', { draft_key: KEY, author_name: 'Bola', author_email: 'b@x.com', content: 'Hi' });
  db.messages.push({ id: 'm9', card_id: 'c1', author_email: 'b@x.com', content: 'Hi' });
  const r = await d.postDraft('c1', db.signature_drafts[0].id);
  assert.equal(r.body.already_signed, true);
  assert.equal(db.messages.length, 1);
  assert.equal(db.signature_drafts[0].message_id, 'm9');
});

test('discard hides a draft; it cannot then be posted', async () => {
  await d.saveDraft('bday', { draft_key: KEY, content: 'Hi' });
  const id = db.signature_drafts[0].id;
  assert.equal((await d.discardDraft('c1', id)).status, 200);
  assert.equal((await d.postDraft('c1', id)).status, 409);
  assert.equal(db.messages.length, 0);
});

test('closing by email only touches a draft with the same text', async () => {
  await d.saveDraft('bday', { draft_key: 'b'.repeat(32), author_email: 'b@x.com', content: 'Other words' });
  await d.saveDraft('bday', { draft_key: 'c'.repeat(32), author_email: 'b@x.com', content: 'Same words' });
  await d.closeDraftsForMessage('c1', { id: 'm1', author_email: 'b@x.com', content: 'Same words' }, null);
  const byKey = Object.fromEntries(db.signature_drafts.map(r => [r.draft_key[0], r.status]));
  assert.equal(byKey.b, 'draft');
  assert.equal(byKey.c, 'posted');
});

test('one IP cannot create more than 15 new drafts per card per hour', async () => {
  for (let i = 0; i < 15; i++) {
    const r = await d.saveDraft('bday', { draft_key: i.toString(16).padStart(32, '0'), content: 'x' }, { ip: '1.2.3.4' });
    assert.equal(r.status, 201);
  }
  const blocked = await d.saveDraft('bday', { draft_key: 'f'.repeat(32), content: 'x' }, { ip: '1.2.3.4' });
  assert.equal(blocked.status, 429);
  // Updating an existing draft is still allowed.
  assert.equal((await d.saveDraft('bday', { draft_key: '0'.repeat(32), content: 'y' }, { ip: '1.2.3.4' })).status, 200);
  // Someone else on another IP is not affected.
  assert.equal((await d.saveDraft('bday', { draft_key: 'f'.repeat(32), content: 'x' }, { ip: '5.6.7.8' })).status, 201);
});
