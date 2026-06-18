import { useSEO } from '../hooks/useSEO';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { cardsAPI, memberCardsAPI, messagesAPI, dashboardAPI, authAPI, banksAPI, giftcardsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useMemberAuth } from '../context/MemberAuthContext';
import { useCompanyAuth } from '../context/CompanyAuthContext';
import { cardArtClass, getCardDesign, getFontStyle } from '../utils/cardDesigns';
import DashboardLayout from '../components/DashboardLayout';
import MemberLayout from '../components/member/MemberLayout';
import CompanyLayout from '../components/company/CompanyLayout';
import BankAccountTab from '../components/BankAccountTab';


import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { formatNGN } from '../utils/currency';

// ── Calligraphic font styles for signer names (decorative only — the actual
// message text uses the signee's chosen font_style via getFontStyle) ────────
// ── Fonts — calligraphic for author names + extra richness ───────────────────
const FONT_INJECT = `
@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Great+Vibes&family=Satisfy&family=Sacramento&family=Kaushan+Script&family=Pinyon+Script&family=Alex+Brush&family=Allura&display=swap');
.font-dancing   { font-family:'Dancing Script', cursive; }
.font-vibes     { font-family:'Great Vibes', cursive; }
.font-satisfy   { font-family:'Satisfy', cursive; }
.font-sacramento{ font-family:'Sacramento', cursive; }
.font-kaushan   { font-family:'Kaushan Script', cursive; }
.font-pinyon    { font-family:'Pinyon Script', cursive; }
.font-alex      { font-family:'Alex Brush', cursive; }
.font-allura    { font-family:'Allura', cursive; }
`;

// ── MagicSearch — a playful floating search experience ────────────────────────
// Expands from a pill into a full search field, cycles placeholder names,
// shows sparkle particles when a match is found, highlights matched cards.
function MagicSearch({ messages, query, setQuery, active, setActive, design, found, setFound }) {
  const inputRef   = useRef(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [sparkles,       setSparkles]       = useState([]);
  const [resultCount,    setResultCount]    = useState(null);

  // Build placeholder names from actual signers
  const names = [...new Set(messages.map(m => m.author_name).filter(Boolean))].slice(0, 8);

  // Cycle placeholder every 2.2s when idle
  useEffect(() => {
    if (active || names.length < 2) return; // need ≥2 names to cycle; also prevents % 0 = NaN
    const t = setInterval(() => setPlaceholderIdx(i => (i + 1) % names.length), 2200);
    return () => clearInterval(t);
  }, [active, names.length]);

  // Auto-focus when activated
  useEffect(() => {
    if (active) { setTimeout(() => inputRef.current?.focus(), 180); }
  }, [active]);

  // Sparkle burst when results found
  function burstSparkles(count) {
    const s = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x:  Math.random() * 100,
      y:  Math.random() * 60,
      color: [design.accent, '#FBBF24', '#EC4899', '#A855F7', '#34D399'][i % 5],
      size: 4 + Math.random() * 6,
      dur:  0.6 + Math.random() * 0.5,
    }));
    setSparkles(s);
    setTimeout(() => setSparkles([]), 1200);
  }

  const handleChange = (val) => {
    setQuery(val);
    if (val.trim().length >= 2) {
      const hits = messages.filter(m =>
        m.author_name?.toLowerCase().includes(val.toLowerCase().trim())
      ).length;
      setResultCount(hits);
      if (hits > 0) burstSparkles(hits > 5 ? 12 : 6);
      else setResultCount(0);
    } else {
      setResultCount(null);
    }
  };

  const handleClose = () => {
    setQuery('');
    setActive(false);
    setResultCount(null);
    setSparkles([]);
  };

  const placeholder = names[placeholderIdx] ? `Find ${names[placeholderIdx]}…` : 'Search by name…';

  return (
    <div style={{ position:'relative', display:'flex', justifyContent:'center', marginBottom: 8 }}>
      <style>{`
        @keyframes magic-expand {
          from { width: 180px; opacity: 0.7; }
          to   { width: 100%;  opacity: 1;   }
        }
        @keyframes sparkle-pop {
          0%   { transform: scale(0) rotate(0deg);   opacity: 1; }
          60%  { transform: scale(1.4) rotate(180deg); opacity: 0.9; }
          100% { transform: scale(0) rotate(360deg); opacity: 0; }
        }
        @keyframes pill-pulse {
          0%,100% { box-shadow: 0 0 0 0 ${design.accent}44; }
          50%      { box-shadow: 0 0 0 8px ${design.accent}00; }
        }
        @keyframes placeholder-fade {
          0%,85% { opacity: 1; }
          95%    { opacity: 0; }
          100%   { opacity: 1; }
        }
        .magic-search-input::placeholder { 
          animation: placeholder-fade 2.2s ease infinite;
          color: ${design.accent}99;
        }
        .magic-search-input:focus { outline: none; }
      `}</style>

      {/* Sparkle particles */}
      {sparkles.map(s => (
        <div key={s.id} style={{
          position:'absolute', left:`${s.x}%`, top:`${s.y}%`,
          width:s.size, height:s.size, borderRadius:'50%',
          background: s.color, pointerEvents:'none', zIndex:10,
          animation: `sparkle-pop ${s.dur}s ease forwards`,
        }} />
      ))}

      {!active ? (
        /* ── Collapsed pill — inviting tap ── */
        <button onClick={() => setActive(true)}
          style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'10px 20px', borderRadius:50,
            border:`2px solid ${design.accent}33`,
            background:`${design.accent}0F`,
            color: design.accent, cursor:'pointer',
            fontSize:13, fontWeight:700,
            transition:'all .2s ease',
            animation: 'pill-pulse 3s ease infinite',
            backdropFilter:'blur(8px)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = design.accent + '22';
            e.currentTarget.style.transform = 'scale(1.04)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = design.accent + '0F';
            e.currentTarget.style.transform = 'scale(1)';
          }}>
          <span style={{ fontSize:16 }}>🔍</span>
          <span style={{ fontFamily:"'Dancing Script', cursive", fontSize:15 }}>
            {placeholder}
          </span>
          <span style={{ fontSize:11, opacity:0.5, fontFamily:'sans-serif', fontStyle:'italic' }}>tap to search</span>
        </button>

      ) : (
        /* ── Expanded search field ── */
        <div style={{
          width:'100%', position:'relative',
          animation:'magic-expand .25s cubic-bezier(.34,1.56,.64,1)',
        }}>
          {/* Glowing border effect */}
          <div style={{
            position:'absolute', inset:-2, borderRadius:18,
            background:`linear-gradient(135deg, ${design.accent}, #EC4899, ${design.accent})`,
            backgroundSize:'200% 200%',
            animation:'gradient-shift 3s ease infinite',
            zIndex:0, opacity:0.5, filter:'blur(3px)',
          }} />
          <style>{`@keyframes gradient-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }`}</style>

          <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', background:'white', borderRadius:16, padding:'2px 4px', boxShadow:'0 4px 20px rgba(0,0,0,0.1)' }}>
            {/* Search icon */}
            <span style={{ padding:'0 12px', fontSize:16, opacity:0.6 }}>🔍</span>

            <input
              ref={inputRef}
              className="magic-search-input"
              value={query}
              onChange={e => handleChange(e.target.value)}
              placeholder={`Search by name — e.g. ${names[0] || 'Chisom'}…`}
              style={{
                flex:1, border:'none', background:'transparent',
                fontSize:15, fontWeight:500, color:'#1a1a2e',
                padding:'12px 0', fontFamily:'inherit',
              }}
            />

            {/* Result badge */}
            {resultCount !== null && (
              <div style={{
                padding:'4px 10px', borderRadius:20, marginRight:6, flexShrink:0,
                background: resultCount > 0 ? design.accent : '#EF4444',
                color:'#fff', fontSize:11, fontWeight:800,
                animation: resultCount > 0 ? 'sparkle-pop .4s cubic-bezier(.34,1.56,.64,1) forwards, none .4s' : 'none',
              }}>
                {resultCount > 0 ? `✨ ${resultCount} found` : '0 found'}
              </div>
            )}

            {/* Clear / close */}
            {query && (
              <button onClick={() => { setQuery(''); setResultCount(null); inputRef.current?.focus(); }}
                style={{ padding:'8px', background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:16, borderRadius:8, flexShrink:0 }}>
                ✕
              </button>
            )}
            <button onClick={handleClose}
              style={{ padding:'8px 12px', background:'none', border:'none', cursor:'pointer', color: design.accent, fontSize:12, fontWeight:700, borderRadius:8, flexShrink:0, whiteSpace:'nowrap' }}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


const CALLI_FONTS = [
  'font-dancing','font-vibes','font-satisfy','font-sacramento',
  'font-kaushan','font-pinyon','font-alex','font-allura',
];

// ── Infinite Confetti — runs forever, never stops ────────────────────────────
function Confetti() {
  // 50 pieces with varied shapes, colours, speeds — infinite loop
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left:     Math.random() * 100,
    size:     6 + Math.random() * 10,
    color:    ['#7C3AED','#EC4899','#FBBF24','#34D399','#60A5FA','#F97316','#EF4444','#A855F7','#06B6D4','#84CC16'][i % 10],
    duration: 4 + Math.random() * 6,   // 4–10 s per loop
    delay:    -(Math.random() * 10),    // negative delay = starts mid-fall immediately
    rotate:   Math.random() * 360,
    shape:    i % 4, // 0=circle, 1=square, 2=diamond, 3=star-ish
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9 }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left:     `${p.left}%`,
          top:      '-24px',
          width:    p.size,
          height:   p.size,
          background: p.color,
          borderRadius: p.shape === 0 ? '50%'
                      : p.shape === 1 ? '2px'
                      : p.shape === 2 ? '0'
                      : '50% 0 50% 0',
          transform: `rotate(${p.rotate}deg)`,
          animation: `cv-fall ${p.duration}s ${p.delay}s infinite linear`,
          opacity: 0.85,
        }} />
      ))}
      <style>{`
        @keyframes cv-fall {
          0%   { transform: translateY(-24px) rotate(0deg)   scaleX(1);   opacity: 1; }
          50%  { transform: translateY(50vh)  rotate(360deg) scaleX(-1);  opacity: 0.9; }
          100% { transform: translateY(112vh) rotate(720deg) scaleX(1);   opacity: 0; }
        }
        @keyframes msg-found {
          0%   { transform: scale(1);    box-shadow: 0 0 0 0 rgba(168,85,247,0); }
          40%  { transform: scale(1.03); box-shadow: 0 0 0 6px rgba(168,85,247,0.3); }
          100% { transform: scale(1);    box-shadow: 0 0 0 3px rgba(168,85,247,0.15); }
        }
      `}</style>
    </div>
  );
}

// ── Soft Music Player — plays a 30s gentle instrumental on page open ─────────
// Uses the Web Audio API to synthesise a soft, warm piano-like melody so there
// are no external audio files to load and no copyright concerns.
function MusicPlayer() {
  const [playing,  setPlaying]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [visible,  setVisible]  = useState(true);
  const [progress, setProgress] = useState(0);
  const ctxRef   = useRef(null);
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const DURATION = 32;

  // Dreamy romantic melody in D major — chord progression D-Bm-G-A
  // Four layered voices: melody (sine+triangle), warm pad, deep bass, shimmer
  const MELODY = [
    [587.33,0.0,1.0,0.18],[523.25,1.0,0.5,0.15],[587.33,1.5,0.5,0.16],
    [659.25,2.0,1.2,0.20],[587.33,3.2,0.8,0.18],[493.88,4.0,1.0,0.17],
    [440.00,5.0,0.6,0.16],[493.88,5.6,0.6,0.17],[523.25,6.2,1.8,0.19],
    [440.00,8.0,0.6,0.16],[493.88,8.6,0.6,0.17],[523.25,9.2,0.8,0.18],
    [587.33,10.0,0.8,0.20],[659.25,10.8,1.2,0.22],[739.99,12.0,0.6,0.20],
    [659.25,12.6,0.6,0.19],[587.33,13.2,0.8,0.18],[523.25,14.0,2.0,0.20],
    [493.88,16.0,1.0,0.18],[440.00,17.0,0.5,0.16],[369.99,17.5,0.5,0.15],
    [440.00,18.0,1.0,0.17],[493.88,19.0,0.8,0.18],[523.25,19.8,0.8,0.19],
    [587.33,20.6,1.4,0.21],[523.25,22.0,0.6,0.18],[493.88,22.6,1.4,0.17],
    [440.00,24.0,0.8,0.18],[493.88,24.8,0.8,0.19],[523.25,25.6,0.8,0.20],
    [587.33,26.4,1.2,0.21],[659.25,27.6,0.8,0.19],[587.33,28.4,0.6,0.18],
    [523.25,29.0,0.6,0.17],[587.33,29.6,2.4,0.15],
  ];
  // No pad layer — removed the chord block that caused the organ/chord sound.
  // The melody + bass + shimmer alone create a clean, warm piano feel.
  const PAD = [];
  const BASS = [
    [73.42,0.0,3.8,0.07],[61.74,4.0,3.8,0.06],[49.00,8.0,3.8,0.06],[55.00,12.0,3.8,0.07],
    [73.42,16.0,3.8,0.07],[61.74,20.0,3.8,0.06],[49.00,24.0,3.8,0.06],[55.00,28.0,3.8,0.05],
  ];
  const SHIMMER = [
    [1174.7,0.0,0.3,0.04],[1174.7,2.0,0.3,0.04],[1174.7,4.0,0.3,0.04],[1318.5,6.0,0.3,0.04],
    [1174.7,8.0,0.3,0.04],[1318.5,10.0,0.3,0.04],[1174.7,12.0,0.3,0.04],[1174.7,14.0,0.3,0.04],
    [1174.7,16.0,0.3,0.04],[1318.5,18.0,0.3,0.04],[1174.7,20.0,0.3,0.04],[1174.7,22.0,0.3,0.04],
    [1174.7,24.0,0.3,0.04],[1318.5,26.0,0.3,0.04],[1174.7,28.0,0.3,0.04],[1174.7,30.0,0.3,0.03],
  ];

  // Synthesizes one note with a warm, piano/music-box-like timbre instead of
  // a pure sine tone. A single sine oscillator has zero overtones, which is
  // exactly what makes a breath-blown instrument like a recorder or flute
  // sound — airy and whistly. Real plucked/struck instruments (piano, harp,
  // music box) are bright at the very start (the "attack") and are built from
  // several harmonics (the fundamental frequency plus quieter multiples of it),
  // which is what actually reads as "warm" rather than "thin and breathy".
  function schedNote(ctx, master, freq, start, dur, vol, _type, _detune) {
    const t0 = ctx.currentTime + start;

    // A small lowpass + slight body resonance shapes the tone without making
    // it sound like a flute (a narrow, fixed-frequency filter is what gives
    // a windy/breathy character).
    const toneShaper = ctx.createBiquadFilter();
    toneShaper.type = 'lowpass';
    toneShaper.frequency.value = Math.min(8000, freq * 7);
    toneShaper.Q.value = 0.3;
    toneShaper.connect(master);

    // Harmonic stack: fundamental (strongest) + 2nd/3rd/4th partials (quieter,
    // decaying faster than the fundamental) — this combination is what the
    // ear recognises as a plucked/struck "piano-like" tone rather than a
    // single pure whistle tone.
    const harmonics = [
      { mult: 1, gain: 1.00, decayMul: 1.00 },
      { mult: 2, gain: 0.28, decayMul: 0.55 },
      { mult: 3, gain: 0.12, decayMul: 0.40 },
      { mult: 4, gain: 0.05, decayMul: 0.30 },
    ];

    harmonics.forEach(({ mult, gain, decayMul }) => {
      const osc = ctx.createOscillator();
      const gn  = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq * mult;
      osc.connect(gn);
      gn.connect(toneShaper);

      const noteVol  = vol * gain;
      const noteDur  = dur * decayMul + 0.05;

      // Percussive attack: a fast 8ms rise (not the soft 60ms fade that reads
      // as a breath instrument starting), then an exponential decay — the
      // same envelope shape a piano hammer or plucked string naturally has.
      gn.gain.setValueAtTime(0, t0);
      gn.gain.linearRampToValueAtTime(noteVol, t0 + 0.008);
      gn.gain.exponentialRampToValueAtTime(Math.max(noteVol * 0.001, 0.0001), t0 + noteDur);

      osc.start(t0);
      osc.stop(t0 + noteDur + 0.05);
    });
  }

  const startMusic = () => {
    if (done) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    ctxRef.current = ctx;
    const master = ctx.createGain();
    master.connect(ctx.destination);
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(1, ctx.currentTime + 2);
    master.gain.setValueAtTime(1, ctx.currentTime + DURATION - 3);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + DURATION);
    MELODY.forEach(([f,s,d,v]) => schedNote(ctx,master,f,s,d,v));
    PAD.forEach(([f,s,d,v])    => schedNote(ctx,master,f,s,d,v));
    BASS.forEach(([f,s,d,v])   => schedNote(ctx,master,f,s,d,v));
    SHIMMER.forEach(([f,s,d,v])=> schedNote(ctx,master,f,s,d,v));
    setPlaying(true);
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const el = (Date.now() - startRef.current) / 1000;
      setProgress(Math.min(100, (el / DURATION) * 100));
      if (el >= DURATION) { clearInterval(timerRef.current); setPlaying(false); setDone(true); setTimeout(() => setVisible(false), 3000); }
    }, 250);
  };

  const stopMusic = () => {
    if (ctxRef.current) { ctxRef.current.close().catch(() => {}); ctxRef.current = null; }
    clearInterval(timerRef.current);
    setPlaying(false); setDone(true);
    setTimeout(() => setVisible(false), 2000);
  };

  useEffect(() => {
    const t = setTimeout(() => startMusic(), 1000);
    return () => { clearTimeout(t); clearInterval(timerRef.current); if (ctxRef.current) ctxRef.current.close().catch(() => {}); };
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position:'fixed', bottom:24, right:20, zIndex:9999,
      background:'linear-gradient(135deg,rgba(124,58,237,0.95),rgba(236,72,153,0.90))',
      backdropFilter:'blur(16px)', borderRadius:22, padding:'11px 16px',
      boxShadow:'0 8px 40px rgba(124,58,237,0.4),0 2px 8px rgba(0,0,0,0.15)',
      display:'flex', alignItems:'center', gap:11, minWidth:230,
      border:'1px solid rgba(255,255,255,0.25)',
      animation:'music-slide-in 0.6s cubic-bezier(.22,1,.36,1)',
    }}>
      <style>{`
        @keyframes music-slide-in { from{transform:translateY(80px) scale(0.9);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
        @keyframes music-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.18)} }
        @keyframes music-wave { 0%,100%{height:5px} 25%{height:15px} 50%{height:9px} 75%{height:18px} }
      `}</style>
      <div style={{ width:38,height:38,borderRadius:'50%',background:'rgba(255,255,255,0.22)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0,animation:playing?'music-pulse 1.4s ease infinite':'none' }}>
        {done?'♥':'🎵'}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p style={{color:'white',fontSize:11,fontWeight:700,margin:'0 0 2px',letterSpacing:'0.06em',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
          {done?'♥ Sent with love':playing?'A melody just for you…':'Welcome ♥'}
        </p>
        {playing&&!done&&(
          <div style={{display:'flex',alignItems:'flex-end',gap:2.5,height:20}}>
            {[0,1,2,3,4,5,6,7].map(i=>(
              <div key={i} style={{width:3,borderRadius:2,background:'rgba(255,255,255,0.75)',animation:`music-wave ${0.55+i*0.1}s ${i*0.07}s ease infinite`}}/>
            ))}
          </div>
        )}
        {!done&&(
          <div style={{marginTop:playing?3:5,height:3,background:'rgba(255,255,255,0.2)',borderRadius:2,overflow:'hidden'}}>
            <div style={{height:'100%',background:'#FBBF24',borderRadius:2,width:`${progress}%`,transition:'width 0.25s linear'}}/>
          </div>
        )}
      </div>
      {!done&&<button onClick={stopMusic} style={{background:'rgba(255,255,255,0.18)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:10,color:'white',fontSize:12,fontWeight:600,padding:'5px 10px',cursor:'pointer',flexShrink:0}}>✕</button>}
    </div>
  );
}

// ── Gift Claim Panel — Bank Transfer (FLW) or Gift Card (Reloadly) ───────────
const GiftClaimPanel = ({ slug, token, amount, user, member, onWithdrawn }) => {
  const [step,        setStep]        = useState('choose');   // choose | bank | giftcard | loading | done
  const [accounts,    setAccounts]    = useState(null);
  const [products,    setProducts]    = useState(null);
  const [selectedProd,setSelectedProd]= useState(null);
  const [country,     setCountry]     = useState('NG');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [recipEmail,  setRecipEmail]  = useState(user?.email || member?.email || '');
  const [busy,        setBusy]        = useState(false);
  const [result,      setResult]      = useState(null);

  const fee     = Math.round(amount * 0.035);
  const net     = amount - fee;
  const isVerified = user ? user.is_verified !== false : true;

  // The card itself can be viewed via the access_token alone, with no login
  // required — but every action behind the withdraw flow (saving a bank
  // account, verifying it, requesting the transfer) requires a real user or
  // member session. Without this check, someone who opens their birthday
  // card link from email while logged out would see the full withdraw UI,
  // click through it, and hit a confusing generic "failed" error at the very
  // last step with no indication that logging in was the actual problem.
  if (!user && !member) {
    const returnTo = `/card/${slug}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    return (
      <div className="text-center py-2 space-y-3">
        <div className="text-4xl">🔒</div>
        <p className="font-bold text-warm-900 text-base">Log in to claim your gift</p>
        <p className="text-sm text-warm-600 px-2">
          You're viewing this with your private link, but you'll need to sign in to add a bank account and withdraw {formatNGN(net)}.
        </p>
        <div className="flex flex-col gap-2 pt-1">
          <Link to={`/login?returnTo=${encodeURIComponent(returnTo)}`}
            className="btn-primary text-sm py-3 w-full text-center">
            Log in as an individual user
          </Link>
          <Link to={`/member/login?returnTo=${encodeURIComponent(returnTo)}`}
            className="btn-secondary text-sm py-3 w-full text-center">
            Log in as a team member
          </Link>
        </div>
        <p className="text-xs text-warm-400 pt-1">Not sure which one? Use whichever account you signed up with — your gift will still be here.</p>
      </div>
    );
  }

  const COUNTRIES = [
    { code:'NG', label:'🇳🇬 Nigeria (NGN)', currency:'NGN' },
    { code:'GB', label:'🇬🇧 United Kingdom (GBP)', currency:'GBP' },
    { code:'US', label:'🇺🇸 United States (USD)', currency:'USD' },
  ];

  const loadBankAccounts = async () => {
    if (!isVerified) {
      toast.error('Please verify your email before withdrawing. Check your inbox.', { duration: 8000 });
      return;
    }
    setBusy(true);
    try {
      const r = await banksAPI.getMy();
      setAccounts(r.data || []);
    } catch { setAccounts([]); }
    finally { setBusy(false); setStep('bank'); }
  };

  const loadGiftCards = async (countryCode) => {
    setBusy(true);
    try {
      const cur = COUNTRIES.find(c => c.code === countryCode)?.currency || 'NGN';
      const r = await giftcardsAPI.getProducts(countryCode, cur);
      setProducts(r.data.products || []);
    } catch { setProducts([]); }
    finally { setBusy(false); setStep('giftcard'); }
  };

  const handleBankTransfer = async () => {
    const acc = accounts?.find(a => a.is_default) || accounts?.[0];
    if (!acc) {
      toast.error('Add your bank account in Settings first.', { duration: 6000 });
      return;
    }
    setBusy(true);
    setStep('loading');
    try {
      const res = await banksAPI.withdrawGift({ card_slug: slug, access_token: token });
      setResult({ type: 'transfer', message: res.data.message, amount: res.data.amount, fee: res.data.fee });
      setStep('done');
      if (onWithdrawn) onWithdrawn(); // tell parent to re-fetch card state
    } catch (err) {
      toast.error(err.response?.data?.error || 'Transfer failed. Please try again.');
      setStep('bank');
    } finally { setBusy(false); }
  };

  const handleGiftCardOrder = async () => {
    if (!selectedProd) { toast.error('Select a gift card first.'); return; }
    setBusy(true);
    setStep('loading');
    try {
      const payload = {
        card_slug:       slug,
        product_id:      selectedProd.id,
        amount:          amount,
        recipient_email: recipEmail,
        access_token:    token,
        ...(selectedProd.id.includes('AIRTIME') ? { phone_number: phoneNumber } : {}),
      };
      const res = await giftcardsAPI.order(payload);
      setResult({
        type: 'giftcard',
        message: res.data.message,
        product: res.data.product_name,
        redemptionCode: res.data.redemption_code,
        redeemUrl: res.data.redeem_url,
      });
      setStep('done');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gift card order failed. Please try bank transfer instead.');
      setStep('giftcard');
    } finally { setBusy(false); }
  };

  if (step === 'loading') return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"/>
      <p className="text-sm font-medium text-warm-700">Processing your claim…</p>
    </div>
  );

  if (step === 'done') return (
    <div className="text-center py-4 space-y-3">
      <div className="text-5xl">🎉</div>
      <p className="font-bold text-warm-900 text-base">{result?.type === 'transfer' ? 'Money on its way!' : 'Gift card sent!'}</p>
      <p className="text-sm text-warm-600">{result?.message}</p>
      {result?.type === 'transfer' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-warm-600 space-y-1">
          <div className="flex justify-between"><span>Gift pot</span><span>{formatNGN(amount)}</span></div>
          <div className="flex justify-between"><span>Platform fee (3.5%)</span><span>-{formatNGN(result.fee)}</span></div>
          <div className="flex justify-between font-bold text-warm-900"><span>You receive</span><span>{formatNGN(result.amount)}</span></div>
        </div>
      )}
      {result?.type === 'giftcard' && result?.redemptionCode && (
        <div className="bg-primary-50 border-2 border-dashed border-primary-200 rounded-xl p-4 text-left">
          <p className="text-[11px] uppercase tracking-wide text-warm-400 font-bold mb-1">Your redemption code</p>
          <div className="flex items-center gap-2">
            <p className="font-mono font-extrabold text-base text-warm-900 break-all flex-1">{result.redemptionCode}</p>
            <button type="button"
              onClick={() => { navigator.clipboard.writeText(result.redemptionCode); toast.success('Code copied!'); }}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-600 text-white hover:bg-primary-700">
              Copy
            </button>
          </div>
          <p className="text-xs text-warm-500 mt-2">Save this code now — keep it safe like cash. We've also emailed it to you.</p>
          {result.redeemUrl && (
            <a href={result.redeemUrl} target="_blank" rel="noopener noreferrer"
              className="mt-3 block w-full text-center py-2.5 rounded-xl text-sm font-bold bg-warm-900 text-white">
              Redeem on {result.product} →
            </a>
          )}
        </div>
      )}
      {result?.type === 'giftcard' && !result?.redemptionCode && (
        <p className="text-xs text-warm-500">Check your email — your code is on its way and may take a few minutes to arrive.</p>
      )}
      <p className="text-xs text-warm-400">Usually arrives within 1–3 minutes</p>
    </div>
  );

  // ── Step 1: Choose method ───────────────────────────────────────────────
  if (step === 'choose') return (
    <div className="space-y-3">
      <p className="text-xs text-warm-500 text-center mb-1">How would you like to receive your {formatNGN(net)}?</p>
      <p className="text-xs text-warm-400 text-center -mt-2 mb-2">(After 3.5% platform fee on {formatNGN(amount)})</p>

      <button onClick={loadBankAccounts} disabled={busy}
        className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-all text-left">
        <span className="text-2xl">🏦</span>
        <div className="flex-1">
          <p className="font-bold text-sm text-warm-900">Bank Transfer</p>
          <p className="text-xs text-warm-500">Straight to your Nigerian bank account · Usually 1–3 mins</p>
        </div>
        <span className="text-warm-400">→</span>
      </button>

      <button onClick={() => { setCountry('NG'); loadGiftCards('NG'); }} disabled={busy}
        className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-primary-200 bg-primary-50 hover:bg-primary-100 transition-all text-left">
        <span className="text-2xl">🎁</span>
        <div className="flex-1">
          <p className="font-bold text-sm text-warm-900">Gift Card or Airtime</p>
          <p className="text-xs text-warm-500">Amazon, iTunes, Netflix, MTN Airtime, Jumia & more · Nigeria, UK, US</p>
        </div>
        <span className="text-warm-400">→</span>
      </button>
    </div>
  );

  // ── Step 2a: Bank transfer confirmation ────────────────────────────────
  if (step === 'bank') return (
    <div className="space-y-3">
      <button onClick={() => setStep('choose')} className="text-xs text-warm-400 hover:text-warm-700 flex items-center gap-1">← Back</button>
      <p className="font-semibold text-sm text-warm-900">Withdraw to bank account</p>
      {!accounts?.length ? (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs font-bold text-amber-800 mb-1">⚠️ No bank account saved yet</p>
            <p className="text-xs text-amber-700">Add your bank details below — only takes a moment, and you can withdraw right after.</p>
          </div>
          <BankAccountTab compact onSaved={(updated) => setAccounts(updated)} />
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map(acc => (
            <div key={acc.id} className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
              <span className="text-xl">🏦</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-warm-900 truncate">{acc.account_name}</p>
                <p className="text-xs text-warm-500">{acc.bank_name} · ****{acc.account_number?.slice(-4)}</p>
              </div>
            </div>
          ))}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs space-y-1 text-warm-600">
            <div className="flex justify-between"><span>Gift pot</span><span>{formatNGN(amount)}</span></div>
            <div className="flex justify-between"><span>Platform fee (3.5%)</span><span>-{formatNGN(fee)}</span></div>
            <div className="flex justify-between font-bold text-warm-900 pt-1 border-t border-gray-200"><span>You receive (est.)</span><span>{formatNGN(net)}</span></div>
            <p className="text-warm-400 text-center pt-1">Exact amount confirmed at transfer</p>
          </div>
          <button onClick={handleBankTransfer} disabled={busy}
            className="btn-primary w-full text-sm py-3">
            💸 Withdraw {formatNGN(net)} now
          </button>
        </div>
      )}
    </div>
  );

  // ── Step 2b: Gift card selection ───────────────────────────────────────
  if (step === 'giftcard') return (
    <div className="space-y-3">
      <button onClick={() => setStep('choose')} className="text-xs text-warm-400 hover:text-warm-700 flex items-center gap-1">← Back</button>
      <p className="font-semibold text-sm text-warm-900">Choose a gift card</p>

      {/* Country selector */}
      <div className="flex gap-1 flex-wrap">
        {COUNTRIES.map(c => (
          <button key={c.code} onClick={() => { setCountry(c.code); setSelectedProd(null); loadGiftCards(c.code); }}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
              country === c.code ? 'bg-primary-500 text-white' : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
            }`}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Product grid */}
      {busy ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
          {(products || []).map(p => (
            <button key={p.id} onClick={() => setSelectedProd(p)}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-center transition-all ${
                selectedProd?.id === p.id
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-gray-100 bg-white hover:border-primary-200'
              }`}>
              <span className="text-2xl">{p.icon}</span>
              <p className="text-xs font-semibold text-warm-900 leading-tight">{p.name}</p>
            </button>
          ))}
        </div>
      )}

      {/* Phone number for airtime */}
      {selectedProd?.id?.includes('AIRTIME') && (
        <div>
          <label className="text-xs font-semibold text-warm-700 block mb-1">Phone number to top up</label>
          <input type="tel" placeholder="e.g. 08012345678" value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            className="input text-sm py-2.5 w-full"/>
        </div>
      )}

      {/* Recipient email */}
      {selectedProd && !selectedProd.id.includes('AIRTIME') && (
        <div>
          <label className="text-xs font-semibold text-warm-700 block mb-1">Send code to email</label>
          <input type="email" placeholder="your@email.com" value={recipEmail}
            onChange={e => setRecipEmail(e.target.value)}
            className="input text-sm py-2.5 w-full"/>
        </div>
      )}

      {selectedProd && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-2.5">
          <p className="text-xs text-primary-700">{selectedProd.note}</p>
        </div>
      )}

      <button onClick={handleGiftCardOrder}
        disabled={busy || !selectedProd || (selectedProd.id.includes('AIRTIME') && !phoneNumber) || (!selectedProd.id.includes('AIRTIME') && !recipEmail)}
        className="btn-primary w-full text-sm py-3 disabled:opacity-50">
        {busy ? 'Processing…' : `🎁 Claim ${formatNGN(net)} as ${selectedProd?.name || 'gift card'}`}
      </button>
      <p className="text-xs text-warm-400 text-center">Gift card code is delivered instantly to your email</p>
    </div>
  );

  return null;
};

const occasionLabel = {
  birthday: 'Birthday', valentine: "Valentine's Day", valentines_day: "Valentine's Day",
  leaving: 'Farewell', anniversary: 'Anniversary', work_anniversary: 'Work Anniversary',
  wedding: 'Wedding', baby_shower: 'Baby Shower', new_baby: 'New Baby',
  retirement: 'Retirement', congratulations: 'Congratulations', graduation: 'Graduation',
  promotion: 'Promotion', christmas: 'Christmas', get_well: 'Get Well Soon',
  new_year: 'New Year', workers_day: "Workers' Day", womens_day: "Women's Day",
  mens_day: "Men's Day", new_hire: 'Welcome', other: 'Special Day',
};

const MediaCarousel = ({ items, large = false }) => {
  const [idx, setIdx] = useState(0);
  if (!items || items.length === 0) return null;
  const item = items[idx];
  // Card media: tall enough to look good, object-cover fills every pixel
  const containerStyle = large ? {} : { height: '260px', background: '#111' };
  return (
    <div className="relative overflow-hidden" style={containerStyle}>
      {item.media_type === 'video' && (
        <video src={item.media_url} controls
          className={large ? 'w-full max-h-[70vh]' : 'w-full h-full object-cover'} />
      )}
      {item.media_type === 'voice' && (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-white/10 p-4" style={{ minHeight: '100px' }}>
          <span className="text-4xl">🎧</span>
          <audio src={item.media_url} controls className="w-full max-w-xs" />
        </div>
      )}
      {(!item.media_type || item.media_type === 'image' || item.media_type === 'gif') && (
        <img src={item.media_url} alt=""
          className={large ? 'w-full max-h-[70vh] object-contain' : 'w-full h-full object-cover'}
          style={large ? {} : { display: 'block' }} />
      )}
      {items.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + items.length) % items.length); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-black/80 transition-colors">‹</button>
          <button onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % items.length); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-black/80 transition-colors">›</button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {items.map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full transition-all" style={{ background: i === idx ? '#fff' : 'rgba(255,255,255,0.45)' }} />)}
          </div>
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full font-medium">{idx + 1}/{items.length}</div>
        </>
      )}
    </div>
  );
};

const Media = ({ message, large = false }) => {
  const items = [];
  if (message.media_url) items.push({ media_url: message.media_url, media_type: message.media_type });
  if (message.media_gallery) {
    try {
      const g = typeof message.media_gallery === 'string' ? JSON.parse(message.media_gallery) : message.media_gallery;
      if (Array.isArray(g)) items.push(...g);
    } catch {}
  }
  return <MediaCarousel items={items} large={large} />;
};

const MessageCard = ({ message, index, design, canViewPrivate, onOpen, onReact, highlighted }) => {
  const [reacted, setReacted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const font = getFontStyle(message.font_style);
  const hasMedia = !!(message.media_url || message.media_gallery);
  const isLong = (message.content?.length || 0) > 320;
  const preview = isLong ? message.content.slice(0, 320).trimEnd() + '…' : message.content;
  const rotation = index % 3 === 0 ? '-.45deg' : index % 3 === 1 ? '.35deg' : '-.15deg';
  const calliFont = CALLI_FONTS[index % CALLI_FONTS.length];

  const giftBadge = () => {
    if (message.gift_type === 'product' && message.product_name) {
      return (
        <a href={`/c/${message.product_vendor_slug || '#'}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/75 border border-white hover:bg-white transition-colors"
          style={{ color: design.accent }} title={`View ${message.product_vendor_name || 'vendor'} store`}>
          🎂 {message.product_name}
        </a>
      );
    }
    if (message.contributed_amount > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/75 border border-white" style={{ color: design.accent }}>
          🎁 {formatNGN(message.contributed_amount)}
        </span>
      );
    }
    return null;
  };

  return (
    <article
      className={`message-art-card card-art ${cardArtClass(design)} rounded-[1.75rem] border-2 flex flex-col relative`}
      style={{
        background: design.background, color: design.ink,
        borderColor: highlighted ? design.accent : `${design.accent}40`,
        boxShadow: highlighted ? `0 0 0 3px ${design.accent}, 0 6px 28px ${design.accent}44` : undefined,
        transition: 'box-shadow .35s ease, border-color .35s ease, transform .35s ease',
        transform: highlighted ? 'scale(1.01)' : undefined,
        overflowY: 'auto',
        minHeight: '200px',
      }}
    >
      {/* Decorative quote mark */}
      <div className="absolute top-1 left-3 text-5xl leading-none pointer-events-none select-none font-serif opacity-15" style={{ color: design.accent }}>"</div>

      {/* ── 1. Author row (avatar, name, date) ── */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2 flex-shrink-0 relative z-10">
        <div className="w-9 h-9 rounded-full grid place-items-center text-xs font-extrabold bg-white/80 shadow-sm flex-shrink-0" style={{ color: design.accent }}>
          {message.author_name?.slice(0, 2).toUpperCase() || '??'}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`font-bold truncate text-base ${calliFont}`} style={{ color: design.ink }}>{message.author_name}</p>
          <p className="text-[11px] opacity-60" style={{ color: design.ink }}>{message.created_at ? format(new Date(message.created_at), 'MMM d, yyyy') : ''}</p>
        </div>
        {message.is_private && canViewPrivate && <span title="Private message" className="text-base flex-shrink-0">🔒</span>}
      </div>

      {/* ── 2. Media full-width below author, above text (Instagram style) ── */}
      {hasMedia && (
        <button type="button" onClick={() => onOpen(message)} className="w-full block flex-shrink-0">
          <Media message={message} />
        </button>
      )}

      {/* ── 3. Text message below media ── */}
      <div className="px-5 pt-4 pb-2 relative z-10">
        {hasMedia ? (
          // Media present: keep the compact clamp + open the modal for the full view
          <button type="button" onClick={() => onOpen(message)} className="text-left w-full">
            <p
              style={{
                color: design.ink,
                fontFamily: font.family,
                fontSize: message.font_style === 'calligraphy' ? '1.6rem' : message.font_style === 'handwritten' ? '1.3rem' : '1.1rem',
                lineHeight: message.font_style === 'calligraphy' ? 1.5 : 1.65,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                wordBreak: 'break-word',
              }}
            >
              {message.content}
            </p>
            {isLong && (
              <span className="inline-block mt-1 text-xs font-extrabold underline underline-offset-2 opacity-70" style={{ color: design.accent }}>
                see more ↗
              </span>
            )}
          </button>
        ) : (
          // No media: inline expand/collapse like the Sample card
          <div className="text-left w-full">
            <p
              className="whitespace-pre-wrap break-words"
              style={{
                color: design.ink,
                fontFamily: font.family,
                fontSize: message.font_style === 'calligraphy' ? '1.6rem' : message.font_style === 'handwritten' ? '1.3rem' : '1.1rem',
                lineHeight: message.font_style === 'calligraphy' ? 1.5 : 1.65,
              }}
            >
              {expanded ? message.content : preview}
            </p>
            {isLong && (
              <button type="button" onClick={() => setExpanded(e => !e)}
                className="inline-block mt-1 text-xs font-extrabold underline underline-offset-2 opacity-70" style={{ color: design.accent }}>
                {expanded ? 'Show less ↑' : 'Read more →'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 4. Gift badge + reaction at bottom ── */}
      <div className="px-4 pb-4 pt-2 flex items-center justify-between flex-shrink-0 relative z-10">
        <button
          type="button"
          onClick={async () => {
            if (reacted) return;
            setReacted(true);
            await onReact(message.id).catch(() => {});
          }}
          className="rounded-full bg-white/75 px-3 py-1.5 text-xs font-bold shadow-sm"
          style={{ color: reacted ? '#e11d48' : design.ink }}
        >
          ❤️ {(message.reactions?.heart || 0) + (reacted ? 1 : 0)}
        </button>
        {giftBadge()}
      </div>
    </article>
  );
};

const TransferCardButton = ({ slug }) => {
  const [open, setOpen]           = useState(false);
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState([]);
  const [searching, setSearching] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const debounceRef = useRef(null);

  // Debounced search — prevents rapid re-renders resetting the input
  const handleQueryChange = (value) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) { setResults([]); return; }
    // Use smart token — works for both individual users AND team members
    // NEVER use api (user-only) here as it causes 401 + full-page redirect for members
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const tok = localStorage.getItem('thankeeu_member_token') || localStorage.getItem('thankeeu_token');
        const base = import.meta.env.VITE_API_URL || '/api';
        const r = await fetch(`${base}/auth/search?q=${encodeURIComponent(value.trim())}`, {
          headers: tok ? { Authorization: `Bearer ${tok}` } : {},
        });
        const data = await r.json();
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const transfer = async (username) => {
    setTransferring(true);
    try {
      const tok = localStorage.getItem('thankeeu_member_token') || localStorage.getItem('thankeeu_token');
      const base2 = import.meta.env.VITE_API_URL || '/api';
      const tr = await fetch(`${base2}/dashboard/transfer-card`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_slug: slug, recipient_username: username })
      });
      if (!tr.ok) { const e = await tr.json(); throw new Error(e.error || 'Transfer failed'); }
      toast.success(`Card transferred to @${username}! 🎉`);
      setOpen(false);
      setQuery('');
      setResults([]);
    } catch (err) {
      toast.error(err.message || 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary text-sm">🎁 Transfer card</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg" style={{ fontFamily:'Space Grotesk,sans-serif' }}>Transfer card box</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Search for a Thankeeu user by username. The full card box will appear in their Received tab.</p>
            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
              <input className="input-light pl-7 w-full" placeholder="username" value={query}
                onChange={e => handleQueryChange(e.target.value)} autoFocus />
            </div>
            {searching && <p className="text-xs text-center text-gray-400 mb-2">Searching...</p>}
            {results.length > 0 && (
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                {results.map(u => (
                  <button key={u.id} onClick={() => transfer(u.username)} disabled={transferring}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border hover:bg-purple-50 text-left transition-all"
                    style={{ borderColor:'#EDE9FF' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background:'linear-gradient(135deg,#7C6EFF,#EC4899)', color:'#fff' }}>
                      {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full rounded-full object-cover" alt="" /> : u.full_name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{u.full_name}</p>
                      <p className="text-xs text-gray-400">@{u.username}</p>
                    </div>
                    <span className="ml-auto text-xs font-semibold" style={{ color:'#5B4BDF' }}>Transfer →</span>
                  </button>
                ))}
              </div>
            )}
            {query.length >= 2 && !searching && results.length === 0 && (
              <p className="text-xs text-center text-gray-400 mb-3">No users found for "@{query}"</p>
            )}
          </div>
        </div>
      )}
    </>
  );
};


const CardView = () => {
  const { slug } = useParams();
  const { user }    = useAuth();
  const { member }  = useMemberAuth();
  const { company } = useCompanyAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || sessionStorage.getItem(`card_token_${slug}`);
  // Persist access token for this card in sessionStorage so reply works even after navigation
  if (searchParams.get('token')) {
    sessionStorage.setItem(`card_token_${slug}`, searchParams.get('token'));
  }
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll,      setShowAll]      = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [openMessage, setOpenMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  useSEO({
    title: card ? `${card.recipient_name}'s ${occasionLabel[card.occasion] || ''} Card` : 'View Card - Thankeeu',
    description: card ? `A beautiful group card for ${card.recipient_name}.` : 'View a group card on Thankeeu.',
    noIndex: false,
  });

  const fetchCard = async (silent = false) => {
    try {
      const response = token
        ? await cardsAPI.getRecipient(slug, token)
        : user
        ? await cardsAPI.getOne(slug)
        : member
        ? await memberCardsAPI.getOne(slug)
        : company
        ? await cardsAPI.getOneAsCompany(slug)
        : await cardsAPI.getPublic(slug);
      setCard(response.data);
      // Track card opened — notifies creator via dashboard + email
      dashboardAPI.trackCardOpened(slug).catch(() => {});
    } catch (err) {
      if (!silent) toast.error(err.response?.data?.error || 'Card not found or not available');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCard();
    const refresh = () => fetchCard(true);
    const interval = window.setInterval(refresh, 10000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, [slug, token, user?.id, member?.id, company?.id]);

  useEffect(() => {
    const close = event => {
      if (event.key === 'Escape') setOpenMessage(null);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setReplyLoading(true);
    try {
      // Smart auth: use saved token if logged in, pass URL access_token as fallback
      const savedTok = localStorage.getItem('thankeeu_token') || localStorage.getItem('thankeeu_member_token');
      const base = import.meta.env.VITE_API_URL || '/api';
      const url = `${base}/messages/${slug}/reply${token && !savedTok ? `?access_token=${token}` : ''}`;
      const headers = { 'Content-Type': 'application/json' };
      if (savedTok) headers['Authorization'] = `Bearer ${savedTok}`;
      const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ content: replyText }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed to send');
      toast.success(`Your thank-you was sent to ${data.recipients || 'all'} signers! 💌`);
      setReplyText('');
    } catch (err) {
      toast.error(err.message || 'Failed to send reply');
    } finally {
      setReplyLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen grid place-items-center section-dots" style={{ background:'#F5F3FF' }}>
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-warm-500 text-lg">Opening your card...</p>
      </div>
    </div>
  );

  if (!card) return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">{'\uD83D\uDC8C'}</div>
        <h2 className="text-2xl text-warm-900">Card not found</h2>
      </div>
    </div>
  );

  const messages = card.messages || [];
  const filteredMessages = searchQuery.trim().length > 0
    ? messages.filter(m =>
        m.author_name?.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : messages;
  const displayMessages = searchQuery.trim().length > 0
    ? filteredMessages                              // show ALL matches when searching
    : showAll ? messages : messages.slice(0, 8);   // normal paginated view
  const totalCollected = card.total_collected || 0;
  const design = getCardDesign(card.design_theme);
  const titleFont = getFontStyle(card.font_style);
  const canViewPrivate = Boolean(token || card.isCreator || card.isRecipient);


  const cardTitle = card?.title || `${card?.recipient_name || ''}'s Card`;
  const layoutType = member ? 'member' : company ? 'company' : 'user';

  const content = (
    <div className="min-h-0 flex flex-col" style={{ background: design?.soft || design?.background?.includes?.("gradient") ? "#F5F0FF" : (design?.soft || "#F5F0FF") }}>
      <style>{FONT_INJECT}</style>
      {/* Confetti runs forever — never stops */}
      <Confetti />
      {/* Soft welcome music — auto-plays for 30s when recipient opens the card */}
      <MusicPlayer />

      {/* ── HERO BANNER — Sample-page style ───────────────────────── */}
      <header className="relative overflow-hidden" style={{ background: design.background, color: design.ink }}>
        {/* Decorative blurred circles */}
        <div style={{ position:'absolute', top:'-60px', right:'-60px', width:280, height:280, borderRadius:'50%', background:'rgba(255,255,255,0.08)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-40px', left:'-40px', width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'40%', left:'50%', transform:'translate(-50%,-50%)', width:340, height:340, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />

        <div className="relative max-w-5xl mx-auto px-4 py-14 sm:py-20 text-center" style={{ zIndex:1 }}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold tracking-widest uppercase mb-6"
            style={{ background:'rgba(255,255,255,0.18)', backdropFilter:'blur(8px)', color: design.dark ? 'rgba(255,255,255,0.9)' : design.accent, border:'1px solid rgba(255,255,255,0.25)' }}>
            ✨ A keepsake made with love
          </div>

          {/* Floating icon */}
          <div className="text-6xl sm:text-7xl mb-5 animate-float select-none">{design.icon}</div>

          {/* Big calligraphic title */}
          <h1 className="mb-3 px-2" style={{
            fontFamily: "'Great Vibes', cursive",
            fontSize: 'clamp(2.4rem, 8vw, 5rem)',
            lineHeight: 1.2,
            color: design.dark ? '#ffffff' : design.accent,
            textShadow: design.dark ? '0 2px 24px rgba(0,0,0,0.25)' : 'none',
          }}>
            {card.title || `Happy ${(card.occasion||'').replace(/_/g,' ')}, ${card.recipient_name}!`}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg max-w-xl mx-auto mb-7" style={{
            color: design.dark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.52)',
          }}>
            {messages.length} {messages.length === 1 ? 'person has' : 'people have'} filled this card with love, laughter and warmth just for you.
          </p>

          {/* Stat badges */}
          <div className="flex flex-wrap justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm"
              style={{ background:'rgba(255,255,255,0.82)', color: design.accent }}>
              💌 {messages.length} messages
            </span>
            {totalCollected > 0 && (
              <span className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm bg-emerald-600 text-white">
                🎁 {formatNGN(totalCollected)} gift
              </span>
            )}
            {card.send_date && (
              <span className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm"
                style={{ background:'rgba(255,255,255,0.82)', color: design.ink }}>
                📅 {format(new Date(card.send_date), 'MMMM d, yyyy')}
              </span>
            )}
          </div>

          {/* Signer avatar strip — up to 10 initials */}
          {messages.length > 0 && (
            <div className="flex justify-center mt-7" style={{ gap:'-8px' }}>
              <div style={{ display:'flex', marginLeft:0 }}>
                {messages.slice(0, 10).map((msg, i) => (
                  <div key={i} style={{
                    width:36, height:36, borderRadius:'50%',
                    background: design.accent, color:'#fff',
                    border:'2.5px solid rgba(255,255,255,0.7)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:11, fontWeight:800, flexShrink:0,
                    marginLeft: i === 0 ? 0 : -10, zIndex: 10-i,
                    boxShadow:'0 2px 8px rgba(0,0,0,0.15)',
                  }}>
                    {msg.author_name?.slice(0,2).toUpperCase()||'??'}
                  </div>
                ))}
                {messages.length > 10 && (
                  <div style={{
                    width:36, height:36, borderRadius:'50%',
                    background:'rgba(255,255,255,0.25)', color: design.dark?'#fff':design.accent,
                    border:'2.5px solid rgba(255,255,255,0.6)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:10, fontWeight:800, marginLeft:-10,
                    boxShadow:'0 2px 8px rgba(0,0,0,0.1)',
                  }}>
                    +{messages.length - 10}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10 sm:py-14">
        {totalCollected > 0 && (
          <section className="card-art card-art-sunburst rounded-[2rem] bg-gradient-to-br from-emerald-700 to-teal-900 text-white p-6 sm:p-8 mb-9 shadow-xl">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/15 rounded-2xl grid place-items-center text-3xl">{'\uD83C\uDF81'}</div>
                <div>
                  <p className="text-emerald-100 text-xs font-extrabold tracking-[.18em] uppercase">A gift from everyone</p>
                  <h2 className="text-2xl sm:text-3xl text-white mt-1">{formatNGN(totalCollected)}</h2>
                  <p className="text-emerald-100 text-sm">Attached to this card for {card.recipient_name}</p>
                </div>
              </div>

              {/* Only show withdraw if: user is the verified recipient (email match or received via transfer) */}
              {card.isRecipient && !card.gift_withdrawn && (
                <GiftClaimPanel
                  slug={slug} token={token} amount={totalCollected} onWithdrawn={fetchCard}
                  user={user} member={member}
                />
              )}
              {card.isRecipient && card.gift_withdrawn && (
                <span className="bg-white/15 rounded-full px-4 py-2 text-sm font-bold">✓ Gift withdrawn</span>
              )}
              {/* Show info to logged-in users whose email doesn't match — explain how to get access */}
              {!card.isRecipient && (user || member) && card.recipient_email && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 mt-2">
                  <p className="font-bold mb-1">🔒 You're viewing this card but you are not the recipient</p>
                  <p className="text-xs leading-relaxed mb-2">
                    This card was created for <strong>{card.recipient_name}</strong>.
                    To access the gift pot and full recipient features, you must be signed in with the email the card was sent to.
                  </p>
                  <p className="text-xs leading-relaxed">
                    If you are the recipient but used a different email, ask the card creator to <strong>transfer the card to your username</strong> using the Transfer button.
                    Once transferred, you'll see the gift pot and can withdraw to your bank account.
                  </p>
                </div>
              )}

              {!card.isRecipient && (user || member) && (
                <div className="bg-white/10 rounded-2xl p-3 text-xs text-emerald-100 max-w-xs">
                  💡 This gift pot is reserved for {card.recipient_name}. Only the recipient can withdraw it.
                  {!user && !member && ' Sign in with the recipient email to access it.'}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Share your card ──────────────────────────────────────────── */}
        <div className="no-print mb-9 space-y-3">
          {/* Box 1 — Public signing link — open while active AND after delivery (sent) */}
          {(card.status === 'active' || card.status === 'sent') && (
            <div className="rounded-2xl border-2 p-4 sm:p-5" style={{ borderColor: '#A855F740', background: 'linear-gradient(135deg,#F5F3FF,#FCE7F3)' }}>
              <p className="text-xs font-extrabold tracking-[.15em] uppercase text-primary-600 mb-1">
                {card.status === 'sent' ? '🎁 Still open — messages & gifts welcome' : '✍️ Signing link — for everyone'}
              </p>
              <p className="text-sm text-warm-600 mb-3">
                {card.status === 'sent'
                  ? `The card was delivered to ${card.recipient_name} but the signing link is still open — colleagues can still add a message or contribute a late gift.`
                  : 'This link lets anyone write a message on the card. Share it with colleagues, friends or family so they can add their wishes before delivery.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/sign/${slug}`); toast.success('✓ Signing link copied!'); }}
                  className="btn-primary text-sm"
                >
                  🔗 Copy signing link
                </button>
                <button
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Add your message to ${card.recipient_name}'s card: ${window.location.origin}/sign/${slug}`)}`, '_blank')}
                  className="px-5 py-3 rounded-2xl bg-[#25D366] text-white text-sm font-bold"
                >
                  Share on WhatsApp
                </button>
              </div>
            </div>
          )}

          {/* Box 2 — Private view link (recipient + creator only) */}
          {(canViewPrivate && (card.access_token || card.isCreator)) && (
            <div className="rounded-2xl border border-purple-100 bg-white p-4 sm:p-5">
              <p className="text-xs font-extrabold tracking-[.15em] uppercase text-warm-400 mb-1">👁 Private view link — for you and {card.recipient_name} only</p>
              <p className="text-sm text-warm-600 mb-3">
                This is the private card view link. Share it only with <strong>{card.recipient_name}</strong> so they can see all the messages and access any gift.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const url = card.access_token
                      ? `${window.location.origin}/card/${slug}?token=${card.access_token}`
                      : `${window.location.origin}/card/${slug}`;
                    navigator.clipboard.writeText(url);
                    toast.success('✓ Private link copied!');
                  }}
                  className="btn-secondary"
                >
                  Copy private link
                </button>
                <button onClick={() => window.print()} className="btn-secondary">Save or print</button>
                {card.isCreator && <TransferCardButton slug={slug} />}
              </div>
            </div>
          )}
        </div>

        <section>
          {/* ── Section header + magical search ── */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <span className="text-xs font-extrabold tracking-[.2em] uppercase text-primary-600">The message wall</span>
                <h2 className="text-3xl text-warm-900 mt-2">Words to keep forever</h2>
              </div>
              <span className="text-xs font-bold text-warm-400">{messages.length} notes</span>
            </div>

            {/* ── Magic Search Bar ── */}
            {messages.length > 2 && (
              <MagicSearch
                messages={messages}
                query={searchQuery}
                setQuery={setSearchQuery}
                active={searchActive}
                setActive={setSearchActive}
                design={design}
              />
            )}
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-[2rem]">
              <div className="text-5xl mb-3">{'\u2709\uFE0F'}</div>
              <p className="text-warm-500">The first beautiful message is on its way.</p>
            </div>
          ) : (
            <>
              {/* Search empty state */}
              {searchQuery.trim() && filteredMessages.length === 0 && (
                <div className="text-center py-14 rounded-3xl border-2 border-dashed"
                  style={{ borderColor: design.accent + '44', background: design.accent + '08' }}>
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="font-bold text-warm-700">No message from "{searchQuery}"</p>
                  <p className="text-sm text-warm-400 mt-1">Try a different name or check the spelling</p>
                  <button onClick={() => setSearchQuery('')}
                    className="mt-4 text-xs font-bold px-4 py-2 rounded-full"
                    style={{ background: design.accent, color: '#fff' }}>
                    Clear search
                  </button>
                </div>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
                {displayMessages.map((message, index) => (
                  <div key={message.id}
                    style={{
                      animation: searchQuery && filteredMessages.includes(message)
                        ? 'msg-found .5s ease forwards' : 'none',
                    }}>
                    <MessageCard
                      message={message}
                      index={index}
                      design={design}
                      canViewPrivate={canViewPrivate}
                      onOpen={setOpenMessage}
                      onReact={id => messagesAPI.react(id, { emoji: 'heart' })}
                      highlighted={!!searchQuery && filteredMessages.includes(message)}
                    />
                  </div>
                ))}
              </div>
              {messages.length > 8 && !showAll && !searchQuery.trim() && (
                <div className="text-center mt-8">
                  <button onClick={() => setShowAll(true)} className="btn-primary">See all {messages.length} messages</button>
                </div>
              )}
            </>
          )}
        </section>

        {(token || card.isRecipient) && (
          <section className="glass-panel rounded-[2rem] p-6 sm:p-8 mt-10">
            <h3 className="text-2xl text-warm-900 mb-2">💌 Send love back</h3>
            <p className="text-sm text-warm-500 mb-4">Write a thank-you note — it goes to everyone who signed your card.</p>
            <textarea className="input h-28 resize-none mb-3" placeholder="Write your heartfelt thank-you here..." value={replyText} onChange={event => setReplyText(event.target.value)} />
            <button onClick={handleReply} disabled={replyLoading || !replyText.trim()} className="btn-primary">
              {replyLoading
                ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Sending...</span>
                : '💌 Send thank-you to all signers'}
            </button>
          </section>
        )}
      </main>

      {openMessage && (
        <div className="message-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setOpenMessage(null)}>
          <div
            className={`card-art ${cardArtClass(design)} celebration-shell w-full max-w-2xl rounded-[2rem] p-6 sm:p-9 message-modal-inner`}
            style={{ background: design.background, color: design.ink, maxHeight: '90vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xl font-extrabold" style={{ color: design.ink }}>{openMessage.author_name}</p>
                <p className="text-xs opacity-60" style={{ color: design.ink }}>{format(new Date(openMessage.created_at), 'MMMM d, yyyy')}</p>
              </div>
              <button onClick={() => setOpenMessage(null)} className="w-10 h-10 rounded-full bg-white/80 font-bold" aria-label="Close">x</button>
            </div>
            <p
              className="whitespace-pre-wrap break-words mb-6"
              style={{
                color: design.ink,
                fontFamily: getFontStyle(openMessage.font_style).family,
                fontSize: openMessage.font_style === 'calligraphy' ? '2.1rem' : openMessage.font_style === 'handwritten' ? '1.65rem' : '1.1rem',
                lineHeight: 1.65,
              }}
            >
              {openMessage.content}
            </p>
            <Media message={openMessage} large />
            {openMessage.contributed_amount > 0 && (
              <div className="mt-5 bg-white/75 rounded-2xl px-4 py-3 flex justify-between font-bold" style={{ color: design.ink }}>
                <span>{'\uD83C\uDF81'} Gift attached to this message</span>
                <span style={{ color: design.accent }}>{formatNGN(openMessage.contributed_amount)}</span>
              </div>
            )}
          </div>
        </div>
      )}


    </div>
  );

  if (layoutType === 'member')  return <MemberLayout title={cardTitle} subtitle="Card view">{content}</MemberLayout>;
  if (layoutType === 'company') return <CompanyLayout title={cardTitle} subtitle="Card view">{content}</CompanyLayout>;
  return <DashboardLayout title={cardTitle} subtitle="Card view">{content}</DashboardLayout>;
};

export default CardView;
