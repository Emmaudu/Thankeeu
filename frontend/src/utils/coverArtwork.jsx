/**
 * coverArtwork.jsx — Hand-built, editorial-grade SVG artwork for A4 card covers.
 *
 * Each "scene" is a full 210×297 (A4 ratio) vector illustration designed to look
 * like the work of a senior designer: layered gradients, botanicals, geometry,
 * confetti, ribbons, celestial fields, etc. Scenes are pure SVG (crisp at any
 * size, tiny payload, fully responsive) and are colour-driven by a palette so a
 * single scene reads differently across occasions.
 *
 * Public API:
 *   <CoverArtwork scene="botanical_arch" palette={{...}} seed={3} />
 *   getSceneKeys()                → list of every scene id
 *   buildOccasionArtCovers(occId) → 10 art-cover design objects for an occasion
 */

import React from 'react';

// ── Deterministic pseudo-random so a given seed always renders identically ────
const rng = (seed) => {
  let s = (seed * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

// Shared A4 art board
const W = 210;
const H = 297;

// A palette is { bg1, bg2, bg3, ink, accent, gold, soft, contrast }
const defaultPalette = {
  bg1: '#fef6ff', bg2: '#f5e9ff', bg3: '#e9d5ff',
  ink: '#3b0764', accent: '#7c3aed', gold: '#f59e0b',
  soft: '#ffffff', contrast: '#ec4899',
};

// ─────────────────────────────────────────────────────────────────────────────
// Reusable primitives
// ─────────────────────────────────────────────────────────────────────────────

const Grain = ({ id, opacity = 0.05 }) => (
  <>
    <filter id={id}>
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect x="0" y="0" width={W} height={H} filter={`url(#${id})`} opacity={opacity} />
  </>
);

const Star5 = ({ cx, cy, r, fill, opacity = 1 }) => {
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const oa = (Math.PI / 2) + (i * 2 * Math.PI) / 5;
    const ia = oa + Math.PI / 5;
    pts.push(`${cx + r * Math.cos(oa)},${cy - r * Math.sin(oa)}`);
    pts.push(`${cx + (r * 0.42) * Math.cos(ia)},${cy - (r * 0.42) * Math.sin(ia)}`);
  }
  return <polygon points={pts.join(' ')} fill={fill} opacity={opacity} />;
};

const Sparkle = ({ cx, cy, r, fill, opacity = 1 }) => (
  <path
    d={`M${cx} ${cy - r} C ${cx + r * 0.18} ${cy - r * 0.18}, ${cx + r * 0.18} ${cy - r * 0.18}, ${cx + r} ${cy}
        C ${cx + r * 0.18} ${cy + r * 0.18}, ${cx + r * 0.18} ${cy + r * 0.18}, ${cx} ${cy + r}
        C ${cx - r * 0.18} ${cy + r * 0.18}, ${cx - r * 0.18} ${cy + r * 0.18}, ${cx - r} ${cy}
        C ${cx - r * 0.18} ${cy - r * 0.18}, ${cx - r * 0.18} ${cy - r * 0.18}, ${cx} ${cy - r} Z`}
    fill={fill}
    opacity={opacity}
  />
);

const Leaf = ({ x, y, rot, len, fill, opacity = 1 }) => (
  <path
    d={`M0 0 C ${len * 0.4} ${-len * 0.3}, ${len * 0.4} ${-len * 0.7}, 0 ${-len}
        C ${-len * 0.4} ${-len * 0.7}, ${-len * 0.4} ${-len * 0.3}, 0 0 Z`}
    transform={`translate(${x} ${y}) rotate(${rot})`}
    fill={fill}
    opacity={opacity}
  />
);

// ─────────────────────────────────────────────────────────────────────────────
// SCENES — each returns SVG children, given palette + seed
// ─────────────────────────────────────────────────────────────────────────────

const scenes = {
  // 1 ── Botanical arch: a symmetrical floral archway framing the centre
  botanical_arch: (p, seed) => {
    const r = rng(seed);
    const petals = (cx, cy, s, col) =>
      [...Array(6)].map((_, i) => (
        <ellipse key={i} cx={cx} cy={cy - s} rx={s * 0.42} ry={s} fill={col}
          transform={`rotate(${i * 60} ${cx} ${cy})`} opacity={0.9} />
      ));
    return (
      <>
        <rect width={W} height={H} fill={`url(#bgGrad${seed})`} />
        <path d={`M20 297 C 20 150, 50 60, 105 40 C 160 60, 190 150, 190 297`}
          fill="none" stroke={p.accent} strokeWidth="1.2" opacity="0.25" />
        <path d={`M34 297 C 34 155, 60 78, 105 58 C 150 78, 176 155, 176 297`}
          fill="none" stroke={p.gold} strokeWidth="0.8" opacity="0.3" />
        {/* leaves along arch */}
        {[...Array(20)].map((_, i) => {
          const t = i / 19;
          const side = i % 2 ? 1 : -1;
          const cx = 105 + side * (72 - Math.sin(t * Math.PI) * 30);
          const cy = 52 + t * 232;
          return <Leaf key={i} x={cx} y={cy} rot={side * 90 + (side > 0 ? -14 : 14)} len={9 + Math.sin(t * Math.PI) * 5}
            fill={i % 3 ? p.accent : p.gold} opacity={0.42} />;
        })}
        {/* flower clusters top corners */}
        <g>{petals(48, 66, 9, p.contrast)}<circle cx="48" cy="66" r="4" fill={p.gold} /></g>
        <g>{petals(162, 66, 9, p.contrast)}<circle cx="162" cy="66" r="4" fill={p.gold} /></g>
        <g>{petals(30, 120, 7, p.accent)}<circle cx="30" cy="120" r="3" fill={p.soft} /></g>
        <g>{petals(180, 120, 7, p.accent)}<circle cx="180" cy="120" r="3" fill={p.soft} /></g>
        {[...Array(9)].map((_, i) => (
          <Sparkle key={i} cx={r() * W} cy={40 + r() * 217} r={1 + r() * 1.6} fill={p.gold} opacity={0.5} />
        ))}
      </>
    );
  },

  // 2 ── Celestial night: deep gradient sky, moon, constellation
  celestial: (p, seed) => {
    const r = rng(seed);
    return (
      <>
        <rect width={W} height={H} fill={`url(#bgGrad${seed})`} />
        {[...Array(90)].map((_, i) => (
          <circle key={i} cx={r() * W} cy={r() * H} r={r() * 1.1 + 0.2}
            fill={p.soft} opacity={0.3 + r() * 0.6} />
        ))}
        {[...Array(11)].map((_, i) => (
          <Star5 key={i} cx={r() * W} cy={r() * H} r={2 + r() * 3} fill={p.gold} opacity={0.6 + r() * 0.4} />
        ))}
        {/* moon */}
        <circle cx="150" cy="70" r="30" fill={p.gold} opacity="0.16" />
        <circle cx="150" cy="70" r="22" fill={p.soft} opacity="0.9" />
        <circle cx="140" cy="64" r="19" fill={`url(#bgGrad${seed})`} />
        {/* constellation lines */}
        <g stroke={p.gold} strokeWidth="0.5" opacity="0.5" fill="none">
          <path d="M40 200 L70 175 L96 205 L120 185 L150 215" />
        </g>
        {[[40, 200], [70, 175], [96, 205], [120, 185], [150, 215]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.2" fill={p.gold} />
        ))}
        {[...Array(6)].map((_, i) => (
          <Sparkle key={i} cx={20 + r() * 170} cy={230 + r() * 55} r={1.4 + r() * 1.4} fill={p.soft} opacity={0.7} />
        ))}
      </>
    );
  },

  // 3 ── Confetti burst: joyful geometric confetti raining from top
  confetti_burst: (p, seed) => {
    const r = rng(seed);
    const cols = [p.accent, p.gold, p.contrast, p.soft];
    return (
      <>
        <rect width={W} height={H} fill={`url(#bgGrad${seed})`} />
        {[...Array(60)].map((_, i) => {
          const x = r() * W, y = r() * H, s = 2 + r() * 5, c = cols[i % cols.length];
          const type = i % 3;
          if (type === 0) return <rect key={i} x={x} y={y} width={s} height={s * 1.6} rx="1" fill={c}
            transform={`rotate(${r() * 360} ${x} ${y})`} opacity={0.85} />;
          if (type === 1) return <circle key={i} cx={x} cy={y} r={s * 0.6} fill={c} opacity={0.85} />;
          return <path key={i} d={`M${x} ${y} q ${s} ${-s} ${s * 2} 0`} stroke={c} strokeWidth="1.4"
            fill="none" opacity={0.7} />;
        })}
        {/* central burst rays */}
        <g opacity="0.35" stroke={p.gold} strokeWidth="1">
          {[...Array(16)].map((_, i) => {
            const a = (i / 16) * Math.PI * 2;
            return <line key={i} x1={105} y1={148} x2={105 + Math.cos(a) * 44} y2={148 + Math.sin(a) * 44} />;
          })}
        </g>
        {[...Array(6)].map((_, i) => (
          <Sparkle key={i} cx={105 + Math.cos(i) * 30} cy={148 + Math.sin(i * 1.3) * 30} r={2.4} fill={p.gold} />
        ))}
      </>
    );
  },

  // 4 ── Ribbon frame: elegant ornamental frame w/ ribbon banner
  ribbon_frame: (p, seed) => {
    const r = rng(seed);
    return (
      <>
        <rect width={W} height={H} fill={`url(#bgGrad${seed})`} />
        <rect x="16" y="16" width={W - 32} height={H - 32} rx="10" fill="none"
          stroke={p.accent} strokeWidth="1" opacity="0.4" />
        <rect x="22" y="22" width={W - 44} height={H - 44} rx="7" fill="none"
          stroke={p.gold} strokeWidth="0.6" opacity="0.55" strokeDasharray="1 3" />
        {/* corner flourishes */}
        {[[26, 26, 1, 1], [184, 26, -1, 1], [26, 271, 1, -1], [184, 271, -1, -1]].map(([x, y, sx, sy], i) => (
          <path key={i} d={`M0 20 C 0 6, 6 0, 20 0`} transform={`translate(${x} ${y}) scale(${sx} ${sy})`}
            fill="none" stroke={p.gold} strokeWidth="1.4" />
        ))}
        {/* ribbon banner */}
        <g transform="translate(105 78)">
          <path d="M-52 0 L-64 -9 L-64 9 Z" fill={p.ink} opacity="0.85" />
          <path d="M52 0 L64 -9 L64 9 Z" fill={p.ink} opacity="0.85" />
          <rect x="-52" y="-12" width="104" height="24" rx="4" fill={p.accent} />
          <rect x="-52" y="-12" width="104" height="24" rx="4" fill="none" stroke={p.gold} strokeWidth="0.8" opacity="0.6" />
        </g>
        {/* laurels */}
        {[-1, 1].map((s) => (
          <g key={s} transform={`translate(105 220) scale(${s} 1)`}>
            {[...Array(7)].map((_, i) => (
              <Leaf key={i} x={30 + i * 5} y={-i * 6} rot={-50 - i * 4} len={13} fill={p.gold} opacity={0.55} />
            ))}
          </g>
        ))}
        {[...Array(8)].map((_, i) => (
          <Sparkle key={i} cx={30 + r() * 150} cy={120 + r() * 90} r={1.2 + r() * 1.3} fill={p.gold} opacity={0.5} />
        ))}
      </>
    );
  },

  // 5 ── Balloon bouquet: floating balloons with strings
  balloons: (p, seed) => {
    const r = rng(seed);
    const cols = [p.accent, p.contrast, p.gold, p.ink];
    return (
      <>
        <rect width={W} height={H} fill={`url(#bgGrad${seed})`} />
        {[...Array(9)].map((_, i) => {
          const x = 30 + (i % 3) * 60 + (r() - 0.5) * 20;
          const y = 55 + Math.floor(i / 3) * 30 + (r() - 0.5) * 18;
          const c = cols[i % cols.length];
          const rr = 15 + r() * 7;
          return (
            <g key={i}>
              <path d={`M${x} ${y + rr} Q ${x + 6} ${y + rr + 40}, ${x - 2} ${H - 40}`}
                stroke={p.ink} strokeWidth="0.5" fill="none" opacity="0.35" />
              <ellipse cx={x} cy={y} rx={rr * 0.82} ry={rr} fill={c} opacity="0.9" />
              <ellipse cx={x - rr * 0.28} cy={y - rr * 0.34} rx={rr * 0.22} ry={rr * 0.32}
                fill={p.soft} opacity="0.45" />
              <path d={`M${x - 2} ${y + rr} l 4 0 l -2 3 Z`} fill={c} />
            </g>
          );
        })}
        {[...Array(10)].map((_, i) => (
          <Star5 key={i} cx={r() * W} cy={180 + r() * 110} r={1.4 + r() * 2} fill={p.gold} opacity={0.4} />
        ))}
      </>
    );
  },

  // 6 ── Art-deco fan: geometric sunrays / gatsby luxe
  deco_fan: (p, seed) => {
    const r = rng(seed);
    return (
      <>
        <rect width={W} height={H} fill={`url(#bgGrad${seed})`} />
        <g transform="translate(105 130)">
          {[...Array(24)].map((_, i) => {
            const a = (i / 24) * Math.PI * 2;
            const long = i % 2 === 0;
            const len = long ? 150 : 120;
            return <line key={i} x1="0" y1="0" x2={Math.cos(a) * len} y2={Math.sin(a) * len}
              stroke={long ? p.gold : p.accent} strokeWidth={long ? 1.2 : 0.6} opacity={long ? 0.4 : 0.25} />;
          })}
          {[42, 30, 18].map((rad, i) => (
            <circle key={i} r={rad} fill="none" stroke={p.gold} strokeWidth="0.8" opacity={0.4 - i * 0.06} />
          ))}
          <circle r="9" fill={p.gold} opacity="0.8" />
        </g>
        {/* deco chevrons top & bottom */}
        {[40, 257].map((y, k) => (
          <g key={k} opacity="0.5">
            {[...Array(11)].map((_, i) => (
              <path key={i} d={`M${10 + i * 18} ${y} l 9 8 l 9 -8`} fill="none"
                stroke={p.accent} strokeWidth="1" />
            ))}
          </g>
        ))}
        {[...Array(6)].map((_, i) => (
          <Star5 key={i} cx={r() * W} cy={r() * H} r={1.6 + r() * 1.8} fill={p.gold} opacity={0.4} />
        ))}
      </>
    );
  },

  // 7 ── Watercolour wash: soft organic blobs + florals
  watercolour: (p, seed) => {
    const r = rng(seed);
    return (
      <>
        <rect width={W} height={H} fill={`url(#bgGrad${seed})`} />
        <g filter={`url(#soft${seed})`}>
          <ellipse cx="55" cy="60" rx="70" ry="55" fill={p.accent} opacity="0.16" />
          <ellipse cx="165" cy="120" rx="60" ry="70" fill={p.contrast} opacity="0.14" />
          <ellipse cx="80" cy="235" rx="85" ry="60" fill={p.gold} opacity="0.13" />
          <ellipse cx="175" cy="255" rx="50" ry="45" fill={p.accent} opacity="0.12" />
        </g>
        {/* sprigs */}
        {[[40, 96, 18], [172, 74, -18], [150, 236, 14], [45, 214, -14], [105, 58, 0], [96, 270, 8]].map(([x, y, rot], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
            <line x1="0" y1="0" x2="0" y2="-42" stroke={p.ink} strokeWidth="0.7" opacity="0.4" />
            {[...Array(7)].map((_, j) => (
              <g key={j}>
                <Leaf x={0} y={-5 - j * 6} rot={-52} len={8} fill={i % 2 ? p.accent : p.gold} opacity={0.5} />
                <Leaf x={0} y={-5 - j * 6} rot={52} len={8} fill={i % 2 ? p.accent : p.gold} opacity={0.5} />
              </g>
            ))}
            <circle cx="0" cy="-44" r="3" fill={p.contrast} opacity="0.7" />
          </g>
        ))}
        {[...Array(7)].map((_, i) => (
          <Sparkle key={i} cx={r() * W} cy={r() * H} r={1.2 + r() * 1.4} fill={p.gold} opacity={0.5} />
        ))}
      </>
    );
  },

  // 8 ── Geometric terrazzo: modern speckled shapes
  terrazzo: (p, seed) => {
    const r = rng(seed);
    const cols = [p.accent, p.gold, p.contrast, p.ink, p.soft];
    return (
      <>
        <rect width={W} height={H} fill={`url(#bgGrad${seed})`} />
        {[...Array(70)].map((_, i) => {
          const x = r() * W, y = r() * H, s = 1.5 + r() * 5, c = cols[i % cols.length];
          const t = i % 4;
          if (t === 0) return <circle key={i} cx={x} cy={y} r={s} fill={c} opacity={0.5} />;
          if (t === 1) return <rect key={i} x={x} y={y} width={s * 2} height={s} rx={s / 2} fill={c}
            opacity={0.5} transform={`rotate(${r() * 90} ${x} ${y})`} />;
          if (t === 2) return <polygon key={i}
            points={`${x},${y - s} ${x + s},${y + s} ${x - s},${y + s}`} fill={c} opacity={0.45} />;
          return <path key={i} d={`M${x} ${y} q ${s * 2} ${-s} ${s * 3} ${s}`} stroke={c}
            strokeWidth="1.2" fill="none" opacity={0.4} />;
        })}
        {/* big arch shape */}
        <path d={`M60 297 L60 150 A45 45 0 0 1 150 150 L150 297`} fill={p.accent} opacity="0.08" />
      </>
    );
  },

  // 9 ── Golden rays sunrise: horizon glow with rays
  sunrise: (p, seed) => {
    const r = rng(seed);
    return (
      <>
        <rect width={W} height={H} fill={`url(#bgGrad${seed})`} />
        <g transform="translate(105 190)" opacity="0.5">
          {[...Array(20)].map((_, i) => {
            const a = -Math.PI + (i / 19) * Math.PI;
            return <line key={i} x1="0" y1="0" x2={Math.cos(a) * 200} y2={Math.sin(a) * 200}
              stroke={p.gold} strokeWidth={i % 2 ? 0.6 : 1.4} opacity={i % 2 ? 0.2 : 0.4} />;
          })}
        </g>
        <circle cx="105" cy="190" r="46" fill={p.gold} opacity="0.22" />
        <circle cx="105" cy="190" r="34" fill={p.gold} opacity="0.3" />
        <circle cx="105" cy="190" r="24" fill={p.soft} opacity="0.85" />
        {/* rolling hills */}
        <path d={`M0 230 C 60 210, 150 250, 210 224 L210 297 L0 297 Z`} fill={p.accent} opacity="0.18" />
        <path d={`M0 252 C 70 236, 140 268, 210 246 L210 297 L0 297 Z`} fill={p.accent} opacity="0.28" />
        {/* birds */}
        {[[40, 70], [58, 62], [150, 82]].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y} q 5 -5 10 0 q 5 -5 10 0`} stroke={p.ink} strokeWidth="1"
            fill="none" opacity="0.4" />
        ))}
        {[...Array(5)].map((_, i) => (
          <Sparkle key={i} cx={r() * W} cy={30 + r() * 120} r={1.3 + r() * 1.2} fill={p.gold} opacity={0.5} />
        ))}
      </>
    );
  },

  // 10 ── Hearts drift: gentle floating hearts (love/valentine/anniversary)
  hearts_drift: (p, seed) => {
    const r = rng(seed);
    const Heart = ({ x, y, s, c, o }) => (
      <path
        d={`M0 ${s * 0.3} C 0 ${-s * 0.2}, ${-s} ${-s * 0.2}, ${-s} ${s * 0.35}
            C ${-s} ${s * 0.8}, 0 ${s * 1.1}, 0 ${s * 1.4}
            C 0 ${s * 1.1}, ${s} ${s * 0.8}, ${s} ${s * 0.35}
            C ${s} ${-s * 0.2}, 0 ${-s * 0.2}, 0 ${s * 0.3} Z`}
        transform={`translate(${x} ${y})`} fill={c} opacity={o} />
    );
    const cols = [p.contrast, p.accent, p.gold];
    return (
      <>
        <rect width={W} height={H} fill={`url(#bgGrad${seed})`} />
        {[...Array(22)].map((_, i) => (
          <Heart key={i} x={r() * W} y={r() * H} s={4 + r() * 11} c={cols[i % 3]} o={0.25 + r() * 0.55} />
        ))}
        {/* central big heart outline */}
        <g transform="translate(105 140)">
          <path d={`M0 12 C 0 -20, -42 -20, -42 14 C -42 46, 0 66, 0 78 C 0 66, 42 46, 42 14 C 42 -20, 0 -20, 0 12 Z`}
            fill="none" stroke={p.contrast} strokeWidth="1.4" opacity="0.5" />
          <path d={`M0 22 C 0 2, -26 2, -26 24 C -26 44, 0 56, 0 62 C 0 56, 26 44, 26 24 C 26 2, 0 2, 0 22 Z`}
            fill={p.contrast} opacity="0.14" />
        </g>
        {[...Array(6)].map((_, i) => (
          <Sparkle key={i} cx={r() * W} cy={r() * H} r={1.3 + r() * 1.3} fill={p.gold} opacity={0.55} />
        ))}
      </>
    );
  },

  // 11 ── Foliage corner: lush tropical/green foliage in two corners
  foliage_corner: (p, seed) => {
    const r = rng(seed);
    const bunch = (x, y, dir) => (
      <g transform={`translate(${x} ${y}) scale(${dir} 1)`}>
        {[...Array(9)].map((_, i) => {
          const a = -20 + i * 16;
          return <Leaf key={i} x={0} y={0} rot={a} len={40 + (i % 3) * 16}
            fill={i % 2 ? p.accent : p.gold} opacity={0.45 + (i % 3) * 0.12} />;
        })}
      </g>
    );
    return (
      <>
        <rect width={W} height={H} fill={`url(#bgGrad${seed})`} />
        {bunch(0, 60, 1)}
        {bunch(210, 70, -1)}
        {bunch(20, 297, 1)}
        {bunch(190, 297, -1)}
        {/* monstera-ish blob */}
        <circle cx="105" cy="150" r="60" fill={p.soft} opacity="0.35" />
        <circle cx="105" cy="150" r="60" fill="none" stroke={p.accent} strokeWidth="0.8" opacity="0.3" />
        {[...Array(8)].map((_, i) => (
          <Sparkle key={i} cx={r() * W} cy={r() * H} r={1.2 + r() * 1.3} fill={p.gold} opacity={0.45} />
        ))}
      </>
    );
  },

  // 12 ── Bokeh glow: dreamy soft light circles
  bokeh: (p, seed) => {
    const r = rng(seed);
    const cols = [p.accent, p.gold, p.contrast, p.soft];
    return (
      <>
        <rect width={W} height={H} fill={`url(#bgGrad${seed})`} />
        <g filter={`url(#soft${seed})`}>
          {[...Array(26)].map((_, i) => (
            <circle key={i} cx={r() * W} cy={r() * H} r={4 + r() * 22}
              fill={cols[i % cols.length]} opacity={0.06 + r() * 0.13} />
          ))}
        </g>
        {[...Array(30)].map((_, i) => (
          <circle key={i} cx={r() * W} cy={r() * H} r={0.6 + r() * 1.6}
            fill={p.soft} opacity={0.3 + r() * 0.5} />
        ))}
        {[...Array(8)].map((_, i) => (
          <Sparkle key={i} cx={r() * W} cy={r() * H} r={1.6 + r() * 2} fill={p.gold} opacity={0.5} />
        ))}
      </>
    );
  },
};

// Occasion → ordered list of scenes (10 covers each). Mix keeps variety while
// leading with the most thematically-apt scenes for that occasion.
const OCCASION_SCENES = {
  birthday: ['confetti_burst', 'balloons', 'terrazzo', 'ribbon_frame', 'bokeh', 'botanical_arch', 'deco_fan', 'celestial', 'watercolour', 'hearts_drift'],
  valentine: ['hearts_drift', 'watercolour', 'botanical_arch', 'bokeh', 'ribbon_frame', 'celestial', 'confetti_burst', 'balloons', 'foliage_corner', 'terrazzo'],
  anniversary: ['hearts_drift', 'ribbon_frame', 'botanical_arch', 'deco_fan', 'watercolour', 'bokeh', 'celestial', 'confetti_burst', 'foliage_corner', 'balloons'],
  wedding: ['botanical_arch', 'ribbon_frame', 'watercolour', 'deco_fan', 'hearts_drift', 'foliage_corner', 'bokeh', 'celestial', 'confetti_burst', 'balloons'],
  baby_shower: ['balloons', 'watercolour', 'bokeh', 'hearts_drift', 'botanical_arch', 'confetti_burst', 'foliage_corner', 'terrazzo', 'ribbon_frame', 'celestial'],
  retirement: ['sunrise', 'deco_fan', 'ribbon_frame', 'botanical_arch', 'watercolour', 'foliage_corner', 'celestial', 'bokeh', 'confetti_burst', 'terrazzo'],
  congratulations: ['confetti_burst', 'deco_fan', 'ribbon_frame', 'balloons', 'terrazzo', 'sunrise', 'celestial', 'bokeh', 'botanical_arch', 'watercolour'],
  graduation: ['ribbon_frame', 'deco_fan', 'celestial', 'confetti_burst', 'sunrise', 'terrazzo', 'botanical_arch', 'bokeh', 'balloons', 'watercolour'],
  promotion: ['deco_fan', 'sunrise', 'ribbon_frame', 'terrazzo', 'confetti_burst', 'celestial', 'bokeh', 'botanical_arch', 'balloons', 'watercolour'],
  christmas: ['celestial', 'foliage_corner', 'ribbon_frame', 'confetti_burst', 'botanical_arch', 'bokeh', 'watercolour', 'balloons', 'deco_fan', 'terrazzo'],
  get_well: ['watercolour', 'botanical_arch', 'sunrise', 'foliage_corner', 'bokeh', 'hearts_drift', 'balloons', 'ribbon_frame', 'celestial', 'terrazzo'],
  new_year: ['celestial', 'confetti_burst', 'deco_fan', 'sunrise', 'bokeh', 'ribbon_frame', 'terrazzo', 'balloons', 'botanical_arch', 'watercolour'],
  thank_you: ['botanical_arch', 'watercolour', 'ribbon_frame', 'hearts_drift', 'foliage_corner', 'bokeh', 'sunrise', 'confetti_burst', 'celestial', 'terrazzo'],
  sympathy: ['watercolour', 'botanical_arch', 'foliage_corner', 'sunrise', 'celestial', 'bokeh', 'ribbon_frame', 'hearts_drift', 'terrazzo', 'deco_fan'],
  good_luck: ['celestial', 'sunrise', 'confetti_burst', 'deco_fan', 'terrazzo', 'ribbon_frame', 'bokeh', 'botanical_arch', 'balloons', 'watercolour'],
  leaving: ['ribbon_frame', 'botanical_arch', 'watercolour', 'sunrise', 'confetti_burst', 'foliage_corner', 'bokeh', 'celestial', 'deco_fan', 'terrazzo'],
};

// Palette families keyed by an index so each of an occasion's 10 covers reads
// as a distinct colourway (rose, sage, indigo, gold, teal, blush, plum, ...).
const PALETTES = [
  { bg1: '#fff1f5', bg2: '#ffe4ec', bg3: '#fecdd8', ink: '#831843', accent: '#e11d48', gold: '#f59e0b', soft: '#ffffff', contrast: '#f472b6', name: 'Rose Blush' },
  { bg1: '#0f1535', bg2: '#1e1b4b', bg3: '#312e81', ink: '#c7d2fe', accent: '#818cf8', gold: '#fbbf24', soft: '#eef2ff', contrast: '#f472b6', name: 'Midnight Indigo', dark: true },
  { bg1: '#ecfdf5', bg2: '#d1fae5', bg3: '#a7f3d0', ink: '#064e3b', accent: '#059669', gold: '#d97706', soft: '#ffffff', contrast: '#f59e0b', name: 'Sage Garden' },
  { bg1: '#fffbeb', bg2: '#fef3c7', bg3: '#fde68a', ink: '#78350f', accent: '#d97706', gold: '#b45309', soft: '#ffffff', contrast: '#ea580c', name: 'Golden Hour' },
  { bg1: '#eff6ff', bg2: '#dbeafe', bg3: '#bfdbfe', ink: '#1e3a8a', accent: '#2563eb', gold: '#f59e0b', soft: '#ffffff', contrast: '#0ea5e9', name: 'Azure Sky' },
  { bg1: '#faf5ff', bg2: '#f3e8ff', bg3: '#e9d5ff', ink: '#4c1d95', accent: '#7c3aed', gold: '#f59e0b', soft: '#ffffff', contrast: '#c026d3', name: 'Lilac Dream' },
  { bg1: '#fff7ed', bg2: '#ffedd5', bg3: '#fed7aa', ink: '#7c2d12', accent: '#ea580c', gold: '#d97706', soft: '#ffffff', contrast: '#f43f5e', name: 'Sunset Coral' },
  { bg1: '#f0fdfa', bg2: '#ccfbf1', bg3: '#99f6e4', ink: '#134e4a', accent: '#0d9488', gold: '#f59e0b', soft: '#ffffff', contrast: '#f43f5e', name: 'Teal Lagoon' },
  { bg1: '#1a0f2e', bg2: '#2e1065', bg3: '#4c1d95', ink: '#e9d5ff', accent: '#a855f7', gold: '#fbbf24', soft: '#faf5ff', contrast: '#f472b6', name: 'Amethyst Noir', dark: true },
  { bg1: '#fdf2f8', bg2: '#fce7f3', bg3: '#fbcfe8', ink: '#9d174d', accent: '#db2777', gold: '#f59e0b', soft: '#ffffff', contrast: '#a855f7', name: 'Peony Pink' },
];

export const getSceneKeys = () => Object.keys(scenes);

/**
 * CoverArtwork — renders one full A4 SVG scene.
 * Props: scene (key), palette (object), seed (number), className, style, preserveAspectRatio
 */
export const CoverArtwork = ({
  scene = 'confetti_burst',
  palette = defaultPalette,
  seed = 1,
  className,
  style,
}) => {
  const p = { ...defaultPalette, ...palette };
  const draw = scenes[scene] || scenes.confetti_burst;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      style={{ display: 'block', width: '100%', height: '100%', ...style }}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`bgGrad${seed}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={p.bg1} />
          <stop offset="0.5" stopColor={p.bg2} />
          <stop offset="1" stopColor={p.bg3} />
        </linearGradient>
        <filter id={`soft${seed}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {draw(p, seed)}
    </svg>
  );
};

/**
 * buildOccasionArtCovers(occasionId, blueprint) → 10 design objects with .artwork
 * blueprint provides { title, subtitle, icon } from OCCASION_BLUEPRINTS.
 */
export const buildOccasionArtCovers = (occasionId, blueprint = {}) => {
  const sceneList = OCCASION_SCENES[occasionId] || OCCASION_SCENES.birthday;
  return sceneList.map((sceneKey, i) => {
    const pal = PALETTES[i % PALETTES.length];
    return {
      id: `${occasionId}-art-${i + 1}`,
      occasion: occasionId,
      name: `${blueprint.label || 'Special'} · ${pal.name}`,
      coverTitle: blueprint.title || 'A card made together',
      coverSubtitle: blueprint.subtitle || '',
      icon: blueprint.icon || 'Sparkles',
      // artwork descriptor consumed by CardCoverPreview / CardView
      artwork: { scene: sceneKey, palette: pal, seed: i + 1 },
      background: `linear-gradient(155deg, ${pal.bg1}, ${pal.bg2} 55%, ${pal.bg3})`,
      ink: pal.dark ? pal.soft : pal.ink,
      accent: pal.accent,
      soft: pal.soft,
      dark: !!pal.dark,
      palette: [pal.ink, pal.accent, pal.gold, pal.contrast, pal.bg3],
      badge: i < 3 ? 'New' : i < 6 ? 'Artwork' : null,
    };
  });
};

export default CoverArtwork;
