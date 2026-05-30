'use strict';
// Minimal JWT implementation using ONLY Node.js built-in crypto
// HMAC-SHA256 signing — compatible with the real jsonwebtoken library format

const crypto = require('node:crypto');

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
const b64dec  = (str)  => Buffer.from(str.replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString('utf8');

function sign(payload, secret, options = {}) {
  const header  = { alg: 'HS256', typ: 'JWT' };
  const iat     = Math.floor(Date.now() / 1000);
  const exp     = options.expiresIn
    ? iat + (typeof options.expiresIn === 'string'
        ? options.expiresIn.endsWith('d') ? parseInt(options.expiresIn) * 86400
        : options.expiresIn.endsWith('h') ? parseInt(options.expiresIn) * 3600
        : options.expiresIn.endsWith('s') ? parseInt(options.expiresIn)
        : parseInt(options.expiresIn)
      : parseInt(options.expiresIn))
    : undefined;

  const fullPayload = { ...payload, iat, ...(exp !== undefined ? { exp } : {}) };
  const hdr   = b64url(JSON.stringify(header));
  const pay   = b64url(JSON.stringify(fullPayload));
  const sig   = crypto.createHmac('sha256', secret).update(`${hdr}.${pay}`).digest('base64url');
  return `${hdr}.${pay}.${sig}`;
}

function verify(token, secret) {
  if (!token || typeof token !== 'string') throw new Error('invalid token');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('invalid token');
  const [hdr, pay, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', secret).update(`${hdr}.${pay}`).digest('base64url');
  if (sig !== expectedSig) throw new Error('invalid signature');
  let payload;
  try { payload = JSON.parse(b64dec(pay)); } catch { throw new Error('invalid token'); }
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error('jwt expired');
  return payload;
}

function decode(token) {
  try { return JSON.parse(b64dec(token.split('.')[1])); } catch { return null; }
}

// Create an expired token for testing
function signExpired(payload, secret) {
  return sign(payload, secret, { expiresIn: '-1s' });
}

module.exports = { sign, verify, decode, signExpired };
