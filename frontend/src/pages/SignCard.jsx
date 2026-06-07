import { useSEO } from '../hooks/useSEO';
import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { cardsAPI, messagesAPI, paymentsAPI } from '../utils/api';
import { FONT_STYLES, cardArtClass, getCardDesign, getFontStyle } from '../utils/cardDesigns';
import VoiceRecorder from '../components/VoiceRecorder';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import { formatNGN } from '../utils/currency';

const AMOUNTS_NGN = [2500, 5000, 10000, 20000, 50000, 100000];

const SignCard = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const fileRef = useRef();
  const [form, setForm] = useState({
    author_name: '',
    author_email: '',
    content: '',
    is_private: false,
    font_style: 'handwritten',
  });

  useSEO({
    title: card ? `Sign ${card.recipient_name}'s card on Thankeeu` : 'Sign a Card - Thankeeu',
    description: card ? `Add a beautiful message and gift for ${card.recipient_name}.` : 'Sign a group card on Thankeeu.',
    noIndex: false,
  });

  useEffect(() => {
    const completeContribution = async () => {
      if (searchParams.get('contributed') === 'true') {
        const reference = searchParams.get('reference') || searchParams.get('trxref');
        try {
          if (!reference) throw new Error('Payment reference is missing');
          await paymentsAPI.verify(reference);
          toast.success('Gift contribution confirmed!');
          window.history.replaceState({}, '', `/sign/${slug}`);
          setSubmitted(true);
        } catch (err) {
          toast.error(err.response?.data?.error || err.message || 'Could not verify contribution');
        }
      }
      await fetchCard();
    };
    completeContribution();
  }, [slug]);

  const fetchCard = async () => {
    try {
      const res = await cardsAPI.getPublic(slug);
      setCard(res.data);
      setSelectedAmount(res.data.suggested_amount || 2500);
    } catch {
      toast.error('Card not found or no longer active');
    } finally {
      setLoading(false);
    }
  };

  const setAttachment = file => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Attachment is too large (maximum 50MB)');
      return;
    }
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const clearAttachment = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaFile(null);
    setMediaPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const verifyContribution = async reference => {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        await paymentsAPI.verify(reference);
        return;
      } catch (error) {
        if (attempt === 3) throw error;
        await new Promise(resolve => setTimeout(resolve, 600 * (attempt + 1)));
      }
    }
  };

  const handleSubmit = async () => {
    if (!form.author_name.trim()) return toast.error('Please add your name');
    if (!form.content.trim()) return toast.error('Please write a message');

    const amountNGN = Number(customAmount || selectedAmount || 0);
    const wantsGift = card.is_gift_enabled && amountNGN >= 2500;
    if (wantsGift && !form.author_email.trim()) return toast.error('Add your email to contribute a gift');

    setSubmitting(true);
    try {
      const msgData = new FormData();
      Object.entries(form).forEach(([key, value]) => msgData.append(key, value));
      if (mediaFile) msgData.append('media', mediaFile);
      const msgRes = await messagesAPI.add(slug, msgData);

      if (!wantsGift) {
        setSubmitted(true);
        return;
      }

      const payRes = await paymentsAPI.initContribution({
        card_slug: slug,
        contributor_name: form.author_name,
        contributor_email: form.author_email,
        amount: amountNGN,
        message_id: msgRes.data?.id,
      });
      const { access_code: accessCode, reference, authorization_url: checkoutUrl } = payRes.data;

      if (window.PaystackPop && accessCode) {
        const popup = new window.PaystackPop();
        popup.resumeTransaction(accessCode, {
          onSuccess: async transaction => {
            try {
              await verifyContribution(transaction.reference || reference);
              toast.success('Your message and gift are on the card!');
              setSubmitted(true);
              fetchCard();
            } catch (error) {
              toast.error(error.response?.data?.error || 'Gift paid, but verification needs another moment');
            } finally {
              setSubmitting(false);
            }
          },
          onCancel: () => {
            toast('Your message was saved. The gift payment was not completed.');
            setSubmitted(true);
            setSubmitting(false);
          },
          onError: error => {
            toast.error(error?.message || 'Could not open secure payment');
            setSubmitting(false);
          },
        });
        return;
      }

      window.location.assign(checkoutUrl || `https://checkout.paystack.com/${accessCode}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to sign. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen grid place-items-center bg-violet-50">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-warm-500">Opening the celebration...</p>
      </div>
    </div>
  );

  if (!card) return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">{'\uD83D\uDC8C'}</div>
        <h2 className="font-display text-2xl font-bold text-warm-900 mb-3">Card not found</h2>
        <p className="text-warm-500">This card may have expired or the link is incorrect.</p>
      </div>
    </div>
  );

  const design = getCardDesign(card.design_theme);
  const cardFont = getFontStyle(card.font_style);
  const messageFont = getFontStyle(form.font_style);
  const deadline = card.deadline ? new Date(card.deadline) : null;
  const hoursLeft = deadline ? Math.max(0, Math.round((deadline - new Date()) / 3600000)) : null;

  if (submitted) return (
    <div className="min-h-screen flex flex-col" style={{ background: design.background }}>
      <Navbar />
      <main className="flex-1 grid place-items-center px-4 py-12">
        <div className={`card-art ${cardArtClass(design)} celebration-shell glass-panel max-w-lg w-full rounded-[2.25rem] p-7 sm:p-10 text-center`}>
          <div className="w-20 h-20 bg-emerald-100 rounded-full grid place-items-center text-4xl mx-auto mb-5 animate-pop">{'\u2713'}</div>
          <p className="text-xs font-extrabold tracking-[.2em] uppercase mb-3" style={{ color: design.accent }}>Beautifully delivered</p>
          <h2 className="font-display text-3xl font-bold text-warm-900 mb-3">You are on the card!</h2>
          <p className="text-warm-600 mb-7">Your note is now part of <strong>{card.recipient_name}'s</strong> celebration.</p>
          <button
            onClick={() => {
              const url = `https://wa.me/?text=${encodeURIComponent(`Sign ${card.recipient_name}'s special card: ${window.location.origin}/sign/${slug}`)}`;
              window.open(url, '_blank');
            }}
            className="w-full py-4 rounded-2xl font-bold text-white"
            style={{ background: '#25D366' }}
          >
            Invite others on WhatsApp
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f6ff]">
      <Navbar />
      <main className="flex-1">
        <section className={`card-art ${cardArtClass(design)} px-4 py-10 sm:py-14`} style={{ background: design.background, color: design.ink }}>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            {hoursLeft !== null && hoursLeft < 48 && (
              <span className="inline-flex bg-white/80 text-amber-800 rounded-full px-4 py-2 text-xs font-extrabold mb-5 shadow-sm">
                Signing closes in {hoursLeft < 24 ? `${hoursLeft} hours` : `${Math.round(hoursLeft / 24)} days`}
              </span>
            )}
            <div className="text-5xl mb-4">{design.icon}</div>
            <p className="text-xs font-extrabold tracking-[.24em] uppercase mb-3" style={{ color: design.accent }}>You are invited to celebrate</p>
            <h1 className="max-w-3xl mx-auto mb-4" style={{ color: design.ink, fontFamily: cardFont.family }}>
              {card.title || `A special card for ${card.recipient_name}`}
            </h1>
            <p className={`text-lg ${design.dark ? 'text-white/75' : 'text-warm-600'}`}>
              Add your words, a memory, a voice note, and an optional gift.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <span className="bg-white/80 text-warm-800 rounded-full px-4 py-2 text-xs font-bold shadow-sm">{card.signed_count || 0} people signed</span>
              {card.is_gift_enabled && card.total_collected > 0 && (
                <span className="bg-emerald-600 text-white rounded-full px-4 py-2 text-xs font-bold shadow-sm">{formatNGN(card.total_collected)} gift pot</span>
              )}
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 grid lg:grid-cols-[1fr_.82fr] gap-7 items-start">
          <section className="glass-panel rounded-[2rem] p-5 sm:p-8">
            <div className="mb-7">
              <span className="text-xs font-extrabold tracking-[.2em] uppercase text-primary-600">Your signature</span>
              <h2 className="text-2xl sm:text-3xl text-warm-900 mt-2">Make it personal</h2>
              <p className="text-sm text-warm-500 mt-2">Every field becomes part of the keepsake.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-2">Your name *</label>
                <input className="input" placeholder="e.g. Kemi Adeyemi" value={form.author_name} onChange={e => setForm({ ...form, author_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-2">Your email {card.is_gift_enabled && '(for gifts)'}</label>
                <input type="email" className="input" placeholder="kemi@email.com" value={form.author_email} onChange={e => setForm({ ...form, author_email: e.target.value })} />
              </div>
            </div>

            <label className="block text-xs font-bold text-warm-700 mb-2">Choose your writing style</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
              {FONT_STYLES.map(font => (
                <button
                  type="button"
                  key={font.id}
                  onClick={() => setForm({ ...form, font_style: font.id })}
                  className={`rounded-xl border-2 px-2 py-3 text-center transition-all ${form.font_style === font.id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-purple-100 bg-white text-warm-600'}`}
                  style={{ fontFamily: font.family }}
                >
                  {font.id === 'calligraphy' ? 'With love' : font.name}
                </button>
              ))}
            </div>

            <label className="block text-xs font-bold text-warm-700 mb-2">Your message to {card.recipient_name} *</label>
            <textarea
              className="input h-40 resize-none"
              style={{ fontFamily: messageFont.family, fontSize: form.font_style === 'calligraphy' ? '1.55rem' : '1rem' }}
              placeholder={`Write something unforgettable for ${card.recipient_name}...`}
              maxLength={1200}
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
            />
            <div className="flex justify-end mt-1 mb-4"><span className="text-xs text-warm-400">{form.content.length}/1200</span></div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button type="button" onClick={() => fileRef.current.click()} className="voice-record-button">
                <span>{'\uD83D\uDCF7'}</span> Add photo, video, or audio
              </button>
              <VoiceRecorder onRecorded={setAttachment} disabled={submitting} />
              <input ref={fileRef} type="file" accept="image/*,video/*,audio/*,.m4a,.ogg,.webm" className="hidden" onChange={e => setAttachment(e.target.files?.[0])} />
            </div>

            {mediaPreview && (
              <div className="relative bg-warm-100 border border-purple-100 rounded-2xl p-3 mb-5">
                {mediaFile?.type.startsWith('video/') ? (
                  <video src={mediaPreview} controls className="w-full max-h-56 rounded-xl object-cover" />
                ) : mediaFile?.type.startsWith('audio/') ? (
                  <div className="flex items-center gap-3 p-3">
                    <span className="text-3xl">{'\uD83C\uDFA7'}</span>
                    <audio src={mediaPreview} controls className="w-full" />
                  </div>
                ) : (
                  <img src={mediaPreview} alt="Attachment preview" className="w-full max-h-56 rounded-xl object-cover" />
                )}
                <button type="button" onClick={clearAttachment} className="absolute top-1 right-1 bg-warm-900 text-white w-8 h-8 rounded-full font-bold">x</button>
              </div>
            )}

            {card.allow_private_messages && (
              <label className="flex items-center justify-between gap-4 border-t border-purple-100 pt-4">
                <span>
                  <span className="block text-sm font-bold text-warm-800">Private message</span>
                  <span className="block text-xs text-warm-400">Only the celebrant and card creator can read it</span>
                </span>
                <input type="checkbox" checked={form.is_private} onChange={e => setForm({ ...form, is_private: e.target.checked })} className="w-5 h-5 accent-violet-600" />
              </label>
            )}
          </section>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className={`card-art ${cardArtClass(design)} celebration-shell rounded-[2rem] p-6 min-h-[360px] flex flex-col`} style={{ background: design.background, color: design.ink }}>
              <div className="flex justify-between items-center mb-7">
                <span className="text-3xl">{design.icon}</span>
                <span className="text-[10px] font-extrabold tracking-[.18em] uppercase opacity-60">Live preview</span>
              </div>
              <p className="flex-1 whitespace-pre-wrap break-words" style={{ color: design.ink, fontFamily: messageFont.family, fontSize: form.font_style === 'calligraphy' ? '2rem' : form.font_style === 'handwritten' ? '1.55rem' : '1.05rem', lineHeight: 1.55 }}>
                {form.content || `Your beautiful message for ${card.recipient_name} will appear here...`}
              </p>
              <div className="border-t mt-5 pt-4" style={{ borderColor: `${design.accent}35` }}>
                <p className="font-bold" style={{ color: design.ink }}>{form.author_name || 'Your name'}</p>
                {mediaFile?.type.startsWith('audio/') && <p className="text-xs mt-1 opacity-70">{'\uD83C\uDFA4'} Voice note attached</p>}
              </div>
            </div>

            {card.is_gift_enabled && (
              <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl text-warm-900">Add a gift</h3>
                    <p className="text-xs text-warm-500 mt-1">Optional and securely processed by Paystack</p>
                  </div>
                  <span className="text-3xl">{'\uD83C\uDF81'}</span>
                </div>
                {card.total_collected > 0 && (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 mb-4 flex justify-between">
                    <span className="text-xs font-bold text-emerald-700">Gift pot so far</span>
                    <span className="font-bold text-emerald-800">{formatNGN(card.total_collected)}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => { setSelectedAmount(null); setCustomAmount(''); }}
                  className={`w-full mb-3 py-2.5 rounded-xl text-xs font-bold border-2 ${
                    selectedAmount === null && !customAmount
                      ? 'bg-warm-900 text-white border-warm-900'
                      : 'bg-white border-purple-100 text-warm-700'
                  }`}
                >
                  Sign card without a gift
                </button>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {AMOUNTS_NGN.map(amount => (
                    <button
                      type="button"
                      key={amount}
                      onClick={() => { setSelectedAmount(amount); setCustomAmount(''); }}
                      className={`py-2.5 rounded-xl text-xs font-bold border-2 ${selectedAmount === amount && !customAmount ? 'bg-primary-600 text-white border-primary-600' : 'bg-white border-purple-100 text-warm-700'}`}
                    >
                      {formatNGN(amount)}
                    </button>
                  ))}
                </div>
                <input type="number" min="2500" className="input" placeholder="Or enter a custom amount" value={customAmount} onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null); }} />
              </div>
            )}

            <button onClick={handleSubmit} disabled={submitting} className="w-full btn-rose py-4 text-base rounded-2xl">
              {submitting ? 'Adding your magic...' : `Sign this card${card.is_gift_enabled && (customAmount || selectedAmount) ? ` + ${formatNGN(Number(customAmount || selectedAmount))} gift` : ''}`}
            </button>
            <p className="text-center text-xs text-warm-400">No account needed. Your message is saved securely.</p>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SignCard;
