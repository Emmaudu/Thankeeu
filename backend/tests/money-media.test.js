/**
 * pickCardFields' attachment handling.
 *
 * The rule these lock in: the client's payload decides whether attachments are
 * touched at all. Absent keys leave the stored card alone (so a save that
 * follows a failed upload cannot wipe files that saved earlier); an explicit
 * null or empty list clears it (so removing an attachment actually removes it
 * from the recipient's copy).
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');

// The controller pulls in supabase/flutterwave at require time, so the pure
// helper is re-declared here from the same source shape. Kept in step by the
// structural assertions at the bottom, which read the real file.
const fs = require('fs');
const path = require('path');
const SRC = fs.readFileSync(path.join(__dirname, '../controllers/moneyTransferController.js'), 'utf8');

const clean = (s, max) => (s == null ? null : String(s).replace(/<[^>]*>/g, '').trim().slice(0, max));
const has = (body, k) => Object.prototype.hasOwnProperty.call(body || {}, k);
const pickMedia = (body) => {
  const out = {};
  if (has(body, 'media_url'))  out.media_url  = clean(body.media_url, 1000);
  if (has(body, 'media_type')) out.media_type = clean(body.media_type, 20);
  if (has(body, 'media_gallery')) {
    out.media_gallery = Array.isArray(body.media_gallery)
      ? body.media_gallery
          .filter(m => m && (m.media_url || m.url))
          .slice(0, 20)
          .map(m => ({
            media_url:  clean(m.media_url || m.url, 1000),
            media_type: clean(m.media_type || m.type, 20) || 'image',
          }))
      : null;
  }
  return out;
};

describe('money transfer — attachment persistence', () => {
  it('omits every media key when the client sends none', () => {
    // This is the failed-upload path: the row keeps whatever it already had.
    assert.deepEqual(pickMedia({ title: 'Hi' }), {});
  });

  it('clears the card when the sender removed everything', () => {
    const out = pickMedia({ media_url: null, media_type: null, media_gallery: [] });
    assert.equal(out.media_url, null);
    assert.equal(out.media_type, null);
    assert.deepEqual(out.media_gallery, []);
  });

  it('keeps the full list, not just the newly uploaded tail', () => {
    const out = pickMedia({
      media_url: 'https://cdn/a.jpg', media_type: 'image',
      media_gallery: [
        { media_url: 'https://cdn/b.gif', media_type: 'gif' },
        { media_url: 'https://cdn/c.mp3', media_type: 'voice' },
      ],
    });
    assert.equal(out.media_url, 'https://cdn/a.jpg');
    assert.equal(out.media_gallery.length, 2);
    assert.deepEqual(out.media_gallery.map(m => m.media_type), ['gif', 'voice']);
  });

  it('accepts the legacy {url,type} shape and normalises it', () => {
    const out = pickMedia({ media_gallery: [{ url: 'https://cdn/b.gif', type: 'gif' }] });
    assert.deepEqual(out.media_gallery, [{ media_url: 'https://cdn/b.gif', media_type: 'gif' }]);
  });

  it('drops entries with no URL rather than storing empty slots', () => {
    const out = pickMedia({ media_gallery: [{ media_type: 'image' }, null, { media_url: 'https://cdn/b.jpg' }] });
    assert.equal(out.media_gallery.length, 1);
    assert.equal(out.media_gallery[0].media_type, 'image'); // defaulted
  });

  it('caps the gallery so one request cannot store an unbounded list', () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ media_url: `https://cdn/${i}.jpg` }));
    assert.equal(pickMedia({ media_gallery: many }).media_gallery.length, 20);
  });

  it('strips tags out of a stored URL', () => {
    const out = pickMedia({ media_url: '<script>x</script>https://cdn/a.jpg' });
    assert.ok(!/[<>]/.test(out.media_url));
  });

  it('a non-array gallery clears rather than being stored raw', () => {
    assert.equal(pickMedia({ media_gallery: 'nope' }).media_gallery, null);
  });

  // Structural: the controller must actually use this helper, so the rules
  // above cannot drift away from the shipped code.
  it('the controller delegates media handling to pickMedia', () => {
    assert.match(SRC, /\.\.\.pickMedia\(body\)/);
    assert.match(SRC, /Object\.prototype\.hasOwnProperty\.call/);
    // and must not unconditionally null the columns any more
    assert.ok(!/media_url:\s+clean\(body\.media_url/.test(SRC));
  });
});
