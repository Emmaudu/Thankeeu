/**
 * signatureDraft.js — keep an unfinished signature safe.
 *
 * While someone writes on a group card, what they have written is:
 *   • kept in this browser, so it comes back if the page is reloaded;
 *   • saved to the server every few seconds and once more when the page is
 *     closed or hidden, so an admin can post it if they never finish.
 * When the signature is submitted, the server closes the draft (the submit
 * sends draft_key) and markSubmitted() clears the local copy.
 *
 * Attached files (photos, GIFs, videos, voice notes) are uploaded as soon
 * as they are added, so the draft keeps them too. A gift the signer chose is
 * recorded (never charged) so the admin can follow up.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

const API = import.meta.env.VITE_API_URL || '/api';
const SAVE_DELAY_MS = 3000;
const storageKey = (slug) => `tk_sig_draft_${slug}`;

function newKey() {
  const bytes = new Uint8Array(16);
  (globalThis.crypto || window.crypto).getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function readLocal(slug) {
  try {
    const v = JSON.parse(localStorage.getItem(storageKey(slug)) || 'null');
    return v && /^[a-f0-9]{32}$/.test(v.key || '') ? v : null;
  } catch { return null; }
}
function writeLocal(slug, value) {
  try { localStorage.setItem(storageKey(slug), JSON.stringify(value)); } catch { /* private mode */ }
}
function clearLocal(slug) {
  try { localStorage.removeItem(storageKey(slug)); } catch { /* private mode */ }
}

/** The unsent message saved in this browser for this card, if any. */
export function readSavedSignature(slug) {
  const v = slug ? readLocal(slug) : null;
  return v && typeof v.content === 'string' && v.content.trim() ? v : null;
}

const draftUrl = (slug) => `${API}/messages/${encodeURIComponent(slug)}/draft`;
async function postDraft(slug, body) {
  const r = await fetch(draftUrl(slug), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  if (!r.ok) return { ok: false };
  const j = await r.json().catch(() => ({}));
  return { ok: true, status: j.status || 'draft' };
}

/**
 * Ask the server whether a saved message already went through.
 * Resolves 'posted' (it is on the card), 'discarded', 'draft' or 'unknown'.
 */
export async function checkSavedSignature(slug, saved) {
  if (!slug || !saved?.key) return 'unknown';
  try {
    const { key, ...rest } = saved;
    const r = await postDraft(slug, JSON.stringify({ draft_key: key, ...rest }));
    return r.ok ? r.status : 'unknown';
  } catch { return 'unknown'; }
}

/**
 * @param {string}  slug
 * @param {object}  draft    { author_name, author_email, content, is_private, font_style, has_media, gift_intent, extra }
 * @param {boolean} enabled  false while the card is loading, after submit, etc.
 * @param {Array}   files    the signer's attachments: [{ file: File, type }]
 * @returns {{ draftKey: () => string, markSubmitted: (submittedContent: string) => void }}
 */
export function useSignatureDraft(slug, draft, enabled = true, files = []) {
  const keyRef = useRef(null);
  const sentRef = useRef('');        // last payload the server has
  const latestRef = useRef(null);    // latest payload (for the page-close save)
  const submittedRef = useRef(null); // text just submitted: never save it as a new draft
  const timerRef = useRef(null);

  if (!keyRef.current && slug) keyRef.current = readLocal(slug)?.key || newKey();

  // Upload each attachment once, in the background.
  const uploadsRef = useRef(new WeakMap()); // File → { state, item }
  const [, setUploadTick] = useState(0);
  useEffect(() => {
    if (!enabled || !slug) return;
    for (const f of files || []) {
      if (!f?.file || uploadsRef.current.has(f.file)) continue;
      uploadsRef.current.set(f.file, { state: 'uploading' });
      const fd = new FormData();
      fd.append('media', f.file);
      // The key goes in the URL so the server can check it before accepting the file.
      fetch(`${API}/messages/${encodeURIComponent(slug)}/draft/media?k=${keyRef.current}`, { method: 'POST', body: fd })
        .then(r => (r.ok ? r.json() : null))
        .then(j => {
          const item = j?.files?.[0];
          uploadsRef.current.set(f.file, item ? { state: 'done', item } : { state: 'failed' });
          setUploadTick(t => t + 1);
        })
        .catch(() => { uploadsRef.current.set(f.file, { state: 'failed' }); setUploadTick(t => t + 1); });
    }
  }, [files, enabled, slug]);
  const media = (files || []).map(f => f?.file && uploadsRef.current.get(f.file)).filter(x => x?.state === 'done').map(x => x.item);

  const content = String(draft?.content || '');
  if (submittedRef.current !== null && content !== submittedRef.current) submittedRef.current = null;
  const payload = enabled && slug && (content.trim() || media.length) && submittedRef.current === null
    ? JSON.stringify({ draft_key: keyRef.current, ...draft, media })
    : null;
  latestRef.current = payload;

  // Local copy straight away; server copy a few seconds after typing stops.
  useEffect(() => {
    if (!payload) return undefined;
    writeLocal(slug, { key: keyRef.current, ...draft });
    if (payload === sentRef.current) return undefined;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const body = payload;
      try {
        const r = await postDraft(slug, body);
        if (!r.ok) return;
        sentRef.current = body;
        if (r.status !== 'posted' && r.status !== 'discarded') return;
        // This key is closed (that signature was posted or removed), so the
        // text being written now needs a draft of its own. Save it once more
        // under a new key. If the server still says posted, this exact text
        // is already on the card and there is nothing to keep.
        keyRef.current = newKey();
        const fresh = JSON.stringify({ ...JSON.parse(body), draft_key: keyRef.current });
        const again = await postDraft(slug, fresh);
        if (!again.ok) return;
        sentRef.current = fresh;
        if (again.status === 'posted') {
          submittedRef.current = String(draft?.content || '');
          clearLocal(slug);
        } else {
          writeLocal(slug, { key: keyRef.current, ...draft });
        }
      } catch { /* offline: the page-close save will try again */ }
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, slug]);

  // Last chance when the page is closed, hidden or the phone switches app.
  useEffect(() => {
    if (!slug) return undefined;
    const flush = () => {
      const body = latestRef.current;
      if (!body || body === sentRef.current) return;
      const url = draftUrl(slug);
      // text/plain keeps this a simple request (no CORS preflight), which
      // sendBeacon needs to be delivered while the page is unloading.
      const blob = new Blob([body], { type: 'text/plain' });
      let queued = false;
      try { queued = !!navigator.sendBeacon?.(url, blob); } catch { queued = false; }
      if (!queued) {
        try { fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body, keepalive: true }).catch(() => {}); } catch { /* ignore */ }
      }
      sentRef.current = body;
    };
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [slug]);

  const draftKey = useCallback(() => keyRef.current || '', []);

  /** Call once the signature is saved. The next signature gets a new draft. */
  const markSubmitted = useCallback((submittedContent = '') => {
    clearTimeout(timerRef.current);
    clearLocal(slug);
    sentRef.current = '';
    latestRef.current = null;
    keyRef.current = newKey();
    submittedRef.current = String(submittedContent ?? '');
  }, [slug]);

  /**
   * When every attachment is already uploaded, their URLs in order (the
   * submit can send these instead of uploading the same files again);
   * otherwise null.
   */
  const preparedMedia = useCallback((list) => {
    const items = (list || []).map(f => f?.file && uploadsRef.current.get(f.file));
    if (!items.length || items.some(x => x?.state !== 'done')) return null;
    return items.map(x => x.item);
  }, []);

  return { draftKey, markSubmitted, preparedMedia };
}
