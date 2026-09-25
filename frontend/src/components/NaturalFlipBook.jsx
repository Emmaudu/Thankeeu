/**
 * NaturalFlipBook — a real, hand-turned page flip for every album flipbook
 * (homepage sample, card view, signing album, creation live preview).
 *
 * The earlier flipbooks rotated a flat, rigid leaf around the spine. Real
 * paper doesn't do that: a hand lifts a CORNER, the page folds diagonally,
 * the fold line sweeps across as the page travels, the underside shows, and
 * shadows fall inside the fold and onto the page beneath. That is what this
 * renders, using the StPageFlip engine (vendored in src/vendor, MIT):
 *
 *   • hover a corner → the paper lifts a little (showPageCorners);
 *   • press and drag a corner → the page follows the finger / mouse, folding
 *     exactly where you pull it; let go past the middle and it completes,
 *     otherwise it falls back;
 *   • tap / click a page, swipe, the arrows or ← → keys → an animated
 *     corner-lift turn with the same fold and shadows;
 *   • covers are "hard" (card stock swings stiffly), inner pages are "soft"
 *     (they curl).
 *
 * Two-page spreads when there is room, one page at a time on narrow screens
 * (measured on the component's own width, so it is right on every device).
 *
 * Page contents are ordinary React (rendered through portals into the page
 * elements the engine moves around), so buttons, audio, replies etc. inside a
 * page keep working — pressing them never starts a turn.
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PageFlip } from '../vendor/page-flip';
import '../vendor/page-flip.css';
import { playPageTurn } from '../utils/pageTurn';

// Things inside a page that must stay clickable / draggable / selectable.
const INTERACTIVE = 'button,a,input,textarea,select,option,label,audio,video,iframe,[contenteditable="true"],[data-noflip]';

export const FLIP_MS = 950;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * @param pages        [{ key, content: ReactNode, hard?: boolean }]
 * @param ratio        page height / width (A4 portrait = 297/210)
 * @param maxPageWidth largest page width in px
 * @param minPageWidth below this a spread won't fit → single pages
 * @param maxPageHeight optional cap (e.g. viewport-based)
 * @param forceSingle  always one page at a time
 * @param showCover    first (and last) page stand alone like a real book cover
 * @param startPage    initial page index
 * @param onPageChange (index) => void
 * @param sound        play the paper sound on user turns (default true)
 * @param volume       0–1 loudness of that sound (default 0.6)
 * @param centerClosed centre the book while it is closed on its front/back cover
 */
const NaturalFlipBook = forwardRef(function NaturalFlipBook({
  pages,
  ratio = 297 / 210,
  maxPageWidth = 360,
  minPageWidth = 200,
  maxPageHeight = Infinity,
  forceSingle = false,
  showCover = true,
  startPage = 0,
  onPageChange,
  onStateChange,
  sound = true,
  volume = 0.6,
  centerClosed = true,
  flippingTime = FLIP_MS,
  className = '',
  pageClassName = '',
  bookStyle,
  controls,
}, ref) {
  const outerRef = useRef(null);
  const hostRef = useRef(null);
  const pfRef = useRef(null);
  const indexRef = useRef(startPage);
  const userAt = useRef(0);
  const stateRef = useRef('read');
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const onChangeRef = useRef(onPageChange);
  const onStateRef = useRef(onStateChange);
  onChangeRef.current = onPageChange;
  onStateRef.current = onStateChange;

  const [avail, setAvail] = useState(0);
  const [index, setIndex] = useState(startPage);
  const [flipping, setFlipping] = useState(false);

  // ── Measure our own width ────────────────────────────────────────────────
  useLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return undefined;
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = Math.floor(el.clientWidth || 0);
        setAvail(prev => (Math.abs(prev - w) >= 2 ? w : prev));
      });
    };
    setAvail(Math.floor(el.clientWidth || 0));
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', measure); };
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  // ── Page size + one/two page layout ──────────────────────────────────────
  const single = forceSingle || avail < minPageWidth * 2;
  let pageW = single ? Math.min(avail, maxPageWidth) : Math.min(Math.floor(avail / 2), maxPageWidth);
  if (pageW * ratio > maxPageHeight) pageW = Math.floor(maxPageHeight / ratio);
  pageW = Math.max(120, Math.floor(pageW));
  const pageH = Math.round(pageW * ratio);
  const ready = avail > 0;

  // ── Page elements the engine owns; React renders INTO them via portals ──
  const count = pages.length;
  const hardSig = pages.map(p => (p.hard ? 'h' : 's')).join('');
  const buildKey = `${count}|${hardSig}|${pageW}|${single}|${showCover}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const els = useMemo(() => pages.map((p) => {
    const d = document.createElement('div');
    d.className = `nfb-page ${pageClassName}`;
    d.dataset.density = p.hard ? 'hard' : 'soft';
    const stop = (e) => { if (e.target?.closest?.(INTERACTIVE)) e.stopPropagation(); };
    d.addEventListener('mousedown', stop);
    d.addEventListener('touchstart', stop, { passive: true });
    // Hovering a button near a page corner shouldn't lift the corner while
    // someone is about to click it (or typing a reply there).
    d.addEventListener('mousemove', (e) => {
      const st = stateRef.current;
      if ((st === 'read' || st === 'fold_corner') && e.target?.closest?.(INTERACTIVE)) e.stopPropagation();
    });
    return d;
  }), [buildKey]);

  useLayoutEffect(() => {
    if (!ready || !hostRef.current || !els.length) return undefined;
    const block = document.createElement('div');
    hostRef.current.appendChild(block);
    const start = clamp(indexRef.current, 0, els.length - 1);
    const pf = new PageFlip(block, {
      startPage: start,
      size: 'fixed',
      width: pageW,
      height: pageH,
      minWidth: pageW, maxWidth: pageW, minHeight: pageH, maxHeight: pageH,
      drawShadow: true,
      flippingTime,
      usePortrait: true,
      startZIndex: 0,
      autoSize: true,
      maxShadowOpacity: 0.4,
      showCover,
      mobileScrollSupport: true,
      swipeDistance: 30,
      clickEventForward: true,
      useMouseEvents: true,
      showPageCorners: true,
      disableFlipByClick: false,
    });
    pf.on('flip', (e) => {
      const i = Number(e.data) || 0;
      indexRef.current = i;
      setIndex(i);
      onChangeRef.current?.(i);
    });
    pf.on('changeState', (e) => {
      const s = e.data;
      stateRef.current = s;
      setFlipping(s !== 'read');
      onStateRef.current?.(s);
      if (s === 'flipping' && sound && Date.now() - userAt.current < 1600) playPageTurn(volumeRef.current);
    });
    pf.loadFromHTML(els);
    pfRef.current = pf;
    indexRef.current = start;
    setIndex(start);
    onChangeRef.current?.(start);
    return () => {
      pfRef.current = null;
      try { pf.destroy(); } catch { /* already gone */ }
      // The engine moved our page elements into its block; take them back out
      // so React's portals can unmount cleanly.
      els.forEach(el => { el.remove(); });
      block.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [els, ready, pageW, pageH, flippingTime]);


  // ── Controls ─────────────────────────────────────────────────────────────
  const markUser = () => { userAt.current = Date.now(); };
  const api = useMemo(() => ({
    next: (user = true) => { if (user) markUser(); const pf = pfRef.current; if (pf && pf.getState?.() === 'read') pf.flipNext('bottom'); },
    prev: (user = true) => { if (user) markUser(); const pf = pfRef.current; if (pf && pf.getState?.() === 'read') pf.flipPrev('bottom'); },
    flipTo: (i, user = true) => {
      if (user) markUser();
      const pf = pfRef.current;
      // A page that doesn't exist yet (just added, the book rebuilds on the
      // next render) — remember it; the rebuild opens the book there.
      if (!pf || i > count - 1) { indexRef.current = Math.max(0, i); return; }
      const to = clamp(i, 0, count - 1);
      const cur = pf.getCurrentPageIndex();
      // Neighbouring page → a real animated turn; far away → jump there.
      const step = single ? 1 : 2;
      if (Math.abs(to - cur) <= step) pf.flip(to, 'bottom');
      else pf.turnToPage(to);
      if (Math.abs(to - cur) > step) { indexRef.current = to; setIndex(to); onChangeRef.current?.(to); }
    },
    getIndex: () => indexRef.current,
    isSingle: () => single,
  }), [count, single]);
  useImperativeHandle(ref, () => api, [api]);

  const onKeyDown = useCallback((e) => {
    const tag = (e.target?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); api.next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); api.prev(); }
  }, [api]);

  // Centre a closed book (front cover alone on the right, back cover alone on
  // the left) the way a real book sits on a table.
  const last = count - 1;
  let shift = 0;
  if (centerClosed && showCover && !single && !flipping) {
    if (index === 0) shift = -pageW / 2;
    else if (index === last && count % 2 === 0) shift = pageW / 2;
  }

  return (
    <div ref={outerRef} className={`nfb w-full ${className}`}
      onPointerDownCapture={markUser} onKeyDown={onKeyDown}>
      <style>{NFB_CSS}</style>
      <div className="nfb-stage" style={{ height: ready ? pageH : 0 }}>
        <div ref={hostRef} className="nfb-host"
          style={{
            width: single ? pageW : pageW * 2,
            height: pageH,
            transform: `translateX(${shift}px)`,
            ...bookStyle,
          }} />
        {ready && <div className="nfb-floor" style={{ width: (single ? pageW : pageW * 2) * 0.92 }} aria-hidden="true" />}
      </div>
      {ready && typeof controls === 'function' && controls({ index, single, count, api, flipping, pageW, pageH })}
      {els.map((el, i) => (pages[i] ? createPortal(
        <div className="nfb-inner" style={{ width: pageW, height: pageH }}>{pages[i].content}</div>,
        el,
        pages[i].key ?? i,
      ) : null))}
    </div>
  );
});

export default NaturalFlipBook;

const NFB_CSS = `
.nfb { user-select: none; -webkit-user-select: none; }
.nfb-stage { position: relative; display: flex; justify-content: center; }
.nfb-host { position: relative; transition: transform .7s cubic-bezier(.4,0,.2,1); z-index: 1; }
.nfb-host .stf__parent { margin: 0 auto; }
.nfb-floor { position: absolute; bottom: -14px; left: 50%; transform: translateX(-50%); height: 26px; border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(49,24,99,.26), transparent 70%); filter: blur(5px); pointer-events: none; z-index: 0; }
.nfb-page { background: #fffdf8; overflow: hidden; }
.nfb-page.--hard { background: #1a1035; }
.nfb-inner { position: relative; overflow: hidden; }
/* A soft paper gutter so a spread reads as one bound book. */
.nfb-page.--left .nfb-inner::after, .nfb-page.--right .nfb-inner::after {
  content: ''; position: absolute; top: 0; bottom: 0; width: 26px; pointer-events: none; z-index: 5; }
.nfb-page.--left .nfb-inner::after  { right: 0; background: linear-gradient(270deg, rgba(0,0,0,.16), rgba(0,0,0,0)); }
.nfb-page.--right .nfb-inner::after { left: 0;  background: linear-gradient(90deg,  rgba(0,0,0,.16), rgba(0,0,0,0)); }
.nfb-page.--hard .nfb-inner::after { display: none; }
@media (prefers-reduced-motion: reduce) { .nfb-host { transition: none; } }
`;

/** Helpers for "views" (what the reader sees at once: one page, or a spread). */
export function flipViews(count, single, showCover = true) {
  if (single || !showCover) {
    const step = single ? 1 : 2;
    return Array.from({ length: Math.ceil(count / step) }, (_, v) => v * step);
  }
  const starts = [0];
  for (let i = 1; i < count; i += 2) starts.push(i);
  return starts;
}
export function viewOf(index, count, single, showCover = true) {
  const v = flipViews(count, single, showCover);
  let k = 0;
  for (let i = 0; i < v.length; i++) if (v[i] <= index) k = i;
  return k;
}
