import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CardCoverPreview from './CardCoverPreview';
import GifPicker from './GifPicker';
import VoiceRecorder from './VoiceRecorder';
import Icon from './ui/Icon';
import Switch from './ui/Switch';
import { ALBUM_THEMES, getAlbumTheme, getContrastTextColor, getAlbumInk } from '../utils/albumThemes';
import { getFontStyle } from '../utils/cardDesigns';

const PAGE_LABELS = ['Cover', 'Message', 'Everyone'];

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

function LiveWallStudioPreview({ cards = [], onChange, creatorName, design, form }) {
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
  useEffect(() => { if (wallPage >= pageCount) setWallPage(pageCount - 1); }, [pageCount, wallPage]);

  // Reflect the cover design colors into the wall preview header
  const heroBg = design?.background || form?.background_color || 'linear-gradient(135deg,#7c3aed,#5b21b6)';
  const accent = design?.accent || '#7c3aed';
  const isCustomUrl = typeof form?.background_color === 'string' && /^https?:\/\//.test(form?.background_color);
  const headerBg = isCustomUrl
    ? `linear-gradient(180deg,rgba(0,0,0,0.25),rgba(0,0,0,0.55)),url("${form.background_color}") center/cover no-repeat`
    : heroBg;

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-[1.75rem] border border-purple-100 shadow-[0_28px_80px_rgba(27,34,48,0.20)]">
        {/* Header — reflects chosen cover design color, with decorative dot pattern + glow */}
        <div className="relative overflow-hidden px-4 py-7 text-center" style={{ background: headerBg }}>
          <div className="pointer-events-none absolute inset-0 opacity-[0.14]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1.4px, transparent 1.4px)', backgroundSize: '18px 18px' }}/>
          <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"/>
          <div className="pointer-events-none absolute -right-6 -bottom-14 h-44 w-44 rounded-full bg-white/10 blur-2xl"/>
          {design?.artwork && (
            <div className="absolute inset-0 opacity-60 pointer-events-none">
              <CardCoverPreview design={design} occasionLabel="" recipientName="" title="" senderName="" compact
                layout={{ recipient: { show: false }, title: { show: false }, sender: { show: false } }} />
            </div>
          )}
          <div className="relative z-10">
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-[10px] font-extrabold text-white uppercase tracking-widest shadow-sm">
              <Icon name="Camera" size={11}/> Live Memory Wall™
            </span>
            <h3 className="text-2xl font-black text-white drop-shadow-lg mt-2">
              {form?.recipient_name ? `For ${form.recipient_name}` : 'Memory Wall Preview'}
            </h3>
            <p className="text-white/75 text-xs mt-1.5">Guests upload photos &amp; videos from one QR link — updates in real time</p>
            <div className="mt-4 flex justify-center gap-2">
              {['📸 Photos', '🎥 Videos', '💬 Messages'].map(label => (
                <span key={label} className="rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-1.5 text-[10px] font-bold text-white shadow-sm">{label}</span>
              ))}
            </div>
            {/* Mini QR mock — visual only, communicates "scan to join" */}
            <div className="mx-auto mt-5 flex w-fit items-center gap-2.5 rounded-2xl bg-white/95 px-3 py-2 shadow-lg">
              <div className="grid grid-cols-4 grid-rows-4 gap-[1.5px]" style={{ width: 30, height: 30 }}>
                {Array.from({ length: 16 }, (_, i) => (
                  <span key={i} className="rounded-[1px]" style={{ background: [0,1,3,4,6,9,11,12,14,15].includes(i) ? '#1A1035' : 'transparent' }}/>
                ))}
              </div>
              <span className="text-left">
                <span className="block text-[9px] font-extrabold uppercase tracking-wide" style={{ color: accent }}>Scan to join</span>
                <span className="block text-[8px] text-warm-400">No app needed</span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-b from-purple-50/70 to-white px-3.5 py-4">
          <div className="grid grid-cols-2 gap-3.5">
            {visible.map((card, index) => (
              <EditableWallCard key={card.id} card={card} index={wallPage * cardsPerPage + index}
                onChange={patch => updateCard(index, patch)} onRemove={() => removeCard(index)}
                canRemove={cards.length > 1} accentColor={accent} />
            ))}
          </div>
        </div>

        <div className="border-t border-purple-50 bg-white px-3 py-3.5">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-2.5">
            <button type="button" onClick={() => go(wallPage - 1)} disabled={wallPage === 0}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-purple-100 bg-white text-primary-600 shadow-sm disabled:opacity-30 disabled:shadow-none">
              <Icon name="ChevronLeft" size={15} />
            </button>
            <span className="text-[10px] font-extrabold text-warm-600">Page {wallPage + 1} of {pageCount}</span>
            <button type="button" onClick={() => go(wallPage + 1)} disabled={wallPage === pageCount - 1}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-purple-100 bg-white text-primary-600 shadow-sm disabled:opacity-30 disabled:shadow-none">
              <Icon name="ChevronRight" size={15} />
            </button>
          </div>
          <button type="button" onClick={addRow}
            className="mx-auto flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl py-3 text-xs font-extrabold text-white shadow-lg transition-transform hover:scale-[1.02]"
            style={{ background: `linear-gradient(135deg,${accent},${accent}cc)`, boxShadow: `0 10px 28px ${accent}40` }}>
            <Icon name="Plus" size={15}/>Add another row (2 cards)
          </button>
        </div>
      </div>
    </div>
  );
}

/** BoardPreview — interactive live preview of the message-board card style,
 * structured as a grid of large clickable tiles (message / photo / voice / video)
 * so tapping a tile directly opens the 4-way media picker, rather than needing
 * to hunt for small buttons under a single textarea. */
function BoardPreview({ design, form, message, creatorName, onMessageChange, onAddMedia, media = [], onRemoveMedia, onFormChange }) {
  const accent = design?.accent || '#7c3aed';
  const boardTheme = getAlbumTheme(form?.board_background_theme || form?.album_background_theme);
  const isCustomUrl = typeof form?.background_color === 'string' && /^https?:\/\//.test(form?.background_color);
  const heroBg = boardTheme.id !== 'cover_blur'
    ? boardTheme.stage
    : isCustomUrl
      ? `linear-gradient(180deg,rgba(0,0,0,0.22),rgba(0,0,0,0.52)),url("${form.background_color}") center/cover no-repeat`
      : design?.image ? `url("${design.image}") center / cover no-repeat`
        : design?.background || `linear-gradient(135deg,${accent},${accent}cc)`;
  const recipient = form?.recipient_name?.trim() || 'Recipient';
  const sender = form?.cover_sender?.trim() || creatorName || 'You';

  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const boardPhotoRef = useRef(null);

  const handleBoardFiles = (e) => { const fs = e.target.files; if (fs?.length && onAddMedia) onAddMedia(fs); e.target.value = ''; };
  const openPickerFor = (accept) => { boardPhotoRef.current.accept = accept; boardPhotoRef.current.click(); };

  const giftActive = !!form?.is_gift_enabled;
  const isFlowerGift = ['flower', 'flowers'].includes(form?.gift_type);
  const isProductGift = ['product', 'gift'].includes(form?.gift_type);

  const [messageTileOpen, setMessageTileOpen] = useState(true);
  const [voiceRecorderOpen, setVoiceRecorderOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-purple-100 shadow-[0_24px_70px_rgba(27,34,48,0.16)]">

      {/* Hero header */}
      <div className="relative px-5 pt-7 pb-8 text-center" style={{ background: heroBg, color: '#fff' }}>
        {design?.artwork && !isCustomUrl && boardTheme.id === 'cover_blur' && (
          <div className="absolute inset-0 opacity-65 pointer-events-none">
            <CardCoverPreview design={design} occasionLabel="" recipientName="" title="" senderName="" compact
              layout={{ recipient:{show:false}, title:{show:false}, sender:{show:false} }} />
          </div>
        )}
        <button type="button" onClick={() => setThemePickerOpen(true)}
          className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1.5 text-[10px] font-extrabold text-white backdrop-blur-sm hover:bg-black/40">
          <Icon name="Layers" size={11}/> Theme
        </button>
        <div className="relative z-10">
          <h2 style={{ fontFamily:"'Great Vibes',cursive", fontSize:'clamp(1.7rem,6vw,2.4rem)', lineHeight:1.1 }}>
            {form?.title || `Happy ${(form?.occasion||'').replace(/_/g,' ')||'Celebration'}, ${recipient}!`}
          </h2>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-widest" style={{opacity:.8}}>From {sender}</p>
        </div>
      </div>

      {/* Board body */}
      <div className="bg-white px-4 pt-4 pb-2 space-y-3">

        {/* Media tiles — Thankbox-style grid: one tile per attachment already
            added, plus a trailing "Add card" tile that opens the 4-way picker.
            Keep adding cards until the 5-item cap. This matches the real data
            model (one message, one media_gallery array) while giving the
            same repeatable-tile feel as the reference. */}
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-primary-500">
            <Icon name="LayoutGrid" size={12}/> Photos, videos &amp; voice notes
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {media.map((item, idx) => (
              <div key={idx} className="group relative overflow-hidden rounded-2xl border-2 border-primary-200 bg-warm-900" style={{ aspectRatio: '3/4' }}>
                {item.type === 'video' ? (
                  <video src={item.preview} className="h-full w-full object-cover"/>
                ) : item.type === 'voice' ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 bg-purple-50 px-2">
                    <Icon name="Mic" size={22} className="text-primary-500"/>
                    <audio src={item.preview} controls className="w-full" style={{ maxWidth: 90 }}/>
                  </div>
                ) : (
                  <img src={item.preview} alt="Message attachment" className="h-full w-full object-cover"/>
                )}
                <button type="button" aria-label="Remove this card" onClick={() => onRemoveMedia?.(idx)}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <Icon name="X" size={11}/>
                </button>
                <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white">
                  <Icon name={item.type === 'video' ? 'Film' : item.type === 'voice' ? 'Mic' : 'Image'} size={10}/>
                </span>
              </div>
            ))}
            {voiceRecorderOpen && media.length < 5 && (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-primary-300 bg-primary-50/70 p-2" style={{ aspectRatio: '3/4' }}>
                <VoiceRecorder onRecorded={file => { onAddMedia?.([file]); setVoiceRecorderOpen(false); }} disabled={media.length >= 5}/>
                <button type="button" onClick={() => setVoiceRecorderOpen(false)} className="text-[9px] font-bold text-warm-400">Cancel</button>
              </div>
            )}
            {media.length < 5 && (
              <button type="button" onClick={() => setMediaPickerOpen(true)}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/40 text-center transition-colors hover:border-primary-300 hover:bg-primary-50/60"
                style={{ aspectRatio: '3/4' }}>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: accent + '18' }}>
                  <Icon name="Plus" size={18} style={{ color: accent }}/>
                </span>
                <span className="text-[10px] font-extrabold text-warm-700">{media.length ? 'Add card' : 'Tap to add'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tile grid — tap any tile to act on it directly */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Message tile — spans full width, expands to a textarea when open */}
          <div className="col-span-2 rounded-2xl border-2 border-purple-100 bg-purple-50/40 p-3">
            <button type="button" onClick={() => setMessageTileOpen(o => !o)}
              className="mb-1.5 flex w-full items-center justify-between text-left">
              <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-primary-500">
                <Icon name="PenLine" size={12}/> Your message
              </span>
              <Icon name={messageTileOpen ? 'ChevronUp' : 'ChevronDown'} size={13} className="text-primary-400"/>
            </button>
            {messageTileOpen && (
              <textarea
                className="w-full bg-transparent text-sm text-warm-800 leading-relaxed resize-none outline-none placeholder:text-warm-400"
                rows={3}
                placeholder="Write your message here — or skip and add one later…"
                value={message?.content || ''}
                onChange={e => onMessageChange?.(e.target.value)}
                style={{ minHeight: 64 }}
              />
            )}
          </div>

          {/* Gift tile — actually toggles form.is_gift_enabled now, not a decorative stub */}
          <button type="button"
            onClick={() => onFormChange?.('is_gift_enabled', !giftActive)}
            className={`col-span-2 flex items-center justify-between rounded-2xl border-2 p-3.5 transition-colors ${giftActive ? 'border-amber-300 bg-amber-50' : 'border-dashed border-purple-200 bg-purple-50/40 hover:border-amber-200'}`}>
            <span className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: giftActive ? '#FDE68A' : accent + '18' }}>
                {giftActive ? (isFlowerGift ? '💐' : isProductGift ? '🎁' : '💸') : <Icon name="Gift" size={17} style={{color:accent}}/>}
              </span>
              <span className="text-left">
                <span className="block text-[12px] font-extrabold text-warm-800">{giftActive ? 'Gift pot enabled' : 'Enable a gift pot'}</span>
                <span className="block text-[10px] font-semibold text-warm-400">{giftActive ? 'Signers can contribute when they sign' : 'Let signers chip in a gift'}</span>
              </span>
            </span>
            <span className={`relative h-6 w-11 rounded-full transition-colors ${giftActive ? 'bg-amber-400' : 'bg-gray-200'}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${giftActive ? 'translate-x-5' : 'translate-x-0.5'}`}/>
            </span>
          </button>
        </div>

        {/* Hidden input driving all tile uploads */}
        <input ref={boardPhotoRef} type="file" accept="image/*" multiple className="hidden" onChange={handleBoardFiles}/>

        <p className="pb-2 text-center text-[10px] text-warm-400">
          Each person who joins gets their own tile with a message, photo &amp; voice note
        </p>
      </div>

      {/* Media picker sheet — Photo / GIF / Video / Voice, all four, one place */}
      {mediaPickerOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setMediaPickerOpen(false)}>
          <div className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <p className="mb-3 text-center text-sm font-extrabold text-warm-800">Add to your message</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => { setMediaPickerOpen(false); openPickerFor('image/*'); }}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-purple-100 p-4 hover:border-primary-300">
                <Icon name="Image" size={22} className="text-primary-500"/>
                <span className="text-xs font-bold text-warm-700">Photo</span>
              </button>
              <button type="button" onClick={() => { setMediaPickerOpen(false); openPickerFor('image/gif'); }}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-purple-100 p-4 hover:border-primary-300">
                <Icon name="Sparkles" size={22} className="text-primary-500"/>
                <span className="text-xs font-bold text-warm-700">GIF</span>
              </button>
              <button type="button" onClick={() => { setMediaPickerOpen(false); openPickerFor('video/*'); }}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-purple-100 p-4 hover:border-primary-300">
                <Icon name="Film" size={22} className="text-primary-500"/>
                <span className="text-xs font-bold text-warm-700">Video</span>
              </button>
              <button type="button" onClick={() => { setMediaPickerOpen(false); setVoiceRecorderOpen(true); }}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-purple-100 p-4 hover:border-primary-300">
                <Icon name="Mic" size={22} className="text-primary-500"/>
                <span className="text-xs font-bold text-warm-700">Voice note</span>
              </button>
            </div>
            <p className="mt-2.5 text-center text-[9px] text-warm-400">Add as many as you like — they'll show as a carousel</p>
            <button type="button" onClick={() => setMediaPickerOpen(false)}
              className="mt-3 w-full rounded-xl bg-gray-100 py-2 text-xs font-bold text-warm-500">Cancel</button>
          </div>
        </div>
      )}

      {/* Theme picker sheet */}
      {themePickerOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setThemePickerOpen(false)}>
          <div className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <p className="mb-3 text-center text-sm font-extrabold text-warm-800">Board background theme</p>
            <div className="grid grid-cols-2 gap-2.5">
              {ALBUM_THEMES.map(t => (
                <button key={t.id} type="button"
                  onClick={() => { onFormChange?.('board_background_theme', t.id); setThemePickerOpen(false); }}
                  className={`rounded-xl border-2 p-3 text-left transition-colors ${(form?.board_background_theme||form?.album_background_theme||'cover_blur')===t.id ? 'border-primary-400 bg-primary-50' : 'border-purple-100 hover:border-purple-200'}`}>
                  <span className="mb-1.5 block h-8 w-full rounded-lg" style={{ background: t.id==='cover_blur' ? `linear-gradient(135deg,${accent},${accent}cc)` : t.stage }}/>
                  <span className="text-[11px] font-extrabold text-warm-800">{t.name}</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setThemePickerOpen(false)}
              className="mt-3 w-full rounded-xl bg-gray-100 py-2 text-xs font-bold text-warm-500">Done</button>
          </div>
        </div>
      )}
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

/* ── Sample signer pages ──────────────────────────────────────────────────────
 * The third spread used to show a dry "quick review" summary, which did not
 * tell the creator the one thing that matters: everyone who signs gets their
 * own page. These are worked-through example pages — real handwriting, real
 * names, a photo, a voice note, reactions — so the creator can see the finished
 * keepsake rather than a form recap.
 */
const SAMPLE_SIGNERS = [
  {
    name: 'Amaka O.', initials: 'AO', tint: '#F472B6',
    font: "'Caveat', cursive", size: 21,
    text: 'Three years of sitting beside you and I still steal your ideas. Have the best one yet — you have earned every bit of it. 💛',
    kind: 'photo', caption: 'Team lunch, March',
  },
  {
    name: 'Daniel K.', initials: 'DK', tint: '#7C3AED',
    font: "'Kalam', 'Caveat', cursive", size: 19,
    text: 'You talked me through my first week here and never once made me feel slow. Recorded you something instead of writing it.',
    kind: 'voice', caption: 'Voice note · 0:24',
  },
];

const SamplePhoto = ({ tint }) => (
  <svg viewBox="0 0 220 150" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="sp-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FDE9C8" /><stop offset="55%" stopColor="#F7C9A9" /><stop offset="100%" stopColor="#E9A6A0" />
      </linearGradient>
      <linearGradient id="sp-table" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8B5E3C" /><stop offset="100%" stopColor="#5C3A24" />
      </linearGradient>
    </defs>
    <rect width="220" height="150" fill="url(#sp-sky)" />
    <circle cx="176" cy="34" r="17" fill="#FFF3D6" opacity="0.85" />
    <rect y="104" width="220" height="46" fill="url(#sp-table)" />
    {/* three figures round a table — reads as a real photo at thumbnail size */}
    {[[58, '#3F3552'], [110, tint || '#7C3AED'], [162, '#2F6F63']].map(([cx, fill], i) => (
      <g key={i}>
        <ellipse cx={cx} cy={104} rx="27" ry="34" fill={fill} />
        <circle cx={cx} cy={60} r="15" fill="#C68642" />
        <path d={`M${cx - 15} 58 a15 15 0 0 1 30 0 z`} fill="#2B2118" />
      </g>
    ))}
    <ellipse cx="110" cy="126" rx="34" ry="7" fill="#F4E4CE" opacity="0.9" />
    <rect x="0" y="0" width="220" height="150" fill="#000" opacity="0.04" />
  </svg>
);

const SampleSignerPage = ({ signer, theme, ink, accent, spread, index }) => (
  <div
    className="relative flex flex-col p-5 sm:p-7"
    style={{ background: theme.page, color: ink, borderRight: index === 0 ? '1px solid rgba(0,0,0,0.12)' : undefined }}
  >
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white"
        style={{ background: signer.tint }}>{signer.initials}</span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-extrabold leading-tight">{signer.name}</span>
        <span className="block text-[9px] font-bold uppercase tracking-[0.16em] opacity-45">signed this card</span>
      </span>
    </div>

    <p className="mt-4 break-words leading-relaxed" style={{ fontFamily: signer.font, fontSize: signer.size }}>
      {signer.text}
    </p>

    {signer.kind === 'photo' ? (
      <div className="mt-4 self-start rounded-[3px] bg-white p-1.5 pb-5 shadow-[0_3px_14px_rgba(0,0,0,0.16)]"
        style={{ transform: 'rotate(-1.6deg)', width: '78%' }}>
        <div className="relative h-[104px] w-full overflow-hidden rounded-[2px]">
          <SamplePhoto tint={signer.tint} />
        </div>
        <p className="mt-1 text-center text-[10px]" style={{ fontFamily: "'Caveat', cursive", color: '#5b5570' }}>{signer.caption}</p>
        <span className="absolute -top-1.5 left-1/2 h-3 w-9 -translate-x-1/2 rounded-[2px]" style={{ background: `${signer.tint}77` }} />
      </div>
    ) : (
      <>
      {/* Video still — a real frame with a play badge, so "videos" is shown
          rather than only claimed in the caption. */}
      <div className="mt-4 self-start overflow-hidden rounded-xl shadow-[0_3px_14px_rgba(0,0,0,0.14)]" style={{ width: '74%' }}>
        <div className="relative h-[92px] w-full">
          <SamplePhoto tint={signer.tint} />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm">
              <Icon name="Play" size={15} className="ml-0.5 text-white" />
            </span>
          </span>
          <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[8px] font-extrabold text-white">0:12</span>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 self-start">
        <span className="inline-flex items-center gap-1 rounded-md border border-black/10 bg-white/70 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide"
          style={{ color: accent }}>GIF</span>
        <span className="text-[10px] font-semibold opacity-45">reaction added</span>
      </div>
      <div className="mt-2.5 flex items-center gap-2.5 self-start rounded-2xl border px-3 py-2.5"
        style={{ borderColor: `${accent}44`, background: `${accent}0f`, width: '82%' }}>
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ background: accent }}>
          <Icon name="Mic" size={14} className="text-white" />
        </span>
        <span className="flex flex-1 items-end gap-[3px]" aria-hidden="true">
          {[7, 13, 20, 11, 24, 16, 9, 19, 13, 22, 8, 15, 11, 6].map((h, i) => (
            <span key={i} className="w-[3px] rounded-full" style={{ height: h, background: accent, opacity: 0.28 + (i % 4) * 0.18 }} />
          ))}
        </span>
        <span className="text-[10px] font-extrabold opacity-60">0:24</span>
      </div>
      </>
    )}

    <div className="mt-auto flex items-center justify-between pt-5">
      <span className="inline-flex items-center gap-1 text-[11px] font-bold opacity-55">
        <span>❤️</span><span>🎉</span><span className="ml-0.5">{signer.kind === 'photo' ? 6 : 4}</span>
      </span>
      <span className="text-[9px] opacity-30">{index + 3}</span>
    </div>
  </div>
);

const AlbumStudioPreview = ({
  design, form, message, occasionLabel, activeStep, creatorName,
  layout, onLayoutChange, onCardLayoutChange, selectedField, onSelectField,
  media = [], onAddMedia, onRemoveMedia, onMessageChange, recipientPhoto, onRecipientPhoto, onFormChange,
  wallDrafts = [], onWallDraftsChange,
}) => {
  const [page, setPage] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const [gifPickerFor, setGifPickerFor] = useState(false);
  const [voiceRecorderOpen, setVoiceRecorderOpen] = useState(false);
  const [flipDirection, setFlipDirection] = useState('');
  const audioCtxRef = useRef(null);
  const flipTimerRef = useRef(null);
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const recipientInputRef = useRef(null);

  // Whether this preview offers a compose surface at all. The card wizard passes
  // no message/media handlers any more (creators write on the live card, with
  // everyone else), so the Message leaf is preview-only there and is hidden.
  const canCompose = !!onMessageChange;
  const NAV_PAGES = useMemo(() => (canCompose ? [0, 1, 2] : [0, 2]), [canCompose]);
  const isLiveWall = ['wall_only', 'card_and_wall'].includes(form.card_experience);
  // Board mode is retired — kept as a constant so the legacy branches below
  // compile out rather than being deleted in a dozen places.
  const isBoard = false;
  const theme = getAlbumTheme(form.album_background_theme);
  const pageInk = getAlbumInk(theme, 'page');
  const coverTextColor = form.cover_text_color && form.cover_text_color !== 'auto'
    ? form.cover_text_color
    : getContrastTextColor(form.background_color, design);
  const messageFont = getFontStyle(message.font_style);

  useEffect(() => {
    if (isLiveWall || isBoard) { setPage(0); return; }
    if (activeStep === 3) setPage(canCompose ? 1 : 2);
    else if (activeStep === 4) setPage(2);
    else setPage(0);
  }, [activeStep, isBoard, isLiveWall, canCompose]);

  const stageBackground = useMemo(() => {
    if (theme.id !== 'cover_blur') return theme.stage;
    if (typeof form.background_color === 'string' && /^https?:\/\//.test(form.background_color)) {
      return `url("${form.background_color}") center / cover no-repeat`;
    }
    if (design?.artwork) return design?.background || theme.stage;
    if (design?.image) return `url("${design.image}") center / cover no-repeat`;
    return design?.background || theme.stage;
  }, [design, theme, form.background_color]);

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
    // Snap to the nearest *navigable* leaf, so the Message page is skipped
    // whenever this preview is read-only.
    const clampedTarget = Math.min(2, Math.max(0, target));
    const next = NAV_PAGES.includes(clampedTarget)
      ? clampedTarget
      : NAV_PAGES.reduce((best, candidate) =>
          Math.abs(candidate - clampedTarget) < Math.abs(best - clampedTarget) ? candidate : best, NAV_PAGES[0]);
    if (next === page) return;
    setFlipDirection(next > page ? 'forward' : 'back');
    playFlipSound();
    setPage(next);
    clearTimeout(flipTimerRef.current);
    flipTimerRef.current = setTimeout(() => setFlipDirection(''), 620);
  }, [page, playFlipSound, NAV_PAGES]);
  const movePage = (d) => {
    const at = NAV_PAGES.indexOf(page);
    const next = NAV_PAGES[Math.min(NAV_PAGES.length - 1, Math.max(0, (at === -1 ? 0 : at) + d))];
    goToPage(next);
  };
  const recipient = form.recipient_name?.trim() || 'Recipient name';
  const sender = form.cover_sender?.trim() || creatorName || 'Your name';
  const messageText = message.content?.trim()
    || 'Every person who signs gets a page like this — their words, photos, videos, GIFs and voice notes. Yours included, once the card is live.';

  const photoMedia = media.find(m => m.type === 'image' || m.type === 'gif');
  const videoMedia = media.find(m => m.type === 'video');
  const voiceMedia = media.find(m => m.type === 'voice');
  // Carousel: all photos/GIFs and all videos as separate arrays
  const allPhotos = media.filter(m => m.type === 'image' || m.type === 'gif');
  const allVideos = media.filter(m => m.type === 'video');
  const [photoCarouselIdx, setPhotoCarouselIdx] = useState(0);
  const [videoCarouselIdx, setVideoCarouselIdx] = useState(0);
  const activePhoto = allPhotos[Math.min(photoCarouselIdx, allPhotos.length - 1)];
  const activeVideo = allVideos[Math.min(videoCarouselIdx, allVideos.length - 1)];
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

      {/* The message-board layout was retired: a group card is always an album. */}


      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-warm-500">
            Live {isBoard ? 'board' : 'album'} preview
          </p>
          <p className="mt-1 text-sm font-bold text-warm-900">
            {isBoard
                ? 'Messages appear as a scrollable board'
                : (PAGE_LABELS[page] + (page === 0 ? ' · drag & edit texts'
                    : page === 1 && canCompose ? ' · tap to add media'
                    : page === 2 ? ' · a page per person who signs' : ''))}
          </p>
        </div>
        <span className="rounded-md border border-purple-100 bg-white px-2.5 py-1 text-[10px] font-extrabold text-warm-500">Editable</span>
      </div>

      {/* Multi-page hint — tells creator signers will add their own pages */}
      {page === 2 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-purple-100 bg-white px-3 py-2.5">
          <p className="flex items-center gap-2 text-xs font-semibold text-warm-700">
            <Icon name="Users" size={15} className="flex-shrink-0 text-primary-500"/>
            Every signer gets their own page like these — words, photos, videos, GIFs and voice notes.
          </p>
          {onFormChange && (
            <button type="button" onClick={() => onFormChange('is_gift_enabled', !form.is_gift_enabled)}
              aria-pressed={!!form.is_gift_enabled}
              className={`inline-flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition-colors ${form.is_gift_enabled ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-dashed border-purple-200 bg-white text-warm-700 hover:border-primary-300'}`}>
              <Icon name="Gift" size={14} />
              {form.is_gift_enabled ? 'Gift collection included' : 'Add a gift pot'}
              <Switch on={!!form.is_gift_enabled} />
            </button>
          )}
        </div>
      )}

      {!isBoard && page === 1 && (
        <div className="mb-3 flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
          <Icon name="Users" size={15} className="text-amber-600 flex-shrink-0"/>
          <p className="text-xs text-amber-700 font-semibold leading-snug">
            Each person who signs gets their own page. Swipe right to see more pages added as people sign →
          </p>
        </div>
      )}

      {isBoard && (
        <BoardPreview design={design} form={form} message={message} creatorName={creatorName}
          onMessageChange={onMessageChange} onAddMedia={onAddMedia} media={media} onRemoveMedia={onRemoveMedia} onFormChange={onFormChange} />
      )}

      {!isBoard && <div className="relative overflow-hidden border border-black/5 shadow-[0_24px_70px_rgba(27,34,48,0.16)]"
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
              {page === 2 ? (
                /* "Everyone" spread — what the card becomes once people sign. */
                <div className="grid grid-cols-2 overflow-hidden rounded-md shadow-2xl" style={{ background: theme.page, minHeight: 'clamp(340px, 48vw, 540px)' }}>
                  {SAMPLE_SIGNERS.map((signer, i) => (
                    <SampleSignerPage key={signer.name} signer={signer} theme={theme} ink={pageInk}
                      accent={design?.accent || '#7C3AED'} index={i} />
                  ))}
                </div>
              ) : (
              <div className="grid grid-cols-2 overflow-hidden rounded-md shadow-2xl" style={{ background: theme.page, minHeight: 'clamp(340px, 48vw, 540px)' }}>
                <div className="relative flex flex-col border-r border-black/15 p-5 sm:p-7" style={{ color: pageInk }}>
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] opacity-45">For {recipient}</span>
                  {page === 1 ? (
                    <div className="flex flex-1 flex-col justify-center">
                      {onMessageChange ? (
                        <textarea value={message.content || ''} onChange={(e) => onMessageChange(e.target.value)}
                          placeholder="Click here and write your message…" aria-label="Edit message directly in live preview"
                          className="min-h-[170px] w-full resize-none rounded-xl border border-dashed border-black/15 bg-white/35 p-3 text-lg leading-relaxed outline-none transition focus:border-primary-400 focus:bg-white/60 sm:text-2xl"
                          style={{ fontFamily: messageFont.family, color: pageInk }} />
                      ) : <p className="break-words text-lg leading-relaxed sm:text-2xl" style={{ fontFamily: messageFont.family }}>{messageText}</p>}
                      <p className="mt-6 text-xs font-bold opacity-60">— {sender}</p>
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col justify-center">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] opacity-45">Ready to bring everyone together</p>
                      <p className="mt-3 text-2xl font-extrabold leading-tight sm:text-4xl">{form.title || `${recipient}'s card`}</p>
                      <div className="mt-7 space-y-3 text-xs sm:text-sm">
                        <p className="flex items-center gap-2"><Icon name="Calendar" size={14} /> {form.send_date || 'Send whenever you are ready'}</p>
                        <button type="button" onClick={() => onFormChange?.('is_gift_enabled', !form.is_gift_enabled)}
                          className={`flex w-full items-center justify-between gap-2 rounded-xl border-2 px-3 py-2 text-left transition-colors ${form.is_gift_enabled ? 'border-amber-300 bg-amber-50' : 'border-dashed border-black/15 bg-white/40 hover:border-primary-300'}`}>
                          <span className="flex items-center gap-2">
                            <Icon name="Gift" size={14} />
                            <span className="font-bold">{form.is_gift_enabled ? 'Gift collection included' : 'Messages only — tap to add a gift pot'}</span>
                          </span>
                          <Switch on={!!form.is_gift_enabled} />
                        </button>
                      </div>
                    </div>
                  )}
                  <span className="absolute bottom-3 left-0 right-0 text-center text-[9px] opacity-30">1</span>
                </div>

                <div className="relative flex flex-col p-4 sm:p-6" style={{ color: pageInk }}>
                  <span className="text-right text-[9px] font-extrabold uppercase tracking-[0.18em] opacity-45">Thankeeu</span>
                  {page === 1 ? (
                    <div className="flex flex-1 flex-col gap-3 py-4">
                      <MediaTile big filled={!!activePhoto} accent={design?.accent}
                        onClick={() => activePhoto ? setLightbox({ type: activePhoto.type, src: activePhoto.preview }) : setGifPickerFor(true)}
                        onRemove={activePhoto ? () => { onRemoveMedia?.(media.indexOf(activePhoto)); setPhotoCarouselIdx(0); } : null}>
                        {activePhoto ? (
                          <div className="relative h-full w-full">
                            {activePhoto.type === 'video'
                              ? <video src={activePhoto.preview} className="h-full w-full object-cover" />
                              : <img src={activePhoto.preview} alt="" className="h-full w-full object-cover" />}
                            {allPhotos.length > 1 && (
                              <div className="absolute inset-x-0 bottom-1 flex items-center justify-center gap-1">
                                <button type="button" onClick={e => { e.stopPropagation(); setPhotoCarouselIdx(i => Math.max(0, i - 1)); }}
                                  className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white" disabled={photoCarouselIdx === 0}>
                                  <Icon name="ChevronLeft" size={10}/>
                                </button>
                                <span className="rounded-full bg-black/60 px-1.5 py-0.5 text-[8px] font-bold text-white">{photoCarouselIdx + 1}/{allPhotos.length}</span>
                                <button type="button" onClick={e => { e.stopPropagation(); setPhotoCarouselIdx(i => Math.min(allPhotos.length - 1, i + 1)); }}
                                  className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white" disabled={photoCarouselIdx >= allPhotos.length - 1}>
                                  <Icon name="ChevronRight" size={10}/>
                                </button>
                              </div>
                            )}
                          </div>
                        ) : <><Icon name="Image" size={22} className="opacity-45" /><span className="mt-1.5 text-[10px] font-bold opacity-55">Photo / GIF</span><span className="text-[8px] opacity-40">tap to add · add multiple</span></>}
                      </MediaTile>

                      <div className="grid grid-cols-2 gap-3">
                        <MediaTile filled={!!activeVideo} accent={design?.accent}
                          onClick={() => activeVideo ? setLightbox({ type: 'video', src: activeVideo.preview }) : pick(videoInputRef)}
                          onRemove={activeVideo ? () => { onRemoveMedia?.(media.indexOf(activeVideo)); setVideoCarouselIdx(0); } : null}>
                          {activeVideo ? (
                            <div className="relative h-full w-full">
                              <video src={activeVideo.preview} className="h-full w-full object-cover" />
                              {allVideos.length > 1 && (
                                <div className="absolute inset-x-0 bottom-0.5 flex items-center justify-center gap-0.5">
                                  <button type="button" onClick={e => { e.stopPropagation(); setVideoCarouselIdx(i => Math.max(0, i - 1)); }}
                                    className="flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white" disabled={videoCarouselIdx === 0}>
                                    <Icon name="ChevronLeft" size={8}/>
                                  </button>
                                  <span className="rounded-full bg-black/60 px-1 py-0 text-[7px] font-bold text-white">{videoCarouselIdx + 1}/{allVideos.length}</span>
                                  <button type="button" onClick={e => { e.stopPropagation(); setVideoCarouselIdx(i => Math.min(allVideos.length - 1, i + 1)); }}
                                    className="flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white" disabled={videoCarouselIdx >= allVideos.length - 1}>
                                    <Icon name="ChevronRight" size={8}/>
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : <><Icon name="Film" size={18} className="opacity-45" /><span className="mt-1 text-[9px] font-bold opacity-50">Video</span></>}
                        </MediaTile>
                        <MediaTile filled={!!voiceMedia} accent={design?.accent}
                          onClick={() => voiceMedia ? setLightbox({ type: 'voice', src: voiceMedia.preview }) : setVoiceRecorderOpen(true)}
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
              )}
              <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-black/20 shadow-[0_0_10px_rgba(0,0,0,0.25)]" />
            </div>
          )}
        </div>
      </div>}

      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFiles} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleFiles} />

      {/* Pager dots — only for album flipbook */}
      {!isBoard && (
      <div className="mx-auto mt-4 flex w-fit items-center gap-3 rounded-full border border-purple-100 bg-white px-3 py-2 shadow-sm">
        <button type="button" onClick={() => movePage(-1)} disabled={page === NAV_PAGES[0]} className="flex h-8 w-8 items-center justify-center rounded-full text-primary-600 disabled:opacity-30"><Icon name="ChevronLeft" size={17} /></button>
        <div className="flex items-center gap-1.5">
          {NAV_PAGES.map(i => <button key={PAGE_LABELS[i]} type="button" aria-label={`Show ${PAGE_LABELS[i]} page`} onClick={() => goToPage(i)} className={`h-2 rounded-full transition-all ${page === i ? 'w-8 bg-primary-500' : 'w-2 bg-warm-300'}`} />)}
        </div>
        <button type="button" onClick={() => movePage(1)} disabled={page === NAV_PAGES[NAV_PAGES.length - 1]} className="flex h-8 w-8 items-center justify-center rounded-full text-primary-600 disabled:opacity-30"><Icon name="ChevronRight" size={17} /></button>
      </div>
      )}

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

      {voiceRecorderOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setVoiceRecorderOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-primary-600"><Icon name="Mic" size={24}/></span>
            <h3 className="mt-3 text-base font-extrabold text-warm-900">Record a voice note</h3>
            <p className="mt-1 text-xs leading-relaxed text-warm-500">Use your microphone to record now. Thankeeu does not ask you to upload an audio file.</p>
            <div className="mt-5 flex justify-center">
              <VoiceRecorder onRecorded={file => { onAddMedia?.([file]); setVoiceRecorderOpen(false); }}/>
            </div>
            <button type="button" onClick={() => setVoiceRecorderOpen(false)} className="mt-4 w-full rounded-xl bg-gray-100 py-2.5 text-xs font-bold text-warm-600">Cancel</button>
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
