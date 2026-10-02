import { useState, useEffect } from 'react';
import SEO, { globalStructuredData } from '../components/seo/SEO';
import { Link } from 'react-router-dom';
import {
  CheckCircle, Users, Truck, MapPin, ShoppingCart, Zap,
  MessageSquare, Lock, Shield, ArrowRight, Briefcase,
  ChevronRight, Phone, Home as HomeIcon, Camera, Navigation
, Car, Plane, Package } from 'lucide-react';
import { tasksApi, settingsApi } from '../utils/api';
import TaskCard from '../components/ui/TaskCard';


const HOW_STEPS = [
  {
    n: '01', Icon: Briefcase, bg: 'rgba(255,45,98,0.1)', ic: 'var(--rose)',
    title: 'Post Your Task',
    desc: 'Tell us what you need, where, and when. Takes less than 2 minutes, no wahala.',
  },
  {
    n: '02', Icon: Users, bg: 'rgba(99,102,241,0.1)', ic: '#6366f1',
    title: 'Verified Taskers Bid',
    desc: 'Taskers near you see your task and send bids with their price. You see ratings, reviews, and photo.',
  },
  {
    n: '03', Icon: MessageSquare, bg: 'rgba(0,195,126,0.1)', ic: '#00C37E',
    title: 'Chat, Agree & Pay',
    desc: 'Chat or call your tasker directly. Your money stays in escrow, safe until the job is done.',
  },
  {
    n: '04', Icon: Lock, bg: 'rgba(245,166,35,0.1)', ic: '#F5A623',
    title: 'Release & Rate',
    desc: 'Task done? Share your 6-digit code. Payment drops to the tasker immediately. Then rate them.',
  },
];

const TASK_TYPES = [
  { Icon: Truck,        title: 'Pickup & Delivery',  desc: 'Left something behind? Tasker grabs it and brings it to you, within the same city or across states.',    color: '#3b82f6', bg: '#eff6ff' },
  { Icon: ShoppingCart, title: 'Purchase & Ship',    desc: 'Need an item bought from another city? We source it, verify it with photos, then ship it.',  color: '#f97316', bg: '#fff7ed' },
  { Icon: MapPin,       title: 'On-Location Tasks',  desc: 'Pay bills, collect documents, verify properties, queue at government offices, all without moving.', color: '#8b5cf6', bg: '#f5f3ff' },
  { Icon: Zap,          title: 'General Errands',    desc: 'Anything else: package collections, logistics, inspections, deliveries. Sorted fast.',         color: '#00C37E', bg: '#f0fdf4' },
];

const TRUST = [
  { Icon: Shield,        title: 'Full KYC on Every Tasker',   desc: 'National ID, driver license, proof of address, social media, all verified by a real human admin before any tasker goes live.', color: 'var(--rose)' },
  { Icon: Lock,          title: 'Escrow Holds Your Money',    desc: 'You pay into escrow first. Your money only moves to the tasker after the task is completed to your satisfaction, not before.', color: '#6366f1' },
  { Icon: CheckCircle,   title: '6-Digit Completion Code',    desc: 'Workmanship only releases when you share a private code with your tasker. You stay in control till the very end.', color: '#00C37E' },
  { Icon: MessageSquare, title: 'Real-Time Chat & Calls',     desc: 'Chat, share files, and call your tasker directly from the platform, with no need to share personal numbers.', color: '#F5A623' },
];


export default function Home() {
  const [heroText, setHeroText] = useState({
    home_hero_heading: 'Need someone to run an errand for you in Nigeria?',
    home_hero_subheading: "Hire a verified errand runner in Lagos, Abuja, Port Harcourt or anywhere in Nigeria. Grocery runs, NIMC queuing, pharmacy pickups, bill payments, market runs: any errand handled. Your money stays in escrow until it's done. Safe. Fast. Fair.",
  });
  useEffect(() => {
    settingsApi.getPublic().then(({ data }) => {
      if (data?.settings) {
        setHeroText(prev => ({
          ...prev,
          ...(data.settings.home_hero_heading ? { home_hero_heading: data.settings.home_hero_heading } : {}),
          ...(data.settings.home_hero_subheading ? { home_hero_subheading: data.settings.home_hero_subheading } : {}),
        }));
      }
    }).catch(() => {});
  }, []);

  const [tasks, setTasks] = useState([]);
  const [searchCity, setSearchCity] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const t = await tasksApi.list({ limit: 6, status: 'open,bidding,ongoing' });
        setTasks(t.data.tasks || []);
      } catch {}
    };
    load();
  }, []);

  return (
    <>
      <SEO
        title="Hire Someone to Run Errands for You in Nigeria & Africa"
        description="Need someone to run an errand for you? Taskeeu is Nigeria's #1 errand service. Hire a verified errand runner in Lagos, Abuja, Port Harcourt & across Africa. Grocery runs, NIMC queuing, pharmacy pickups, bill payments & more, all escrow-protected."
        canonical="https://taskeeu.com/"
        keywords="errand service Nigeria, hire someone to run errands Nigeria, errand runner Lagos, errand boy Lagos, someone to run errand for me Nigeria, errand service Abuja, errand service Africa, task outsourcing Nigeria, errand marketplace Nigeria, hire errand runner"
        structuredData={globalStructuredData}
      />
      <div className="page-enter">

        {/* ══════════════════════════════════════
            HERO
        ══════════════════════════════════════ */}
        <section className="home-hero noise-overlay relative overflow-hidden">
          <div className="container-xl relative z-10">
            <div className="home-hero-grid">
              <div className="home-hero-copy">

              <h1
                className="text-white mb-6"
                style={{
                  fontSize: 'clamp(2.35rem, 5vw, 4.85rem)',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.08,
                }}
              >
                {heroText.home_hero_heading}
              </h1>

              <p
                className="mb-10"
                style={{
                  fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.7,
                  maxWidth: 580,
                  margin: '0 0 40px',
                }}
              >
                {heroText.home_hero_subheading}
              </p>

              <div className="home-hero-actions flex flex-col sm:flex-row gap-3 mb-12">
                <Link to="/post-task" className="btn-primary btn-lg">
                  Post a Task Now <ArrowRight size={18} />
                </Link>
                <Link
                  to="/tasker/signup"
                  className="btn-lg inline-flex items-center justify-center gap-2 font-bold rounded-2xl transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(255,255,255,0.25)',
                    color: 'white',
                    backdropFilter: 'blur(8px)',
                    minHeight: 58,
                    padding: '16px 32px',
                    fontSize: 16,
                  }}
                >
                  Become a Tasker
                </Link>
              </div>

              {/* Trust bar */}
              <div className="home-hero-trust flex flex-wrap items-center gap-x-8 gap-y-3">
                {[
                  { Icon: CheckCircle, text: 'KYC-Verified Taskers' },
                  { Icon: Lock, text: 'Escrow Protected' },
                  { Icon: MessageSquare, text: 'Real-Time Chat' },
                  { Icon: Shield, text: 'Anti-Scam System' },
                ].map(({ Icon, text }) => (
                  <div key={text} className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600 }}>
                    <Icon size={14} style={{ color: '#00C37E' }} />
                    {text}
                  </div>
                ))}
              </div>
              </div>

              <div className="home-hero-media" aria-hidden="true">
                <img
                  src="/taskeeu-hero.png"
                  alt=""
                  className="home-hero-image"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            TASK TYPES
        ══════════════════════════════════════ */}
        <section style={{ padding: '80px 0', background: 'var(--surface)' }}>
          <div className="container-xl">
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: 12 }}>
                What we handle
              </p>
              <h2 style={{ marginBottom: 16 }}>Every kind of task, covered</h2>
              <p style={{ fontSize: 17, color: 'var(--muted)', maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
                From picking up a forgotten item to sourcing industrial equipment across state lines, Taskeeu handles it with verified taskers near you.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {TASK_TYPES.map(({ Icon, title, desc, color, bg }) => (
                <Link
                  key={title}
                  to={`/tasks?type=${title.toLowerCase().replace(/\s+/g, '_')}`}
                  className="card-hover p-6 block"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: bg }}
                  >
                    <Icon size={22} style={{ color }} />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8, color: 'var(--text)' }}>{title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.65 }}>{desc}</p>
                  <div className="flex items-center gap-1 mt-4 font-semibold" style={{ fontSize: 13, color }}>
                    Browse tasks <ChevronRight size={14} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            HOW IT WORKS
        ══════════════════════════════════════ */}
        <section style={{ padding: '80px 0', background: 'white' }}>
          <div className="container-xl">
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: 12 }}>
                Simple process
              </p>
              <h2 style={{ marginBottom: 16 }}>How Taskeeu works</h2>
              <p style={{ fontSize: 17, color: 'var(--muted)', maxWidth: 500, margin: '0 auto' }}>
                Four steps to get anything done. No stress.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {/* Connector line */}
              <div
                className="hidden lg:block absolute"
                style={{
                  top: 28, left: '12.5%', right: '12.5%', height: 1,
                  background: 'linear-gradient(90deg, transparent, var(--rose), var(--rose), transparent)',
                  opacity: 0.2,
                }}
              />

              {HOW_STEPS.map(({ n, Icon, bg, ic, title, desc }, i) => (
                <div key={n} className="flex flex-col items-center text-center">
                  <div
                    className="relative w-[56px] h-[56px] rounded-2xl flex items-center justify-center mb-5 z-10"
                    style={{ background: bg }}
                  >
                    <Icon size={26} style={{ color: ic }} />
                    <span
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white"
                      style={{ background: 'var(--rose)', fontSize: 10, fontWeight: 800 }}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>{title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>{desc}</p>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 48 }}>
              <Link to="/how-it-works" className="btn-outline">
                Learn More About How It Works <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            LIVE TASKS
        ══════════════════════════════════════ */}
        {tasks.length > 0 && (
          <section style={{ padding: '80px 0', background: 'var(--surface)' }}>
            <div className="container-xl">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: 10 }}>
                    Live on the platform
                  </p>
                  <h2 style={{ marginBottom: 0 }}>Open tasks right now</h2>
                </div>
                <Link to="/tasks" className="btn-ghost hidden sm:flex items-center gap-2" style={{ color: 'var(--rose)', fontWeight: 700 }}>
                  View all tasks <ArrowRight size={16} />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {tasks.slice(0, 6).map(task => <TaskCard key={task.id} task={task} />)}
              </div>
              <div className="text-center mt-8 sm:hidden">
                <Link to="/tasks" className="btn-outline">View All Tasks</Link>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════
            TRUST
        ══════════════════════════════════════ */}
        <section style={{ padding: '80px 0', background: 'white' }}>
          <div className="container-xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: 16 }}>
                  Built for Africa
                </p>
                <h2 style={{ marginBottom: 20 }}>Why thousands of people across Africa trust Taskeeu</h2>
                <p style={{ fontSize: 17, color: 'var(--muted)', lineHeight: 1.75, marginBottom: 40 }}>
                  Taskeeu was built from the ground up for Africa, with multi-currency payments, country-by-country coverage, and local taskers who know their streets.
                </p>
                <div className="space-y-6">
                  {TRUST.map(({ Icon, title, desc, color }) => (
                    <div key={title} className="flex items-start gap-4">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${color}18` }}
                      >
                        <Icon size={20} style={{ color }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 4, color: 'var(--text)' }}>{title}</p>
                        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.65 }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="rounded-3xl p-8 relative overflow-hidden"
                style={{ background: 'linear-gradient(150deg, var(--dark) 0%, #2a0a1f 100%)' }}
              >
                <div
                  className="absolute inset-0 rounded-3xl"
                  style={{ backgroundImage: 'radial-gradient(ellipse at 80% 20%, rgba(255,45,98,0.3), transparent 60%)' }}
                />
                <div className="relative z-10">
                  <h3 style={{ color: 'white', fontSize: 26, fontWeight: 900, marginBottom: 10 }}>
                    Ready to get started?
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 28, fontSize: 15, lineHeight: 1.7 }}>
                    Post your first task in under 2 minutes. No subscription. No commitment. You only pay when the job is done.
                  </p>
                  <div className="space-y-3">
                    <Link to="/post-task" className="btn-primary w-full justify-center">
                      Post a Task Now <ArrowRight size={16} />
                    </Link>
                    <Link
                      to="/tasker/signup"
                      className="w-full inline-flex items-center justify-center gap-2 font-bold rounded-2xl transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'rgba(255,255,255,0.8)',
                        padding: '14px 24px',
                        fontSize: 15,
                      }}
                    >
                      <Briefcase size={16} /> Become a Tasker
                    </Link>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 20 }}>
                    Payments secured by Flutterwave · Verified taskers across Africa
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            ENTERPRISE CTA
        ══════════════════════════════════════ */}

        {/* ── VOOOM SECTION ── */}
        <section style={{ padding: '80px 0', background: 'white', overflow:'hidden' }}>
          <div className="container-xl">
            <div className="vooom-home-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:56, alignItems:'center' }}>
              <div style={{ minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:18 }}>
                  <Zap size={15} style={{ color:'var(--rose)', flexShrink:0 }} />
                  <span style={{ fontWeight:800, fontSize:12, color:'var(--rose)', letterSpacing:'0.07em', textTransform:'uppercase' }}>New: Vooom by Taskeeu</span>
                </div>
                <h2 style={{ fontWeight:900, fontSize:'clamp(26px,4vw,40px)', color:'var(--text)', lineHeight:1.15, letterSpacing:'-0.03em', marginBottom:18 }}>
                  Someone is already going your way.
                  <span style={{ color:'var(--rose)' }}> Send things along.</span>
                </h2>
                <p style={{ color:'var(--muted)', lineHeight:1.8, fontSize:15.5, marginBottom:16 }}>
                  Vooom is Nigeria's peer logistics network. Send items with verified carriers already travelling your route. Lagos to Abuja. Port Harcourt to Lagos. UK to Nigeria. US to Nigeria.
                </p>
                <p style={{ color:'var(--muted)', lineHeight:1.8, fontSize:15.5, marginBottom:28 }}>
                  Pay a fraction of DHL or FedEx prices. Full escrow protection. No risk.
                </p>
                <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                  <Link to="/vooom" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 24px', borderRadius:12, background:'linear-gradient(135deg,#0f0720,#1a0933)', color:'white', fontWeight:800, textDecoration:'none', fontSize:14 }}>
                    Discover Vooom <ArrowRight size={15} />
                  </Link>
                  <Link to="/vooom/browse" style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'12px 22px', borderRadius:12, background:'var(--surface)', border:'1.5px solid var(--border-light)', color:'var(--text)', fontWeight:700, textDecoration:'none', fontSize:14 }}>
                    Browse requests
                  </Link>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:12, minWidth:0 }}>
                {[
                  { Icon: Car, from:'Ikeja, Lagos', to:'Victoria Island', desc:'Documents same day with someone already driving down.' },
                  { Icon: Plane, from:'London, UK', to:'Lagos, Nigeria', desc:'Jollof seasoning, medicine, clothing sent home safely.' },
                  { Icon: Truck, from:'Port Harcourt', to:'Lagos', desc:'Goods carried by a truck already making the run.' },
                  { Icon: Package, from:'Houston, US', to:'Abuja, Nigeria', desc:'Japa community parcels at a fraction of FedEx cost.' },
                ].map((c, i) => (
                  <div key={i} style={{ display:'flex', gap:14, alignItems:'center', background:'var(--surface)', borderRadius:14, padding:'13px 16px', border:'1.5px solid var(--border-light)', minWidth:0, overflow:'hidden' }}>
                    <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,rgba(255,45,98,0.12),rgba(124,58,237,0.08))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <c.Icon size={18} style={{ color:'var(--rose)' }} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2, flexWrap:'wrap' }}>
                        <span style={{ fontWeight:700, fontSize:13, color:'var(--text)' }}>{c.from}</span>
                        <ArrowRight size={12} style={{ color:'var(--rose)', flexShrink:0 }} />
                        <span style={{ fontWeight:700, fontSize:13, color:'var(--text)' }}>{c.to}</span>
                      </div>
                      <span style={{ fontSize:12, color:'var(--muted)', display:'block' }}>{c.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <style>{`
            @media (max-width: 700px) {
              .vooom-home-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
            }
          `}</style>
        </section>

        <section style={{ padding: '80px 0', background: 'var(--surface)' }}>
          <div className="container-xl">
            <div
              className="rounded-3xl p-10 md:p-14 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, var(--dark) 0%, #1e0a30 100%)' }}
            >
              <div
                className="absolute inset-0 rounded-3xl"
                style={{ backgroundImage: 'radial-gradient(ellipse at 15% 50%, rgba(255,45,98,0.2), transparent 55%), radial-gradient(ellipse at 85% 30%, rgba(0,195,126,0.12), transparent 50%)' }}
              />
              <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: 16 }}>
                    For businesses
                  </p>
                  <h2 style={{ color: 'white', marginBottom: 16 }}>Taskeeu for Teams</h2>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, lineHeight: 1.75, marginBottom: 28 }}>
                    Deploy verified taskers across multiple states simultaneously. Real-time tracking, GPS photo proof, and centralized billing, built for enterprise field operations.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link to="/teams" className="btn-primary">
                      Explore Enterprise <ArrowRight size={16} />
                    </Link>
                    <Link to="/demo" className="inline-flex items-center gap-2 font-bold rounded-2xl transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        padding: '14px 24px',
                        fontSize: 15,
                      }}
                    >
                      <Phone size={15} /> Book a Demo
                    </Link>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    'Verified taskers across Africa',
                    'GPS-stamped photo proof of work',
                    'Bulk task deployment from one dashboard',
                    'Dedicated account manager',
                    'Custom SLA and pricing',
                  ].map(f => (
                    <div key={f} className="flex items-center gap-3">
                      <CheckCircle size={16} style={{ color: '#00C37E', flexShrink: 0 }} />
                      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: 600 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            HOUSE & LAND INSPECTION
        ══════════════════════════════════════ */}
        <section style={{ padding: '80px 0', background: 'var(--surface)' }}>
          <div className="container-xl">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'center' }}>
              <div>
                <p style={{ color: 'var(--rose)', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>House &amp; Land Inspection</p>
                <h2 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900, color: 'var(--text)', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 18 }}>
                  Inspect a house or land without travelling there
                </h2>
                <p style={{ color: 'var(--muted)', lineHeight: 1.8, fontSize: 16, marginBottom: 24 }}>
                  Do not spend time and money crossing the country to check a property. Outsource it to a verified tasker already in that area. They inspect it and send you GPS-tagged photos, video, and a full report. Your payment stays in escrow until you are satisfied.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                  {[
                    { icon: Camera, text: 'Real photo and video evidence of the property' },
                    { icon: Navigation, text: 'GPS-tagged and timestamped, so you know they were there' },
                    { icon: Shield, text: 'Escrow-protected: pay only when you are satisfied' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fff0f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <item.icon size={18} style={{ color: 'var(--rose)' }} />
                      </div>
                      <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: 15 }}>{item.text}</span>
                    </div>
                  ))}
                </div>
                <Link to="/house-land-inspection" className="btn-primary" style={{ padding: '13px 28px', fontSize: 15, borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  Learn about inspections <ArrowRight size={17} />
                </Link>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ background: 'linear-gradient(160deg, #12091a, #1e0d33)', borderRadius: 24, padding: 40, width: '100%', maxWidth: 380, textAlign: 'center' }}>
                  <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #ff2d62, #ff6b8f)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <HomeIcon size={34} style={{ color: 'white' }} />
                  </div>
                  <p style={{ color: 'white', fontWeight: 800, fontSize: 18, marginBottom: 10 }}>Buying land or a house?</p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14.5, lineHeight: 1.7 }}>
                    Verify it is real, see its true condition, and check the boundaries, all before you pay a naira. A trusted local does the legwork for you.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            FINAL CTA
        ══════════════════════════════════════ */}
        <section
          style={{
            padding: '80px 0',
            background: 'linear-gradient(135deg, var(--rose) 0%, var(--rose-dark) 100%)',
            textAlign: 'center',
          }}
        >
          <div className="container-xl">
            <h2 style={{ color: 'white', marginBottom: 16 }}>Stop waiting. Start doing.</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7 }}>
              Post your first task today and get it done by a verified tasker near you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/post-task" className="btn-white btn-lg">
                Post a Task Now <ArrowRight size={18} />
              </Link>
              <Link
                to="/tasker/signup"
                className="btn-lg inline-flex items-center justify-center gap-2 font-bold rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '2px solid rgba(255,255,255,0.35)',
                  color: 'white',
                  minHeight: 58,
                  padding: '16px 36px',
                  fontSize: 16,
                }}
              >
                Earn as a Tasker
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
