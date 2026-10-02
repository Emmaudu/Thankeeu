import { Link } from 'react-router-dom';
import SEO, { makeFAQSchema } from '../components/seo/SEO';
import { CheckCircle, X, ShieldCheck, Clock, MessageSquare, AlertTriangle } from 'lucide-react';

const faqs = [
  {
    q: 'Is Jiji safe for hiring an errand runner or service provider?',
    a: 'Jiji is a general classifieds site. Anyone can post a "services" listing with no identity verification, no background check, and no built-in payment protection. You are dealing directly with a stranger off-platform, usually via WhatsApp or a phone call, with no recourse if something goes wrong. Taskeeu verifies every Tasker\u2019s identity (NIN or BVN) before they can accept a task, and holds your payment in escrow until you confirm the job was done.',
  },
  {
    q: 'What is a good alternative to Jiji for errands and services?',
    a: 'Taskeeu is a purpose-built errand and task marketplace, not a general classifieds board. Instead of scrolling ads and messaging strangers, you post exactly what you need, get competitive bids from identity-verified Taskers near you, and your money stays in escrow until you approve the finished work.',
  },
  {
    q: 'Does Jiji offer escrow or payment protection?',
    a: 'No. Jiji is a listings platform. Any payment arrangement happens directly between you and the seller or service provider, off-platform, with no escrow or dispute resolution built in. Taskeeu holds every payment in escrow and only releases it to the Tasker after you confirm the task was completed to your satisfaction.',
  },
  {
    q: 'Can I track an errand runner\u2019s progress on Jiji?',
    a: 'No. Once you agree a price with a Jiji seller, there is no shared tracking, chat history, or proof-of-work system on the platform itself. Taskeeu gives you real-time task status, in-app chat, and photo/video proof from your Tasker at every stage.',
  },
  {
    q: 'Why do people still use Jiji for errands despite the risk?',
    a: 'Jiji has massive traffic and brand recognition in Nigeria, so it\u2019s often the first result people find. But high traffic does not mean the transaction is safe. Jiji itself does not vet service listings the way a dedicated task marketplace like Taskeeu verifies every Tasker before they can bid.',
  },
];

export default function TaskeeuVsJiji() {
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SEO
        title="Taskeeu vs Jiji | The Safer Way to Hire an Errand Runner in Nigeria"
        description="Thinking of using Jiji to find an errand runner or service provider? See how Taskeeu compares: identity-verified Taskers, escrow-protected payments, and real-time tracking that Jiji's classifieds listings don't offer."
        canonical="https://taskeeu.com/vs/jiji"
        keywords="taskeeu vs jiji, jiji alternative for errands, jiji alternative Nigeria, is jiji safe for services, safer alternative to jiji, jiji errand service, jiji scam services, sites like jiji for errands, verified errand runner instead of jiji"
        structuredData={makeFAQSchema(faqs)}
        breadcrumbs={[
          { name: 'Home', url: 'https://taskeeu.com' },
          { name: 'Taskeeu vs Jiji', url: 'https://taskeeu.com/vs/jiji' },
        ]}
      />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(160deg, #12091a 0%, #1a0d2e 60%, #12091a 100%)', padding: '90px 20px 70px' }}>
        <div className="container-xl" style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
          <span style={{ display: 'inline-block', color: '#ff6b8f', fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
            Taskeeu vs Jiji
          </span>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, color: 'white', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 20 }}>
            Looking for an Errand Runner on Jiji? Here's a Safer Way.
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 32 }}>
            Jiji is a great place to buy a used phone. It was never built to vet who's on the other end of an errand or service listing. Taskeeu is a dedicated task marketplace. Every Tasker is identity-verified, every payment is escrow-protected, and every job is tracked in real time.
          </p>
          <Link to="/post-task" className="btn-primary" style={{ padding: '14px 32px', fontSize: 15, borderRadius: 12 }}>
            Post Your First Task Free →
          </Link>
        </div>
      </section>

      {/* Comparison table */}
      <section style={{ padding: '70px 20px', background: 'var(--surface)' }}>
        <div className="container-xl" style={{ maxWidth: 820, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 26, fontWeight: 900, color: 'var(--text)', marginBottom: 12, letterSpacing: '-0.02em' }}>
            Feature-by-Feature Comparison
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 36, fontSize: 15 }}>
            What actually happens when you hire someone through each platform.
          </p>
          <div className="card overflow-hidden">
            <div style={{ overflowX: 'auto' }}>
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #eee' }}>
                  <tr>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 800, color: '#6b7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>What Matters</th>
                    <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 900, color: 'var(--rose)', fontSize: 14 }}>Taskeeu</th>
                    <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 800, color: '#6b7280', fontSize: 14 }}>Jiji</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Identity verification (NIN/BVN) before accepting a job', true, false],
                    ['Escrow: payment held until you approve the work', true, false],
                    ['Real-time task tracking & in-app chat', true, false],
                    ['Public rating & completed-job history per Tasker', true, false],
                    ['Structured bidding to compare multiple offers', true, false],
                    ['Photo/video proof of completed work', true, false],
                    ['Dispute resolution if something goes wrong', true, false],
                    ['Built specifically for errands & field tasks', true, false],
                    ['General classifieds for any product or service', false, true],
                  ].map(([label, ours, theirs], i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 600, color: '#374151' }}>{label}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        {ours ? <CheckCircle size={20} style={{ color: '#00c37e', display: 'inline' }} /> : <X size={20} style={{ color: '#d1d5db', display: 'inline' }} />}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        {theirs ? <CheckCircle size={20} style={{ color: '#00c37e', display: 'inline' }} /> : <X size={20} style={{ color: '#d1d5db', display: 'inline' }} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 14, textAlign: 'center' }}>
            Comparison based on Taskeeu's platform features and Jiji's publicly documented classifieds model as of 2026. Individual listings on Jiji may vary, but the platform itself provides no built-in verification or escrow for services.
          </p>
        </div>
      </section>

      {/* Why it matters */}
      <section style={{ padding: '70px 20px' }}>
        <div className="container-xl" style={{ maxWidth: 820, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 26, fontWeight: 900, color: 'var(--text)', marginBottom: 36, letterSpacing: '-0.02em' }}>
            Why This Actually Matters
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {[
              { icon: ShieldCheck, title: 'No Verification on Classifieds', desc: 'Anyone can post a "services" ad on Jiji with a phone number. There\u2019s no check on who they are before you hand over cash or an address.' },
              { icon: AlertTriangle, title: 'No Payment Protection', desc: 'Money changes hands directly with a stranger, off-platform, no receipts, no recourse. If the job is half-done or never happens, Jiji has no dispute process for it.' },
              { icon: Clock, title: 'No Progress Tracking', desc: 'Once you\u2019ve agreed a price on Jiji, you\u2019re relying entirely on WhatsApp messages and trust. There\u2019s no shared record of what was promised.' },
              { icon: MessageSquare, title: 'No Reviews Tied to Real Jobs', desc: 'Taskeeu ratings are tied to verified, completed tasks, not just a profile a seller controls themselves.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="card" style={{ padding: 24 }}>
                <Icon size={26} style={{ color: 'var(--rose)', marginBottom: 12 }} />
                <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>{title}</p>
                <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '70px 20px', background: 'var(--surface)' }}>
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

      {/* CTA */}
      <section style={{ padding: '70px 20px', textAlign: 'center' }}>
        <div className="container-xl" style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', marginBottom: 14 }}>
            Post Your Errand the Safer Way
          </h2>
          <p style={{ color: 'var(--muted)', marginBottom: 28, fontSize: 15 }}>
            Verified Taskers. Escrow-protected payments. Real tracking. Free to post.
          </p>
          <Link to="/post-task" className="btn-primary" style={{ padding: '14px 32px', fontSize: 15, borderRadius: 12 }}>
            Post a Task Now →
          </Link>
        </div>
      </section>
    </div>
  );
}
