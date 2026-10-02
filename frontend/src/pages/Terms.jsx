import SEO from '../components/seo/SEO';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <>
      <SEO
        title="Terms of Service | Taskeeu" description="Taskeeu's Terms of Service. Read the rules and conditions governing use of the Taskeeu platform."/>
      <div style={{ background: 'var(--surface)', minHeight: '100vh', paddingTop: 80 }}>
        <section style={{ background: 'linear-gradient(135deg, var(--dark) 0%, #1e0a30 100%)', padding: '56px 0' }}>
          <div className="container-xl text-center">
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: 12 }}>Legal</p>
            <h1 style={{ color: 'white', fontWeight: 900, fontSize: 36, letterSpacing: '-0.03em', marginBottom: 12 }}>Terms of Service</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Last updated: June 2025</p>
          </div>
        </section>

        <section style={{ padding: '56px 0' }}>
          <div className="container-xl" style={{ maxWidth: 800 }}>
            {/* Quick nav */}
            <div className="card p-5 mb-8" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {['acceptance','accounts','tasks-payments','conduct','liability','termination','governing-law'].map(id => (
                <a key={id} href={`#${id}`}
                  style={{ fontSize: 13, fontWeight: 600, color: 'var(--rose)', textDecoration: 'none', padding: '4px 10px', borderRadius: 8, background: 'var(--rose-light)' }}>
                  {id.replace(/-/g,' ')}
                </a>
              ))}
            </div>

            <div className="card p-8 space-y-8" style={{ lineHeight: 1.75, color: 'var(--muted)' }}>

              <div style={{ background: '#fff8f0', border: '1px solid #f59e0b', borderRadius: 12, padding: '16px 20px', color: '#78450c', fontSize: 14 }}>By creating an account on Taskeeu, you agree to these Terms of Service in their entirety. Please read carefully.
              </div>

              <section id="acceptance">
                <h2 style={{ fontWeight: 900, color: 'var(--text)', marginBottom: 12 }}>1. Acceptance of Terms</h2>
                <p>These Terms of Service govern your use of the Taskeeu platform, website, and related services. By registering an account or using any part of the platform, you confirm that you are at least 18 years old, have the legal capacity to enter into contracts, and agree to be bound by these Terms.</p>
              </section>

              <section id="accounts">
                <h2 style={{ fontWeight: 900, color: 'var(--text)', marginBottom: 12 }}>2. Accounts & Registration</h2>
                <p style={{ marginBottom: 10 }}>You are responsible for all activity under your account. You must:</p>
                <ul style={{ paddingLeft: 20, marginBottom: 10 }}>
                  <li style={{ marginBottom: 6 }}>Provide accurate, truthful information during registration</li>
                  <li style={{ marginBottom: 6 }}>Keep your password secure and not share it</li>
                  <li style={{ marginBottom: 6 }}>Notify us immediately of any unauthorised access</li>
                  <li style={{ marginBottom: 6 }}>Not create multiple accounts to circumvent bans or restrictions</li>
                </ul>
                <p>Taskers must complete KYC verification (government ID, proof of address, face photo) before accessing the marketplace. Submitting false documents is grounds for immediate permanent ban and may be reported to relevant authorities.</p>
              </section>

              <section id="tasks-payments">
                <h2 style={{ fontWeight: 900, color: 'var(--text)', marginBottom: 12 }}>3. Tasks & Payments</h2>
                <p style={{ marginBottom: 10 }}><strong style={{ color: 'var(--text)' }}>Escrow:</strong> When a requester accepts a bid, funds are held in escrow by Taskeeu. The tasker is only paid after the requester confirms task completion using their unique completion code.</p>
                <p style={{ marginBottom: 10 }}><strong style={{ color: 'var(--text)' }}>Equipment costs:</strong> If a task requires equipment, the requester pays equipment costs separately into escrow. The tasker uploads photographic proof before these funds are released.</p>
                <p style={{ marginBottom: 10 }}><strong style={{ color: 'var(--text)' }}>Fees:</strong> Taskeeu charges a service fee on completed transactions. The current fee structure is shown on the Pricing page and may change with notice.</p>
                <p style={{ marginBottom: 10 }}><strong style={{ color: 'var(--text)' }}>Refunds:</strong> Requesters may request a refund within the dispute window if a task was not completed as agreed. Refund decisions are made by Taskeeu after reviewing evidence from both parties.</p>
                <p><strong style={{ color: 'var(--text)' }}>Withdrawals:</strong> Taskers may withdraw completed earnings to their verified bank account at any time. Taskeeu uses Flutterwave for all payment processing.</p>
              </section>

              <section id="conduct">
                <h2 style={{ fontWeight: 900, color: 'var(--text)', marginBottom: 12 }}>4. Prohibited Conduct</h2>
                <p style={{ marginBottom: 10 }}>You must not:</p>
                <ul style={{ paddingLeft: 20 }}>
                  {[
                    'Post tasks or bids intended to defraud any party',
                    'Arrange payment or communication outside Taskeeu to circumvent fees or escrow protections',
                    'Harass, threaten, or abuse other users',
                    'Submit false identity documents or impersonate another person',
                    'Use the platform for illegal activities of any kind',
                    'Post tasks involving controlled substances, illegal goods, or prohibited services',
                    'Manipulate ratings or reviews through fake accounts or coercion',
                    'Scrape, copy, or reverse-engineer any part of the platform',
                  ].map((item, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>{item}</li>
                  ))}
                </ul>
              </section>

              <section id="liability">
                <h2 style={{ fontWeight: 900, color: 'var(--text)', marginBottom: 12 }}>5. Limitation of Liability</h2>
                <p style={{ marginBottom: 10 }}>Taskeeu is a marketplace platform connecting independent requesters and taskers. We are not a party to any task agreement and are not responsible for the quality, legality, safety, or outcome of any task performed.</p>
                <p>To the maximum extent permitted by law, Taskeeu's total liability to any user for any claim arising from use of the platform is limited to the fees paid by that user to Taskeeu in the three (3) months preceding the claim.</p>
              </section>

              <section id="termination">
                <h2 style={{ fontWeight: 900, color: 'var(--text)', marginBottom: 12 }}>6. Account Suspension & Termination</h2>
                <p style={{ marginBottom: 10 }}>Taskeeu reserves the right to suspend or permanently ban any account that:</p>
                <ul style={{ paddingLeft: 20, marginBottom: 10 }}>
                  <li style={{ marginBottom: 6 }}>Violates these Terms of Service</li>
                  <li style={{ marginBottom: 6 }}>Engages in or attempts fraud</li>
                  <li style={{ marginBottom: 6 }}>Poses a risk to platform safety or other users</li>
                  <li style={{ marginBottom: 6 }}>Receives consistent negative ratings indicating poor service</li>
                </ul>
                <p>In cases of serious violations, suspension may occur without prior notice. You may appeal a suspension by contacting us through the <Link to="/contact" style={{ color: 'var(--rose)', fontWeight: 600 }}>contact page</Link>.</p>
              </section>

              <section id="governing-law">
                <h2 style={{ fontWeight: 900, color: 'var(--text)', marginBottom: 12 }}>7. Governing Law</h2>
                <p style={{ marginBottom: 10 }}>These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of Lagos State, Nigeria.</p>
                <p>Questions about these Terms? <Link to="/contact" style={{ color: 'var(--rose)', fontWeight: 600 }}>Contact us</Link>.</p>
              </section>

              <div style={{ paddingTop: 20, borderTop: '1px solid var(--border-light)', display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 14 }}>
                <Link to="/policy" style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 600 }}>← Back to Legal Overview</Link>
                <Link to="/policy" style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>
                <Link to="/policy#trust" style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 600 }}>Trust & Safety</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
