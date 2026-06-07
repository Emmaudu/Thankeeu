import { useSEO, SCHEMAS } from '../hooks/useSEO';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { demoAPI } from '../utils/api';
import toast from 'react-hot-toast';

const OCCASIONS = [
  { icon: '🎂', label: 'Birthday' },      { icon: '💝', label: "Valentine's" },
  { icon: '💼', label: 'Farewell' },       { icon: '💍', label: 'Anniversary' },
  { icon: '💒', label: 'Wedding' },        { icon: '👶', label: 'Baby Shower' },
  { icon: '🎓', label: 'Graduation' },     { icon: '🌟', label: 'Promotion' },
  { icon: '🏖️', label: 'Retirement' },    { icon: '🎄', label: 'Christmas' },
  { icon: '🌷', label: 'Get Well' },       { icon: '🎉', label: 'More…' },
];

const STEPS = [
  { num:'01', icon:'🎨', label:'Create', title:'Pick occasion & design', desc:'14 occasions, beautiful designs, set delivery date. Done in 2 minutes.' },
  { num:'02', icon:'📲', label:'Invite', title:'Share signing link', desc:'WhatsApp, email, Slack. Anyone can sign — no account needed.' },
  { num:'03', icon:'💜', label:'Collect', title:'Pool a gift together', desc:'Chip in from ₦500. Paystack handles everything — no cash chasing.' },
  { num:'04', icon:'🚀', label:'Deliver', title:'Deliver the surprise', desc:'Schedule or send instantly. Your recipient opens a full card with messages, media & gift.' },
];

const FEATURES = [
  { icon:'⚡', title:'Instant signing links', desc:'Copy a WhatsApp link in one click. No account needed to sign.' },
  { icon:'🎁', title:'Built-in gift pots', desc:'Everyone chips in via Paystack. Pooled automatically.' },
  { icon:'📱', title:'Any media type', desc:'Text, photo, video, voice note, GIF — all in one card.' },
  { icon:'⏰', title:'Scheduled delivery', desc:'Set the date. Card arrives exactly when it should.' },
  { icon:'🔒', title:'Private messages', desc:'Contributors can mark personal notes visible only to the recipient.' },
  { icon:'📊', title:'Real-time tracking', desc:"See who's signed, how much is collected, in your dashboard." },
];

const TESTIMONIALS = [
  { name:'Adaeze O.', role:'HR Manager', location:'London 🇬🇧', text:"Our colleague's farewell card had 34 messages and a ₦120k spa voucher. She cried. Thankeeu made it ridiculously easy.", stars:5 },
  { name:'Emeka T.',  role:'Engineer',   location:'New York 🇺🇸', text:"Organised my girlfriend's birthday from London. 22 people signed, raised ₦500k. She was genuinely shocked. 10/10.", stars:5 },
  { name:'Kemi B.',   role:'People Ops', location:'Toronto 🇨🇦', text:"No more Google Forms and chasing receipts. Everything just works. The HRIS sync alone saved us hours per week.", stars:5 },
];

const STATS = [
  { icon:'💌', value:'50K+', label:'Cards created' },
  { icon:'✍️', value:'800K+', label:'Messages signed' },
  { icon:'🎁', value:'₦2B+', label:'Gifts collected' },
  { icon:'🏢', value:'200+', label:'Companies' },
];

const TEAM_SIZE_OPTIONS = ['1–10','11–50','51–200','201–500','500+'];

const DemoModal = ({ onClose }) => {
  const [form, setForm] = useState({ name:'', email:'', company:'', team_size:'', message:'' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.company) return toast.error('Please fill required fields');
    setLoading(true);
    try { await demoAPI.submit(form); setDone(true); }
    catch { toast.error('Failed to submit. Email us at hello@thankeeu.com'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background:'rgba(26,16,53,0.6)', backdropFilter:'blur(8px)' }} onClick={onClose}>
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[92vh] overflow-y-auto"
        style={{ background:'#fff', border:'1.5px solid #EDE5FF' }} onClick={e => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4 animate-bounce-soft">🎉</div>
            <h3 className="font-display text-2xl font-bold text-warm-900 mb-2">Request received!</h3>
            <p className="text-warm-500 text-sm mb-6">We'll reach out within 24 hours.</p>
            <button onClick={onClose} className="btn-primary px-8">Close</button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="pill mb-2">📅 Book a demo</div>
                <h3 className="font-display text-xl font-bold text-warm-900">See Thankeeu for Teams live</h3>
                <p className="text-warm-500 text-sm mt-1">Free · 30 min · Usually within 24hrs</p>
              </div>
              <button onClick={onClose} className="text-warm-400 hover:text-warm-700 text-2xl leading-none w-9 h-9 flex items-center justify-center rounded-xl hover:bg-warm-100 flex-shrink-0">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">Full name *</label>
                  <input className="input" placeholder="Your name" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">Work email *</label>
                  <input type="email" className="input" placeholder="you@company.com" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1.5">Company name *</label>
                <input className="input" placeholder="Acme Corp" value={form.company} onChange={e => setForm(p=>({...p,company:e.target.value}))} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1.5">Team size</label>
                <div className="flex flex-wrap gap-2">
                  {TEAM_SIZE_OPTIONS.map(s => (
                    <button type="button" key={s} onClick={() => setForm(p=>({...p,team_size:s}))}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${form.team_size===s ? 'border-primary-400 bg-primary-50 text-primary-600' : 'border-purple-100 text-warm-600 hover:border-primary-300'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1.5">What would you like to see?</label>
                <textarea className="input resize-none" rows={3} placeholder="Birthday automations, HRIS sync..." value={form.message} onChange={e => setForm(p=>({...p,message:e.target.value}))} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Booking…</span> : '📅 Book my demo →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

const Home = () => {
  useSEO({
    title:'Thankeeu — Group Cards & Gifts for Every Occasion',
    description:"The world's favourite group card and gift platform. Birthdays, farewells, promotions and more.",
    canonical:'/',
    jsonLd:[SCHEMAS.organization, SCHEMAS.website, SCHEMAS.softwareApp],
  });
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="min-h-screen" style={{ background:'linear-gradient(180deg,#F5F0FF 0%,#FDFCFF 20%)' }}>
      <Navbar onBookDemo={() => setShowDemo(true)} />

      {/* ── HERO ─────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 px-4">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:'radial-gradient(rgba(124,58,237,0.1) 1.5px,transparent 1.5px)', backgroundSize:'28px 28px' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 pointer-events-none" style={{ background:'radial-gradient(ellipse,rgba(139,92,246,0.18) 0%,transparent 70%)' }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full text-xs font-bold text-primary-600"
            style={{ background:'rgba(124,58,237,0.08)', border:'1.5px solid rgba(124,58,237,0.15)' }}>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            ✨ HRIS sync · 12 automated occasions · Paystack gifting
          </div>

          <h1 className="font-display font-bold text-warm-900 mb-5 px-2"
            style={{ fontSize:'clamp(2rem,7vw,3.75rem)', lineHeight:1.1 }}>
            Group cards &amp; gifts<br/>
            <span style={{ background:'linear-gradient(135deg,#8B5CF6,#7C3AED 50%,#F43F5E)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              that actually hit different
            </span>
          </h1>

          <p className="text-warm-600 mb-8 max-w-xl mx-auto px-2" style={{ fontSize:'clamp(0.95rem,2.5vw,1.125rem)', lineHeight:1.65 }}>
            Create beautiful group cards, collect heartfelt messages, pool Naira gifts via Paystack.<br className="hidden sm:block"/>
            <strong className="text-warm-800">Takes 2 minutes. From ₦5,000.</strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10 px-2">
            <Link to="/signup" className="btn-primary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto w-full sm:w-auto">
              ✨ Create a card from ₦5,000
            </Link>
            <button onClick={() => setShowDemo(true)} className="btn-secondary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto w-full sm:w-auto">
              📅 Book team demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto px-2">
            {STATS.map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-3 sm:p-4 text-center border border-purple-100 shadow-sm">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="font-display text-lg sm:text-xl font-bold text-primary-500">{s.value}</div>
                <div className="text-xs text-warm-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }} />

      {/* ── OCCASIONS ───────────────────────── */}
      <section className="py-12 md:py-16 px-4" style={{ background:'linear-gradient(180deg,#F5F0FF,#F8F4FF)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="pill mx-auto mb-3">🎉 14 occasions</div>
            <h2 className="font-display font-bold text-warm-900" style={{ fontSize:'clamp(1.5rem,5vw,2.25rem)' }}>
              Whatever the moment,<br/><span className="text-primary-500">there's a card for it</span>
            </h2>
          </div>
          <div className="occasion-grid">
            {OCCASIONS.map(({ icon, label }) => (
              <Link key={label} to="/signup"
                className="bg-white border-2 border-purple-100 rounded-2xl p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2 text-center transition-all hover:border-primary-300 hover:bg-primary-50 hover:-translate-y-1 hover:shadow-md active:scale-95">
                <span className="text-2xl sm:text-3xl">{icon}</span>
                <span className="text-xs font-semibold text-warm-600 leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }} />

      {/* ── HOW IT WORKS ──────────────────── */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="pill mx-auto mb-3">⚡ Stupidly simple</div>
            <h2 className="font-display font-bold text-warm-900" style={{ fontSize:'clamp(1.5rem,5vw,2.25rem)' }}>
              From zero to delivered<br/><span className="text-primary-500">in under 5 minutes</span>
            </h2>
          </div>
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div key={s.num} className="bg-white border-2 border-purple-100 rounded-3xl p-5 transition-all hover:border-primary-300 hover:shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-xl bg-primary-50 border-2 border-primary-200 flex items-center justify-center font-display text-sm font-bold text-primary-600 flex-shrink-0">{s.num}</span>
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-xs font-bold uppercase tracking-wide text-primary-500">{s.label}</span>
                </div>
                <h3 className="font-display font-bold text-warm-900 mb-2 text-base">{s.title}</h3>
                <p className="text-sm text-warm-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }} />

      {/* ── FEATURES + MOCK CARD ──────────── */}
      <section className="py-12 md:py-16 px-4" style={{ background:'linear-gradient(180deg,#F5F0FF,#F8F4FF)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div>
              <div className="pill mb-4">💜 For individuals</div>
              <h2 className="font-display font-bold text-warm-900 mb-4" style={{ fontSize:'clamp(1.5rem,5vw,2.1rem)' }}>
                Everything a group card<br/><span className="text-primary-500">should actually have</span>
              </h2>
              <p className="text-warm-500 mb-6 leading-relaxed">No generic e-cards. One link, everyone signs, gift collected — and it looks stunning.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7">
                {FEATURES.map(f => (
                  <div key={f.title} className="bg-white rounded-2xl border-2 border-purple-100 p-4 flex gap-3">
                    <span className="text-xl flex-shrink-0 mt-0.5">{f.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-warm-900 mb-0.5">{f.title}</p>
                      <p className="text-xs text-warm-500 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/signup" className="btn-primary px-7 py-3.5 text-sm w-full sm:w-auto inline-flex">
                ✨ Create your first card →
              </Link>
            </div>

            {/* Mock card */}
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-50 to-rose-50 border-2 border-purple-200 rounded-3xl p-5 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl border border-purple-100">🎂</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-warm-900 text-sm truncate">Tolu's Birthday Card</p>
                    <p className="text-xs text-warm-500">28 signed · ₦85,000 collected</p>
                  </div>
                  <span className="text-xs font-bold bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full flex-shrink-0">✓ Active</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { av:'AO', name:'Adaeze O.', msg:"Happy birthday!! You're such an inspiration 🎉" },
                    { av:'EK', name:'Emeka K.', msg:'Wishing you all the joy this year! 🌟' },
                    { av:'KI', name:'Kemi I.', msg:'Another year wiser! Enjoy every moment 💜' },
                    { av:'BD', name:'Bolu D.', msg:'You deserve all the good things, boss! 👑' },
                  ].map(m => (
                    <div key={m.av} className="bg-white rounded-2xl p-3 border border-purple-100">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{m.av}</div>
                        <span className="text-xs font-semibold text-warm-800 truncate">{m.name}</span>
                      </div>
                      <p className="text-xs text-warm-600 leading-relaxed line-clamp-2">{m.msg}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-green-50 border border-green-200 rounded-2xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🎁</span>
                    <span className="text-xs font-bold text-green-800 flex-1">Gift pot · 28 contributors</span>
                    <span className="font-display text-base font-bold text-green-700">₦85,000</span>
                  </div>
                  <div className="w-full h-2 bg-green-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width:'85%', background:'linear-gradient(90deg,#10B981,#34D399)' }} />
                  </div>
                  <p className="text-xs text-green-600 mt-1.5">₦85,000 raised · Goal: ₦100,000 🎯</p>
                </div>
              </div>
              <div className="absolute -top-3 -right-2 text-3xl animate-bounce-soft">🎉</div>
              <div className="absolute -top-2 -left-2 text-2xl animate-float">🎊</div>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }} />

      {/* ── TESTIMONIALS ─────────────────── */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="pill mx-auto mb-3">⭐ Real stories</div>
            <h2 className="font-display font-bold text-warm-900" style={{ fontSize:'clamp(1.5rem,5vw,2.25rem)' }}>
              People who actually<br/><span className="text-primary-500">made someone's day</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white border-2 border-purple-100 rounded-3xl p-5 flex flex-col gap-3 hover:border-primary-300 hover:shadow-md transition-all">
                <div className="text-sm">{Array(t.stars).fill('⭐').join('')}</div>
                <p className="text-sm text-warm-600 leading-relaxed italic flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-purple-50">
                  <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {t.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-warm-900">{t.name}</p>
                    <p className="text-xs text-warm-400">{t.role} · {t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }} />

      {/* ── FOR TEAMS ────────────────────── */}
      <section className="py-12 md:py-16 px-4" style={{ background:'linear-gradient(180deg,#F5F0FF,#F8F4FF)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="pill mx-auto mb-3">🏢 For HR &amp; People teams</div>
            <h2 className="font-display font-bold text-warm-900 mb-3" style={{ fontSize:'clamp(1.5rem,5vw,2.25rem)' }}>
              Automate every celebration.<br/><span className="text-primary-500">Zero manual effort.</span>
            </h2>
            <p className="text-warm-500 max-w-xl mx-auto text-sm leading-relaxed">
              Connect your HRIS once. Thankeeu creates cards, notifies departments, pools gifts, and delivers — on the exact right day. Every time.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {[
              { icon:'🔗', title:'HRIS Integration', desc:'SeamlessHR, BambooHR, Zoho People, WorkPay — one sync and your whole org is in.' },
              { icon:'🎉', title:'12 Occasions Automated', desc:"Birthdays, farewells, promotions, new hires, Women's Day — zero manual effort." },
              { icon:'💌', title:'Whole-dept Notifications', desc:'Every department member gets an email to sign. No one left out.' },
              { icon:'💳', title:'Gift pot per employee', desc:'Paystack handles Naira collections. HR never chases money again.' },
              { icon:'📋', title:'HR Analytics Dashboard', desc:'Full visibility into automations, upcoming occasions, and spending.' },
              { icon:'🛡️', title:'Approval Workflows', desc:'Team leaders sign off on card creation. Full control maintained.' },
            ].map(f => (
              <div key={f.title} className="bg-white border-2 border-purple-100 rounded-3xl p-4 flex gap-3 hover:border-primary-300 transition-all">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">{f.icon}</div>
                <div>
                  <p className="font-bold text-warm-900 text-sm mb-1">{f.title}</p>
                  <p className="text-xs text-warm-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/company/signup" className="btn-primary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto w-full sm:w-auto">🏢 Start for your team →</Link>
            <button onClick={() => setShowDemo(true)} className="btn-secondary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto w-full sm:w-auto">📅 Book a 30-min demo</button>
          </div>
        </div>
      </section>

      <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }} />

      {/* ── PRICING CALLOUT ──────────────── */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-gradient-to-br from-purple-50 to-rose-50 border-2 border-purple-200 rounded-3xl p-7">
              <div className="text-4xl mb-4">💜</div>
              <h3 className="font-display text-2xl font-bold text-warm-900 mb-2">For individuals</h3>
              <p className="text-primary-600 font-bold text-sm mb-1">From ₦5,000 · One-time payment</p>
              <p className="text-warm-600 mb-5 text-sm leading-relaxed">Create a card for anyone — friend, colleague, family. No account needed to sign.</p>
              <ul className="space-y-2 mb-6">
                {['✓ Quick card creation','✓ Unlimited signers','✓ Naira gift pot','✓ Photo & video messages'].map(f => (
                  <li key={f} className="text-sm text-warm-700 flex gap-2"><span className="text-primary-500 font-bold">{f.slice(0,1)}</span>{f.slice(1)}</li>
                ))}
              </ul>
              <Link to="/signup" className="btn-primary px-7 py-3 w-full sm:w-auto inline-flex">Get started →</Link>
            </div>
            <div className="rounded-3xl p-7 border-2 border-primary-800" style={{ background:'linear-gradient(135deg,#1A1035,#2E1F6B)' }}>
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="font-display text-2xl font-bold text-purple-100 mb-2">For companies</h3>
              <p className="text-purple-300 font-bold text-sm mb-1">From ₦200,000/month</p>
              <p className="text-purple-300 mb-5 text-sm leading-relaxed">Automate all team celebrations. Connect your HRIS. Never forget a birthday again.</p>
              <ul className="space-y-2 mb-6">
                {['✓ Unlimited employees','✓ HRIS integration','✓ 12 automated occasions','✓ HR analytics dashboard'].map(f => (
                  <li key={f} className="text-sm text-purple-200 flex gap-2"><span className="text-purple-400 font-bold">{f.slice(0,1)}</span>{f.slice(1)}</li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <Link to="/company/signup" className="btn-primary px-6 py-3 text-sm">Get started →</Link>
                <button onClick={() => setShowDemo(true)} className="px-6 py-3 text-sm font-bold rounded-2xl border-2 border-purple-500 text-purple-200 hover:bg-purple-800 transition-colors">Book demo</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────── */}
      <section className="py-16 md:py-24 px-4 text-center" style={{ background:'linear-gradient(135deg,#F5F0FF,#FFF0F5)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center gap-2 sm:gap-3 text-3xl sm:text-4xl mb-6">
            {['🎂','💌','🎁','🎊','💜'].map((e,i) => (
              <span key={i} className="animate-float" style={{ animationDelay:`${i*0.15}s` }}>{e}</span>
            ))}
          </div>
          <h2 className="font-display font-bold text-warm-900 mb-4" style={{ fontSize:'clamp(1.75rem,6vw,3rem)' }}>
            Make someone feel<br/>
            <span style={{ background:'linear-gradient(135deg,#8B5CF6,#7C3AED 50%,#F43F5E)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              genuinely loved
            </span>
          </h2>
          <p className="text-warm-500 mb-8 text-base sm:text-lg">From ₦5,000 per card. Pay only when you send.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup" className="btn-primary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto w-full sm:w-auto">✨ Get started — takes 2 min</Link>
            <Link to="/pricing" className="btn-secondary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto w-full sm:w-auto">💳 See pricing</Link>
          </div>
          <p className="text-xs text-warm-400 mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span>🔒 Secure payments</span><span>·</span><span>✨ No credit card needed</span><span>·</span><span>🌍 Used worldwide</span>
          </p>
        </div>
      </section>

      <Footer />
      {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}
    </div>
  );
};

export default Home;
