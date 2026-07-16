/**
 * CardDesignGallery.jsx — /design
 *
 * Thankbox-style gallery landing page.
 * Visitor picks an occasion, browses A4 card designs, enters
 * recipient / sender names and sees the card cover update in
 * real-time.  "Create this card" navigates to /card/new with
 * all selections pre-filled.
 */

import { useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useSEO } from '../hooks/useSEO';
import { CARD_DESIGNS } from '../utils/cardDesigns';
import { LEAVING_CARD_DESIGNS } from '../utils/leavingCardDesigns';

// ─── Occasion list ────────────────────────────────────────────────────────────
const OCCASIONS = [
  { id: 'all',            emoji: '✨', label: 'All cards'    },
  { id: 'birthday',       emoji: '🎂', label: 'Birthday'     },
  { id: 'leaving',        emoji: '👋', label: 'Leaving'      },
  { id: 'anniversary',    emoji: '💍', label: 'Anniversary'  },
  { id: 'congratulations',emoji: '🎊', label: 'Congrats'     },
  { id: 'graduation',     emoji: '🎓', label: 'Graduation'   },
  { id: 'promotion',      emoji: '📈', label: 'Promotion'    },
  { id: 'retirement',     emoji: '☀️', label: 'Retirement'   },
  { id: 'wedding',        emoji: '💒', label: 'Wedding'      },
  { id: 'baby_shower',    emoji: '👶', label: 'Baby Shower'  },
  { id: 'valentine',      emoji: '❤️', label: "Valentine's"  },
  { id: 'christmas',      emoji: '🎄', label: 'Christmas'    },
  { id: 'new_year',       emoji: '🎆', label: 'New Year'     },
  { id: 'get_well',       emoji: '🌸', label: 'Get Well'     },
  { id: 'other',          emoji: '💝', label: 'Other'        },
];

// Human-readable greeting per occasion (shown on the card preview)
const OCCASION_GREETING = {
  birthday:        'Happy Birthday!',
  valentine:       "Happy Valentine's Day",
  leaving:         'Goodbye & Good Luck',
  anniversary:     'Happy Anniversary',
  wedding:         'Congratulations on Your Wedding',
  baby_shower:     'Congratulations on the New Baby!',
  retirement:      'Happy Retirement!',
  congratulations: 'Congratulations!',
  graduation:      'Congratulations, Graduate!',
  promotion:       'Congratulations on Your Promotion!',
  christmas:       'Merry Christmas!',
  get_well:        'Wishing You a Speedy Recovery',
  new_year:        'Happy New Year!',
  other:           'With Love',
};

// Occasion → which CARD_DESIGN ids to show (leaving uses its own list)
const OCCASION_DESIGN_IDS = {
  birthday:        ['rose_love','cherry_blossom','neon_party','minimal_chic','tropical_paradise','starry_night','warm_ember'],
  valentine:       ['rose_love','cherry_blossom','rose_gold','lavender_dream','sunset_vibes'],
  anniversary:     ['rose_gold','golden_glow','garden_bloom','lavender_dream','starry_night','rose_love'],
  wedding:         ['rose_love','garden_bloom','minimal_chic','mint_freshness','ocean_breeze','cherry_blossom'],
  baby_shower:     ['cherry_blossom','mint_freshness','lavender_dream','rose_gold','ocean_breeze'],
  retirement:      ['golden_glow','warm_ember','sunset_vibes','fresh_garden','tropical_paradise','garden_bloom'],
  congratulations: ['minimal_chic','neon_party','golden_glow','tropical_paradise','midnight_blue','starry_night'],
  graduation:      ['midnight_blue','starry_night','golden_glow','fresh_garden','cosmic_joy','minimal_chic'],
  promotion:       ['midnight_blue','golden_glow','fresh_garden','minimal_chic','starry_night','cosmic_joy'],
  christmas:       ['starry_night','neon_party','rose_love','warm_ember','fresh_garden','midnight_blue'],
  get_well:        ['garden_bloom','mint_freshness','cherry_blossom','ocean_breeze','rose_gold','tropical_paradise'],
  new_year:        ['starry_night','cosmic_joy','neon_party','midnight_blue','golden_glow'],
  other:           ['rose_love','minimal_chic','garden_bloom','midnight_blue','warm_ember','rose_gold'],
};

// Badge labels for selected generic designs
const DESIGN_BADGES = {
  rose_love:'Popular', starry_night:'Dark', garden_bloom:'Nature', golden_glow:'Gold',
  warm_ember:'Vibrant', midnight_blue:'Classic', fresh_garden:'Luxe', minimal_chic:'Modern',
  cherry_blossom:'New', ocean_breeze:'Fresh', sunset_vibes:'Warm', lavender_dream:'Soft',
  neon_party:'Bold', mint_freshness:'Mint', rose_gold:'Elegant', cosmic_joy:'Space',
  tropical_paradise:'Tropical',
};

// Inline SVG decorative art per design's art-type — rendered inside the A4 preview
const ART_SVG = {
  petals: (ink) => (
    <g opacity="0.25">
      <ellipse cx="60" cy="80" rx="18" ry="28" fill={ink} transform="rotate(-30 60 80)"/>
      <ellipse cx="360" cy="100" rx="15" ry="24" fill={ink} transform="rotate(40 360 100)"/>
      <ellipse cx="80" cy="480" rx="14" ry="22" fill={ink} transform="rotate(20 80 480)"/>
      <ellipse cx="340" cy="500" rx="16" ry="25" fill={ink} transform="rotate(-25 340 500)"/>
      <ellipse cx="200" cy="60" rx="12" ry="20" fill={ink} transform="rotate(10 200 60)"/>
    </g>
  ),
  stars: (ink) => (
    <g opacity="0.3">
      {[[50,60],[370,80],[80,450],[350,470],[200,40],[120,520],[300,50]].map(([x,y],i)=>(
        <polygon key={i} points={`${x},${y-10} ${x+3},${y-3} ${x+10},${y-3} ${x+5},${y+2} ${x+7},${y+9} ${x},${y+5} ${x-7},${y+9} ${x-5},${y+2} ${x-10},${y-3} ${x-3},${y-3}`} fill={ink}/>
      ))}
    </g>
  ),
  leaves: (ink) => (
    <g opacity="0.2">
      <path d="M40 100 Q80 60 60 120 Q20 130 40 100Z" fill={ink}/>
      <path d="M360 80 Q400 50 380 110 Q340 120 360 80Z" fill={ink}/>
      <path d="M50 460 Q90 430 70 490 Q30 500 50 460Z" fill={ink}/>
      <path d="M350 440 Q390 410 370 470 Q330 480 350 440Z" fill={ink}/>
    </g>
  ),
  sunburst: (ink) => (
    <g opacity="0.12">
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i)=>(
        <line key={i} x1="210" y1="297" x2={210+Math.cos(a*Math.PI/180)*320} y2={297+Math.sin(a*Math.PI/180)*380} stroke={ink} strokeWidth="3"/>
      ))}
    </g>
  ),
  waves: (ink) => (
    <g opacity="0.18">
      <path d="M0 200 Q105 160 210 200 Q315 240 420 200" stroke={ink} strokeWidth="3" fill="none"/>
      <path d="M0 240 Q105 200 210 240 Q315 280 420 240" stroke={ink} strokeWidth="3" fill="none"/>
      <path d="M0 400 Q105 360 210 400 Q315 440 420 400" stroke={ink} strokeWidth="3" fill="none"/>
    </g>
  ),
  facets: (ink) => (
    <g opacity="0.14">
      <polygon points="210,30 310,150 210,120 110,150" fill={ink}/>
      <polygon points="210,564 310,444 210,474 110,444" fill={ink}/>
      <polygon points="40,297 160,200 130,297 160,394" fill={ink}/>
      <polygon points="380,297 260,200 290,297 260,394" fill={ink}/>
    </g>
  ),
  arches: (ink) => (
    <g opacity="0.15">
      <path d="M60 594 Q60 420 210 420 Q360 420 360 594" stroke={ink} strokeWidth="3" fill="none"/>
      <path d="M20 594 Q20 380 210 380 Q400 380 400 594" stroke={ink} strokeWidth="3" fill="none"/>
    </g>
  ),
  confetti: (ink) => (
    <g opacity="0.28">
      {[[50,80,'#f59e0b'],[90,50,'#ec4899'],[330,60,'#7c3aed'],[370,100,'#10b981'],
        [40,500,'#f43f5e'],[370,480,'#f59e0b'],[200,30,'#60a5fa'],[150,530,'#ec4899'],
        [270,520,'#7c3aed'],[310,40,'#10b981']].map(([x,y,c],i)=>(
        <rect key={i} x={x} y={y} width="12" height="12" fill={c} rx="2" transform={`rotate(${i*37} ${x+6} ${y+6})`}/>
      ))}
    </g>
  ),
};

// ─── A4 Card Cover Preview ────────────────────────────────────────────────────
// Renders as an inline SVG at 420×594 (A4 at 50dpi).
// For leaving cards: renders a background-image div with an overlay.
const CardCoverPreview = ({
  design,        // CARD_DESIGNS entry or LEAVING_CARD_DESIGNS entry
  isLeaving,     // bool
  occasionId,
  recipientName,
  fromName,
  cardTitle,
}) => {
  const greeting = OCCASION_GREETING[occasionId] || 'With Love';
  const displayName = recipientName || 'Their Name';
  const displayFrom = fromName || 'Your Name';
  const displayTitle = cardTitle || (recipientName ? `${recipientName}'s Card` : 'Group Card');

  if (isLeaving && design?.image) {
    return (
      <div style={{
        width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
        backgroundImage: `url(${design.image})`,
        backgroundSize: 'cover', backgroundPosition: 'center center',
        borderRadius: 'inherit',
      }}>
        {/* Top gradient overlay for text */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '35%',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: '8% 8% 4%',
        }}>
          <div style={{ color: '#fff', fontSize: 'clamp(11px,2.4vw,18px)', fontFamily: "'Caveat', cursive", opacity: 0.9 }}>
            {greeting}
          </div>
          <div style={{ color: '#fff', fontSize: 'clamp(14px,3vw,26px)', fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, lineHeight: 1.15, marginTop: '2%' }}>
            {displayName}
          </div>
        </div>
        {/* Bottom gradient overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '22%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
          display: 'flex', alignItems: 'flex-end',
          padding: '4% 8% 6%',
        }}>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'clamp(9px,1.8vw,14px)', fontFamily: "'Caveat', cursive" }}>
            From {displayFrom} 💛
          </div>
        </div>
      </div>
    );
  }

  if (!design) return null;

  const ink = design.ink || '#1f2937';
  const art = ART_SVG[design.art] ? ART_SVG[design.art](ink) : null;

  return (
    <svg
      viewBox="0 0 420 594"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', display: 'block', borderRadius: 'inherit' }}
    >
      <defs>
        <linearGradient id={`bgGrad-${design.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          {/* We apply the background via a foreignObject to keep gradient CSS */}
        </linearGradient>
      </defs>

      {/* Background rect — use a foreignObject to apply the CSS gradient faithfully */}
      <foreignObject x="0" y="0" width="420" height="594">
        <div xmlns="http://www.w3.org/1999/xhtml" style={{
          width: '420px', height: '594px',
          background: design.background,
          borderRadius: 0,
        }}/>
      </foreignObject>

      {/* Decorative art layer */}
      {art}

      {/* Top decorative bar */}
      <rect x="0" y="0" width="420" height="6" fill={design.accent || ink} opacity="0.7"/>

      {/* Large emoji icon */}
      <foreignObject x="135" y="55" width="150" height="120">
        <div xmlns="http://www.w3.org/1999/xhtml"
          style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'68px', filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.18))' }}>
          {design.icon}
        </div>
      </foreignObject>

      {/* Thin divider */}
      <rect x="150" y="188" width="120" height="2" fill={ink} opacity="0.18" rx="1"/>

      {/* Occasion greeting */}
      <foreignObject x="30" y="202" width="360" height="64">
        <div xmlns="http://www.w3.org/1999/xhtml" style={{
          width: '100%', textAlign: 'center',
          fontFamily: "'Great Vibes', cursive",
          fontSize: '26px', color: ink,
          opacity: 0.85, lineHeight: 1.3,
        }}>
          {greeting}
        </div>
      </foreignObject>

      {/* Recipient name — large and prominent */}
      <foreignObject x="20" y="272" width="380" height="100">
        <div xmlns="http://www.w3.org/1999/xhtml" style={{
          width: '100%', textAlign: 'center',
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: recipientName && recipientName.length > 14 ? '28px' : '36px',
          fontWeight: 700, color: ink, lineHeight: 1.2,
        }}>
          {displayName}
        </div>
      </foreignObject>

      {/* Card title */}
      <foreignObject x="40" y="378" width="340" height="48">
        <div xmlns="http://www.w3.org/1999/xhtml" style={{
          width: '100%', textAlign: 'center',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '13px', color: ink, opacity: 0.65, lineHeight: 1.4,
        }}>
          {displayTitle}
        </div>
      </foreignObject>

      {/* Bottom decorative divider */}
      <rect x="80" y="436" width="260" height="1.5" fill={ink} opacity="0.12" rx="1"/>

      {/* From name */}
      <foreignObject x="40" y="447" width="340" height="60">
        <div xmlns="http://www.w3.org/1999/xhtml" style={{
          width: '100%', textAlign: 'center',
          fontFamily: "'Caveat', cursive",
          fontSize: '20px', color: ink, opacity: 0.75,
        }}>
          From {displayFrom} 💛
        </div>
      </foreignObject>

      {/* "Group card by Thankeeu" watermark */}
      <foreignObject x="0" y="560" width="420" height="28">
        <div xmlns="http://www.w3.org/1999/xhtml" style={{
          width: '100%', textAlign: 'center',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '9px', color: ink, opacity: 0.3, letterSpacing: '0.08em',
        }}>
          GROUP CARD · THANKEEU.COM
        </div>
      </foreignObject>

      {/* Bottom accent bar */}
      <rect x="0" y="588" width="420" height="6" fill={design.accent || ink} opacity="0.7"/>
    </svg>
  );
};

// ─── Thumbnail card (smaller render in the grid) ──────────────────────────────
const CardThumbnail = ({ design, isLeaving, isSelected, onClick, badge }) => (
  <button
    onClick={onClick}
    style={{
      position: 'relative', border: 'none', padding: 0, cursor: 'pointer',
      borderRadius: 12, overflow: 'hidden',
      aspectRatio: '210/297',
      outline: isSelected ? '3px solid #7C3AED' : '2px solid transparent',
      outlineOffset: isSelected ? 2 : 0,
      boxShadow: isSelected ? '0 0 0 5px rgba(124,58,237,0.15)' : '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'transform 0.15s, box-shadow 0.15s, outline 0.15s',
      transform: isSelected ? 'translateY(-2px)' : 'none',
      width: '100%',
      display: 'block',
      background: '#f3f4f6',
    }}
    onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)'; } }}
    onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; } }}
  >
    {/* Thumbnail render */}
    <div style={{ position: 'absolute', inset: 0 }}>
      {isLeaving && design?.image ? (
        <div style={{
          width: '100%', height: '100%',
          backgroundImage: `url(${design.image})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}/>
      ) : design ? (
        <div style={{
          width: '100%', height: '100%', background: design.background,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 6, padding: 8,
        }}>
          <div style={{ fontSize: 28, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))' }}>{design.icon}</div>
          <div style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
            fontSize: 9, color: design.ink, textAlign: 'center',
            lineHeight: 1.3, padding: '0 4px',
            textShadow: design.dark ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
          }}>{design.name}</div>
        </div>
      ) : null}
    </div>

    {/* Badge */}
    {badge && (
      <div style={{
        position: 'absolute', top: 6, left: 6, padding: '2px 7px', borderRadius: 20,
        fontSize: 9, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif",
        background: badge === 'Popular' ? '#FCD34D' : badge === 'New' ? '#A78BFA' : badge === 'Bold' ? '#F43F5E' : '#6EE7B7',
        color: badge === 'Popular' ? '#92400E' : badge === 'Bold' ? '#fff' : '#065F46',
        zIndex: 2,
      }}>
        {badge}
      </div>
    )}

    {/* Selected checkmark */}
    {isSelected && (
      <div style={{
        position: 'absolute', bottom: 6, right: 6,
        width: 22, height: 22, borderRadius: '50%',
        background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 3,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
    )}
  </button>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const CardDesignGallery = () => {
  useSEO({
    title: 'Create a Group Card | Pick Your Design | Thankeeu',
    description: 'Choose from dozens of beautiful card designs for any occasion — birthday, farewell, wedding, baby shower, and more. See a live preview as you personalise.',
    canonical: '/design',
  });

  const navigate = useNavigate();
  const occasionScrollRef = useRef();

  // Form state
  const [selectedOccasion, setSelectedOccasion] = useState('all');
  const [selectedDesignId, setSelectedDesignId]  = useState('rose_love');
  const [recipientName,    setRecipientName]      = useState('');
  const [fromName,         setFromName]           = useState('');
  const [cardTitle,        setCardTitle]          = useState('');
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  // ── Build flat design list from selected occasion ──────────────────────
  const visibleDesigns = useMemo(() => {
    if (selectedOccasion === 'leaving') {
      return LEAVING_CARD_DESIGNS.map(d => ({ ...d, _isLeaving: true }));
    }
    const allowedIds = OCCASION_DESIGN_IDS[selectedOccasion] || null;
    const generics = CARD_DESIGNS
      .filter(d => {
        // exclude the leaving-card entries that got merged into CARD_DESIGNS
        if (LEAVING_CARD_DESIGNS.find(l => l.id === d.id)) return false;
        if (allowedIds) return allowedIds.includes(d.id);
        return true;
      })
      .map(d => ({ ...d, _isLeaving: false }));

    if (allowedIds && selectedOccasion !== 'all') {
      // preserve the order defined in OCCASION_DESIGN_IDS
      return allowedIds
        .map(id => generics.find(d => d.id === id))
        .filter(Boolean);
    }
    return generics;
  }, [selectedOccasion]);

  // Auto-select first design when occasion changes
  const handleOccasionChange = (occId) => {
    setSelectedOccasion(occId);
    setSelectedDesignId(''); // will be set below after visibleDesigns recalc
  };

  // The selected design entry
  const selectedEntry = useMemo(() => {
    if (!selectedDesignId) return visibleDesigns[0];
    return visibleDesigns.find(d => d.id === selectedDesignId) || visibleDesigns[0];
  }, [selectedDesignId, visibleDesigns]);

  const isLeaving = selectedEntry?._isLeaving;

  // Auto-update card title when recipient name or occasion changes
  const autoTitle = () => {
    if (cardTitle) return cardTitle; // user has typed something
    const occLabel = OCCASIONS.find(o => o.id === selectedOccasion)?.label || 'Card';
    return recipientName ? `${recipientName}'s ${occLabel} Card` : '';
  };

  const handleCreateCard = () => {
    if (!selectedEntry) return;
    const params = new URLSearchParams();
    // For leaving cards: use the wizard's leaving flow
    params.set('occasion', selectedOccasion === 'leaving' ? 'leaving' : selectedOccasion === 'all' ? 'birthday' : selectedOccasion);
    params.set('design', selectedEntry.id);
    if (isLeaving) params.set('layout', 'album');
    if (recipientName) params.set('recipient', recipientName);
    navigate(`/card/new?${params.toString()}`);
  };

  const previewTitle = cardTitle || autoTitle() || (recipientName ? `${recipientName}'s Card` : 'Group Card');

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar/>

      {/* ── Mobile "See Preview" sticky strip ── */}
      <div style={{
        display: 'none',
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        padding: '12px 16px', background: '#fff',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
        gap: 10,
      }} className="gal-mobile-cta">
        <button
          onClick={() => setMobilePreviewOpen(true)}
          style={{
            flex: 1, padding: '12px', borderRadius: 14,
            border: '2px solid #7C3AED', background: '#F5F0FF',
            color: '#7C3AED', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>
          👁 Preview
        </button>
        <button
          onClick={handleCreateCard}
          style={{
            flex: 2, padding: '12px', borderRadius: 14,
            background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
            color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', border: 'none',
          }}>
          Create this card →
        </button>
      </div>

      {/* ── Mobile preview drawer ── */}
      {mobilePreviewOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'flex-end',
        }} onClick={() => setMobilePreviewOpen(false)}>
          <div style={{
            background: '#fff', borderRadius: '20px 20px 0 0',
            padding: '24px 20px 32px', width: '100%',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '0 auto 20px' }}/>
            <div style={{ maxWidth: 280, margin: '0 auto', aspectRatio: '210/297', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
              <CardCoverPreview
                design={selectedEntry}
                isLeaving={isLeaving}
                occasionId={selectedOccasion === 'all' ? 'other' : selectedOccasion}
                recipientName={recipientName}
                fromName={fromName}
                cardTitle={previewTitle}
              />
            </div>
            <button onClick={() => setMobilePreviewOpen(false)} style={{ marginTop: 20, width: '100%', padding: '12px', borderRadius: 14, border: '2px solid #e5e7eb', background: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', color: '#6b7280' }}>
              Close
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .gal-mobile-cta { display: flex !important; }
          .gal-right-panel { display: none !important; }
          .gal-left-panel { padding-bottom: 90px !important; }
        }
        .gal-design-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        @media (max-width: 1100px) {
          .gal-design-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 640px) {
          .gal-design-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
        }
        @media (max-width: 400px) {
          .gal-design-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .occ-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 100px; border: 2px solid transparent;
          white-space: nowrap; font-weight: 700; font-size: 13px;
          cursor: pointer; transition: all 0.15s; background: #fff;
          color: #6b7280; border-color: #e5e7eb;
        }
        .occ-pill:hover { border-color: #a78bfa; color: #7C3AED; }
        .occ-pill.active { background: #7C3AED; color: #fff; border-color: #7C3AED; }
        .gal-input {
          width: 100%; padding: 10px 14px; border-radius: 12px;
          border: 2px solid #ede9fe; background: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px;
          color: #1f2937; outline: none; transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .gal-input:focus { border-color: #7C3AED; }
        .gal-input::placeholder { color: #9ca3af; }
        .gal-label { font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 5px; display: block; }
      `}</style>

      {/* ── Main two-panel layout ── */}
      <div style={{
        display: 'flex', minHeight: 'calc(100vh - 64px)',
        maxWidth: 1400, margin: '0 auto',
      }}>

        {/* ══ LEFT PANEL: Picker ══════════════════════════════════════════ */}
        <div className="gal-left-panel" style={{
          flex: 1, minWidth: 0, padding: '32px 28px 40px',
          overflowY: 'auto',
        }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 800, color: '#1A1035', margin: '0 0 6px' }}>
              Create a group card
            </h1>
            <p style={{ color: '#7A6CA8', fontSize: 14, margin: 0 }}>
              Pick an occasion and a design — see it come to life on the right
            </p>
          </div>

          {/* ── Recipient & From inputs ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
            <div>
              <label className="gal-label">Who's it for?</label>
              <input
                className="gal-input"
                placeholder="Recipient's name"
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
              />
            </div>
            <div>
              <label className="gal-label">Your name</label>
              <input
                className="gal-input"
                placeholder="Your name"
                value={fromName}
                onChange={e => setFromName(e.target.value)}
              />
            </div>
          </div>

          {/* ── Occasion filter pills ── */}
          <div style={{ marginBottom: 20 }}>
            <div className="gal-label" style={{ marginBottom: 10 }}>Occasion</div>
            <div
              ref={occasionScrollRef}
              style={{
                display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8,
                scrollbarWidth: 'none', msOverflowStyle: 'none',
              }}
            >
              {OCCASIONS.map(occ => (
                <button
                  key={occ.id}
                  className={`occ-pill${selectedOccasion === occ.id ? ' active' : ''}`}
                  onClick={() => {
                    setSelectedOccasion(occ.id);
                    setSelectedDesignId('');
                  }}
                >
                  <span>{occ.emoji}</span>
                  <span>{occ.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Design count ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: '#7A6CA8' }}>
              {visibleDesigns.length} design{visibleDesigns.length !== 1 ? 's' : ''}
              {selectedOccasion !== 'all' ? ` for ${OCCASIONS.find(o=>o.id===selectedOccasion)?.label}` : ''}
            </span>
            {selectedEntry && (
              <span style={{ fontSize: 12, color: '#7C3AED', fontWeight: 700 }}>
                Selected: {selectedEntry.name}
              </span>
            )}
          </div>

          {/* ── Design grid ── */}
          <div className="gal-design-grid">
            {visibleDesigns.map((d, idx) => {
              const badge = d._isLeaving
                ? (d.badge || null)
                : (DESIGN_BADGES[d.id] || (idx < 3 ? 'New' : null));
              return (
                <CardThumbnail
                  key={d.id}
                  design={d}
                  isLeaving={d._isLeaving}
                  isSelected={d.id === (selectedEntry?.id)}
                  badge={badge}
                  onClick={() => setSelectedDesignId(d.id)}
                />
              );
            })}
          </div>

          {/* ── No designs fallback ── */}
          {visibleDesigns.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7A6CA8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎨</div>
              <p style={{ fontWeight: 700 }}>No designs for this occasion yet</p>
              <p style={{ fontSize: 13 }}>Try selecting "All cards" to see everything</p>
            </div>
          )}

          {/* ── Mobile: Card title input ── */}
          <div style={{ marginTop: 24 }} className="gal-mobile-title-input">
            <label className="gal-label">Card title (optional)</label>
            <input
              className="gal-input"
              placeholder={autoTitle() || "e.g. Sarah's Birthday Card"}
              value={cardTitle}
              onChange={e => setCardTitle(e.target.value)}
            />
          </div>
        </div>

        {/* ══ RIGHT PANEL: Live preview ═════════════════════════════════ */}
        <div className="gal-right-panel" style={{
          width: 380, flexShrink: 0,
          borderLeft: '1px solid #ede9fe',
          background: 'linear-gradient(160deg, #F5F0FF, #FFF0F5)',
          position: 'sticky', top: 0, height: 'calc(100vh - 64px)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}>

          {/* Preview header */}
          <div style={{ padding: '28px 28px 0' }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>
              Live Preview
            </p>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 20px' }}>
              Updates as you type
            </p>
          </div>

          {/* A4 card preview */}
          <div style={{ padding: '0 28px', flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
            <div style={{
              width: '100%', maxWidth: 290,
              aspectRatio: '210/297',
              borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.12)',
            }}>
              <CardCoverPreview
                design={selectedEntry}
                isLeaving={isLeaving}
                occasionId={selectedOccasion === 'all' ? 'other' : selectedOccasion}
                recipientName={recipientName}
                fromName={fromName}
                cardTitle={previewTitle}
              />
            </div>
          </div>

          {/* Form inputs in right panel */}
          <div style={{ padding: '20px 28px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Card title */}
            <div>
              <label className="gal-label">Card title</label>
              <input
                className="gal-input"
                placeholder={autoTitle() || "e.g. Sarah's Birthday Card"}
                value={cardTitle}
                onChange={e => setCardTitle(e.target.value)}
              />
            </div>

            {/* Selected design info */}
            {selectedEntry && (
              <div style={{
                padding: '10px 14px', borderRadius: 12,
                background: '#fff', border: '2px solid #ede9fe',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                {isLeaving ? (
                  <div style={{
                    width: 36, height: 50, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
                    backgroundImage: `url(${selectedEntry.image})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  }}/>
                ) : (
                  <div style={{
                    width: 36, height: 50, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
                    background: selectedEntry.background,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>
                    {selectedEntry.icon}
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1035', lineHeight: 1.2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {selectedEntry.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#7A6CA8', marginTop: 2 }}>
                    {selectedOccasion !== 'all' ? OCCASIONS.find(o=>o.id===selectedOccasion)?.label : 'Any occasion'}
                  </div>
                </div>
              </div>
            )}

            {/* CTA button */}
            <button
              onClick={handleCreateCard}
              style={{
                width: '100%', padding: '15px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
                color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(124,58,237,0.35)',
                transition: 'transform 0.15s, box-shadow 0.15s',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(124,58,237,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(124,58,237,0.35)'; }}
            >
              Create this card →
            </button>

            <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', margin: 0 }}>
              Takes less than 3 minutes · No account needed to start
            </p>

            {/* Nav links */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 4 }}>
              <Link to="/cards/leaving-card/gallery" style={{ fontSize: 12, color: '#7C3AED', textDecoration: 'none', fontWeight: 600 }}>
                Browse leaving cards →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDesignGallery;
