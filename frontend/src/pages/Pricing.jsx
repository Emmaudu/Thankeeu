import { useSEO } from '../hooks/useSEO';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompanyAuth } from '../context/CompanyAuthContext';
import { paymentsAPI, subscriptionAPI, creditsAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import { CURRENCIES, formatCurrency, getCurrency } from '../utils/currency';

// ── Plans ─────────────────────────────────────────────────────────────────────
const INDIVIDUAL_PLANS = [
  {
    id: 'single', name: 'Classic', priceNGN: 5000, credits: 1,
    label: '1 card credit',
    btn: 'Buy 1 credit ✨', popular: false,
    btnStyle: 'border-2 border-purple-200 text-primary-600 hover:bg-primary-50',
    features: [
      { text: '1 card credit', ok: true },
      { text: 'Unlimited contributors — anyone can sign', ok: true },
      { text: '100+ premium card designs', ok: true },
      { text: 'Video, photo & voice messages', ok: true },
      { text: 'Scheduled delivery on any date', ok: true },
      { text: 'Gift pot collection via Flutterwave', ok: true },
      { text: 'WhatsApp & email invite links', ok: true },
      { text: 'Download card as PDF', ok: true },
    ],
  },
  {
    id: 'standard', name: 'Standard', priceNGN: 9000, credits: 2,
    label: '2 card credits — best per-card price',
    btn: 'Buy 2 credits 🌟', popular: true,
    btnStyle: 'bg-primary-500 text-white hover:bg-primary-600',
    features: [
      { text: '2 card credits (use any time)', ok: true },
      { text: 'All the same card features as Classic', ok: true },
      { text: 'Unlimited contributors — anyone can sign', ok: true },
      { text: '100+ premium card designs', ok: true },
      { text: 'Video, photo & voice messages', ok: true },
      { text: 'Gift pot collection via Flutterwave', ok: true },
      { text: 'WhatsApp & email invite links', ok: true },
      { text: 'Credits never expire', ok: true },
    ],
  },
  {
    id: 'pack5', name: 'Pack of 5', priceNGN: 19000, credits: 5,
    label: '5 card credits — lowest per-card price',
    btn: 'Buy 5 credits 🎁', popular: false,
    btnStyle: 'border-2 border-green-300 text-green-700 hover:bg-green-50',
    features: [
      { text: '5 card credits (use any time)', ok: true },
      { text: 'All the same card features as Classic', ok: true },
      { text: 'Unlimited contributors — anyone can sign', ok: true },
      { text: '100+ premium card designs', ok: true },
      { text: 'Video, photo & voice messages', ok: true },
      { text: 'Gift pot collection via Flutterwave', ok: true },
      { text: 'WhatsApp & email invite links', ok: true },
      { text: 'Credits never expire', ok: true },
    ],
  },
];

const COMPANY_PLANS = [
  {
    id: 'monthly', name: 'Monthly', priceNGN: 200000, period: '/month',
    features: ['Unlimited employees','Automated birthday emails','Birthday card delivery','Gift pot collection via Flutterwave','HR dashboard & analytics','Import & re-import team data','Email support within 24 hours'],
  },
  {
    id: 'yearly', name: 'Yearly', priceNGN: 2400000, period: '/year', popular: true,
    features: ['Everything in Monthly','2 months FREE vs monthly','Priority phone & email support','Custom email branding','Dedicated account manager','Advanced birthday analytics','Team data export anytime'],
  },
];

const FAQ = [
  { q: 'Is Thankeeu for Nigerians only?', a: 'Not at all! Thankeeu works globally. Contributors can pay in NGN, USD, GBP, EUR, CAD, GHS, KES, ZAR and more. The card creator pays the card fee in their preferred currency — Flutterwave handles the conversion automatically.' },
  { q: 'How does the gift pot work?', a: 'Contributors pay via Flutterwave when signing. Money is securely held and the recipient can withdraw to their bank account, buy airtime, or redeem a gift card — instantly.' },
  { q: 'Does the recipient need an account?', a: 'No — recipients open and enjoy their card without any account. Only the card creator needs one.' },
  { q: 'What payment methods are accepted?', a: 'Nigerian cards, bank transfer, USSD, mobile money. International: Visa, Mastercard, American Express. All via Flutterwave.' },
  { q: 'What happens if I cancel my company subscription?', a: 'Automation stops after your current period ends, but all your team data is preserved.' },
];

// CurrencyToggle and RotatingPrice live in utils/currencyUI.jsx
// Re-exported here for backward compatibility
export { CurrencyToggle, RotatingPrice } from '../utils/currencyUI';

// ── Main Pricing page ─────────────────────────────────────────────────────────
const Pricing = () => {
  useSEO({
    title: 'Pricing — Group Cards for Everyone Worldwide · Thankeeu',
    description: 'Send beautiful group cards from anywhere in the world. Pay in NGN, USD, GBP, EUR, CAD and more. Individual cards from ₦5,000. Team automation from ₦200,000/month.',
    canonical: '/pricing',
  });

  const { user }    = useAuth();
  const { company } = useCompanyAuth();
  const navigate    = useNavigate();

  const [tab,          setTab]          = useState('individual');
  const [currency,     setCurrency]     = useState('NGN');
  const [loadingPlan,  setLoadingPlan]  = useState(null);
  const [openFAQ,      setOpenFAQ]      = useState(null);

  const cur = getCurrency(currency);

  const fmt = (ngn) => formatCurrency(ngn, currency);

  const handleIndividualPurchase = async (planId) => {
    if (!user) {
      // Require account — store intended plan and redirect to signup
      sessionStorage.setItem('post_signup_plan', planId);
      navigate('/signup?plan=' + planId);
      return;
    }
    setLoadingPlan(planId);
    try {
      // Use creditsAPI — these are credit purchases, not direct card payments
      const res = await creditsAPI.purchase(planId, currency);
      window.location.href = res.data.payment_link;
    } catch { toast.error('Failed to start payment. Please try again.'); setLoadingPlan(null); }
  };

  const handleCompanySubscribe = async (plan) => {
    if (!company) { navigate('/company/signup'); return; }
    setLoadingPlan(plan);
    try {
      const res = await subscriptionAPI.initialize(plan, currency);
      window.location.href = res.data.payment_link || res.data.authorization_url;
    } catch { toast.error('Failed to start payment. Please try again.'); setLoadingPlan(null); }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="py-12 md:py-16 px-4 text-center" style={{ background: 'linear-gradient(160deg,#F5F0FF,#FDFCFF 60%,#FFF0F5)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="pill mx-auto mb-4">🌍 For everyone, everywhere</div>
          <h1 className="font-extrabold text-warm-900 mb-3" style={{ fontSize: 'clamp(1.75rem,6vw,3rem)' }}>
            Simple, fair pricing
          </h1>
          <p className="text-warm-600 mb-2">Pay only when you send. No subscriptions for individual cards.</p>
          <p className="text-warm-500 text-sm mb-6">
            Pay in your currency — NGN, USD, GBP, EUR, CAD, GHS and more.
          </p>

          {/* Rotating price showcase */}
          <div className="inline-flex flex-col items-center bg-white rounded-2xl border-2 border-primary-100 px-6 py-4 shadow-sm mb-6">
            <p className="text-xs text-warm-400 mb-1 font-medium">Individual card from</p>
            <div className="text-3xl font-extrabold text-primary-600 min-w-[120px] text-center">
              <RotatingPrice amountNGN={5000} />
            </div>
            <p className="text-xs text-warm-400 mt-1">· rotates every 2s so you see your currency ·</p>
          </div>

          {/* Currency selector */}
          <div className="mb-2">
            <p className="text-xs font-semibold text-warm-500 mb-2">Select your currency to see prices:</p>
            <CurrencyToggle selected={currency} onChange={setCurrency} />
          </div>
        </div>
      </section>

      {/* Tab switcher */}
      <div className="bg-white border-b border-purple-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex">
            {[
              { id: 'individual', label: '💜 Individual', sub: 'Personal cards & gifts' },
              { id: 'company',    label: '🏢 For Teams',  sub: 'Birthday automation'    },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 py-3 sm:py-4 text-center border-b-2 transition-all min-h-[56px] ${
                  tab === t.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-warm-500'
                }`}>
                <p className="font-bold text-sm">{t.label}</p>
                <p className="text-xs text-warm-400 hidden sm:block mt-0.5">{t.sub}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Individual plans */}
      {tab === 'individual' && (
        <section className="py-10 md:py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">

            {/* Currency selector (repeated for convenience) */}
            <div className="text-center mb-8">
              <p className="text-xs font-semibold text-warm-500 mb-2">Showing prices in {cur.flag} {cur.name}</p>
              <CurrencyToggle selected={currency} onChange={setCurrency} />
              {currency !== 'NGN' && (
                <p className="text-xs text-warm-400 mt-2">
                  Approximate {cur.name} equivalent · Flutterwave charges at live rate
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
              {INDIVIDUAL_PLANS.map(plan => (
                <div key={plan.id} className={`relative rounded-3xl border-2 p-6 flex flex-col ${
                  plan.popular ? 'border-primary-500 shadow-xl shadow-primary-100' : 'border-purple-100'
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
                      ⭐ Most popular
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-warm-900 mb-1">{plan.name}</h3>
                  <p className="text-warm-500 text-xs mb-4">{plan.label}</p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-3xl sm:text-4xl font-bold text-warm-900">
                      {fmt(plan.priceNGN)}
                    </span>
                    <span className="text-warm-400 text-sm pb-1">one-time</span>
                  </div>
                  {currency !== 'NGN' && (
                    <p className="text-xs text-warm-400 mb-1">≈ ₦{plan.priceNGN.toLocaleString('en-NG')} NGN</p>
                  )}
                  {plan.id === 'pack5' && (
                    <p className="text-green-600 text-xs font-bold mb-1">
                      Save {fmt(9000 * 5 - 19000)} vs buying 5 standard packs
                    </p>
                  )}
                  {plan.id === 'standard' && (
                    <p className="text-primary-600 text-xs font-bold mb-1">
                      Save {fmt(5000 * 2 - 9000)} vs 2 classic
                    </p>
                  )}
                  <div className="h-px bg-purple-100 my-4" />
                  <ul className="space-y-2.5 mb-7 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className={`flex-shrink-0 font-bold mt-0.5 ${f.ok ? 'text-green-500' : 'text-warm-300'}`}>
                          {f.ok ? '✓' : '✕'}
                        </span>
                        <span className={f.ok ? 'text-warm-700' : 'text-warm-400 line-through'}>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => handleIndividualPurchase(plan.id)} disabled={loadingPlan === plan.id}
                    className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 ${plan.btnStyle}`}>
                    {loadingPlan === plan.id
                      ? <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Processing…
                        </span>
                      : plan.btn}
                  </button>
                </div>
              ))}
            </div>

            {/* Gift pot fees */}
            <div className="bg-green-50 border border-green-200 rounded-3xl p-5 sm:p-8 max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-warm-900 mb-1 text-center">🐷 Gift pot fees</h3>
              <p className="text-warm-500 text-center text-sm mb-6">A small platform cut keeps Thankeeu running</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: '🎁', title: 'Gift vouchers',   sub: '3–5% cut'         },
                  { icon: '💳', title: 'Cash withdrawal',  sub: '3.5% platform fee' },
                  { icon: '🌍', title: 'Global payouts',   sub: 'FLW live FX rate'  },
                ].map(r => (
                  <div key={r.title} className="text-center">
                    <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2 shadow-sm">{r.icon}</div>
                    <p className="font-bold text-warm-900 text-xs">{r.title}</p>
                    <p className="text-green-600 text-xs font-bold mt-1">{r.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Company plans */}
      {tab === 'company' && (
        <section className="py-10 md:py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="pill mx-auto mb-3">🏢 Thankeeu for Teams</div>
              <h2 className="font-extrabold text-warm-900 mb-3" style={{ fontSize: 'clamp(1.5rem,5vw,2rem)' }}>
                Automate team celebrations
              </h2>
              <p className="text-warm-500 max-w-lg mx-auto text-sm leading-relaxed">
                Upload your employees once. Thankeeu handles everything — cards, emails, gift pots. All automatic.
              </p>
              <p className="text-primary-600 font-semibold text-sm mt-2">₦2,000 per employee per month · Price based on your team size</p>

              {/* Currency toggle for company plans */}
              <div className="mt-5">
                <p className="text-xs font-semibold text-warm-500 mb-2">Showing prices in {cur.flag} {cur.name}</p>
                <CurrencyToggle selected={currency} onChange={setCurrency} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-8">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <p className="font-bold text-green-800 text-sm mb-2">✅ Always free</p>
                <ul className="space-y-1.5">
                  {['Company account','Team template download','Unlimited employee upload','View birthdays dashboard'].map(f => (
                    <li key={f} className="text-xs text-green-700 flex gap-1.5"><span>✓</span>{f}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4">
                <p className="font-bold text-primary-800 text-sm mb-2">💳 Requires subscription</p>
                <ul className="space-y-1.5">
                  {['Auto birthday dept emails','Auto card creation & sending','Gift pot collection','HR analytics & tracking'].map(f => (
                    <li key={f} className="text-xs text-primary-700 flex gap-1.5"><span>→</span>{f}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto mb-10">
              {COMPANY_PLANS.map(plan => (
                <div key={plan.id} className={`relative rounded-3xl border-2 p-6 ${
                  plan.popular ? 'border-primary-500 shadow-xl shadow-primary-100' : 'border-purple-100'
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
                      ⭐ Best value
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-warm-900 mb-1">{plan.name}</h3>
                  <div className="mb-3">
                    <span className="text-2xl font-bold text-warm-900">₦2,000</span>
                    <span className="text-warm-400 text-sm"> / employee{plan.id==='monthly'?' / month':' / year'}</span>
                    <p className="text-xs text-warm-400 mt-1">Final price based on your team headcount</p>
                  </div>
                  <div className="h-px bg-purple-100 mb-4" />
                  <ul className="space-y-2 mb-7">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-green-500 font-bold mt-0.5 flex-shrink-0">✓</span>
                        <span className="text-warm-700">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => setShowDemo(true)}
                    className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all ${
                      plan.popular ? 'bg-primary-500 text-white hover:bg-primary-600' : 'border-2 border-purple-200 text-primary-600 hover:bg-primary-50'
                    }`}>
                    Get a quote — it's free
                  </button>
                </div>
              ))}
            </div>

            {!company && (
              <div className="text-center">
                <Link to="/company/signup" className="btn-primary px-6 py-3.5 text-sm sm:text-base inline-flex">
                  🏢 Create free company account
                </Link>
                <p className="text-xs text-warm-400 mt-3">
                  Already have one? <Link to="/company/login" className="text-primary-500 font-bold">Sign in →</Link>
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-12 md:py-16 px-4" style={{ background: '#F5F0FF' }}>
        <div className="max-w-2xl mx-auto">
          <h3 className="text-2xl sm:text-3xl font-bold text-warm-900 text-center mb-7">Frequently asked</h3>
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <div key={i} className="bg-white border-2 border-purple-100 rounded-2xl overflow-hidden">
                <button onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left gap-3 min-h-[56px]">
                  <span className="font-semibold text-warm-900 text-sm">{f.q}</span>
                  <span className={`text-primary-400 flex-shrink-0 transition-transform text-lg ${openFAQ === i ? 'rotate-180' : ''}`}>▾</span>
                </button>
                {openFAQ === i && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                    <p className="text-sm text-warm-600 leading-relaxed">{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 text-center" style={{ background: 'linear-gradient(135deg,#F5F0FF,#FFF0F5)' }}>
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-2">Ready to get started?</h2>
          <p className="text-warm-500 mb-2">Works for Nigeria, UK, US, Canada, Ghana, Kenya, South Africa and beyond.</p>
          <p className="text-warm-400 text-sm mb-7">Pay in your local currency. Celebrate anyone, anywhere.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup" className="btn-primary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto">
              Create personal card 💜
            </Link>
            <Link to="/company/signup" className="btn-secondary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto">
              Set up for my team 🏢
            </Link>
          </div>
        </div>
      </section>

      {/* Fade-slide animation */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <Footer />
    </div>
  );
};

export default Pricing;
