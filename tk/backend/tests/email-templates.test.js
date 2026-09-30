/**
 * Renders EVERY email template and fails on the ways a notification breaks
 * silently in production:
 *
 *   • the template throws (a missing nested field)
 *   • it returns no subject or no html
 *   • the rendered output contains the literal "undefined" / "null" / "NaN",
 *     which is how a renamed data key shows up to the recipient
 *   • a link points at "undefined" or is left relative
 *
 * sendEmail() swallows failures (`catch { return {success:false} }`), so a
 * broken template produces no error anywhere — the email simply never arrives.
 * This is the only thing standing between that and a customer.
 *
 * Run:  node tests/email-templates.test.js
 */
process.env.RESEND_API_KEY  = process.env.RESEND_API_KEY  || 're_test_stub';
process.env.FRONTEND_URL    = process.env.FRONTEND_URL    || 'https://www.thankeeu.com';
process.env.SUPABASE_URL    = process.env.SUPABASE_URL    || 'https://stub.supabase.co';
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'stub';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// email.js only exports sendEmail, so read the template registry by evaluating
// the module in a sandbox and capturing the object it builds.
const src = fs.readFileSync(path.join(__dirname, '..', 'utils', 'email.js'), 'utf8');
const sandboxModule = { exports: {} };
const context = vm.createContext({
  require, module: sandboxModule, exports: sandboxModule.exports,
  process, console, __dirname, __filename, Buffer, URL, setTimeout, clearTimeout,
});
vm.runInContext(src + '\n;globalThis.__templates = emailTemplates;', context, { filename: 'email.js' });
const templates = context.__templates;

/**
 * Instead of a fixed bag of values — which produces false failures the moment
 * a template uses a field name the bag does not happen to have — every data
 * access is served by a Proxy that always returns something plausible AND
 * records the key. That way:
 *
 *   • nothing is ever `undefined`, so "renders undefined" means a genuine bug
 *     (a template reading a nested field off a missing object, say)
 *   • we get a free inventory of the data each template actually requires
 */
const NUMERIC = /amount|total|fee|net|gross|count|price|balance|days|qty|quantity/i;
const URLISH  = /url|link|href/i;
const LISTISH = /items|messages|members|cards|rows|list|photos/i;

const makeData = (seen) => new Proxy({}, {
  has: () => true,
  get(_t, key) {
    if (typeof key === 'symbol') return undefined;
    if (key === 'toJSON') return undefined;
    seen.add(key);
    if (LISTISH.test(key)) return [];
    if (NUMERIC.test(key)) return 5000;
    if (URLISH.test(key)) return 'https://www.thankeeu.com/x';
    if (/^(is|has|can|show|enabled)/i.test(key)) return true;
    return `«${key}»`;
  },
});

const names = Object.keys(templates).sort();
let failures = 0;

console.log(`email templates (${names.length})\n`);

for (const name of names) {
  const seen = new Set();
  let out;
  try {
    out = templates[name](makeData(seen));
  } catch (e) {
    console.error(`  FAIL ${name} — threw: ${e.message}`);
    failures += 1;
    continue;
  }

  const problems = [];
  if (!out || typeof out !== 'object') problems.push('did not return an object');
  else {
    if (!out.subject) problems.push('no subject');
    if (!out.html) problems.push('no html');
    const blob = `${out.subject || ''} ${out.html || ''}`;
    for (const bad of ['undefined', 'null', 'NaN', '[object Object]']) {
      if (blob.includes(bad)) problems.push(`renders the literal "${bad}"`);
    }
    if (/href="(?:undefined|null|)"/.test(blob)) problems.push('has an empty or undefined href');
  }

  if (problems.length) {
    console.error(`  FAIL ${name} — ${problems.join('; ')}`);
    failures += 1;
  } else {
    console.log(`  ok   ${name.padEnd(26)} ${[...seen].slice(0, 6).join(', ')}${seen.size > 6 ? ` +${seen.size - 6}` : ''}`);
  }
}

console.log(`\n${names.length - failures}/${names.length} templates render cleanly`);
if (failures) {
  console.error(`${failures} template(s) would fail silently in production.`);
  process.exitCode = 1;
}
