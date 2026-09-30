/**
 * MoneyCardArt — the illustrated front of the "money inside a card" visual.
 *
 * This replaces a flat purple gradient with a gift icon, which said "generic
 * SaaS placeholder" rather than "there is real money inside a real card".
 *
 * Everything is inline SVG: no image request, no CDN, scales to any size, and
 * it stays crisp on retina. Drawn at 300×380 (the hero card's aspect) and
 * scaled with preserveAspectRatio, so the same component works in the hero,
 * the homepage section and anywhere else at any size.
 */
const MoneyCardArt = ({ amount = '₦25,000', label = 'For you', hint = 'Tap to open' }) => (
  <svg viewBox="0 0 300 380" className="h-full w-full" preserveAspectRatio="xMidYMid slice"
    role="img" aria-label={`A greeting card with ${amount} tucked inside`}>
    <defs>
      {/* Deep, warm night — richer than a two-stop purple ramp */}
      <linearGradient id="mca-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%"   stopColor="#2A1055" />
        <stop offset="46%"  stopColor="#6D28D9" />
        <stop offset="100%" stopColor="#C026D3" />
      </linearGradient>
      <radialGradient id="mca-glow" cx="50%" cy="34%" r="62%">
        <stop offset="0%"   stopColor="#FDE68A" stopOpacity="0.30" />
        <stop offset="60%"  stopColor="#F472B6" stopOpacity="0.10" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0" />
      </radialGradient>
      {/* Envelope */}
      <linearGradient id="mca-env" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFF6E9" /><stop offset="100%" stopColor="#F6DFC2" />
      </linearGradient>
      <linearGradient id="mca-flap" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFFCF6" /><stop offset="100%" stopColor="#F3D9B8" />
      </linearGradient>
      {/* The card sliding out */}
      <linearGradient id="mca-card" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" /><stop offset="100%" stopColor="#FFF3F8" />
      </linearGradient>
      {/* Banknote */}
      <linearGradient id="mca-note" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#34D399" /><stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="mca-foil" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FDE68A" /><stop offset="50%" stopColor="#F59E0B" /><stop offset="100%" stopColor="#FDE68A" />
      </linearGradient>
      <filter id="mca-soft" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#1A0B2E" floodOpacity="0.35" />
      </filter>
    </defs>

    <rect width="300" height="380" fill="url(#mca-bg)" />
    <rect width="300" height="380" fill="url(#mca-glow)" />

    {/* Faint concentric rings — depth without clutter */}
    <g fill="none" stroke="#fff" strokeOpacity="0.07">
      <circle cx="150" cy="150" r="96" /><circle cx="150" cy="150" r="132" /><circle cx="150" cy="150" r="168" />
    </g>

    {/* Confetti */}
    <g opacity="0.9">
      {[[36,60,'#FDE68A',14],[262,84,'#F472B6',-22],[44,300,'#67E8F9',30],[258,296,'#FDE68A',-14],
        [76,42,'#A7F3D0',8],[228,44,'#FCA5A5',-30],[28,196,'#C4B5FD',20],[272,206,'#A7F3D0',-8]]
        .map(([x, y, c, r], i) => (
          <rect key={i} x={x} y={y} width="8" height="4.5" rx="2" fill={c} opacity="0.85"
            transform={`rotate(${r} ${x + 4} ${y + 2})`} />
        ))}
      {[[100,320,'#FDE68A'],[196,330,'#F9A8D4'],[60,120,'#93C5FD'],[240,140,'#FDE68A']]
        .map(([x, y, c], i) => <circle key={i} cx={x} cy={y} r="2.6" fill={c} opacity="0.9" />)}
    </g>

    {/* ── The scene: envelope, card, note ─────────────────────────────────── */}
    <g filter="url(#mca-soft)">
      {/* Envelope body */}
      <rect x="46" y="176" width="208" height="132" rx="12" fill="url(#mca-env)" />

      {/* The card, lifted out of the envelope */}
      <g transform="rotate(-4 150 150)">
        <rect x="72" y="96" width="156" height="122" rx="10" fill="url(#mca-card)" />
        {/* gold rule */}
        <rect x="88" y="112" width="46" height="4" rx="2" fill="url(#mca-foil)" />
        {/* handwritten message lines */}
        <g stroke="#C4B5FD" strokeWidth="3.4" strokeLinecap="round" opacity="0.85">
          <path d="M88 132 h118" /><path d="M88 146 h104" /><path d="M88 160 h122" /><path d="M88 174 h72" />
        </g>
        {/* a small heart, drawn not iconified */}
        <path d="M198 166c-5-4.6-11-8.6-11-14.2a6 6 0 0 1 11-3.3 6 6 0 0 1 11 3.3c0 5.6-6 9.6-11 14.2z"
          fill="#F43F5E" opacity="0.9" />
      </g>

      {/* Banknotes peeking out from behind the card — two edges read as a
          stack rather than a single flat sticker. */}
      <g transform="rotate(2 150 250)" opacity="0.85">
        <rect x="98" y="206" width="116" height="60" rx="7" fill="#047857" />
      </g>
      <g transform="rotate(7 150 250)">
        <rect x="92" y="212" width="116" height="60" rx="7" fill="url(#mca-note)" />
        <rect x="100" y="220" width="100" height="44" rx="5" fill="none" stroke="#ECFDF5" strokeOpacity="0.55" />
        <circle cx="118" cy="242" r="11" fill="#ECFDF5" fillOpacity="0.24" />
        <circle cx="182" cy="242" r="11" fill="#ECFDF5" fillOpacity="0.24" />
        <g stroke="#ECFDF5" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round">
          <path d="M138 236 h24" /><path d="M138 242 h24" /><path d="M138 248 h24" />
        </g>
      </g>

      {/* Envelope flap, open — drawn last so it sits in front */}
      <path d="M46 188 v-12 a12 12 0 0 1 12-12 h184 a12 12 0 0 1 12 12 v12 l-104 62 z"
        fill="url(#mca-flap)" />
      <path d="M46 188 l104 62 104-62" fill="none" stroke="#E3C7A4" strokeWidth="1.5" />
    </g>

    {/* Sealing wax dot */}
    <circle cx="150" cy="252" r="11" fill="url(#mca-foil)" />
    <circle cx="150" cy="252" r="11" fill="none" stroke="#FFFBEB" strokeOpacity="0.6" />

    {/* Amount pill */}
    <g>
      <rect x="92" y="316" width="116" height="32" rx="16" fill="#062E22" fillOpacity="0.55" />
      <rect x="92" y="316" width="116" height="32" rx="16" fill="none" stroke="#6EE7B7" strokeOpacity="0.55" />
      <text x="150" y="337" textAnchor="middle" fontSize="15" fontWeight="800"
        fill="#A7F3D0" fontFamily="system-ui, sans-serif">{amount} inside</text>
    </g>

    {/* Words */}
    <text x="150" y="44" textAnchor="middle" fontSize="11" fontWeight="800" letterSpacing="2.4"
      fill="#FFFFFF" fillOpacity="0.66" fontFamily="system-ui, sans-serif">
      {label.toUpperCase()}
    </text>
    <text x="150" y="368" textAnchor="middle" fontSize="11" fontWeight="600"
      fill="#FFFFFF" fillOpacity="0.6" fontFamily="system-ui, sans-serif">
      {hint}
    </text>
  </svg>
);

export default MoneyCardArt;
