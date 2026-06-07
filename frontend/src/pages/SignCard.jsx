import { useSEO } from '../hooks/useSEO';
import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { cardsAPI, messagesAPI, paymentsAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import { formatNGN } from '../utils/currency';

// NGN contribution amounts
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
  const [form, setForm] = useState({ author_name:'', author_email:'', content:'', is_private:false });

  useSEO({
    title: card ? `Sign ${card.recipient_name}'s card on Thankeeu` : 'Sign a Card — Thankeeu',
    description: card
      ? `You're invited to sign a group card for ${card.recipient_name}. Add your message${card.is_gift_enabled ? ' and chip in a Naira gift' : ''}.`
      : 'Sign a group card on Thankeeu.',
    noIndex: false,
  });

  useEffect(() => {
    const completeContribution = async () => {
      if (searchParams.get('contributed') === 'true') {
        const reference = searchParams.get('reference') || searchParams.get('trxref');
        try {
          if (!reference) throw new Error('Payment reference is missing');
          await paymentsAPI.verify(reference);
          toast.success('Gift contribution confirmed! 🎉');
          window.history.replaceState({}, '', `/sign/${slug}`);
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
      // Always use public endpoint — no auth needed for invitees
      const res = await cardsAPI.getPublic(slug);
      setCard(res.data);
      setSelectedAmount(res.data.suggested_amount || 2000);
    } catch {
      toast.error('Card not found or no longer active');
    } finally { setLoading(false); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error('File too large (max 20MB)'); return; }
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.author_name.trim()) { toast.error('Please add your name'); return; }
    if (!form.content.trim()) { toast.error('Please write a message'); return; }

    const amountNGN = customAmount ? parseInt(customAmount) : selectedAmount;
    const wantsGift = card.is_gift_enabled && amountNGN && amountNGN >= 100 && form.author_email;

    if (wantsGift && !form.author_email) { toast.error('Add your email to contribute a gift'); return; }

    setSubmitting(true);
    try {
      // 1. Upload message
      const msgData = new FormData();
      msgData.append('author_name', form.author_name);
      msgData.append('author_email', form.author_email);
      msgData.append('content', form.content);
      msgData.append('is_private', form.is_private);
      if (mediaFile) msgData.append('media', mediaFile);

      const msgRes = await messagesAPI.add(slug, msgData);
      const messageId = msgRes.data?.id;

      // 2. Initiate Paystack gift payment if amount given
      if (wantsGift) {
        const payRes = await paymentsAPI.initContribution({
          card_slug: slug,
          contributor_name: form.author_name,
          contributor_email: form.author_email,
          amount: amountNGN, // NGN, backend converts to kobo
          message_id: messageId,
        });
        window.location.href = `https://checkout.paystack.com/${payRes.data.access_code}`;
        return;
      }

      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to sign. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center px-4">
        <div className="w-14 h-14 border-4 border-primary-300 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-warm-500">Opening your card…</p>
      </div>
    </div>
  );

  if (!card) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="font-display text-2xl font-bold text-warm-900 mb-3">Card not found</h2>
        <p className="text-warm-500 mb-6">This card may have expired, been removed, or the link is incorrect.</p>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-5 animate-pop">✓</div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-warm-900 mb-3">You're on the card! 🎉</h2>
          <p className="text-warm-500 mb-7 leading-relaxed">Your message has been added to <strong>{card.recipient_name}'s</strong> card. We'll let them know!</p>

          {/* Share link */}
          <div className="bg-white rounded-2xl border-2 border-purple-100 p-4 mb-4 text-left">
            <p className="text-sm font-bold text-warm-800 mb-2">📣 Invite more people to sign</p>
            <div className="flex gap-2">
              <input readOnly className="input text-xs flex-1 min-w-0" value={`${window.location.origin}/sign/${slug}`} />
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/sign/${slug}`); toast.success('Copied!'); }}
                className="btn-primary text-xs px-4 flex-shrink-0">Copy</button>
            </div>
          </div>
          <button onClick={() => {
            const url = `https://wa.me/?text=${encodeURIComponent(`💜 Sign ${card.recipient_name}'s special card! ${window.location.origin}/sign/${slug}`)}`;
            window.open(url, '_blank');
          }} className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 text-base transition-colors"
            style={{ background:'#25D366' }}>
            📲 Invite via WhatsApp
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );

  const deadline = card.deadline ? new Date(card.deadline) : null;
  const hoursLeft = deadline ? Math.max(0, Math.round((deadline - new Date()) / 3600000)) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 sm:py-8">

        {/* Deadline */}
        {hoursLeft !== null && hoursLeft < 48 && (
          <div className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-4 py-2 text-xs font-bold mb-5 w-fit mx-auto">
            ⏰ Closes in {hoursLeft < 24 ? `${hoursLeft}h` : `${Math.round(hoursLeft/24)}d`}
          </div>
        )}

        {/* Card info banner */}
        <div className="rounded-3xl p-4 sm:p-5 mb-5 border-2 border-purple-100" style={{ background: card.background_color || '#F5F0FF' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/70 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">💌</div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-warm-900 text-base sm:text-lg truncate">{card.title || `${card.recipient_name}'s Card`}</h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <span className="text-xs text-warm-600">✅ {card.signed_count || 0} signed</span>
                {card.is_gift_enabled && card.total_collected > 0 && (
                  <span className="text-xs text-green-700 font-semibold">🎁 {formatNGN(card.total_collected)} collected</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-3xl border-2 border-purple-100 p-4 sm:p-5 mb-4">
          <h3 className="font-bold text-warm-900 mb-4 flex items-center gap-2">👤 Your details</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-warm-700 mb-1.5">Your name <span className="text-rose-500">*</span></label>
              <input className="input" placeholder="e.g. Kemi Adeyemi" value={form.author_name} onChange={e => setForm({...form, author_name:e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-warm-700 mb-1.5">Your email {card.is_gift_enabled && <span className="text-warm-400 font-normal">(needed if chipping in)</span>}</label>
              <input type="email" className="input" placeholder="kemi@email.com" value={form.author_email} onChange={e => setForm({...form, author_email:e.target.value})} />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="bg-white rounded-3xl border-2 border-purple-100 p-4 sm:p-5 mb-4">
          <h3 className="font-bold text-warm-900 mb-4 flex items-center gap-2">💬 Your message to {card.recipient_name}</h3>
          <textarea
            className="input h-28 resize-none mb-3"
            placeholder={`Write something heartfelt for ${card.recipient_name}…`}
            maxLength={500}
            value={form.content}
            onChange={e => setForm({...form, content:e.target.value})}
          />
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => fileRef.current.click()}
              className="flex items-center gap-1.5 text-xs font-semibold text-warm-600 hover:text-primary-500 bg-warm-100 px-3 py-2 rounded-xl transition-colors border border-purple-100">
              📷 Add photo/video
            </button>
            <input ref={fileRef} type="file" accept="image/*,video/*,audio/*" className="hidden" onChange={handleFileChange} />
            <span className="text-xs text-warm-400">{form.content.length}/500</span>
          </div>

          {mediaPreview && (
            <div className="relative rounded-2xl overflow-hidden mb-3">
              {mediaFile?.type.startsWith('video') ? (
                <video src={mediaPreview} controls className="w-full max-h-40 object-cover" />
              ) : (
                <img src={mediaPreview} alt="preview" className="w-full max-h-40 object-cover" />
              )}
              <button onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                className="absolute top-2 right-2 bg-black/60 text-white w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center">✕</button>
            </div>
          )}

          {/* Live preview */}
          {(form.author_name || form.content) && (
            <div className="bg-purple-50 rounded-2xl p-3 flex gap-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-xs font-bold flex-shrink-0">
                {form.author_name?.slice(0,2).toUpperCase() || '??'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-warm-800">{form.author_name || 'Your name'}</p>
                <p className="text-xs text-warm-600 mt-0.5 break-words">{form.content || 'Your message will appear here…'}</p>
              </div>
            </div>
          )}

          {/* Private toggle */}
          {card.allow_private_messages && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-purple-100">
              <div>
                <p className="text-xs font-bold text-warm-700">Make private 🔒</p>
                <p className="text-xs text-warm-400">Only {card.recipient_name} sees this</p>
              </div>
              <button onClick={() => setForm({...form, is_private:!form.is_private})}
                className={`w-11 h-6 rounded-full transition-all relative flex items-center ${form.is_private ? 'bg-primary-500' : 'bg-gray-200'}`}>
                <span className={`absolute w-5 h-5 bg-white rounded-full shadow-md transition-transform ${form.is_private ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          )}
        </div>

        {/* Gift contribution */}
        {card.is_gift_enabled && (
          <div className="bg-white rounded-3xl border-2 border-purple-100 p-4 sm:p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-warm-900 flex items-center gap-2">🎁 Chip in a gift</h3>
              <span className="text-xs bg-purple-50 text-warm-500 px-2.5 py-1 rounded-full font-semibold border border-purple-100">Optional</span>
            </div>

            {/* Current pot */}
            {card.total_collected > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-3 mb-4 flex items-center gap-3">
                <span className="text-2xl">🐷</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-green-800">Current gift pot</p>
                  <p className="text-xs text-green-600">{card.signed_count || 0} contributors</p>
                </div>
                <span className="font-display font-bold text-green-700 text-lg">{formatNGN(card.total_collected)}</span>
              </div>
            )}

            <p className="text-xs text-warm-500 mb-3 font-medium">How much would you like to add?</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {AMOUNTS_NGN.map(a => (
                <button key={a} onClick={() => { setSelectedAmount(a); setCustomAmount(''); }}
                  className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                    selectedAmount===a && !customAmount
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'border-purple-200 text-warm-700 hover:border-primary-300 hover:bg-primary-50'
                  }`}>
                  {formatNGN(a)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-warm-600 flex-shrink-0">₦</span>
              <input type="number" className="input flex-1" placeholder="Custom amount (min ₦2,500)"
                value={customAmount} min="2500"
                onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null); }} />
            </div>
            <p className="text-xs text-warm-400 mt-2 flex items-center gap-1">
              💳 Paystack · Naira cards, bank transfer, USSD
            </p>
          </div>
        )}

        {/* Submit CTA */}
        <button onClick={handleSubmit} disabled={submitting}
          className="w-full btn-rose py-4 text-base font-bold mb-3 rounded-2xl flex items-center justify-center gap-2">
          {submitting
            ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>Signing…</>
            : <>❤️ Sign card{card.is_gift_enabled && (customAmount || selectedAmount) ? ` + ${formatNGN(Number(customAmount || selectedAmount))} gift` : ''}</>
          }
        </button>
        <p className="text-center text-xs text-warm-400">No account needed · Takes 30 seconds · 100% secure</p>
      </div>
      <Footer />
    </div>
  );
};

export default SignCard;
