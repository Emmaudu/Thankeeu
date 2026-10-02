import { Link } from 'react-router-dom';

const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
import { Mail } from 'lucide-react';
import WorldwideLinks from './WorldwideLinks';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer style={{ background: 'var(--dark)', color: 'rgba(255,255,255,0.6)' }}>
      <div className="container-xl" style={{ paddingTop: 64, paddingBottom: 48 }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
              <img src="/logo.svg" alt="Taskeeu" className="w-9 h-9 rounded-xl" />
              <span style={{ fontWeight: 900, fontSize: 20, color: 'white', letterSpacing: '-0.03em' }}>Taskeeu</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.75, marginBottom: 20, color: 'rgba(255,255,255,0.5)' }}>
              Africa's trusted platform for getting things done. Real taskers. Real results. Anywhere.
            </p>
            <a href="/contact" className="flex items-center gap-2 font-semibold" style={{ fontSize: 14, color: 'var(--rose)' }}>
              <Mail size={14} /> Contact Us
            </a>
          </div>

          {/* Platform */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>Platform</p>
            <div className="space-y-3">
              {[
                { to: '/tasks', label: 'Browse Tasks' },
                { to: '/taskers', label: 'Browse Taskers' },
                { to: '/post-task', label: 'Post a Task' },
                { to: '/taskers', label: 'Find Taskers' },
                { to: '/pricing', label: 'Pricing' },
                { to: '/teams', label: 'For Teams' },
                { to: '/refer-and-earn', label: 'Refer & Earn' },
              ].map(({ to, label }) => (
                <Link key={to} to={to} style={{ display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}
                  onClick={scrollToTop} onMouseEnter={e => e.currentTarget.style.color = 'white'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>Company</p>
            <div className="space-y-3">
              {[
                { to: '/about', label: 'About Us' },
                { to: '/how-it-works', label: 'How It Works' },
                { to: '/blog', label: 'Blog' },
                { to: '/careers', label: 'Careers' },
                { to: '/demo', label: 'Book a Demo' },
              ].map(({ to, label }) => (
                <Link key={to} to={to} style={{ display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}
                  onClick={scrollToTop} onMouseEnter={e => e.currentTarget.style.color = 'white'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>Services</p>
            <div className="space-y-3">
              {[
                { to: '/vooom', label: 'Vooom Logistics' },
                { to: '/vooom/browse', label: 'Browse Carriers' },
                { to: '/vooom/nigeria-diaspora-delivery', label: 'Diaspora Delivery' },
                { to: '/vooom/uk-nigeria-delivery', label: 'UK to Nigeria' },
                { to: '/vooom/us-nigeria-delivery', label: 'US to Nigeria' },
                { to: '/delivery', label: 'Delivery & Courier' },
                { to: '/errands', label: 'Errand Runners' },
                { to: '/errand-runner-near-me', label: 'Errand Runner Near Me' },
                { to: '/diaspora', label: 'For Nigerians Abroad' },
                { to: '/grocery-shopping', label: 'Grocery Shopping' },
                { to: '/property-inspection', label: 'Property Inspection' },
                { to: '/house-land-inspection', label: 'House & Land Inspection' },
                { to: '/field-engineers', label: 'Field Engineers' },
                { to: '/installations', label: 'Installations' },
                { to: '/office-support', label: 'Office Support' },
                { to: '/document-pickup', label: 'Document Pickup' },
                { to: '/asset-verification', label: 'Asset Verification' },
                { to: '/merchandising', label: 'Merchandising' },
                { to: '/business-support', label: 'Business Support' },
              ].map(({ to, label }) => (
                <Link key={to} to={to} style={{ display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}
                  onClick={scrollToTop} onMouseEnter={e => e.currentTarget.style.color = 'white'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Support */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>Support</p>
            <div className="space-y-3">
              {[
                { to: '/faq', label: 'FAQs' },
                { to: '/contact', label: 'Contact Us' },
                { to: '/policy', label: 'Privacy Policy' },
                { to: '/terms', label: 'Terms of Service' },
              ].map(({ to, label }) => (
                <Link key={to} to={to} style={{ display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}
                  onClick={scrollToTop} onMouseEnter={e => e.currentTarget.style.color = 'white'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
                  {label}
                </Link>
              ))}
            </div>

            {/* Selbolt backlinks */}
            <div style={{ marginTop: 28 }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Interview</p>
              <div className="space-y-3">
                {[
                  {
                    href: 'https://selbolt.com',
                    label: 'Selbolt',
                    note: 'Our previous brand',
                  },
                  {
                    href: 'https://techmoran.com/?s=Selbolt',
                    label: 'Selbolt on TechMoran',
                    note: 'Press coverage',
                  },
                  {
                    href: 'https://innovation-village.com/?s=Selbolt',
                    label: 'Selbolt on Innovation Village',
                    note: 'Press coverage',
                  },
                  {
                    href: 'https://techcityng.com/?s=Selbolt',
                    label: 'Selbolt on TechCity',
                    note: 'Press coverage',
                  },
                ].map(({ href, label, note }) => (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.75)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                    ↗ {label}
                    <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{note}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <WorldwideLinks />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          <p>© {year} Taskeeu Technologies Ltd. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link to="/policy" onClick={scrollToTop} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>Privacy</Link>
            <Link to="/terms" onClick={scrollToTop} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>Terms</Link>
            <Link to="/faq" onClick={scrollToTop} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>FAQ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
