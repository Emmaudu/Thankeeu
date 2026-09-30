/**
 * MediaSwiper — one swipeable media carousel, used by the Send Money composer
 * preview and by the recipient's card.
 *
 * Takes a normalised list of `{ url, type }` where type is
 * 'image' | 'gif' | 'video' | 'voice' | 'audio'. Callers map their own shape
 * into that: the composer holds local object-URLs, the recipient's card holds
 * stored URLs read through utils/messageMedia.js.
 *
 * Swipe works on touch, arrows and dots work everywhere, and the keyboard can
 * reach both arrows. A single attachment renders without any chrome.
 */
import { useRef, useState } from 'react';
import Icon from './ui/Icon';

const MediaSwiper = ({ items = [], height = 160, accent = '#7C3AED', rounded = 'rounded-xl' }) => {
  const [idx, setIdx] = useState(0);
  const startX = useRef(null);

  const list = (items || []).filter(m => m && m.url);
  if (!list.length) return null;

  const clamped = Math.min(idx, list.length - 1);
  const active = list[clamped];
  const go = (next) => setIdx((next + list.length) % list.length);

  const onTouchStart = (e) => { startX.current = e.touches?.[0]?.clientX ?? null; };
  const onTouchEnd = (e) => {
    const from = startX.current; startX.current = null;
    const to = e.changedTouches?.[0]?.clientX;
    if (from == null || to == null || list.length < 2) return;
    const dx = to - from;
    if (Math.abs(dx) > 45) go(dx < 0 ? clamped + 1 : clamped - 1);
  };

  return (
    <div className={`relative overflow-hidden ${rounded}`} style={{ height }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {active.type === 'video' ? (
        <video src={active.url} controls playsInline className="h-full w-full object-cover" />
      ) : active.type === 'voice' || active.type === 'audio' ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 bg-purple-50 px-4">
          <Icon name="Mic" size={20} style={{ color: accent }} />
          <audio src={active.url} controls className="w-full" />
        </div>
      ) : (
        // GIFs are images — an <img> animates them.
        <img src={active.url} alt="" loading="lazy" className="h-full w-full object-cover" />
      )}

      {list.length > 1 && (
        <>
          <button type="button" onClick={() => go(clamped - 1)} aria-label="Previous attachment"
            className="absolute left-1.5 top-1/2 flex h-7 min-h-0 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75">
            <Icon name="ChevronLeft" size={13} />
          </button>
          <button type="button" onClick={() => go(clamped + 1)} aria-label="Next attachment"
            className="absolute right-1.5 top-1/2 flex h-7 min-h-0 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75">
            <Icon name="ChevronRight" size={13} />
          </button>

          {/* The strip spans the full width, so it must not swallow clicks
              meant for the arrows sitting behind it — only the dots take them. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-1.5 flex items-center justify-center gap-1.5">
            {list.map((_, i) => (
              <button key={i} type="button" onClick={() => setIdx(i)} aria-label={`Attachment ${i + 1}`}
                className="pointer-events-auto h-1.5 min-h-0 rounded-full transition-all"
                style={{ width: i === clamped ? 14 : 6, background: i === clamped ? '#fff' : 'rgba(255,255,255,0.55)' }} />
            ))}
          </div>

          <span className="absolute right-1.5 top-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[9px] font-bold text-white">
            {clamped + 1}/{list.length}
          </span>
        </>
      )}
    </div>
  );
};

export default MediaSwiper;
