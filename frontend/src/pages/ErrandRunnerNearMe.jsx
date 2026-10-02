import { Link } from 'react-router-dom';
import SEO, { makeFAQSchema } from '../components/seo/SEO';
import { MapPin, Zap, ShieldCheck, Search } from 'lucide-react';

const CITIES = [
  { label: 'Lagos', href: '/errands/lagos' },
  { label: 'Abuja', href: '/errands/abuja' },
  { label: 'Port Harcourt', href: '/errands/port-harcourt' },
  { label: 'Ibadan', href: '/errands/ibadan' },
  { label: 'Kano', href: '/errands/kano' },
  { label: 'Benin City', href: '/errands/benin-city' },
  { label: 'Enugu', href: '/errands/enugu' },
  { label: 'Warri', href: '/errands/warri' },
  { label: 'Owerri', href: '/errands/owerri' },
  { label: 'Calabar', href: '/errands/calabar' },
  { label: 'Uyo', href: '/errands/uyo' },
  { label: 'Ilorin', href: '/errands/ilorin' },
  { label: 'Abeokuta', href: '/errands/abeokuta' },
  { label: 'Onitsha', href: '/errands/onitsha' },
  { label: 'Jos', href: '/errands/jos' },
];

const faqs = [
  {
    q: 'How do I find an errand runner near me in Nigeria?',
    a: 'Post your task on Taskeeu with your exact city and area. Taskeeu automatically notifies verified Taskers whose registered task location matches yours, and they bid on your task within minutes, so "near me" is handled by matching, not by searching a directory yourself.',
  },
  {
    q: 'Is there an errand runner near me right now?',
    a: 'Taskeeu has active, identity-verified Taskers in Lagos, Abuja, Port Harcourt, Ibadan, Kano, Benin City, Enugu, Warri, Owerri, Calabar, Uyo, Ilorin, Abeokuta, Onitsha, Jos, and 20+ other Nigerian cities. Post your task with your location and see who\u2019s available to bid.',
  },
  {
    q: 'How much does it cost to hire an errand runner near me?',
    a: 'You set the budget when you post the task, and Taskers bid at or below it. Simple local errands (market runs, deliveries) typically cost \u20a61,500\u2013\u20a63,500. Government queuing or longer tasks range \u20a62,500\u2013\u20a67,000+ depending on complexity and waiting time.',
  },
  {
    q: 'How fast can a nearby errand runner start my task?',
    a: 'Most tasks receive their first bid within 30 minutes of posting. Once you accept a bid, the Tasker, who is already in or near your city, can typically start the same day.',
  },
  {
    q: 'Are errand runners near me background-checked?',
    a: 'Yes. Every Tasker on Taskeeu completes identity verification with NIN or BVN before they can accept a single task. You can see their verification badge, rating, and completed-job history before choosing who to hire.',
  },
];

export default function ErrandRunnerNearMe() {
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SEO
        title="Errand Runner Near Me | Find a Verified Errand Runner in Your City"
        description="Looking for an errand runner near you in Nigeria? Taskeeu matches you with identity-verified, escrow-protected Taskers in your exact city: Lagos, Abuja, Port Harcourt, and 25+ more. Post a task and get bids in minutes."
        canonical="https://taskeeu.com/errand-runner-near-me"
        keywords="errand runner near me, errand service near me, hire errand runner near me, errand boy near me, find errand runner Nigeria, local errand service Nigeria, errand runner in my area, personal assistant near me Nigeria"
        structuredData={makeFAQSchema(faqs)}
        breadcrumbs={[
          { name: 'Home', url: 'https://taskeeu.com' },
          { name: 'Errand Runner Near Me', url: 'https://taskeeu.com/errand-runner-near-me' },
        ]}
      />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(160deg, #12091a 0%, #1a0d2e 60%, #12091a 100%)', padding: '90px 20px 70px' }}>
        <div className="container-xl" style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#ff6b8f', fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
            <MapPin size={14} /> Location-Matched Taskers, Nationwide
          </span>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, color: 'white', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 20 }}>
            Find a Verified Errand Runner Near You
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 32 }}>
            You don't need to search a directory. Post what you need and where, and Taskeeu instantly matches you with identity-verified Taskers already active in your exact city and area.
          </p>
          <Link to="/post-task" className="btn-primary" style={{ padding: '14px 32px', fontSize: 15, borderRadius: 12 }}>
            Post Your Task Free →
          </Link>
        </div>
      </section>

      {/* How matching works */}
      <section style={{ padding: '70px 20px' }}>
        <div className="container-xl" style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 26, fontWeight: 900, color: 'var(--text)', marginBottom: 36, letterSpacing: '-0.02em' }}>
            How "Near Me" Actually Works on Taskeeu
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {[
              { icon: Search, title: 'You Post With Your City & Area', desc: 'Describe your errand and set your exact task city, whether Lagos, Abuja, Onitsha, wherever you are.' },
              { icon: Zap, title: 'Nearby Taskers Get Notified', desc: 'Verified Taskers whose registered location matches yours are notified instantly and can bid within minutes.' },
              { icon: ShieldCheck, title: 'You Pick, Escrow Protects You', desc: 'Compare bids, ratings, and history. Your payment sits in escrow until you confirm the job is done right.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="card" style={{ padding: 24, textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--rose-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <Icon size={22} style={{ color: 'var(--rose)' }} />
                </div>
                <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>{title}</p>
                <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* City directory */}
      <section style={{ padding: '70px 20px', background: 'var(--surface)' }}>
        <div className="container-xl" style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 26, fontWeight: 900, color: 'var(--text)', marginBottom: 12, letterSpacing: '-0.02em' }}>
            Find Your City
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 36, fontSize: 15 }}>
            Active, verified Taskers in these cities and more. Post your task with any Nigerian city and area.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {CITIES.map(c => (
              <Link
                key={c.href}
                to={c.href}
                className="card"
                style={{ padding: '16px 18px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, transition: 'transform 0.15s' }}
              >
                <MapPin size={16} style={{ color: 'var(--rose)', flexShrink: 0 }} />
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{c.label}</span>
              </Link>
            ))}
          </div>
          <p style={{ textAlign: 'center', color: 'var(--muted)', marginTop: 24, fontSize: 13.5 }}>
            Don't see your city? <Link to="/post-task" style={{ color: 'var(--rose)', fontWeight: 700 }}>Post your task anyway</Link>. Taskeeu is expanding to new areas every week.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '70px 20px' }}>
        <div className="container-xl" style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 26, fontWeight: 900, color: 'var(--text)', marginBottom: 36, letterSpacing: '-0.02em' }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {faqs.map((f, i) => (
              <div key={i} className="card" style={{ padding: 22 }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 8 }}>{f.q}</p>
                <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
