import { useSEO } from '../hooks/useSEO';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMemberAuth } from '../context/MemberAuthContext';
import { cardsAPI, messagesAPI, paymentsAPI, dashboardAPI, authAPI } from '../utils/api';
import { FONT_STYLES, cardArtClass, getCardDesign, getFontStyle } from '../utils/cardDesigns';
import VoiceRecorder from '../components/VoiceRecorder';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { formatNGN } from '../utils/currency';

const AMOUNTS_NGN = [2500, 5000, 10000, 20000, 50000, 100000];

const SignCard = () => {
  const { slug }      = useParams();
  const navigate      = useNavigate();
  const { user }      = useAuth();
  const { member }    = useMemberAuth();
  const isSignedIn    = !!(user || member);
  const [searchParams] = useSearchParams();

  const [card,       setCard]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  // Media files (up to 5, carousel)
  const [mediaFiles, setMediaFiles] = useState([]);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const fileRef = useRef();

  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount,   setCustomAmount]   = useState('');

  const [form, setForm] = useState({
    author_name:  '',
    author_email: '',
    content:      '',
    is_private:   false,
    font_style:   'handwritten',
  });

  // Guest vs sign-up mode
  // 'guest' | 'signup' | null (not chosen yet — shown just before submit)
  const [submitMode, setSubmitMode] = useState(null); // null = pre-choice
  const [showModeChooser, setShowModeChooser] = useState(false);

  // Sign-up form
  const [signupForm, setSignupForm] = useState({
    full_name: '', email: '', password: '', date_of_birth: ''
  });
  const [signingUp, setSigningUp] = useState(false);

  useSEO({
    title: card ? `Sign ${card.recipient_name}'s card on Thankeeu` : 'Sign a Card — Thankeeu',
    description: card ? `Add a beautiful message and gift for ${card.recipient_name}.` : 'Sign a group card on Thankeeu.',
  });

  useEffect(() => {
    const run = async () => {
      if (searchParams.get('contributed') === 'true') {
        const ref = searchParams.get('reference') || searchParams.get('trxref');
        if (ref) {
          try {
            await paymentsAPI.verify(ref);
            toast.success('Gift contribution confirmed! 🎉');
            window.history.replaceState({}, '', `/sign/${slug}`);
            setSubmitted(true);
          } catch (e) {
            toast.error(e.response?.data?.error || 'Could not verify contribution');
          }
        }
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

  // Media management — up to 5 files
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
    setMediaFiles(prev => {
      const combined = [...prev, ...items].slice(0, 5);
      return combined;
    });
  }, []);

  const removeMedia = useCallback((idx) => {
    setMediaFiles(prev => {
      const next = [...prev];
      URL.revokeObjectURL(next[idx].preview);
      next.splice(idx, 1);
      setCarouselIdx(i => Math.min(i, next.length - 1));
      return next;
    });
  }, []);

  // Contribution verification
  const verifyContribution = async (ref) => {
    for (let i = 0; i < 4; i++) {
      try { await paymentsAPI.verify(ref); return; }
      catch (e) { if (i === 3) throw e; await new Promise(r => setTimeout(r, 600 * (i + 1))); }
    }
  };

  // Pre-submit: show mode chooser if not already logged in
  const handleSubmitClick = () => {
    if (!form.author_name.trim()) return toast.error('Please add your name');
    if (!form.content.trim()) return toast.error('Please write a message');
    if (isSignedIn) { doSubmit('authenticated'); return; }
    if (!showModeChooser) { setShowModeChooser(true); return; }
    // already showing — user hasn't chosen yet
  };

  const doSubmit = async (mode) => {
    const amountNGN = Number(customAmount || selectedAmount || 0);
    const wantsGift = card.is_gift_enabled && amountNGN >= 2500;
    const emailNeeded = wantsGift || mode === 'signup';
    if (emailNeeded && !form.author_email.trim())
      return toast.error('Please enter your email address');

    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      mediaFiles.forEach((m, i) => fd.append(i === 0 ? 'media' : `media_gallery_${i}`, m.file));
      // mark as guest if not authenticated
      if (mode === 'guest' && !isSignedIn) fd.append('is_guest', 'true');

      const msgRes = await messagesAPI.add(slug, fd);

      // Attempt to create account if signup mode
      if (mode === 'signup' && signupForm.password) {
        setSigningUp(true);
        try {
          await authAPI.signup({
            full_name:     signupForm.full_name || form.author_name,
            email:         signupForm.email    || form.author_email,
            password:      signupForm.password,
            date_of_birth: signupForm.date_of_birth || null,
          });
          toast.success('Account created! Check your email to verify. 🎉');
        } catch (err) {
          toast(err.response?.data?.error || 'Could not create account but your message was saved!');
        } finally { setSigningUp(false); }
      }

      if (!wantsGift) {
        setSubmitted(true);
        return;
      }

      // Handle gift payment
      const payRes = await paymentsAPI.initContribution({
        card_slug:          slug,
        contributor_name:   form.author_name,
        contributor_email:  form.author_email,
        amount:             amountNGN,
        message_id:         msgRes.data?.id,
      });
      const { payment_link, tx_ref, integrity_hash } = payRes.data;

      // Flutterwave inline checkout
      if (window.FlutterwaveCheckout && payment_link) {
        const cfg = {
          public_key:      import.meta.env.VITE_FLW_PUBLIC_KEY,
          tx_ref,
          amount:          amountNGN,
          currency:        'NGN',
          payment_options: 'card,ussd,bank_transfer',
          customer:        { email: form.author_email, name: form.author_name },
          customizations:  { title: `Gift for ${card?.recipient_name}`, logo: '/logo.png' },
          callback: async () => {
            window.FlutterwaveCheckout?.close?.();
            try {
              await verifyContribution(tx_ref);
              toast.success('Your message and gift are on the card! 🎉');
              setSubmitted(true); fetchCard();
            } catch {
              toast.error('Gift paid but verification pending — your card is saved!');
              setSubmitted(true);
            } finally { setSubmitting(false); }
          },
          onclose: () => { toast('Message saved. Gift was not completed.'); setSubmitted(true); setSubmitting(false); },
        };
        if (integrity_hash) cfg.meta = { integrity_hash };
        window.FlutterwaveCheckout(cfg);
        return;
      }
      if (payment_link) window.location.assign(payment_link);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not sign card. Please try again.');
      setSubmitting(false);
    }
  };

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

  const design     = getCardDesign(card.design_theme);
  const cardFont   = getFontStyle(card.font_style);
  const msgFont    = getFontStyle(form.font_style);
  const deadline   = card.deadline ? new Date(card.deadline) : null;
  const hoursLeft  = deadline ? Math.max(0, Math.round((deadline - new Date()) / 3600000)) : null;

  if (submitted) return (
    <div className="min-h-screen flex flex-col" style={{ background: design.background }}>
      <Navbar />
      <main className="flex-1 grid place-items-center px-4 py-12">
        <div className={`card-art ${cardArtClass(design)} celebration-shell glass-panel max-w-lg w-full rounded-[2.25rem] p-8 text-center`}>
          <div className="w-20 h-20 bg-emerald-100 rounded-full grid place-items-center text-4xl mx-auto mb-5 animate-pop">✓</div>
          <p className="text-xs font-extrabold tracking-[.2em] uppercase mb-2" style={{ color: design.accent }}>Message delivered!</p>
          <h2 className="text-3xl font-bold text-warm-900 mb-3">You are on {card.recipient_name}'s card! 🎉</h2>
          <p className="text-warm-600 mb-7">Your heartfelt note is now part of their special celebration.</p>
          {!isSignedIn && (
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-primary-700 mb-2">💡 Create a free account to:</p>
              <ul className="text-xs text-primary-600 space-y-1">
                <li>✓ Keep all your signed cards in one place</li>
                <li>✓ Receive group cards on your birthday</li>
                <li>✓ Create cards for others easily</li>
              </ul>
              <Link to={`/signup`} className="mt-3 block w-full text-center py-2.5 rounded-xl text-sm font-bold bg-primary-600 text-white">
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

  return (
    <div className="min-h-screen flex flex-col" style={{ background:'#F8F6FF' }}>
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
            <p className="text-lg opacity-80 mb-6">
              Add your words, a memory, a voice note, and an optional gift. ✨
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="bg-white/80 text-warm-800 rounded-full px-4 py-2 text-sm font-bold shadow-sm">{card.signed_count || 0} people signed</span>
              {card.is_gift_enabled && card.total_collected > 0 && (
                <span className="bg-emerald-600 text-white rounded-full px-4 py-2 text-sm font-bold shadow-sm">🎁 {formatNGN(card.total_collected)} gift pot</span>
              )}
            </div>
          </div>
        </section>

        {/* Form */}
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 grid lg:grid-cols-[1fr_.82fr] gap-7 items-start">
          <section className="glass-panel rounded-[2rem] p-5 sm:p-8">

            {/* Identity */}
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
                  Your email {card.is_gift_enabled ? '(for gifts)' : '(optional)'}
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

            {/* Carousel preview of uploaded media */}
            {mediaFiles.length > 0 && (
              <div className="mb-5 rounded-2xl overflow-hidden border-2 border-purple-100 bg-white">
                {/* Main preview */}
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
                  {/* Remove button */}
                  <button type="button" onClick={() => removeMedia(carouselIdx)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-red-500 transition-colors">
                    ✕
                  </button>
                  {/* Navigation arrows */}
                  {mediaFiles.length > 1 && (
                    <>
                      <button type="button" onClick={() => setCarouselIdx(i => (i - 1 + mediaFiles.length) % mediaFiles.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center text-lg hover:bg-black/70">‹</button>
                      <button type="button" onClick={() => setCarouselIdx(i => (i + 1) % mediaFiles.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center text-lg hover:bg-black/70">›</button>
                    </>
                  )}
                </div>
                {/* Thumbnails */}
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

          {/* Right panel */}
          <aside className="space-y-5 lg:sticky lg:top-24">

            {/* Live preview */}
            <div className={`card-art ${cardArtClass(design)} celebration-shell rounded-[2rem] p-6 min-h-[320px] flex flex-col overflow-hidden`}
              style={{ background: design.background, color: design.ink }}>
              <div className="flex justify-between items-center mb-5">
                <span className="text-3xl">{design.icon}</span>
                <span className="text-xs font-extrabold tracking-[.18em] uppercase opacity-60">Live preview</span>
              </div>
              <p className="whitespace-pre-wrap break-words w-full flex-1 text-base" style={{ color: design.ink, fontFamily: msgFont.family, fontSize: form.font_style === 'calligraphy' ? '1.5rem' : form.font_style === 'handwritten' ? '1.2rem' : '1rem', lineHeight: 1.55 }}>
                {form.content || `Your beautiful message for ${card.recipient_name} will appear here...`}
              </p>
              {mediaFiles.length > 0 && (
                <div className="mt-3">
                  {mediaFiles[0].type === 'image' || mediaFiles[0].type === 'gif'
                    ? <img src={mediaFiles[0].preview} alt="" className="w-full rounded-xl object-cover max-h-48" />
                    : mediaFiles[0].type === 'video'
                    ? <video src={mediaFiles[0].preview} className="w-full rounded-xl max-h-48 object-cover" />
                    : <div className="flex items-center gap-2 p-2.5 rounded-xl text-sm" style={{background:'rgba(255,255,255,0.3)'}}>🎙️ Voice note attached</div>
                  }
                  {mediaFiles.length > 1 && <p className="text-xs opacity-60 mt-1 text-center">+{mediaFiles.length-1} more photo{mediaFiles.length > 2 ? 's' : ''}</p>}
                </div>
              )}
              <div className="border-t mt-4 pt-3" style={{ borderColor: `${design.accent}35` }}>
                <p className="font-bold text-base" style={{ color: design.ink }}>{form.author_name || 'Your name'}</p>
              </div>
            </div>

            {/* Gift section */}
            {card.is_gift_enabled && (
              <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-warm-900">Add a gift 🎁</h3>
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

            {/* Submit / Mode chooser */}
            {!showModeChooser || isSignedIn ? (
              <button onClick={handleSubmitClick} disabled={submitting}
                className="w-full btn-rose py-4 text-base rounded-2xl font-bold">
                {submitting
                  ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Adding your magic...</span>
                  : `✍️ Sign this card${card.is_gift_enabled && (customAmount || selectedAmount) ? ` + ${formatNGN(Number(customAmount||selectedAmount))} gift` : ''}`
                }
              </button>
            ) : (
              /* Mode chooser — shown just before submit for unauthenticated visitors */
              <div className="glass-panel rounded-[2rem] p-5 border-2 border-primary-200 space-y-4">
                <div className="text-center">
                  <p className="text-base font-bold text-warm-900 mb-1">One more step! 🎉</p>
                  <p className="text-sm text-warm-500">Choose how you'd like to continue</p>
                </div>

                {/* Guest option */}
                <button onClick={() => doSubmit('guest')} disabled={submitting}
                  className="w-full flex items-start gap-3 p-4 rounded-xl border-2 border-purple-100 hover:border-primary-300 hover:bg-primary-50 transition-all text-left">
                  <span className="text-2xl flex-shrink-0 mt-0.5">👤</span>
                  <div>
                    <p className="text-base font-bold text-warm-900">Continue as Guest</p>
                    <p className="text-sm text-warm-500">Just sign the card. No account needed.</p>
                  </div>
                </button>

                {/* Sign up option */}
                <div className="border-2 border-purple-200 rounded-xl overflow-hidden">
                  <button onClick={() => setSubmitMode(submitMode === 'signup' ? null : 'signup')}
                    className="w-full flex items-start gap-3 p-4 hover:bg-purple-50 transition-all text-left">
                    <span className="text-2xl flex-shrink-0 mt-0.5">✨</span>
                    <div className="flex-1">
                      <p className="text-base font-bold text-warm-900">Create account &amp; sign card</p>
                      <p className="text-sm text-warm-500">Get your own group cards &amp; gift pots!</p>
                    </div>
                    <span className="text-primary-500 font-bold text-lg">{submitMode === 'signup' ? '▲' : '▼'}</span>
                  </button>

                  {submitMode === 'signup' && (
                    <div className="px-4 pb-4 pt-0 space-y-3 bg-purple-50 border-t border-purple-100">
                      <input className="input text-base" placeholder="Full name *"
                        value={signupForm.full_name} onChange={e => setSignupForm(p=>({...p,full_name:e.target.value}))} />
                      <input type="email" className="input text-base" placeholder="Email address *"
                        value={signupForm.email || form.author_email}
                        onChange={e => setSignupForm(p=>({...p,email:e.target.value}))} />
                      <input type="password" className="input text-base" placeholder="Create a password *"
                        value={signupForm.password} onChange={e => setSignupForm(p=>({...p,password:e.target.value}))} />
                      <div>
                        <label className="block text-sm text-warm-600 mb-1">🎂 Your birthday (so we can celebrate you!)</label>
                        <input type="date" className="input text-base"
                          value={signupForm.date_of_birth} onChange={e => setSignupForm(p=>({...p,date_of_birth:e.target.value}))} />
                      </div>
                      <button onClick={() => doSubmit('signup')} disabled={submitting || !signupForm.password}
                        className="w-full btn-primary py-3 text-base font-bold rounded-xl disabled:opacity-50">
                        {submitting ? 'Signing card & creating account...' : '🚀 Sign card & create account'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="text-center text-sm text-warm-400">Secured by Flutterwave · Your message is private until delivery</p>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default SignCard;
