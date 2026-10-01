// Memory Movie: who may generate it (creator, or the recipient by link, email or inbox).
const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const db = { received_cards: [{ id: 'r1', card_id: 'c1', recipient_user_id: 'u-inbox' }], member_received_cards: [] };
const fake = {
  from(t) {
    const f = [];
    const q = { select: () => q, eq: (k, v) => { f.push(r => r[k] === v); return q; },
      maybeSingle: async () => ({ data: (db[t] || []).find(r => f.every(fn => fn(r))) || null, error: null }) };
    return q;
  },
};
require.cache[path.resolve(__dirname, '../../utils/supabase.js')] = { id: 'x', filename: 'x', loaded: true, exports: fake };
const { canManageMovie } = require('../../controllers/movieController');

const card = { id: 'c1', creator_id: 'u-creator', company_id: null, created_by_member_id: null, access_token: 'secret-token-123', recipient_email: 'Ada@Example.com' };

test('creator may generate', async () => assert.equal(await canManageMovie({ user: { id: 'u-creator' }, body: {} }, card), true));
test('recipient with the private link token, not signed in', async () => assert.equal(await canManageMovie({ body: { token: 'secret-token-123' } }, card), true));
test('signed-in recipient by email (case-insensitive)', async () => assert.equal(await canManageMovie({ user: { id: 'u9', email: 'ada@example.com' }, body: {} }, card), true));
test('recipient via received_cards', async () => assert.equal(await canManageMovie({ user: { id: 'u-inbox', email: 'x@y.z' }, body: {} }, card), true));
test('stranger and wrong token are refused', async () => {
  assert.equal(await canManageMovie({ user: { id: 'u-other', email: 'o@x.com' }, body: {} }, card), false);
  assert.equal(await canManageMovie({ body: { token: 'secret-token-124' } }, card), false);
  assert.equal(await canManageMovie({ body: {} }, card), false);
});
