import { useSEO } from '../hooks/useSEO';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { cardsAPI, memberCardsAPI, messagesAPI, dashboardAPI, authAPI, banksAPI, giftcardsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LiveMemoryWall from '../components/LiveMemoryWall';
import MemoryMoviePlayer from '../components/MemoryMoviePlayer';
import { useMemberAuth } from '../context/MemberAuthContext';
import { useCompanyAuth } from '../context/CompanyAuthContext';
import { cardArtClass, getCardDesign, getFontStyle } from '../utils/cardDesigns';
import { CoverArtwork } from '../utils/coverArtwork.jsx';
import { normalizeCoverLayout } from '../utils/coverLayout';
import { getAlbumTheme, getContrastTextColor } from '../utils/albumThemes';
import { readableTextColor, backgroundIsDark, backgroundIsPhoto, legibilityShadow } from '../utils/textContrast';
import { messageMediaItems, messageGift } from '../utils/messageMedia';
import { ALBUM_FLIP_CSS, ALBUM_FLIP_DURATION_MS } from '../utils/albumFlip';
import CardCoverPreview from '../components/CardCoverPreview';
import BankAccountTab from '../components/BankAccountTab';
import Navbar from '../components/Navbar';
import QRButton from '../components/QRButton';
import Icon from '../components/ui/Icon';


import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { formatNGN } from '../utils/currency';
import { asArray } from '../utils/asArray';

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
            e.currentTarget.style.animationPlayState = 'paused';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = design.accent + '0F';
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.animationPlayState = 'running';
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
                {resultCount > 0 ? `${resultCount} found` : '0 found'}
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

  const fee     = Math.round(amount * 0.03);
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
    { code:'NG', label:'Nigeria (NGN)', currency:'NGN' },
    { code:'GB', label:'United Kingdom (GBP)', currency:'GBP' },
    { code:'US', label:'United States (USD)', currency:'USD' },
  ];

  const loadBankAccounts = async () => {
    if (!isVerified) {
      toast.error('Please verify your email before withdrawing. Check your inbox.', { duration: 8000 });
      return;
    }
    setBusy(true);
    try {
      const r = await banksAPI.getMy();
      setAccounts(asArray(r.data));
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
          <div className="flex justify-between"><span>Platform fee (3%)</span><span>-{formatNGN(result.fee)}</span></div>
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
      <p className="text-xs text-warm-400 text-center -mt-2 mb-2">(After 3% platform fee on {formatNGN(amount)})</p>

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
            <p className="text-xs font-bold text-amber-800 mb-1">No bank account saved yet</p>
            <p className="text-xs text-amber-700">Add your bank details below — only takes a moment, and you can withdraw right after.</p>
          </div>
          <BankAccountTab compact onSaved={(updated) => setAccounts(updated)} />
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map(acc => (
            <div key={acc.id} className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
              <span className="inline-flex w-8 h-8 rounded-lg bg-blue-100 items-center justify-center flex-shrink-0"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 2 7 22 7"/></svg></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-warm-900 truncate">{acc.account_name}</p>
                <p className="text-xs text-warm-500">{acc.bank_name} · ****{acc.account_number?.slice(-4)}</p>
              </div>
            </div>
          ))}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs space-y-1 text-warm-600">
            <div className="flex justify-between"><span>Gift pot</span><span>{formatNGN(amount)}</span></div>
            <div className="flex justify-between"><span>Platform fee (3%)</span><span>-{formatNGN(fee)}</span></div>
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
          <audio
            controls
            playsInline
            preload="metadata"
            controlsList="nodownload"
            className="w-full max-w-xs"
            style={{ minWidth: 0 }}
            onError={e => {
              // If direct URL fails, try stripping Cloudinary transformations
              const el = e.currentTarget;
              if (!el.dataset.retried) {
                el.dataset.retried = '1';
                const src = el.src || item.media_url;
                // Force mp3 format via Cloudinary URL manipulation
                const mp3url = src.includes('cloudinary.com')
                  ? src.replace(/\.(wav|ogg|webm|m4a|aac)(\?.*)?$/, '.mp3').replace('/video/upload/', '/video/upload/f_mp3/')
                  : src;
                el.src = mp3url;
                el.load();
              }
            }}
          >
            <source src={item.media_url} />
            {item.media_url && item.media_url.includes('cloudinary.com') && (
              <source src={item.media_url.replace('/video/upload/', '/video/upload/f_mp3/').replace(/\.(wav|ogg|webm|m4a|aac)(\?.*)?$/, '.mp3')} type="audio/mpeg" />
            )}
          </audio>
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

const Media = ({ message, large = false }) => (
  // One reader for both layouts, so the board and the album agree about what a
  // message is carrying (it also tolerates legacy {url,type} and string entries).
  <MediaCarousel items={messageMediaItems(message)} large={large} />
);

/* ─── CelebrationBackground ─────────────────────────────────────────────
   Floating celebration SVG icons on the card's LIGHT soft background.
   Keeps the normal light body but adds celebratory atmosphere with icons.
─────────────────────────────────────────────────────────────────────────── */
const CEL_ICONS = [
  'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  'M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83',
  'M20 12v10H4V12M22 7H2v5h20V7zM12 22V7m0-2a2 2 0 0 1-4 0 2 2 0 0 1 4 0zm6 2a2 2 0 0 1-4 0 2 2 0 0 1 4 0z',
  'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  'M9 18V5l12-2v13M9 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm12-2a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
  'M2 20h20M5 20V10l7-7 7 7v10',
  'M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2z',
];

const CEL_POSITIONS = [
  { x:2,   y:3,   size:42, opacity:0.12, rot:15,  delay:0    },
  { x:88,  y:2,   size:34, opacity:0.11, rot:-22, delay:0.8  },
  { x:14,  y:65,  size:50, opacity:0.10, rot:30,  delay:1.4  },
  { x:76,  y:60,  size:38, opacity:0.12, rot:-12, delay:0.3  },
  { x:46,  y:10,  size:30, opacity:0.10, rot:45,  delay:2.1  },
  { x:92,  y:36,  size:46, opacity:0.11, rot:0,   delay:1.7  },
  { x:7,   y:38,  size:28, opacity:0.10, rot:-35, delay:0.6  },
  { x:58,  y:80,  size:40, opacity:0.12, rot:20,  delay:1.2  },
  { x:32,  y:52,  size:26, opacity:0.09, rot:-18, delay:2.5  },
  { x:78,  y:18,  size:48, opacity:0.11, rot:25,  delay:0.4  },
  { x:22,  y:85,  size:34, opacity:0.10, rot:-5,  delay:1.9  },
  { x:64,  y:44,  size:30, opacity:0.09, rot:55,  delay:0.9  },
  { x:48,  y:91,  size:42, opacity:0.11, rot:-28, delay:1.5  },
  { x:5,   y:24,  size:24, opacity:0.10, rot:10,  delay:2.8  },
  { x:95,  y:74,  size:28, opacity:0.10, rot:-42, delay:0.2  },
  { x:40,  y:34,  size:36, opacity:0.09, rot:35,  delay:1.1  },
  { x:70,  y:7,   size:32, opacity:0.11, rot:-8,  delay:2.3  },
  { x:19,  y:19,  size:26, opacity:0.09, rot:62,  delay:3.1  },
  { x:52,  y:27,  size:20, opacity:0.09, rot:-15, delay:1.6  },
  { x:30,  y:71,  size:38, opacity:0.11, rot:40,  delay:0.5  },
  { x:83,  y:53,  size:24, opacity:0.09, rot:-30, delay:2.0  },
  { x:15,  y:47,  size:32, opacity:0.10, rot:18,  delay:1.3  },
  { x:67,  y:29,  size:28, opacity:0.10, rot:-50, delay:2.7  },
  { x:37,  y:14,  size:44, opacity:0.11, rot:70,  delay:0.7  },
  { x:55,  y:63,  size:22, opacity:0.09, rot:-20, delay:3.3  },
  { x:89,  y:89,  size:36, opacity:0.10, rot:10,  delay:1.0  },
  { x:11,  y:93,  size:30, opacity:0.09, rot:-45, delay:2.4  },
  { x:74,  y:41,  size:26, opacity:0.09, rot:28,  delay:3.5  },
  { x:43,  y:77,  size:40, opacity:0.11, rot:-8,  delay:0.9  },
  { x:97,  y:14,  size:22, opacity:0.09, rot:55,  delay:1.8  },
];

const CelebrationBackground = ({ design }) => {
  const accent = design?.accent || '#7C3AED';
  // Use the accent color for icons — they sit on the LIGHT soft background
  const iconColor = accent.startsWith('#') ? accent : '#7C3AED';

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 0,
      minHeight: '100%', overflow: 'hidden', pointerEvents: 'none',
    }}>
      <style>{`
        @keyframes celFloat {
          0%   { transform: translateY(0px) scale(1); }
          50%  { transform: translateY(-16px) scale(1.04); }
          100% { transform: translateY(0px) scale(1); }
        }
      `}</style>
      {CEL_POSITIONS.map((pos, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          opacity: pos.opacity,
          transform: `rotate(${pos.rot}deg)`,
          animation: `celFloat ${5 + (i % 5)}s ${pos.delay}s ease-in-out infinite`,
        }}>
          <svg width={pos.size} height={pos.size} viewBox="0 0 24 24"
            fill="none" stroke={iconColor} strokeWidth={1.6}
            strokeLinecap="round" strokeLinejoin="round">
            <path d={CEL_ICONS[i % CEL_ICONS.length]}/>
          </svg>
        </div>
      ))}
    </div>
  );
};

const MessageCard = ({ message, index, design, canViewPrivate, onOpen, onReact, highlighted }) => {
  const [reacted, setReacted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const font = getFontStyle(message.font_style);
  const hasMedia = !!(message.media_url || message.media_gallery);
  const isLong = (message.content?.length || 0) > 220;
  const preview = isLong ? message.content.slice(0, 220).trimEnd() + '…' : message.content;
  const rotation = index % 3 === 0 ? '-.45deg' : index % 3 === 1 ? '.35deg' : '-.15deg';
  const calliFont = CALLI_FONTS[index % CALLI_FONTS.length];
  // The note sits on `design.background`. Several presets pair a pale gradient
  // with ink:'#ffffff', which made every message invisible — so resolve the
  // ink and accent against the surface we actually paint.
  // A note is paper. Photo-backed presets would otherwise tile the cover
  // picture behind every message, which is unreadable at note size.
  const surface   = backgroundIsPhoto(design.background, design.soft || '#ffffff')
    ? (design.soft || '#FFFDF8')
    : design.background;
  const cardInk   = readableTextColor(design.ink, surface, { ink: design.ink, fallback: design.soft || '#ffffff' });
  const cardAccent = readableTextColor(design.accent, surface, { ink: cardInk, fallback: design.soft || '#ffffff' });
  // Badges, avatars and the reaction button sit on their own near-white pills
  // INSIDE the note, so their ink must be resolved against the pill (white at
  // 75-80% over the note), not against the note itself — on the dark designs
  // the note ink is white, which rendered "❤️ 0" white-on-white.
  const pillSurface = `linear-gradient(rgba(255,255,255,0.78), rgba(255,255,255,0.78)), ${surface}`;
  const onWhiteAccent = readableTextColor(design.accent, pillSurface, { ink: '#1A1035', fallback: design.soft || '#ffffff' });
  const onWhiteInk = readableTextColor(cardInk, pillSurface, { ink: '#1A1035', fallback: design.soft || '#ffffff' });

  const giftBadge = () => {
    if (message.gift_type === 'product' && message.product_name) {
      return (
        <a href={`/c/${message.product_vendor_slug || '#'}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/75 border border-white hover:bg-white transition-colors"
          style={{ color: onWhiteAccent }} title={`View ${message.product_vendor_name || 'vendor'} store`}>
          🎂 {message.product_name}
        </a>
      );
    }
    if (message.contributed_amount > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/75 border border-white" style={{ color: onWhiteAccent }}>
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
        background: surface, color: cardInk,
        borderColor: highlighted ? design.accent : `${design.accent}40`,
        boxShadow: highlighted ? `0 0 0 3px ${design.accent}, 0 6px 28px ${design.accent}44` : undefined,
        transition: 'box-shadow .35s ease, border-color .35s ease, transform .35s ease',
        transform: highlighted ? 'scale(1.01)' : undefined,
      }}
    >
      {/* Decorative quote mark */}
      <div className="absolute top-1 left-3 text-5xl leading-none pointer-events-none select-none font-serif opacity-15" style={{ color: cardAccent }}>"</div>

      {/* ── 1. Author row (avatar, name, date) ── */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2 flex-shrink-0 relative z-10">
        <div className="w-9 h-9 rounded-full grid place-items-center text-xs font-extrabold bg-white/80 shadow-sm flex-shrink-0" style={{ color: onWhiteAccent }}>
          {message.author_name?.slice(0, 2).toUpperCase() || '??'}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`font-bold truncate text-xl ${calliFont}`} style={{ color: cardInk }}>{message.author_name}</p>
          <p className="text-[11px] opacity-60" style={{ color: cardInk }}>{message.created_at ? format(new Date(message.created_at), 'MMM d, yyyy') : ''}</p>
        </div>
        {message.is_private && canViewPrivate && (
          <span title="Private message — only visible to you and the recipient"
            className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide"
            style={{ background:'rgba(0,0,0,0.12)', color: design?.ink || '#1A1035', backdropFilter:'blur(4px)' }}>
            🔒 Private
          </span>
        )}
      </div>

      {/* ── 2. Media full-width below author, above text ── */}
      {hasMedia && (
        <div className="w-full flex-shrink-0">
          {/* Show media thumbnail — click to expand inline, not open modal */}
          {!expanded && (
            <button type="button" onClick={() => setExpanded(true)} className="w-full block relative group">
              <Media message={message} />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(0,0,0,0.25)' }}>
                <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full">Expand ↓</span>
              </div>
            </button>
          )}
        </div>
      )}

      {/* ── 3. Text message + expanded media ── */}
      <div className="px-4 pt-3 pb-1 flex-shrink-0 relative z-10">
        <div className="text-left w-full">
          {/* Full media shown inline when expanded */}
          {hasMedia && expanded && (
            <div className="mb-3 rounded-2xl overflow-hidden">
              <Media message={message} large />
            </div>
          )}

          <p
            className="whitespace-pre-wrap break-words"
            style={{
              color: cardInk,
              fontFamily: font.family,
              fontSize: message.font_style === 'calligraphy' ? '1.75rem' : message.font_style === 'handwritten' ? '1.45rem' : '1.2rem',
              lineHeight: message.font_style === 'calligraphy' ? 1.5 : 1.7,
              ...(!expanded && isLong ? {
                display: '-webkit-box',
                WebkitLineClamp: hasMedia ? 2 : 6,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              } : {}),
              wordBreak: 'break-word',
            }}
          >
            {message.content}
          </p>

          {(isLong || hasMedia) && (
            <button type="button" onClick={() => setExpanded(e => !e)}
              className="inline-flex items-center gap-1 mt-2 text-xs font-extrabold underline underline-offset-2 opacity-75 hover:opacity-100 transition-opacity"
              style={{ color: cardAccent }}>
              {expanded
                ? <><span>Show less</span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 15l-6-6-6 6"/></svg></>
                : <><span>See more</span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg></>
              }
            </button>
          )}
        </div>
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
          style={{ color: reacted ? '#e11d48' : onWhiteInk }}
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
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary inline-flex items-center gap-2 text-sm"><Icon name="Gift" size={15} />Transfer card</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg" style={{ fontFamily:'Space Grotesk,sans-serif' }}>Transfer card box</h3>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close transfer dialog" className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-purple-50 hover:text-gray-600"><Icon name="X" size={16} /></button>
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


/** AlbumFlipbookViewer — a real page-turning open-book viewer for album-layout
 * cards, so the finished card view matches what the creator saw building it
 * and what signers saw when they added their pages. Read-only: no compose,
 * no editing — just the cover, then every signed message as its own page,
 * shown two at a time as a genuine spread. */
const AlbumFlipbookViewer = ({ card, messages, design, albumTheme, coverBackground, coverTextColor }) => {
  const [page, setPage] = useState(0);
  const [flipClass, setFlipClass] = useState('');
  const pages = messages; // one page per signed message
  const totalPages = pages.length + 1; // +1 for the cover
  const clamped = Math.min(page, totalPages - 1);
  const showingCover = clamped === 0;
  const accent = albumTheme.accent || design?.accent || '#7C3AED';

  const flipTo = (target) => {
    const next = Math.max(0, Math.min(totalPages - 1, target));
    if (next === clamped) return;
    setFlipClass(next > clamped ? 'album-flip-forward' : 'album-flip-back');
    setPage(next);
    window.setTimeout(() => setFlipClass(''), ALBUM_FLIP_DURATION_MS);
  };
  const stepBack = () => flipTo(clamped - (showingCover ? 1 : 2));
  const stepFwd  = () => flipTo(showingCover ? 1 : clamped + 2);

  // Arrow keys turn pages, the way a real book responds to a nudge.
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); stepFwd(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); stepBack(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Swipe on touch devices.
  const swipeRef = useRef(null);
  const onTouchStart = (e) => {
    const t = e.touches?.[0];
    swipeRef.current = t ? { x: t.clientX, y: t.clientY } : null;
  };
  const onTouchEnd = (e) => {
    const s = swipeRef.current; swipeRef.current = null;
    const t = e.changedTouches?.[0];
    if (!s || !t) return;
    const dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0) stepFwd(); else stepBack();
    }
  };

  const leftIdx  = showingCover ? null : (clamped % 2 === 1 ? clamped : clamped - 1);
  const rightIdx = showingCover ? null : leftIdx + 1;
  const leftMsg  = leftIdx  != null && leftIdx  >= 1 ? pages[leftIdx  - 1] : null;
  const rightMsg = rightIdx != null && rightIdx < totalPages ? pages[rightIdx - 1] : null;

  const Leaf = ({ msg }) => {
    const [carouselIdx, setCarouselIdx] = useState(0);
    // Attachments are read with the shared reader. This used to build the list
    // itself using `{url,type}`, but the backend stores `{media_url,media_type}`
    // — so every gallery photo, GIF, video and voice note rendered with an
    // undefined src.
    const galleryItems = messageMediaItems(msg);
    const activeItem = galleryItems[Math.min(carouselIdx, Math.max(0, galleryItems.length - 1))];
    const gift = messageGift(msg);

    return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border shadow-xl"
      style={{
        width: 420, maxWidth: '44vw', minHeight: 560,
        background: albumTheme.page || '#FFFDF8',
        borderColor: 'rgba(120,90,200,0.16)',
        boxShadow: '0 22px 70px rgba(76,29,149,0.16)',
      }}>
      {msg ? (
        <div className="flex flex-1 flex-col p-6 sm:p-7">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full opacity-70" style={{ background: accent }}/>
            <span className="text-xs font-bold" style={{ fontFamily: "'Kalam',cursive", color: albumTheme.ink, opacity: 0.6 }}>
              {msg.created_at ? new Date(msg.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </span>
          </div>
          {activeItem && (
            <div className="relative mb-4 overflow-hidden rounded-xl" style={{ height: 160 }}>
              {activeItem.media_type === 'video' ? (
                <video src={activeItem.media_url} controls playsInline className="h-full w-full object-cover"/>
              ) : activeItem.media_type === 'voice' || activeItem.media_type === 'audio' ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 bg-purple-50 px-4">
                  <Icon name="Mic" size={22} className="text-primary-500"/>
                  <audio src={activeItem.media_url} controls className="w-full"/>
                </div>
              ) : (
                /* GIFs are images — an <img> animates them correctly. */
                <img src={activeItem.media_url} alt="" loading="lazy" className="h-full w-full object-cover"/>
              )}
              {galleryItems.length > 1 && (
                <div className="absolute inset-x-0 bottom-1.5 flex items-center justify-center gap-2">
                  <button type="button" onClick={() => setCarouselIdx(i => (i - 1 + galleryItems.length) % galleryItems.length)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white"><Icon name="ChevronLeft" size={12}/></button>
                  <span className="rounded-full bg-black/65 px-2 py-0.5 text-[9px] font-bold text-white">{carouselIdx + 1}/{galleryItems.length}</span>
                  <button type="button" onClick={() => setCarouselIdx(i => (i + 1) % galleryItems.length)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white"><Icon name="ChevronRight" size={12}/></button>
                </div>
              )}
            </div>
          )}
          <p className="flex-1 whitespace-pre-wrap break-words leading-relaxed"
            style={{ fontFamily: getFontStyle(msg.font_style)?.family || "'Kalam',cursive", color: readableTextColor(msg.font_color || albumTheme.ink, albumTheme.page || '#FFFDF8', { ink: albumTheme.ink, fallback: albumTheme.page || '#FFFDF8' }), fontSize: Number(msg.font_size) > 0 ? Number(msg.font_size) : 19 }}>
            {msg.content}
          </p>
          {/* A gift belongs on the signer's page — it was only ever rendered on
              the board, so album cards showed no gifts at all. */}
          {gift && (
            <div className="mt-3">
              {gift.kind === 'product' ? (
                <a href={gift.vendorSlug ? `/c/${gift.vendorSlug}` : undefined}
                  target={gift.vendorSlug ? '_blank' : undefined} rel="noopener noreferrer"
                  title={gift.vendorName ? `View ${gift.vendorName} store` : undefined}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold"
                  style={{ borderColor: `${accent}55`, background: `${accent}12`, color: accent }}>
                  🎁 {gift.label}
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white"
                  style={{ background: '#059669' }}>
                  🎁 {formatNGN(gift.amount)}
                </span>
              )}
            </div>
          )}
          <p className="mt-4 text-right text-sm font-bold" style={{ fontFamily: "'Dancing Script',cursive", color: accent, fontSize: 22 }}>
            — {msg.author_name}
          </p>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <span style={{ fontFamily: "'Caveat',cursive", fontSize: 18, color: '#C4B5FD' }}>The end ✦</span>
        </div>
      )}
    </div>
    );
  };

  // "Cover blur" is meant to echo the artwork, exactly as AlbumSign and the
  // album studio resolve it. Using albumTheme.stage flat made every cover_blur
  // card render as the same pale green, so the chosen background never showed.
  const customCoverUrl = typeof card?.background_color === 'string' && /^https?:\/\//.test(card.background_color)
    ? card.background_color
    : null;
  // A creator-uploaded cover replaces the template's artwork entirely — this
  // mirrors AlbumSign's CoverPage, which CardView was not doing, so uploaded
  // covers fell back to the original template image.
  const coverDesign = customCoverUrl
    ? { ...design, id: 'custom_upload', image: customCoverUrl, artwork: null, background: '#1a1035', ink: '#ffffff', dark: true }
    : design;
  const stageBackground = albumTheme.id === 'cover_blur'
    ? (customCoverUrl
        ? `url("${customCoverUrl}") center / cover no-repeat`
        : design?.image
          ? `url("${design.image}") center / cover no-repeat`
          : (design?.background || albumTheme.stage))
    : albumTheme.stage;

  return (
    <div className="relative overflow-hidden rounded-2xl p-5 sm:p-8" style={{ background: stageBackground }}>
      {albumTheme.id === 'cover_blur' && (customCoverUrl || design?.image) && (
        <div className="pointer-events-none absolute inset-0 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.22)' }} />
      )}
      <div className="relative">
      <style>{`
        ${ALBUM_FLIP_CSS}
        .cv-book { display:flex; align-items:center; justify-content:center; }
      `}</style>
      <div className="cv-book album-stage" style={{ minHeight: 600 }}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {(() => {
          // `key` forces a remount on every turn so the animation actually
          // replays; the class is derived once for the whole leaf.
          const turn = flipClass === 'album-flip-forward' ? 'forward'
                     : flipClass === 'album-flip-back' ? 'back' : '';
          return showingCover ? (
            <div key={`cv-cover-${clamped}`} className={`album-page-turn ${turn}`}
              style={{ width: 424, maxWidth: '86vw', position: 'relative' }}>
              <div style={{position:'absolute',left:'11%',top:10,width:'89%',height:'100%',borderRadius:8,background:'#fff',boxShadow:'0 18px 58px rgba(0,0,0,.2)'}}/>
              <div style={{position:'relative'}}>
                <CardCoverPreview
                  design={coverDesign}
                  occasionLabel={(card.occasion || '').replace(/_/g, ' ')}
                  recipientName={card.recipient_name}
                  title={card.title}
                  senderName={card.cover_sender}
                  coverColor={card.background_color?.startsWith('#') ? card.background_color : undefined}
                  textColor={coverTextColor}
                  fontFamily={getFontStyle(card.font_style).family}
                  layout={card.cover_layout}
                />
              </div>
            </div>
          ) : (
            /* The spread is ONE leaf: both pages live inside a single animated
               element, hinged on the spine, as in the album studio preview. */
            <div key={`cv-spread-${clamped}`} className={`album-page-turn ${turn} relative`}>
              <div className="flex items-stretch overflow-hidden rounded-[14px] shadow-2xl">
                <div><Leaf msg={leftMsg}/></div>
                <div><Leaf msg={rightMsg}/></div>
              </div>
              <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-black/20 shadow-[0_0_10px_rgba(0,0,0,0.25)]" />
            </div>
          );
        })()}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <button type="button" onClick={stepBack} disabled={clamped === 0}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow disabled:opacity-30"
          style={{ border: `2px solid ${accent}44`, color: accent }}>
          <Icon name="ChevronLeft" size={20}/>
        </button>
        <span className="text-xs font-bold" style={{ color: readableTextColor('#4B3F72', albumTheme.stage, { ink: albumTheme.ink, fallback: albumTheme.stage }) }}>
          {showingCover ? 'Cover' : `Page ${clamped} of ${totalPages - 1}`}
          <span className="ml-1.5 font-semibold opacity-60">· swipe or use ← →</span>
        </span>
        <button type="button" onClick={stepFwd} disabled={clamped >= totalPages - 1}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow disabled:opacity-30"
          style={{ border: `2px solid ${accent}44`, color: accent }}>
          <Icon name="ChevronRight" size={20}/>
        </button>
      </div>
      </div>
    </div>
  );
};

const CardView = () => {
  const { slug } = useParams();
  const { user }    = useAuth();
  const { member }  = useMemberAuth();
  const { company } = useCompanyAuth();
  const [searchParams] = useSearchParams();

  // ?token= is the direct access_token (old format / copy-link).
  // ?claim= is the claim_token sent in delivery emails — must be resolved via
  // the claim-gate endpoint first to get the real access_token.
  const rawToken  = searchParams.get('token');
  const claimParam = searchParams.get('claim');

  // Persist access token for this card in sessionStorage so reply works even after navigation
  if (rawToken) {
    sessionStorage.setItem(`card_token_${slug}`, rawToken);
  }

  const [token, setToken] = useState(
    rawToken || sessionStorage.getItem(`card_token_${slug}`) || null
  );
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cardViewTab,  setCardViewTab]  = useState(
    ['wall','movie'].includes(searchParams.get('tab')) ? searchParams.get('tab') : 'messages'
  );

  useEffect(() => {
    if (card?.card_experience === 'wall_only' || searchParams.get('tab') === 'wall') setCardViewTab('wall');
  }, [card?.card_experience, searchParams]);

  // How the signed messages are displayed is the *viewer's* choice — a signer,
  // the recipient or anyone with the link can flip between the album flipbook
  // and the message board at any time. The card's own card_layout only decides
  // which one they land on first, and ?view=album|board can preselect it (used
  // by shared links). Remembered per browser so a repeat visit opens the way
  // they left it.
  const VIEW_STYLE_KEY = 'thankeeu_card_view_style';
  const [viewStyle, setViewStyle] = useState(() => {
    const fromUrl = searchParams.get('view');
    if (fromUrl === 'album' || fromUrl === 'board') return fromUrl;
    try {
      const saved = localStorage.getItem(VIEW_STYLE_KEY);
      if (saved === 'album' || saved === 'board') return saved;
    } catch { /* private mode — fall through to the card's own default */ }
    return null; // decided from the card once it loads
  });
  // Derived rather than synced through an effect, so the very first paint
  // already uses the right style (no hero/navbar flash on album cards).
  const effectiveViewStyle = viewStyle || (card?.card_layout === 'album' ? 'album' : 'board');
  const chooseViewStyle = (next) => {
    setViewStyle(next);
    try { localStorage.setItem(VIEW_STYLE_KEY, next); } catch { /* non-fatal */ }
  };
  const [showAll,      setShowAll]      = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [openMessage, setOpenMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // True while we're still waiting to resolve ?claim= → access_token.
  // fetchCard must not fire until this is false, to avoid an anonymous
  // public-view request racing ahead of the real recipient token.
  const [claimResolving, setClaimResolving] = useState(!!claimParam && !token);

  // Resolve ?claim= token → real access_token via claim-gate, then store it
  // so the card loads as a proper recipient view (not a public/anonymous view).
  useEffect(() => {
    if (!claimParam || token) {
      setClaimResolving(false);
      return;
    }
    cardsAPI.getClaimGate(slug, claimParam)
      .then(res => {
        const accessToken = res.data?.access_token;
        if (accessToken) {
          sessionStorage.setItem(`card_token_${slug}`, accessToken);
          setToken(accessToken);
        }
      })
      .catch(() => {
        // claim-gate failed — fall through to public/anonymous view
      })
      .finally(() => setClaimResolving(false));
  }, [slug, claimParam]); // eslint-disable-line react-hooks/exhaustive-deps

  const BASE_URL = import.meta.env.VITE_APP_URL || 'https://www.thankeeu.com';
  const cardOccasionLabel = card
    ? (card.occasion === 'other' && card.custom_occasion
        ? card.custom_occasion
        : (occasionLabel[card.occasion] || card.occasion || 'special day'))
    : null;

  useSEO({
    title: card
      ? `${card.recipient_name}'s ${cardOccasionLabel} Card`
      : 'View Card — Thankeeu',
    description: card
      ? `A beautiful group card for ${card.recipient_name}'s ${cardOccasionLabel}. ${card.signed_count > 0 ? `${card.signed_count} people signed it.` : ''} Made with love on Thankeeu.`
      : 'View a group card on Thankeeu.',
    ogImage: card ? (() => { const apiBase = import.meta.env.VITE_API_URL || ''; return apiBase.startsWith('http') ? `${apiBase}/cards/${card.slug}/og-image` : `https://www.thankeeu.com/api/cards/${card.slug}/og-image`; })() : undefined,
    canonical: card ? `/card/${card.slug}` : undefined,
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

      // If this is a recipient view with an access_token in session,
      // ensure the card is linked to their account (idempotent)
      const sessionTok = sessionStorage.getItem(`card_token_${slug}`);
      if (sessionTok && response.data?.isRecipient) {
        const authTok = localStorage.getItem('thankeeu_token') || localStorage.getItem('thankeeu_member_token');
        const base = import.meta.env.VITE_API_URL || '/api';
        fetch(`${base}/cards/${slug}/mark-claimed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authTok ? { Authorization: `Bearer ${authTok}` } : {}),
          },
          body: JSON.stringify({ access_token: sessionTok }),
        }).catch(() => {});
      }
    } catch (err) {
      if (!silent) toast.error(err.response?.data?.error || 'Card not found or not available');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (claimResolving) return; // wait for claim-gate resolution first
    fetchCard();
    const refresh = () => fetchCard(true);
    const interval = window.setInterval(refresh, 10000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, [slug, token, user?.id, member?.id, company?.id, claimResolving]);

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

  const messages = (card.messages || []).filter(Boolean);
  const filteredMessages = searchQuery.trim().length > 0
    ? messages.filter(m =>
        m.author_name?.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : messages;
  const displayMessages = searchQuery.trim().length > 0
    ? filteredMessages                              // show ALL matches when searching
    : showAll ? messages : messages.slice(0, 8);   // normal paginated view
  const totalCollected = card.total_collected || 0;
  const design = getCardDesign(card.design_theme);
  const isCustomCoverUrl = typeof card.background_color === 'string' && /^https?:\/\//.test(card.background_color);
  const coverBackground = card.background_color?.startsWith('#')
    ? `linear-gradient(145deg, ${card.background_color}26, transparent 68%), ${design.background}`
    : isCustomCoverUrl
      ? `linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.45)), url("${card.background_color}") center/cover no-repeat`
      : (card.background_color || design.background);
  // Hero text colour. The creator's pick wins *only* when it is actually
  // legible on the cover we are about to paint — otherwise we substitute the
  // best-contrasting on-brand colour. Presets that declare `dark: true` over a
  // pale gradient (all the priority covers) used to render white-on-white.
  const coverTextColor = readableTextColor(
    card.cover_text_color && card.cover_text_color !== 'auto' ? card.cover_text_color : 'auto',
    coverBackground,
    { ink: design?.ink, fallback: design?.soft || '#ffffff', large: true },
  );
  const coverIsDark = backgroundIsDark(coverBackground, design?.soft || '#ffffff');
  const coverIsPhoto = backgroundIsPhoto(coverBackground, design?.soft || '#ffffff');
  // Accent used on the near-white pills over the hero. The pills are painted at
  // 90% white OVER the cover, so validating against pure #ffffff overstates the
  // contrast — an accent that scrapes 4.5:1 on white lands at 4.48 on the real
  // pill. Composite the pill the way the browser will.
  const pillBackdrop = `linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), ${coverBackground}`;
  const pillAccent = readableTextColor(design?.accent, pillBackdrop, { ink: design?.ink, fallback: design?.soft || '#ffffff' });
  const pillInk = readableTextColor(design?.ink, pillBackdrop, { ink: '#1A1035', fallback: design?.soft || '#ffffff' });
  // The page body sits on `design.soft`, which is a deep indigo for the dark
  // presets while every heading below used a fixed light-theme colour.
  const pageSurface = design?.soft || '#F5F0FF';
  const pageIsDark  = backgroundIsDark(pageSurface, '#F5F0FF');
  const pageInk     = readableTextColor('#1A1035', pageSurface, { ink: '#1A1035', fallback: pageSurface });
  const pageMuted   = pageIsDark ? 'rgba(255,255,255,0.72)' : '#6D5EA0';
  const pageAccent  = readableTextColor(design?.accent || '#7C3AED', pageSurface, { ink: pageInk, fallback: pageSurface });
  // Navbar theming: for album-layout cards, reflect the interior album theme
  // (album_background_theme) the same way AlbumSign.jsx colors its own top
  // bar — not just the cover art gradient — so the navbar reads consistently
  // whether you're looking at the cover or already inside the flipbook.
  const albumNavTheme = effectiveViewStyle === 'album' ? getAlbumTheme(card.album_background_theme) : null;
  const navThemeBg = albumNavTheme
    ? (albumNavTheme.id === 'cover_blur'
        ? (isCustomCoverUrl ? `url("${card.background_color}") center/cover no-repeat` : design?.image ? `url("${design.image}") center/cover no-repeat` : design?.background)
        : albumNavTheme.stage)
    : design?.background;
  // Derived from the resolved bar colour, not the preset's `dark` flag (which
  // lies for photo/pale-gradient presets, and 'charcoal' is not a theme id).
  const navThemeDark = backgroundIsDark(navThemeBg, design?.soft || '#F5F0FF');
  // Movable/recolourable cover text layout (show/hide + per-field colour)
  const coverLayout = normalizeCoverLayout(card.cover_layout);
  const fieldColor = (field) => {
    const c = coverLayout[field]?.color;
    if (!c || c === 'auto') return coverTextColor;
    // Respect the creator's per-field colour only while it stays readable.
    return readableTextColor(c, coverBackground, {
      ink: design?.ink, fallback: design?.soft || '#ffffff', large: true,
    });
  };
  const coverArt = design.artwork;
  const albumTheme = getAlbumTheme(card.album_background_theme);
  const titleFont = getFontStyle(card.font_style);
  const canViewPrivate = Boolean(token || card.isCreator || card.isRecipient);


  const cardTitle = card?.title || `${card?.recipient_name || ''}'s Card`;
  const layoutType = member ? 'member' : company ? 'company' : 'user';

  const content = (
    <div style={{ background: design?.soft || '#F5F0FF' }}>
      <CelebrationBackground design={design} />
      <style>{FONT_INJECT}</style>
      {/* Confetti runs forever — never stops */}
      <Confetti />
      {/* ── HERO BANNER — hidden for album flipbook cards (they have their own
           themed cover page inside the flipbook viewer itself) ── */}
      {effectiveViewStyle !== 'album' && (
      <header className="relative overflow-hidden" style={{ background: coverBackground, color: coverTextColor }}>
        {/* Photo covers: the artwork is unknowable, so guarantee legibility with
            a scrim rather than hoping the picture is dark enough. */}
        {coverIsPhoto && (
          <div className="absolute inset-0" style={{ zIndex: 0, background: 'linear-gradient(180deg, rgba(9,7,22,0.52) 0%, rgba(9,7,22,0.58) 55%, rgba(9,7,22,0.66) 100%)' }} />
        )}
        {/* SVG artwork backdrop for artwork designs */}
        {coverArt && (
          <div className="absolute inset-0" style={{ zIndex: 0, opacity: 0.9 }}>
            <CoverArtwork scene={coverArt.scene} palette={coverArt.palette} seed={coverArt.seed}
              style={{ width: '100%', height: '100%' }} />
            <div className="absolute inset-0" style={{ background: coverIsDark ? 'linear-gradient(180deg, rgba(8,6,20,0.35), rgba(8,6,20,0.15))' : 'linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08))' }} />
          </div>
        )}
        {/* Decorative blurred circles */}
        <div style={{ position:'absolute', top:'-60px', right:'-60px', width:280, height:280, borderRadius:'50%', background:'rgba(255,255,255,0.08)', pointerEvents:'none', zIndex:0 }} />
        <div style={{ position:'absolute', bottom:'-40px', left:'-40px', width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none', zIndex:0 }} />
        <div style={{ position:'absolute', top:'40%', left:'50%', transform:'translate(-50%,-50%)', width:340, height:340, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none', zIndex:0 }} />

        <div className="relative max-w-5xl mx-auto px-4 py-5 sm:py-7 text-center" style={{ zIndex:1 }}>
          {/* The board hero is a banner, not the card itself. It used to render
              the full movable-cover stage (500x600, later 330x400) whenever the
              creator had arranged their cover, which made this header ~745px —
              nearly double the signing page's 411px hero. The arranged cover is
              shown in full in the Album view and on the signing page, so here we
              use the compact treatment. The creator's per-field show/hide and
              colours are still honoured below. */}
          <>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold tracking-widest uppercase mb-3"
            style={{ background: coverIsPhoto ? 'rgba(9,7,22,0.55)' : (coverIsDark ? 'rgba(255,255,255,0.18)' : 'rgba(26,16,53,0.08)'), backdropFilter:'blur(8px)', color: coverTextColor, border:`1px solid ${coverIsDark ? 'rgba(255,255,255,0.25)' : 'rgba(26,16,53,0.14)'}` }}>
            ✨ Online Group Card
          </div>

          {/* Recipient photo — circular frame in hero center, or floating emoji if no photo */}
          {card.recipient_photo_url ? (
            <div className="flex justify-center mb-3">
              <div style={{
                position: 'relative',
                width: 110,
                height: 110,
                borderRadius: '50%',
                boxShadow: `0 0 0 4px rgba(255,255,255,0.55), 0 0 0 7px ${design.accent}55, 0 8px 32px rgba(0,0,0,0.22)`,
                overflow: 'hidden',
                flexShrink: 0,
              }}>
                <img
                  src={card.recipient_photo_url}
                  alt={`${card.recipient_name || 'Recipient'}'s photo`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center top',
                    display: 'block',
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="text-4xl sm:text-5xl mb-1.5 animate-float select-none">{design.icon}</div>
          )}

          {/* Big calligraphic title */}
          {coverLayout.title.show && (
            <h1 className="mb-1 px-2" style={{
              fontFamily: "'Great Vibes', cursive",
              fontSize: 'clamp(1.9rem, 5vw, 3.25rem)',
              lineHeight: 1.15,
              color: fieldColor('title'),
              textShadow: legibilityShadow(fieldColor('title'), coverBackground, { fallback: design?.soft || '#ffffff', force: coverIsPhoto }),
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              maxWidth: '100%',
            }}>
              {card.title || `Happy ${card.occasion === 'other' && card.custom_occasion ? card.custom_occasion : (card.occasion||'').replace(/_/g,' ')}, ${card.recipient_name}!`}
            </h1>
          )}

          {card.cover_sender && coverLayout.sender.show && (
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.16em] mb-3" style={{ color: fieldColor('sender'), opacity: coverIsPhoto ? 1 : 0.9 }}>
              From {card.cover_sender}
            </p>
          )}
          </>

          {/* Subtitle */}
          <p className="text-sm sm:text-base max-w-xl mx-auto mb-3" style={{
            color: coverTextColor,
            opacity: coverIsPhoto ? 0.95 : 0.72,
          }}>
            {(card.signed_count || messages.length)} {(card.signed_count || messages.length) === 1 ? 'person has' : 'people have'} filled this card with love, laughter and warmth just for you.
          </p>

          {/* Stat badges */}
          <div className="flex flex-wrap justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm"
              style={{ background:'rgba(255,255,255,0.9)', color: pillAccent }}>
              💌 {card.signed_count || messages.length} messages
            </span>
            {totalCollected > 0 && (
              <span className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm bg-emerald-600 text-white">
                🎁 {formatNGN(totalCollected)} gift
              </span>
            )}
            {card.send_date && (() => {
              // send_date and send_time are stored as UTC (the frontend converts to UTC on save).
              // We must reconstruct the full UTC datetime and convert to local for display,
              // otherwise a 10:24 PM WAT card shows as 9:24 PM (the raw UTC value).
              const timeUTC = card.send_time ? card.send_time.slice(0, 5) : '00:00';
              const dateStr  = String(card.send_date).slice(0, 10);
              const utcDt    = new Date(`${dateStr}T${timeUTC}:00Z`);
              const localTime = isNaN(utcDt.getTime())
                ? timeUTC
                : utcDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
              const localDate = isNaN(utcDt.getTime())
                ? format(new Date(card.send_date), 'MMMM d, yyyy')
                : utcDt.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
              return (
                <span className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm"
                  style={{ background:'rgba(255,255,255,0.9)', color: pillInk }}>
                  📅 {localDate}{card.send_time ? ` · ${localTime}` : ''}
                </span>
              );
            })()}
          </div>

          {/* Add message CTA — only show if card is still open for signing */}
          {card.status === 'active' && (
            <div className="mt-6">
              <a href={`/sign/${slug}`}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold text-sm transition-all hover:scale-105 hover:shadow-lg"
                style={{ background: design.accent, color: '#fff', boxShadow: `0 4px 20px ${design.accent}55` }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Add your message
              </a>
            </div>
          )}



          {/* ── Tab navigation (Messages / Memory Wall / Movie) — always visible ── */}
          {(() => {
            const hasWall  = ['card_and_wall','wall_only'].includes(card?.card_experience);
            const movieSt  = card?.movie_status || 'none';
            const canGen   = Boolean(card?.isCreator || card?.isRecipient);
            const showMessages = card?.card_experience !== 'wall_only';
            // If a non-owner landed on movie tab (e.g. via URL), redirect to messages
            if (cardViewTab === 'movie' && !canGen && showMessages) {
              setTimeout(() => setCardViewTab('messages'), 0);
            }
            // If someone landed on wall tab but card has no wall, redirect to messages
            if (cardViewTab === 'wall' && !hasWall && showMessages) {
              setTimeout(() => setCardViewTab('messages'), 0);
            }
            // Theme-aware inactive tab styling: on light-background themes we must NOT use
            // white text/borders (invisible). Use the theme ink colour instead.
            const activeCls   = 'shadow-lg scale-105';
            const activeStyle = { background: '#ffffff', borderColor: '#ffffff', color: '#1a1035' };
            const inactiveStyle = coverIsDark
              ? { background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.35)', color: 'rgba(255,255,255,0.85)' }
              : { background: 'rgba(255,255,255,0.65)', borderColor: `${pillAccent}55`, color: pillInk };
            const badgeActive = { background: `${pillAccent}1a`, color: pillAccent };
            const badgeInactive = coverIsDark
              ? { background: 'rgba(255,255,255,0.2)', color: '#ffffff' }
              : { background: `${pillAccent}22`, color: pillAccent };
            const tabBase = 'flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold border-2 transition-all hover:opacity-90';
            return (
            <div className="flex justify-center gap-2 mt-4 mb-3 flex-wrap px-4">
              {showMessages && (
                <button onClick={() => setCardViewTab('messages')}
                  className={`${tabBase} ${cardViewTab === 'messages' ? activeCls : ''}`}
                  style={cardViewTab === 'messages' ? activeStyle : inactiveStyle}>
                  <span>Group Card</span>
                  {messages?.length > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-md font-extrabold"
                      style={cardViewTab === 'messages' ? badgeActive : badgeInactive}>
                      {messages.length}
                    </span>
                  )}
                </button>
              )}
              {hasWall && (
              <button onClick={() => setCardViewTab('wall')}
                className={`${tabBase} ${cardViewTab === 'wall' ? activeCls : ''}`}
                style={cardViewTab === 'wall' ? activeStyle : inactiveStyle}>
                <span>Photo Wall</span>
                <span className="text-xs px-1.5 py-0.5 rounded-md font-extrabold"
                  style={cardViewTab === 'wall' ? badgeActive : badgeInactive}>Live</span>
              </button>
              )}
              {canGen && (
              <button onClick={() => setCardViewTab('movie')}
                className={`${tabBase} ${cardViewTab === 'movie' ? activeCls : ''}`}
                style={cardViewTab === 'movie' ? activeStyle : inactiveStyle}>
                <span>Movie</span>
                {(movieSt === 'rendering' || movieSt === 'queued') && <span className="text-xs opacity-60 animate-pulse">•••</span>}
                {(movieSt === 'completed' || movieSt === 'ready') && (
                  <span className="text-xs px-1.5 py-0.5 rounded-md font-extrabold"
                    style={cardViewTab === 'movie' ? badgeActive : badgeInactive}>Ready</span>
                )}
              </button>
              )}
            </div>
            );
          })()}

          {/* Signer avatar strip — up to 10 initials */}

          {messages.length > 0 && cardViewTab === 'messages' && (
            <div className="flex justify-center mt-4">
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
                {(card.signed_count || messages.length) > 10 && (
                  <div style={{
                    width:36, height:36, borderRadius:'50%',
                    background: coverIsDark ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.85)', color: coverIsDark ? '#fff' : pillAccent,
                    border:'2.5px solid rgba(255,255,255,0.6)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:10, fontWeight:800, marginLeft:-10,
                    boxShadow:'0 2px 8px rgba(0,0,0,0.1)',
                  }}>
                    +{(card.signed_count || messages.length) - 10}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
      )} {/* end card_layout !== 'album' */}

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 pt-10 sm:pt-14 pb-28 sm:pb-20" style={{ position: 'relative', zIndex: 1 }}>
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

              {/* Recipient has the token but no account — prompt to sign up/in to claim */}
              {!card.isRecipient && !user && !member && token && totalCollected > 0 && (
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center max-w-sm mx-auto">
                  <p className="font-bold text-white text-sm mb-1">🎁 {formatNGN(totalCollected)} gift is waiting for you</p>
                  <p className="text-white/70 text-xs mb-3 leading-relaxed">
                    Create a free account or log in with <strong>{card.recipient_email}</strong> to withdraw your gift to your bank account.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Link
                      to={`/signup?email=${encodeURIComponent(card.recipient_email || '')}&returnTo=${encodeURIComponent(`/card/${slug}?token=${token}`)}`}
                      className="btn-primary text-sm py-2.5 w-full text-center">
                      Create free account to claim gift
                    </Link>
                    <Link
                      to={`/login?email=${encodeURIComponent(card.recipient_email || '')}&returnTo=${encodeURIComponent(`/card/${slug}?token=${token}`)}`}
                      className="bg-white/20 hover:bg-white/30 text-white text-sm py-2.5 rounded-2xl font-bold text-center transition-all">
                      I already have an account
                    </Link>
                  </div>
                </div>
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

        {/* ── Who gave — individual contributor list ───────────────────────
             The gift-pot card above only shows the total. Creator and
             recipient can also see who gave what, one line per gift. */}
        {totalCollected > 0 && (card.isCreator || card.isRecipient) && Array.isArray(card.contributions) && card.contributions.filter(c => c.status === 'success').length > 0 && (
          <section className="rounded-[1.5rem] border-2 border-emerald-100 bg-emerald-50/40 p-5 sm:p-6 mb-9">
            <p className="text-xs font-extrabold tracking-[.15em] uppercase text-emerald-700 mb-4 flex items-center gap-2">
              <Icon name="Gift" size={14}/>Who gave
            </p>
            <ul className="space-y-2.5">
              {card.contributions.filter(c => c.status === 'success').map((c, i) => (
                <li key={i} className="flex items-center justify-between gap-3 bg-white rounded-xl px-4 py-3 border border-emerald-100">
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 grid place-items-center text-sm font-extrabold text-emerald-700">
                      {(c.contributor_name || 'A')[0].toUpperCase()}
                    </span>
                    <span className="font-semibold text-warm-800 text-sm truncate">{c.contributor_name || 'Anonymous'}</span>
                  </span>
                  <span className="font-extrabold text-emerald-700 text-sm flex-shrink-0">
                    {c.amount != null ? formatNGN(c.amount) : 'Amount hidden'}
                  </span>
                </li>
              ))}
            </ul>
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

          {/* Box 2 — Private view link (actual card creator, or a token-holding recipient, only).
              Note: card.isCreator is intentionally broader (any teammate on the same company
              account) for other permissions; this banner must stay narrow so a colleague who
              didn't create this specific card never sees the private link / Transfer button. */}
          {(card.isCreatorPersonal || (card.isRecipient && Boolean(token))) && (
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
                {card.isCreatorPersonal && <TransferCardButton slug={slug} />}
              </div>
            </div>
          )}
        </div>

        {/* Wall tab in main */}
        {cardViewTab === 'wall' && (
          <div className="mb-9">
              {['card_and_wall','wall_only'].includes(card?.card_experience) ? (
                <LiveMemoryWall
                  slug={card.slug}
                  canUpload={true}
                  defaultName={user?.full_name || ''}
                  defaultEmail={user?.email || ''}
                  wallUrl={`${window.location.origin}/sign/${card.slug}?tab=wall`}
                />
              ) : (
                <div className="text-center py-16 px-6 rounded-3xl border-2 border-dashed border-pink-200" style={{ background:'#FFF5FB' }}>
                  
                  <h3 className="font-extrabold text-warm-900 text-xl mb-2">Live Photo Wall™</h3>
                  <p className="text-warm-500 text-sm max-w-sm mx-auto mb-6 leading-relaxed">
                    Guests scan a QR code and upload photos in real time — no app needed. Display the wall live on a venue screen.
                    This card was created as a Group Card only.
                  </p>
                  <p className="text-warm-400 text-xs mb-6">The card creator can enable the Photo Wall when creating a new card by choosing "Group Card + Live Photo Wall".</p>
                  <a href="/card/new"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white transition-all hover:scale-105"
                    style={{ background:'linear-gradient(135deg,#EC4899,#DB2777)' }}>
                    Create a card with Photo Wall →
                  </a>
                </div>
              )}
          </div>
        )}

        {/* Movie tab in main */}
        {cardViewTab === 'movie' && (
          <div className="mb-9 max-w-2xl mx-auto">
              {canViewPrivate ? (
                <MemoryMoviePlayer
                  cardId={card.id}
                  initialStatus={card.movie_status || 'none'}
                  canGenerate={Boolean(card.isCreator || card.isRecipient)}
                />
              ) : (
                <div className="text-center py-16 px-6 rounded-3xl border-2 border-purple-100 bg-purple-50">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-100 flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <h3 className="font-bold text-warm-900 mb-2">Private to the recipient</h3>
                  <p className="text-warm-500 text-sm">The Memory Movie is only accessible to the card recipient and creator.</p>
                </div>
              )}
          </div>
        )}

        {/* Messages tab */}
        {cardViewTab === 'messages' && (
        <section>
          {/* ── Section header + magical search ── */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <span className="text-xs font-extrabold tracking-[.2em] uppercase" style={{ color: pageAccent }}>The message wall</span>
                <h2 className="text-3xl mt-2" style={{ color: pageInk }}>Words to keep forever</h2>
              </div>
              <span className="text-xs font-bold" style={{ color: pageMuted }}>{messages.length} notes</span>
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
              {/* Viewer-controlled display style — same messages, two ways to read them. */}
              <div className="mb-5 flex justify-center">
                <div className="inline-flex gap-1 rounded-2xl border border-purple-100 bg-white p-1 shadow-sm">
                  {[
                    { id: 'album', icon: 'BookOpen',   label: 'Album' },
                    { id: 'board', icon: 'LayoutGrid', label: 'Board' },
                  ].map(opt => (
                    <button key={opt.id} type="button" onClick={() => chooseViewStyle(opt.id)}
                      aria-pressed={effectiveViewStyle === opt.id}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-all ${
                        effectiveViewStyle === opt.id ? 'shadow' : 'hover:bg-purple-50'
                      }`}
                      style={effectiveViewStyle === opt.id
                        ? { background: design.accent, color: readableTextColor('#ffffff', design.accent, { ink: '#1A1035' }) }
                        : { color: '#4A3A7A' }}>
                      <Icon name={opt.icon} size={14}/>{opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {effectiveViewStyle === 'album' ? (
                <AlbumFlipbookViewer
                  card={card}
                  messages={displayMessages}
                  design={design}
                  albumTheme={albumTheme}
                  coverBackground={coverBackground}
                  coverTextColor={coverTextColor}
                />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
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
              )}
              {messages.length > 8 && !showAll && !searchQuery.trim() && (
                <div className="text-center mt-8">
                  <button onClick={() => setShowAll(true)} className="btn-primary">See all {messages.length} messages</button>
                </div>
              )}
            </>
          )}

        </section>
        )}

        {/* Soft nudge for recipients without an account — save card & claim gift */}
        {token && !user && !member && !card.isRecipient && (
          <div className="rounded-3xl p-6 text-center mt-8" style={{ background:'linear-gradient(135deg,#EDE9FE,#F5F0FF)', border:'2px solid #DDD6FE' }}>
            <p className="text-2xl mb-2">🎉</p>
            <p className="font-extrabold text-warm-900 text-lg mb-1">This card was made just for you</p>
            <p className="text-warm-600 text-sm mb-4 leading-relaxed max-w-sm mx-auto">
              Create a free account with <strong>{card.recipient_email}</strong> to save this card to your profile, revisit it any time, and{totalCollected > 0 ? ` claim your ${formatNGN(totalCollected)} gift.` : ' keep it forever.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link
                to={`/signup?email=${encodeURIComponent(card.recipient_email || '')}&returnTo=${encodeURIComponent(`/card/${slug}?token=${token}`)}`}
                className="gc-btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 text-sm">
                ✨ Create free account
              </Link>
              <Link
                to={`/login?email=${encodeURIComponent(card.recipient_email || '')}&returnTo=${encodeURIComponent(`/card/${slug}?token=${token}`)}`}
                className="gc-btn-secondary inline-flex items-center justify-center gap-2 px-6 py-3 text-sm">
                I have an account
              </Link>
            </div>
            <p className="text-xs text-warm-400 mt-3">No obligation — you can read the card without signing up</p>
          </div>
        )}

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
              <div className="min-w-0">
                <p className="text-xl font-extrabold break-words" style={{ color: design.ink }}>{openMessage.author_name}</p>
                <p className="text-xs opacity-60" style={{ color: design.ink }}>{format(new Date(openMessage.created_at), 'MMMM d, yyyy')}</p>
              </div>
              <button onClick={() => setOpenMessage(null)} className="w-10 h-10 rounded-full bg-white/80 font-bold flex-shrink-0" aria-label="Close">x</button>
            </div>
            <p
              className="whitespace-pre-wrap break-words mb-6"
              style={{
                color: design.ink,
                fontFamily: getFontStyle(openMessage.font_style).family,
                fontSize: openMessage.font_style === 'calligraphy' ? '2.4rem' : openMessage.font_style === 'handwritten' ? '2rem' : '1.5rem',
                lineHeight: 1.7,
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

  if (layoutType === 'member')  return <>{effectiveViewStyle !== 'album' && <Navbar themeBg={navThemeBg} themeDark={navThemeDark}/>}{content}</>;
  if (layoutType === 'company') return <>{effectiveViewStyle !== 'album' && <Navbar themeBg={navThemeBg} themeDark={navThemeDark}/>}{content}</>;
  return <>{effectiveViewStyle !== 'album' && <Navbar themeBg={navThemeBg} themeDark={navThemeDark}/>}{content}</>;
};

export default CardView;
