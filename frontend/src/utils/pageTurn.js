/**
 * pageTurn.js — the realistic page turn shared by every album flipbook
 * (homepage sample, card view, signing album, builder preview).
 *
 * A turn is a real two-sided LEAF hinged on the spine that rotates 180° in
 * perspective: its front is the page you were reading, its back is the page
 * that lands on the other side. Light moves across the paper as it turns, and
 * it casts a shadow on the page it is uncovering.
 *
 *   <style>{PAGE_TURN_CSS}</style>
 *   <div className="pt-book">              ← perspective lives here
 *     …base pages…
 *     <div className="pt-leaf pt-fwd" style={{ left: '50%', width: '50%' }}>
 *       <div className="pt-face pt-front">…<div className="pt-shade"/></div>
 *       <div className="pt-face pt-back">…<div className="pt-shade"/></div>
 *     </div>
 *   </div>
 *
 * playPageTurn() makes the paper sound: a swept, filtered rustle as the leaf
 * lifts and swings, then a soft landing. Synthesised with Web Audio, so there
 * is no file to download. Browsers only allow audio after the visitor has
 * tapped/clicked, which is exactly when a manual turn happens.
 */

export const PAGE_TURN_MS = 900;

export const PAGE_TURN_CSS = `
.pt-book { position: relative; perspective: 2300px; perspective-origin: 50% 40%; transform-style: preserve-3d; }
.pt-leaf { position: absolute; top: 0; bottom: 0; transform-style: preserve-3d; z-index: 6; will-change: transform; pointer-events: none; }
.pt-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; overflow: hidden; }
.pt-back { transform: rotateY(180deg); }
.pt-leaf.pt-fwd { transform-origin: left center;  animation: pt-fwd ${PAGE_TURN_MS}ms cubic-bezier(.42,.08,.22,1) forwards; }
.pt-leaf.pt-bwd { transform-origin: right center; animation: pt-bwd ${PAGE_TURN_MS}ms cubic-bezier(.42,.08,.22,1) forwards; }
/* The paper lifts, bows toward the viewer mid-turn, then settles flat. */
@keyframes pt-fwd {
  0%   { transform: rotateY(0deg)    translateZ(0)    scaleY(1); }
  10%  { transform: rotateY(-12deg)  translateZ(10px) scaleY(1.004) skewY(-1deg); }
  50%  { transform: rotateY(-90deg)  translateZ(34px) scaleY(1.02)  skewY(-2.2deg); }
  85%  { transform: rotateY(-170deg) translateZ(8px)  scaleY(1.004) skewY(-.6deg); }
  100% { transform: rotateY(-180deg) translateZ(0)    scaleY(1); }
}
@keyframes pt-bwd {
  0%   { transform: rotateY(0deg)   translateZ(0)    scaleY(1); }
  10%  { transform: rotateY(12deg)  translateZ(10px) scaleY(1.004) skewY(1deg); }
  50%  { transform: rotateY(90deg)  translateZ(34px) scaleY(1.02)  skewY(2.2deg); }
  85%  { transform: rotateY(170deg) translateZ(8px)  scaleY(1.004) skewY(.6deg); }
  100% { transform: rotateY(180deg) translateZ(0)    scaleY(1); }
}
.pt-shade { position: absolute; inset: 0; pointer-events: none; z-index: 3; }
/* Front goes dark as it tips away from the light; back brightens as it lands. */
.pt-fwd .pt-front .pt-shade { background: linear-gradient(90deg, rgba(0,0,0,.34), rgba(0,0,0,.06) 55%, rgba(255,255,255,.18)); animation: pt-dim ${PAGE_TURN_MS}ms ease-in forwards; }
.pt-fwd .pt-back  .pt-shade { background: linear-gradient(270deg, rgba(0,0,0,.34), rgba(0,0,0,.06) 55%, rgba(255,255,255,.18)); animation: pt-lift ${PAGE_TURN_MS}ms ease-out forwards; }
.pt-bwd .pt-front .pt-shade { background: linear-gradient(270deg, rgba(0,0,0,.34), rgba(0,0,0,.06) 55%, rgba(255,255,255,.18)); animation: pt-dim ${PAGE_TURN_MS}ms ease-in forwards; }
.pt-bwd .pt-back  .pt-shade { background: linear-gradient(90deg, rgba(0,0,0,.34), rgba(0,0,0,.06) 55%, rgba(255,255,255,.18)); animation: pt-lift ${PAGE_TURN_MS}ms ease-out forwards; }
@keyframes pt-dim  { 0% { opacity: 0 } 50% { opacity: 1 } 100% { opacity: 1 } }
@keyframes pt-lift { 0% { opacity: 1 } 50% { opacity: .9 } 100% { opacity: 0 } }
/* Shadow the moving leaf casts onto the page it uncovers. */
.pt-cast { position: absolute; top: 0; bottom: 0; pointer-events: none; z-index: 5; animation: pt-cast ${PAGE_TURN_MS}ms ease-in-out forwards; }
@keyframes pt-cast { 0% { opacity: 0 } 40% { opacity: .95 } 100% { opacity: 0 } }
.pt-spine { position: absolute; top: 0; bottom: 0; width: 34px; margin-left: -17px; pointer-events: none; z-index: 4;
  background: linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.10) 40%, rgba(0,0,0,.24) 50%, rgba(0,0,0,.10) 60%, rgba(0,0,0,0) 100%); }
@media (prefers-reduced-motion: reduce) {
  .pt-leaf.pt-fwd, .pt-leaf.pt-bwd, .pt-cast, .pt-shade { animation-duration: 1ms !important; }
}
`;

let ctx = null;
let noise = null;

function getNoise(ac) {
  if (noise && noise.sampleRate === ac.sampleRate) return noise;
  const len = Math.floor(ac.sampleRate * 0.9);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.04 * w) / 1.04;          // brown-ish: paper, not hiss
    d[i] = last * 3.4 + w * 0.16;
  }
  noise = buf;
  return buf;
}

/** Paper page-turn sound. Safe to call anywhere; never throws. */
export function playPageTurn(volume = 1) {
  try {
    if (typeof window === 'undefined') return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime + 0.01;
    const buf = getNoise(ctx);
    const v = Math.max(0, Math.min(1, volume));

    // 1. Lift + swing: band-passed rustle sweeping up then down.
    const swing = ctx.createBufferSource();
    swing.buffer = buf;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 0.85;
    band.frequency.setValueAtTime(600, now);
    band.frequency.exponentialRampToValueAtTime(3200, now + 0.2);
    band.frequency.exponentialRampToValueAtTime(800, now + 0.62);
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.0001, now);
    g1.gain.exponentialRampToValueAtTime(0.35 * v, now + 0.06);
    g1.gain.exponentialRampToValueAtTime(0.16 * v, now + 0.3);
    g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.66);
    swing.connect(band).connect(g1).connect(ctx.destination);
    swing.start(now, 0, 0.7);

    // 2. A crisp flick of the paper edge at the start.
    const flick = ctx.createBufferSource();
    flick.buffer = buf;
    const high = ctx.createBiquadFilter();
    high.type = 'highpass';
    high.frequency.value = 2400;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.0001, now);
    g2.gain.exponentialRampToValueAtTime(0.22 * v, now + 0.01);
    g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    flick.connect(high).connect(g2).connect(ctx.destination);
    flick.start(now, 0.2, 0.1);

    // 3. The soft landing as the page settles.
    const land = ctx.createBufferSource();
    land.buffer = buf;
    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 900;
    const g3 = ctx.createGain();
    const t = now + PAGE_TURN_MS / 1000 - 0.12;
    g3.gain.setValueAtTime(0.0001, t);
    g3.gain.exponentialRampToValueAtTime(0.45 * v, t + 0.015);
    g3.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    land.connect(low).connect(g3).connect(ctx.destination);
    land.start(t, 0.4, 0.16);
  } catch { /* sound is a nicety, never an error */ }
}
