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


import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { formatNGN } from '../utils/currency';

// ── Calligraphic font styles for signer names (decorative only — the actual
// message text uses the signee's chosen font_style via getFontStyle) ────────
const FONT_INJECT = `
@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Great+Vibes&family=Satisfy&family=Sacramento&family=Kaushan+Script&display=swap');
.font-dancing   { font-family:'Dancing Script', cursive; }
.font-vibes     { font-family:'Great Vibes', cursive; }
.font-satisfy   { font-family:'Satisfy', cursive; }
.font-sacramento{ font-family:'Sacramento', cursive; }
.font-kaushan   { font-family:'Kaushan Script', cursive; }
`;

const CALLI_FONTS = ['font-dancing', 'font-vibes', 'font-satisfy', 'font-sacramento', 'font-kaushan'];

// ── Confetti — lightweight, matches the Sample card page ─────────────────────
function Confetti() {
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 6 + Math.random() * 8,
    color: ['#7C3AED', '#EC4899', '#FBBF24', '#34D399', '#60A5FA'][i % 5],
    duration: 3 + Math.random() * 3,
    delay: Math.random() * 2,
    rotate: Math.random() * 360,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: `${p.left}%`, top: '-20px',
          width: p.size, height: p.size, background: p.color,
          borderRadius: p.id % 3 === 0 ? '50%' : p.id % 3 === 1 ? '2px' : '50% 0 50% 0',
          transform: `rotate(${p.rotate}deg)`,
          animation: `cardview-fall ${p.duration}s ${p.delay}s infinite linear`,
          opacity: 0.8,
        }} />
      ))}
      <style>{`
        @keyframes cardview-fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity:1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity:0; }
        }
      `}</style>
    </div>
  );
}

// ── Gift Claim Panel — Bank Transfer (FLW) or Gift Card (Reloadly) ───────────
const GiftClaimPanel = ({ slug, token, amount, user, member }) => {
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
            <p className="text-xs font-bold text-amber-800 mb-1">⚠️ No bank account saved</p>
            <p className="text-xs text-amber-700">Go to Settings → Bank Accounts, add your details, then come back.</p>
          </div>
          <Link to={user ? '/dashboard/settings' : '/member/settings'}
            className="btn-primary text-xs py-2.5 px-4 w-full text-center block">
            🏦 Add bank account in Settings
          </Link>
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
            <div className="flex justify-between font-bold text-warm-900 pt-1 border-t border-gray-200"><span>You receive</span><span>{formatNGN(net)}</span></div>
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

const MessageCard = ({ message, index, design, canViewPrivate, onOpen, onReact }) => {
  const [reacted, setReacted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const font = getFontStyle(message.font_style);
  const hasMedia = !!(message.media_url || message.media_gallery);
  const isLong = (message.content?.length || 0) > 140;
  const preview = isLong ? message.content.slice(0, 140).trimEnd() + '…' : message.content;
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
      className={`message-art-card card-art ${cardArtClass(design)} rounded-[1.75rem] overflow-hidden border-2 flex flex-col relative`}
      style={{ background: design.background, color: design.ink, borderColor: `${design.accent}40`, transform: `rotate(${rotation})` }}
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
      <div className="px-4 pt-3 pb-1 flex-shrink-0 relative z-10">
        {hasMedia ? (
          // Media present: keep the compact clamp + open the modal for the full view
          <button type="button" onClick={() => onOpen(message)} className="text-left w-full">
            <p
              style={{
                color: design.ink,
                fontFamily: font.family,
                fontSize: message.font_style === 'calligraphy' ? '1.35rem' : message.font_style === 'handwritten' ? '1.05rem' : '0.875rem',
                lineHeight: message.font_style === 'calligraphy' ? 1.45 : 1.6,
                display: '-webkit-box',
                WebkitLineClamp: 2,
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
                fontSize: message.font_style === 'calligraphy' ? '1.35rem' : message.font_style === 'handwritten' ? '1.05rem' : '0.875rem',
                lineHeight: message.font_style === 'calligraphy' ? 1.45 : 1.6,
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
  const [showAll, setShowAll] = useState(false);
  const [openMessage, setOpenMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [confetti, setConfetti] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setConfetti(false), 9000);
    return () => clearTimeout(t);
  }, []);

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
    <div className="min-h-screen grid place-items-center" style={{ background:'#F5F3FF' }}>
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
  const displayMessages = showAll ? messages : messages.slice(0, 8);
  const totalCollected = card.total_collected || 0;
  const design = getCardDesign(card.design_theme);
  const titleFont = getFontStyle(card.font_style);
  const canViewPrivate = Boolean(token || card.isCreator || card.isRecipient);


  const cardTitle = card?.title || `${card?.recipient_name || ''}'s Card`;
  const layoutType = member ? 'member' : company ? 'company' : 'user';

  const content = (
    <div className="min-h-0 flex flex-col bg-[#faf8ff]">
      <style>{FONT_INJECT}</style>
      {confetti && <Confetti />}

      <header className={`card-art ${cardArtClass(design)} relative px-4 py-16 sm:py-24`} style={{ background: design.background, color: design.ink }}>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <span className="inline-flex bg-white/75 rounded-full px-4 py-2 text-[11px] font-extrabold tracking-[.2em] uppercase shadow-sm mb-7" style={{ color: design.accent }}>
            A keepsake made with love
          </span>
          <div className="text-6xl sm:text-7xl mb-5 animate-float">{design.icon}</div>
          <h1 className="max-w-4xl mx-auto" style={{ color: design.ink, fontFamily: titleFont.family }}>
            {card.title || `Celebrating ${card.recipient_name}`}
          </h1>
          <p className={`max-w-2xl mx-auto mt-5 text-base sm:text-lg ${design.dark ? 'text-white/75' : 'text-warm-600'}`}>
            {messages.length} {messages.length === 1 ? 'person has' : 'people have'} filled this card with memories, laughter, and love.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-7">
            <span className="bg-white/80 rounded-full px-5 py-2.5 text-sm font-bold shadow-sm" style={{ color: design.ink }}>{'\uD83D\uDC8C'} {messages.length} messages</span>
            {totalCollected > 0 && <span className="bg-emerald-600 text-white rounded-full px-5 py-2.5 text-sm font-bold shadow-sm">{'\uD83C\uDF81'} {formatNGN(totalCollected)} gift</span>}
          </div>
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
                  slug={slug} token={token} amount={totalCollected}
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
          {/* Box 1 — Public signing link (only while the card is still open for signing) */}
          {card.status === 'active' && (
            <div className="rounded-2xl border-2 p-4 sm:p-5" style={{ borderColor: '#A855F740', background: 'linear-gradient(135deg,#F5F3FF,#FCE7F3)' }}>
              <p className="text-xs font-extrabold tracking-[.15em] uppercase text-primary-600 mb-1">✍️ Signing link — for everyone</p>
              <p className="text-sm text-warm-600 mb-3">
                This link lets anyone write a message on the card. Share it with colleagues, friends or family so they can add their wishes before delivery.
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
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-extrabold tracking-[.2em] uppercase text-primary-600">The message wall</span>
              <h2 className="text-3xl text-warm-900 mt-2">Words to keep forever</h2>
            </div>
            <span className="text-xs font-bold text-warm-400">{messages.length} notes</span>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-[2rem]">
              <div className="text-5xl mb-3">{'\u2709\uFE0F'}</div>
              <p className="text-warm-500">The first beautiful message is on its way.</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
                {displayMessages.map((message, index) => (
                  <MessageCard
                    key={message.id}
                    message={message}
                    index={index}
                    design={design}
                    canViewPrivate={canViewPrivate}
                    onOpen={setOpenMessage}
                    onReact={id => messagesAPI.react(id, { emoji: 'heart' })}
                  />
                ))}
              </div>
              {messages.length > 8 && !showAll && (
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
