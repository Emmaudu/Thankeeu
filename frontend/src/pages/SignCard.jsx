import { useSEO } from '../hooks/useSEO';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMemberAuth } from '../context/MemberAuthContext';
import { useCompanyAuth } from '../context/CompanyAuthContext';
import { cardsAPI, messagesAPI, paymentsAPI, dashboardAPI, authAPI, visitorsAPI } from '../utils/api';
import { FONT_STYLES, cardArtClass, getCardDesign, getFontStyle } from '../utils/cardDesigns';
import VoiceRecorder from '../components/VoiceRecorder';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { formatNGN, CURRENCIES, formatCurrency, getFLWPaymentParams } from '../utils/currency';

const AMOUNTS_NGN = [2500, 5000, 10000, 20000, 50000, 100000];

const SignCard = () => {
  const { slug }       = useParams();
  const { user }       = useAuth();
  const { member }     = useMemberAuth();
  const { company }    = useCompanyAuth();
  // isSignedIn: normal user, team member/leader, or HR company
  const isSignedIn     = !!(user || member || company);
  const [searchParams] = useSearchParams();

  const [card,        setCard]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  // 'idle' | 'sending' | 'paying' | 'verifying' | 'done'
  const [stage,       setStage]       = useState('idle');
  const [giftCurrency,setGiftCurrency] = useState('NGN');
  const [submitted,   setSubmitted]   = useState(false);
  // track whether the signee created an account during this signing flow
  const [createdAccount, setCreatedAccount] = useState(false);

  // Media files (up to 5, carousel)
  const [mediaFiles,   setMediaFiles]   = useState([]);
  const [carouselIdx,  setCarouselIdx]  = useState(0);
  const fileRef = useRef();

  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount,   setCustomAmount]   = useState('');

  // Auto-fill name and email from whoever is signed in
  const signedInName  = user?.full_name ||
    (member ? `${member.first_name} ${member.last_name}`.trim() : null) ||
    company?.contact_person || company?.name || '';
  const signedInEmail = user?.email || member?.email || company?.email || '';

  const [form, setForm] = useState({
    author_name:  signedInName,
    author_email: signedInEmail,
    content:      '',
    is_private:   false,
    font_style:   'handwritten',
  });

  // 'guest' | 'signup' — radio selection shown after gift box
  const [submitMode, setSubmitMode] = useState('guest');

  // Sign-up form fields
  const [signupForm, setSignupForm] = useState({
    full_name: '', username: '', email: '', password: '', confirm_password: '', date_of_birth: '',
  });

  useSEO({
    title: card ? `Sign ${card.recipient_name}'s card on Thankeeu` : 'Sign a Card — Thankeeu',
    description: card ? `Add a beautiful message and gift for ${card.recipient_name}.` : 'Sign a group card on Thankeeu.',
  });

  useEffect(() => {
    const run = async () => {
      // FLW redirects browser directly here with ?tx_ref=... after payment
      const returnTxRef = searchParams.get('tx_ref') || searchParams.get('reference');
      if (returnTxRef) {
        setStage('verifying');
        try {
          await paymentsAPI.verifyContribution(returnTxRef);
          toast.success('Your message and gift are on the card! 🎉');
        } catch (e) {
          toast.success('Gift received! 🎉');
        }
        window.history.replaceState({}, '', `/sign/${slug}`);
        // Must fetch card first so card object exists (needed for success screen design/recipient)
        await fetchCard();
        setSubmitted(true);
        setStage('idle');
        return;
      }
      await fetchCard();
    };
    run();
  }, [slug]);

  const fetchCard = async () => {
    try {
      const res = await cardsAPI.getPublic(slug);
      setCard(res.data);
      setSelectedAmount(res.data.suggested_amount || 2500);
      dashboardAPI.trackCardOpened(slug).catch(() => {});
    } catch {
      toast.error('Card not found or no longer active');
    } finally {
      setLoading(false);
    }
  };

  const addMediaFiles = useCallback((files) => {
    const items = [];
    for (const f of Array.from(files)) {
      if (f.size > 50 * 1024 * 1024) { toast.error(`${f.name} too large (max 50 MB)`); continue; }
      const mime = f.type;
      const type = mime.startsWith('video/') ? 'video'
                 : mime.startsWith('audio/') ? 'voice'
                 : mime === 'image/gif'       ? 'gif'
                 : 'image';
      items.push({ file: f, preview: URL.createObjectURL(f), type, name: f.name });
    }
    setMediaFiles(prev => [...prev, ...items].slice(0, 5));
  }, []);

  const removeMedia = useCallback((idx) => {
    setMediaFiles(prev => {
      const next = [...prev];
      URL.revokeObjectURL(next[idx].preview);
      next.splice(idx, 1);
      setCarouselIdx(i => Math.min(i, Math.max(0, next.length - 1)));
      return next;
    });
  }, []);

  // No ref or verify needed — payment uses redirect flow (no inline popup)

  const handleSubmit = async () => {
    if (!form.author_name.trim()) return toast.error('Please add your name');
    if (!form.content.trim())     return toast.error('Please write a message');

    const amountNGN = Number(customAmount || selectedAmount || 0);
    const wantsGift = card.is_gift_enabled && amountNGN >= 2500;

    // Email required if paying or creating account
    if ((wantsGift || submitMode === 'signup') && !form.author_email.trim())
      return toast.error('Please enter your email address');

    // Validate signup fields if chosen
    if (!isSignedIn && submitMode === 'signup') {
      const { full_name, username, email, password, confirm_password } = signupForm;
      const resolvedName  = full_name  || form.author_name;
      const resolvedEmail = email      || form.author_email;
      if (!resolvedName.trim())       return toast.error('Please enter your full name');
      if (!username.trim())           return toast.error('Please choose a username');
      if (username.trim().length < 3) return toast.error('Username must be at least 3 characters');
      if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) return toast.error('Username can only contain letters, numbers and underscores');
      if (!resolvedEmail.trim())      return toast.error('Please enter your email');
      if (!password)                  return toast.error('Please choose a password');
      if (password.length < 8)        return toast.error('Password must be at least 8 characters');
      if (password !== confirm_password) return toast.error('Passwords do not match');
    }

    setSubmitting(true);
    setStage('sending');

    try {
      // ── STEP 1: Upload message (no gift yet, message saved to DB) ──────────
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      mediaFiles.forEach((m, i) => fd.append(i === 0 ? 'media' : `media_gallery_${i}`, m.file));
      if (!isSignedIn && submitMode === 'guest') fd.append('is_guest', 'true');

      const msgRes = await messagesAPI.add(slug, fd);
      const messageId = msgRes.data?.id;

      // ── STEP 2: Create account if chosen (non-blocking on failure) ─────────
      if (!isSignedIn && submitMode === 'signup') {
        const resolvedName  = signupForm.full_name  || form.author_name;
        const resolvedEmail = signupForm.email      || form.author_email;
        try {
          await authAPI.signup({
            full_name:     resolvedName,
            username:      signupForm.username.trim().toLowerCase(),
            email:         resolvedEmail,
            password:      signupForm.password,
            date_of_birth: signupForm.date_of_birth || null,
          });
          setCreatedAccount(true);
          toast.success('Account created! Check your email to verify. 🎉');
        } catch (err) {
          toast(err.response?.data?.error || 'Could not create account — your message was still saved!');
        }
      }

      // ── STEP 3: Payment (only if gift selected) ────────────────────────────
      if (!wantsGift) {
        setSubmitted(true);
        setSubmitting(false);
        setStage('idle');
        // Bug 5 fix: track guest visitor for follow-up nudge emails
        if (!isSignedIn && submitMode === 'guest' && form.author_email) {
          visitorsAPI.track({
            email:     form.author_email,
            full_name: form.author_name,
            card_slug: slug,
          }).catch(() => {});
        }
        return;
      }

      // ── STEP 3: Get payment link from backend ─────────────────────────
      setStage('paying');
      const { amount: flwAmount, currency: flwCurrency } = getFLWPaymentParams(amountNGN, giftCurrency);
      const payRes = await paymentsAPI.initContribution({
        card_slug:         slug,
        contributor_name:  form.author_name,
        contributor_email: form.author_email,
        amount:            amountNGN,   // always store NGN in DB
        display_currency:  giftCurrency,
        flw_amount:        flwAmount,
        flw_currency:      flwCurrency,
        message_id:        messageId,
      });
      const { payment_link } = payRes.data;
      if (!payment_link) throw new Error('No payment link from server');

      // ── STEP 4: Redirect to FLW hosted checkout ────────────────────────────
      // FLW redirects browser directly back to /sign/slug?tx_ref=TK-GIFT-...
      // This page's useEffect detects ?tx_ref= and calls verifyContribution
      setStage('redirecting');
      window.location.assign(payment_link);

    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not sign card. Please try again.');
      setSubmitting(false);
      setStage('idle');
    }
  };

  // ── Loading / not-found states ─────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen grid place-items-center" style={{ background:'#F5F3FF' }}>
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-warm-500 text-lg">Opening the celebration...</p>
      </div>
    </div>
  );

  if (!card) return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">💌</div>
        <h2 className="text-2xl font-bold text-warm-900 mb-3">Card not found</h2>
        <p className="text-warm-500">This card may have expired or the link is incorrect.</p>
      </div>
    </div>
  );

  const design   = getCardDesign(card.design_theme);
  const cardFont = getFontStyle(card.font_style);
  const msgFont  = getFontStyle(form.font_style);
  const deadline = card.deadline ? new Date(card.deadline) : null;
  const hoursLeft = deadline ? Math.max(0, Math.round((deadline - new Date()) / 3600000)) : null;

  // ── Success / congrats screen ──────────────────────────────────────────────
  if (submitted) return (
    <div className="min-h-screen flex flex-col" style={{ background: design.background }}>
      <Navbar />
      <main className="flex-1 grid place-items-center px-4 py-12">
        <div className={`card-art ${cardArtClass(design)} celebration-shell glass-panel max-w-lg w-full rounded-[2.25rem] p-8 text-center`}>
          <div className="w-20 h-20 bg-emerald-100 rounded-full grid place-items-center text-4xl mx-auto mb-5 animate-pop">✓</div>
          <p className="text-xs font-extrabold tracking-[.2em] uppercase mb-2" style={{ color: design.accent }}>Message delivered!</p>
          <h2 className="text-3xl font-bold text-warm-900 mb-3">You are on {card.recipient_name}'s card! 🎉</h2>
          <p className="text-warm-600 mb-7">Your heartfelt note is now part of their special celebration.</p>

          {/* Only show "create account" promo if they signed as guest (not if they already created one) */}
          {!isSignedIn && !createdAccount && (
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-primary-700 mb-2">💡 Create a free account to:</p>
              <ul className="text-xs text-primary-600 space-y-1">
                <li>✓ Keep all your signed cards in one place</li>
                <li>✓ Receive group cards on your birthday</li>
                <li>✓ Create cards for others easily</li>
              </ul>
              <Link to="/signup" className="mt-3 block w-full text-center py-2.5 rounded-xl text-sm font-bold bg-primary-600 text-white">
                Create free account →
              </Link>
            </div>
          )}

          <button
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Sign ${card.recipient_name}'s special card: ${window.location.origin}/sign/${slug}`)}`, '_blank')}
            className="w-full py-4 rounded-2xl font-bold text-white" style={{ background:'#25D366' }}>
            📣 Invite others on WhatsApp
          </button>
        </div>
      </main>
    </div>
  );

  const amountNGN = Number(customAmount || selectedAmount || 0);
  const wantsGift = card.is_gift_enabled && amountNGN >= 2500;

  const stageLabel = {
    sending:     'Saving your message...',
    paying:      'Preparing payment...',
    redirecting: 'Redirecting to payment...',
    verifying:   'Confirming payment...',
  }[stage];

  // ── Main signing form ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(160deg, #F8F6FF 0%, ${design.background.includes("gradient") ? "#F0EDFF" : design.soft || "#F0EDFF"} 100%)` }}>
      <Navbar />
      <main className="flex-1">

        {/* Hero banner */}
        <section className={`card-art ${cardArtClass(design)} px-4 py-10 sm:py-14`} style={{ background: design.background, color: design.ink }}>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            {hoursLeft !== null && hoursLeft < 48 && (
              <span className="inline-flex bg-white/80 text-amber-800 rounded-full px-4 py-2 text-sm font-extrabold mb-5 shadow-sm">
                ⏰ Signing closes in {hoursLeft < 24 ? `${hoursLeft}h` : `${Math.round(hoursLeft/24)}d`}
              </span>
            )}
            <div className="text-5xl mb-4">{design.icon}</div>
            <p className="text-xs font-extrabold tracking-[.24em] uppercase mb-3" style={{ color: design.accent }}>You're invited to celebrate</p>
            <h1 className="max-w-3xl mx-auto mb-4 text-3xl sm:text-4xl font-bold" style={{ color: design.ink, fontFamily: cardFont.family }}>
              {card.title || `A special card for ${card.recipient_name}`}
            </h1>
            <p className="text-lg opacity-80 mb-6">Add your words, a memory, a voice note, and an optional gift. ✨</p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="bg-white/80 text-warm-800 rounded-full px-4 py-2 text-sm font-bold shadow-sm">{card.signed_count || 0} people signed</span>
              {card.is_gift_enabled && card.total_collected > 0 && (
                <span className="bg-emerald-600 text-white rounded-full px-4 py-2 text-sm font-bold shadow-sm">🎁 {formatNGN(card.total_collected)} gift pot</span>
              )}
            </div>
          </div>
        </section>

        {/* Form — two-column on large screens */}
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 grid lg:grid-cols-[1fr_.82fr] gap-7 items-start">

          {/* ── Left: message form ── */}
          <section className="rounded-[2rem] p-5 sm:p-8" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(245,240,255,0.95) 100%)", border: `2px solid ${design.accent}25`, boxShadow: `0 8px 40px ${design.accent}18` }}>
            <div className="mb-7">
              <span className="text-sm font-extrabold tracking-[.2em] uppercase text-primary-600">Your signature</span>
              <h2 className="text-2xl sm:text-3xl text-warm-900 mt-2 font-bold">Make it personal 💜</h2>
              <p className="text-base text-warm-500 mt-2">Every word becomes part of the keepsake.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-bold text-warm-700 mb-2">Your name *</label>
                <input className="input text-base" placeholder="e.g. Kemi Adeyemi"
                  value={form.author_name} onChange={e => setForm(p=>({...p, author_name: e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm font-bold text-warm-700 mb-2">
                  Your email {card.is_gift_enabled ? '(required for gifts)' : '(optional)'}
                </label>
                <input type="email" className="input text-base" placeholder="kemi@email.com"
                  value={form.author_email} onChange={e => setForm(p=>({...p, author_email: e.target.value}))} />
              </div>
            </div>

            {/* Font style */}
            <label className="block text-sm font-bold text-warm-700 mb-2">Writing style</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
              {FONT_STYLES.map(font => (
                <button type="button" key={font.id} onClick={() => setForm(p=>({...p, font_style: font.id}))}
                  className={`rounded-xl border-2 px-2 py-3 text-center text-sm transition-all ${form.font_style === font.id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-purple-100 bg-white text-warm-600 hover:border-primary-200'}`}
                  style={{ fontFamily: font.family }}>
                  {font.id === 'calligraphy' ? 'With love' : font.name}
                </button>
              ))}
            </div>

            {/* Message */}
            <label className="block text-sm font-bold text-warm-700 mb-2">Your message to {card.recipient_name} *</label>
            <textarea className="input text-base h-44 resize-none"
              style={{ fontFamily: msgFont.family, fontSize: form.font_style === 'calligraphy' ? '1.55rem' : '1rem' }}
              placeholder={`Write something unforgettable for ${card.recipient_name}...`}
              maxLength={1200} value={form.content}
              onChange={e => setForm(p=>({...p, content: e.target.value}))} />
            <div className="flex justify-end mt-1 mb-5">
              <span className="text-sm text-warm-400">{form.content.length}/1200</span>
            </div>

            {/* Media upload */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button type="button" onClick={() => fileRef.current.click()} className="voice-record-button">
                <span>📷</span>
                <span>Add photos/video {mediaFiles.length > 0 ? `(${mediaFiles.length}/5)` : '(up to 5)'}</span>
              </button>
              <VoiceRecorder onRecorded={f => addMediaFiles([f])} disabled={submitting} />
              <input ref={fileRef} type="file" accept="image/*,video/*,audio/*,.m4a,.ogg,.webm"
                multiple className="hidden" onChange={e => addMediaFiles(e.target.files)} />
            </div>

            {/* Carousel preview */}
            {mediaFiles.length > 0 && (
              <div className="mb-5 rounded-2xl overflow-hidden border-2 border-purple-100 bg-white">
                <div className="relative" style={{ aspectRatio:'16/9', background:'#1A1035' }}>
                  {mediaFiles[carouselIdx].type === 'video' ? (
                    <video src={mediaFiles[carouselIdx].preview} className="w-full h-full object-contain" controls />
                  ) : mediaFiles[carouselIdx].type === 'voice' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                      <span className="text-5xl">🎙️</span>
                      <audio src={mediaFiles[carouselIdx].preview} controls className="w-4/5" />
                    </div>
                  ) : (
                    <img src={mediaFiles[carouselIdx].preview} alt="" className="w-full h-full object-contain" />
                  )}
                  <button type="button" onClick={() => removeMedia(carouselIdx)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-red-500 transition-colors">✕</button>
                  {mediaFiles.length > 1 && (
                    <>
                      <button type="button" onClick={() => setCarouselIdx(i => (i - 1 + mediaFiles.length) % mediaFiles.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center text-lg hover:bg-black/70">‹</button>
                      <button type="button" onClick={() => setCarouselIdx(i => (i + 1) % mediaFiles.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center text-lg hover:bg-black/70">›</button>
                    </>
                  )}
                </div>
                {mediaFiles.length > 1 && (
                  <div className="flex gap-2 p-2 overflow-x-auto" style={{ scrollbarWidth:'none' }}>
                    {mediaFiles.map((m, i) => (
                      <button key={i} type="button" onClick={() => setCarouselIdx(i)}
                        className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === carouselIdx ? 'border-primary-500' : 'border-transparent opacity-60 hover:opacity-90'}`}>
                        {m.type === 'voice' ? (
                          <div className="w-full h-full flex items-center justify-center bg-purple-50 text-xl">🎙️</div>
                        ) : m.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-xl">▶️</div>
                        ) : (
                          <img src={m.preview} alt="" className="w-full h-full object-cover" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-center text-xs text-warm-400 py-2">
                  {carouselIdx + 1} of {mediaFiles.length} — Add up to {5 - mediaFiles.length} more
                </p>
              </div>
            )}

            {/* Private message toggle */}
            {card.allow_private_messages && (
              <label className="flex items-center justify-between gap-4 border-t border-purple-100 pt-4">
                <span>
                  <span className="block text-base font-bold text-warm-800">Private message</span>
                  <span className="block text-sm text-warm-400">Only the celebrant and card creator can read it</span>
                </span>
                <input type="checkbox" checked={form.is_private}
                  onChange={e => setForm(p=>({...p, is_private: e.target.checked}))}
                  className="w-5 h-5 accent-violet-600" />
              </label>
            )}
          </section>

          {/* ── Right: preview + gift + mode chooser + submit ── */}
          <aside className="space-y-5 lg:sticky lg:top-24">

            {/* Live preview — image first, text below, overflow-contained */}
            <div
              className={`card-art ${cardArtClass(design)} celebration-shell rounded-[2rem] overflow-hidden flex flex-col`}
              style={{ background: design.background, color: design.ink, minWidth: 0, width: '100%' }}
            >
              {/* Header badge */}
              <div className="flex justify-between items-center px-5 pt-5 pb-3 flex-shrink-0">
                <span className="text-2xl">{design.icon}</span>
                <span className="text-xs font-extrabold tracking-[.18em] uppercase opacity-60" style={{ color: design.ink }}>Live preview</span>
              </div>

              {/* Media FIRST — shown above text */}
              {mediaFiles.length > 0 && (
                <div className="flex-shrink-0 px-4 pb-3">
                  {mediaFiles[0].type === 'image' || mediaFiles[0].type === 'gif' ? (
                    <img src={mediaFiles[0].preview} alt="" className="w-full rounded-2xl object-cover max-h-52" />
                  ) : mediaFiles[0].type === 'video' ? (
                    <video src={mediaFiles[0].preview} className="w-full rounded-2xl max-h-52 object-cover" />
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-2xl text-sm font-medium" style={{background:'rgba(255,255,255,0.3)', color: design.ink}}>🎙️ Voice note attached</div>
                  )}
                  {mediaFiles.length > 1 && (
                    <p className="text-xs opacity-60 mt-1 text-center" style={{ color: design.ink }}>+{mediaFiles.length-1} more photo{mediaFiles.length > 2 ? 's' : ''}</p>
                  )}
                </div>
              )}

              {/* Text below media */}
              <div className="flex-1 min-w-0 px-5 pb-3">
                <p
                  className="whitespace-pre-wrap break-words w-full"
                  style={{
                    color: design.ink,
                    fontFamily: msgFont.family,
                    fontSize: form.font_style === 'calligraphy' ? '1.4rem' : form.font_style === 'handwritten' ? '1.1rem' : '0.95rem',
                    lineHeight: 1.55,
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}
                >
                  {form.content || `Your beautiful message for ${card.recipient_name} will appear here...`}
                </p>
              </div>

              {/* Author signature */}
              <div className="border-t mx-5 mt-1 mb-4 pt-3 flex-shrink-0" style={{ borderColor: `${design.accent}35` }}>
                <p className="font-bold text-sm" style={{ color: design.ink }}>{form.author_name || 'Your name'}</p>
              </div>
            </div>

            {/* Gift section */}
            {card.is_gift_enabled && (
              <div className="rounded-[2rem] p-5 sm:p-6" style={{ background: `linear-gradient(135deg, ${design.background.includes("gradient") ? "rgba(255,255,255,0.96)" : design.background}, rgba(255,255,255,0.96))`, border: `2px solid ${design.accent}30`, boxShadow: `0 4px 24px ${design.accent}15` }}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: design.accent }}>Add a gift 🎁</h3>
                    <p className="text-sm text-warm-500 mt-1">Optional · Secure via Flutterwave</p>
                  </div>
                </div>
                {card.total_collected > 0 && (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 mb-4 flex justify-between">
                    <span className="text-sm font-bold text-emerald-700">Gift pot so far</span>
                    <span className="font-bold text-emerald-800">{formatNGN(card.total_collected)}</span>
                  </div>
                )}
                <button type="button" onClick={() => { setSelectedAmount(null); setCustomAmount(''); }}
                  className={`w-full mb-3 py-2.5 rounded-xl text-sm font-bold border-2 ${selectedAmount === null && !customAmount ? 'bg-warm-900 text-white border-warm-900' : 'bg-white border-purple-100 text-warm-700 hover:border-purple-200'}`}>
                  Sign without a gift
                </button>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {AMOUNTS_NGN.map(amount => (
                    <button type="button" key={amount}
                      onClick={() => { setSelectedAmount(amount); setCustomAmount(''); }}
                      className={`py-2.5 rounded-xl text-sm font-bold border-2 ${selectedAmount === amount && !customAmount ? 'bg-primary-600 text-white border-primary-600' : 'bg-white border-purple-100 text-warm-700 hover:border-primary-200'}`}>
                      {formatNGN(amount)}
                    </button>
                  ))}
                </div>
                <input type="number" min="2500" className="input text-base" placeholder="Or enter custom amount"
                  value={customAmount} onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null); }} />
              </div>
            )}

            {/* ── Continue mode — radio toggles shown for unauthenticated users ── */}
            {!isSignedIn && (
              <div className="rounded-[2rem] p-5 space-y-3" style={{ background: "rgba(255,255,255,0.95)", border: `2px solid ${design.accent}25`, boxShadow: `0 4px 20px ${design.accent}12` }}>
                <p className="text-sm font-extrabold uppercase tracking-widest" style={{ color: design.accent }}>How to continue</p>

                {/* Guest radio */}
                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${submitMode === 'guest' ? 'border-primary-400 bg-primary-50' : 'border-purple-100 bg-white hover:border-purple-200'}`}>
                  <input type="radio" name="submitMode" value="guest"
                    checked={submitMode === 'guest'} onChange={() => setSubmitMode('guest')}
                    className="accent-violet-600 w-4 h-4 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-warm-900 text-sm">Continue as Guest</p>
                    <p className="text-xs text-warm-500">Just sign the card. No account needed.</p>
                  </div>
                </label>

                {/* Create account radio */}
                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${submitMode === 'signup' ? 'border-primary-400 bg-primary-50' : 'border-purple-100 bg-white hover:border-purple-200'}`}>
                  <input type="radio" name="submitMode" value="signup"
                    checked={submitMode === 'signup'} onChange={() => setSubmitMode('signup')}
                    className="accent-violet-600 w-4 h-4 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-warm-900 text-sm">Create account &amp; sign card</p>
                    <p className="text-xs text-warm-500">Get your own group cards &amp; gift pots!</p>
                  </div>
                </label>

                {/* Signup form — shown when radio = signup */}
                {submitMode === 'signup' && (
                  <div className="rounded-2xl border-2 border-primary-200 bg-primary-50 p-4 space-y-3">
                    <input className="input text-base" placeholder="Full name *"
                      value={signupForm.full_name || form.author_name}
                      onChange={e => setSignupForm(p=>({...p, full_name: e.target.value}))} />
                    <input className="input text-base" placeholder="Username * (letters, numbers, _)"
                      value={signupForm.username}
                      onChange={e => setSignupForm(p=>({...p, username: e.target.value.replace(/[^a-zA-Z0-9_]/g,'')}))} />
                    <input type="email" className="input text-base" placeholder="Email address *"
                      value={signupForm.email || form.author_email}
                      onChange={e => setSignupForm(p=>({...p, email: e.target.value}))} />
                    <input type="password" className="input text-base" placeholder="Create a password * (min 8 chars)"
                      value={signupForm.password}
                      onChange={e => setSignupForm(p=>({...p, password: e.target.value}))} />
                    <input type="password" className="input text-base" placeholder="Confirm password *"
                      value={signupForm.confirm_password}
                      onChange={e => setSignupForm(p=>({...p, confirm_password: e.target.value}))} />
                    <div>
                      <label className="block text-xs text-warm-600 mb-1">🎂 Your birthday (optional — so we celebrate you!)</label>
                      <input type="date" className="input text-base"
                        value={signupForm.date_of_birth}
                        onChange={e => setSignupForm(p=>({...p, date_of_birth: e.target.value}))} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Independent submit button ── */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 text-base rounded-2xl font-extrabold disabled:opacity-60 transition-all"
              style={{ background: `linear-gradient(135deg, ${design.accent}, ${design.accent}cc)`, color: "#fff", boxShadow: `0 4px 20px ${design.accent}55`, border: "none" }}
            >
              {submitting
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    {stageLabel || 'Processing...'}
                  </span>
                : wantsGift
                  ? `✍️ Sign card + pay ${formatNGN(amountNGN)} gift`
                  : `✍️ Sign this card`
              }
            </button>

            <p className="text-center text-sm text-warm-400">Secured by Flutterwave · Your message is private until delivery</p>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default SignCard;
