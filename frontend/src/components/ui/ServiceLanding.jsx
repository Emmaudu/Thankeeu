import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO, { makeFAQSchema } from '../seo/SEO';

// ── Icon primitives (inline SVG, outline style) ───────────────────
const icons = {
  shield: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  check: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  map: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  credit: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  clock: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  users: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  phone: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.1 10.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.11 7.88a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14v2.92z"/></svg>,
  chat: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  warning: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  clipboard: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>,
  star: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  arrow: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  post: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  offer: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  choose: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  track: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  pay: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  plus: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  minus: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  building: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18"/><path d="M3 9h6"/><path d="M3 15h6"/><path d="M15 9h3"/><path d="M15 15h3"/><path d="M15 12h3"/></svg>,
  truck: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  file: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  home: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  tool: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  zap: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  briefcase: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>,
  search: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  shoppingBag: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  package: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  wifi: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
  sun: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  layers: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  camera: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  tag: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  inbox: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>,
  activity: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  grid: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  key: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  bar: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  repeat: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>,
};

const STEPS = [
  { icon: icons.post, title: 'Post Your Task', desc: 'Describe what you need, where, and your budget. Takes under 2 minutes.' },
  { icon: icons.offer, title: 'Receive Offers', desc: 'Verified Taskers in your area send competitive bids within minutes.' },
  { icon: icons.choose, title: 'Choose Your Tasker', desc: 'Review profiles, ratings, and experience. Pick the best fit.' },
  { icon: icons.track, title: 'Track Progress', desc: 'Get real-time updates as your Tasker works. Chat directly anytime.' },
  { icon: icons.pay, title: 'Approve & Pay Securely', desc: 'Only release payment when you are fully satisfied. Powered by Paystack & Flutterwave.' },
];

const BENEFITS = [
  { icon: icons.shield, title: 'Verified Professionals', desc: 'Every Tasker is background-checked, identity-verified, and rated by previous clients.' },
  { icon: icons.credit, title: 'Secure Escrow Payments', desc: 'Your money is held safely until you approve task completion. Zero risk.' },
  { icon: icons.track, title: 'Real-time Updates', desc: 'Live task tracking and direct messaging keep you informed at every step.' },
  { icon: icons.star, title: 'Transparent Pricing', desc: 'See all bids upfront. No hidden charges. You set the budget.' },
  { icon: icons.map, title: 'Nationwide Coverage', desc: 'Active Taskers in Lagos, Abuja, Port Harcourt, Ibadan, Kano, and 30+ states.' },
  { icon: icons.briefcase, title: 'Business & Personal Use', desc: 'From quick personal errands to enterprise-scale field operations.' },
  { icon: icons.post, title: 'Easy Task Posting', desc: 'Post any task in under 2 minutes from your phone or laptop.' },
  { icon: icons.zap, title: 'Fast Matching', desc: 'Most tasks receive their first bid within 30 minutes of posting.' },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(!open)}
      style={{ border: '1px solid', borderColor: open ? '#F43F6C22' : '#e5e7eb', borderRadius: 14, padding: '18px 20px', cursor: 'pointer', background: open ? '#fff5f7' : 'white', transition: 'all 0.2s' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: '#111', lineHeight: 1.4 }}>{q}</p>
        <span style={{ color: '#F43F6C', flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(45deg)' : 'rotate(0)' }}>{icons.plus}</span>
      </div>
      {open && <p style={{ marginTop: 12, fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>{a}</p>}
    </div>
  );
}

export default function ServiceLanding({ seo, hero, tasks = [], useCases = [], faqs = [], relatedLinks = [] }) {
  const faqSchema = makeFAQSchema(faqs);
  // Support multiple structured data objects (FAQ + LocalBusiness)
  const allStructuredData = seo.structuredData
    ? [faqSchema, seo.structuredData].filter(Boolean)
    : faqSchema;

  // Richer breadcrumbs — city pages get a 3-level trail
  const breadcrumbs = seo.slug === '/errands'
    ? [
        { name: 'Home', url: 'https://taskeeu.com' },
        { name: 'Errand Service Nigeria', url: 'https://taskeeu.com/errands' },
      ]
    : seo.slug.startsWith('/errands/')
    ? [
        { name: 'Home', url: 'https://taskeeu.com' },
        { name: 'Errand Service Nigeria', url: 'https://taskeeu.com/errands' },
        { name: seo.title, url: `https://taskeeu.com${seo.slug}` },
      ]
    : [
        { name: 'Home', url: 'https://taskeeu.com' },
        { name: seo.title, url: `https://taskeeu.com${seo.slug}` },
      ];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: 'white' }}>
      <SEO
        title={seo.title}
        description={seo.description}
        canonical={`https://taskeeu.com${seo.slug}`}
        keywords={seo.keywords}
        structuredData={allStructuredData}
        breadcrumbs={breadcrumbs}
      />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, #fff5f7 0%, #fff 40%, #f0fdf4 100%)', padding: '80px 24px 72px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, #F43F6C18 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, #10B98118 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #fecdd3', borderRadius: 100, padding: '6px 16px', marginBottom: 24, fontSize: 13, fontWeight: 700, color: '#F43F6C' }}>
            <span style={{ color: '#10B981' }}>{icons.map}</span>
            {hero.badge}
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, color: '#0f172a', lineHeight: 1.15, marginBottom: 20, letterSpacing: '-0.02em' }}>
            {hero.headline}
          </h1>

          <p style={{ fontSize: 18, color: '#475569', lineHeight: 1.7, marginBottom: 36, maxWidth: 580, margin: '0 auto 36px' }}>
            {hero.subheadline}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <Link to="/post-task" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F43F6C', color: 'white', borderRadius: 12, padding: '14px 28px', fontWeight: 800, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 14px #F43F6C40', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px #F43F6C50'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px #F43F6C40'; }}>
              {icons.post} Post Your Task
            </Link>
            <Link to="/tasker/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', color: '#0f172a', borderRadius: 12, padding: '14px 28px', fontWeight: 800, fontSize: 15, textDecoration: 'none', border: '1.5px solid #e2e8f0', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#F43F6C'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
              {icons.users} Become a Tasker
            </Link>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', marginTop: 40 }}>
            {[
              { icon: icons.shield, text: 'Verified Taskers' },
              { icon: icons.map, text: 'Nationwide Coverage' },
              { icon: icons.credit, text: 'Secure Payments' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                <span style={{ color: '#10B981' }}>{icon}</span> {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular Tasks ──────────────────────────────────────── */}
      <section style={{ padding: '72px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>
              {hero.tasksHeading || 'Popular Tasks'}
            </h2>
            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 500, margin: '0 auto' }}>
              {hero.tasksSubheading || 'Trusted Nigerians use Taskeeu for these tasks every day.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {tasks.map((task, i) => (
              <Link to="/post-task" key={i} style={{ textDecoration: 'none' }}>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: '22px 20px', background: 'white', transition: 'all 0.2s', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#F43F6C'; e.currentTarget.style.boxShadow = '0 4px 20px #F43F6C15'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F43F6C', marginBottom: 14 }}>
                    {task.icon}
                  </div>
                  <p style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 6 }}>{task.title}</p>
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{task.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section style={{ padding: '72px 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>
              How Taskeeu Works
            </h2>
            <p style={{ fontSize: 16, color: '#64748b' }}>From posting to completion in 5 simple steps</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 24, position: 'relative', paddingBottom: i < STEPS.length - 1 ? 32 : 0 }}>
                {i < STEPS.length - 1 && (
                  <div style={{ position: 'absolute', left: 21, top: 52, bottom: 0, width: 2, background: 'linear-gradient(to bottom, #F43F6C40, #10B98140)', zIndex: 0 }} />
                )}
                <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 12, background: i === 0 ? '#F43F6C' : 'white', border: `2px solid ${i === 0 ? '#F43F6C' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: i === 0 ? 'white' : '#F43F6C', position: 'relative', zIndex: 1 }}>
                  {step.icon}
                </div>
                <div style={{ paddingTop: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#F43F6C', textTransform: 'uppercase', letterSpacing: 1 }}>Step {i + 1}</span>
                  </div>
                  <p style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', marginBottom: 4 }}>{step.title}</p>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose Taskeeu (Comparison) ────────────────────── */}
      <section style={{ padding: '72px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>
              Why Choose Taskeeu?
            </h2>
            <p style={{ fontSize: 16, color: '#64748b' }}>Stop managing tasks the old way. There is a better option.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {/* Old way */}
            <div style={{ border: '1px solid #fecdd3', borderRadius: 20, padding: 28, background: '#fff8f8' }}>
              <p style={{ fontWeight: 900, fontSize: 17, color: '#9f1239', marginBottom: 20 }}>The Old Way</p>
              {[
                { icon: icons.phone, text: 'Calling random contacts on phone' },
                { icon: icons.chat, text: 'Searching WhatsApp groups for help' },
                { icon: icons.warning, text: 'Unverified workers, no accountability' },
                { icon: icons.clock, text: 'No progress updates, just waiting' },
                { icon: icons.clipboard, text: 'Manual coordination, easy to mess up' },
              ].map(({ icon, text }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, color: '#be123c' }}>
                  <span style={{ opacity: 0.6 }}>{icon}</span>
                  <p style={{ fontSize: 14, color: '#374151' }}>{text}</p>
                </div>
              ))}
            </div>

            {/* Taskeeu way */}
            <div style={{ border: '2px solid #10B981', borderRadius: 20, padding: 28, background: '#f0fdf4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <p style={{ fontWeight: 900, fontSize: 17, color: '#14532d' }}>Taskeeu</p>
                <span style={{ background: '#10B981', color: 'white', fontSize: 11, fontWeight: 800, borderRadius: 100, padding: '2px 10px' }}>Recommended</span>
              </div>
              {[
                { icon: icons.shield, text: 'Verified, background-checked Taskers' },
                { icon: icons.post, text: 'Post any task in under 2 minutes' },
                { icon: icons.track, text: 'Real-time task progress tracking' },
                { icon: icons.credit, text: 'Secure escrow: pay only on completion' },
                { icon: icons.map, text: 'Nationwide coverage across all 36 states' },
                { icon: icons.briefcase, text: 'Business-ready workflows for teams' },
              ].map(({ icon, text }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <span style={{ color: '#10B981' }}>{icon}</span>
                  <p style={{ fontSize: 14, color: '#374151' }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefits ──────────────────────────────────────────── */}
      <section style={{ padding: '72px 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>
              Built for Nigerians, by Nigerians
            </h2>
            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 500, margin: '0 auto' }}>
              Every feature is designed around how work actually gets done in Nigeria.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {BENEFITS.map((b, i) => (
              <div key={i} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: '22px 20px', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#10B981'; e.currentTarget.style.boxShadow = '0 4px 16px #10B98115'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ color: '#10B981', marginBottom: 12 }}>{b.icon}</div>
                <p style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 6 }}>{b.title}</p>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use Cases ─────────────────────────────────────────── */}
      <section style={{ padding: '72px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>
              Common Use Cases
            </h2>
            <p style={{ fontSize: 16, color: '#64748b' }}>See how individuals and businesses across Nigeria use this service.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {useCases.map((uc, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: '20px 22px', background: 'white', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', flexShrink: 0 }}>
                  {uc.icon}
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>{uc.title}</p>
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{uc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section style={{ padding: '72px 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>
              Frequently Asked Questions
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── Related Services ──────────────────────────────────── */}
      {relatedLinks && relatedLinks.length > 0 && (
        <section style={{ padding: '48px 24px', background: 'white', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <p style={{ fontWeight: 800, fontSize: 14, color: '#64748b', marginBottom: 16, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 }}>Related Services</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
              {relatedLinks.map(({ label, href }) => (
                <Link key={href} to={href} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 100, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: '#374151', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#F43F6C'; e.currentTarget.style.color = '#F43F6C'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#374151'; }}>
                  {icons.arrow} {label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, color: 'white', marginBottom: 16, lineHeight: 1.2 }}>
            Ready to Outsource Your Next Task?
          </h2>
          <p style={{ fontSize: 17, color: '#94a3b8', lineHeight: 1.7, marginBottom: 36 }}>
            Join thousands of Nigerians using Taskeeu to get tasks done faster, cheaper, and with zero stress.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <Link to="/post-task" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F43F6C', color: 'white', borderRadius: 12, padding: '15px 32px', fontWeight: 800, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 20px #F43F6C40' }}>
              {icons.post} Post Your Task
            </Link>
            <Link to="/tasker/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', color: 'white', borderRadius: 12, padding: '15px 32px', fontWeight: 800, fontSize: 15, textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.2)' }}>
              {icons.users} Become a Tasker
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
