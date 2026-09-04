/**
 * albumFlip.js — ONE page-turn, shared by every album surface.
 *
 * Why this exists: the flip was implemented three separate times — in
 * AlbumStudioPreview (`album-leaf-*`), in AlbumSign, and again in CardView
 * (`cv-album-flip-*`, plus gutter and corner-curl pseudo-elements the others
 * never had). They drifted, so the card view never matched the preview the
 * creator was shown. Now there is a single stylesheet and a single class name;
 * they cannot diverge again.
 *
 * The realism fix: CSS `perspective` applies to an element's CHILDREN, not to
 * its own transform. Every previous copy set `perspective` on the element that
 * was itself being rotated, so `rotateY(-96deg)` was projected flat — the page
 * scaled and skewed instead of swinging through depth. The perspective now
 * lives on the STAGE (the parent), which is what makes the leading edge grow
 * and the trailing edge shrink like real paper.
 *
 * Usage:
 *   <style>{ALBUM_FLIP_CSS}</style>
 *   <div className="album-stage">
 *     <div key={page} className={`album-page-turn ${flipDirection}`}>…</div>
 *   </div>
 *
 * `flipDirection` is '' | 'forward' | 'back'. Changing the `key` on every turn
 * is what replays the animation.
 */
export const ALBUM_FLIP_DURATION_MS = 620;

export const ALBUM_FLIP_CSS = `
  /* The stage owns the perspective, so the leaf actually rotates through
     depth. Perspective on the rotating element itself does nothing to it. */
  .album-stage {
    perspective: 1600px;
    perspective-origin: 50% 46%;
    transform-style: preserve-3d;
  }
  .album-page-turn {
    transform-style: preserve-3d;
    backface-visibility: hidden;
    will-change: transform, filter;
  }
  /* Hinged on the binding edge: forward turns off the left spine,
     back off the right. The brightness dip is the shadow the page casts on
     itself as it passes through the vertical. */
  .album-page-turn.forward {
    animation: album-leaf-forward .62s cubic-bezier(.2,.72,.15,1) both;
    transform-origin: left center;
  }
  .album-page-turn.back {
    animation: album-leaf-back .62s cubic-bezier(.2,.72,.15,1) both;
    transform-origin: right center;
  }

  @keyframes album-leaf-forward {
    0%   { opacity:.25; transform: rotateY(-96deg) skewY(-1.6deg) scale(.985); filter: brightness(.70); }
    42%  { opacity:1;                                                          filter: brightness(.86); }
    64%  {              transform: rotateY(9deg)   skewY(.35deg)  scale(1.004); }
    82%  {              transform: rotateY(-3deg)  skewY(-.12deg) scale(1); }
    100% { opacity:1;   transform: rotateY(0)      skewY(0)       scale(1);     filter: brightness(1); }
  }
  @keyframes album-leaf-back {
    0%   { opacity:.25; transform: rotateY(96deg)  skewY(1.6deg)  scale(.985); filter: brightness(.70); }
    42%  { opacity:1;                                                          filter: brightness(.86); }
    64%  {              transform: rotateY(-9deg)  skewY(-.35deg) scale(1.004); }
    82%  {              transform: rotateY(3deg)   skewY(.12deg)  scale(1); }
    100% { opacity:1;   transform: rotateY(0)      skewY(0)       scale(1);     filter: brightness(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .album-page-turn.forward, .album-page-turn.back { animation-duration: .01s; }
  }
`;

export default ALBUM_FLIP_CSS;
