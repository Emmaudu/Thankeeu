import { useSEO, SCHEMAS } from '../hooks/useSEO';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { demoAPI } from '../utils/api';
import toast from 'react-hot-toast';

const OCCASIONS = [
  {
 icon: '🎂', label: 'Birthday' },      { icon: '💝', label: "Valentine's" },
  { icon: '💼', label: 'Leaving job' },    { icon: '💍', label: 'Anniversary' },
  { icon: '💒', label: 'Wedding' },        { icon: '👶', label: 'Baby shower' },
  { icon: '🎓', label: 'Graduation' },     { icon: '🌟', label: 'Promotion' },
  { icon: '🏖️', label: 'Retirement' },    { icon: '🎄', label: 'Christmas' },
  { icon: '🌷', label: 'Get well' },       { icon: '💌', label: 'Other' },
];

const STEPS = [
  { num: '01', icon: '🎨', title: 'Create your card',       desc: 'Pick an occasion, choose a beautiful design, set your delivery date. Takes 2 minutes.' },
  { num: '02', icon: '📲', title: 'Invite people to sign',  desc: 'Share a link on WhatsApp or email. Everyone adds their message, photo, or video.' },
  { num: '03', icon: '🎁', title: 'Collect a gift together',desc: 'Anyone can chip in from $1 into a shared gift pot. No awkward collecting.' },
  { num: '04', icon: '💌', title: 'Deliver the surprise',   desc: "Schedule delivery or send instantly. One beautiful card with everyone's love." },
];

const TESTIMONIALS = [
  { name: 'Adaeze O.', location: 'London',         text: "My team used Thankeeu for our colleague's farewell and she literally cried. Everyone contributed to a spa voucher. So easy!", av: 'AO' },
  { name: 'Emeka T.',  location: 'New York',          text: "Organised my girlfriend's birthday card from London. 22 people signed and we raised $500 for her. She was shocked!",     av: 'ET' },
  { name: 'Kemi B.',   location: 'Toronto',  text: "No more Google forms and chasing people for money. Paystack makes it seamless.",       av: 'KB' },
];

const TEAM_FEATURES = [
  { icon: '📥', title: 'Upload employee data',       desc: "Import your entire team via Excel or connect your HRIS — SeamlessHR, BambooHR, Zoho People, WorkPay." },
  { icon: '🎉', title: '12 occasions automated',     desc: "Birthdays, farewells, promotions, new hires, Women's Day and more — all handled automatically." },
  { icon: '💌', title: 'Cards delivered on the day', desc: 'The whole department gets notified to sign. The celebrant receives their card on the special day"' },
  { icon: '🎁', title: 'Gift pot included',           desc: "Colleagues chip in via Paystack. HR never has to chase anyone for money again." },
];

const TEAM_SIZE_OPTIONS = ['1–10', '11–50', '51–200', '201–500', '500+'];

const DemoModal = ({ onClose }) => {
  useSEO({
    title:       'Group Cards & Gifts — Celebrate Every Milestone Together',
    description: "The world's favorite group card and gift platform. Create beautiful online group cards, collect heartfelt messages and gift pots. Birthdays, farewells, promotions and more.",
    canonical:   '/',
    keywords:    'group card, birthday card online, farewell card, group gift, thankeeu, team celebration, online group card, office birthday card, group greeting card',
    jsonLd:      [
      SCHEMAS.organization,
      SCHEMAS.website,
      SCHEMAS.softwareApp,
      SCHEMAS.localBusiness,
      SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }]),
      SCHEMAS.webPage(
        'Thankeeu — Group Cards & Gifts for Every Occasion',
        'Create beautiful group cards, collect heartfelt messages and Paystack gift pots for birthdays, farewells, promotions and more.',
        '/',
        { speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', 'h2'] } }
      ),
      SCHEMAS.faqPage([
        { q: 'How does Thankeeu work?',               a: 'Create a free card, share a WhatsApp or email link so everyone can sign and leave messages, optionally collect a gift pot via Paystack, then schedule delivery for the special day.' },
        { q: 'How much does Thankeeu cost?',          a: 'Creating a card and collecting messages is completely free. Sending the card to the recipient costs $5 per card, or $20 for a pack of 5 cards (saving $5).' },
        { q: 'Does the recipient need an account?',   a: 'No. Recipients can open and read their card, listen to voice notes and see the gift amount without creating an account. Only the card creator needs to sign up.' },
        { q: 'How does the gift pot work?',           a: 'Anyone with the signing link can contribute any amount via Paystack (cards, bank transfer, USSD). Thankeeu collects a 4% platform fee. The remaining amount is sent to the recipient or their bank account.' },
        { q: 'Can I schedule when the card is sent?', a: 'Yes! Set a delivery date and time, and Thankeeu will automatically send the card to the recipient on that day. You can also send it instantly.' },
        { q: 'Is Thankeeu available for companies?',  a: 'Yes! Thankeeu for Teams lets companies automate birthday cards, farewell cards, promotions, new hire welcomes, and more for their entire team. Connect SeamlessHR, BambooHR, Zoho People, WorkPay or SAP SuccessFactors for automatic sync. Starts at $50/month.' },
        { q: 'Which payment methods are supported?',  a: 'Thankeeu uses Paystack, which supports all major cards (Visa, Mastercard, etc.), bank transfers, and mobile payments.' },
        { q: 'Can people from any country use Thankeeu?', a: 'Yes! Thankeeu works globally. Anyone with a card or bank account can sign and contribute from anywhere in the world.' },
        { q: 'What payment methods are supported?', a: 'All major debit and credit cards, bank transfers, and mobile payments via Paystack.' },
        { q: 'Does Thankeeu work for companies?',   a: 'Yes. Thankeeu for Teams automates birthdays, farewells, new hires, promotions and more for your entire team. From $50/month.' },
      ]),
    ],
  });

  const [form, setForm]       = useState({ company_name: '', contact_name: '', email: '', phone: '', team_size: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company_name || !form.contact_name || !form.email) return toast.error('Please fill all required fields');
    setLoading(true);
    try {
      await demoAPI.submit(form);
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[95vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {done ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="font-display text-2xl font-semibold text-gray-900 mb-3">Request received!</h3>
            <p className="text-gray-600 mb-2">Our team will reach out to <strong>{form.email}</strong> within 24 hours.</p>
            <p className="text-sm text-gray-400 mb-6">Check your inbox for a confirmation email.</p>
            <button onClick={onClose} className="btn-primary w-full py-3.5">Close</button>
          </div>
        ) : (
          <>
            {/* Drag handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="px-6 pt-4 pb-2 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h3 className="font-display text-xl font-semibold text-gray-900">Book a free demo</h3>
                <p className="text-sm text-gray-500 mt-0.5">See Thankeeu for Teams in action — 30 minutes</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 -mt-1 -mr-1 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Company name <span className="text-red-400">*</span></label>
                  <input className="input" placeholder="Your company name" value={form.company_name} onChange={e => set('company_name', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Your name <span className="text-red-400">*</span></label>
                  <input className="input" placeholder="Tunde Okafor (HR Manager)" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Work email <span className="text-red-400">*</span></label>
                  <input type="email" className="input" placeholder="hr@yourcompany.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
                  <input className="input" placeholder="+234 800 000 0000" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Team size</label>
                <div className="flex flex-wrap gap-2">
                  {TEAM_SIZE_OPTIONS.map(s => (
                    <button key={s} type="button" onClick={() => set('team_size', s)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${form.team_size === s ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">What would you like to achieve? <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea className="input h-20 resize-none" placeholder="e.g. Automate birthday celebrations for 500 employees across 3 branches..."
                  value={form.message} onChange={e => set('message', e.target.value)} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</span>
                  : '🏢 Book my free demo →'}
              </button>
              <p className="text-center text-xs text-gray-400">Free 30-min call · No commitment · Usually responds within 24h</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

const Home = () => {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="gradient-hero pt-12 pb-16 md:pt-20 md:pb-24 lg:pt-28 lg:pb-32">
        <div className="section-container text-center">
          <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-white/80 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm text-gray-600 mb-6 md:mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
            The world's favorite group card & gift platform 🌍
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-gray-900 leading-tight mb-4 md:mb-6">
            Make someone feel
            <span className="text-gradient block mt-1">truly loved</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-xl md:max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed px-2">
            Collect heartfelt messages from everyone, add a gift pot, and deliver one stunning card that will never be forgotten.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center px-4 sm:px-0">
            <Link to="/signup" className="btn-primary text-base px-8 py-4">
              Create a free card 💜
            </Link>
            <button onClick={() => setShowDemo(true)} className="btn-secondary text-base px-8 py-4">
              🏢 Book a demo for teams
            </button>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-4">No subscription for personal cards · Paystack-powered · Used worldwide</p>

          {/* Hero card preview */}
          <div className="mt-12 md:mt-16 mx-auto max-w-sm sm:max-w-md md:max-w-2xl px-2 sm:px-0">
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 border border-gray-100">
              <div className="bg-pink-50 rounded-xl md:rounded-2xl p-4 md:p-6 mb-4">
                <div className="flex items-start justify-between gap-3 mb-3 md:mb-4">
                  <div>
                    <h3 className="font-display text-lg md:text-2xl text-pink-800 leading-tight">Happy Birthday, Amaka! 🎂</h3>
                    <p className="text-pink-600 text-xs md:text-sm mt-1">From Tunde and 23 others</p>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-pink-200 rounded-full flex items-center justify-center text-xl md:text-2xl flex-shrink-0">🎂</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
                {[
                  { name: 'Kemi A.', msg: 'You deserve all the happiness in the world!', av: 'KA', bg: 'bg-purple-100 text-purple-700' },
                  { name: 'Emeka O.', msg: 'Wishing you blessings beyond measure!',      av: 'EO', bg: 'bg-green-100 text-green-700'  },
                  { name: 'Mama Okafor', msg: 'God bless you always my daughter ❤️',      av: 'MO', bg: 'bg-amber-100 text-amber-700' },
                  { name: 'Sisi Eko',  msg: 'Party hard tonight! You only turn 30 once!',av: 'SE', bg: 'bg-pink-100 text-pink-700'   },
                ].map(m => (
                  <div key={m.name} className="bg-gray-50 rounded-xl p-2.5 md:p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-xs font-bold ${m.bg} flex-shrink-0`}>{m.av}</div>
                      <span className="text-xs font-medium text-gray-700 truncate">{m.name}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{m.msg}</p>
                  </div>
                ))}
              </div>
              <div className="bg-green-50 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎁</span>
                  <div>
                    <p className="text-xs font-semibold text-green-800">Gift pot collected</p>
                    <p className="text-xs text-green-600">24 contributors</p>
                  </div>
                </div>
                <span className="text-base md:text-lg font-bold text-green-700">$500</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OCCASIONS ────────────────────────────────────────────────────────── */}
      <section id="occasions" className="section-py bg-white">
        <div className="section-container">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl text-gray-900 mb-3 md:mb-4">Every occasion, covered</h2>
            <p className="text-gray-600 text-sm md:text-base max-w-lg mx-auto">From owambe celebrations to office farewells — we have the perfect card for every moment.</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 md:gap-4">
            {OCCASIONS.map(o => (
              <Link key={o.label} to="/create"
                className="bg-gray-50 hover:bg-primary-50 hover:border-primary-200 border border-gray-100 rounded-xl md:rounded-2xl p-3 md:p-4 text-center transition-all active:scale-95">
                <div className="text-2xl md:text-3xl mb-1.5 md:mb-2">{o.icon}</div>
                <p className="text-xs font-semibold text-gray-700 leading-tight">{o.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="section-py bg-gray-50">
        <div className="section-container">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl text-gray-900 mb-3 md:mb-4">How Thankeeu works</h2>
            <p className="text-gray-600 text-sm md:text-base max-w-xl mx-auto">Four simple steps to create a moment your recipient will never forget.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {STEPS.map(s => (
              <div key={s.num} className="text-center">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-primary-400 rounded-xl md:rounded-2xl flex items-center justify-center text-2xl md:text-3xl mx-auto mb-3 md:mb-4 shadow-lg shadow-primary-200">
                  {s.icon}
                </div>
                <span className="text-xs font-bold text-primary-400 tracking-widest">{s.num}</span>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mt-1 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THANKEEU FOR TEAMS ───────────────────────────────────────────────── */}
      <section className="section-py bg-white">
        <div className="section-container">
          <div className="bg-gradient-to-br from-primary-50 via-white to-pink-50 rounded-2xl md:rounded-3xl p-6 md:p-10 lg:p-12 border border-primary-100">
            <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 md:mb-5">
                  🏢 Thankeeu for Teams
                </div>
                <h2 className="text-2xl md:text-4xl text-gray-900 mb-3 md:mb-4 leading-tight">
                  Never miss an employee's special day again
                </h2>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-5 md:mb-6">
                  Upload your team or connect your HRIS once. Thankeeu automatically creates cards, collects gifts, and delivers them — for birthdays, farewells, promotions, new hires and more.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/company/signup" className="btn-primary px-6 py-3 text-sm">
                    🏢 Start free for your team
                  </Link>
                  <button onClick={() => setShowDemo(true)} className="btn-secondary px-6 py-3 text-sm">
                    📅 Book a demo →
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-3">$50/month · Unlimited employees · Cancel anytime</p>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {TEAM_FEATURES.map(f => (
                  <div key={f.title} className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm border border-gray-100">
                    <div className="text-xl md:text-2xl mb-1.5 md:mb-2">{f.icon}</div>
                    <p className="text-xs md:text-sm font-semibold text-gray-900 mb-1">{f.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Automation flow */}
            <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-primary-100">
              <p className="text-xs font-semibold text-primary-500 text-center mb-4 tracking-widest uppercase">How the automation works</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                {[
                  { icon: '📥', label: 'Upload team or connect HRIS' },
                  { icon: '🗓️', label: 'Occasion detected automatically' },
                  { icon: '📧', label: 'Team notified to sign card' },
                  { icon: '🎉', label: 'Card + gift delivered on the day' },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 sm:gap-0 w-full sm:w-auto justify-center">
                    <div className="bg-white rounded-xl px-4 py-3 text-center shadow-sm border border-primary-100 flex-1 sm:flex-none sm:min-w-[120px] max-w-[180px]">
                      <div className="text-xl mb-1">{step.icon}</div>
                      <p className="text-xs text-gray-600 font-medium leading-tight">{step.label}</p>
                    </div>
                    {i < 3 && <span className="text-primary-300 font-bold sm:mx-1 rotate-90 sm:rotate-0">→</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────────── */}
      <section className="py-12 md:py-16 bg-primary-400">
        <div className="section-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center text-white">
            {[['10,000+','Cards created'],['500,000+','Messages sent'],['$1M+','Gifts collected'],['4.9★','User rating']].map(([val, label]) => (
              <div key={label}>
                <div className="font-display text-3xl md:text-4xl font-semibold mb-1">{val}</div>
                <div className="text-primary-100 text-xs md:text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────────── */}
      <section className="section-py bg-white">
        <div className="section-container">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl text-gray-900 mb-3 md:mb-4">People love Thankeeu</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-sm flex-shrink-0">
                    {t.av}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.location}</p>
                  </div>
                  <div className="ml-auto text-amber-400 text-sm flex-shrink-0">★★★★★</div>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOOK DEMO (dedicated section) ────────────────────────────────────── */}
      <section id="book-demo" className="section-py bg-gray-900">
        <div className="section-container">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-4xl mb-4">🏢</div>
            <h2 className="text-2xl md:text-4xl font-semibold text-white mb-4">Want Thankeeu for your company?</h2>
            <p className="text-gray-400 text-sm md:text-base mb-3 leading-relaxed">
              See how companies worldwide use Thankeeu for Teams to celebrate their employees — birthdays, farewells, promotions, new hires and more. Fully automated.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-8 text-xs text-gray-500">
              {['SeamlessHR integration', 'BambooHR integration', 'Unlimited employees', 'Auto birthday emails', '12 occasion types', 'Gift pot collection'].map(f => (
                <span key={f} className="bg-gray-800 px-3 py-1.5 rounded-full text-gray-300">✓ {f}</span>
              ))}
            </div>
            <button onClick={() => setShowDemo(true)}
              className="bg-primary-400 hover:bg-primary-600 text-white font-semibold px-8 md:px-10 py-4 rounded-xl text-base transition-all active:scale-95 w-full sm:w-auto">
              📅 Book a free 30-min demo
            </button>
            <p className="text-gray-500 text-xs mt-3">Free · No commitment · Usually responds within 24 hours</p>
          </div>
        </div>
      </section>

      {/* ── DUAL CTA ─────────────────────────────────────────────────────────── */}
      <section className="section-py bg-gray-50">
        <div className="section-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="gradient-hero rounded-2xl md:rounded-3xl p-6 md:p-8 text-center border border-primary-100">
              <div className="text-4xl mb-3 md:mb-4">💜</div>
              <h3 className="font-display text-xl md:text-2xl font-semibold text-gray-900 mb-2 md:mb-3">For individuals</h3>
              <p className="text-gray-600 text-sm mb-5 md:mb-6 leading-relaxed">Create a group card for a friend, family member, or colleague. Free to start, $5 to send.</p>
              <Link to="/signup" className="btn-primary px-8 py-3 w-full sm:w-auto">Create a free card →</Link>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl md:rounded-3xl p-6 md:p-8 text-center">
              <div className="text-4xl mb-3 md:mb-4">🏢</div>
              <h3 className="font-display text-xl md:text-2xl font-semibold text-white mb-2 md:mb-3">For companies</h3>
              <p className="text-gray-400 text-sm mb-5 md:mb-6 leading-relaxed">Automate birthday celebrations for your entire team. Connect your HRIS, Thankeeu does the rest.</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Link to="/company/signup" className="bg-white text-gray-900 font-semibold px-6 py-3 rounded-xl text-sm hover:bg-gray-100 transition-all inline-block">
                  Start for your team
                </Link>
                <button onClick={() => setShowDemo(true)} className="border border-gray-600 text-gray-300 hover:bg-gray-700 font-medium px-6 py-3 rounded-xl text-sm transition-all">
                  Book demo →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Demo modal */}
      {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}
    </div>
  );
};

export default Home;
