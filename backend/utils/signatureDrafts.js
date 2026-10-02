/**
 * signatureDrafts.js — keep a signer's unfinished signature so it is not lost.
 *
 * The signing page saves what the person has written every few seconds and
 * once more when the page is closed (see frontend utils/signatureDraft.js).
 * When the real signature is saved, the draft is marked 'posted'. A draft
 * that is still 'draft' means the person left before their signature went
 * through; an admin can post it for them from the card details page.
 *
 * The text, name and email are kept, plus any photos, GIFs, videos and voice
 * notes (uploaded as they were attached, see POST /draft/media). A gift in a
 * draft is only what they had chosen; nothing is charged.
 */
const crypto = require('crypto');
const supabase = require('./supabase');

const TABLE = 'signature_drafts';
const KEY_RE = /^[a-f0-9]{32}$/;
const MAX_CONTENT = 1500;
const MAX_OPEN_DRAFTS_PER_CARD = 300;
// New drafts (not updates) per IP per card per hour, so one person cannot
// fill a card's draft list. A real signer makes one, or a few across tabs.
const NEW_DRAFTS_PER_HOUR = 15;
const newDraftLog = new Map(); // `${ip}|${cardId}` → [times]
function allowNewDraft(ip, cardId, now = Date.now()) {
  const k = `${ip || '?'}|${cardId}`;
  const times = (newDraftLog.get(k) || []).filter(t => now - t < 3600000);
  if (times.length >= NEW_DRAFTS_PER_HOUR) { newDraftLog.set(k, times); return false; }
  times.push(now);
  newDraftLog.set(k, times);
  if (newDraftLog.size > 50000) newDraftLog.delete(newDraftLog.keys().next().value);
  return true;
}

const isMissingTable = (e) => !!e && (e.code === '42P01' || e.code === 'PGRST205'
  || /relation .*signature_drafts.* does not exist|could not find the table/i.test(e.message || ''));
const isMissingColumn = (e) => !!e && (e.code === '42703' || /column .* does not exist/i.test(e.message || ''));

const clean = (v, max) => String(v ?? '').replace(/<[^>]+>/g, '').replace(/on\w+\s*=/gi, '').trim().slice(0, max);
const bool = (v) => v === true || v === 'true' || v === '1';
const num = (v) => (v === '' || v == null || !Number.isFinite(Number(v)) ? null : Number(v));

const MEDIA_TYPES = new Set(['image', 'gif', 'video', 'voice']);
// Our Cloudinary account (or local /uploads in development) only.
function isOurUpload(url, front) {
  const cloud = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  const cloudPrefix = cloud ? `https://res.cloudinary.com/${cloud}/` : 'https://res.cloudinary.com/';
  return url.startsWith(cloudPrefix) || (!!front && url.startsWith(`${front}/uploads/`));
}
/**
 * Files the signer attached, already uploaded through POST /draft/media.
 * Only our own upload locations are accepted.
 */
function cleanMedia(raw) {
  if (!Array.isArray(raw)) return [];
  const front = require('./lemonSqueezy').frontendUrl();
  return raw.slice(0, 10).map(m => ({ url: String(m?.url || ''), type: String(m?.type || ''), name: clean(m?.name, 120) || null }))
    .filter(m => MEDIA_TYPES.has(m.type) && isOurUpload(m.url, front))
    .map(m => ({ ...m, url: m.url.slice(0, 600) }));
}

/** What the signer wanted to give (never charged from a draft). */
function cleanGift(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const out = {};
  const ngn = num(raw.amount_ngn);
  if (ngn != null && ngn > 0 && ngn < 1e9) out.amount_ngn = Math.round(ngn * 100) / 100;
  if (/^[A-Z]{3}$/.test(String(raw.currency || ''))) out.currency = raw.currency;
  if (raw.display) out.display = clean(raw.display, 40);
  if (raw.product && typeof raw.product === 'object') {
    out.product = { vendor: clean(raw.product.vendor, 120) || null, name: clean(raw.product.name, 160) || null, price: num(raw.product.price) };
  }
  return Object.keys(out).length ? out : null;
}

/** Pick only the layout fields we know how to use later. */
function cleanExtra(raw) {
  const x = raw && typeof raw === 'object' ? raw : {};
  const out = {};
  if (['album_new', 'album_legacy', 'standard'].includes(x.layout)) out.layout = x.layout;
  for (const k of ['position_x', 'position_y', 'rotation', 'font_size']) {
    const n = num(x[k]);
    if (n != null && Math.abs(n) < 100000) out[k] = n;
  }
  if (typeof x.font_color === 'string' && /^#?[0-9a-z(),.\s%]{1,40}$/i.test(x.font_color)) out.font_color = x.font_color;
  return out;
}

/**
 * Create or update a draft. Returns { status, body } for the route.
 * A draft that has already been posted or discarded is never changed again.
 */
async function saveDraft(cardSlug, body = {}, { ip } = {}) {
  const key = String(body.draft_key || '');
  if (!KEY_RE.test(key)) return { status: 400, body: { error: 'Invalid draft' } };
  const content = String(body.content ?? '').slice(0, MAX_CONTENT);
  const media = cleanMedia(body.media);
  // A signature needs words; attached files are kept alongside them.
  if (!content.trim()) return { status: 200, body: { ok: true, skipped: true } };

  const { data: card, error: cErr } = await supabase.from('cards')
    .select('id, status, allow_private_messages').eq('slug', cardSlug).maybeSingle();
  if (cErr) throw cErr;
  if (!card) return { status: 404, body: { error: 'Card not found' } };
  if (card.status === 'draft') return { status: 403, body: { error: 'Card is not yet active' } };

  const email = clean(body.author_email, 254).toLowerCase();
  const gift = num(body.gift_intent);
  const fields = {
    author_name: clean(body.author_name, 80) || null,
    author_email: email || null,
    content,
    is_private: card.allow_private_messages ? bool(body.is_private) : false,
    font_style: clean(body.font_style, 40) || null,
    extra: { ...cleanExtra(body.extra), ...(cleanGift(body.gift) ? { gift: cleanGift(body.gift) } : {}) },
    has_media: bool(body.has_media) || media.length > 0,
    media,
    gift_intent: gift != null && gift > 0 && gift < 1e9 ? Math.round(gift * 100) / 100 : null,
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: gErr } = await supabase.from(TABLE)
    .select('id, card_id, status').eq('draft_key', key).maybeSingle();
  if (gErr) {
    if (isMissingTable(gErr)) return { status: 200, body: { ok: false, unavailable: true } };
    throw gErr;
  }
  if (existing) {
    if (existing.card_id !== card.id) return { status: 409, body: { error: 'Invalid draft' } };
    if (existing.status !== 'draft') return { status: 200, body: { ok: true, status: existing.status } };
    let { error } = await supabase.from(TABLE).update(fields)
      .eq('id', existing.id).eq('status', 'draft');
    if (error && isMissingColumn(error)) {
      const { media: _m, ...rest } = fields;
      ({ error } = await supabase.from(TABLE).update(rest).eq('id', existing.id).eq('status', 'draft'));
    }
    if (error) throw error;
    return { status: 200, body: { ok: true, status: 'draft' } };
  }

  // The page-close save can arrive after the signature itself was saved. If
  // this exact message is already on the card, there is nothing to keep.
  if (fields.author_email && content.trim()) {
    const { data: same } = await supabase.from('messages').select('id, content')
      .eq('card_id', card.id).eq('author_email', fields.author_email);
    if ((same || []).some(m => String(m.content || '').trim() === content.trim())) {
      return { status: 200, body: { ok: true, status: 'posted' } };
    }
  }

  // Stop one card's table being flooded with drafts.
  const { count } = await supabase.from(TABLE).select('id', { count: 'exact', head: true })
    .eq('card_id', card.id).eq('status', 'draft');
  if (Number(count) >= MAX_OPEN_DRAFTS_PER_CARD) return { status: 429, body: { error: 'Too many drafts on this card' } };
  if (!allowNewDraft(ip, card.id)) return { status: 429, body: { error: 'Too many drafts' } };

  let { error: iErr } = await supabase.from(TABLE).insert({ ...fields, card_id: card.id, draft_key: key, status: 'draft' });
  if (iErr && isMissingColumn(iErr)) {
    const { media: _m, ...rest } = fields; // migration for attachments not run yet
    ({ error: iErr } = await supabase.from(TABLE).insert({ ...rest, card_id: card.id, draft_key: key, status: 'draft' }));
  }
  if (iErr) {
    // Two saves raced; the other one created the row. Update it instead.
    if (iErr.code === '23505') return saveDraft(cardSlug, body, { ip });
    throw iErr;
  }
  return { status: 201, body: { ok: true, status: 'draft' } };
}

/**
 * The real signature was saved: close the signer's draft, plus any other open
 * draft on this card from the same email (written on another device or tab).
 * Best effort; never throws.
 */
async function closeDraftsForMessage(cardId, message, draftKey) {
  if (!cardId || !message?.id) return;
  const patch = { status: 'posted', message_id: message.id, posted_by: 'signer', posted_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  try {
    if (KEY_RE.test(String(draftKey || ''))) {
      const { error } = await supabase.from(TABLE).update(patch)
        .eq('draft_key', draftKey).eq('card_id', cardId).eq('status', 'draft');
      if (error && !isMissingTable(error)) console.warn('[drafts] close by key:', error.message);
      if (error && isMissingTable(error)) return;
    }
    // Another tab or device with the same email and the same text. The email
    // is not verified, so a different text is never closed this way.
    const email = String(message.author_email || '').trim().toLowerCase();
    const text = String(message.content || '').trim();
    if (email && text) {
      const { data: open, error } = await supabase.from(TABLE).select('id, content')
        .eq('card_id', cardId).eq('author_email', email).eq('status', 'draft');
      if (error && !isMissingTable(error)) console.warn('[drafts] close by email:', error.message);
      for (const d of open || []) {
        if (String(d.content || '').trim() !== text) continue;
        await supabase.from(TABLE).update(patch).eq('id', d.id).eq('status', 'draft');
      }
    }
  } catch (e) { console.warn('[drafts] close failed:', e.message); }
}

/** Open drafts for a card (newest first). [] if the table does not exist yet. */
async function listOpenDrafts(cardId) {
  const { data, error } = await supabase.from(TABLE)
    .select('*')
    .eq('card_id', cardId).in('status', ['draft', 'posting']).order('updated_at', { ascending: false });
  if (error) { if (!isMissingTable(error)) console.warn('[drafts] list:', error.message); return []; }
  return (data || []).map(({ draft_key: _k, ...d }) => ({ ...d, media: Array.isArray(d.media) ? d.media : [] }));
}

/** { card_id: number of open drafts } across all cards. */
async function openDraftCounts() {
  const { data, error } = await supabase.from(TABLE).select('card_id').eq('status', 'draft').limit(10000);
  if (error) return {};
  const out = {};
  for (const r of data || []) out[r.card_id] = (out[r.card_id] || 0) + 1;
  return out;
}

/** Insert a message, dropping optional columns this database does not have yet. */
async function insertMessage(core, optional) {
  const attempts = [{ ...core, ...optional }];
  const { edit_token, font_style, media_url, media_type, media_gallery } = optional;
  const mediaCore = { ...(media_url ? { media_url, media_type } : {}) };
  attempts.push({ ...core, ...mediaCore, ...(media_gallery ? { media_gallery } : {}), ...(edit_token ? { edit_token } : {}), ...(font_style ? { font_style } : {}) });
  attempts.push({ ...core, ...mediaCore, ...(font_style ? { font_style } : {}) });
  attempts.push({ ...core, ...mediaCore });
  let last;
  for (const a of attempts) {
    const { data, error } = await supabase.from('messages').insert(a).select().maybeSingle();
    if (!error) return data;
    last = error;
    if (!isMissingColumn(error)) break;
  }
  throw last;
}

/**
 * Admin: post a draft to the card as the signer's signature.
 * Returns { status, body }.
 */
async function postDraft(cardId, draftId) {
  // Claim it first so two clicks can never post it twice.
  const { data: claimed, error: clErr } = await supabase.from(TABLE)
    .update({ status: 'posting', updated_at: new Date().toISOString() })
    .eq('id', draftId).eq('card_id', cardId).eq('status', 'draft').select('*');
  if (clErr) {
    if (isMissingTable(clErr)) return { status: 503, body: { error: 'Run database/migration_signature_drafts.sql first.' } };
    throw clErr;
  }
  let draft = claimed?.[0];
  if (!draft) {
    // A post that crashed half way leaves 'posting' behind; take it over after 2 minutes.
    const { data: row } = await supabase.from(TABLE).select('id, status, updated_at')
      .eq('id', draftId).eq('card_id', cardId).maybeSingle();
    if (row?.status === 'posting' && Date.now() - new Date(row.updated_at).getTime() > 2 * 60 * 1000) {
      const { data: again } = await supabase.from(TABLE)
        .update({ status: 'posting', updated_at: new Date().toISOString() })
        .eq('id', row.id).eq('status', 'posting').eq('updated_at', row.updated_at).select('*');
      draft = again?.[0];
    }
  }
  if (!draft) return { status: 409, body: { error: 'This draft was already posted or removed. Refresh the page.' } };

  const release = () => supabase.from(TABLE).update({ status: 'draft', updated_at: new Date().toISOString() })
    .eq('id', draft.id).eq('status', 'posting').then(() => {}, () => {});

  try {
    const { data: card, error: cErr } = await supabase.from('cards')
      .select('id, slug, status, title, recipient_name, creator_id, created_by_member_id, company_id, allow_private_messages')
      .eq('id', cardId).maybeSingle();
    if (cErr) throw cErr;
    if (!card) { await release(); return { status: 404, body: { error: 'Card not found' } }; }
    if (card.status === 'draft') { await release(); return { status: 409, body: { error: 'This card is not published yet.' } }; }

    const content = String(draft.content || '').trim();
    if (!content) { await release(); return { status: 400, body: { error: 'This draft has no message to post.' } }; }

    // The same person may have signed after all (another device, or the
    // response was lost). Link to that signature instead of posting twice.
    const email = String(draft.author_email || '').trim().toLowerCase();
    if (email) {
      const { data: same } = await supabase.from('messages').select('id, content')
        .eq('card_id', card.id).eq('author_email', email);
      const match = (same || []).find(m => String(m.content || '').trim() === content);
      if (match) {
        await supabase.from(TABLE).update({ status: 'posted', message_id: match.id, posted_by: 'signer', posted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', draft.id);
        return { status: 200, body: { ok: true, already_signed: true, message_id: match.id } };
      }
    }

    const name = String(draft.author_name || '').trim() || (email ? email.split('@')[0] : '') || 'A friend';
    const extra = draft.extra || {};
    const optional = {
      edit_token: crypto.randomBytes(24).toString('hex'),
      font_style: draft.font_style || 'handwritten',
    };
    const media = Array.isArray(draft.media) ? draft.media.filter(m => m?.url && MEDIA_TYPES.has(m.type)) : [];
    if (media.length) {
      optional.media_url = media[0].url;
      optional.media_type = media[0].type;
      if (media.length > 1) optional.media_gallery = JSON.stringify(media.slice(1).map(m => ({ media_url: m.url, media_type: m.type })));
    }
    for (const k of ['position_x', 'position_y', 'rotation', 'font_size', 'font_color']) {
      if (extra[k] != null) optional[k] = extra[k];
    }
    if (extra.layout === 'album_new' || extra.layout === 'album_legacy') {
      // Page numbers move on as others sign, so work it out now.
      const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('card_id', card.id);
      const n = Number(count) || 0;
      optional.page_number = extra.layout === 'album_new' ? n + 1 : Math.ceil((n + 1) / 5);
      if (extra.layout === 'album_new') { optional.position_x = 50; optional.position_y = 50; }
    }

    const message = await insertMessage({
      card_id: card.id,
      author_name: name.slice(0, 80),
      author_email: email || null,
      content: content.slice(0, MAX_CONTENT),
      is_private: card.allow_private_messages ? !!draft.is_private : false,
    }, optional);

    const { error: mErr } = await supabase.from(TABLE).update({
      status: 'posted', message_id: message.id, posted_by: 'admin',
      posted_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', draft.id).eq('status', 'posting');
    if (mErr) console.error('[drafts] posted but not marked', draft.id, mErr.message);

    return { status: 201, body: { ok: true, message_id: message.id }, card, message, draft };
  } catch (e) {
    await release();
    throw e;
  }
}

/** Admin: remove a draft from the list (kept in the table as 'discarded'). */
async function discardDraft(cardId, draftId) {
  const { data, error } = await supabase.from(TABLE)
    .update({ status: 'discarded', updated_at: new Date().toISOString() })
    .eq('id', draftId).eq('card_id', cardId).eq('status', 'draft').select('id');
  if (error) {
    if (isMissingTable(error)) return { status: 503, body: { error: 'Run database/migration_signature_drafts.sql first.' } };
    throw error;
  }
  if (!data?.length) return { status: 409, body: { error: 'This draft was already posted or removed. Refresh the page.' } };
  return { status: 200, body: { ok: true } };
}

function _resetForTests() { newDraftLog.clear(); }

module.exports = {
  _resetForTests, KEY_RE, cleanMedia, saveDraft, closeDraftsForMessage, listOpenDrafts, openDraftCounts, postDraft, discardDraft,
};
