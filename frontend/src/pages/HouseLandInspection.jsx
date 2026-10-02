import { Link } from 'react-router-dom';
import { MapPin, Camera, ShieldCheck, FileCheck, Users, Navigation, ClipboardCheck, Home, ArrowRight } from 'lucide-react';
import SEO, { makeFAQSchema } from '../components/seo/SEO';

const faqs = [
  {
    q: 'How do I buy land in Nigeria without getting scammed?',
    a: 'Never pay for land you have not physically verified. The most common scams involve land sold by people with no right to sell it (often called Omo Onile), the same plot sold to multiple buyers, or land that looks nothing like the photos. A physical inspection is your first line of defence: send a verified tasker to the actual location to photograph the plot, its boundaries, survey beacons, and surroundings, and report what is really happening on the ground. Pair that on-the-ground check with a lawyer or surveyor for title and registry searches before any money moves.',
  },
  {
    q: 'Can I verify a property in Nigeria if I live abroad?',
    a: 'Yes, this is one of the most common reasons people use Taskeeu. Diaspora buyers are the most targeted by property scams because of distance. Instead of flying home or trusting a relative or agent, you post an inspection task, a verified tasker in that exact area visits the property, and you receive GPS-tagged photos and video proof before you commit any funds. Your payment stays in escrow until you are satisfied.',
  },
  {
    q: 'What is a house or land inspection service?',
    a: 'Instead of travelling long distances yourself, you post an inspection task on Taskeeu and a verified tasker who is already in that area visits the property on your behalf. They document everything with photos, video, and GPS-tagged evidence, then send it to you, so you can make decisions about a property without being physically present.',
  },
  {
    q: 'How do I know the tasker actually visited the property?',
    a: 'Taskers submit GPS-tagged photos and video from the location, plus timestamps. You see exactly where and when the inspection happened. For land, they can capture boundary markers, survey beacons, and the surrounding area; for houses, room-by-room condition, fittings, and any issues you asked them to check.',
  },
  {
    q: 'Is my money safe if the inspection is not done properly?',
    a: 'Yes. Your payment is held in escrow and only released to the tasker after you confirm the inspection was completed to your satisfaction. If the evidence is incomplete or the job was not done as agreed, the funds stay protected while it is resolved.',
  },
  {
    q: 'Can taskers verify land boundaries and check for disputes?',
    a: 'A tasker can photograph boundary beacons, survey pillars, and the physical state of the land, and report what they observe on the ground, including visible signs of encroachment or ongoing use. For legal title verification you would still use a surveyor or lawyer, but an on-the-ground inspection tells you whether what you are being sold matches reality.',
  },
  {
    q: 'How much does a property inspection cost?',
    a: 'You set your budget when you post the task, and taskers in that area bid on it. Costs vary by location, distance, and how detailed the inspection needs to be. Because you are hiring someone already nearby rather than paying for a long trip, it is usually far cheaper than inspecting it yourself.',
  },
  {
    q: 'Who can request an inspection?',
    a: 'Anyone: diaspora Nigerians checking property back home, buyers verifying a listing before paying, landlords checking on a property remotely, or businesses assessing a site. You post the task, review bids from verified local taskers, and choose who to hire.',
  },
];

const STEPS = [
  { icon: ClipboardCheck, title: 'Post your inspection task', desc: 'Describe the property, its location, and exactly what you want checked: condition, boundaries, specific rooms, documents on site, or anything else. Set your budget.' },
  { icon: Users, title: 'Local taskers bid', desc: 'Verified taskers already in that area see your task and bid. You review their profiles, ratings, and completed inspections, then choose the one you trust.' },
  { icon: Navigation, title: 'They inspect on the ground', desc: 'Your chosen tasker visits the property and documents it thoroughly with GPS-tagged photos, video, and notes covering everything you asked for.' },
  { icon: FileCheck, title: 'You review and release payment', desc: 'You receive the full evidence pack and confirm it meets your needs. Only then is the escrow-held payment released to the tasker.' },
];

const BENEFITS = [
  { icon: MapPin, title: 'No long trips', desc: 'Do not spend a day and a tank of fuel travelling to a property. Someone already in the area handles it, often the same day.' },
  { icon: Camera, title: 'Real photo and video evidence', desc: 'Every inspection comes with visual proof, not just a phone call telling you it looks fine. See the property for yourself.' },
  { icon: Navigation, title: 'GPS-tagged and timestamped', desc: 'Location and time metadata confirm the tasker was physically at the right place at the right time.' },
  { icon: ShieldCheck, title: 'Escrow-protected', desc: 'Your money is only released once you are satisfied. No upfront risk to a stranger you have never met.' },
];

export default function HouseLandInspection() {
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SEO
        title="House & Land Inspection & Property Verification in Nigeria | Send a Verified Local to Check It"
        description="Verify land or a house before you pay, without travelling. Post the task on Taskeeu and a verified tasker already in that area physically inspects it, checking boundaries and condition with GPS-tagged photos and video. Escrow-protected. Ideal for diaspora buyers avoiding Omo Onile and land scams."
        canonical="https://taskeeu.com/house-land-inspection"
        keywords="property verification Nigeria, land inspection Nigeria, house inspection service Nigeria, verify land before buying Nigeria, how to buy land in Nigeria without getting scammed, land verification Lagos, property verification Lagos Abuja, check land boundary survey plan Nigeria, Omo Onile land inspection, diaspora property check Nigeria, verify property in Nigeria from abroad, remote property inspection Nigeria, inspect house before renting Nigeria, land encroachment check, physical land inspection service"
        structuredData={makeFAQSchema(faqs)}
        breadcrumbs={[
          { name: 'Home', url: 'https://taskeeu.com' },
          { name: 'House & Land Inspection', url: 'https://taskeeu.com/house-land-inspection' },
        ]}
      />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(160deg, #12091a 0%, #1e0d33 55%, #12091a 100%)', padding: '96px 20px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -60, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,45,98,0.18), transparent 70%)' }} />
        <div className="container-xl" style={{ maxWidth: 840, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <p style={{ color: '#ff6b8f', fontWeight: 700, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 18 }}>House &amp; Land Inspection</p>
          <h1 style={{ fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 900, color: 'white', lineHeight: 1.12, letterSpacing: '-0.03em', marginBottom: 22 }}>
            Inspect any property without being there yourself
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 36, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
            You do not have to travel across the country to check a house or verify land. Outsource it to a verified tasker already in that area. They inspect it and send you GPS-tagged photos, video, and a full report. Your payment stays in escrow until you are satisfied.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/post-task" className="btn-primary" style={{ padding: '15px 34px', fontSize: 16, borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Post an inspection task <ArrowRight size={18} />
            </Link>
            <Link to="/taskers" style={{ padding: '15px 34px', fontSize: 16, borderRadius: 12, background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.15)' }}>
              Browse verified taskers
            </Link>
          </div>
        </div>
      </section>

      {/* The problem / explanation */}
      <section style={{ padding: '72px 20px', background: 'var(--surface)' }}>
        <div className="container-xl" style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', marginBottom: 18, letterSpacing: '-0.02em' }}>
            Stop travelling to inspect property yourself
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.8, fontSize: 16 }}>
            Whether you live abroad, in another state, or are just too busy, physically inspecting a house or piece of land is expensive and time-consuming. People are also sold properties that look nothing like the photos, or land that is under dispute, and they only find out after paying.
          </p>
          <p style={{ color: 'var(--muted)', lineHeight: 1.8, fontSize: 16, marginTop: 16 }}>
            Taskeeu lets you outsource the inspection to a trusted person already on the ground. They go, they document, and they send you real evidence, so you can decide with your own eyes, from anywhere.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '72px 20px' }}>
        <div className="container-xl" style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 30, fontWeight: 900, color: 'var(--text)', marginBottom: 12, letterSpacing: '-0.02em' }}>How it works</h2>
          <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 44, fontSize: 16 }}>From posting to proof, in four steps.</p>
          <div style={{ display: 'grid', gap: 20 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 20, background: 'white', borderRadius: 18, padding: '24px 26px', boxShadow: '0 4px 20px rgba(18,9,26,0.05)', alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0, width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #ff2d62, #ff6b8f)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', position: 'relative' }}>
                  <s.icon size={22} />
                  <span style={{ position: 'absolute', top: -8, left: -8, width: 24, height: 24, borderRadius: '50%', background: '#12091a', color: 'white', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                </div>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: 17, color: 'var(--text)', marginBottom: 5 }}>{s.title}</h3>
                  <p style={{ color: 'var(--muted)', lineHeight: 1.65, fontSize: 14.5 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section style={{ padding: '72px 20px', background: 'var(--surface)' }}>
        <div className="container-xl" style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 30, fontWeight: 900, color: 'var(--text)', marginBottom: 44, letterSpacing: '-0.02em' }}>Why inspect through Taskeeu</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 22 }}>
            {BENEFITS.map((b, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 18, padding: 26, boxShadow: '0 4px 20px rgba(18,9,26,0.05)' }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: '#fff0f4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <b.icon size={22} style={{ color: 'var(--rose)' }} />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 6 }}>{b.title}</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.65, fontSize: 14 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '72px 20px' }}>
        <div className="container-xl" style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 30, fontWeight: 900, color: 'var(--text)', marginBottom: 40, letterSpacing: '-0.02em' }}>Frequently asked questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {faqs.map((f, i) => (
              <div key={i} className="card" style={{ padding: 22 }}>
                <p style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--text)', marginBottom: 8 }}>{f.q}</p>
                <p style={{ fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.7 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div className="container-xl" style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: 'linear-gradient(135deg, #ff2d62, #ff6b8f)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Home size={28} style={{ color: 'white' }} />
          </div>
          <h2 style={{ fontSize: 30, fontWeight: 900, color: 'var(--text)', marginBottom: 14, letterSpacing: '-0.02em' }}>See the property before you commit</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 30, fontSize: 16, lineHeight: 1.6 }}>
            Post your inspection task now and get bids from verified taskers in that area. Escrow-protected, evidence-backed, and far cheaper than going yourself.
          </p>
          <Link to="/post-task" className="btn-primary" style={{ padding: '15px 36px', fontSize: 16, borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Post an inspection task <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
