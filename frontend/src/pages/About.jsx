import SEO from '../components/seo/SEO';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Users, Globe, Shield } from 'lucide-react';

export default function About() {
  return (
    <>
      <SEO title="About Us | Taskeeu" description="Learn about Taskeeu, Africa's trusted platform for getting things done." />
      <div style={{ background: 'var(--surface)', minHeight: '100vh', paddingTop: 80 }}>

        {/* Hero */}
        <section style={{ background: 'linear-gradient(135deg, var(--dark) 0%, #1e0a30 100%)', padding: '72px 0' }}>
          <div className="container-xl text-center">
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: 16 }}>Our Story</p>
            <h1 style={{ color: 'white', fontWeight: 900, fontSize: 42, letterSpacing: '-0.03em', marginBottom: 20, lineHeight: 1.15 }}>
              Built for Africa,<br />by people who understand Africa
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 17, maxWidth: 600, margin: '0 auto', lineHeight: 1.75 }}>
              Taskeeu was created to solve a real problem: getting things done across cities, states, and borders in Africa without needing to be there physically.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section style={{ padding: '72px 0' }}>
          <div className="container-xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
              <div>
                <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: 12 }}>Our Mission</p>
                <h2 style={{ fontWeight: 900, fontSize: 30, color: 'var(--text)', marginBottom: 16, lineHeight: 1.3 }}>
                  Making trust the default, not the exception
                </h2>
                <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.8, marginBottom: 20 }}>
                  Every task on Taskeeu is protected by escrow payments, every tasker is KYC-verified, and every delivery comes with GPS-stamped photo proof. We built the infrastructure so you never have to wonder if it got done.
                </p>
                <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.8 }}>
                  From picking up a forgotten document in Lagos to sourcing equipment across state lines, Taskeeu handles it with a network of verified taskers who know their streets.
                </p>
              </div>
              <div className="space-y-5">
                {[
                  { icon: Shield, title: 'KYC-verified taskers', desc: 'Every tasker submits government ID, proof of address, and a face photo before going live.' },
                  { icon: Globe, title: 'Pan-Africa coverage', desc: 'Operating across Nigeria with plans to expand to Ghana, Kenya, and across the continent.' },
                  { icon: Users, title: 'Built for enterprise too', desc: 'Taskeeu for Teams lets companies deploy verified taskers at scale with department-level billing.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4 card p-5">
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--rose-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={20} style={{ color: 'var(--rose)' }} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{title}</p>
                      <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section style={{ padding: '72px 0', background: 'white' }}>
          <div className="container-xl">
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: 12 }}>What we stand for</p>
              <h2 style={{ fontWeight: 900, fontSize: 28, color: 'var(--text)' }}>Our Values</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { emoji: '', title: 'Safety first', desc: 'Escrow payments mean neither party loses money. Funds only move when the task is done.' },
                { emoji: '', title: 'Verified always', desc: 'No unverified taskers on the platform. Period.' },
                { emoji: '', title: 'Speed matters', desc: 'Tasks are posted and bid on within minutes. Fast matching, fast execution.' },
              ].map(({ emoji, title, desc }) => (
                <div key={title} className="card p-7 text-center">
                  <div style={{ fontSize: 36, marginBottom: 16 }}>{emoji}</div>
                  <p style={{ fontWeight: 900, fontSize: 17, color: 'var(--text)', marginBottom: 8 }}>{title}</p>
                  <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '64px 0', background: 'linear-gradient(135deg, var(--rose) 0%, var(--rose-dark) 100%)', textAlign: 'center' }}>
          <div className="container-xl">
            <h2 style={{ color: 'white', fontWeight: 900, marginBottom: 16 }}>Ready to get started?</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 32 }}>Post your first task or join as a verified tasker today.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/post-task" className="btn-white inline-flex items-center gap-2">Post a Task <ArrowRight size={16} /></Link>
              <Link to="/tasker/signup" style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.35)', color: 'white', padding: '14px 28px', borderRadius: 16, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>Become a Tasker</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
