import { useSEO, SCHEMAS } from '../hooks/useSEO';
import { useState, useEffect, useRef } from 'react';
import { RotatingPrice, CurrencyToggle } from '../utils/currencyUI';
import { formatCurrency } from '../utils/currency';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';
import { demoAPI } from '../utils/api';
import toast from 'react-hot-toast';

/* ─── Data ───────────────────────────────────────────────────────────── */

const OCCASIONS = [
  { icon: 'Cake',           label: 'Birthday',     path: '/occasions/birthday' },
  { icon: 'Briefcase',      label: 'Farewell',      path: '/occasions/farewell' },
  { icon: 'TrendingUp',     label: 'Promotion',     path: '/occasions/promotion' },
  { icon: 'GraduationCap',  label: 'Graduation',    path: '/occasions/graduation' },
  { icon: 'Heart',          label: 'Anniversary',   path: '/occasions/anniversary' },
  { icon: 'HandHeart',      label: 'Wedding',       path: '/occasions/wedding' },
  { icon: 'Baby',           label: 'Baby Shower',   path: '/occasions/new-baby' },
  { icon: 'Sun',            label: 'Retirement',    path: '/create-card' },
  { icon: 'HeartPulse',     label: 'Get Well',      path: '/create-card' },
  { icon: 'Snowflake',      label: 'Christmas',     path: '/create-card' },
  { icon: 'Gift',           label: "Valentine's",   path: '/create-card' },
  { icon: 'Party',          label: 'More…',         path: '/create-card' },
];

/* Photo-album card signing mock — messages shown in the hero live preview */
const DEMO_MESSAGES = [
  { initials: 'AO', name: 'Adaeze O.',  color: '#7C3AED', bg: '#EDE9FE',
    text: "Happy birthday!! You're the reason our whole team smiles every day 🎉" },
  { initials: 'EK', name: 'Emeka K.',   color: '#0D9488', bg: '#CCFBF1',
    text: 'Wishing you all the joy this year, boss! You deserve every bit of it 🙌' },
  { initials: 'KI', name: 'Kemi I.',    color: '#DB2777', bg: '#FCE7F3',
    text: 'Another year wiser and still the coolest person in the office 😂❤️' },
  { initials: 'BD', name: 'Bolu D.',    color: '#92400E', bg: '#FEF3C7',
    text: 'From the whole team — we are so lucky to have you. Keep shining! ✨' },
  { initials: 'TN', name: 'Tunde N.',   color: '#1D4ED8', bg: '#DBEAFE',
    text: 'You have no idea how much we appreciate everything you do. 🫶' },
];

const TESTIMONIALS = [
  { name: 'Adaeze O.',  role: 'HR Manager',  loc: 'Lagos',        stars: 5,
    text: "Our colleague's farewell card had 34 messages and a ₦120k spa voucher. She cried happy tears. Thankeeu made it ridiculously easy." },
  { name: 'Emeka T.',   role: 'Engineer',    loc: 'Abuja',        stars: 5,
    text: "Organised my girlfriend's birthday from London. 22 people signed, raised ₦500k. She was genuinely shocked. Best ₦5k I ever spent." },
  { name: 'Kemi B.',    role: 'People Ops',  loc: 'Port Harcourt', stars: 5,
    text: "No more Google Forms or chasing receipts. Everything just works. The HRIS sync alone saves us hours every week." },
];

const TEAM_SIZE_OPTIONS = ['1–10', '11–50', '51–200', '201–500', '500+'];

/* ─── DemoModal (B2B "Book a demo") ──────────────────────────────────── */

const DemoModal = ({ onClose }) => {
  const [form, setForm] = useState({ contact_name: '', email: '', company_name: '', phone: '', team_size: '', message: '' });
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
      style={{ background: 'rgba(26,16,53,0.65)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[92vh] overflow-y-auto"
        style={{ background: '#fff', border: '1.5px solid #EDE5FF' }} onClick={e => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-50 flex items-center justify-center">
              <Icon name="Party" size={32} className="text-primary-500" />
            </div>
            <h3 className="text-2xl font-bold text-warm-900 mb-2">Request received!</h3>
            <p className="text-warm-500 mb-6">We'll reach out within 12 hours.</p>
            <button onClick={onClose} className="btn-primary px-8">Close</button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="pill mb-2 inline-flex items-center gap-1.5"><Icon name="Calendar" size={13} /> Book a demo</div>
                <h3 className="text-xl font-bold text-warm-900">See Thankeeu for Teams live</h3>
                <p className="text-warm-500 text-sm mt-1">Free · 30 min · Usually within 24 hrs</p>
              </div>
              <button onClick={onClose} className="text-warm-400 hover:text-warm-700 w-9 h-9 flex items-center justify-center rounded-xl hover:bg-warm-100">
                <Icon name="X" size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">Full name *</label>
                  <input className="input" placeholder="Your name" value={form.contact_name} onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">Work email *</label>
                  <input type="email" className="input" placeholder="you@company.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">Company name *</label>
                  <input className="input" placeholder="Acme Corp" value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">Phone number</label>
                  <input className="input" placeholder="+234…" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1.5">Team size</label>
                <div className="flex flex-wrap gap-2">
                  {TEAM_SIZE_OPTIONS.map(s => (
                    <button type="button" key={s} onClick={() => setForm(p => ({ ...p, team_size: s }))}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${form.team_size === s ? 'border-primary-400 bg-primary-50 text-primary-600' : 'border-purple-100 text-warm-600 hover:border-primary-300'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1.5">What would you like to see?</label>
                <textarea className="input resize-none" rows={3} placeholder="Birthday automations, HRIS sync…" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Booking…</span>
                  : <span className="inline-flex items-center justify-center gap-2"><Icon name="Calendar" size={16} /> Book my demo <Icon name="ArrowRight" size={16} /></span>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

/* ─── Photo-album Live Card Preview ─────────────────────────────────── */

const LiveCardPreview = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [signerName, setSignerName] = useState('');
  const [signerMsg, setSignerMsg] = useState('');
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [signed, setSigned] = useState(false);
  const [flipping, setFlipping] = useState(false);

  const handleSign = () => {
    if (!signerName.trim() || !signerMsg.trim()) return;
    const colors = ['#7C3AED', '#0D9488', '#DB2777', '#92400E', '#1D4ED8'];
    const bgs    = ['#EDE9FE', '#CCFBF1', '#FCE7F3', '#FEF3C7', '#DBEAFE'];
    const idx    = messages.length % colors.length;
    setMessages(prev => [...prev, {
      initials: signerName.trim().split(' ').map(w => w[0].toUpperCase()).join('').slice(0, 2),
      name: signerName.trim(),
      color: colors[idx], bg: bgs[idx],
      text: signerMsg.trim(),
    }]);
    setSigned(true);
    setActiveIdx(messages.length); // jump to the new message page
  };

  const goTo = (dir) => {
    if (flipping) return;
    setFlipping(true);
    setTimeout(() => {
      setActiveIdx(i => Math.max(0, Math.min(messages.length - 1, i + dir)));
      setFlipping(false);
    }, 220);
  };

  const msg = messages[activeIdx];

  return (
    <div className="lcp-wrap">
      {/* Card album */}
      <div className="lcp-album-outer">
        {/* Stack shadow pages */}
        <div className="lcp-stack lcp-stack-3" />
        <div className="lcp-stack lcp-stack-2" />

        {/* Main card page */}
        <div className={`lcp-card ${flipping ? 'lcp-flip' : ''}`} style={{ background: msg.bg }}>
          {/* Card header */}
          <div className="lcp-card-header">
            <div className="lcp-avatar" style={{ background: msg.color, color: '#fff' }}>{msg.initials}</div>
            <div>
              <p className="lcp-msg-author">{msg.name}</p>
              <p className="lcp-msg-label">signed this card</p>
            </div>
          </div>

          {/* Message text */}
          <p className="lcp-msg-text">{msg.text}</p>

          {/* Page indicator */}
          <div className="lcp-page-dots">
            {messages.map((_, i) => (
              <button key={i} className={`lcp-dot ${i === activeIdx ? 'lcp-dot-active' : ''}`}
                style={i === activeIdx ? { background: msg.color } : {}}
                onClick={() => setActiveIdx(i)} aria-label={`Page ${i + 1}`} />
            ))}
          </div>

          {/* Nav arrows */}
          <button className="lcp-arrow lcp-arrow-left" onClick={() => goTo(-1)} disabled={activeIdx === 0}>
            <Icon name="ChevronLeft" size={18} />
          </button>
          <button className="lcp-arrow lcp-arrow-right" onClick={() => goTo(1)} disabled={activeIdx === messages.length - 1}>
            <Icon name="ChevronRight" size={18} />
          </button>
        </div>

        {/* Page count badge */}
        <div className="lcp-count-badge">
          <Icon name="FileText" size={12} />
          <span>{activeIdx + 1} / {messages.length}</span>
        </div>
      </div>

      {/* Sign-it panel */}
      {!signed ? (
        <div className="lcp-sign-panel">
          <p className="lcp-sign-label">
            <Icon name="PenLine" size={14} />
            <strong>Sign this demo card</strong> — no account needed
          </p>
          <input
            className="lcp-input"
            placeholder="Your name"
            value={signerName}
            onChange={e => setSignerName(e.target.value)}
            maxLength={60}
          />
          <textarea
            className="lcp-textarea"
            placeholder="Write your message here…"
            rows={3}
            value={signerMsg}
            onChange={e => setSignerMsg(e.target.value)}
            maxLength={500}
          />
          <button className="lcp-sign-btn" onClick={handleSign}
            disabled={!signerName.trim() || !signerMsg.trim()}>
            <Icon name="Heart" size={15} />
            Add my message
          </button>
          <p className="lcp-sign-hint">On the real card you can also add photos, GIFs, voice notes & chip in to the gift pot.</p>
        </div>
      ) : (
        <div className="lcp-signed-confirm">
          <div className="lcp-signed-icon">🎉</div>
          <p className="lcp-signed-title">You signed it!</p>
          <p className="lcp-signed-sub">Your message is now on page {activeIdx + 1}. Ready to create your own card?</p>
          <Link to="/create-card" className="btn-primary w-full text-center py-3 mt-1 inline-flex items-center justify-center gap-2">
            <Icon name="Sparkles" size={15} /> Create a card — it's free
          </Link>
        </div>
      )}
    </div>
  );
};

/* ─── Main Home component ────────────────────────────────────────────── */

const Home = () => {
  useSEO({
    title: 'Thankeeu — Online Group Cards & Gifts for Every Occasion',
    description: "Nigeria's favourite group card and gift platform. Create, collect messages, pool gifts — birthdays, farewells, promotions and more.",
    canonical: '/',
    jsonLd: [SCHEMAS.organization, SCHEMAS.website, SCHEMAS.softwareApp],
  });

  const [showDemo, setShowDemo] = useState(false);
  const [homeCurrency, setHomeCurrency] = useState('NGN');

  return (
    <div className="home-root">
      <Navbar onBookDemo={() => setShowDemo(true)} />

      {/* ══════════ HERO ══════════════════════════════════════════════ */}
      <section className="home-hero">
        {/* dot grid */}
        <div className="home-hero-dots" />
        <div className="home-hero-glow" />

        <div className="home-hero-inner">
          {/* Left: copy + CTAs */}
          <div className="home-hero-copy">
            <div className="pill mb-5 inline-flex items-center gap-2">
              <Icon name="Sparkles" size={14} /> The Nigerian group card & gift platform
            </div>

            <h1 className="home-h1">
              One link.<br />
              Everyone signs.<br />
              <span className="home-h1-gradient">Gift collected.</span>
            </h1>

            <p className="home-hero-sub">
              Create a beautiful group card for any occasion, invite friends or colleagues
              to sign, pool a gift — and deliver it all on the perfect day.
              Takes 2 minutes. Pay only when you send.
            </p>

            <div className="home-hero-ctas">
              <Link to="/create-card" className="btn-primary home-cta-primary">
                <Icon name="Sparkles" size={18} />
                Create a card — it's free
              </Link>
              <Link to="/sample" className="btn-secondary home-cta-secondary">
                <Icon name="Eye" size={18} />
                See a sample card
              </Link>
            </div>

            <div className="home-trust-row">
              <span className="home-trust-item"><Icon name="Lock" size={14} /> Secure payments</span>
              <span className="home-trust-sep">·</span>
              <span className="home-trust-item"><Icon name="Globe" size={14} /> Works worldwide</span>
              <span className="home-trust-sep">·</span>
              <span className="home-trust-item"><Icon name="Zap" size={14} /> From <RotatingPrice amountNGN={5000} /></span>
            </div>
          </div>

          {/* Right: live demo */}
          <div className="home-hero-demo">
            <LiveCardPreview />
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════════════════════════════════ */}
      <section className="home-section home-section-alt">
        <div className="home-container">
          <div className="home-section-label">
            <div className="pill inline-flex items-center gap-1.5"><Icon name="Zap" size={13} /> Beautifully simple</div>
          </div>
          <h2 className="home-h2 text-center mb-12">From zero to delivered<br /><span className="text-primary-500">in under 3 minutes</span></h2>

          <div className="home-steps-grid">
            {[
              { num: '1', icon: 'Wand',  title: 'Pick a design',      desc: 'Choose from 14 occasions and dozens of card styles. Set your recipient name and delivery date.' },
              { num: '2', icon: 'Share', title: 'Share the link',      desc: 'Copy one WhatsApp or email link. Anyone can sign — no account needed. Your card fills up on its own.' },
              { num: '3', icon: 'Gift',  title: 'Pool a gift',         desc: 'Signers chip in from ₦500 via Flutterwave. No cash chasing. Money collected automatically.' },
              { num: '4', icon: 'Send',  title: 'Deliver the surprise',desc: 'Card and gift land in their inbox on the exact day — with photos, videos, voice notes and all the love.' },
            ].map(s => (
              <div key={s.num} className="home-step-card">
                <div className="home-step-num">{s.num}</div>
                <div className="home-step-icon-wrap"><Icon name={s.icon} size={22} className="text-primary-500" /></div>
                <h3 className="home-step-title">{s.title}</h3>
                <p className="home-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ TWO SIGNING METHODS ═══════════════════════════════ */}
      <section className="home-section">
        <div className="home-container">
          <div className="home-section-label">
            <div className="pill inline-flex items-center gap-1.5"><Icon name="Layers" size={13} /> Two ways to sign</div>
          </div>
          <h2 className="home-h2 text-center mb-4">Choose how you want the card to look</h2>
          <p className="home-sub-p text-center mb-12">Both methods are available on every Thankeeu card — the signer picks what feels right for them.</p>

          <div className="home-methods-grid">
            {/* Method 1 — Photo Album */}
            <div className="home-method-card home-method-album">
              <div className="home-method-badge home-method-badge-purple">Method 1</div>
              <div className="home-method-album-mock">
                {/* stacked album pages */}
                <div className="hm-album-stack hm-stack-3" />
                <div className="hm-album-stack hm-stack-2" />
                <div className="hm-album-page">
                  <div className="hm-album-avatar" style={{ background: '#7C3AED', color: '#fff' }}>AO</div>
                  <p className="hm-album-name">Adaeze O.</p>
                  <p className="hm-album-msg">"Happy birthday!! You're the reason our whole team smiles every day 🎉"</p>
                  <div className="hm-album-dots">
                    {[0, 1, 2].map(i => <span key={i} className={`hm-dot ${i === 0 ? 'hm-dot-on' : ''}`} />)}
                  </div>
                </div>
              </div>
              <h3 className="home-method-title">Photo Album / Card Pages</h3>
              <p className="home-method-desc">
                Each signer gets their own page in a flippable card album. Messages, photos, GIFs,
                voice notes — one page per person. The recipient flips through like a physical card.
                Clean, intimate, classic.
              </p>
              <ul className="home-method-list">
                {['One page per signer', 'Flip through like a real card', 'Add photos, GIFs, voice notes', 'Choose a message font & colour'].map(f => (
                  <li key={f}><Icon name="Check" size={14} className="text-primary-500 flex-shrink-0 mt-0.5" />{f}</li>
                ))}
              </ul>
            </div>

            {/* Method 2 — Signature Board */}
            <div className="home-method-card home-method-board">
              <div className="home-method-badge home-method-badge-rose">Method 2</div>
              <div className="home-method-board-mock">
                {[
                  { av: 'EK', color: '#0D9488', bg: '#CCFBF1', msg: 'Wishing you all the joy! 🙌', x: '8%',  y: '12%', rot: '-3deg' },
                  { av: 'KI', color: '#DB2777', bg: '#FCE7F3', msg: 'Keep shining bright ✨',      x: '48%', y: '8%',  rot: '2deg' },
                  { av: 'BD', color: '#92400E', bg: '#FEF3C7', msg: 'So lucky to have you 💛',    x: '18%', y: '50%', rot: '-2deg' },
                  { av: 'TN', color: '#1D4ED8', bg: '#DBEAFE', msg: 'Happy birthday legend! 🎂',   x: '55%', y: '44%', rot: '3deg' },
                ].map(n => (
                  <div key={n.av} className="hm-note" style={{
                    background: n.bg, left: n.x, top: n.y,
                    transform: `rotate(${n.rot})`,
                  }}>
                    <div className="hm-note-av" style={{ background: n.color, color: '#fff' }}>{n.av}</div>
                    <p className="hm-note-text">{n.msg}</p>
                  </div>
                ))}
              </div>
              <h3 className="home-method-title">Signature Board (Wall of Notes)</h3>
              <p className="home-method-desc">
                All messages appear together on one beautiful board — like sticky notes on a wall.
                Perfect for large groups where you want everyone visible at once. The recipient sees
                the full wall of love in a single view.
              </p>
              <ul className="home-method-list">
                {['All messages on one board', 'Perfect for large teams (50+ signers)', 'Colourful, vibrant, shareable', 'Download as an image or PDF'].map(f => (
                  <li key={f}><Icon name="Check" size={14} className="text-rose-500 flex-shrink-0 mt-0.5" />{f}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ OCCASIONS ═════════════════════════════════════════ */}
      <section className="home-section home-section-alt">
        <div className="home-container">
          <div className="home-section-label">
            <div className="pill inline-flex items-center gap-1.5"><Icon name="Party" size={13} /> 14 occasions</div>
          </div>
          <h2 className="home-h2 text-center mb-10">Whatever the moment,<br /><span className="text-primary-500">there's a card for it</span></h2>
          <div className="occasion-grid">
            {OCCASIONS.map(({ icon, label, path }) => (
              <Link key={label} to={path}
                className="home-occasion-pill">
                <Icon name={icon} size={28} className="text-primary-500" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/create-card" className="btn-secondary px-8 py-3 inline-flex items-center gap-2">
              <Icon name="Sparkles" size={16} /> Start creating — it's free
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════ TESTIMONIALS ══════════════════════════════════════ */}
      <section className="home-section">
        <div className="home-container">
          <div className="home-section-label">
            <div className="pill inline-flex items-center gap-1.5"><Icon name="Star" size={13} /> Real stories</div>
          </div>
          <h2 className="home-h2 text-center mb-10">People who actually<br /><span className="text-primary-500">made someone's day</span></h2>
          <div className="home-testimonials-grid">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="home-testimonial-card">
                <div className="home-testimonial-stars">
                  {Array(t.stars).fill(0).map((_, i) => <Icon key={i} name="Star" size={16} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="home-testimonial-text">"{t.text}"</p>
                <div className="home-testimonial-author">
                  <div className="home-testimonial-av">{t.name.split(' ').map(n => n[0]).join('')}</div>
                  <div>
                    <p className="home-testimonial-name">{t.name}</p>
                    <p className="home-testimonial-role">{t.role} · {t.loc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FOR TEAMS ═════════════════════════════════════════ */}
      <section className="home-section home-section-alt">
        <div className="home-container">
          <div className="home-teams-inner">
            <div className="home-teams-copy">
              <div className="pill mb-5 inline-flex items-center gap-1.5"><Icon name="Building" size={13} /> For HR & People teams</div>
              <h2 className="home-h2 mb-4">Automate every celebration.<br /><span className="text-primary-500">Zero manual effort.</span></h2>
              <p className="home-sub-p mb-8">
                Connect your HRIS once. Thankeeu creates cards, notifies departments, pools gifts,
                and delivers — on the exact right day. Every time.
              </p>
              <ul className="home-teams-features">
                {[
                  { icon: 'Link',       text: 'HRIS sync: SeamlessHR, BambooHR, Zoho, WorkPay' },
                  { icon: 'Party',      text: '12 occasions automated — zero manual effort' },
                  { icon: 'Mail',       text: 'Whole-dept notifications, no one left out' },
                  { icon: 'BarChart',   text: 'HR analytics dashboard & spend visibility' },
                  { icon: 'Shield',     text: 'Approval workflows & full admin control' },
                ].map(f => (
                  <li key={f.text}>
                    <span className="home-teams-icon-wrap"><Icon name={f.icon} size={17} className="text-primary-500" /></span>
                    {f.text}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link to="/company/signup" className="btn-primary px-7 py-3.5 inline-flex items-center gap-2">
                  <Icon name="Building" size={16} /> Start for your team
                </Link>
                <button onClick={() => setShowDemo(true)} className="btn-secondary px-7 py-3.5 inline-flex items-center gap-2">
                  <Icon name="Calendar" size={16} /> Book a 30-min demo
                </button>
              </div>
            </div>
            <div className="home-teams-card-wrap">
              {/* B2B mini dashboard mock */}
              <div className="home-teams-mock">
                <div className="htm-header">
                  <Icon name="BarChart" size={16} className="text-primary-500" />
                  <span>HR Dashboard · June 2025</span>
                </div>
                {[
                  { name: 'Tolu Adeyemi', occasion: 'Birthday', dept: 'Engineering', due: 'Today', raised: '₦45,000', signers: 18 },
                  { name: 'Amara Osei',   occasion: 'Farewell',  dept: 'Marketing',   due: 'Fri',   raised: '₦92,000', signers: 31 },
                  { name: 'Chibike Eze',  occasion: 'Promotion', dept: 'Finance',     due: 'Mon',   raised: '₦28,000', signers: 12 },
                ].map(r => (
                  <div key={r.name} className="htm-row">
                    <div className="htm-av">{r.name.split(' ').map(n => n[0]).join('')}</div>
                    <div className="htm-info">
                      <p className="htm-name">{r.name}</p>
                      <p className="htm-meta">{r.occasion} · {r.dept}</p>
                    </div>
                    <div className="htm-right">
                      <span className="htm-badge">{r.due}</span>
                      <p className="htm-raised">{r.raised}</p>
                      <p className="htm-signers">{r.signers} signed</p>
                    </div>
                  </div>
                ))}
                <div className="htm-footer">
                  <Icon name="Check" size={12} className="text-green-600" /> All cards auto-created · 0 manual steps
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ PRICING ═══════════════════════════════════════════ */}
      <section className="home-section">
        <div className="home-container">
          <div className="home-section-label">
            <div className="pill inline-flex items-center gap-1.5"><Icon name="Card" size={13} /> Simple pricing</div>
          </div>
          <h2 className="home-h2 text-center mb-3">Pay only when you send</h2>
          <p className="home-sub-p text-center mb-4">Create your card and collect messages for free. Only pay when you're ready to deliver.</p>
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-warm-400 uppercase tracking-wide mb-2">See prices in your currency</p>
            <CurrencyToggle selected={homeCurrency} onChange={setHomeCurrency} />
          </div>

          <div className="home-pricing-grid">
            {/* Individual */}
            <div className="home-pricing-card home-pricing-indiv">
              <div className="home-pricing-icon"><Icon name="Heart" size={24} className="text-primary-500" /></div>
              <h3 className="home-pricing-name">For individuals</h3>
              <div className="home-pricing-amount">
                <span className="home-pricing-price">{formatCurrency(5000, homeCurrency)}</span>
                <span className="home-pricing-period">one-time</span>
              </div>
              {homeCurrency !== 'NGN' && <p className="home-pricing-note">≈ ₦5,000 · charged at live rate</p>}
              <p className="home-pricing-desc">Create a card for anyone — friend, colleague, family. No account needed to sign.</p>
              <ul className="home-pricing-list">
                {['Create a card in 2 minutes', 'Unlimited signers', 'Global gift pot (Flutterwave)', 'Photo, video & voice notes', 'Scheduled delivery'].map(f => (
                  <li key={f}><Icon name="Check" size={14} className="text-primary-500" />{f}</li>
                ))}
              </ul>
              <Link to="/create-card" className="btn-primary w-full py-3.5 text-center inline-flex items-center justify-center gap-2">
                <Icon name="Sparkles" size={15} /> Get started — it's free
              </Link>
            </div>

            {/* Company */}
            <div className="home-pricing-card home-pricing-company">
              <div className="home-pricing-icon home-pricing-icon-dark"><Icon name="Building" size={24} className="text-purple-200" /></div>
              <h3 className="home-pricing-name home-pricing-name-dark">For companies</h3>
              <div className="home-pricing-amount">
                <span className="home-pricing-price home-pricing-price-dark">Get a quote</span>
              </div>
              <p className="home-pricing-note home-pricing-note-dark">Price based on your team size</p>
              <p className="home-pricing-desc home-pricing-desc-dark">Automate all team celebrations. Connect your HRIS. Never forget a birthday again.</p>
              <ul className="home-pricing-list home-pricing-list-dark">
                {['Unlimited employees', 'HRIS integration', '12 automated occasions', 'HR analytics dashboard', 'Approval workflows'].map(f => (
                  <li key={f}><Icon name="Check" size={14} className="text-purple-400" />{f}</li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setShowDemo(true)} className="btn-primary px-6 py-3 text-sm flex-1 inline-flex items-center justify-center gap-2">
                  Get a quote →
                </button>
                <Link to="/company/signup" className="px-6 py-3 text-sm font-bold rounded-2xl border-2 border-purple-500 text-purple-200 hover:bg-purple-800/50 transition-colors inline-flex items-center justify-center">
                  Create account
                </Link>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-warm-400 mt-6 flex items-center justify-center gap-1.5">
            <Icon name="Globe" size={13} /> Works in Nigeria, UK, US, Canada, Ghana, Kenya, South Africa and beyond
          </p>
        </div>
      </section>

      {/* ══════════ BOTTOM CTA ════════════════════════════════════════ */}
      <section className="home-section home-cta-final">
        <div className="home-container text-center">
          <div className="home-cta-icons">
            {['Cake', 'Gift', 'Party', 'Heart', 'Sparkles'].map((name, i) => (
              <span key={i} className="home-cta-icon-bubble animate-float" style={{ animationDelay: `${i * 0.15}s` }}>
                <Icon name={name} size={24} className="text-primary-500" />
              </span>
            ))}
          </div>
          <h2 className="home-h2 mb-4">
            Make someone feel<br />
            <span className="home-h1-gradient">genuinely loved</span>
          </h2>
          <p className="home-sub-p mb-8">
            From <RotatingPrice amountNGN={5000} /> per card · Pay only when you send · Works worldwide
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/create-card" className="btn-primary home-cta-primary inline-flex items-center justify-center gap-2">
              <Icon name="Sparkles" size={18} /> Create a card — it's free
            </Link>
            <Link to="/sample" className="btn-secondary home-cta-secondary inline-flex items-center justify-center gap-2">
              <Icon name="Eye" size={18} /> See a sample card
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}
    </div>
  );
};

export default Home;
