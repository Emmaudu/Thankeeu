import { useSEO } from '../hooks/useSEO';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { cardsAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import { formatNGN } from '../utils/currency';

const GIFT_OPTIONS = [
  { id: 'shopping', icon: '🛒', label: 'Shopping Voucher', desc: 'Shop anything online' },
  { id: 'spa', icon: '💆', label: 'Spa Treatment', desc: 'Relax at a top spa near you' },
  { id: 'flowers', icon: '🌹', label: 'Flower Delivery', desc: 'Fresh bouquet delivered to their door' },
  { id: 'food', icon: '🍽️', label: 'Restaurant Voucher', desc: 'Dinner for two at a great restaurant' },
  { id: 'transfer', icon: '🏦', label: 'Bank Transfer', desc: 'Get the money sent to your account' },
];

const GiftCheckout = () => {
  useSEO({ title: 'Claim Your Gift', description: 'Choose how to receive your Thankeeu gift.', noIndex: true });

  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [bankDetails, setBankDetails] = useState({ account_number: '', bank_name: '', account_name: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('This gift claim link is invalid');
      setLoading(false);
      return;
    }

    cardsAPI.getRecipient(slug, token)
      .then(res => setCard(res.data))
      .catch(err => toast.error(err.response?.data?.error || 'Gift claim link is invalid'))
      .finally(() => setLoading(false));
  }, [slug, token]);

  const handleRedeem = async () => {
    if (!selected) return toast.error('Please select a gift option');
    if (
      selected === 'transfer'
      && (!bankDetails.account_number.trim() || !bankDetails.bank_name.trim() || !bankDetails.account_name.trim())
    ) {
      return toast.error('Please complete your bank details');
    }
    setSubmitting(true);
    try {
      const res = await cardsAPI.claimGift(slug, {
        token,
        claim_type: selected,
        ...bankDetails
      });
      toast.success(res.data.message);
      navigate(`/card/${slug}?token=${token}`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not submit your gift claim');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" /></div>;

  if (card?.gift_claim) return (
    <div className="min-h-screen bg-warm-100">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="font-display text-2xl font-semibold text-warm-900 mb-2">Gift claim already submitted</h1>
        <p className="text-warm-500 mb-6">Your claim is currently {card.gift_claim.status}.</p>
        <button onClick={() => navigate(`/card/${slug}?token=${token}`)} className="btn-primary">
          Return to my card
        </button>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-warm-100">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎁</div>
          <h1 className="font-display text-3xl font-semibold text-warm-900 mb-2">Redeem your gift</h1>
          <p className="text-warm-500">Choose how you'd like to receive your gift from {card?.recipient_name}'s card</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-3xl p-5 mb-8 text-center">
          <p className="text-sm text-green-600 mb-1">Available to claim</p>
          <p className="font-display text-4xl font-bold text-green-700">{formatNGN(card?.claimable_amount ?? card?.total_collected ?? 0)}</p>
          <p className="text-xs text-green-500 mt-1">From {card?.signed_count || 0} contributors</p>
        </div>

        <div className="space-y-3 mb-6">
          {GIFT_OPTIONS.map(opt => (
            <button key={opt.id} onClick={() => setSelected(opt.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-3xl border-2 text-left transition-all ${selected === opt.id ? 'border-primary-400 bg-primary-50' : 'border-purple-100 bg-white hover:border-purple-200'}`}>
              <span className="text-3xl">{opt.icon}</span>
              <div>
                <p className="font-semibold text-warm-900 text-sm">{opt.label}</p>
                <p className="text-xs text-warm-500">{opt.desc}</p>
              </div>
              {selected === opt.id && <span className="ml-auto text-primary-400 text-lg">✓</span>}
            </button>
          ))}
        </div>

        {selected === 'transfer' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-5 mb-6 space-y-3">
            <p className="font-semibold text-warm-900 text-sm mb-3">Bank details</p>
            <input className="input" inputMode="numeric" maxLength={10} placeholder="10-digit account number" value={bankDetails.account_number}
              onChange={e => setBankDetails({ ...bankDetails, account_number: e.target.value.replace(/\D/g, '') })} />
            <input className="input" placeholder="Bank name (e.g. GTBank, Access)" value={bankDetails.bank_name}
              onChange={e => setBankDetails({ ...bankDetails, bank_name: e.target.value })} />
            <input className="input" placeholder="Account name" value={bankDetails.account_name}
              onChange={e => setBankDetails({ ...bankDetails, account_name: e.target.value })} />
          </div>
        )}

        <button onClick={handleRedeem} disabled={submitting || !selected} className="btn-primary w-full py-4 text-base">
          {submitting ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting claim...</span> : `Claim ${formatNGN(card?.claimable_amount ?? card?.total_collected ?? 0)}`}
        </button>
        <p className="text-xs text-center text-warm-400 mt-3">Gift redemptions are processed within 24 hours</p>
      </div>
      <Footer />
    </div>
  );
};

export default GiftCheckout;
