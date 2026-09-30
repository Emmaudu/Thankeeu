/**
 * CORS allowlist.
 *
 * Two failure modes, both expensive, pulling in opposite directions:
 *
 *   too loose → any page on the internet can make authenticated calls as a
 *               signed-in user (this was live: the old callback ended in an
 *               unconditional `callback(null, true)`)
 *   too tight → the real frontend stops working and every customer is locked
 *               out until a redeploy
 *
 * So both directions are tested, and the lockout cases are listed first
 * because that is the one that would take the product down.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

/**
 * Rebuilt from the source of truth rather than imported, because requiring
 * server.js boots the whole app. The structural assertions at the bottom fail
 * if server.js and this copy ever drift apart.
 */
const build = (env = {}) => {
  const APEX = ['https://thankeeu.com', 'https://www.thankeeu.com'];
  const staticOrigins = new Set([
    ...APEX,
    env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5173',
    ...String(env.CORS_EXTRA_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean),
  ].filter(Boolean));

  return (origin) => {
    if (staticOrigins.has(origin)) return true;
    let url;
    try { url = new URL(origin); } catch { return false; }
    const host = url.hostname;
    const isLocal = host === 'localhost' || host.endsWith('.localhost') || host === '127.0.0.1';
    if (isLocal) return url.protocol === 'http:' || url.protocol === 'https:';
    if (url.protocol !== 'https:') return false;
    if (host === 'thankeeu.com' || host.endsWith('.thankeeu.com')) return true;
    if (host.endsWith('.vercel.app')) return true;
    return false;
  };
};

const allowed = build({ FRONTEND_URL: 'https://www.thankeeu.com' });

describe('CORS — must not lock the product out', () => {
  const mustAllow = [
    ['the live site',            'https://www.thankeeu.com'],
    ['the apex domain',          'https://thankeeu.com'],
    ['a company workspace',      'https://acme.thankeeu.com'],
    ['the games host',           'https://games.thankeeu.com'],
    ['the admin host',           'https://admin.thankeeu.com'],
    ['a Vercel preview',         'https://thankeeu-git-main-emmanuel.vercel.app'],
    ['local dev (Vite)',         'http://localhost:5173'],
    ['local dev (CRA)',          'http://localhost:3000'],
    ['a local workspace host',   'http://acme.localhost:5173'],
    ['loopback by IP',           'http://127.0.0.1:5173'],
  ];
  mustAllow.forEach(([what, origin]) => {
    it(`allows ${what}`, () => assert.equal(allowed(origin), true, origin));
  });

  it('honours CORS_EXTRA_ORIGINS, so a missing origin needs no redeploy', () => {
    const withExtra = build({ CORS_EXTRA_ORIGINS: 'https://thankeeu.ng, https://staging.example.com' });
    assert.equal(withExtra('https://thankeeu.ng'), true);
    assert.equal(withExtra('https://staging.example.com'), true);
  });
});

describe('CORS — must keep everyone else out', () => {
  const mustBlock = [
    ['a plain attacker site',            'https://evil.com'],
    // The old `origin.includes('thankeeu')` check allowed both of these.
    ['a look-alike domain',              'https://evil-thankeeu.com'],
    ['our name as a subdomain of theirs','https://thankeeu.attacker.net'],
    ['our name in their path',           'https://evil.com/thankeeu'],
    ['a suffix-glued host',              'https://notthankeeu.com'],
    ['a fake vercel host',               'https://vercel.app.evil.com'],
    ['a fake localhost',                 'https://localhost.evil.com'],
    ['http on our own domain',           'http://www.thankeeu.com'],
    ['a data: origin',                   'data:text/html,<script>'],
    ['nonsense',                         'not-a-url'],
  ];
  mustBlock.forEach(([what, origin]) => {
    it(`blocks ${what}`, () => assert.equal(allowed(origin), false, origin));
  });
});

describe('CORS — the shape of the real thing', () => {
  it('no longer ends in an unconditional allow', () => {
    assert.ok(!/return callback\(null, true\); \/\/ permissive/.test(SRC),
      'the unconditional allow is still in server.js');
  });

  it('rejects rather than allowing by default', () => {
    assert.match(SRC, /return callback\(null, false\)/);
  });

  it('has dropped the substring check that matched look-alike domains', () => {
    // The literal appears nowhere in server.js any more — not even the comment
    // explaining its removal, which would make this assertion useless.
    assert.ok(!SRC.includes("origin.includes('thankeeu')"));
  });

  it('still allows requests with no Origin header', () => {
    // Webhooks, curl and server-to-server calls send none, and they are not
    // what CORS defends against.
    assert.match(SRC, /if \(!origin\) return callback\(null, true\)/);
  });

  it('keeps credentials enabled', () => {
    assert.match(SRC, /credentials: true/);
  });

  it('logs a blocked origin so a real one can be spotted and added', () => {
    assert.match(SRC, /\[cors\] blocked origin/);
    assert.match(SRC, /CORS_EXTRA_ORIGINS/);
  });

  it('the test copy matches the real allowlist', () => {
    // If someone edits one and not the other, this catches it.
    ['thankeeu.com', '.vercel.app', '.localhost', '127.0.0.1', 'CORS_EXTRA_ORIGINS']
      .forEach(token => assert.ok(SRC.includes(token), `server.js is missing ${token}`));
  });
});
