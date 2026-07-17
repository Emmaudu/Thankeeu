import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CardCoverPreview from './CardCoverPreview';
import GifPicker from './GifPicker';
import Icon from './ui/Icon';
import { getAlbumTheme, getContrastTextColor } from '../utils/albumThemes';
import { getFontStyle } from '../utils/cardDesigns';

const PAGE_LABELS = ['Cover', 'Message', 'Review'];

const WALL_CARD_COLOURS = ['#7c3aed', '#ec4899', '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6'];

const mediaTypeFor = file => file.type.startsWith('video/') ? 'video'
  : file.type.startsWith('audio/') ? 'voice'
    : file.type === 'image/gif' ? 'gif' : 'image';

function EditableWallCard({ card, index, onChange, onRemove, canRemove }) {
  const [slide, setSlide] = useState(0);
  const [mediaError, setMediaError] = useState('');
  const inputRef = useRef(null);
  const colour = card.colour || WALL_CARD_COLOURS[index % WALL_CARD_COLOURS.length];
  const media = card.media || [];
  const active = media[Math.min(slide, Math.max(0, media.length - 1))];

  useEffect(() => {
    if (slide >= media.length) setSlide(Math.max(0, media.length - 1));
  }, [media.length, slide]);

  const addFiles = files => {
    setMediaError('');
    const remaining = Math.max(0, 5 - media.length);
    const candidates = Array.from(files || []);
    if (candidates.length > remaining) setMediaError('Maximum five carousel items.');
    const accepted = candidates.slice(0, remaining).filter(file => {
      const supported = file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/');
      if (!supported) {
        setMediaError(`${file.name} is not a supported media file.`);
        return false;
      }
      const maxBytes = file.type.startsWith('image/') ? 9 * 1024 * 1024 : 50 * 1024 * 1024;
      if (file.size > maxBytes) {
        setMediaError(`${file.name} exceeds the ${file.type.startsWith('image/') ? '9MB image/GIF' : '50MB video/audio'} limit.`);
        return false;
      }
      return true;
    });
    const additions = accepted.map(file => ({
      file, preview: URL.createObjectURL(file), type: mediaTypeFor(file), name: file.name,
    }));
    if (additions.length) onChange({ media: [...media, ...additions].slice(0, 5) });
  };
  const removeMedia = itemIndex => {
    const item = media[itemIndex];
    if (item?.preview?.startsWith('blob:')) URL.revokeObjectURL(item.preview);
    onChange({ media: media.filter((_, i) => i !== itemIndex) });
  };
  const move = direction => {
    if (media.length > 1) setSlide(value => (value + direction + media.length) % media.length);
  };

  return (
    <article className="overflow-hidden rounded-xl border border-white/80 bg-white shadow-[0_10px_28px_rgba(76,29,149,0.13)]">
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden" style={{ background: `linear-gradient(145deg,${colour}22,#fff1f2)` }}>
        {active?.type === 'video' && <video src={active.preview} className="h-full w-full object-cover bg-black" controls playsInline />}
        {active?.type === 'voice' && <div className="flex w-full flex-col items-center gap-2 px-3"><span className="flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ background: colour }}><Icon name="Mic" size={20} /></span><audio src={active.preview} controls className="h-8 w-full" /></div>}
        {active && !['video', 'voice'].includes(active.type) && <img src={active.preview} alt="Creator wall upload" className="h-full w-full object-cover" />}
        {!active && (
          <button type="button" onClick={() => inputRef.current?.click()} className="flex h-full w-full flex-col items-center justify-center gap-2 text-center" style={{ color: colour }}>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/85 shadow"><Icon name="Image" size={23} /></span>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.12em]">Add photos directly</span>
            <span className="text-[9px] font-semibold opacity-65">Photo/GIF · video · voice</span>
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*,video/*,audio/*" multiple className="hidden" onChange={event => { addFiles(event.target.files); event.target.value = ''; }} />
        {active && <button type="button" onClick={() => inputRef.current?.click()} disabled={media.length >= 5} className="absolute right-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-extrabold text-primary-600 shadow disabled:opacity-40">+ Media</button>}
        {active && <button type="button" onClick={() => removeMedia(Math.min(slide, media.length - 1))} aria-label="Remove current media" className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white"><Icon name="X" size={13} /></button>}
        {media.length > 1 && <>
          <button type="button" aria-label="Previous media" onClick={() => move(-1)} className="absolute left-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary-600 shadow"><Icon name="ChevronLeft" size={14} /></button>
          <button type="button" aria-label="Next media" onClick={() => move(1)} className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary-600 shadow"><Icon name="ChevronRight" size={14} /></button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-black/30 px-2 py-1">{media.map((_, i) => <button key={i} type="button" aria-label={`Show media ${i + 1}`} onClick={() => setSlide(i)} className={`h-1.5 rounded-full ${i === slide ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`} />)}</div>
        </>}
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white" style={{ background: colour }}>{card.sender?.[0]?.toUpperCase() || '?'}</span>
          <input value={card.sender || ''} onChange={event => onChange({ sender: event.target.value })} maxLength={80} placeholder="Sender name" aria-label={`Sender name for wall card ${index + 1}`} className="min-w-0 flex-1 rounded-lg border border-purple-100 px-2 py-1.5 text-[11px] font-extrabold text-warm-800 outline-none focus:border-primary-400" />
          {canRemove && <button type="button" onClick={onRemove} aria-label={`Remove wall card ${index + 1}`} className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-500"><Icon name="Trash2" size={12} /></button>}
        </div>
        <textarea value={card.message || ''} onChange={event => onChange({ message: event.target.value })} maxLength={600} rows={2} placeholder="Message…" aria-label={`Message for wall card ${index + 1}`} className="w-full resize-none rounded-lg border border-purple-100 px-2 py-1.5 text-[11px] font-semibold leading-relaxed text-warm-800 outline-none focus:border-primary-400" />
        <input value={card.caption || ''} onChange={event => onChange({ caption: event.target.value })} maxLength={300} placeholder="Photo/video caption…" aria-label={`Caption for wall card ${index + 1}`} className="w-full rounded-lg border border-purple-100 px-2 py-1.5 text-[10px] italic text-warm-600 outline-none focus:border-primary-400" />
        {mediaError && <p className="rounded-lg bg-red-50 px-2 py-1.5 text-[9px] font-bold text-red-600">{mediaError}</p>}
        <p className="text-[9px] font-bold text-warm-400">Card {index + 1} · {media.length}/5 carousel items</p>
      </div>
    </article>
  );
}

function LiveWallStudioPreview({ cards = [], onChange, creatorName }) {
  const [wallPage, setWallPage] = useState(0);
  const cardsPerPage = 6;
  const pageCount = Math.max(1, Math.ceil(cards.length / cardsPerPage));
  const visible = cards.slice(wallPage * cardsPerPage, wallPage * cardsPerPage + cardsPerPage);
  const go = target => setWallPage(Math.max(0, Math.min(pageCount - 1, target)));
  const updateCard = (visibleIndex, patch) => {
    const absoluteIndex = wallPage * cardsPerPage + visibleIndex;
    onChange?.(cards.map((card, index) => index === absoluteIndex ? { ...card, ...patch } : card));
  };
  const removeCard = visibleIndex => {
    const absoluteIndex = wallPage * cardsPerPage + visibleIndex;
    (cards[absoluteIndex]?.media || []).forEach(item => {
      if (item?.preview?.startsWith('blob:')) URL.revokeObjectURL(item.preview);
    });
    const next = cards.filter((_, index) => index !== absoluteIndex);
    onChange?.(next.length ? next : [makeWallPreviewCard(creatorName, 0)]);
    setWallPage(page => Math.min(page, Math.max(0, Math.ceil(Math.max(1, next.length) / cardsPerPage) - 1)));
  };
  const addRow = () => {
    const nextIndex = cards.length;
    const next = [...cards, makeWallPreviewCard(creatorName, nextIndex), makeWallPreviewCard(creatorName, nextIndex + 1)];
    onChange?.(next);
    setWallPage(Math.ceil(next.length / cardsPerPage) - 1);
  };

  useEffect(() => {
    if (wallPage >= pageCount) setWallPage(pageCount - 1);
  }, [pageCount, wallPage]);

  return (
    <div className="w-full">
      <style>{`
        .live-wall-preview-scroll::-webkit-scrollbar{width:11px}
        .live-wall-preview-scroll::-webkit-scrollbar-track{background:#ede9fe;border-radius:999px}
        .live-wall-preview-scroll::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#7c3aed,#ec4899,#f59e0b);border:2px solid #ede9fe;border-radius:999px}
      `}</style>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-warm-500">Live wall preview</p><p className="mt-1 text-sm font-bold text-warm-900">Edit every two-column carousel card</p></div>
        <span className="rounded-md border border-fuchsia-100 bg-white px-2.5 py-1 text-[10px] font-extrabold text-fuchsia-600">Updates live</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-purple-100 bg-gradient-to-br from-violet-50 via-pink-50 to-amber-50 shadow-[0_24px_70px_rgba(27,34,48,0.16)]">
        <div className="border-b border-white/70 px-4 py-4 text-center"><p className="text-lg font-black text-warm-900">Live Memory Wall</p><p className="text-[10px] font-semibold text-warm-500">Six cards per page · two columns × three rows · each card holds a five-item carousel</p></div>
        <div className="live-wall-preview-scroll max-h-[760px] overflow-y-auto p-3" style={{ scrollbarColor: '#ec4899 #ede9fe', scrollbarWidth: 'thin' }}>
          <div className="grid grid-cols-2 gap-3">{visible.map((card, index) => <EditableWallCard key={card.id} card={card} index={wallPage * cardsPerPage + index} onChange={patch => updateCard(index, patch)} onRemove={() => removeCard(index)} canRemove={cards.length > 1} />)}</div>
        </div>
        <div className="border-t border-white/70 bg-white/70 px-3 py-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button type="button" onClick={() => go(0)} disabled={wallPage === 0} className="rounded-lg border border-purple-100 bg-white px-2 py-1 text-[10px] font-extrabold text-primary-600 disabled:opacity-30">First</button>
            <button type="button" onClick={() => go(wallPage - 1)} disabled={wallPage === 0} className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-primary-600 disabled:opacity-30"><Icon name="ChevronLeft" size={14} /></button>
            <label className="rounded-lg border border-purple-100 bg-white px-2 py-1 text-[10px] font-extrabold text-warm-600">Page <select value={wallPage} onChange={event => go(Number(event.target.value))} className="bg-transparent font-black text-primary-600 outline-none">{Array.from({ length: pageCount }, (_, index) => <option key={index} value={index}>{index + 1} of {pageCount}</option>)}</select></label>
            <button type="button" onClick={() => go(wallPage + 1)} disabled={wallPage === pageCount - 1} className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-primary-600 disabled:opacity-30"><Icon name="ChevronRight" size={14} /></button>
            <button type="button" onClick={() => go(pageCount - 1)} disabled={wallPage === pageCount - 1} className="rounded-lg border border-purple-100 bg-white px-2 py-1 text-[10px] font-extrabold text-primary-600 disabled:opacity-30">Last</button>
          </div>
          <button type="button" onClick={addRow} className="mx-auto mt-3 flex w-full max-w-sm items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-pink-500 px-4 py-3 text-xs font-extrabold text-white shadow-lg"><Icon name="Plus" size={15} />Add another row (2 cards)</button>
          <p className="mt-2 text-center text-[9px] font-semibold text-warm-400">Rows are unlimited. Pagination appears after every third row.</p>
        </div>
      </div>
    </div>
  );
}

export function makeWallPreviewCard(sender = '', index = 0) {
  return {
    id: `wall-draft-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    sender: sender || 'Your name', message: '', caption: '',
    colour: WALL_CARD_COLOURS[index % WALL_CARD_COLOURS.length], media: [], uploaded: false,
  };
}

/**
 * AlbumStudioPreview — the interactive LIVE preview in the creation flow.
 *  - Cover: drag / show-hide / recolour texts live (shares CardCoverPreview editor)
 *  - Message spread: tap placeholders to upload Photo/GIF, Voice, Video right here;
 *    uploaded content fills the placeholder and previews larger in a lightbox
 *  - Gift: when a gift is added the "More love" tile becomes a money/gift emoji tile
 *  - Board mode: when card_layout === 'form', renders the Card-View board style with
 *    an uploadable recipient photo
 */
const AlbumStudioPreview = ({
  design, form, message, occasionLabel, activeStep, creatorName,
  layout, onLayoutChange, selectedField, onSelectField,
  media = [], onAddMedia, onRemoveMedia, onMessageChange, recipientPhoto, onRecipientPhoto,
  wallDrafts = [], onWallDraftsChange,
}) => {
  const [page, setPage] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const [gifPickerFor, setGifPickerFor] = useState(false);
  const [flipDirection, setFlipDirection] = useState('');
  const audioCtxRef = useRef(null);
  const flipTimerRef = useRef(null);
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const voiceInputRef = useRef(null);
  const recipientInputRef = useRef(null);

  const isLiveWall = ['wall_only', 'card_and_wall'].includes(form.card_experience);
  const isBoard = form.card_layout === 'form';
  const theme = getAlbumTheme(form.album_background_theme);
  const coverTextColor = form.cover_text_color && form.cover_text_color !== 'auto'
    ? form.cover_text_color
    : getContrastTextColor(form.background_color, design);
  const messageFont = getFontStyle(message.font_style);

  useEffect(() => {
    if (isLiveWall || isBoard) { setPage(0); return; }
    if (activeStep === 3) setPage(1);
    else if (activeStep === 4) setPage(2);
    else setPage(0);
  }, [activeStep, isBoard, isLiveWall]);

  const stageBackground = useMemo(() => {
    if (theme.id !== 'cover_blur') return theme.stage;
    if (design?.artwork) return design?.background || theme.stage;
    if (design?.image) return `url("${design.image}") center / cover no-repeat`;
    return design?.background || theme.stage;
  }, [design, theme]);

  const playFlipSound = useCallback(() => {
    try {
      let ctx = audioCtxRef.current;
      if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); audioCtxRef.current = ctx; }
      if (ctx.state === 'suspended') ctx.resume();
      const duration = 0.25;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) {
        const t = i / data.length;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.1) * Math.min(1, t * 13) * 0.45;
      }
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      source.buffer = buffer; filter.type = 'bandpass'; filter.frequency.value = 2500; filter.Q.value = 0.75; gain.gain.value = 0.3;
      source.connect(filter); filter.connect(gain); gain.connect(ctx.destination); source.start();
    } catch { /* Browsers may block audio until the first interaction. */ }
  }, []);
  const goToPage = useCallback((target) => {
    const next = Math.min(2, Math.max(0, target));
    if (next === page) return;
    setFlipDirection(next > page ? 'forward' : 'back');
    playFlipSound();
    setPage(next);
    clearTimeout(flipTimerRef.current);
    flipTimerRef.current = setTimeout(() => setFlipDirection(''), 620);
  }, [page, playFlipSound]);
  const movePage = d => goToPage(page + d);
  const recipient = form.recipient_name?.trim() || 'Recipient name';
  const sender = form.cover_sender?.trim() || creatorName || 'Your name';
  const messageText = message.content?.trim() || 'Your message will appear here as you type. Add a memory, a thank-you, or a few words from the heart.';

  const photoMedia = media.find(m => m.type === 'image' || m.type === 'gif');
  const videoMedia = media.find(m => m.type === 'video');
  const voiceMedia = media.find(m => m.type === 'voice');
  const giftActive = form.is_gift_enabled;
  const isFlowerGift = ['flower', 'flowers'].includes(form.gift_type);
  const isProductGift = ['product', 'gift'].includes(form.gift_type);
  const giftEmoji = isFlowerGift ? '💐' : isProductGift ? '🎁' : '💸';
  const giftLabel = isFlowerGift ? 'Flowers added' : isProductGift ? 'Gift added' : 'Money gift';

  const pick = ref => ref.current?.click();
  const handleFiles = (e) => { const fs = e.target.files; if (fs?.length && onAddMedia) onAddMedia(fs); e.target.value = ''; };

  // A Live Wall is its own experience, so it takes priority over the album
  // and message-board layouts in the large studio preview whenever enabled.
  if (isLiveWall) {
    return <LiveWallStudioPreview cards={wallDrafts} onChange={onWallDraftsChange} creatorName={sender} />;
  }

  // ── Board-style preview ─────────────────────────────────────────────────────
  if (isBoard) {
    return (
      <div className="w-full">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-warm-500">Live board preview</p>
            <p className="mt-1 text-sm font-bold text-warm-900">Message board</p>
          </div>
          <span className="rounded-md border border-purple-100 bg-white px-2.5 py-1 text-[10px] font-extrabold text-warm-500">Updates live</span>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-black/5 shadow-[0_24px_70px_rgba(27,34,48,0.16)]" style={{ minHeight: 'clamp(430px,69vh,710px)', background: '#f7f5ff' }}>
          <div className="relative px-5 pt-8 pb-10 text-center" style={{ background: design?.background || 'linear-gradient(160deg,#7c3aed,#5b21b6)', color: coverTextColor }}>
            {design?.artwork && (
              <div className="absolute inset-0 opacity-90">
                <CardCoverPreview design={design} occasionLabel="" recipientName="" title="" senderName="" compact
                  layout={{ recipient: { show: false }, title: { show: false }, sender: { show: false } }} />
              </div>
            )}
            <div className="relative z-10 flex flex-col items-center">
              <button type="button" onClick={() => recipientInputRef.current?.click()}
                className="group relative mb-3 h-20 w-20 overflow-hidden rounded-full border-4 border-white/70 shadow-lg" style={{ background: 'rgba(255,255,255,0.25)' }}>
                {recipientPhoto?.preview
                  ? <img src={recipientPhoto.preview} alt="" className="h-full w-full object-cover" />
                  : <span className="flex h-full w-full flex-col items-center justify-center text-white"><Icon name="Camera" size={20} /><span className="mt-0.5 text-[8px] font-bold">Add photo</span></span>}
              </button>
              <input ref={recipientInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f && onRecipientPhoto) onRecipientPhoto(f); e.target.value = ''; }} />
              <h1 style={{ fontFamily: "'Great Vibes', cursive", fontSize: 'clamp(1.8rem,7vw,2.8rem)', lineHeight: 1.1 }}>
                {form.title || `Happy ${occasionLabel}, ${recipient}!`}
              </h1>
              {form.cover_sender && <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ opacity: 0.85 }}>From {sender}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4">
            <div className="col-span-2 rounded-xl border border-purple-100 bg-white p-4 shadow-sm">
              <p className="break-words" style={{ fontFamily: messageFont.family, fontSize: '1.05rem', color: '#2a2140' }}>{messageText}</p>
              <div className="mt-3 flex items-center gap-2">
                {photoMedia && <img src={photoMedia.preview} alt="" className="h-12 w-12 cursor-pointer rounded-lg object-cover" onClick={() => setLightbox({ type: photoMedia.type, src: photoMedia.preview })} />}
                <span className="text-[11px] font-bold text-warm-400">— {sender}</span>
              </div>
            </div>
            {['Ada O.', 'Chidi M.', 'Sola B.'].map((n, i) => (
              <div key={n} className="rounded-xl border border-dashed border-purple-200 bg-white/60 p-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-extrabold text-white" style={{ background: ['#7c3aed', '#0ea5e9', '#ec4899'][i] }}>{n[0]}</span>
                  <span className="text-[11px] font-bold text-warm-500">{n}</span>
                </div>
                <div className="mt-2 space-y-1.5"><div className="h-2 w-full rounded bg-purple-100" /><div className="h-2 w-3/4 rounded bg-purple-100" /></div>
              </div>
            ))}
          </div>
          <p className="pb-4 text-center text-[11px] font-bold text-warm-400">Everyone's messages appear together on one scrollable board</p>
        </div>
        {lightbox && <Lightbox lightbox={lightbox} onClose={() => setLightbox(null)} />}
      </div>
    );
  }

  // ── Album-style preview ─────────────────────────────────────────────────────
  return (
    <div className="w-full">
      <style>{`
        @keyframes album-leaf-forward { 0% { opacity:.2; transform:rotateY(-96deg) skewY(-1.5deg); filter:brightness(.72); } 58% { opacity:1; transform:rotateY(8deg) skewY(.3deg); } 100% { transform:rotateY(0); filter:brightness(1); } }
        @keyframes album-leaf-back { 0% { opacity:.2; transform:rotateY(96deg) skewY(1.5deg); filter:brightness(.72); } 58% { opacity:1; transform:rotateY(-8deg) skewY(-.3deg); } 100% { transform:rotateY(0); filter:brightness(1); } }
        .album-page-turn { transform-style:preserve-3d; backface-visibility:hidden; }
        .album-page-turn.forward { animation:album-leaf-forward .6s cubic-bezier(.2,.72,.15,1) both; transform-origin:left center; }
        .album-page-turn.back { animation:album-leaf-back .6s cubic-bezier(.2,.72,.15,1) both; transform-origin:right center; }
      `}</style>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-warm-500">Live album preview</p>
          <p className="mt-1 text-sm font-bold text-warm-900">{PAGE_LABELS[page]}{page === 0 ? ' · drag & edit texts' : page === 1 ? ' · tap to add media' : ''}</p>
        </div>
        <span className="rounded-md border border-purple-100 bg-white px-2.5 py-1 text-[10px] font-extrabold text-warm-500">Editable</span>
      </div>

      <div className="relative overflow-hidden border border-black/5 shadow-[0_24px_70px_rgba(27,34,48,0.16)]"
        style={{ minHeight: 'clamp(430px, 69vh, 710px)', borderRadius: 8, background: stageBackground }}>
        {theme.id === 'cover_blur' && !design?.artwork && <div className="absolute inset-0 bg-white/20 backdrop-blur-xl" />}
        <div className="absolute inset-0 bg-black/5" />

        <div className="relative z-10 flex min-h-[clamp(430px,69vh,710px)] items-center justify-center p-5 sm:p-8 lg:p-10">
          {page === 0 ? (
            <div key={`cover-${page}`} className={`album-page-turn ${flipDirection} relative w-full max-w-[360px]`}>
              <div className="absolute left-[12%] top-3 h-full w-[88%] rounded-md bg-white shadow-xl" />
              <div className="relative">
                <CardCoverPreview
                  design={design} occasionLabel={occasionLabel}
                  recipientName={form.recipient_name} title={form.title} senderName={sender}
                  coverColor={form.background_color?.startsWith('#') ? form.background_color : undefined}
                  textColor={coverTextColor} fontFamily={getFontStyle(form.font_style).family}
                  layout={layout} editable={!!onLayoutChange} selected={selectedField}
                  onSelect={onSelectField} onLayoutChange={onLayoutChange}
                />
              </div>
              {onLayoutChange && <p className="mt-2 text-center text-[11px] font-semibold text-warm-500">Drag the title, name or sender anywhere · hidden fields won't show</p>}
            </div>
          ) : (
            <div key={`spread-${page}`} className={`album-page-turn ${flipDirection} relative w-full max-w-[820px]`} style={{ perspective: '1800px' }}>
              <div className="grid grid-cols-2 overflow-hidden rounded-md shadow-2xl" style={{ background: theme.page, minHeight: 'clamp(340px, 48vw, 540px)' }}>
                <div className="relative flex flex-col border-r border-black/15 p-5 sm:p-7" style={{ color: theme.ink }}>
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] opacity-45">For {recipient}</span>
                  {page === 1 ? (
                    <div className="flex flex-1 flex-col justify-center">
                      {onMessageChange ? (
                        <textarea value={message.content || ''} onChange={(e) => onMessageChange(e.target.value)}
                          placeholder="Click here and write your message…" aria-label="Edit message directly in live preview"
                          className="min-h-[170px] w-full resize-none rounded-xl border border-dashed border-black/15 bg-white/35 p-3 text-lg leading-relaxed outline-none transition focus:border-primary-400 focus:bg-white/60 sm:text-2xl"
                          style={{ fontFamily: messageFont.family, color: theme.ink }} />
                      ) : <p className="break-words text-lg leading-relaxed sm:text-2xl" style={{ fontFamily: messageFont.family }}>{messageText}</p>}
                      <p className="mt-6 text-xs font-bold opacity-60">— {sender}</p>
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col justify-center">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] opacity-45">Ready to bring everyone together</p>
                      <p className="mt-3 text-2xl font-extrabold leading-tight sm:text-4xl">{form.title || `${recipient}'s card`}</p>
                      <div className="mt-7 space-y-3 text-xs sm:text-sm">
                        <p className="flex items-center gap-2"><Icon name="Calendar" size={14} /> {form.send_date || 'Send whenever you are ready'}</p>
                        <p className="flex items-center gap-2"><Icon name="Gift" size={14} /> {form.is_gift_enabled ? 'Gift collection included' : 'Messages only'}</p>
                      </div>
                    </div>
                  )}
                  <span className="absolute bottom-3 left-0 right-0 text-center text-[9px] opacity-30">1</span>
                </div>

                <div className="relative flex flex-col p-4 sm:p-6" style={{ color: theme.ink }}>
                  <span className="text-right text-[9px] font-extrabold uppercase tracking-[0.18em] opacity-45">Thankeeu</span>
                  {page === 1 ? (
                    <div className="flex flex-1 flex-col gap-3 py-4">
                      <MediaTile big filled={!!photoMedia} accent={design?.accent}
                        onClick={() => photoMedia ? setLightbox({ type: photoMedia.type, src: photoMedia.preview }) : setGifPickerFor(true)}
                        onRemove={photoMedia ? () => onRemoveMedia?.(media.indexOf(photoMedia)) : null}>
                        {photoMedia
                          ? (photoMedia.type === 'video' ? <video src={photoMedia.preview} className="h-full w-full object-cover" /> : <img src={photoMedia.preview} alt="" className="h-full w-full object-cover" />)
                          : <><Icon name="Image" size={22} className="opacity-45" /><span className="mt-1.5 text-[10px] font-bold opacity-55">Photo / GIF</span><span className="text-[8px] opacity-40">tap to add</span></>}
                      </MediaTile>

                      <div className="grid grid-cols-2 gap-3">
                        <MediaTile filled={!!videoMedia} accent={design?.accent}
                          onClick={() => videoMedia ? setLightbox({ type: 'video', src: videoMedia.preview }) : pick(videoInputRef)}
                          onRemove={videoMedia ? () => onRemoveMedia?.(media.indexOf(videoMedia)) : null}>
                          {videoMedia ? <video src={videoMedia.preview} className="h-full w-full object-cover" /> : <><Icon name="Film" size={18} className="opacity-45" /><span className="mt-1 text-[9px] font-bold opacity-50">Video</span></>}
                        </MediaTile>
                        <MediaTile filled={!!voiceMedia} accent={design?.accent}
                          onClick={() => voiceMedia ? setLightbox({ type: 'voice', src: voiceMedia.preview }) : pick(voiceInputRef)}
                          onRemove={voiceMedia ? () => onRemoveMedia?.(media.indexOf(voiceMedia)) : null}>
                        {voiceMedia ? <><Icon name="Mic" size={18} style={{ color: design?.accent || '#7c3aed' }} /><span className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold" style={{ color: design?.accent || '#7c3aed' }}>Voice added <Icon name="Check" size={9} /></span></> : <><Icon name="Mic" size={18} className="opacity-45" /><span className="mt-1 text-[9px] font-bold opacity-50">Voice note</span></>}
                        </MediaTile>
                      </div>

                      <div className={`flex items-center justify-center gap-2 rounded-md border ${giftActive ? 'border-amber-200 bg-amber-50' : 'border-dashed border-black/15 bg-black/[0.025]'}`} style={{ minHeight: 32 }}>
                        {giftActive ? <><span className="text-base">{giftEmoji}</span><span className="text-[10px] font-extrabold text-amber-700">{giftLabel}</span></> : <><Icon name="Heart" size={13} className="opacity-35" /><span className="text-[9px] font-bold opacity-40">More love</span></>}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col justify-center">
                      <p className="text-xs font-bold opacity-50">A quick review</p>
                      <dl className="mt-4 space-y-4 text-xs sm:text-sm">
                        <div><dt className="opacity-45">Occasion</dt><dd className="mt-1 font-bold">{occasionLabel}</dd></div>
                        <div><dt className="opacity-45">Recipient</dt><dd className="mt-1 font-bold">{recipient}</dd></div>
                        <div><dt className="opacity-45">Cover from</dt><dd className="mt-1 font-bold">{sender}</dd></div>
                        <div><dt className="opacity-45">First message</dt><dd className="mt-1 line-clamp-3 font-medium">{messageText}</dd></div>
                      </dl>
                    </div>
                  )}
                  <span className="absolute bottom-3 left-0 right-0 text-center text-[9px] opacity-30">2</span>
                </div>
              </div>
              <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-black/20 shadow-[0_0_10px_rgba(0,0,0,0.25)]" />
            </div>
          )}
        </div>
      </div>

      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFiles} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleFiles} />
      <input ref={voiceInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFiles} />

      <div className="mx-auto mt-4 flex w-fit items-center gap-3 rounded-full border border-purple-100 bg-white px-3 py-2 shadow-sm">
        <button type="button" onClick={() => movePage(-1)} disabled={page === 0} className="flex h-8 w-8 items-center justify-center rounded-full text-primary-600 disabled:opacity-30"><Icon name="ChevronLeft" size={17} /></button>
        <div className="flex items-center gap-1.5">
          {PAGE_LABELS.map((label, i) => <button key={label} type="button" aria-label={`Show ${label} page`} onClick={() => goToPage(i)} className={`h-2 rounded-full transition-all ${page === i ? 'w-8 bg-primary-500' : 'w-2 bg-warm-300'}`} />)}
        </div>
        <button type="button" onClick={() => movePage(1)} disabled={page === 2} className="flex h-8 w-8 items-center justify-center rounded-full text-primary-600 disabled:opacity-30"><Icon name="ChevronRight" size={17} /></button>
      </div>

      {gifPickerFor && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setGifPickerFor(false)}>
          <div className={`relative w-full ${gifPickerFor === 'browser' ? 'max-w-md min-h-[430px]' : 'max-w-sm'} rounded-2xl bg-white p-5 shadow-2xl`} onClick={(e) => e.stopPropagation()}>
            {gifPickerFor === 'browser' ? (
              <GifPicker onSelect={(file) => onAddMedia?.([file])} onClose={() => setGifPickerFor(false)} />
            ) : <>
            <p className="mb-3 text-center text-sm font-extrabold text-warm-800">Add to this page</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => { setGifPickerFor(false); pick(photoInputRef); }} className="flex flex-col items-center gap-2 rounded-xl border-2 border-purple-100 p-4 hover:border-primary-300">
                <Icon name="Image" size={24} className="text-primary-500" /><span className="text-xs font-bold text-warm-700">Upload Photo</span>
              </button>
              <button type="button" onClick={() => setGifPickerFor('browser')} className="flex flex-col items-center gap-2 rounded-xl border-2 border-purple-100 p-4 hover:border-primary-300">
                <span className="text-lg font-extrabold text-primary-500">GIF</span><span className="text-xs font-bold text-warm-700">Choose a GIF</span>
              </button>
            </div>
            <button type="button" onClick={() => setGifPickerFor(false)} className="mt-3 w-full rounded-xl bg-gray-100 py-2 text-xs font-bold text-warm-500">Cancel</button>
            </>}
          </div>
        </div>
      )}

      {lightbox && <Lightbox lightbox={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
};

const MediaTile = ({ children, onClick, onRemove, filled, big, accent }) => (
  <div className="relative">
    <button type="button" onClick={onClick}
      className={`flex w-full flex-col items-center justify-center overflow-hidden rounded-md text-center transition-all ${filled ? 'border-2' : 'border border-dashed border-black/15 bg-black/[0.025] hover:bg-black/[0.05]'}`}
      style={{ minHeight: big ? 170 : 104, borderColor: filled ? (accent || '#7c3aed') : undefined }}>
      {children}
    </button>
    {onRemove && (
      <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} className="absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow"><Icon name="X" size={11} /></button>
    )}
  </div>
);

const Lightbox = ({ lightbox, onClose }) => (
  <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
    <div className="relative max-h-[85vh] max-w-2xl" onClick={(e) => e.stopPropagation()}>
      {lightbox.type === 'video'
        ? <video src={lightbox.src} className="max-h-[85vh] w-full rounded-xl" controls autoPlay />
        : lightbox.type === 'voice'
          ? <div className="rounded-2xl bg-white p-8"><audio src={lightbox.src} controls autoPlay className="w-72" /></div>
          : <img src={lightbox.src} alt="" className="max-h-[85vh] w-full rounded-xl object-contain" />}
      <button type="button" onClick={onClose} className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-warm-700 shadow-lg"><Icon name="X" size={18} /></button>
    </div>
  </div>
);

export default AlbumStudioPreview;
