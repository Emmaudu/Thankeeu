import { useSEO } from '../hooks/useSEO';
import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { cardsAPI, messagesAPI, paymentsAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import { usdToNgn, ngnToUsd, formatUSD } from '../utils/currency';

// Amounts shown to user in USD; converted to NGN before sending to Paystack
const AMOUNTS_USD = [5, 10, 25, 50, 100];

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
    author_name: '', author_email: '', content: '', is_private: false
  });

  // Dynamic SEO — title updates when card loads so WhatsApp previews are accurate
  useSEO({
    title:       card ? `Sign ${card.recipient_name}'s ${card.occasion?.replace(/_/g,' ')} card` : 'Sign a Card on Thankeeu',
    description: card
      ? `You've been invited to sign a group card for ${card.recipient_name}. Add your message${card.is_gift_enabled ? ' and chip into a shared gift pot' : ''} on Thankeeu.`
      : 'Sign a group card and add a gift on Thankeeu.',
    twitterCard: 'summary_large_image',
    noIndex:     false,
  });

  useEffect(() => {
    fetchCard();
    if (searchParams.get('contributed') === 'true') {
      toast.success('Gift contribution confirmed! 🎉');
    }
  }, [slug]);

  const fetchCard = async () => {
    try {
      const res = await cardsAPI.getPublic(slug);
      setCard(res.data);
      setSelectedAmount(ngnToUsd(res.data.suggested_amount) || 10);
    } catch { toast.error('Card not found'); }
    finally { setLoading(false); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.author_name.trim()) return toast.error('Please enter your name');
    if (!form.content.trim()) return toast.error('Please write a message');
    if (!form.author_email && (selectedAmount || customAmount)) {
      return toast.error('Email required to process gift contribution');
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('author_name', form.author_name);
      fd.append('author_email', form.author_email);
      fd.append('content', form.content);
      fd.append('is_private', form.is_private);
      if (mediaFile) fd.append('media', mediaFile);

      const msgRes = await messagesAPI.add(slug, fd);
      const messageId = msgRes.data.id;

      const amountUsd = customAmount ? parseInt(customAmount) : selectedAmount;
      if (card.is_gift_enabled && amountUsd && form.author_email) {
        const amountNgn = usdToNgn(amountUsd); // convert USD → NGN for Paystack
        const payRes = await paymentsAPI.initContribution({
          card_slug: slug,
          contributor_name: form.author_name,
          contributor_email: form.author_email,
          amount: amountNgn,
          message_id: messageId
        });
        window.location.href = `https://checkout.paystack.com/${payRes.data.access_code}`;
        return;
      }

      setSubmitted(true);
      toast.success("You're on the card! 🎉");
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to sign card');
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!card) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center"><div className="text-5xl mb-4">😕</div>
        <p className="text-gray-600">Card not found or no longer active.</p></div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 animate-bounce">✓</div>
        <h2 className="font-display text-3xl font-semibold text-gray-900 mb-3">You're on the card!</h2>
        <p className="text-gray-500 mb-8">Your message has been added to {card.recipient_name}'s card. We'll let you know when they open it.</p>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8 text-left">
          <p className="text-sm text-gray-500 mb-2">🔔 Want to invite more people?</p>
          <div className="flex gap-2">
            <input readOnly className="input text-xs flex-1" value={`${window.location.origin}/sign/${slug}`} />
            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/sign/${slug}`); toast.success('Copied!'); }}
              className="btn-primary text-xs px-4">Copy</button>
          </div>
        </div>
        <button onClick={() => {
          const url = `https://wa.me/?text=${encodeURIComponent(`Sign ${card.recipient_name}'s special card! 💜 ${window.location.origin}/sign/${slug}`)}`;
          window.open(url, '_blank');
        }} className="w-full bg-[#25D366] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 mb-3 hover:bg-[#20c05a] transition-colors">
          📲 Invite via WhatsApp
        </button>
      </div>
      <Footer />
    </div>
  );

  const deadline = card.deadline ? new Date(card.deadline) : null;
  const hoursLeft = deadline ? Math.max(0, Math.round((deadline - new Date()) / 3600000)) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">

        {/* Deadline pill */}
        {hoursLeft !== null && hoursLeft < 48 && (
          <div className="flex items-center justify-center gap-2 bg-amber-100 text-amber-700 rounded-full px-4 py-2 text-sm font-medium mb-6 w-fit mx-auto">
            ⏰ Closes in {hoursLeft < 24 ? `${hoursLeft}h` : `${Math.round(hoursLeft / 24)}d`}
          </div>
        )}

        {/* Card info banner */}
        <div className="rounded-2xl p-5 mb-6 flex items-center gap-4" style={{ background: card.background_color || '#FBEAF0' }}>
          <div className="w-12 h-12 bg-white/60 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">💌</div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-lg font-semibold text-gray-900 truncate">{card.title || `${card.recipient_name}'s Card`}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-600">✅ {card.signed_count || 0} signed</span>
              {card.is_gift_enabled && card.total_collected > 0 && (
                <span className="text-xs text-gray-600">🎁 {formatUSD(card.total_collected)} collected</span>
              )}
            </div>
          </div>
          {/* Avatars */}
          <div className="flex -space-x-2 flex-shrink-0">
            {(card.contributors || []).slice(0, 4).map((name, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-primary-200 border-2 border-white flex items-center justify-center text-xs font-bold text-primary-700">
                {name?.slice(0, 1).toUpperCase()}
              </div>
            ))}
          </div>
        </div>

        {/* Your details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">👤 Your details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Your name *</label>
              <input className="input" placeholder="e.g. Kemi Adeyemi"
                value={form.author_name} onChange={e => setForm({ ...form, author_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Your email {card.is_gift_enabled && <span className="text-gray-400">(needed for gift)</span>}</label>
              <input type="email" className="input" placeholder="kemi@email.com"
                value={form.author_email} onChange={e => setForm({ ...form, author_email: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">💬 Your message to {card.recipient_name}</h3>
          <textarea
            className="input h-28 resize-none mb-3"
            placeholder={`Write something heartfelt for ${card.recipient_name}...`}
            maxLength={500}
            value={form.content}
            onChange={e => setForm({ ...form, content: e.target.value })}
          />
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-2">
              <button onClick={() => fileRef.current.click()} className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-500 bg-gray-50 px-3 py-1.5 rounded-lg transition-colors border border-gray-100">
                📷 Photo/Video
              </button>
              <input ref={fileRef} type="file" accept="image/*,video/*,audio/*" className="hidden" onChange={handleFileChange} />
            </div>
            <span className="text-xs text-gray-400">{form.content.length}/500</span>
          </div>
          {mediaPreview && (
            <div className="relative rounded-xl overflow-hidden mb-3">
              {mediaFile?.type.startsWith('video') ? (
                <video src={mediaPreview} controls className="w-full max-h-36 object-cover" />
              ) : (
                <img src={mediaPreview} alt="preview" className="w-full max-h-36 object-cover" />
              )}
              <button onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                className="absolute top-2 right-2 bg-black/50 text-white w-6 h-6 rounded-full text-xs">✕</button>
            </div>
          )}

          {/* Preview */}
          {(form.author_name || form.content) && (
            <div className="bg-gray-50 rounded-xl p-3 flex gap-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-xs font-bold flex-shrink-0">
                {form.author_name?.slice(0, 2).toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">{form.author_name || 'Your name'}</p>
                <p className="text-xs text-gray-600 mt-0.5">{form.content || 'Your message will appear here...'}</p>
              </div>
            </div>
          )}

          {card.allow_private_messages && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div>
                <p className="text-xs font-medium text-gray-700">Make private</p>
                <p className="text-xs text-gray-400">Only {card.recipient_name} will see this</p>
              </div>
              <button onClick={() => setForm({ ...form, is_private: !form.is_private })}
                className={`w-10 h-5 rounded-full transition-colors relative flex items-center ${form.is_private ? 'bg-primary-400' : 'bg-gray-200'}`}>
                <span className={`absolute w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_private ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          )}
        </div>

        {/* Gift contribution */}
        {card.is_gift_enabled && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">🎁 Chip in a gift</h3>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Optional</span>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🐷</span>
                <div>
                  <p className="text-xs font-semibold text-green-800">Gift pot</p>
                  <p className="text-xs text-green-600">{card.signed_count || 0} contributors so far</p>
                </div>
              </div>
              <span className="font-bold text-green-700">{formatUSD(card.total_collected || 0)}</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">How much would you like to add?</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {AMOUNTS_USD.map(a => (
                <button key={a} onClick={() => { setSelectedAmount(a); setCustomAmount(''); }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    selectedAmount === a && !customAmount ? 'bg-primary-400 text-white border-primary-400' : 'border-gray-200 text-gray-700 hover:border-primary-300'
                  }`}>
                  ${a}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">$</span>
              <input type="number" className="input" placeholder="Custom amount (min $1)"
                value={customAmount} min="1"
                onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null); }} />
            </div>
            <p className="text-xs text-gray-400 mt-2">💳 Payment via Paystack · Secure checkout</p>
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={submitting}
          className="w-full btn-pink py-4 text-base flex items-center justify-center gap-2 mb-3">
          {submitting
            ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing...</>
            : <>❤️ Sign card{card.is_gift_enabled && (customAmount || selectedAmount) ? ` + contribute $${customAmount || selectedAmount}` : ''}</>
          }
        </button>
        <p className="text-center text-xs text-gray-400">No account needed · Takes 30 seconds</p>
      </div>
      <Footer />
    </div>
  );
};

export default SignCard;
