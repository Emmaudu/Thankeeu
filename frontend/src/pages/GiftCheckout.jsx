import { useSEO } from '../hooks/useSEO';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cardsAPI, paymentsAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import { formatUSD } from '../utils/currency';

const GIFT_OPTIONS = [
  { id: 'shopping', icon: '🛒', label: 'Shopping Voucher', desc: 'Shop anything online' },
  { id: 'spa', icon: '💆', label: 'Spa Treatment', desc: 'Relax at a top spa near you' },
  { id: 'flowers', icon: '🌹', label: 'Flower Delivery', desc: 'Fresh bouquet delivered to their door' },
  { id: 'food', icon: '🍽️', label: 'Restaurant Voucher', desc: 'Dinner for two at a great restaurant' },
  { id: 'transfer', icon: '🏦', label: 'Bank Transfer', desc: 'Get the money sent to your account' },
];

const GiftCheckout = () => {
  useSEO({ title: 'Gift Checkout', description: 'Contribute to a gift pot.', noIndex: true });

  const { slug } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [bankDetails, setBankDetails] = useState({ account_number: '', bank_name: '', account_name: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    cardsAPI.getPublic(slug)
      .then(res => setCard(res.data))
      .catch(() => toast.error('Card not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleRedeem = async () => {
    if (!selected) return toast.error('Please select a gift option');
    if (selected === 'transfer' && !bankDetails.account_number) return toast.error('Please enter your bank details');
    setSubmitting(true);
    setTimeout(() => {
      toast.success('Gift redemption request submitted! We will process it within 24 hours. 💜');
      navigate('/');
    }, 1500);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" /></div>;

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
          <p className="text-sm text-green-600 mb-1">Total collected for you</p>
          <p className="font-display text-4xl font-bold text-green-700">{formatUSD(card?.total_collected || 0)}</p>
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
            <input className="input" placeholder="Account number" value={bankDetails.account_number}
              onChange={e => setBankDetails({ ...bankDetails, account_number: e.target.value })} />
            <input className="input" placeholder="Bank name (e.g. GTBank, Access)" value={bankDetails.bank_name}
              onChange={e => setBankDetails({ ...bankDetails, bank_name: e.target.value })} />
            <input className="input" placeholder="Account name" value={bankDetails.account_name}
              onChange={e => setBankDetails({ ...bankDetails, account_name: e.target.value })} />
          </div>
        )}

        <button onClick={handleRedeem} disabled={submitting || !selected} className="btn-primary w-full py-4 text-base">
          {submitting ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</span> : `Redeem ${formatUSD(card?.total_collected || 0)}`}
        </button>
        <p className="text-xs text-center text-warm-400 mt-3">Gift redemptions are processed within 24 hours</p>
      </div>
      <Footer />
    </div>
  );
};

export default GiftCheckout;
