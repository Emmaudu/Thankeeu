import { useSEO } from '../../hooks/useSEO';
import { useState, useEffect, useRef } from 'react';
import { subscriptionAPI } from '../../utils/api';
import CompanyLayout from '../../components/company/CompanyLayout';
import toast from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const fmtNGN = (n) => n === 0 ? 'Free' : `₦${Number(n).toLocaleString('en-NG')}`;

export default function SubscriptionPage() {
  useSEO({ title: 'Subscription — Thankeeu for Teams', noIndex: true });

  const [sub,       setSub]      = useState(null);
  const [quote,     setQuote]    = useState(null);
  const [loading,   setLoading]  = useState(true);
  const [paying,    setPaying]   = useState(null);
  const [cancelling,setCancelling]= useState(false);
  const [showCancel,setShowCancel]= useState(false);
  const [checking,  setChecking] = useState(false);
  const pollRef    = useRef(null);
  const navigate   = useNavigate();

  const tok = () => localStorage.getItem('thankeeu_company_token');
  const BASE = import.meta.env.VITE_API_URL || '/api';

  const fetchSub = async () => {
    try {
      const [sRes, qRes] = await Promise.all([
        subscriptionAPI.get(),
        subscriptionAPI.getQuote().catch(() => ({ data: null })),
      ]);
      setSub(sRes.data);
      setQuote(qRes.data);
    } catch { setSub(null); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const ref     = params.get('tx_ref') || params.get('reference');
    const isReturn = params.get('sub') === 'success' || !!ref;

    if (isReturn) window.history.replaceState({}, '', '/company/subscription');

    const init = async () => {
      if (isReturn && ref) {
        setChecking(true);
        try {
          await subscriptionAPI.verify(ref);
          toast.success('🎉 Subscription activated!');
          await fetchSub();
          return;
        } catch {
          toast('Verifying payment — please wait…', { icon: '⏳' });
        } finally { setChecking(false); }
      }
      await fetchSub();
    };
    init();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleSubscribe = async (plan) => {
    if (!quote?.multiplier_set) {
      return toast.error('Pricing has not been set for your account yet. Contact us to get a quote.');
    }
    if (quote?.is_free) {
      return toast('Your company is on a free plan — no payment needed!', { icon: '🎉' });
    }
    setPaying(plan);
    try {
      const res = await subscriptionAPI.initialize(plan);
      window.location.assign(res.data.payment_link || res.data.authorization_url);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start payment');
      setPaying(null);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await subscriptionAPI.cancel();
      toast.success('Subscription cancelled. Access continues until expiry.');
      setShowCancel(false);
      await fetchSub();
    } catch { toast.error('Failed to cancel'); }
    finally { setCancelling(false); }
  };

  // ── Pilot status ──────────────────────────────────────────────────────────
  const now = new Date();
  const pilotActive = sub?.pilot_ends_at && new Date(sub.pilot_ends_at) > now;
  const pilotDaysLeft = pilotActive ? differenceInDays(new Date(sub.pilot_ends_at), now) : 0;

  // ── Subscription active ───────────────────────────────────────────────────
  const isActive = sub?.is_active;
  const daysLeft = isActive && sub?.expires_at ? differenceInDays(new Date(sub.expires_at), now) : 0;

  if (loading || checking) return (
    <CompanyLayout>
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"/>
        {checking && <p className="ml-4 text-warm-600 font-medium">Confirming your payment…</p>}
      </div>
    </CompanyLayout>
  );

  return (
    <CompanyLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-warm-900 mb-1">Subscription</h1>
        <p className="text-warm-500 text-sm mb-8">Manage your team automation plan</p>

        {/* ── Pilot banner ─────────────────────────────────────────────── */}
        {pilotActive && (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
            <span className="text-3xl">🧪</span>
            <div>
              <p className="font-bold text-green-800 text-base mb-1">You are on a pilot — {pilotDaysLeft} days remaining</p>
              <p className="text-sm text-green-700">All automation features are active and free during your pilot period. You will be notified before it ends.</p>
              <p className="text-xs text-green-600 mt-1">Pilot ends: {format(new Date(sub.pilot_ends_at), 'MMMM d, yyyy')}</p>
            </div>
          </div>
        )}

        {/* ── Active subscription ───────────────────────────────────────── */}
        {isActive && !pilotActive && (
          <div className="bg-primary-50 border-2 border-primary-200 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-2">
                  ✓ Active
                </span>
                <p className="font-bold text-warm-900 capitalize">{sub.plan} plan</p>
                <p className="text-sm text-warm-500">
                  Expires {sub.expires_at ? format(new Date(sub.expires_at), 'MMMM d, yyyy') : '—'}
                  {daysLeft > 0 && ` · ${daysLeft} days left`}
                </p>
              </div>
              <button onClick={() => setShowCancel(true)} disabled={cancelling}
                className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50">
                Cancel subscription
              </button>
            </div>
          </div>
        )}

        {/* ── Quote / headcount section ─────────────────────────────────── */}
        <div className="bg-white border-2 border-purple-100 rounded-2xl p-5 mb-6">
          <h2 className="font-bold text-warm-900 mb-4">Your pricing</h2>

          {!quote || !quote.multiplier_set ? (
            /* No multiplier set yet */
            <div className="text-center py-6">
              <p className="text-4xl mb-3">📋</p>
              {(quote?.head_count || 0) > 0
                ? <p className="font-semibold text-warm-900 mb-1">{quote.head_count} employees imported</p>
                : <p className="text-warm-500 mb-1">No employees imported yet</p>
              }
              <p className="text-sm text-warm-500 mb-4">
                {(quote?.head_count || 0) > 0
                  ? 'Pricing is being configured for your account. Contact us to get your quote.'
                  : 'Import your team via the Occasions Manager or HRIS to see pricing.'}
              </p>
              <a href="mailto:hello@thankeeu.com?subject=Subscription quote request"
                className="btn-primary px-6 py-2.5 text-sm inline-block">
                Get a quote →
              </a>
            </div>
          ) : quote.is_free ? (
            /* Free plan */
            <div className="text-center py-4">
              <p className="text-5xl mb-3">🎉</p>
              <p className="font-bold text-green-700 text-xl mb-1">Your plan is free</p>
              <p className="text-sm text-warm-500">{quote.head_count} employees · All automation features included</p>
            </div>
          ) : (
            /* Paid plan with multiplier */
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-2 text-sm font-semibold text-primary-700">
                  👥 {quote.head_count} employees
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-2 text-sm font-semibold text-purple-700">
                  ₦{Number(quote.per_head_rate).toLocaleString('en-NG')} per employee / month
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Monthly */}
                <div className={`rounded-2xl border-2 p-5 ${isActive && sub?.plan === 'monthly' ? 'border-primary-400 bg-primary-50' : 'border-purple-100'}`}>
                  <p className="font-bold text-warm-900 mb-1">Monthly</p>
                  <p className="text-2xl font-extrabold text-primary-600 mb-1">{fmtNGN(quote.monthly_price)}</p>
                  <p className="text-xs text-warm-400 mb-4">{quote.head_count} × ₦{Number(quote.per_head_rate).toLocaleString('en-NG')} / month</p>
                  <button onClick={() => handleSubscribe('monthly')} disabled={!!paying || isActive}
                    className="btn-primary w-full py-2.5 text-sm disabled:opacity-50">
                    {paying === 'monthly' ? 'Redirecting…' : isActive && sub?.plan === 'monthly' ? 'Current plan' : 'Subscribe monthly'}
                  </button>
                </div>

                {/* Yearly */}
                <div className={`relative rounded-2xl border-2 p-5 ${isActive && sub?.plan === 'yearly' ? 'border-primary-400 bg-primary-50' : 'border-primary-300'}`}>
                  <div className="absolute -top-3 left-4 bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full">Best value</div>
                  <p className="font-bold text-warm-900 mb-1">Yearly</p>
                  <p className="text-2xl font-extrabold text-primary-600 mb-1">{fmtNGN(quote.yearly_price)}</p>
                  <p className="text-xs text-green-600 font-semibold mb-1">2 months free</p>
                  <p className="text-xs text-warm-400 mb-4">{quote.head_count} × ₦{Number(quote.per_head_rate).toLocaleString('en-NG')} × 10 months</p>
                  <button onClick={() => handleSubscribe('yearly')} disabled={!!paying || isActive}
                    className="bg-primary-500 text-white w-full py-2.5 text-sm font-bold rounded-2xl hover:bg-primary-600 transition-all disabled:opacity-50">
                    {paying === 'yearly' ? 'Redirecting…' : isActive && sub?.plan === 'yearly' ? 'Current plan' : 'Subscribe yearly'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cancel confirm */}
        {showCancel && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h3 className="font-bold text-warm-900 mb-2">Cancel subscription?</h3>
              <p className="text-sm text-warm-500 mb-5">Access continues until expiry. Automation stops after that.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowCancel(false)} className="btn-secondary flex-1 py-2.5 text-sm">Keep it</button>
                <button onClick={handleCancel} disabled={cancelling}
                  className="flex-1 py-2.5 text-sm font-bold rounded-2xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50">
                  {cancelling ? 'Cancelling…' : 'Yes, cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}
