import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { demoAPI } from '../utils/api';
import toast from 'react-hot-toast';
import Icon from '../components/ui/Icon';

const TEAM_SIZE_OPTIONS = ['1–10', '11–50', '51–200', '201–500', '500+'];

const FEATURES = [
  { icon: 'Zap',       title: 'Zero setup per occasion',        desc: 'Connect your HR system once. Every birthday, work anniversary and farewell is detected and a card is created automatically. You never think about it again.' },
  { icon: 'Link',      title: 'One link. Everyone signs.',       desc: 'No app download. No forced signups. Your team opens the link, adds their message, photo or voice note in 30 seconds, and moves on with their day.' },
  { icon: 'Gift',      title: 'Gift collection built in',        desc: 'Team members contribute whatever they can. Thankeeu pools it, holds it safely, and pays it out to the recipient\'s bank account via Flutterwave — automatically.' },
  { icon: 'Send',      title: 'Delivered at the exact moment',   desc: 'The card arrives in the recipient\'s inbox at precisely the time you choose — even if you\'re in a meeting, on leave, or fast asleep. Fully unattended.' },
];

const WA_PAINS = [
  { icon: 'MessageCircle', label: 'Buried in 58 unread messages',      sub: 'between a meme, a work update and a photo of someone\'s lunch' },
  { icon: 'UserX',         label: 'Half the team never contributes',   sub: '"I didn\'t see the message" — every single time' },
  { icon: 'Search',        label: 'Impossible to revisit',             sub: 'scroll back 3 weeks through 600 messages to find a birthday wish' },
  { icon: 'Image',         label: 'Photos mixed with everything else', sub: 'lost between receipts, news articles and voice notes' },
  { icon: 'Clock',         label: 'Gone within 48 hours',              sub: 'replaced by Monday morning work chat before the cake is finished' },
  { icon: 'TrendingDown',  label: 'No record it ever happened',        sub: 'the moment disappears. the person noticed.' },
];

const TK_WINS = [
  { icon: 'LayoutGrid',   label: 'Every message in one beautiful card', sub: 'organised, searchable, shared as a permanent memory' },
  { icon: 'Users',        label: 'The whole team participates',         sub: 'one link on Slack at 9am — done by lunch, no chasing' },
  { icon: 'Archive',      label: 'Revisited months or years later',     sub: 'employees screenshot and save these — they mean something' },
  { icon: 'Image',        label: 'Photos, videos and voice notes',      sub: 'in a dedicated gallery, not buried in a group chat' },
  { icon: 'Gift',         label: 'Gift pool collected automatically',   sub: 'no WhatsApp bank alerts, no one Venmo-ing the wrong person' },
  { icon: 'TrendingUp',   label: 'A culture signal people remember',    sub: 'recognition that employees tell candidates about at interviews' },
];

export default function BookDemo() {
  useSEO({
    title: 'Book a Demo — Thankeeu for Business | Never Miss an Employee\'s Birthday Again',
    description: 'See how Thankeeu automates employee birthdays, farewells and recognition end-to-end. Beautiful group cards, pooled gifts, exact-time delivery. Free demo, 30 minutes.',
    keywords: 'employee recognition platform Nigeria, automated birthday card employees, HR group card tool, Thankeeu for business, employee appreciation software Nigeria',
    canonical: '/business',
  });

  const [form, setForm]     = useState({ contact_name:'', email:'', company_name:'', phone:'', team_size:'', message:'' });
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.contact_name.trim() || !form.email.trim() || !form.company_name.trim())
      return toast.error('Please fill in your name, email and company name');
    setLoading(true);
    try {
      await demoAPI.submit(form);
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong. Email us at support@thankeeu.com');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background:'#FDFCFF' }}>
      <Navbar />

      {/* ══ HERO ══ */}
      <section className="pt-14 pb-0 px-4 gc-font" style={{ background:'linear-gradient(160deg,#F5F0FF 0%,#FDFCFF 65%)' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

          <div className="text-center lg:text-left py-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
              style={{ background:'#EDE9FE', color:'#7C3AED' }}>
              <Icon name="Building2" size={12}/> Thankeeu for Business
            </div>

            <h1 className="font-extrabold text-warm-900 mb-5 leading-tight"
              style={{ fontSize:'clamp(2rem,5vw,3.25rem)', letterSpacing:'-0.03em' }}>
              82% of employees feel<br/>
              <span style={{ background:'linear-gradient(135deg,#7C3AED,#F43F5E)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                unappreciated at work.
              </span>
            </h1>

            <p className="text-warm-600 mb-5 leading-relaxed" style={{ fontSize:'clamp(1rem,2.2vw,1.15rem)' }}>
              Research shows lack of appreciation is the <strong>most fixable</strong> cause of quiet quitting and employee turnover — and yet most companies still celebrate birthdays in a WhatsApp group and call it culture.
            </p>

            <p className="text-warm-500 mb-7 leading-relaxed text-base">
              Thankeeu is the end-to-end employee recognition infrastructure that fixes this automatically. Every birthday, work anniversary and farewell — detected, carded, signed by the team, and delivered on time. Without HR lifting a finger.
            </p>

            {/* Before / After */}
            <div className="space-y-2 mb-8 text-left">
              {[
                { before:`Someone's birthday passes and you only find out Monday`, after:'Automatic occasion detection — nothing slips through ever again' },
                { before:'Chasing 30 people to sign a card the night before', after:'One Slack link. Everyone signs by lunch. No chasing.' },
                { before:'Collecting cash via WhatsApp and counting manually', after:'Naira gift pot collected and paid out automatically via Flutterwave' },
              ].map(r => (
                <div key={r.before} className="bg-white rounded-2xl border border-purple-100 px-4 py-3 shadow-sm">
                  <p className="text-xs text-rose-500 font-semibold mb-0.5 flex items-center gap-1.5">
                    <Icon name="X" size={11}/> {r.before}
                  </p>
                  <p className="text-xs font-bold flex items-center gap-1.5" style={{ color:'#7C3AED' }}>
                    <Icon name="Check" size={11}/> {r.after}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <a href="#book-demo" className="gc-btn-primary inline-flex items-center justify-center gap-2 px-8 py-4 text-base">
                <Icon name="Calendar" size={18}/> Book a free demo →
              </a>
              <Link to="/company/signup" className="gc-btn-secondary inline-flex items-center justify-center gap-2 px-8 py-4 text-base">
                Start free trial
              </Link>
            </div>
            <p className="text-xs text-warm-400 mt-4">Free · 30 minutes · No commitment · Response within 24 hours</p>
          </div>

          {/* Mock card preview */}
          <div className="flex justify-center pb-6 lg:pb-0">
            <div className="w-full max-w-sm">
              <div className="bg-white rounded-3xl border-2 border-purple-100 shadow-2xl overflow-hidden">
                <div className="px-5 py-4" style={{ background:'linear-gradient(135deg,#EDE9FE,#F5F0FF)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-primary-500 uppercase tracking-wider">
                      <Icon name="Cake" size={11} className="inline mr-1"/>Birthday Card
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-full">32 signed</span>
                  </div>
                  <p className="font-extrabold text-warm-900 text-lg">For Adaeze Okonkwo</p>
                  <p className="text-xs text-warm-400 mt-0.5">HR Manager · Lagos Office · 5 years</p>
                </div>
                <div className="p-3 space-y-2">
                  {[
                    { init:'EK', color:'#7C3AED', bg:'#EDE9FE', name:'Emeka K.', msg:'5 years of showing up and making this place better. Happy birthday — you deserve every good thing.' },
                    { init:'KI', color:'#0D9488', bg:'#CCFBF1', name:'Kemi I.',  msg:'The best HR manager I\'ve ever worked with. Today is all about you!' },
                    { init:'BD', color:'#DB2777', bg:'#FCE7F3', name:'Bolu D.',  msg:'From the whole Lagos team — we love you. Have the best birthday ever.' },
                  ].map(m => (
                    <div key={m.init} className="flex gap-2.5 p-2.5 rounded-2xl" style={{ background:m.bg }}>
                      <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                        style={{ background:m.color }}>{m.init}</div>
                      <div>
                        <p className="font-bold text-xs text-warm-800">{m.name}</p>
                        <p className="text-xs text-warm-600 leading-snug">{m.msg}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mx-3 mb-3 p-3 rounded-2xl" style={{ background:'linear-gradient(135deg,#ecfdf5,#d1fae5)', border:'1.5px solid #6ee7b7' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-700 flex items-center gap-1"><Icon name="Gift" size={11}/>Gift pot collected</p>
                      <p className="font-extrabold text-emerald-800 text-xl">₦85,000</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-emerald-600">28 contributors</p>
                      <p className="text-xs text-emerald-500">via Flutterwave</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center mt-3 -space-x-2">
                {['#7C3AED','#0D9488','#DB2777','#D97706','#1D4ED8'].map((color,i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                    style={{ background:color }}>
                    {['EK','KI','BD','TN','SO'][i]}
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold bg-warm-200 text-warm-600">+27</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ WHATSAPP VS THANKEEU (B2B angle) ══ */}
      <section className="py-16 md:py-20 px-4 gc-font" style={{ background:'#fff' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className="font-extrabold text-warm-900 mb-4 leading-tight"
              style={{ fontSize:'clamp(1.7rem,4vw,2.5rem)', letterSpacing:'-0.025em' }}>
              Your team deserves better than<br/> a WhatsApp group for birthdays.
            </h2>
            <p className="text-warm-500 text-base leading-relaxed">
              When recognition happens in a group chat, it disappears. When it happens on Thankeeu, it becomes something the employee tells people about for years.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* WhatsApp */}
            <div className="rounded-3xl border-2 border-warm-100 overflow-hidden" style={{ background:'#f9fafb' }}>
              <div className="px-6 py-4 flex items-center gap-3 border-b border-warm-100" style={{ background:'rgba(255,255,255,0.8)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'#25D366' }}>
                  <Icon name="MessageCircle" size={18} style={{ color:'#fff' }}/>
                </div>
                <div>
                  <p className="font-bold text-warm-900 text-sm">WhatsApp Group Chat</p>
                  <p className="text-xs text-warm-400">Happy Birthday Adaeze!!!!</p>
                </div>
                <div className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ background:'#fee2e2', color:'#dc2626' }}>
                  <Icon name="Bell" size={11}/> 58 unread
                </div>
              </div>
              <div className="p-5 space-y-2.5">
                {WA_PAINS.map((p,i) => (
                  <div key={p.label} className="flex items-start gap-3 p-3 rounded-2xl"
                    style={{ background:'rgba(255,255,255,0.7)', opacity: 1 - i * 0.06 }}>
                    <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background:'#f3f4f6', color:'#9ca3af' }}>
                      <Icon name={p.icon} size={14}/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-warm-700 text-sm">{p.label}</p>
                      <p className="text-xs text-warm-400 mt-0.5 leading-snug">{p.sub}</p>
                    </div>
                    <Icon name="X" size={13} style={{ color:'#fca5a5', flexShrink:0, marginTop:2 }}/>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-warm-100 text-center" style={{ background:'rgba(255,255,255,0.5)' }}>
                <p className="text-sm font-semibold text-warm-400 flex items-center justify-center gap-1.5">
                  <Icon name="TrendingDown" size={14}/> The moment disappears. The employee notices.
                </p>
              </div>
            </div>

            {/* Thankeeu */}
            <div className="rounded-3xl border-2 overflow-hidden shadow-xl relative" style={{ background:'linear-gradient(160deg,#F5F0FF,#fff 60%)', borderColor:'#DDD6FE' }}>
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
                style={{ background:'radial-gradient(circle,rgba(139,92,246,0.12),transparent 70%)' }}/>
              <div className="px-6 py-4 flex items-center gap-3 border-b" style={{ borderColor:'#EDE9FE', background:'rgba(255,255,255,0.85)' }}>
                <img src="/android-chrome-192x192.png" alt="Thankeeu" className="w-9 h-9 rounded-xl object-cover flex-shrink-0"/>
                <div>
                  <p className="font-bold text-warm-900 text-sm">Thankeeu Group Card</p>
                  <p className="text-xs text-primary-400">For Adaeze · Birthday 🎂</p>
                </div>
                <div className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background:'#d1fae5', color:'#065f46' }}>
                  <Icon name="CheckCircle" size={11}/> 32 signed
                </div>
              </div>
              <div className="p-5 space-y-2.5">
                {TK_WINS.map(w => (
                  <div key={w.label} className="flex items-start gap-3 p-3 rounded-2xl border" style={{ background:'rgba(255,255,255,0.85)', borderColor:'#EDE9FE' }}>
                    <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background:'linear-gradient(135deg,#EDE9FE,#DDD6FE)', color:'#7C3AED' }}>
                      <Icon name={w.icon} size={14}/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-warm-900 text-sm">{w.label}</p>
                      <p className="text-xs text-warm-500 mt-0.5 leading-snug">{w.sub}</p>
                    </div>
                    <Icon name="Check" size={13} style={{ color:'#7C3AED', flexShrink:0, marginTop:2 }}/>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t text-center" style={{ borderColor:'#EDE9FE', background:'rgba(255,255,255,0.5)' }}>
                <p className="text-sm font-semibold flex items-center justify-center gap-1.5" style={{ color:'#7C3AED' }}>
                  <Icon name="Heart" size={14}/> A memory your employee will talk about for years.
                </p>
              </div>
            </div>
          </div>

          {/* Pull quote */}
          <div className="mt-10 text-center">
            <div className="inline-block px-8 py-6 rounded-3xl max-w-2xl"
              style={{ background:'linear-gradient(135deg,#1A1035,#2D1B69)', boxShadow:'0 20px 60px rgba(124,58,237,0.2)' }}>
              <p className="font-extrabold text-white leading-snug" style={{ fontSize:'clamp(1.1rem,3vw,1.55rem)', letterSpacing:'-0.02em' }}>
                Recognition is the most fixable cause of employee turnover.
              </p>
              <p className="mt-2 font-semibold" style={{ fontSize:'clamp(1rem,2.5vw,1.25rem)', background:'linear-gradient(135deg,#A78BFA,#F472B6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                Thankeeu makes it happen automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="py-16 px-4 gc-font" style={{ background:'linear-gradient(180deg,#F5F0FF,#FDFCFF)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-bold text-warm-900 mb-3" style={{ fontSize:'clamp(1.7rem,4vw,2.5rem)' }}>
              End-to-end. Fully automated.
            </h2>
            <p className="text-warm-500 max-w-xl mx-auto">Set it up once. Thankeeu runs every occasion from that day forward without you.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="bg-white rounded-3xl border-2 border-purple-100 p-6 flex gap-4 hover:shadow-md transition-shadow">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-white text-sm"
                    style={{ background:'linear-gradient(135deg,#7C3AED,#A855F7)' }}>
                    {i + 1}
                  </div>
                </div>
                <div>
                  <p className="font-bold text-warm-900 mb-1.5 text-base">{f.title}</p>
                  <p className="text-warm-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BRIDGE CTA ══ */}
      <div className="py-10 px-4 gc-font text-center" style={{ background:'linear-gradient(135deg,#7C3AED,#A855F7)' }}>
        <p className="font-extrabold text-white mb-2" style={{ fontSize:'clamp(1.3rem,3.5vw,1.9rem)' }}>
          Your employees deserve to feel celebrated. Every time.
        </p>
        <p className="text-purple-200 mb-5 max-w-xl mx-auto text-sm sm:text-base">
          88% of job seekers say workplace culture is essential to their success. Recognition is culture. Make it automatic.
        </p>
        <a href="#book-demo" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-primary-600 bg-white hover:bg-purple-50 transition-all text-base shadow-lg">
          <Icon name="Calendar" size={18}/> Book your free demo →
        </a>
      </div>

      {/* ══ DEMO FORM ══ */}
      <section id="book-demo" className="py-16 px-4 gc-font">
        <div className="max-w-2xl mx-auto">
          {done ? (
            <div className="bg-white rounded-3xl border-2 border-primary-100 shadow-lg p-10 text-center">
              <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-primary-50 flex items-center justify-center">
                <Icon name="CheckCircle" size={40} className="text-primary-500"/>
              </div>
              <h2 className="font-extrabold text-warm-900 text-2xl mb-3">Demo request received!</h2>
              <p className="text-warm-500 mb-2">We'll reach out within <strong>12 hours</strong> to schedule your demo.</p>
              <p className="text-warm-400 text-sm mb-8">In the meantime, explore Thankeeu yourself — no commitment needed.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/company/signup" className="gc-btn-primary px-8 py-3 inline-flex items-center justify-center gap-2">
                  Start free trial now
                </Link>
                <Link to="/" className="gc-btn-secondary px-8 py-3 inline-flex items-center justify-center gap-2">
                  Back to home
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border-2 border-purple-100 shadow-lg overflow-hidden">
              <div className="px-8 py-6" style={{ background:'linear-gradient(135deg,#EDE9FE,#F5F0FF)', borderBottom:'1.5px solid #DDD6FE' }}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3"
                  style={{ background:'#7C3AED', color:'#fff' }}>
                  <Icon name="Calendar" size={12}/> Book a demo
                </div>
                <h2 className="font-extrabold text-warm-900 text-2xl mb-1">See Thankeeu for Business live</h2>
                <p className="text-warm-500 text-sm">Free · 30 minutes · Tailored to your team size and industry · Usually within 24 hours</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-warm-700 mb-1.5">Full name *</label>
                    <input className="input" placeholder="Your name" value={form.contact_name}
                      onChange={e => set('contact_name', e.target.value)} required/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-warm-700 mb-1.5">Work email *</label>
                    <input type="email" className="input" placeholder="you@company.com" value={form.email}
                      onChange={e => set('email', e.target.value)} required/>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-warm-700 mb-1.5">Company name *</label>
                    <input className="input" placeholder="Acme Corp" value={form.company_name}
                      onChange={e => set('company_name', e.target.value)} required/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-warm-700 mb-1.5">Phone number</label>
                    <input className="input" placeholder="+234 800 000 0000" value={form.phone}
                      onChange={e => set('phone', e.target.value)}/>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-2">Team size</label>
                  <div className="flex flex-wrap gap-2">
                    {TEAM_SIZE_OPTIONS.map(s => (
                      <button type="button" key={s} onClick={() => set('team_size', s)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                          form.team_size === s
                            ? 'border-primary-400 bg-primary-50 text-primary-600'
                            : 'border-purple-100 text-warm-600 hover:border-primary-300'
                        }`}>{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">
                    What would you like to see? <span className="text-warm-400 font-normal">(optional)</span>
                  </label>
                  <textarea className="input resize-none" rows={3}
                    placeholder="e.g. Automated birthdays, HRIS integration, gift collection, pricing for 200+ staff..."
                    value={form.message} onChange={e => set('message', e.target.value)}/>
                </div>
                <button type="submit" disabled={loading}
                  className="gc-btn-primary w-full py-4 text-base font-bold inline-flex items-center justify-center gap-2">
                  {loading
                    ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Booking your demo…</>
                    : <><Icon name="Calendar" size={18}/> Book my free demo →</>
                  }
                </button>
                <p className="text-xs text-warm-400 text-center">
                  No commitment · We suggest a time that works for you ·{' '}
                  <Link to="/policy" className="underline hover:text-primary-500">Privacy policy</Link>
                </p>
              </form>
            </div>
          )}
        </div>
      </section>

      <Footer/>
    </div>
  );
}
