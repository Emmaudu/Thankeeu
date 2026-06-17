import { useSEO, SCHEMAS } from '../hooks/useSEO';
import { useState, useEffect } from 'react';
import {RotatingPrice, CurrencyToggle} from '../utils/currencyUI';
import { formatCurrency } from '../utils/currency';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';
import { demoAPI } from '../utils/api';
import toast from 'react-hot-toast';

const OCCASIONS = [
  { icon: 'Cake', label: 'Birthday' },      { icon: 'Heart', label: "Valentine's" },
  { icon: 'Briefcase', label: 'Farewell' },       { icon: 'Gift', label: 'Anniversary' },
  { icon: 'HandHeart', label: 'Wedding' },        { icon: 'Baby', label: 'Baby Shower' },
  { icon: 'GraduationCap', label: 'Graduation' },     { icon: 'TrendingUp', label: 'Promotion' },
  { icon: 'Sun', label: 'Retirement' },    { icon: 'Snowflake', label: 'Christmas' },
  { icon: 'HeartPulse', label: 'Get Well' },       { icon: 'Party', label: 'More…' },
];

const STEPS = [
  { num:'01', icon:'Wand', label:'Create', title:'Pick occasion & design', desc:'14 occasions, beautiful designs, set delivery date. Done in 2 minutes.' },
  { num:'02', icon:'Share', label:'Invite', title:'Share signing link', desc:'WhatsApp, email, Slack. Anyone can sign — no account needed.' },
  { num:'03', icon:'Heart', label:'Collect', title:'Pool a gift together', desc:'Chip in from ₦500. Flutterwave handles everything — no cash chasing.' },
  { num:'04', icon:'Rocket', label:'Deliver', title:'Deliver the surprise', desc:'Schedule or send instantly. Your recipient opens a full card with messages, media & gift.' },
];

const FEATURES = [
  { icon:'Zap', title:'Instant signing links', desc:'Copy a WhatsApp link in one click. No account needed to sign.' },
  { icon:'Gift', title:'Built-in gift pots', desc:'Everyone chips in via Flutterwave. Pooled automatically.' },
  { icon:'Smartphone', title:'Any media type', desc:'Text, photo, video, voice note, GIF — all in one card.' },
  { icon:'Clock', title:'Scheduled delivery', desc:'Set the date. Card arrives exactly when it should.' },
  { icon:'Lock', title:'Private messages', desc:'Contributors can mark personal notes visible only to the recipient.' },
  { icon:'BarChart', title:'Real-time tracking', desc:"See who's signed, how much is collected, in your dashboard." },
];

const TESTIMONIALS = [
  { name:'Adaeze O.', role:'HR Manager', location:'Lagos, Nigeria', text:"Our colleague's farewell card had 34 messages and a ₦120k spa voucher. She cried. Thankeeu made it ridiculously easy.", stars:5 },
  { name:'Emeka T.',  role:'Engineer',   location:'Abuja, Nigeria', text:"Organised my girlfriend's birthday from London. 22 people signed, raised ₦500k. She was genuinely shocked. 10/10.", stars:5 },
  { name:'Kemi B.',   role:'People Ops', location:'Port Harcourt, Nigeria', text:"No more Google Forms and chasing receipts. Everything just works. The HRIS sync alone saved us hours per week.", stars:5 },
];


const TEAM_SIZE_OPTIONS = ['1–10','11–50','51–200','201–500','500+'];

const DemoModal = ({ onClose }) => {
  const [form, setForm] = useState({ contact_name:'', email:'', company_name:'', phone:'', team_size:'', message:'' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.contact_name.trim() || !form.email.trim() || !form.company_name.trim())
      return toast.error('Please fill in your name, email and company name');
    setLoading(true);
    try {
      await demoAPI.submit(form);
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit. Email us at support@thankeeu.com');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background:'rgba(26,16,53,0.6)', backdropFilter:'blur(8px)' }} onClick={onClose}>
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[92vh] overflow-y-auto"
        style={{ background:'#fff', border:'1.5px solid #EDE5FF' }} onClick={e => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-50 flex items-center justify-center animate-bounce-soft"><Icon name="Party" size={32} className="text-primary-500"/></div>
            <h3 className="text-2xl font-bold text-warm-900 mb-2">Request received!</h3>
            <p className="text-warm-500 text-sm mb-6">We'll reach out within 12 hours.</p>
            <button onClick={onClose} className="btn-primary px-8">Close</button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="pill mb-2 inline-flex items-center gap-1.5"><Icon name="Calendar" size={13}/> Book a demo</div>
                <h3 className="text-xl font-bold text-warm-900">See Thankeeu for Teams live</h3>
                <p className="text-warm-500 text-sm mt-1">Free · 30 min · Usually within 24hrs</p>
              </div>
              <button onClick={onClose} className="text-warm-400 hover:text-warm-700 w-9 h-9 flex items-center justify-center rounded-xl hover:bg-warm-100 flex-shrink-0"><Icon name="X" size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">Full name *</label>
                  <input className="input" placeholder="Your name" value={form.contact_name} onChange={e => setForm(p=>({...p,contact_name:e.target.value}))} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">Work email *</label>
                  <input type="email" className="input" placeholder="you@company.com" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">Company name *</label>
                  <input className="input" placeholder="Acme Corp" value={form.company_name} onChange={e => setForm(p=>({...p,company_name:e.target.value}))} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">Phone number</label>
                  <input className="input" placeholder="+234..." value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} />
                </div>
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
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Booking…</span> : <span className="inline-flex items-center justify-center gap-2"><Icon name="Calendar" size={16}/> Book my demo <Icon name="ArrowRight" size={16}/></span>}
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
    title:'Thankeeu — Online Group Cards & Gifts for Every Occasion',
    description:"The world's favourite online group card and gift platform. Birthdays, farewells, promotions and more.",
    canonical:'/',
    jsonLd:[SCHEMAS.organization, SCHEMAS.website, SCHEMAS.softwareApp],
  });
  const [showDemo,    setShowDemo]    = useState(false);
  const [homeCurrency,setHomeCurrency] = useState('NGN');

  return (
    <div className="min-h-screen" style={{ background:'linear-gradient(180deg,#F5F0FF 0%,#FDFCFF 20%)' }}>
      <Navbar onBookDemo={() => setShowDemo(true)} />

      {/* ── HERO ─────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 px-4">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:'radial-gradient(rgba(124,58,237,0.1) 1.5px,transparent 1.5px)', backgroundSize:'28px 28px' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 pointer-events-none" style={{ background:'radial-gradient(ellipse,rgba(139,92,246,0.18) 0%,transparent 70%)' }} />

        <div className="relative max-w-4xl mx-auto text-center">


          <h1 className="font-bold text-warm-900 mb-5 px-2"
            style={{ fontSize:'clamp(2rem,7vw,3.75rem)', lineHeight:1.1 }}>
           Create &amp; Schedule <br/>
            <span style={{ background:'linear-gradient(135deg,#8B5CF6,#7C3AED 50%,#F43F5E)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              digital group card-box for your self &amp; others
            </span>
          </h1>

          <p className="text-warm-600 mb-8 max-w-xl mx-auto px-2" style={{ fontSize:'clamp(0.95rem,2.5vw,1.125rem)', lineHeight:1.65 }}>
            Create beautiful group cards, collect heartfelt messages with GIFs, photos, videos, VNs with pool gifts via Flutterwave — works in NGN, USD, GBP, EUR and more.<br className="hidden sm:block"/>
            <strong className="text-warm-800">Takes 2 minutes. From <RotatingPrice amountNGN={5000} />.</strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10 px-2">
            <Link to="/signup" className="btn-primary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto inline-flex items-center justify-center gap-2">
              <Icon name="Sparkles" size={16}/> Create a card
            </Link>
            <button onClick={() => setShowDemo(true)} className="btn-secondary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto inline-flex items-center justify-center gap-2">
              <Icon name="Calendar" size={16}/> Book team demo
            </button>
          </div>
          {/* Stats removed — will be added back when live */}
        </div>
      </section>

      <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }} />

      {/* ── OCCASIONS ───────────────────────── */}
      <section className="py-12 md:py-16 px-4" style={{ background:'linear-gradient(180deg,#F5F0FF,#F8F4FF)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="pill mx-auto mb-3 inline-flex items-center gap-1.5"><Icon name="Party" size={13}/> 14 occasions</div>
            <h2 className="font-bold text-warm-900" style={{ fontSize:'clamp(1.5rem,5vw,2.25rem)' }}>
              Whatever the moment,<br/><span className="text-primary-500">there's a card for it</span>
            </h2>
          </div>
          <div className="occasion-grid">
            {OCCASIONS.map(({ icon, label }) => (
              <Link key={label} to="/signup"
                className="bg-white border-2 border-purple-100 rounded-2xl p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2 text-center transition-all hover:border-primary-300 hover:bg-primary-50 hover:-translate-y-1 hover:shadow-md active:scale-95">
                <Icon name={icon} size={26} className="text-primary-500"/>
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
            <div className="pill mx-auto mb-3 inline-flex items-center gap-1.5"><Icon name="Zap" size={13}/> Beautifully simple</div>
            <h2 className="font-bold text-warm-900" style={{ fontSize:'clamp(1.5rem,5vw,2.25rem)' }}>
              From zero to delivered<br/><span className="text-primary-500">in under 5 minutes</span>
            </h2>
          </div>
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div key={s.num} className="bg-white border-2 border-purple-100 rounded-3xl p-5 transition-all hover:border-primary-300 hover:shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-xl bg-primary-50 border-2 border-primary-200 flex items-center justify-center font-display text-sm font-bold text-primary-600 flex-shrink-0">{s.num}</span>
                  <Icon name={s.icon} size={20} className="text-primary-500"/>
                  <span className="text-xs font-bold uppercase tracking-wide text-primary-500">{s.label}</span>
                </div>
                <h3 className="font-bold text-warm-900 mb-2 text-base">{s.title}</h3>
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
              <div className="pill mb-4 inline-flex items-center gap-1.5"><Icon name="Heart" size={13}/> For individuals</div>
              <h2 className="font-bold text-warm-900 mb-4" style={{ fontSize:'clamp(1.5rem,5vw,2.1rem)' }}>
                Everything a group card<br/><span className="text-primary-500">should actually have</span>
              </h2>
              <p className="text-warm-500 mb-6 leading-relaxed">No generic e-cards. One link, everyone signs, gift collected — and it looks stunning.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7">
                {FEATURES.map(f => (
                  <div key={f.title} className="bg-white rounded-2xl border-2 border-purple-100 p-4 flex gap-3">
                    <Icon name={f.icon} size={18} className="text-primary-500 flex-shrink-0 mt-0.5"/>
                    <div>
                      <p className="text-sm font-bold text-warm-900 mb-0.5">{f.title}</p>
                      <p className="text-xs text-warm-500 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/signup" className="btn-primary px-7 py-3.5 text-sm w-full sm:w-auto inline-flex items-center justify-center gap-2">
                <Icon name="Sparkles" size={15}/> Create your first card <Icon name="ArrowRight" size={15}/>
              </Link>
            </div>

            {/* Mock card */}
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-50 to-rose-50 border-2 border-purple-200 rounded-3xl p-5 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-purple-100"><Icon name="Cake" size={18} className="text-primary-500"/></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-warm-900 text-sm truncate">Tolu's Birthday Card</p>
                    <p className="text-xs text-warm-500">28 signed · ₦85,000 collected</p>
                  </div>
                  <span className="text-xs font-bold bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full flex-shrink-0 inline-flex items-center gap-1"><Icon name="Check" size={12}/> Active</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { av:'AO', name:'Adaeze O.', msg:"Happy birthday!! You're such an inspiration" },
                    { av:'EK', name:'Emeka K.', msg:'Wishing you all the joy this year!' },
                    { av:'KI', name:'Kemi I.', msg:'Another year wiser! Enjoy every moment' },
                    { av:'BD', name:'Bolu D.', msg:'You deserve all the good things, boss!' },
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
                    <Icon name="Gift" size={17} className="text-green-600"/>
                    <span className="text-xs font-bold text-green-800 flex-1">Gift pot · 28 contributors</span>
                    <span className="font-display text-base font-bold text-green-700">₦85,000</span>
                  </div>
                  <div className="w-full h-2 bg-green-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width:'85%', background:'linear-gradient(90deg,#10B981,#34D399)' }} />
                  </div>
                  <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">₦85,000 raised · Goal: ₦100,000 <Icon name="Target" size={11}/></p>
                </div>
              </div>
              <div className="absolute -top-3 -right-3 w-9 h-9 rounded-2xl bg-white border-2 border-purple-100 flex items-center justify-center animate-bounce-soft shadow-sm"><Icon name="Party" size={16} className="text-primary-500"/></div>
              <div className="absolute -top-2 -left-3 w-8 h-8 rounded-2xl bg-white border-2 border-purple-100 flex items-center justify-center animate-float shadow-sm"><Icon name="Gift" size={14} className="text-pink-500"/></div>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }} />

      {/* ── TESTIMONIALS ─────────────────── */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="pill mx-auto mb-3 inline-flex items-center gap-1.5"><Icon name="Star" size={13}/> Real stories</div>
            <h2 className="font-bold text-warm-900" style={{ fontSize:'clamp(1.5rem,5vw,2.25rem)' }}>
              People who actually<br/><span className="text-primary-500">made someone's day</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white border-2 border-purple-100 rounded-3xl p-5 flex flex-col gap-3 hover:border-primary-300 hover:shadow-md transition-all">
                <div className="flex gap-0.5">{Array(t.stars).fill(0).map((_,i)=><Icon key={i} name="Star" size={14} className="text-amber-400 fill-amber-400"/>)}</div>
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
            <div className="pill mx-auto mb-3 inline-flex items-center gap-1.5"><Icon name="Building" size={13}/> For HR &amp; People teams</div>
            <h2 className="font-bold text-warm-900 mb-3" style={{ fontSize:'clamp(1.5rem,5vw,2.25rem)' }}>
              Automate every celebration.<br/><span className="text-primary-500">Zero manual effort.</span>
            </h2>
            <p className="text-warm-500 max-w-xl mx-auto text-sm leading-relaxed">
              Connect your HRIS once. Thankeeu creates cards, notifies departments, pools gifts, and delivers — on the exact right day. Every time.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {[
              { icon:'Link', title:'HRIS Integration', desc:'SeamlessHR, BambooHR, Zoho People, WorkPay — one sync and your whole org is in.' },
              { icon:'Party', title:'12 Occasions Automated', desc:"Birthdays, farewells, promotions, new hires, Women's Day — zero manual effort." },
              { icon:'Mail', title:'Whole-dept Notifications', desc:'Every department member gets an email to sign. No one left out.' },
              { icon:'Card', title:'Gift pot per employee', desc:'Flutterwave handles multi-currency collections. HR never chases money again.' },
              { icon:'File', title:'HR Analytics Dashboard', desc:'Full visibility into automations, upcoming occasions, and spending.' },
              { icon:'Shield', title:'Approval Workflows', desc:'Team leaders sign off on card creation. Full control maintained.' },
            ].map(f => (
              <div key={f.title} className="bg-white border-2 border-purple-100 rounded-3xl p-4 flex gap-3 hover:border-primary-300 transition-all">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0"><Icon name={f.icon} size={18} className="text-primary-500"/></div>
                <div>
                  <p className="font-bold text-warm-900 text-sm mb-1">{f.title}</p>
                  <p className="text-xs text-warm-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/company/signup" className="btn-primary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto inline-flex items-center justify-center gap-2"><Icon name="Building" size={16}/> Start for your team <Icon name="ArrowRight" size={15}/></Link>
            <button onClick={() => setShowDemo(true)} className="btn-secondary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto inline-flex items-center justify-center gap-2"><Icon name="Calendar" size={16}/> Book a 30-min demo</button>
          </div>
        </div>
      </section>

      <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }} />

      {/* ── PRICING CALLOUT ──────────────── */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Currency toggle */}
          <div className="text-center mb-6">
            <p className="text-xs font-semibold text-warm-500 mb-2 uppercase tracking-wide">See prices in your currency</p>
            <CurrencyToggle selected={homeCurrency} onChange={setHomeCurrency} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Individual */}
            <div className="bg-gradient-to-br from-purple-50 to-rose-50 border-2 border-purple-200 rounded-3xl p-7">
              <div className="w-12 h-12 rounded-2xl bg-white border-2 border-purple-200 flex items-center justify-center mb-4"><Icon name="Heart" size={22} className="text-primary-500"/></div>
              <h3 className="text-2xl font-bold text-warm-900 mb-1">For individuals</h3>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-primary-600 font-extrabold text-2xl">
                  {formatCurrency(5000, homeCurrency)}
                </span>
                <span className="text-warm-400 text-sm">one-time</span>
              </div>
              {homeCurrency !== 'NGN' && <p className="text-xs text-warm-400 mb-3">≈ ₦5,000 · charged at live rate</p>}
              <p className="text-warm-600 mb-5 text-sm leading-relaxed">Create a card for anyone — friend, colleague, family. No account needed to sign.</p>
              <ul className="space-y-2 mb-6">
                {['✓ Quick card creation','✓ Unlimited signers','✓ Global gift pot','✓ Photo & video messages'].map(f => (
                  <li key={f} className="text-sm text-warm-700 flex gap-2">
                    <span className="text-primary-500 font-bold">{f.slice(0,1)}</span>{f.slice(1)}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="btn-primary px-7 py-3 w-full sm:w-auto inline-flex">Get started →</Link>
            </div>

            {/* Company */}
            <div className="rounded-3xl p-7 border-2 border-primary-800" style={{ background:'linear-gradient(135deg,#1A1035,#2E1F6B)' }}>
              <div className="w-12 h-12 rounded-2xl bg-purple-900/40 border-2 border-purple-700 flex items-center justify-center mb-4"><Icon name="Building" size={22} className="text-purple-200"/></div>
              <h3 className="font-display text-2xl font-bold text-purple-100 mb-1">For companies</h3>
              <p className="text-purple-200 font-extrabold text-2xl mb-1">Get a quote</p>
              <p className="text-xs text-purple-400 mb-2">Price based on your team size</p>
              <p className="text-purple-300 mb-5 text-sm leading-relaxed">Automate all team celebrations. Connect your HRIS. Never forget a birthday again.</p>
              <ul className="space-y-2 mb-6">
                {['✓ Unlimited employees','✓ HRIS integration','✓ 12 automated occasions','✓ HR analytics dashboard'].map(f => (
                  <li key={f} className="text-sm text-purple-200 flex gap-2">
                    <span className="text-purple-400 font-bold">{f.slice(0,1)}</span>{f.slice(1)}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setShowDemo(true)} className="btn-primary px-6 py-3 text-sm">Get a quote →</button>
                <Link to="/company/signup" className="px-6 py-3 text-sm font-bold rounded-2xl border-2 border-purple-500 text-purple-200 hover:bg-purple-800 transition-colors">Create account</Link>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-warm-400 mt-4 flex items-center justify-center gap-1.5"><Icon name="Globe" size={13}/> Works in Nigeria, UK, US, Canada, Ghana, Kenya, South Africa and beyond · Pay in your local currency</p>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────── */}
      <section id="how-it-works" className="py-14 md:py-20 px-4" style={{ background:'linear-gradient(180deg,#F5F0FF,#F8F4FF)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="pill mx-auto mb-3 inline-flex items-center gap-1.5"><Icon name="Lightbulb" size={13}/> How it works</div>
            <h2 style={{ fontFamily:"'Nunito',sans-serif", fontWeight:900, fontSize:'clamp(1.6rem,5vw,2.5rem)', letterSpacing:'-0.02em', color:'#1A1035' }}>
              From zero to celebration<br/><span className="text-primary-500">in under 3 minutes</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              { num:'1', icon:'Wand', title:'Create your card', desc:'Pick an occasion, choose a design, set the recipient and delivery date. Takes 2 minutes flat.' },
              { num:'2', icon:'Share', title:'Share the signing link', desc:'Copy a WhatsApp link or email it. No login needed — anyone can sign from their phone.' },
              { num:'3', icon:'Heart', title:'Watch messages roll in', desc:'Your signers add messages, photos, voice notes, GIFs and chip in to the gift pot via Flutterwave.' },
              { num:'4', icon:'Gift', title:'Deliver the surprise', desc:'Card and gift arrive by email on the exact day. The recipient opens a beautiful card, reads every message and claims the gift.' },
            ].map(s => (
              <div key={s.num} className="bg-white rounded-3xl border-2 border-purple-100 p-6 flex gap-4 hover:border-primary-300 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center text-sm flex-shrink-0"
                  style={{ fontFamily:"'Nunito',sans-serif", fontWeight:900 }}>{s.num}</div>
                <div>
                  <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center mb-2"><Icon name={s.icon} size={16} className="text-primary-500"/></div>
                  <h3 style={{ fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:'1rem', color:'#1A1035', marginBottom:'0.3rem' }}>{s.title}</h3>
                  <p className="text-sm text-warm-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-warm-400 mt-8">
            Need a walkthrough? <a href="/how-it-works" className="text-primary-500 font-semibold hover:underline">See the full guide →</a>
          </p>
        </div>
      </section>

      <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }} />

      {/* ── FAQ ───────────────────────────────── */}
      <section id="faq" className="py-14 md:py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="pill mx-auto mb-3 inline-flex items-center gap-1.5"><Icon name="HelpCircle" size={13}/> FAQ</div>
            <h2 style={{ fontFamily:"'Nunito',sans-serif", fontWeight:900, fontSize:'clamp(1.6rem,5vw,2.3rem)', letterSpacing:'-0.02em', color:'#1A1035' }}>
              Questions we get all the time
            </h2>
          </div>
          {[
            { q:'Is it really free to create a card?', a:'Yes — creating a card and collecting messages is 100% free. You only pay ₦5,000 when you\'re ready to activate and send the card to the recipient.' },
            { q:'Does the recipient need to create an account?', a:'No. The recipient simply opens a link, reads all the messages and can claim the gift — no sign-up required.' },
            { q:'What payment methods are supported?', a:'All Nigerian debit and credit cards (Visa, Mastercard, Verve), bank transfers, USSD (*737#, *822# etc) and mobile money via Flutterwave.' },
            { q:'Can people outside Nigeria contribute to the gift pot?', a:'Yes. Flutterwave supports international Visa and Mastercard cards. Your signers can contribute from anywhere in the world.' },
            { q:'What types of media can contributors add?', a:'Text messages, photos, videos (up to 50MB), voice notes, and GIFs — all in one beautiful card.' },
            { q:'How does the gift pot work for companies?', a:'Each celebration card has its own Flutterwave gift pot. Department members chip in individually. Once the card is sent, the recipient can withdraw the total to their bank account.' },
            { q:'Can I schedule the card to send on a specific date?', a:'Yes. Pick any future date and time during card creation. Thankeeu sends it automatically — even if you forget.' },
            { q:'Is there a limit on how many people can sign?', a:'No limit. Invite your entire company if you want. The more signatures, the more meaningful the card.' },
          ].map((item, i) => {
            const [open, setOpen] = useState(false);
            return (
              <div key={i} className="border-b border-purple-100">
                <button onClick={() => setOpen(!open)}
                  className="w-full text-left flex items-center justify-between py-4 gap-4 hover:text-primary-600 transition-colors">
                  <span style={{ fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:'0.9rem', color:'#1A1035' }}>{item.q}</span>
                  <span className={`text-primary-400 flex-shrink-0 text-lg transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
                </button>
                {open && <p className="text-sm text-warm-600 leading-relaxed pb-4">{item.a}</p>}
              </div>
            );
          })}
          <p className="text-center text-xs text-warm-400 mt-8">
            More questions? <a href="/faq" className="text-primary-500 font-semibold hover:underline">See all FAQs →</a>
          </p>
        </div>
      </section>


      {/* ── ECOSYSTEM: Pals + Vendor Marketplace ─────────────────────────── */}
      <section className="py-14 md:py-20 px-4" style={{ background:'#fff' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="pill mx-auto mb-3 inline-flex items-center gap-1.5">
              <Icon name="Layers" size={13}/> More ways to celebrate
            </div>
            <h2 className="font-extrabold text-warm-900 mb-3" style={{ fontSize:'clamp(1.6rem,5vw,2.4rem)' }}>
              Beyond the card
            </h2>
            <p className="text-warm-500 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Thankeeu is a full celebration platform — not just a card tool. 
              Send real gifts. Celebrate with your inner circle. Do it all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* ── Thankeeu Pals ────────────────────────────── */}
            <div className="relative rounded-3xl overflow-hidden border-2 border-purple-100 p-7 flex flex-col"
              style={{ background:'linear-gradient(135deg,#F5F0FF 0%,#FFF0F8 100%)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background:'linear-gradient(135deg,#8B5CF6,#EC4899)' }}>
                  🤝
                </div>
                <div>
                  <p className="text-xs font-bold text-primary-500 uppercase tracking-wider mb-0.5">New</p>
                  <h3 className="text-xl font-extrabold text-warm-900">Thankeeu Pals</h3>
                </div>
              </div>

              <p className="text-warm-600 text-sm leading-relaxed mb-4">
                A private celebration circle for your closest people — best friends, family, 
                a tight-knit crew. Everyone joins, adds their dates, and Thankeeu automatically 
                creates a group card when someone's birthday or special day arrives.
              </p>

              <ul className="space-y-2 mb-6">
                {[
                  'Up to 15 people in a private group',
                  'Auto-created cards for every occasion',
                  'Gift pot collected and paid out at 6 pm on the day',
                  'No HR. No company. Just your people.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-warm-700">
                    <span className="text-primary-500 mt-0.5 flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex flex-wrap gap-3">
                <Link to="/pals"
                  className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-1.5">
                  <Icon name="Users" size={14}/> Learn about Pals
                </Link>
                <Link to="/pals/signup"
                  className="btn-secondary px-5 py-2.5 text-sm inline-flex items-center gap-1.5">
                  Start a group →
                </Link>
              </div>
            </div>

            {/* ── Vendor Marketplace ───────────────────────── */}
            <div className="relative rounded-3xl overflow-hidden border-2 border-amber-100 p-7 flex flex-col"
              style={{ background:'linear-gradient(135deg,#FFFBEB 0%,#FFF5F0 100%)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background:'linear-gradient(135deg,#F59E0B,#EF4444)' }}>
                  🛍️
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">Marketplace</p>
                  <h3 className="text-xl font-extrabold text-warm-900">Gift Marketplace</h3>
                </div>
              </div>

              <p className="text-warm-600 text-sm leading-relaxed mb-4">
                Attach a real, physical gift to any card — straight from local vendors. 
                Pick from cakes, flowers, chocolates, jewellery, hampers and more. 
                The vendor is notified with the delivery deadline so your gift arrives on time.
              </p>

              <ul className="space-y-2 mb-6">
                {[
                  'Browse verified local gift vendors',
                  'Order cakes, flowers, chocolates & more',
                  'Vendor notified with your celebration date',
                  'Sell on Thankeeu? Apply to become a vendor',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-warm-700">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex flex-wrap gap-3">
                <Link to="/vendors"
                  className="px-5 py-2.5 text-sm font-bold rounded-2xl inline-flex items-center gap-1.5 transition-all"
                  style={{ background:'linear-gradient(135deg,#F59E0B,#EF4444)', color:'#fff' }}>
                  <Icon name="Store" size={14}/> Browse gift vendors
                </Link>
                <Link to="/vendors"
                  className="px-5 py-2.5 text-sm font-bold rounded-2xl border-2 border-amber-200 text-amber-700 hover:bg-amber-50 transition-all inline-flex items-center gap-1.5">
                  Sell on Thankeeu →
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }} />

      {/* ── BOTTOM CTA ───────────────────── */}
      <section className="py-16 md:py-24 px-4 text-center" style={{ background:'linear-gradient(135deg,#F5F0FF,#FFF0F5)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center gap-2 sm:gap-3 mb-6">
            {['Cake','Gift','Party','Heart','Sparkles'].map((name,i) => (
              <span key={i} className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-white border-2 border-purple-100 flex items-center justify-center animate-float" style={{ animationDelay:`${i*0.15}s` }}>
                <Icon name={name} size={22} className="text-primary-500"/>
              </span>
            ))}
          </div>
          <h2 className="font-bold text-warm-900 mb-4" style={{ fontSize:'clamp(1.75rem,6vw,3rem)' }}>
            Make someone feel<br/>
            <span style={{ background:'linear-gradient(135deg,#8B5CF6,#7C3AED 50%,#F43F5E)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              genuinely loved
            </span>
          </h2>
          <p className="text-warm-500 mb-8 text-base sm:text-lg">From <RotatingPrice amountNGN={5000} /> per card · Pay only when you send · Works worldwide</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup" className="btn-primary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto inline-flex items-center justify-center gap-2"><Icon name="Sparkles" size={16}/> Get started — takes 2 min</Link>
            <Link to="/pricing" className="btn-secondary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto inline-flex items-center justify-center gap-2"><Icon name="Card" size={16}/> See pricing</Link>
          </div>
          <p className="text-xs text-warm-400 mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1"><Icon name="Lock" size={12}/> Secure payments</span><span>·</span>
            <span className="inline-flex items-center gap-1"><Icon name="Sparkles" size={12}/> No credit card needed</span><span>·</span>
            <span className="inline-flex items-center gap-1"><Icon name="Globe" size={12}/> Used worldwide</span>
          </p>
          <p className="text-xs text-warm-300 mt-4">
            Got a tight group of friends or family?{' '}
            <Link to="/pals" className="text-primary-400 hover:text-primary-600 hover:underline">Start a free Thankeeu Pals group</Link>
            {' '}· Sell cakes, flowers & gifts?{' '}
            <Link to="/vendors" className="text-primary-400 hover:text-primary-600 hover:underline">Become a vendor</Link>
          </p>
        </div>
      </section>

      <Footer />
      {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}
    </div>
  );
};

export default Home;
