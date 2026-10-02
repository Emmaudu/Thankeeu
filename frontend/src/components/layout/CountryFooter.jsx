import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import COUNTRY_INDEX from '../../content/countries/index';
import WorldwideLinks from './WorldwideLinks';

const top = () => window.scrollTo({ top: 0 });
const heading = { fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 16 };
const linkStyle = { display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 500 };
const hoverOn = (e) => { e.currentTarget.style.color = 'white'; };
const hoverOff = (e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; };

function Col({ title, links }) {
  return (
    <div>
      <p style={heading}>{title}</p>
      <div className="space-y-3">
        {links.map(({ to, label }) => (
          <Link key={to} to={to} style={linkStyle} onClick={top} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>{label}</Link>
        ))}
      </div>
    </div>
  );
}

/** Footer for a country site: every service, city and comparison page is one click away. */
export default function CountryFooter({ market }) {
  const idx = COUNTRY_INDEX[market.slug];
  const p = `/${market.slug}`;
  const year = new Date().getFullYear();
  if (!idx) return null;
  return (
    <footer style={{ background: 'var(--dark)', color: 'rgba(255,255,255,0.6)' }}>
      <div className="container-xl" style={{ paddingTop: 64, paddingBottom: 40 }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <img src="/logo.svg" alt="Taskeeu" className="w-9 h-9 rounded-xl" />
              <span style={{ fontWeight: 900, fontSize: 20, color: 'white', letterSpacing: '-0.03em' }}>Taskeeu {market.short}</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.75, marginBottom: 20, color: 'rgba(255,255,255,0.5)' }}>
              Post a task for free, compare bids from local taskers in {market.name} and pay in {market.currency} through a secure payment hold.
            </p>
            <a href="/contact" className="flex items-center gap-2 font-semibold" style={{ fontSize: 14, color: 'var(--rose)' }}><Mail size={14} /> Contact us</a>
          </div>
          <Col title="Taskeeu" links={[
            { to: p, label: `Taskeeu ${market.short}` },
            { to: `${p}/tasks`, label: 'Browse tasks' },
            { to: `${p}/remote`, label: 'Remote tasks' },
            { to: `${p}/post-task`, label: 'Post a task' },
            { to: `${p}/tasker/signup`, label: 'Become a tasker' },
            { to: `${p}/requester/login`, label: 'Log in' },
          ]} />
          <Col title="Services" links={idx.services.map((s) => ({ to: `${p}/services/${s.slug}`, label: s.name }))} />
          <Col title="Cities" links={idx.cities.map((c) => ({ to: `${p}/${c.slug}`, label: c.name }))} />
          <Col title="Compare" links={[
            ...idx.compare.map((c) => ({ to: `${p}/compare/${c.slug}`, label: `Taskeeu vs ${c.competitor}` })),
            { to: '/faq', label: 'FAQs' },
            { to: '/policy', label: 'Privacy policy' },
            { to: '/terms', label: 'Terms of service' },
          ]} />
        </div>
        <WorldwideLinks />
        <div style={{ paddingTop: 22, borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          <p>© {year} Taskeeu Technologies Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
