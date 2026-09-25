// announcementSettings.js — the site-wide announcement bar an admin sets in
// Admin → Discount Codes → "Announcement banner". It sits above the navbar on
// every public page and can link somewhere (a new feature, a blog post, …).
//
// Stored as ONE JSON row in site_settings (key 'announcement_banner') so the
// text, link and on/off switch always change together. A missing row or bad
// JSON simply means "no announcement" — it can never break a page.

const supabase = require('./supabase');

const KEY = 'announcement_banner';
const LIMITS = { text: 200, link_label: 40, link_url: 500 };
const THEMES = ['purple', 'dark', 'green', 'orange', 'pink', 'blue'];

const EMPTY = {
  enabled: false, text: '', link_url: '', link_label: '', new_tab: false,
  theme: 'purple', dismissible: true, starts_at: null, ends_at: null, updated_at: null,
};

const oneLine = (s) => String(s).replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

/** Only http(s) URLs or a site path ("/pricing"). Never javascript:, data:, //host. */
function cleanLink(raw) {
  const s = oneLine(raw || '');
  if (!s) return { value: '' };
  if (s.length > LIMITS.link_url) return { error: `Link is too long (max ${LIMITS.link_url} characters)` };
  if (s.startsWith('/') && !s.startsWith('//') && !s.startsWith('/\\')) return { value: s };
  let u;
  try { u = new URL(s); } catch { return { error: 'Link must start with https:// or be a page path like /pricing' }; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return { error: 'Link must start with https:// or be a page path like /pricing' };
  return { value: u.toString() };
}

function parseDate(raw, field) {
  if (raw == null || raw === '') return { value: null };
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return { error: `${field} is not a valid date` };
  return { value: d.toISOString() };
}

function normalise(obj) {
  const o = { ...EMPTY, ...(obj && typeof obj === 'object' ? obj : {}) };
  if (!THEMES.includes(o.theme)) o.theme = 'purple';
  o.enabled = o.enabled === true;
  o.new_tab = o.new_tab === true;
  o.dismissible = o.dismissible !== false;
  return o;
}

async function readAnnouncement() {
  const { data, error } = await supabase.from('site_settings')
    .select('value, updated_at').eq('key', KEY).maybeSingle();
  if (error) throw error;
  if (!data || !data.value) return { ...EMPTY };
  let parsed;
  try { parsed = JSON.parse(data.value); } catch { return { ...EMPTY }; }
  return normalise({ ...parsed, updated_at: data.updated_at || parsed.updated_at || null });
}

/** Is it live right now? (enabled, has text, inside its optional window) */
function isLive(a, now = new Date()) {
  if (!a || !a.enabled || !a.text) return false;
  if (a.starts_at && new Date(a.starts_at) > now) return false;
  if (a.ends_at && new Date(a.ends_at) <= now) return false;
  return true;
}

/** Validate an admin payload → { values } | { error }. */
function validateAnnouncementInput(body = {}) {
  const text = oneLine(body.text || '');
  if (text.length > LIMITS.text) return { error: `Text is too long (max ${LIMITS.text} characters)` };
  const enabled = body.enabled === true;
  if (enabled && !text) return { error: 'Write the announcement text before turning it on' };

  const link = cleanLink(body.link_url);
  if (link.error) return { error: link.error };
  const label = oneLine(body.link_label || '');
  if (label.length > LIMITS.link_label) return { error: `Button text is too long (max ${LIMITS.link_label} characters)` };

  const theme = THEMES.includes(body.theme) ? body.theme : 'purple';
  const s = parseDate(body.starts_at, 'Start date'); if (s.error) return { error: s.error };
  const e = parseDate(body.ends_at, 'End date');     if (e.error) return { error: e.error };
  if (s.value && e.value && new Date(e.value) <= new Date(s.value)) return { error: 'End date must be after the start date' };

  return {
    values: {
      enabled, text, link_url: link.value, link_label: link.value ? label : '',
      new_tab: link.value ? body.new_tab === true : false,
      theme, dismissible: body.dismissible !== false,
      starts_at: s.value, ends_at: e.value,
    },
  };
}

async function writeAnnouncement(values) {
  const now = new Date().toISOString();
  const { error } = await supabase.from('site_settings')
    .upsert([{ key: KEY, value: JSON.stringify(values), updated_at: now }], { onConflict: 'key' });
  if (error) throw error;
  return readAnnouncement();
}

/** What visitors get: null unless live. updated_at doubles as the dismiss key,
 *  so editing the banner shows it again to people who closed the old one. */
function publicView(a) {
  if (!isLive(a)) return null;
  return {
    text: a.text, link_url: a.link_url || null, link_label: a.link_label || null,
    new_tab: a.new_tab, theme: a.theme, dismissible: a.dismissible,
    ends_at: a.ends_at, version: a.updated_at || 'v',
  };
}

module.exports = { KEY, LIMITS, THEMES, EMPTY, readAnnouncement, validateAnnouncementInput, writeAnnouncement, isLive, publicView, cleanLink };
