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
    id:'single', name:'Classic', price:'₦5,000', label:'Per card, one-time', popular:true,
    btn:'Get Classic ✨', btnStyle:'bg-primary-500 text-white hover:bg-primary-600',
    features:[
      { text:'Unlimited contributors — anyone can sign', ok:true },
      { text:'100+ premium card designs', ok:true },
      { text:'Video, photo & voice messages', ok:true },
      { text:'Scheduled delivery on any date', ok:true },
      { text:'Auto reminders to contributors', ok:true },
      { text:'Gift pot up to ₦10,000,000', ok:true },
      { text:'WhatsApp and email invite links', ok:true },
      { text:'Download card as PDF', ok:true },
    ]
  },
  {
    id:'pack5', name:'Pack of 5', price:'₦20,000', label:'₦4,000 per card — save ₦5,000',
    btn:'Buy pack 🎁', btnStyle:'border-2 border-purple-200 text-primary-600 hover:bg-primary-50',
    features:[
      { text:'Everything in Classic', ok:true },
      { text:'5 card credits (never expire)', ok:true },
      { text:'Birthday reminder assistant', ok:true },
      { text:'Priority support', ok:true },
      { text:'Exclusive seasonal designs', ok:true },
      { text:'GIF and sticker support', ok:true },
      { text:'Bulk invite via CSV', ok:true },
      { text:'Dedicated card manager', ok:true },
    ]
  },
];

const COMPANY_PLANS = [
  {
    id:'monthly', name:'Monthly', price:'₦200,000', period:'/month', saving:null,
    features:['Unlimited employees','Automated birthday emails to departments','Birthday card delivered to celebrants','Gift pot collection via Flutterwave','HR dashboard and analytics','Import and re-import team data','Email support within 24 hours'],
  },
  {
    id:'yearly', name:'Yearly', price:'₦2,400,000', period:'/year', popular:true, saving:null,
    features:['Everything in Monthly','2 months free vs monthly billing','Priority phone and email support','Custom email branding','Dedicated account manager','Advanced birthday analytics','Team data export anytime'],
  },
];

const FAQ = [
  { q:'How does the gift pot work?', a:'Contributors pay via Flutterwave when they sign the card. Money is securely held and the recipient can redeem it for vouchers, flowers, or a bank transfer.' },
  { q:'Does the recipient need an account?', a:'No — recipients open and enjoy their card without any account. Only the card creator needs one.' },
  { q:'What payment methods are supported?', a:'All Nigerian debit/credit cards, bank transfers, USSD, and mobile money via Flutterwave.' },
  { q:'Is the team data import free?', a:'Yes, always. You only pay the subscription to activate automated birthday email sending.' },
  { q:'What happens if I cancel my company subscription?', a:'Automation stops after your current period ends, but all your team data is preserved.' },
  { q:'Can I get a refund?', a:'Individual card fees are non-refundable once activated. Company subscriptions remain active until the period ends.' },
];

const Pricing = () => {
  useSEO({
    title:'Pricing — Group Cards from ₦5,000 · No Free Tier · Teams from ₦200,000/month',
    description:'Simple Naira pricing for group cards and gifts. Individual card from ₦5,000, pack of 5 for ₦20,000. Company plans from ₦200,000/month.',
    canonical:'/pricing',
  });

  const { user } = useAuth();
  const { company } = useCompanyAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('individual');
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [openFAQ, setOpenFAQ] = useState(null);

  const handleIndividualPurchase = async (planId) => {
    if (!user) { navigate('/signup'); return; }
    setLoadingPlan(planId);
    try {
      const res = await paymentsAPI.initPurchase(planId);
      window.location.href = res.data.payment_link || res.data.authorization_url;
    } catch { toast.error('Failed to start payment. Please try again.'); setLoadingPlan(null); }
  };

  const handleCompanySubscribe = async (plan) => {
    if (!company) { navigate('/company/signup'); return; }
    setLoadingPlan(plan);
    try {
      const res = await subscriptionAPI.initialize(plan);
      window.location.href = res.data.payment_link || res.data.authorization_url;
    } catch { toast.error('Failed to start payment. Please try again.'); setLoadingPlan(null); }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="py-12 md:py-16 px-4 text-center" style={{ background:'linear-gradient(160deg,#F5F0FF,#FDFCFF 60%,#FFF0F5)' }}>
        <div className="max-w-xl mx-auto">
          <div className="pill mx-auto mb-4">💳 Simple Naira pricing</div>
          <h1 className="font-extrabold text-warm-900 mb-3" style={{ fontSize:'clamp(1.75rem,6vw,3rem)' }}>Simple, fair pricing</h1>
          <p className="text-warm-600">Pay only when you send. No subscriptions for individual cards.</p>
        </div>
      </section>

      {/* Tab switcher — sticky */}
      <div className="bg-white border-b border-purple-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex">
            {[
              { id:'individual', label:'💜 Individual', sub:'Personal cards & gifts' },
              { id:'company', label:'🏢 For Teams', sub:'Birthday automation' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 py-3 sm:py-4 text-center border-b-2 transition-all min-h-[56px] ${
                  tab===t.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-warm-500'
                }`}>
                <p className="font-bold text-sm">{t.label}</p>
                <p className="text-xs text-warm-400 hidden sm:block mt-0.5">{t.sub}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Individual plans */}
      {tab==='individual' && (
        <section className="py-10 md:py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {INDIVIDUAL_PLANS.map(plan => (
                <div key={plan.id} className={`relative rounded-3xl border-2 p-6 ${plan.popular ? 'border-primary-500 shadow-xl shadow-primary-100' : 'border-purple-100'}`}>
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
                      ⭐ Most popular
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-warm-900 mb-1">{plan.name}</h3>
                  <p className="text-warm-500 text-xs mb-4">{plan.label}</p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-3xl sm:text-4xl font-bold text-warm-900">{plan.price}</span>
                    <span className="text-warm-400 text-sm pb-1">one-time</span>
                  </div>
                  {plan.id==='pack5' && <p className="text-green-600 text-xs font-bold mb-4">₦2,000 per card — save ₦15,000 vs singles</p>}
                  <div className="h-px bg-purple-100 my-4" />
                  <ul className="space-y-2.5 mb-7">
                    {plan.features.map((f,i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className={`flex-shrink-0 font-bold mt-0.5 ${f.ok ? 'text-green-500' : 'text-warm-300'}`}>{f.ok ? '✓' : '✕'}</span>
                        <span className={f.ok ? 'text-warm-700' : 'text-warm-400 line-through decoration-warm-300'}>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => handleIndividualPurchase(plan.id)} disabled={loadingPlan===plan.id}
                    className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 ${plan.btnStyle}`}>
                    {loadingPlan===plan.id
                      ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>Processing…</span>
                      : plan.btn}
                  </button>
                </div>
              ))}
            </div>

            {/* Gift pot info */}
            <div className="bg-green-50 border border-green-200 rounded-3xl p-5 sm:p-8 max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-warm-900 mb-1 text-center">🐷 Gift pot fees</h3>
              <p className="text-warm-500 text-center text-sm mb-6">A small platform cut keeps Thankeeu running</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon:'🌹', title:'Flower delivery', sub:'15% referral' },
                  { icon:'🎁', title:'Gift vouchers', sub:'3–5% cut' },
                  { icon:'💳', title:'Cash gift pot', sub:'3.5% platform fee' },
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
      {tab==='company' && (
        <section className="py-10 md:py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="pill mx-auto mb-3">🏢 Thankeeu for Teams</div>
              <h2 className="font-extrabold text-warm-900 mb-3" style={{ fontSize:'clamp(1.5rem,5vw,2rem)' }}>Automate team celebrations</h2>
              <p className="text-warm-500 max-w-lg mx-auto text-sm leading-relaxed">Upload your employees once. Thankeeu handles everything — cards, emails, gift pots. All automatic.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-8">
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
                <div key={plan.id} className={`relative rounded-3xl border-2 p-6 ${plan.popular ? 'border-primary-500 shadow-xl shadow-primary-100' : 'border-purple-100'}`}>
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">⭐ Best value</div>
                  )}
                  <h3 className="text-xl font-bold text-warm-900 mb-1">{plan.name}</h3>
                  {plan.saving && <p className="text-xs text-green-600 font-bold mb-3">{plan.saving}</p>}
                  <div className="flex items-end gap-1 mb-4">
                    <span className="text-3xl font-bold text-warm-900">{plan.price}</span>
                    <span className="text-warm-400 text-sm pb-1">{plan.period}</span>
                  </div>
                  <div className="h-px bg-purple-100 mb-4" />
                  <ul className="space-y-2 mb-7">
                    {plan.features.map((f,i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-green-500 font-bold mt-0.5 flex-shrink-0">✓</span>
                        <span className="text-warm-700">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => handleCompanySubscribe(plan.id)} disabled={loadingPlan===plan.id}
                    className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 ${
                      plan.popular ? 'bg-primary-500 text-white hover:bg-primary-600' : 'border-2 border-purple-200 text-primary-600 hover:bg-primary-50'
                    }`}>
                    {loadingPlan===plan.id
                      ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>Processing…</span>
                      : company ? `Subscribe — ${plan.price}${plan.period}` : 'Create company account first'}
                  </button>
                </div>
              ))}
            </div>

            {!company && (
              <div className="text-center">
                <Link to="/company/signup" className="btn-primary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto w-full sm:w-auto inline-flex">🏢 Create free company account first</Link>
                <p className="text-xs text-warm-400 mt-3">Already have one? <Link to="/company/login" className="text-primary-500 font-bold">Sign in →</Link></p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-12 md:py-16 px-4" style={{ background:'#F5F0FF' }}>
        <div className="max-w-2xl mx-auto">
          <h3 className="text-2xl sm:text-3xl font-bold text-warm-900 text-center mb-7">Frequently asked</h3>
          <div className="space-y-3">
            {FAQ.map((f,i) => (
              <div key={i} className="bg-white border-2 border-purple-100 rounded-2xl overflow-hidden">
                <button onClick={() => setOpenFAQ(openFAQ===i ? null : i)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left gap-3 min-h-[56px]">
                  <span className="font-semibold text-warm-900 text-sm">{f.q}</span>
                  <span className={`text-primary-400 flex-shrink-0 transition-transform text-lg ${openFAQ===i ? 'rotate-180' : ''}`}>▾</span>
                </button>
                {openFAQ===i && (
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
      <section className="py-14 px-4 text-center" style={{ background:'linear-gradient(135deg,#F5F0FF,#FFF0F5)' }}>
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-4">Ready to get started?</h2>
          <p className="text-warm-600 mb-7">Individual or company — Thankeeu has you covered.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup" className="btn-primary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto w-full sm:w-auto">Create personal card 💜</Link>
            <Link to="/company/signup" className="btn-secondary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto w-full sm:w-auto">Set up for my team 🏢</Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Pricing;
