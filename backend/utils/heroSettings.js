// heroSettings.js — the homepage hero text an admin can edit (Admin → Header).
// Stored in site_settings as three keys. NULL / missing = the homepage uses
// its built-in default copy, so an empty table changes nothing.

const supabase = require('./supabase');

const HERO_KEYS = {
  title: 'hero_title',
  subtitle: 'hero_subtitle',
  tagline: 'hero_tagline',
};

const LIMITS = { title: 160, subtitle: 400, tagline: 160 };

// Placeholder the homepage replaces with its rotating word
// ("Birthday", "Farewell", …). Optional; at most once.
const WORD_TOKEN = '{word}';

async function readHero() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value, updated_at')
    .in('key', Object.values(HERO_KEYS));
  if (error) throw error;
  const out = { title: null, subtitle: null, tagline: null, updated_at: null };
  for (const row of data || []) {
    const field = Object.keys(HERO_KEYS).find(k => HERO_KEYS[k] === row.key);
    if (!field) continue;
    out[field] = row.value && String(row.value).trim() ? row.value : null;
    if (row.updated_at && (!out.updated_at || row.updated_at > out.updated_at)) out.updated_at = row.updated_at;
  }
  return out;
}

/**
 * Validate an admin payload. Returns { values } or { error }.
 * '' / null / whitespace → null (= back to the default text).
 */
function validateHeroInput(body = {}) {
  const values = {};
  for (const field of Object.keys(HERO_KEYS)) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
    const raw = body[field];
    if (raw == null) { values[field] = null; continue; }
    if (typeof raw !== 'string') return { error: `${field} must be text` };
    // Collapse control characters (keep plain newlines out of a one-line heading).
    const clean = raw.replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    if (!clean) { values[field] = null; continue; }
    if (clean.length > LIMITS[field]) return { error: `${field} is too long (max ${LIMITS[field]} characters)` };
    if (field === 'title' && clean.split(WORD_TOKEN).length > 2) {
      return { error: `Use ${WORD_TOKEN} at most once in the title` };
    }
    values[field] = clean;
  }
  if (!Object.keys(values).length) return { error: 'Nothing to save' };
  return { values };
}

async function writeHero(values) {
  const now = new Date().toISOString();
  const rows = Object.entries(values).map(([field, value]) => ({
    key: HERO_KEYS[field], value, updated_at: now,
  }));
  const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
  if (error) throw error;
  return readHero();
}

module.exports = { HERO_KEYS, LIMITS, WORD_TOKEN, readHero, validateHeroInput, writeHero };
