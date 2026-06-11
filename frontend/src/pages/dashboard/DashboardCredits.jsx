import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { creditsAPI, paymentsAPI } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import {CurrencyToggle, RotatingPrice} from '../../utils/currencyUI';
import { CURRENCIES, formatCurrency } from '../../utils/currency';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const PLANS = [
  {
    id: 'classic', name: 'Classic', priceNGN: 5000, credits: 1,
    emoji: '💜', color: 'border-purple-200 bg-gradient-to-br from-purple-50 to-rose-50',
    btnStyle: 'border-2 border-purple-300 text-primary-700 hover:bg-primary-50',
    desc: 'One card, one-time payment',
    features: ['1 card credit', 'Unlimited contributors', '100+ premium designs', 'Video, photo & voice messages', 'Scheduled delivery', 'Gift pot collection', 'WhatsApp invite link'],
  },
  {
    id: 'standard', name: 'Standard', priceNGN: 9000, credits: 2,
    emoji: '⭐', color: 'border-primary-400 bg-gradient-to-br from-primary-50 to-purple-50',
    btnStyle: 'bg-primary-500 text-white hover:bg-primary-600',
    popular: true,
    desc: 'Best value for 2 cards',
    features: ['2 card credits', 'All Classic features', 'Priority support (12hr)', 'Card analytics (views, opens)', 'Custom card title', 'Exclusive premium designs', 'Early access to new features'],
  },
  {
    id: 'pack5', name: 'Pack of 5', priceNGN: 19000, credits: 5,
    emoji: '🎁', color: 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50',
    btnStyle: 'border-2 border-green-400 text-green-700 hover:bg-green-50',
    desc: '₦3,800 per card — best deal',
    features: ['5 card credits (never expire)', 'All Standard features', 'Dedicated card manager', 'Priority phone support', 'Advanced gift pot analytics', 'Team collaboration tools'],
  },
];

export default function DashboardCredits() {
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const [balance,   setBalance]   = useState(null);
  const [history,   setHistory]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [buying,    setBuying]    = useState(null);
  const [currency,  setCurrency]  = useState('NGN');

  const fmt = (ngn) => formatCurrency(ngn, currency);

  useEffect(() => {
    const load = async () => {
      try {
        const [balRes, histRes] = await Promise.all([creditsAPI.getBalance(), creditsAPI.getHistory()]);
        setBalance(balRes.data);
        setHistory(histRes.data || []);
      } catch { toast.error('Failed to load credits'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleBuy = async (planId) => {
    setBuying(planId);
    try {
      const res = await creditsAPI.purchase(planId, currency);
      window.location.assign(res.data.payment_link);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start payment');
      setBuying(null);
    }
  };

  const credits = balance?.credits || 0;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">

        {/* Credit balance banner */}
        <div className={`rounded-3xl p-5 sm:p-7 mb-7 border-2 flex flex-col sm:flex-row items-start sm:items-center gap-5 ${
          credits === 0
            ? 'border-amber-200 bg-amber-50'
            : 'border-primary-200 bg-gradient-to-r from-primary-50 to-purple-50'
        }`}>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-4xl">💳</span>
              <div>
                <p className="text-xs font-semibold text-warm-500 uppercase tracking-wide">Your credit balance</p>
                <p className={`text-4xl font-extrabold ${credits === 0 ? 'text-amber-700' : 'text-primary-700'}`}>
                  {loading ? '…' : credits}
                  <span className="text-base font-semibold text-warm-500 ml-2">
                    card credit{credits !== 1 ? 's' : ''}
                  </span>
                </p>
              </div>
            </div>
            {credits === 0 && !loading && (
              <p className="text-sm text-amber-700 font-medium mt-2">
                ⚠️ No credits left. Buy a plan below to create more cards instantly.
              </p>
            )}
            {credits > 0 && credits <= 1 && (
              <p className="text-sm text-primary-600 font-medium mt-1">
                🔔 You have {credits} credit left. Top up now for faster card creation!
              </p>
            )}
            {credits > 1 && (
              <p className="text-sm text-warm-500 mt-1">
                You can create {credits} more card{credits !== 1 ? 's' : ''} using your credit balance.
              </p>
            )}
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-xs text-warm-400 mb-1">Total ever purchased</p>
            <p className="text-lg font-bold text-warm-700">
              {loading ? '…' : balance?.total_purchased || 0} credits
            </p>
          </div>
        </div>

        {/* Currency toggle */}
        <div className="text-center mb-6">
          <p className="text-xs font-semibold text-warm-500 mb-2">Choose your currency</p>
          <CurrencyToggle selected={currency} onChange={setCurrency} />
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {PLANS.map(plan => (
            <div key={plan.id} className={`relative rounded-3xl border-2 p-5 flex flex-col ${plan.color}`}>
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
                  ⭐ Best value
                </div>
              )}
              <div className="text-3xl mb-2">{plan.emoji}</div>
              <h3 className="text-lg font-bold text-warm-900 mb-0.5">{plan.name}</h3>
              <p className="text-xs text-warm-500 mb-3">{plan.desc}</p>
              <div className="mb-1">
                <span className="text-3xl font-extrabold text-warm-900">{fmt(plan.priceNGN)}</span>
                <span className="text-warm-400 text-sm ml-1">one-time</span>
              </div>
              <p className="text-primary-600 font-bold text-sm mb-1">
                = {plan.credits} card credit{plan.credits > 1 ? 's' : ''}
              </p>
              {currency !== 'NGN' && (
                <p className="text-xs text-warm-400 mb-3">≈ ₦{plan.priceNGN.toLocaleString('en-NG')}</p>
              )}
              <div className="h-px bg-white/60 my-3" />
              <ul className="space-y-1.5 mb-5 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-warm-700">
                    <span className="text-green-500 font-bold flex-shrink-0 mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleBuy(plan.id)} disabled={!!buying}
                className={`w-full py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 ${plan.btnStyle}`}>
                {buying === plan.id
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                      Processing…
                    </span>
                  : `Buy ${plan.credits} credit${plan.credits > 1 ? 's' : ''} — ${fmt(plan.priceNGN)}`}
              </button>
            </div>
          ))}
        </div>

        {/* Purchase history */}
        <div className="bg-white rounded-3xl border-2 border-purple-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-purple-100">
            <h3 className="font-bold text-warm-900">Purchase history</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-primary-300 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : history.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-4xl mb-3">🧾</p>
              <p className="text-warm-500 text-sm">No purchases yet. Buy your first plan above.</p>
            </div>
          ) : (
            <div className="divide-y divide-purple-50">
              {history.map(h => (
                <div key={h.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                    h.status === 'paid' ? 'bg-green-50' : h.status === 'pending' ? 'bg-amber-50' : 'bg-red-50'
                  }`}>
                    {h.status === 'paid' ? '✅' : h.status === 'pending' ? '⏳' : '❌'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-warm-900 capitalize">
                      {h.plan_type} plan — {h.credits_bought} credit{h.credits_bought > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-warm-400">
                      {h.created_at ? format(new Date(h.created_at), 'MMM d, yyyy · h:mm a') : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-warm-900">₦{h.amount_paid?.toLocaleString('en-NG')}</p>
                    <p className={`text-xs font-semibold capitalize ${
                      h.status === 'paid' ? 'text-green-600' : h.status === 'pending' ? 'text-amber-600' : 'text-red-500'
                    }`}>{h.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
