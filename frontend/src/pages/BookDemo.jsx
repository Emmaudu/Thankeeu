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
  { icon: 'Calendar',   title: 'Automated occasion detection',  desc: 'Connect your HR system. Thankeeu automatically creates birthday and work anniversary cards — no manual setup.' },
  { icon: 'Users',      title: 'Whole team signs in one click', desc: 'Share one link on Slack or email. Every colleague signs, adds photos and voice notes without creating an account.' },
  { icon: 'Gift',       title: 'Pool gifts safely',             desc: 'Collect Naira contributions from the team in one pot. Paid out instantly to the recipient via Flutterwave.' },
  { icon: 'BarChart2',  title: 'HR dashboard & analytics',      desc: 'Track participation, upcoming occasions and gift collections from a single HR dashboard.' },
];

export default function BookDemo() {
  useSEO({
    title: 'Book a Demo — Thankeeu for Business | Automated Employee Recognition Cards',
    description: 'See how Thankeeu automates birthday cards, farewell cards and employee recognition for your team. Live demo with an expert. Free, 30 minutes, no commitment.',
    keywords: 'employee recognition platform Nigeria, HR group card tool, automated birthday card employees, Thankeeu for business, book demo Thankeeu, team card software Nigeria, employee appreciation software',
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
    <div className="min-h-screen flex flex-col" style={{ background: '#FDFCFF' }}>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-12 pb-0 px-4 gc-font" style={{ background: 'linear-gradient(160deg,#F5F0FF 0%,#FDFCFF 60%)' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

          {/* Left: pitch */}
          <div className="text-center lg:text-left py-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
              style={{ background: '#EDE9FE', color: '#7C3AED' }}>
              🏢 Thankeeu for Business
            </div>
            <h1 className="font-extrabold text-warm-900 mb-6 leading-tight"
              style={{ fontSize: 'clamp(2rem,5vw,3.2rem)', letterSpacing: '-0.03em' }}>
              Make every employee<br/>
              feel <span style={{ background: 'linear-gradient(135deg,#7C3AED,#F43F5E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>genuinely celebrated</span>
            </h1>
            <p className="text-warm-500 mb-8 leading-relaxed" style={{ fontSize: 'clamp(1.05rem,2.2vw,1.2rem)' }}>
              Automate birthday cards, farewell cards, work anniversaries and team milestones — with real messages, photos and pooled gifts. No chasing people. No Google Forms. Just one link.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <a href="#book-demo" className="gc-btn-primary inline-flex items-center justify-center gap-2 px-8 py-4 text-base">
                Book a free demo →
              </a>
              <Link to="/company/signup" className="gc-btn-secondary inline-flex items-center justify-center gap-2 px-8 py-4 text-base">
                Start free trial
              </Link>
            </div>
            <p className="text-xs text-warm-400 mt-4">Free · 30 minutes · No commitment · Usually within 24 hours</p>
          </div>

          {/* Right: mock HR dashboard card */}
          <div className="flex justify-center lg:justify-end pb-0 lg:pb-0">
            <div className="w-full max-w-sm">
              <div className="bg-white rounded-3xl border-2 border-purple-100 shadow-2xl overflow-hidden">
                {/* Card header */}
                <div className="px-5 py-4" style={{ background: 'linear-gradient(135deg,#EDE9FE,#F5F0FF)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-primary-500 uppercase tracking-wider">🎂 Birthday Card</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-full">32 signed</span>
                  </div>
                  <p className="font-extrabold text-warm-900 text-lg">For Adaeze Okonkwo 🎉</p>
                  <p className="text-xs text-warm-400 mt-0.5">HR Manager · Lagos Office</p>
                </div>
                {/* Messages */}
                <div className="p-3 space-y-2">
                  {[
                    { init:'EK', color:'#7C3AED', bg:'#EDE9FE', name:'Emeka K.', msg:'Happy birthday!! You are the reason this team smiles 🎉' },
                    { init:'KI', color:'#0D9488', bg:'#CCFBF1', name:'Kemi I.',  msg:'Another year wiser and still the coolest person here 😂❤️' },
                    { init:'BD', color:'#DB2777', bg:'#FCE7F3', name:'Bolu D.',  msg:'From the whole team — we\'re so lucky to have you! ✨' },
                  ].map(m => (
                    <div key={m.init} className="flex gap-2.5 p-2.5 rounded-2xl" style={{ background: m.bg }}>
                      <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: m.color }}>{m.init}</div>
                      <div>
                        <p className="font-bold text-xs text-warm-800">{m.name}</p>
                        <p className="text-xs text-warm-600 leading-snug">{m.msg}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Gift pot */}
                <div className="mx-3 mb-3 p-3 rounded-2xl" style={{ background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', border: '1.5px solid #6ee7b7' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-700">🎁 Gift pot collected</p>
                      <p className="font-extrabold text-emerald-800 text-xl">₦85,000</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-emerald-600">28 contributors</p>
                      <p className="text-xs text-emerald-500">via Flutterwave</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating avatars */}
              <div className="flex justify-center mt-3 -space-x-2">
                {['#7C3AED','#0D9488','#DB2777','#D97706','#1D4ED8'].map((c,i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: c }}>
                    {['EK','KI','BD','TN','SO'][i]}
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold bg-warm-200 text-warm-600">+27</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 gc-font">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-bold text-warm-900 mb-3" style={{ fontSize: 'clamp(1.7rem,4vw,2.5rem)' }}>
              Everything your HR team needs
            </h2>
            <p className="text-warm-500 max-w-xl mx-auto">One platform. Every occasion. Zero admin overhead.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-3xl border-2 border-purple-100 p-6 flex gap-4 hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Icon name={f.icon} size={20} className="text-primary-500" />
                </div>
                <div>
                  <p className="font-bold text-warm-900 mb-1.5">{f.title}</p>
                  <p className="text-warm-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Demo form ────────────────────────────────────────────────────── */}
      <section id="book-demo" className="py-16 px-4 gc-font">
        <div className="max-w-2xl mx-auto">
          {done ? (
            <div className="bg-white rounded-3xl border-2 border-primary-100 shadow-lg p-10 text-center">
              <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-primary-50 flex items-center justify-center">
                <Icon name="CheckCircle" size={40} className="text-primary-500" />
              </div>
              <h2 className="font-extrabold text-warm-900 text-2xl mb-3">Demo request received! 🎉</h2>
              <p className="text-warm-500 mb-2">We'll reach out within <strong>12 hours</strong> to schedule your demo.</p>
              <p className="text-warm-400 text-sm mb-8">In the meantime, feel free to explore Thankeeu yourself — no commitment needed.</p>
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
              {/* Form header */}
              <div className="px-8 py-6" style={{ background: 'linear-gradient(135deg,#EDE9FE,#F5F0FF)', borderBottom: '1.5px solid #DDD6FE' }}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3"
                  style={{ background: '#7C3AED', color: '#fff' }}>
                  📅 Book a demo
                </div>
                <h2 className="font-extrabold text-warm-900 text-2xl mb-1">See Thankeeu for Business live</h2>
                <p className="text-warm-500 text-sm">Free · 30 minutes · Tailored to your team · Usually within 24 hours</p>
              </div>

              {/* Form body */}
              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-warm-700 mb-1.5">Full name *</label>
                    <input className="input" placeholder="Your name" value={form.contact_name}
                      onChange={e => set('contact_name', e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-warm-700 mb-1.5">Work email *</label>
                    <input type="email" className="input" placeholder="you@company.com" value={form.email}
                      onChange={e => set('email', e.target.value)} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-warm-700 mb-1.5">Company name *</label>
                    <input className="input" placeholder="Acme Corp" value={form.company_name}
                      onChange={e => set('company_name', e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-warm-700 mb-1.5">Phone number</label>
                    <input className="input" placeholder="+234 800 000 0000" value={form.phone}
                      onChange={e => set('phone', e.target.value)} />
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
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">What would you like to see? <span className="text-warm-400 font-normal">(optional)</span></label>
                  <textarea className="input resize-none" rows={3}
                    placeholder="e.g. Automated birthday cards, HRIS integration, gift collection, pricing for our team size..."
                    value={form.message} onChange={e => set('message', e.target.value)} />
                </div>

                <button type="submit" disabled={loading}
                  className="gc-btn-primary w-full py-4 text-base font-bold inline-flex items-center justify-center gap-2">
                  {loading
                    ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Booking your demo…</>
                    : <><Icon name="Calendar" size={18} /> Book my free demo →</>
                  }
                </button>

                <p className="text-xs text-warm-400 text-center">
                  No commitment · We'll suggest a time that works for you ·{' '}
                  <Link to="/policy" className="underline hover:text-primary-500">Privacy policy</Link>
                </p>
              </form>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
