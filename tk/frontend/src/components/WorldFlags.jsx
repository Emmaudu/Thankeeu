/**
 * WorldFlags — the countries Thankeeu cards go out to, as real, colourful SVG
 * flags (emoji flags render as two grey letters on Windows, so they are drawn).
 *
 *   <FlagBackdrop />   soft, transparent flags floating behind the hero copy
 *   <SupportedCountries />  a readable, labelled strip — "is my country here?"
 *
 * Every flag is drawn in the same 30×20 (3:2) box so they line up as chips.
 */
import { useId } from 'react';

// ── Star helper (points=n, outer R, inner r, first tip at angle `rot`) ──────
const star = (cx, cy, R, r, n = 5, rot = -Math.PI / 2) => {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a = rot + (i * Math.PI) / n;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(3)},${(cy + rad * Math.sin(a)).toFixed(3)}`);
  }
  return pts.join(' ');
};

const MAPLE = '50,10 56,22 64,18 61,36 72,28 70,34 82,32 76,44 80,46 62,58 64,64 52,62 52,76 48,76 48,62 36,64 38,58 20,46 24,44 18,32 30,34 28,28 39,36 36,18 44,22';

const UK = ({ uid }) => (
  <>
    <clipPath id={`${uid}-s`}><rect width="30" height="20" /></clipPath>
    <clipPath id={`${uid}-t`}><path d="M15,10 h15 v10 z v10 h-15 z h-15 v-10 z v-10 h15 z" /></clipPath>
    <g clipPath={`url(#${uid}-s)`}>
      <rect width="30" height="20" fill="#012169" />
      <path d="M0,0 L30,20 M30,0 L0,20" stroke="#fff" strokeWidth="4" />
      <path d="M0,0 L30,20 M30,0 L0,20" clipPath={`url(#${uid}-t)`} stroke="#C8102E" strokeWidth="2.6" />
      <path d="M15,0 v20 M0,10 h30" stroke="#fff" strokeWidth="6" />
      <path d="M15,0 v20 M0,10 h30" stroke="#C8102E" strokeWidth="3.6" />
    </g>
  </>
);

const USA = () => {
  const h = 20 / 13;
  const stars = [];
  for (let row = 0; row < 9; row++) {
    const count = row % 2 === 0 ? 6 : 5;
    for (let c = 0; c < count; c++) {
      stars.push(<circle key={`${row}-${c}`} cx={(row % 2 === 0 ? 1 : 2) + c * 2} cy={0.62 + row * 1.19} r="0.36" fill="#fff" />);
    }
  }
  return (
    <>
      {Array.from({ length: 13 }, (_, i) => (
        <rect key={i} y={i * h} width="30" height={h + 0.02} fill={i % 2 === 0 ? '#B22234' : '#fff'} />
      ))}
      <rect width="12" height={h * 7} fill="#3C3B6E" />
      {stars}
    </>
  );
};

const FLAGS = {
  FI: () => (<><rect width="30" height="20" fill="#fff" /><rect x="8.3" width="5" height="20" fill="#003580" /><rect y="7.3" width="30" height="5.4" fill="#003580" /></>),
  CN: () => (
    <>
      <rect width="30" height="20" fill="#EE1C25" />
      <polygon points={star(5, 5, 3, 1.15)} fill="#FFDE00" />
      {[[10, 2], [12, 4], [12, 7], [10, 9]].map(([x, y]) => (
        <polygon key={`${x}${y}`} points={star(x, y, 1, 0.38, 5, Math.atan2(5 - y, 5 - x))} fill="#FFDE00" />
      ))}
    </>
  ),
  CA: () => (
    <>
      <rect width="30" height="20" fill="#fff" />
      <rect width="7.5" height="20" fill="#D52B1E" /><rect x="22.5" width="7.5" height="20" fill="#D52B1E" />
      <polygon points={MAPLE} fill="#D52B1E" transform="translate(8.5,4.4) scale(0.13)" />
    </>
  ),
  US: USA,
  GB: UK,
  DE: () => (<><rect width="30" height="6.67" fill="#000" /><rect y="6.67" width="30" height="6.67" fill="#DD0000" /><rect y="13.33" width="30" height="6.67" fill="#FFCE00" /></>),
  KE: () => (
    <>
      <rect width="30" height="6.67" fill="#000" />
      <rect y="6.67" width="30" height="1.11" fill="#fff" />
      <rect y="7.78" width="30" height="4.44" fill="#BB0000" />
      <rect y="12.22" width="30" height="1.11" fill="#fff" />
      <rect y="13.33" width="30" height="6.67" fill="#006600" />
      <path d="M11.2,2.6 L18.8,17.4 M18.8,2.6 L11.2,17.4" stroke="#fff" strokeWidth="0.5" />
      <ellipse cx="15" cy="10" rx="3" ry="6.6" fill="#000" />
      <ellipse cx="15" cy="10" rx="1.75" ry="6.4" fill="#BB0000" />
      <ellipse cx="15" cy="10" rx="0.45" ry="1.1" fill="#fff" />
      <ellipse cx="15" cy="5.6" rx="0.3" ry="1.5" fill="#fff" />
      <ellipse cx="15" cy="14.4" rx="0.3" ry="1.5" fill="#fff" />
    </>
  ),
  FR: () => (<><rect width="10" height="20" fill="#0055A4" /><rect x="10" width="10" height="20" fill="#fff" /><rect x="20" width="10" height="20" fill="#EF4135" /></>),
  MY: () => (
    <>
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} y={i * (20 / 14)} width="30" height={20 / 14 + 0.02} fill={i % 2 === 0 ? '#CC0001' : '#fff'} />
      ))}
      <rect width="15" height={(20 / 14) * 8} fill="#010066" />
      <circle cx="4.8" cy="5.7" r="3.6" fill="#FFCC00" />
      <circle cx="5.8" cy="5.7" r="3.0" fill="#010066" />
      <polygon points={star(11.2, 5.7, 3, 1.25, 14)} fill="#FFCC00" />
    </>
  ),
  MU: () => (<><rect width="30" height="5" fill="#EA2839" /><rect y="5" width="30" height="5" fill="#1A206D" /><rect y="10" width="30" height="5" fill="#FFD500" /><rect y="15" width="30" height="5" fill="#00A551" /></>),
  NL: () => (<><rect width="30" height="6.67" fill="#AE1C28" /><rect y="6.67" width="30" height="6.67" fill="#fff" /><rect y="13.33" width="30" height="6.67" fill="#21468B" /></>),
  PH: () => (
    <>
      <rect width="30" height="10" fill="#0038A8" /><rect y="10" width="30" height="10" fill="#CE1126" />
      <polygon points="0,0 17.32,10 0,20" fill="#fff" />
      <polygon points={star(6.2, 10, 3.1, 1.35, 8, 0)} fill="#FCD116" />
      <circle cx="6.2" cy="10" r="1.55" fill="#FCD116" />
      {[[1.9, 2.6], [1.9, 17.4], [14.6, 10]].map(([x, y]) => (
        <polygon key={`${x}${y}`} points={star(x, y, 0.9, 0.36)} fill="#FCD116" />
      ))}
    </>
  ),
  SA: () => (
    <>
      <rect width="30" height="20" fill="#006C35" />
      <text x="15" y="9.3" textAnchor="middle" fill="#fff" fontSize="3.6" textLength="19" lengthAdjust="spacingAndGlyphs"
        fontFamily="'Amiri','Noto Naskh Arabic','Scheherazade New','Arial',serif" direction="rtl">لا إله إلا الله محمد رسول الله</text>
      <path d="M7.5,13.6 h13.8 l1.2,0.35 -1.2,0.35 h-13.8 z" fill="#fff" />
      <rect x="20.2" y="12.9" width="0.5" height="2.1" rx="0.2" fill="#fff" />
    </>
  ),
  RW: () => (
    <>
      <rect width="30" height="10" fill="#00A1DE" /><rect y="10" width="30" height="5" fill="#FAD201" /><rect y="15" width="30" height="5" fill="#20603D" />
      <polygon points={star(24.5, 5, 2.9, 1.95, 24)} fill="#E5BE01" />
      <circle cx="24.5" cy="5" r="1.55" fill="#00A1DE" />
      <circle cx="24.5" cy="5" r="1.25" fill="#E5BE01" />
    </>
  ),
  BD: () => (<><rect width="30" height="20" fill="#006A4E" /><circle cx="13.5" cy="10" r="6" fill="#F42A41" /></>),
  NG: () => (<><rect width="10" height="20" fill="#008751" /><rect x="10" width="10" height="20" fill="#fff" /><rect x="20" width="10" height="20" fill="#008751" /></>),
};

// The countries shown, in the order given.
export const SUPPORTED_COUNTRIES = [
  { code: 'FI', name: 'Finland' }, { code: 'CN', name: 'China' }, { code: 'CA', name: 'Canada' },
  { code: 'US', name: 'USA' }, { code: 'GB', name: 'United Kingdom' }, { code: 'DE', name: 'Germany' },
  { code: 'KE', name: 'Kenya' }, { code: 'FR', name: 'France' }, { code: 'MY', name: 'Malaysia' },
  { code: 'MU', name: 'Mauritius' }, { code: 'NL', name: 'Netherlands' }, { code: 'PH', name: 'Philippines' },
  { code: 'SA', name: 'Saudi Arabia' }, { code: 'RW', name: 'Rwanda' }, { code: 'BD', name: 'Bangladesh' },
  { code: 'NG', name: 'Nigeria' },
];

export function Flag({ code, width = 30, className = '', style, title }) {
  const uid = `flag-${useId().replace(/:/g, '')}`;
  const Draw = FLAGS[code];
  if (!Draw) return null;
  return (
    <svg viewBox="0 0 30 20" width={width} height={(width * 2) / 3} className={className} style={style}
      role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={`${uid}-gloss`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.38" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      <Draw uid={uid} />
      {/* Soft gloss so the chips read as fabric, not flat stickers */}
      <rect width="30" height="20" fill={`url(#${uid}-gloss)`} />
    </svg>
  );
}

const FLAG_CSS = `
@keyframes tk-flag-wave { 0%,100% { transform: perspective(120px) rotateY(0deg) skewY(0deg); }
  50% { transform: perspective(120px) rotateY(-9deg) skewY(-1.4deg); } }
@keyframes tk-flag-float { 0%,100% { transform: translateY(0) rotate(var(--r,0deg)); }
  50% { transform: translateY(-10px) rotate(calc(var(--r,0deg) * -1)); } }
@keyframes tk-flag-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.tk-flag-wave { animation: tk-flag-wave 3.6s ease-in-out infinite; transform-origin: left center; }
.tk-flag-float { animation: tk-flag-float 7s ease-in-out infinite; }
.tk-flag-marquee { animation: tk-flag-marquee 38s linear infinite; }
.tk-flag-strip:hover .tk-flag-marquee { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .tk-flag-wave, .tk-flag-float, .tk-flag-marquee { animation: none !important; }
}
`;

// Hand-placed (pixel tops, % lefts) in the hero's empty space: the band under
// the navbar, the gap between the two columns and the side gutters — so the
// flags are seen, and never sit under the headline. `wide` spots only show on
// md+ screens where those gaps exist.
const BACKDROP_SPOTS = [
  { code: 'NG', left: '2%',   top: 78,  w: 58, r: -8 },
  { code: 'GB', left: '21%',  top: 92,  w: 50, r: 6 },
  { code: 'BD', left: '36%',  top: 76,  w: 44, r: 8 },
  { code: 'RW', left: '58%',  top: 94,  w: 44, r: -5 },
  { code: 'US', left: '73%',  top: 78,  w: 56, r: 7 },
  { code: 'CA', left: '88%',  top: 92,  w: 52, r: -6 },
  { code: 'KE', left: '48.6%', top: 250, w: 48, r: 5,  wide: true },
  { code: 'DE', left: '48.8%', top: 420, w: 46, r: -7, wide: true },
  { code: 'FR', left: '48.4%', top: 590, w: 48, r: 4,  wide: true },
  { code: 'PH', left: '48.8%', top: 760, w: 46, r: -6, wide: true },
  { code: 'FI', left: '0.5%', top: 300, w: 42, r: -6, wide: true },
  { code: 'CN', left: '0.5%', top: 520, w: 46, r: 5,  wide: true },
  { code: 'MY', left: '96.5%', top: 330, w: 44, r: -7, wide: true },
  { code: 'NL', left: '96.5%', top: 560, w: 42, r: 6,  wide: true },
  { code: 'SA', left: '4%',   top: 900, w: 50, r: 4,  wide: true },
  { code: 'MU', left: '92%',  top: 900, w: 42, r: 6,  wide: true },
];

/** Transparent flags floating behind the hero content. Decorative only. */
export function FlagBackdrop() {
  return (
    // Inline position: `.section-dots > *` (index.css) forces children to
    // position:relative, which would collapse this layer to zero height.
    <div className="pointer-events-none overflow-hidden" aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <style>{FLAG_CSS}</style>
      {BACKDROP_SPOTS.map((s, i) => (
        <div key={s.code} className={`tk-flag-float ${s.wide ? 'hidden md:block' : ''}`}
          style={{ position: 'absolute', left: s.left, top: s.top, '--r': `${s.r}deg`, animationDelay: `${(i % 6) * -1.1}s`, opacity: 0.26, filter: 'saturate(1.3) drop-shadow(0 4px 10px rgba(76,29,149,0.18))' }}>
          <Flag code={s.code} width={s.w} style={{ borderRadius: 4, display: 'block' }} />
        </div>
      ))}
    </div>
  );
}

/** Labelled, colourful strip: "Sending love to 16 countries". */
export function SupportedCountries({ className = '' }) {
  const Chip = ({ c, i }) => (
    <span className="inline-flex flex-shrink-0 items-center gap-2 rounded-full border border-white/70 bg-white/80 py-1.5 pl-1.5 pr-3.5 shadow-sm backdrop-blur"
      title={`${c.name} — supported`}>
      <span className="tk-flag-wave inline-flex overflow-hidden rounded-[4px] shadow-[0_2px_6px_rgba(0,0,0,0.18)]" style={{ animationDelay: `${(i % 5) * -0.7}s` }}>
        <Flag code={c.code} width={30} style={{ display: 'block' }} />
      </span>
      <span className="whitespace-nowrap text-[12px] font-bold text-warm-700">{c.name}</span>
    </span>
  );
  return (
    <div className={`tk-flag-strip ${className}`}>
      <style>{FLAG_CSS}</style>
      <p className="mb-2 flex items-center justify-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary-600 lg:justify-start">
        <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
        Cards are sent &amp; gifts collected in {SUPPORTED_COUNTRIES.length}+ countries
      </p>
      <div className="relative overflow-hidden rounded-2xl py-1"
        style={{ maskImage: 'linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)', WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)' }}>
        <div className="tk-flag-marquee flex w-max gap-2">
          {[0, 1].map(set => (
            <div key={set} className="flex gap-2" aria-hidden={set === 1 ? true : undefined}>
              {SUPPORTED_COUNTRIES.map((c, i) => <Chip key={`${set}-${c.code}`} c={c} i={i} />)}
            </div>
          ))}
        </div>
      </div>
      {/* Screen readers get the plain list once. */}
      <p className="sr-only">Supported countries: {SUPPORTED_COUNTRIES.map(c => c.name).join(', ')}.</p>
    </div>
  );
}
