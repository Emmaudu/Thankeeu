/**
 * DashboardSendMoney — money tucked inside a single greeting card.
 *
 * Two steps, both inside the dashboard (never a separate wizard route):
 *
 *   Step 1  Compose      left: design → who it's for → message → media
 *                        right: the live album preview
 *   Step 2  Add money    the amount, then pay once for the gift AND the card
 *                        fee. On success the amount appears on the card and
 *                        the sender presses Send.
 *
 * The money never touches this component's state as a source of truth: the
 * server recomputes the charge from the stored row (moneyTransferController),
 * so nothing here can change what a sender is billed.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSEO } from '../../hooks/useSEO';
import DashboardLayout from '../../components/DashboardLayout';
import Icon from '../../components/ui/Icon';
import CardCoverPreview from '../../components/CardCoverPreview';
import GifPicker from '../../components/GifPicker';
import MediaSwiper from '../../components/MediaSwiper';
import VoiceRecorder from '../../components/VoiceRecorder';
import { moneyAPI } from '../../utils/api';
import { openFlwCheckout } from '../../utils/flwInline';
import { CARD_DESIGNS, FONT_STYLES, getCardDesign, getFontStyle } from '../../utils/cardDesigns';
import { OCCASION_FILTERS, getOccasionLabel } from '../../utils/occasionCardDesigns';
import { ALBUM_FLIP_CSS, ALBUM_FLIP_DURATION_MS } from '../../utils/albumFlip';
import { ALBUM_THEMES, getAlbumTheme, getContrastTextColor, getAlbumInk } from '../../utils/albumThemes';
import { readableTextColor } from '../../utils/textContrast';
import { COVER_TEXT_SWATCHES } from '../../utils/coverLayout';
import { messageMediaItems } from '../../utils/messageMedia';
import { formatNGN } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';

// Occasions come from the real catalogue (OCCASION_FILTERS) so Leaving,
// Birthday, Retirement and the rest stay in step with the card designs that
// actually exist — no hand-kept second list to drift.
const OCCASIONS = OCCASION_FILTERS.filter(o => o.id !== 'all');

const QUICK_AMOUNTS = [5000, 10000, 25000, 50000, 100000];
const MIN_GIFT = 500;
const CARD_FEE = 500; // display only — the server is authoritative

// Photo and video come off the device. GIF opens the searchable Giphy picker
// and voice records in the browser — neither should ask a sender to go and
// find a file, which is what a file input forces them to do.
const MEDIA_KINDS = [
  { type: 'image', icon: 'Image', label: 'Photo',  accept: 'image/*', mode: 'file' },
  { type: 'video', icon: 'Film',  label: 'Video',  accept: 'video/*', mode: 'file' },
  { type: 'gif',   icon: 'Sparkles', label: 'GIF',  mode: 'gif' },
  { type: 'voice', icon: 'Mic',   label: 'Voice note', mode: 'record' },
];

export default function DashboardSendMoney() {
  useSEO({ title: 'Send Money — Thankeeu', noIndex: true });
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();

  const [step, setStep]         = useState(1);
  const [saving, setSaving]     = useState(false);
  const [paying, setPaying]     = useState(false);
  const [slug, setSlug]         = useState(params.get('draft') || null);
  const [sent, setSent]         = useState(false);
  const [previewPage, setPreviewPage] = useState(0);   // 0 = cover, 1 = their page
  const [previewFlip, setPreviewFlip] = useState('');
  const [gifOpen, setGifOpen]     = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const fileRef = useRef(null);
  const pendingKind = useRef('image');

  // Same resolution the public creation wizard uses: real covers for this
  // occasion, falling back to the general pool when an occasion has none.
  // Declared as a plain function so `form` can be defined first — a useMemo
  // reading `form` above the useState that creates it is a temporal-dead-zone
  // crash on first render.
  const designsFor = (occasionId) => {
    const forOccasion = CARD_DESIGNS.filter(d => (d.artwork || d.image) && d.occasion === occasionId);
    return forOccasion.length ? forOccasion : CARD_DESIGNS.filter(d => d.artwork || d.image).slice(0, 24);
  };

  const [form, setForm] = useState({
    design_theme: designsFor('birthday')[0]?.id || 'birthday-art-1',
    occasion: 'birthday',
    sender_name: user?.full_name || '',
    recipient_name: '',
    recipient_email: '',
    title: '',
    message: '',
    message_font_style: 'handwritten',
    message_font_size: 20,
    album_background_theme: 'cover_blur',
    font_style: 'elegant',
    cover_text_color: 'auto',
    gift_amount: 10000,
    media: [],
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const designs = useMemo(() => designsFor(form.occasion), [form.occasion]);

  const turnPreview = (next) => {
    if (next === previewPage) return;
    setPreviewFlip(next > previewPage ? 'forward' : 'back');
    setPreviewPage(next);
    window.setTimeout(() => setPreviewFlip(''), ALBUM_FLIP_DURATION_MS);
  };
  // Every attachment reaches the preview — the sender should see exactly what
  // the recipient will swipe through, not just the first item.
  const previewItems = form.media.map(m => ({ url: m.preview, type: m.type }));

  // Changing occasion swaps the design list — keep the selected cover valid.
  useEffect(() => {
    if (!designs.some(d => d.id === form.design_theme) && designs[0]) {
      set('design_theme', designs[0].id);
    }
  }, [designs]);

  useEffect(() => { if (user?.full_name && !form.sender_name) set('sender_name', user.full_name); }, [user]);

  const design     = getCardDesign(form.design_theme);
  const albumTheme = getAlbumTheme(form.album_background_theme);
  const pageInk    = getAlbumInk(albumTheme, 'page');
  const autoCoverInk = getContrastTextColor(null, design);
  const coverInk = form.cover_text_color && form.cover_text_color !== 'auto'
    ? readableTextColor(form.cover_text_color, design.background, {
        ink: design.ink, fallback: design.soft || '#ffffff', large: true })
    : autoCoverInk;
  const msgFont    = getFontStyle(form.message_font_style);
  const gift       = Number(form.gift_amount) || 0;
  const total      = gift + CARD_FEE;

  const step1Valid =
    form.recipient_name.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.recipient_email.trim()) &&
    form.sender_name.trim();

  /* ── Draft hydration ───────────────────────────────────────────────────────
   * ?draft=<slug> is put in the URL by the first save, and the landing page
   * redirect can bring a sender back to it. Without loading the stored row the
   * form would render blank and the next save would overwrite a real draft with
   * empty values, so nothing may be saved until this has settled.
   */
  const [hydrating, setHydrating] = useState(!!params.get('draft'));

  useEffect(() => {
    const s = params.get('draft');
    if (!s) return;
    let alive = true;
    (async () => {
      try {
        const { data: t } = await moneyAPI.getMine(s);
        if (!alive || !t) return;
        if (t.status && t.status !== 'draft') {
          // Already paid for — editing it would silently do nothing server-side.
          toast('That card has already been sent. Starting a new one.');
          setSlug(null);
          setParams({}, { replace: true });
          return;
        }
        const stored = messageMediaItems(t).map(m => ({ type: m.type, url: m.url, preview: m.url }));
        setForm(f => ({
          ...f,
          design_theme:           t.design_theme           || f.design_theme,
          occasion:               t.occasion               || f.occasion,
          sender_name:            t.sender_name            || f.sender_name,
          recipient_name:         t.recipient_name         || '',
          recipient_email:        t.recipient_email        || '',
          title:                  t.title                  || '',
          message:                t.message                || '',
          message_font_style:     t.message_font_style     || f.message_font_style,
          message_font_size:      t.message_font_size      || f.message_font_size,
          album_background_theme: t.album_background_theme || f.album_background_theme,
          font_style:             t.font_style             || f.font_style,
          cover_text_color:       t.cover_text_color       || 'auto',
          gift_amount:            Number(t.gift_amount)    || f.gift_amount,
          media: stored,
        }));
      } catch {
        // A draft that cannot be loaded (deleted, or another account's) must
        // not be silently overwritten — drop the slug and start clean.
        setSlug(null);
        setParams({}, { replace: true });
      } finally {
        if (alive) setHydrating(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  /* ── Draft persistence ─────────────────────────────────────────────────── */
  /**
   * Uploads whatever is new and returns the COMPLETE attachment list, in the
   * order the sender arranged it, each item carrying its stored URL.
   *
   * The list has to be rebuilt from form.media rather than from the upload
   * response: the response only describes the files sent in that request, so
   * deriving media_url/media_gallery from it drops every attachment saved by
   * an earlier save, and never notices a removal.
   */
  const syncMedia = async () => {
    const fresh = form.media.filter(m => m.file && !m.url);
    let uploaded = [];
    if (fresh.length) {
      const fd = new FormData();
      // The route uses upload.any(), so one repeated field name is correct and
      // order is preserved — the server does not key off the field name.
      fresh.forEach(m => fd.append('media', m.file));
      const { data } = await moneyAPI.uploadMedia(fd);
      uploaded = data?.items || [];
      // A partial upload must not silently mis-pair URLs with attachments.
      if (uploaded.length !== fresh.length) throw new Error('Some files did not upload');
    }
    let k = 0;
    const merged = form.media.map(m => {
      if (m.url || !m.file) return m;
      const up = uploaded[k++];
      return up ? { ...m, url: up.media_url, type: up.media_type || m.type } : m;
    });
    setForm(f => ({ ...f, media: merged }));
    return merged.filter(m => m.url);
  };

  const saveDraft = async (extra = {}) => {
    // Saving over a draft that has not finished loading would write the blank
    // initial form on top of the sender's real card.
    if (hydrating) return null;
    setSaving(true);
    try {
      // Always sent, so that removing an attachment actually removes it from
      // the stored card — an empty list clears the row rather than leaving a
      // deleted photo on the recipient's copy.
      let mediaFields = { media_url: null, media_type: null, media_gallery: [] };
      try {
        const list = await syncMedia();
        if (list.length) {
          mediaFields = {
            media_url: list[0].url,
            media_type: list[0].type,
            media_gallery: list.slice(1).map(m => ({ media_url: m.url, media_type: m.type })),
          };
        }
      } catch (upErr) {
        // A failed upload must not lose the words the sender already wrote —
        // and must not wipe attachments that did save on an earlier attempt,
        // so the media fields are omitted entirely rather than sent as null.
        mediaFields = {};
        toast.error('Your files could not be uploaded — the card was saved without them.');
      }
      const { data } = await moneyAPI.saveDraft({
        slug,
        design_theme: form.design_theme,
        occasion: form.occasion,
        sender_name: form.sender_name.trim(),
        sender_email: user?.email,
        recipient_name: form.recipient_name.trim(),
        recipient_email: form.recipient_email.trim(),
        title: form.title.trim() || `For ${form.recipient_name.trim()}`,
        message: form.message,
        message_font_style: form.message_font_style,
        message_font_size: form.message_font_size,
        album_background_theme: form.album_background_theme,
        font_style: form.font_style,
        cover_text_color: form.cover_text_color,
        gift_amount: gift,
        ...mediaFields,
        ...extra,
      });
      if (data?.slug && data.slug !== slug) {
        setSlug(data.slug);
        setParams(p => { p.set('draft', data.slug); return p; }, { replace: true });
      }
      return data;
    } catch (e) {
      toast.error(e.response?.data?.error || 'Could not save your card.');
      return null;
    } finally { setSaving(false); }
  };

  const goToStep2 = async () => {
    if (!step1Valid) { toast.error('Add who it is for and a valid email first.'); return; }
    const saved = await saveDraft();
    if (saved) setStep(2);
  };

  /* ── Pay for the gift AND the card in one charge ────────────────────────── */
  const payAndSend = async () => {
    if (gift < MIN_GIFT) { toast.error(`Add at least ${formatNGN(MIN_GIFT)}.`); return; }
    setPaying(true);
    try {
      const saved = await saveDraft();
      if (!saved) return;
      const { data } = await moneyAPI.initPayment(saved.slug);
      if (!data?.flw_config) throw new Error('Could not start payment');

      await new Promise((resolve) => {
        openFlwCheckout({
          flwConfig: data.flw_config,
          onSuccess: async (returnedRef) => {
            try {
              await moneyAPI.verify(returnedRef || data.tx_ref);
              setSent(true);
              toast.success(`Sent! ${form.recipient_name} will get an email with the card.`);
            } catch (e) {
              toast.error(e.response?.data?.error || 'Payment could not be confirmed. Contact support.');
            } finally { resolve(); }
          },
          onClose: () => resolve(),
        });
      });
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Payment failed.');
    } finally { setPaying(false); }
  };

  /* ── Media (previewed locally; upload rides the existing media pipeline) ── */
  const addFile = (file, type) => {
    if (!file) return;
    setForm(f => ({ ...f, media: [...f.media, {
      type, preview: URL.createObjectURL(file), file, name: file.name || type,
    }] }));
  };

  const pickMedia = (kind) => {
    const spec = MEDIA_KINDS.find(k => k.type === kind);
    if (spec?.mode === 'gif')    { setGifOpen(true); return; }
    if (spec?.mode === 'record') { setRecordOpen(true); return; }
    pendingKind.current = kind;
    fileRef.current?.click();
  };
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) { toast.error('Files must be under 25MB.'); e.target.value = ''; return; }
    set('media', [...form.media, { type: pendingKind.current, preview: URL.createObjectURL(f), file: f, name: f.name }]);
    e.target.value = '';
  };
  const removeMedia = (i) => set('media', form.media.filter((_, idx) => idx !== i));

  /* ── Success ───────────────────────────────────────────────────────────── */
  if (sent) {
    return (
      <DashboardLayout title="Send Money" subtitle="One card from you, with money inside">
        <div className="mx-auto max-w-lg rounded-3xl border border-purple-100 bg-white p-8 text-center">
          <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-4xl">✓</div>
          <h2 className="mb-2 text-2xl font-bold text-warm-900">On its way to {form.recipient_name}</h2>
          <p className="mb-6 text-sm text-warm-600">
            We emailed <strong>{form.recipient_email}</strong> a private link to open the card.
            They can take the {formatNGN(gift)} to their bank account or as a gift card.
          </p>
          <button type="button" onClick={() => { setSent(false); setStep(1); setSlug(null); setParams({}, { replace: true }); }}
            className="btn-primary">Send another</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Send Money" subtitle="One card from you, with money inside — not a group card">
      <input ref={fileRef} type="file" className="hidden" accept={MEDIA_KINDS.find(k => k.type === pendingKind.current)?.accept || 'image/*'} onChange={onFile} />

      {/* Stepper */}
      <div className="mb-6 flex items-center gap-3">
        {[{ n: 1, label: 'Write the card' }, { n: 2, label: 'Add the money' }].map((s, i) => {
          // Step 2 is only reachable once step 1 is complete. A chip that
          // cannot be used is rendered disabled rather than as a button that
          // silently does nothing when clicked.
          const reachable = s.n === 1 || step1Valid;
          const current = step === s.n;
          return (
            <div key={s.n} className="flex items-center gap-3">
              <button
                type="button"
                disabled={!reachable}
                aria-current={current ? 'step' : undefined}
                onClick={() => { if (s.n === 1) setStep(1); else if (step1Valid) goToStep2(); }}
                className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors ${
                  current ? 'bg-primary-600 text-white'
                  : reachable ? 'bg-purple-50 text-warm-600 hover:bg-purple-100'
                  : 'bg-purple-50/60 text-warm-400 cursor-not-allowed'}`}>
                <span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] ${
                  current ? 'bg-white/25' : 'bg-white'}`}>{s.n}</span>
                {s.label}
              </button>
              {i === 0 && <span className="h-px w-8 bg-purple-200" />}
            </div>
          );
        })}
      </div>

      {/* What this is — sets expectations before any work is done. Send Money is
          one sender → one recipient. Group cards that other people sign are a
          different product surface (Create a card), linked here so nobody has
          to guess which one they are in. */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-purple-100 bg-purple-50/60 px-4 py-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-lg">💌</span>
        <p className="text-sm leading-relaxed text-warm-700">
          <strong className="text-warm-900">This is an individual card, not a group card.</strong>{' '}
          You alone write it and you alone put the money in — nobody else is invited to sign it.
          Your recipient opens one private link, reads your card and takes the money to their bank
          account or as a gift card. Want several people to sign one card instead?{' '}
          <Link to="/create-card" className="font-semibold text-primary-600 underline">
            Create a group card
          </Link>.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        {/* ══ LEFT ══════════════════════════════════════════════════════════ */}
        <div className="space-y-5">
          {step === 1 ? (
            <>
              {/* Design */}
              <section className="rounded-2xl border border-purple-100 bg-white p-5">
                <label className="mb-2 block text-sm font-bold text-warm-800">Card design</label>
                <select value={form.design_theme} onChange={e => set('design_theme', e.target.value)}
                  className="input w-full">
                  {designs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-warm-600">Occasion</label>
                    <select value={form.occasion} onChange={e => set('occasion', e.target.value)} className="input w-full">
                      {OCCASIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-warm-600">Cover text colour</label>
                    <div className="flex flex-wrap items-center gap-1">
                      <button type="button" onClick={() => set('cover_text_color', 'auto')} data-cover-ink="auto"
                        className={`h-8 flex-shrink-0 rounded-lg border px-2 text-[11px] font-extrabold ${
                          form.cover_text_color === 'auto'
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-purple-100 bg-white text-warm-600'}`}>
                        Auto
                      </button>
                      {COVER_TEXT_SWATCHES.map(c => (
                        <button key={c} type="button" onClick={() => set('cover_text_color', c)}
                          aria-label={`Cover text ${c}`} title={c} data-cover-ink={c}
                          className="flex h-8 w-7 flex-shrink-0 items-center justify-center">
                          <span className={`block h-6 w-6 rounded-full border-2 ${
                            form.cover_text_color === c
                              ? 'border-primary-500 ring-2 ring-primary-300'
                              : 'border-warm-200 shadow-sm'}`} style={{ backgroundColor: c }} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-warm-600">Album background</label>
                    <div className="flex flex-nowrap items-center gap-0.5">
                      {ALBUM_THEMES.map(t => {
                        const sel = form.album_background_theme === t.id;
                        return (
                          <button key={t.id} type="button" onClick={() => set('album_background_theme', t.id)}
                            aria-pressed={sel} aria-label={`${t.name} — ${t.description}`} title={`${t.name} — ${t.description}`}
                            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full">
                            <span className={`block h-7 w-7 rounded-full border transition-all ${
                              sel ? 'border-primary-500 ring-2 ring-primary-300 ring-offset-1' : 'border-black/15'}`}
                              style={{ background: t.stage }} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              {/* Who it's for */}
              <section className="rounded-2xl border border-purple-100 bg-white p-5">
                <h3 className="mb-3 text-sm font-bold text-warm-800">Who is it for?</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-warm-600">Your name</label>
                    <input className="input w-full" value={form.sender_name} placeholder="From…"
                      onChange={e => set('sender_name', e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-warm-600">Their name</label>
                    <input className="input w-full" value={form.recipient_name} placeholder="Who is receiving it"
                      onChange={e => set('recipient_name', e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold text-warm-600">Their email</label>
                    <input className="input w-full" type="email" value={form.recipient_email}
                      placeholder="They open the card here" onChange={e => set('recipient_email', e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold text-warm-600">Card name</label>
                    <input className="input w-full" value={form.title}
                      placeholder={form.recipient_name ? `For ${form.recipient_name}` : 'For…'}
                      onChange={e => set('title', e.target.value)} />
                  </div>
                </div>
              </section>

              {/* Message */}
              <section className="rounded-2xl border border-purple-100 bg-white p-5">
                <h3 className="mb-3 text-sm font-bold text-warm-800">Your message</h3>
                <textarea rows={5} value={form.message} onChange={e => set('message', e.target.value)}
                  placeholder="Say the thing you actually mean…"
                  className="w-full rounded-xl border-2 border-purple-100 p-3 outline-none focus:border-primary-400"
                  style={{ fontFamily: msgFont.family, fontSize: form.message_font_size }} />

                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <div className="min-w-[170px] flex-1">
                    <label className="mb-1.5 block text-xs font-bold text-warm-600">Handwriting</label>
                    <div className="flex flex-wrap gap-1.5">
                      {FONT_STYLES.map(f => (
                        <button key={f.id} type="button" onClick={() => set('message_font_style', f.id)}
                          style={{ fontFamily: f.family }}
                          className={`rounded-lg border-2 px-2.5 py-1.5 text-xs transition-all ${
                            form.message_font_style === f.id
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-purple-100 text-warm-600'}`}>
                          {f.id === 'calligraphy' ? 'With love' : f.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="min-w-[150px] flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs font-bold text-warm-600">Text size</label>
                      <span className="text-[11px] font-bold text-primary-600">{form.message_font_size}</span>
                    </div>
                    <input type="range" min={12} max={40} value={form.message_font_size}
                      onChange={e => set('message_font_size', Number(e.target.value))}
                      className="w-full accent-primary-500" />
                  </div>
                </div>

                {/* Media */}
                <div className="mt-4 border-t border-purple-50 pt-4">
                  <label className="mb-2 block text-xs font-bold text-warm-600">Add photos, videos, GIFs or a voice note</label>
                  <div className="flex flex-wrap gap-2">
                    {MEDIA_KINDS.map(k => (
                      <button key={k.type} type="button" onClick={() => pickMedia(k.type)}
                        className="inline-flex items-center gap-1.5 rounded-xl border-2 border-dashed border-purple-200 px-3 py-2 text-xs font-bold text-warm-700 hover:border-primary-300">
                        <Icon name={k.icon} size={14} /> {k.label}
                      </button>
                    ))}
                  </div>
                  {/* Real GIF search (Giphy) — not a file picker. */}
                  {gifOpen && (
                    <div className="relative mt-3">
                      <GifPicker
                        onSelect={(file) => { addFile(file, 'gif'); setGifOpen(false); }}
                        onClose={() => setGifOpen(false)}
                        compact
                      />
                    </div>
                  )}

                  {/* Record in the browser — no upload. */}
                  {recordOpen && (
                    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-purple-100 bg-purple-50/60 p-3">
                      <VoiceRecorder
                        onRecorded={(file) => { addFile(file, 'voice'); setRecordOpen(false); }}
                        disabled={form.media.length >= 5}
                      />
                      <button type="button" onClick={() => setRecordOpen(false)}
                        className="text-xs font-bold text-warm-500 hover:text-warm-700">Cancel</button>
                    </div>
                  )}

                  {form.media.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {form.media.map((m, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1.5 text-[11px] font-bold text-warm-700">
                          <Icon name={MEDIA_KINDS.find(k => k.type === m.type)?.icon || 'Image'} size={12} />
                          {m.name?.slice(0, 18) || m.type}
                          <button type="button" onClick={() => removeMedia(i)} aria-label="Remove"
                            className="text-warm-500 hover:text-rose-500"><Icon name="X" size={12} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <div className="flex justify-end">
                <button type="button" data-cta="to-step-2" onClick={goToStep2} disabled={!step1Valid || saving || hydrating} className="btn-primary">
                  {saving ? 'Saving…' : 'Add the money →'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* ══ STEP 2 — the money ══ */}
              <section className="rounded-2xl border border-purple-100 bg-white p-5">
                <h3 className="mb-1 text-sm font-bold text-warm-800">How much are you sending?</h3>
                <p className="mb-4 text-xs text-warm-500">It travels inside the card, not as a separate transfer.</p>

                <div className="mb-3 flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map(a => (
                    <button key={a} type="button" onClick={() => set('gift_amount', a)}
                      className={`rounded-xl border-2 px-3 py-2 text-sm font-bold transition-all ${
                        gift === a ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-purple-100 text-warm-700'}`}>
                      {formatNGN(a)}
                    </button>
                  ))}
                </div>

                <label className="mb-1.5 block text-xs font-bold text-warm-600">Or a custom amount</label>
                <div className="flex items-center gap-2 rounded-xl border-2 border-purple-100 px-3 focus-within:border-primary-400">
                  <span className="text-lg font-bold text-warm-500">₦</span>
                  <input type="number" min={MIN_GIFT} value={form.gift_amount}
                    onChange={e => set('gift_amount', e.target.value)}
                    className="w-full border-0 py-3 text-lg font-bold outline-none" />
                </div>

                <div className="mt-4 space-y-1.5 rounded-xl bg-purple-50/70 p-3.5 text-sm">
                  <div className="flex justify-between"><span className="text-warm-600">Gift for {form.recipient_name || 'them'}</span><span className="font-bold text-warm-900">{formatNGN(gift)}</span></div>
                  <div className="flex justify-between"><span className="text-warm-600">Card fee</span><span className="font-bold text-warm-900">{formatNGN(CARD_FEE)}</span></div>
                  <div className="mt-1.5 flex justify-between border-t border-purple-200 pt-2">
                    <span className="font-bold text-warm-800">You pay once</span>
                    <span className="text-lg font-extrabold text-primary-700">{formatNGN(total)}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2.5 rounded-xl border border-purple-100 bg-white p-3.5">
                  <Icon name="Gift" size={16} className="mt-0.5 flex-shrink-0 text-primary-500" />
                  <p className="text-xs leading-relaxed text-warm-600">
                    <strong className="text-warm-800">{form.recipient_name || 'They'} chooses how to take it.</strong>{' '}
                    Straight to their bank account, or as a gift card — shopping, food, airtime and more.
                    A 3% payout fee applies when they withdraw to a bank.
                  </p>
                </div>
              </section>

              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary">← Back</button>
                <button type="button" onClick={payAndSend} disabled={paying || gift < MIN_GIFT} className="btn-primary">
                  {paying ? 'Opening payment…' : `Pay ${formatNGN(total)} & Send`}
                </button>
              </div>
            </>
          )}
        </div>

        {/* ══ RIGHT — live album preview ═════════════════════════════════════ */}
        <aside className="lg:sticky lg:top-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-warm-500">Live preview</p>
            <span className="text-[11px] font-bold text-warm-500">
              {previewPage === 0 ? 'Cover' : 'Their page'}
            </span>
          </div>

          {/* A real album that turns, using the same shared flip as the card
              view and the public creation preview — and every field below
              re-renders it as the sender types. */}
          <style>{ALBUM_FLIP_CSS}</style>
          <div className="overflow-hidden rounded-2xl p-5" style={{ background: albumTheme.stage }}>
            <div className="album-stage flex min-h-[360px] items-center justify-center">
              <div key={`sm-leaf-${previewPage}`} className={`album-page-turn ${previewFlip} w-full max-w-[260px]`}>
                {previewPage === 0 ? (
                  <CardCoverPreview
                    design={design}
                    occasionLabel={getOccasionLabel(form.occasion)}
                    recipientName={form.recipient_name}
                    title={form.title || (form.recipient_name ? `For ${form.recipient_name}` : '')}
                    senderName={form.sender_name}
                    textColor={coverInk}
                    fontFamily={getFontStyle(form.font_style).family}
                  />
                ) : (
                  <div className="rounded-xl p-4 shadow-lg" style={{ background: albumTheme.page, color: pageInk, minHeight: 330 }}>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full opacity-70" style={{ background: design.accent }} />
                      <span className="text-[10px] font-bold opacity-60">{form.sender_name || 'You'}</span>
                    </div>

                    {previewItems.length > 0 && (
                      <div className="mb-3">
                        <MediaSwiper items={previewItems} height={92} accent={design.accent} rounded="rounded-lg" />
                      </div>
                    )}

                    <p className="break-words leading-relaxed"
                      style={{
                        fontFamily: msgFont.family,
                        fontSize: Math.max(12, form.message_font_size * 0.72),
                        color: readableTextColor(pageInk, albumTheme.page, { ink: pageInk, fallback: albumTheme.page }),
                      }}>
                      {form.message || 'Your message appears here…'}
                    </p>

                    {gift > 0 && (
                      <div className="mt-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white"
                          style={{ background: '#059669' }}>
                          🎁 {formatNGN(gift)}
                        </span>
                      </div>
                    )}
                    <p className="mt-3 text-right text-xs font-bold"
                      style={{ fontFamily: "'Dancing Script',cursive", fontSize: 16, color: design.accent }}>
                      — {form.sender_name || 'You'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Turn the page */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <button type="button" onClick={() => turnPreview(0)} disabled={previewPage === 0}
                aria-label="Previous page"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow disabled:opacity-30">
                <Icon name="ChevronLeft" size={16} style={{ color: design.accent }} />
              </button>
              <span className="text-[11px] font-bold"
                style={{ color: readableTextColor('#4B3F72', albumTheme.stage, { ink: albumTheme.ink, fallback: albumTheme.stage }) }}>
                {previewPage + 1} of 2
              </span>
              <button type="button" onClick={() => turnPreview(1)} disabled={previewPage === 1}
                aria-label="Next page"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow disabled:opacity-30">
                <Icon name="ChevronRight" size={16} style={{ color: design.accent }} />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
}
