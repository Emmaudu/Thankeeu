const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
}

// ── Safety shim ────────────────────────────────────────────────────────
// In the installed @supabase/postgrest-js (v2.x) query builders are
// "thenable" (they have .then) but do NOT have .catch / .finally.
// Code such as `supabase.from('x').insert({...}).catch(() => {})` therefore
// throws "TypeError: ...catch is not a function" AFTER the database write
// (or bank transfer) has already happened. Users saw "Could not process /
// Withdrawal failed" even though the action succeeded, and their retry then
// hit "already approved / not approved yet". The call sites are fixed; this
// shim guarantees the same mistake can never crash a request again.
try {
  const { PostgrestBuilder } = require('@supabase/postgrest-js');
  if (PostgrestBuilder && typeof PostgrestBuilder.prototype.catch !== 'function') {
    PostgrestBuilder.prototype.catch = function (onRejected) {
      return this.then(undefined, onRejected);
    };
  }
  if (PostgrestBuilder && typeof PostgrestBuilder.prototype.finally !== 'function') {
    PostgrestBuilder.prototype.finally = function (onFinally) {
      return this.then(
        (v) => { if (onFinally) onFinally(); return v; },
        (e) => { if (onFinally) onFinally(); throw e; }
      );
    };
  }
} catch (e) {
  console.warn('Supabase builder shim not applied:', e?.message);
}

// Service role client — full access, used server-side only
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

module.exports = supabase;
