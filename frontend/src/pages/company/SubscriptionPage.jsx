import { useSEO } from '../../hooks/useSEO';
import { useState, useEffect } from 'react';
import { subscriptionAPI } from '../../utils/api';
import CompanyLayout from '../../components/company/CompanyLayout';
import toast from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '₦20,000',
    period: '/month',
    saving: null,
    features: [
      'Unlimited employees',
      'Automated birthday emails to departments',
      'Birthday card delivery to celebrants',
      'Gift pot collection via Paystack',
      'HR dashboard & analytics',
      'Email support',
    ]
  },
  {
    id: 'yearly',
    label: 'Yearly',
    price: '₦200,000',
    period: '/year',
    saving: 'Save ₦40,000 vs monthly',
    popular: true,
    features: [
      'Everything in Monthly',
      'Priority email & phone support',
      '2 months free vs monthly billing',
      'Custom email branding',
      'Dedicated account manager',
      'Bulk data re-import anytime',
    ]
  }
];

const SubscriptionPage = () => {
  useSEO({ title: 'Subscription — Thankeeu for Teams', noIndex: true });

  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  useEffect(() => {
    fetchSub();
    const params = new URLSearchParams(window.location.search);
    if (params.get('sub') === 'success') {
      const ref = params.get('reference');
      if (ref) {
        subscriptionAPI.verify(ref)
          .then(() => { toast.success('Subscription activated! Birthday automations are now live.'); fetchSub(); })
          .catch(() => toast.error('Could not verify payment. Contact support.'));
      }
    }
  }, []);

  const fetchSub = async () => {
    try {
      const res = await subscriptionAPI.get();
      setSub(res.data);
    } catch { toast.error('Failed to load subscription'); }
    finally { setLoading(false); }
  };

  const handleSubscribe = async (plan) => {
    setPaying(plan);
    try {
      const res = await subscriptionAPI.initialize(plan);
      window.location.href = `https://checkout.paystack.com/${res.data.access_code}`;
    } catch { toast.error('Failed to start payment. Please try again.'); setPaying(null); }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await subscriptionAPI.cancel();
      toast.success('Subscription cancelled. Access continues until expiry.');
      fetchSub();
      setShowCancel(false);
    } catch { toast.error('Failed to cancel. Please contact support.'); }
    finally { setCancelling(false); }
  };

  const isActive = sub?.status === 'active';
  const expiresAt = sub?.expires_at ? new Date(sub.expires_at) : null;
  const daysLeft = expiresAt ? differenceInDays(expiresAt, new Date()) : 0;

  return (
    <CompanyLayout title="Subscription" subtitle="Manage your Thankeeu for Teams subscription">

      {/* Current subscription status */}
      {!loading && isActive && (
        <div className={`rounded-2xl p-5 mb-8 border ${daysLeft <= 7 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${daysLeft <= 7 ? 'bg-amber-100' : 'bg-green-100'}`}>
                {daysLeft <= 7 ? '⚠️' : '✅'}
              </div>
              <div>
                <p className={`font-semibold ${daysLeft <= 7 ? 'text-amber-800' : 'text-green-800'}`}>
                  Active — {sub?.plan === 'yearly' ? 'Yearly plan' : 'Monthly plan'}
                </p>
                <p className={`text-sm mt-0.5 ${daysLeft <= 7 ? 'text-amber-600' : 'text-green-600'}`}>
                  {daysLeft <= 0
                    ? 'Expired — renew to keep automations running'
                    : `Expires ${format(expiresAt, 'MMMM d, yyyy')} · ${daysLeft} days remaining`}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleSubscribe(sub?.plan || 'monthly')} disabled={paying}
                className="bg-primary-400 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors">
                Renew subscription
              </button>
              <button onClick={() => setShowCancel(true)}
                className="border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && !isActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="font-semibold text-amber-800">No active subscription</p>
              <p className="text-sm text-amber-600 mt-0.5">
                Team data import is always free. Subscribe below to activate automated birthday emails.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mb-10">
        {PLANS.map(plan => (
          <div key={plan.id} className={`bg-white rounded-3xl border-2 p-6 relative ${plan.popular ? 'border-primary-400 shadow-lg shadow-primary-100' : 'border-gray-200'}`}>
            {plan.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-400 text-white text-xs font-semibold px-4 py-1.5 rounded-full whitespace-nowrap">
                Best value
              </div>
            )}
            <h3 className="font-display text-xl font-semibold text-gray-900 mb-1">{plan.label}</h3>
            {plan.saving && <p className="text-xs text-green-600 font-medium mb-3">{plan.saving}</p>}
            <div className="flex items-end gap-1 mb-5">
              <span className="font-display text-4xl font-semibold text-gray-900">{plan.price}</span>
              <span className="text-gray-400 text-sm pb-1">{plan.period}</span>
            </div>
            <ul className="space-y-2.5 mb-6">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <span className="text-green-500 font-bold mt-0.5 flex-shrink-0">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={paying === plan.id || (isActive && sub?.plan === plan.id)}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 ${
                plan.popular
                  ? 'bg-primary-400 text-white hover:bg-primary-600'
                  : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}>
              {paying === plan.id
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Processing...</span>
                : isActive && sub?.plan === plan.id
                ? '✓ Current plan — click to renew'
                : `Subscribe — ${plan.price}${plan.period}`}
            </button>
          </div>
        ))}
      </div>

      {/* Payment info */}
      <div className="bg-gray-50 rounded-2xl p-5 max-w-3xl mb-6">
        <p className="text-sm font-semibold text-gray-700 mb-3">💳 Payment & billing info</p>
        <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <span className="text-green-500 font-bold">✓</span>
            <span>Payments processed securely via Paystack</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 font-bold">✓</span>
            <span>Pay via Nigerian debit card, bank transfer, or USSD</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 font-bold">✓</span>
            <span>Subscription activates immediately after payment</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 font-bold">✓</span>
            <span>Cancel anytime — access continues until expiry</span>
          </div>
        </div>
      </div>

      {/* Billing history */}
      {sub?.paystack_reference && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden max-w-3xl">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900 text-sm">Billing history</h3>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium text-gray-900">{sub?.plan === 'yearly' ? 'Yearly plan — ₦200,000' : 'Monthly plan — ₦20,000'}</p>
                <p className="text-gray-400 text-xs mt-0.5">Ref: {sub?.paystack_reference}</p>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Paid</span>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirm modal */}
      {showCancel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <div className="text-4xl text-center mb-4">😢</div>
            <h3 className="font-display text-xl font-semibold text-gray-900 text-center mb-2">Cancel subscription?</h3>
            <p className="text-gray-500 text-sm text-center mb-6 leading-relaxed">
              Birthday automations will stop after your current period ends ({expiresAt ? format(expiresAt, 'MMM d, yyyy') : ''}). Your team data will be preserved.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancel(false)} className="flex-1 btn-secondary py-3">Keep subscription</button>
              <button onClick={handleCancel} disabled={cancelling} className="flex-1 bg-red-500 text-white rounded-xl py-3 text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50">
                {cancelling ? 'Cancelling...' : 'Yes, cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </CompanyLayout>
  );
};

export default SubscriptionPage;
