import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Link2, Wallet, Users, CheckCircle, Share2, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';
import SEO from '../components/seo/SEO';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  {
    icon: Users,
    title: 'Create your Taskeeu account',
    desc: 'Sign up (or log in) as a requester or a tasker; either works. You need an account first, because your referral earnings are tracked and paid into your dashboard wallet.',
  },
  {
    icon: Link2,
    title: 'Make your custom referral link',
    desc: 'Pick a name and get a link like taskeeu.com/refer/yourname. It is yours, memorable, and easy to share on WhatsApp, Instagram, or with family and friends.',
  },
  {
    icon: Share2,
    title: 'Share it and invite people to post tasks',
    desc: 'Send your link to people who need errands and tasks done. When they click it, they land on Taskeeu and sign up, and we permanently tag them as yours.',
  },
  {
    icon: Wallet,
    title: 'Earn 10% commission on completed tasks',
    desc: 'Every time someone you referred posts a task and it is completed successfully, you earn 10% of the task value. Withdraw it from your Refer Wallet once the task is done.',
  },
];

const POINTS = [
  { icon: TrendingUp, title: '10% on every completed task', desc: 'Not a one-off signup bonus. You earn a commission each time your referred requester gets a task done. Refer active people and it adds up.' },
  { icon: ShieldCheck, title: 'Paid only on real, completed work', desc: 'Commission becomes withdrawable after a task is marked complete successfully. That keeps the program honest and sustainable for everyone.' },
  { icon: Link2, title: 'One link, fully yours', desc: 'Your custom link never changes and works forever. Put it in your bio, your status, your group chats. Every signup through it is credited to you.' },
  { icon: Wallet, title: 'Track everything in your Refer Wallet', desc: 'See who signed up through your link, whether they have posted a task, whether it is completed, and exactly how much you have earned.' },
];

export default function ReferAndEarn() {
  const { isAuthenticated, user } = useAuth();
  const [exampleName, setExampleName] = useState('emmanuel');

  const dashboardHref = user?.role === 'tasker' ? '/tasker?tab=refer-wallet' : '/requester?tab=refer-wallet';

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SEO
        title="Refer & Earn | Invite Others to Taskeeu and Earn 10% Commission"
        description="Share your custom Taskeeu referral link and earn 10% commission every time someone you invited gets a task completed. Free to join for any requester or tasker."
        canonical="https://taskeeu.com/refer-and-earn"
        keywords="taskeeu refer and earn, taskeeu referral program, earn money referring taskeeu, referral commission Nigeria, invite and earn errand app"
      />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(160deg, #12091a 0%, #1e0d33 55%, #12091a 100%)', padding: '96px 20px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -60, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,45,98,0.18), transparent 70%)' }} />
        <div className="container-xl" style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <p style={{ color: '#ff6b8f', fontWeight: 700, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 18 }}>Refer &amp; Earn</p>
          <h1 style={{ fontSize: 'clamp(32px, 6vw, 54px)', fontWeight: 900, color: 'white', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 22 }}>
            Invite people to Taskeeu.<br />Earn every time they get things done.
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 36, maxWidth: 620, marginLeft: 'auto', marginRight: 'auto' }}>
            Share your own custom link and earn <strong style={{ color: 'white' }}>10% commission</strong> whenever someone you referred posts a task and it is completed. Free to join, whether you are a requester or a tasker.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            {isAuthenticated ? (
              <Link to={dashboardHref} className="btn-primary" style={{ padding: '15px 34px', fontSize: 16, borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Go to my Refer Wallet <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/requester/signup" className="btn-primary" style={{ padding: '15px 34px', fontSize: 16, borderRadius: 12 }}>
                  Sign up as a Requester
                </Link>
                <Link to="/tasker/signup" style={{ padding: '15px 34px', fontSize: 16, borderRadius: 12, background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.15)' }}>
                  Sign up as a Tasker
                </Link>
              </>
            )}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 18 }}>
            {isAuthenticated ? 'Your custom link is waiting in your dashboard.' : 'You need an account first. It takes under a minute.'}
          </p>
        </div>
      </section>

      {/* Example link builder */}
      <section style={{ padding: '64px 20px', background: 'var(--surface)' }}>
        <div className="container-xl" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', marginBottom: 12, letterSpacing: '-0.02em' }}>Your link, your name</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 28, fontSize: 15 }}>
            You choose what goes after <strong>/refer/</strong>. Try it: type a name and see how your link would look:
          </p>
          <div style={{ background: 'white', borderRadius: 16, padding: '22px', boxShadow: '0 6px 30px rgba(18,9,26,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: 4, fontSize: 'clamp(15px, 3.5vw, 20px)', fontWeight: 700 }}>
              <span style={{ color: 'var(--muted)' }}>taskeeu.com/refer/</span>
              <input
                value={exampleName}
                onChange={(e) => setExampleName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20))}
                style={{ border: 'none', borderBottom: '2px solid var(--rose)', outline: 'none', color: 'var(--rose)', fontWeight: 800, width: `${Math.max(exampleName.length, 4) + 1}ch`, background: 'transparent', fontSize: 'inherit' }}
              />
            </div>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 14 }}>You set this up inside your dashboard after signing in.</p>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '72px 20px' }}>
        <div className="container-xl" style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 30, fontWeight: 900, color: 'var(--text)', marginBottom: 12, letterSpacing: '-0.02em' }}>How it works</h2>
          <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 44, fontSize: 16 }}>Four steps from signing up to getting paid.</p>
          <div style={{ display: 'grid', gap: 20 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 20, background: 'white', borderRadius: 18, padding: '24px 26px', boxShadow: '0 4px 20px rgba(18,9,26,0.05)', alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0, width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #ff2d62, #ff6b8f)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', position: 'relative' }}>
                  <s.icon size={22} />
                  <span style={{ position: 'absolute', top: -8, left: -8, width: 24, height: 24, borderRadius: '50%', background: 'var(--text, #12091a)', color: 'white', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
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

      {/* Why join */}
      <section style={{ padding: '72px 20px', background: 'var(--surface)' }}>
        <div className="container-xl" style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 30, fontWeight: 900, color: 'var(--text)', marginBottom: 44, letterSpacing: '-0.02em' }}>Why people love referring Taskeeu</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 22 }}>
            {POINTS.map((p, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 18, padding: 26, boxShadow: '0 4px 20px rgba(18,9,26,0.05)' }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: '#fff0f4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <p.icon size={22} style={{ color: 'var(--rose)' }} />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 6 }}>{p.title}</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.65, fontSize: 14 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What to tell people */}
      <section style={{ padding: '72px 20px' }}>
        <div className="container-xl" style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ background: 'linear-gradient(135deg, #12091a, #1e0d33)', borderRadius: 24, padding: 'clamp(28px, 5vw, 44px)', color: 'white' }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16, letterSpacing: '-0.02em' }}>What should you tell people?</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, marginBottom: 20, fontSize: 15.5 }}>
              Your link is an invitation for people to <strong style={{ color: 'white' }}>post tasks and get them done</strong> on Taskeeu: grocery runs, deliveries, document pickups, government queuing, errands of every kind, handled by verified local people.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, fontSize: 15.5 }}>
              So share it with anyone who is busy, lives abroad with family here, runs a business, or just needs a reliable hand. Every task they complete on Taskeeu earns you a commission and genuinely helps them get things done.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div className="container-xl" style={{ maxWidth: 620, margin: '0 auto' }}>
          <h2 style={{ fontSize: 30, fontWeight: 900, color: 'var(--text)', marginBottom: 14, letterSpacing: '-0.02em' }}>Ready to start earning?</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 30, fontSize: 16, lineHeight: 1.6 }}>
            Create your account, set up your custom link, and start sharing. It is completely free.
          </p>
          {isAuthenticated ? (
            <Link to={dashboardHref} className="btn-primary" style={{ padding: '15px 36px', fontSize: 16, borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Set up my referral link <ArrowRight size={18} />
            </Link>
          ) : (
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/requester/signup" className="btn-primary" style={{ padding: '15px 34px', fontSize: 16, borderRadius: 12 }}>Join as Requester</Link>
              <Link to="/tasker/signup" className="btn-outline" style={{ padding: '15px 34px', fontSize: 16, borderRadius: 12 }}>Join as Tasker</Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
