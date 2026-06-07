import { useSEO, SCHEMAS } from '../hooks/useSEO';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompanyAuth } from '../context/CompanyAuthContext';
import { paymentsAPI, subscriptionAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';

const INDIVIDUAL_PLANS = [
  {

    id: 'free', name: 'Free', price: '$0', label: 'Create and explore',
    btn: 'Start for free', btnStyle: 'border border-gray-200 text-gray-700 hover:bg-gray-50',
    features: [
      { text: 'Create unlimited draft cards', ok: true },
      { text: 'Collect messages and contributions', ok: true },
      { text: '10 basic card designs', ok: true },
      { text: 'Gift pot enabled', ok: true },
      { text: 'Video and voice messages', ok: false },
      { text: 'Scheduled sending', ok: false },
      { text: 'Premium designs (100+)', ok: false },
      { text: 'Auto reminders to contributors', ok: false },
    ]
  },
  {
    id: 'single', name: 'Classic', price: '$5', label: 'Per card, one-time',
    popular: true,
    btn: 'Get Classic', btnStyle: 'bg-primary-400 text-white hover:bg-primary-600',
    features: [
      { text: 'Everything in Free', ok: true },
      { text: 'Unlimited contributors', ok: true },
      { text: '100+ premium designs', ok: true },
      { text: 'Video and voice messages', ok: true },
      { text: 'Scheduled sending', ok: true },
      { text: 'Auto reminders to contributors', ok: true },
      { text: 'Gift pot up to $10,000', ok: true },
      { text: 'WhatsApp and email invites', ok: true },
    ]
  },
  {
    id: 'pack5', name: 'Pack of 5', price: '$20', label: 'Save $5',
    btn: 'Buy pack', btnStyle: 'border border-gray-200 text-gray-700 hover:bg-gray-50',
    features: [
      { text: 'Everything in Classic', ok: true },
      { text: '5 card credits (never expire)', ok: true },
      { text: 'Birthday reminder assistant', ok: true },
      { text: 'Priority support', ok: true },
      { text: 'Exclusive seasonal designs', ok: true },
      { text: 'GIF and sticker support', ok: true },
      { text: 'Download card as PDF', ok: true },
      { text: 'Bulk invite via CSV', ok: true },
    ]
  }
];

const COMPANY_PLANS = [
  {
    id: 'monthly', name: 'Monthly', price: '$50', period: '/month', saving: null,
    features: [
      'Unlimited employees',
      'Automated birthday emails to departments',
      'Birthday card delivered to celebrants',
      'Gift pot collection via Paystack',
      'HR dashboard and analytics',
      'Import and re-import team data anytime',
      'Email support within 24 hours',
    ]
  },
  {
    id: 'yearly', name: 'Yearly', price: '$500', period: '/year', saving: 'Save $100 vs monthly',
    popular: true,
    features: [
      'Everything in Monthly',
      '2 months free vs monthly billing',
      'Priority phone and email support',
      'Custom email branding',
      'Dedicated account manager',
      'Advanced birthday analytics',
      'Team data export anytime',
    ]
  }
];

const FAQ = [
  { q: 'How does the gift pot work?', a: 'Contributors pay via Paystack when they sign the card. The money is securely held and the recipient can redeem it for vouchers, flowers, or a bank transfer.' },
  { q: 'Does the recipient need an account?', a: 'No — recipients open and enjoy their card without any account. Only the card creator needs one.' },
  { q: 'What payment methods are supported?', a: 'All major credit/debit cards, bank transfers, and mobile money via Paystack.' },
  { q: 'Is the team data import free?', a: 'Yes, always. You can upload your entire team for free. You only pay the subscription to activate the automated birthday email sending.' },
  { q: 'What happens if I cancel my company subscription?', a: 'Automation stops after your current period ends, but all your team data is preserved. You can resubscribe at any time to restart automations.' },
  { q: 'Can I get a refund?', a: 'Individual card fees are non-refundable once activated. Company subscription fees are non-refundable but access continues until the period ends.' },
];

const Pricing = () => {
  useSEO({
    title:       'Pricing — Group Cards from $5 · Teams from $50/month',
    description: 'Simple pricing for group cards and gifts. Individual card $5, pack of 5 for $20. Company plans from $50/month with unlimited employees and HRIS integration.',
    canonical:   '/pricing',
    jsonLd:      [
      SCHEMAS.organization,
      SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }, { name: 'Pricing', url: '/pricing' }]),
      SCHEMAS.product('Thankeeu Classic Card', 'Group card with unlimited signatures, gift pot, media uploads and scheduled delivery.', 1500),
      SCHEMAS.product('Thankeeu Card Pack of 5', 'Five group card credits — save $5 vs buying individually. Credits never expire.', 5000),
      SCHEMAS.product('Thankeeu Classic Card', 'Send a group card to one recipient with unlimited signatures, gift pot, media uploads and scheduled delivery.', 1500),
      SCHEMAS.product('Thankeeu Card Pack of 5', 'Five group card credits — save $5 vs buying individually. Credits never expire. Perfect for regular use.', 5000),
      SCHEMAS.product('Thankeeu for Teams Monthly', 'Unlimited employees, automated birthday and farewell cards, HRIS integration. $50/month.', 20000),
      SCHEMAS.faqPage([
        { q: 'Is Thankeeu free to use?',                         a: 'Creating a card and collecting messages is completely free. You only pay $5 when you want to send the finished card to the recipient.' },
        { q: 'How much does the gift pot cost?',                 a: 'Setting up a gift pot is free. Thankeeu takes a 4% platform fee from the contributions collected. There are no hidden charges or setup fees.' },
        { q: 'How does the card pack of 5 work?',               a: 'Buy 5 card credits for $20 (saving $5 vs buying 5 cards individually at $5 each). Credits are linked to your account and never expire.' },
        { q: 'How does the company subscription work?',          a: 'Pay $50/month or $500/year for unlimited employees and automated occasion cards. Connect your HRIS, Thankeeu handles everything. Cancel any time.' },
        { q: 'Can I cancel my company subscription?',           a: 'Yes, you can cancel at any time from your company dashboard. Your subscription remains active until the end of the current billing period.' },
        { q: 'What HRIS systems does Thankeeu integrate with?', a: 'Thankeeu integrates with SeamlessHR, BambooHR, Zoho People, WorkPay and SAP SuccessFactors. One connection syncs all employee data into all occasion tables automatically.' },
        { q: 'Is the $500 yearly plan paid upfront?',       a: 'Yes, the yearly plan is billed upfront at $500 saving you $100 compared to paying monthly. You get 12 months of uninterrupted service.' },
        { q: 'Can I use Thankeeu for Teams for free?',     a: 'There is no free trial currently, but you can book a free demo to see the platform before subscribing.' },
        { q: 'Do card credits expire?',                    a: 'No. Purchased card credits never expire and can be used at any time.' },
      ]),
    ],
  });

  const { user } = useAuth();
  const { company } = useCompanyAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('individual');
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [openFAQ, setOpenFAQ] = useState(null);

  const handleIndividualPurchase = async (planId) => {
    if (!user) { navigate('/signup'); return; }
    if (planId === 'free') { navigate('/create'); return; }
    setLoadingPlan(planId);
    try {
      const res = await paymentsAPI.initPurchase(planId);
      window.location.href = `https://checkout.paystack.com/${res.data.access_code}`;
    } catch {
      toast.error('Failed to start payment. Please try again.');
      setLoadingPlan(null);
    }
  };

  const handleCompanySubscribe = async (plan) => {
    if (!company) { navigate('/company/signup'); return; }
    setLoadingPlan(plan);
    try {
      const res = await subscriptionAPI.initialize(plan);
      window.location.href = `https://checkout.paystack.com/${res.data.access_code}`;
    } catch {
      toast.error('Failed to start payment. Please try again.');
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="gradient-hero py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="font-display text-5xl font-semibold text-gray-900 mb-4">Simple, fair pricing</h1>
          <p className="text-gray-600 text-lg">Pay only when you send. No subscriptions needed for individual cards.</p>
        </div>
      </section>

      {/* Tab switcher */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex">
            {[
              { id: 'individual', label: '💜 For individuals', sub: 'Personal cards & gifts' },
              { id: 'company', label: '🏢 For companies', sub: 'Team birthday automation' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 py-4 text-center border-b-2 transition-all ${
                  tab === t.id ? 'border-primary-400 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                <p className="font-semibold text-sm">{t.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.sub}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Individual plans */}
      {tab === 'individual' && (
        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              {INDIVIDUAL_PLANS.map(plan => (
                <div key={plan.id} className={`relative rounded-3xl border-2 p-6 ${plan.popular ? 'border-primary-400 shadow-xl shadow-primary-100' : 'border-gray-200'}`}>
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-400 text-white text-xs font-semibold px-4 py-1.5 rounded-full">
                      Most popular
                    </div>
                  )}
                  <h3 className="font-display text-xl font-semibold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">{plan.label}</p>
                  <div className="flex items-end gap-1 mb-6">
                    <span className="font-display text-4xl font-semibold text-gray-900">{plan.price}</span>
                    {plan.id !== 'free' && <span className="text-gray-400 text-sm pb-1">one-time</span>}
                  </div>
                  {plan.id === 'pack5' && (
                    <p className="text-green-600 text-xs font-medium -mt-4 mb-4">$4 per card — save $5</p>
                  )}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <span className={`mt-0.5 flex-shrink-0 font-bold ${f.ok ? 'text-green-500' : 'text-gray-300'}`}>{f.ok ? '✓' : '✕'}</span>
                        <span className={f.ok ? 'text-gray-700' : 'text-gray-400'}>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => handleIndividualPurchase(plan.id)} disabled={loadingPlan === plan.id}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 ${plan.btnStyle}`}>
                    {loadingPlan === plan.id
                      ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Processing...</span>
                      : plan.btn}
                  </button>
                </div>
              ))}
            </div>

            {/* Gift pot info */}
            <div className="bg-green-50 rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto mb-16">
              <h3 className="font-display text-xl font-semibold text-gray-900 mb-2 text-center">Also earn from gift pots</h3>
              <p className="text-gray-500 text-center text-sm mb-6">A small platform cut keeps Thankeeu free to use</p>
              <div className="grid sm:grid-cols-3 gap-6">
                {[
                  { icon: '🌹', title: 'Flower delivery', sub: '15% referral per order' },
                  { icon: '🎁', title: 'Gift vouchers', sub: '3–5% per redemption' },
                  { icon: '💳', title: 'Gift pot fee', sub: '4% platform cut' },
                ].map(r => (
                  <div key={r.title} className="text-center">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2 shadow-sm">{r.icon}</div>
                    <p className="font-semibold text-gray-900 text-sm">{r.title}</p>
                    <p className="text-green-600 text-xs font-medium mt-1">{r.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Company plans */}
      {tab === 'company' && (
        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                🏢 Thankeeu for Teams
              </div>
              <h2 className="font-display text-3xl font-semibold text-gray-900 mb-3">Automate birthday celebrations for your team</h2>
              <p className="text-gray-600 max-w-xl mx-auto text-sm leading-relaxed">
                Upload your employees once. Thankeeu handles everything — department emails, group cards, gift pots, and delivery. All fully automatic.
              </p>
            </div>

            {/* What's free vs paid */}
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-10">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <p className="font-semibold text-green-800 text-sm mb-2">✅ Always free</p>
                <ul className="space-y-1.5">
                  {['Create company account','Download team template','Upload unlimited employees','View team data and birthdays'].map(f => (
                    <li key={f} className="text-xs text-green-700 flex items-center gap-1.5"><span>✓</span>{f}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4">
                <p className="font-semibold text-primary-800 text-sm mb-2">💳 Requires subscription</p>
                <ul className="space-y-1.5">
                  {['Automated department birthday emails','Auto-create and send birthday cards','Gift pot collection per birthday','HR analytics and card tracking'].map(f => (
                    <li key={f} className="text-xs text-primary-700 flex items-center gap-1.5"><span>→</span>{f}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
              {COMPANY_PLANS.map(plan => (
                <div key={plan.id} className={`relative rounded-3xl border-2 p-6 ${plan.popular ? 'border-primary-400 shadow-xl shadow-primary-100' : 'border-gray-200'}`}>
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-400 text-white text-xs font-semibold px-4 py-1.5 rounded-full">
                      Best value
                    </div>
                  )}
                  <h3 className="font-display text-xl font-semibold text-gray-900 mb-1">{plan.name}</h3>
                  {plan.saving && <p className="text-xs text-green-600 font-medium mb-3">{plan.saving}</p>}
                  <div className="flex items-end gap-1 mb-5">
                    <span className="font-display text-4xl font-semibold text-gray-900">{plan.price}</span>
                    <span className="text-gray-400 text-sm pb-1">{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 mb-8">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <span className="text-green-500 font-bold mt-0.5 flex-shrink-0">✓</span>
                        <span className="text-gray-700">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => handleCompanySubscribe(plan.id)} disabled={loadingPlan === plan.id}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 ${
                      plan.popular ? 'bg-primary-400 text-white hover:bg-primary-600' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}>
                    {loadingPlan === plan.id
                      ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Processing...</span>
                      : company ? `Subscribe — ${plan.price}${plan.period}` : 'Create company account first'}
                  </button>
                </div>
              ))}
            </div>

            {!company && (
              <div className="text-center mb-12">
                <Link to="/company/signup" className="btn-primary px-10 py-4 text-base inline-block">
                  🏢 Create free company account first
                </Link>
                <p className="text-xs text-gray-400 mt-3">Already have one? <Link to="/company/login" className="text-primary-400 hover:underline">Sign in →</Link></p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h3 className="font-display text-3xl font-semibold text-gray-900 text-center mb-8">Frequently asked questions</h3>
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <button onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left">
                  <span className="font-medium text-gray-900 text-sm pr-4">{f.q}</span>
                  <span className={`text-primary-400 flex-shrink-0 transition-transform ${openFAQ === i ? 'rotate-180' : ''}`}>▾</span>
                </button>
                {openFAQ === i && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 gradient-hero text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="font-display text-4xl font-semibold text-gray-900 mb-4">Ready to get started?</h2>
          <p className="text-gray-600 mb-8">Individual or company — Thankeeu has you covered.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="btn-primary px-8 py-4 text-base">Create personal card 💜</Link>
            <Link to="/company/signup" className="btn-secondary px-8 py-4 text-base">Set up for my team 🏢</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
