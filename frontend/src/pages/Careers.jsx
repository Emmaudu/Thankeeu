import SEO from '../components/seo/SEO';


export default function Careers() {
  return (
    <>
      <SEO title="Careers | Taskeeu" description="Join the Taskeeu team and help build Africa's most trusted task platform." />
      <div style={{ background: 'var(--surface)', minHeight: '100vh', paddingTop: 80 }}>
        <section style={{ background: 'linear-gradient(135deg, var(--dark) 0%, #1e0a30 100%)', padding: '72px 0' }}>
          <div className="container-xl text-center">
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: 16 }}>Work with us</p>
            <h1 style={{ color: 'white', fontWeight: 900, fontSize: 42, letterSpacing: '-0.03em', marginBottom: 20 }}>Join the Taskeeu Team</h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 17, maxWidth: 560, margin: '0 auto', lineHeight: 1.75 }}>
              We're building the infrastructure for work across Africa. If that mission excites you, we want to hear from you.
            </p>
          </div>
        </section>

        <section style={{ padding: '72px 0' }}>
          <div className="container-xl" style={{ maxWidth: 700 }}>
            <div className="card p-10 text-center">
              <div style={{ fontSize: 52, marginBottom: 20 }}></div>
              <h2 style={{ fontWeight: 900, fontSize: 24, color: 'var(--text)', marginBottom: 12 }}>No open roles right now</h2>
              <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.75, marginBottom: 28 }}>
                We don't have any open positions listed at the moment, but we're always interested in meeting talented people who are passionate about building for Africa.
              </p>
              <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.75, marginBottom: 28 }}>
                Send us your CV and a short note about what you'd like to work on. We'll keep it on file and reach out when the right opportunity comes up.
              </p>
              <a
                href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'var(--rose)', color: 'white', padding: '14px 28px', borderRadius: 14, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}
              >
                Send us a Message
              </a>
            </div>

            <div className="card p-8 mt-6">
              <h3 style={{ fontWeight: 900, fontSize: 18, color: 'var(--text)', marginBottom: 16 }}>What we look for</h3>
              <div className="space-y-4">
                {[
                  { title: 'Builders', desc: 'People who ship things, not just plan them.' },
                  { title: 'Africa-first thinkers', desc: 'You understand the nuances of operating across African markets.' },
                  { title: 'Ownership mindset', desc: 'You treat problems like your own and don\'t wait to be told what to do.' },
                  { title: 'Honest communicators', desc: 'No politics, no ego, just clear, direct, kind communication.' },
                ].map(({ title, desc }) => (
                  <div key={title} style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: 'var(--rose)', fontWeight: 900, flexShrink: 0 }}>→</span>
                    <div>
                      <span style={{ fontWeight: 800, color: 'var(--text)' }}>{title}: </span>
                      <span style={{ color: 'var(--muted)', fontSize: 14 }}>{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
