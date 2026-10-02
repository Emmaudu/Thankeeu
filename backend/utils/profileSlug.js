// ═══════════════════════════════════════════════════════════════════════
// Tasker profile links — one permanent, readable link per tasker:
//     /tasker/<profile_slug>        e.g. /tasker/emmanuel-uduebholo
// Mirrors database/PROFILE_LINKS_MIGRATION.sql exactly. The slug is assigned
// once and never changes (shared links keep working after a name edit).
// Everything here degrades gracefully if the migration has not run yet.
// ═══════════════════════════════════════════════════════════════════════
const supabase = require('./supabase');

const RESERVED = new Set(['login', 'signup', 'dashboard', 'register', 'profile', 'settings', 'new', 'me']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Accents are removed first (é→e, ọ→o, ṣ→s) so Yoruba/Igbo/French names stay readable.
const clean = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function baseSlug(fullName, username) {
  let base = clean(fullName) || clean(username) || 'tasker';
  base = base.slice(0, 60).replace(/^-+|-+$/g, '') || 'tasker';
  if (RESERVED.has(base)) base = `${base}-tasker`;
  return base;
}

const missingColumn = (err) => /profile_slug/i.test(err?.message || '');

/**
 * Return the tasker's slug, creating it if missing. Never throws.
 * @returns {Promise<string|null>} null if the user isn't a tasker or the column doesn't exist yet
 */
async function ensureProfileSlug(userId) {
  try {
    const { data: u, error } = await supabase.from('users')
      .select('id, role, full_name, username, profile_slug').eq('id', userId).maybeSingle();
    if (error) { if (!missingColumn(error)) console.warn('ensureProfileSlug read:', error.message); return null; }
    if (!u || u.role !== 'tasker') return null;
    if (u.profile_slug) return u.profile_slug;

    const base = baseSlug(u.full_name, u.username);
    for (let n = 1; n <= 200; n++) {
      const candidate = n === 1 ? base : `${base}-${n}`;
      const { data: taken } = await supabase.from('users').select('id')
        .eq('role', 'tasker').eq('profile_slug', candidate).limit(1);
      if (taken?.length) continue;
      const { data: set, error: setErr } = await supabase.from('users')
        .update({ profile_slug: candidate })
        .eq('id', u.id).is('profile_slug', null)
        .select('profile_slug');
      if (setErr) {
        if (setErr.code === '23505') continue;          // someone took it a moment ago
        console.warn('ensureProfileSlug write:', setErr.message);
        return null;
      }
      if (set?.length) return set[0].profile_slug;
      // Another request assigned a slug concurrently — read it back.
      const { data: again } = await supabase.from('users').select('profile_slug').eq('id', u.id).maybeSingle();
      return again?.profile_slug || null;
    }
    return null;
  } catch (e) {
    console.warn('ensureProfileSlug error:', e?.message);
    return null;
  }
}

/** Map of user id → profile_slug for many users. Never throws. */
async function getProfileSlugs(userIds) {
  const ids = [...new Set((userIds || []).filter((x) => x && UUID_RE.test(x)))];
  const map = new Map();
  if (!ids.length) return map;
  try {
    const { data, error } = await supabase.from('users').select('id, profile_slug').in('id', ids);
    if (error) return map;
    for (const r of data || []) if (r.profile_slug) map.set(r.id, r.profile_slug);
  } catch (_) { /* column missing → no slugs, links fall back to ids */ }
  return map;
}

/** Look a tasker up by slug. Returns user id or null. Never throws. */
async function findTaskerBySlug(slug) {
  try {
    const { data, error } = await supabase.from('users').select('id')
      .eq('role', 'tasker').eq('profile_slug', String(slug).toLowerCase()).limit(1);
    if (error) return null;
    return data?.[0]?.id || null;
  } catch (_) { return null; }
}

module.exports = { baseSlug, ensureProfileSlug, getProfileSlugs, findTaskerBySlug, RESERVED };
