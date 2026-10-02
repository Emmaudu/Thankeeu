import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Building2, Shield, Zap, BarChart3, Users, MapPin, Clock, Star, Search, HardHat, RadioTower, ShieldCheck, Plane, Store, Package, CreditCard, Camera, ClipboardList, FileText, Video, Megaphone, Ban, Scale, Lock, Banknote, Landmark, ShoppingCart, Globe, Map, Pencil, Plus, Rocket } from 'lucide-react';
import { teamsApi } from '../../utils/api';
import SEO, { teamsStructuredData } from '../../components/seo/SEO';

const TASK_TYPES_SAMPLE = [
  { Icon: Search, name: 'Merchant Verification', price: 12000, cat: 'Verification' },
  { Icon: HardHat, name: 'Construction Site Inspection', price: 20000, cat: 'Inspection' },
  { Icon: RadioTower, name: 'Telecom Tower Inspection', price: 22000, cat: 'Inspection' },
  { Icon: ShieldCheck, name: 'Safety Compliance Audits', price: 22000, cat: 'Compliance' },
  { Icon: Plane, name: 'Drone Site Coverage', price: 25000, cat: 'Documentation' },
  { Icon: Zap, name: 'Emergency Dispatch Tasks', price: 25000, cat: 'Dispatch' },
  { Icon: Store, name: 'Retail Shelf Audits', price: 11000, cat: 'Audit' },
  { Icon: Package, name: 'Delivery Verification', price: 10000, cat: 'Verification' },
];

const FEATURES = [
  { Icon: Building2, title: 'Department Management', desc: 'Create departments, assign leaders, and allocate separate budgets to each team. Full organisational hierarchy control.' },
  { Icon: CreditCard, title: 'Task Wallet & Escrow', desc: 'Fund a central wallet. Allocate by department or use a general purse. Funds reserved per task and released only after proof approval.' },
  { Icon: Camera, title: 'GPS Photo Proof System', desc: 'Taskers upload GPS-stamped, timestamped photo evidence of every field task. No proof = no payment. Full SLA enforcement.' },
  { Icon: ClipboardList, title: 'Line Manager Approval', desc: 'Every task goes through a line manager approval workflow before going live. Email + dashboard alerts keep approvals fast.' },
  { Icon: FileText, title: 'Auto Authorization Letters', desc: 'Each accepted tasker gets a branded, auto-generated authorization letter with company details, task info and personal details.' },
  { Icon: Video, title: 'Video Alignment Meetings', desc: 'Schedule integrated Jitsi video meetings with all accepted taskers for one-click group briefings. No external tools needed.' },
  { Icon: Megaphone, title: 'Broadcast Messaging', desc: 'Send a single group message to all taskers on a job simultaneously. Keep everyone aligned in real time.' },
  { Icon: Ban, title: 'Tasker Blacklisting', desc: 'Block specific taskers from bidding on your company\'s future tasks, with reason tracking for compliance.' },
  { Icon: BarChart3, title: 'Full Audit History', desc: 'HR can see every task, every action, every spend across all departments. Team leaders see their department view.' },
  { Icon: Scale, title: 'Permission Levels', desc: 'HR assigns HR, Dept Leader, Finance, or Member roles. Finance controls wallet. Leaders approve members and tasks.' },
  { Icon: Lock, title: 'Domain-Verified Access', desc: 'Only employees with your company\'s email domain can join. HR approves every new member before they get access.' },
  { Icon: Banknote, title: '80/20 Tasker Payout', desc: 'Taskers earn 80% of workmanship, paid 2 days after task approval. Taskeeu takes 20% as platform fee.' },
];

const USE_CASES = [
  { industry: 'Telecoms & ISPs', Icon: RadioTower, tasks: ['Telecom Tower Inspection', 'Fiber Network Inspection', 'GPS Mapping & Location Verification', 'Emergency Dispatch Tasks'] },
  { industry: 'Banking & Fintech', Icon: Landmark, tasks: ['ATM Inspection', 'POS Terminal Verification', 'KYC Verification', 'Merchant Verification', 'Business Verification'] },
  { industry: 'FMCG & Retail', Icon: ShoppingCart, tasks: ['Retail Shelf Audits', 'Competitor Price Monitoring', 'Product Availability Checks', 'Mystery Shopping', 'Brand Compliance Audits'] },
  { industry: 'Insurance', Icon: ShieldCheck, tasks: ['Insurance Claims Inspection', 'Accident Scene Documentation', 'Property Inspection', 'Vehicle Inspection'] },
  { industry: 'Real Estate', Icon: HardHat, tasks: ['Real Estate Walkthroughs', 'Property Inspection', 'Tenant Occupancy Checks', 'Construction Site Inspection'] },
  { industry: 'NGOs & Government', Icon: Globe, tasks: ['NGO Field Surveys', 'Aid Distribution Verification', 'Environmental Compliance Checks', 'Market Research Data Collection'] },
];

export default function TeamsLanding() {
  const [taskTypes, setTaskTypes] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    teamsApi.getTaskTypes().then(({ data }) => setTaskTypes(data.task_types || [])).catch(() => {});
  }, []);

  const categories = ['All', ...new Set(taskTypes.map(t => t.category))].filter(Boolean);
  const filtered = activeCategory === 'All' ? taskTypes : taskTypes.filter(t => t.category === activeCategory);

  return (
    <>
      <SEO
        title="Taskeeu for Teams: Enterprise Field Operations Across Africa"
        description="Deploy verified field agents across Africa. GPS proof, SLA tracking, escrow payments, department budgets and authorization letters. From ₦200,000/month."
        canonical="https://taskeeu.com/teams"
        keywords="enterprise field operations Africa  field agents, KYC verification company, merchant verification, site inspection, Taskeeu for Teams"
        structuredData={teamsStructuredData}
        breadcrumbs={[{name:'Home',url:'https://taskeeu.com'},{name:'Taskeeu for Teams',url:'https://taskeeu.com/teams'}]}
      />
    <div className="page-enter">

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-28 md:pt-32 md:pb-36"
        style={{ background: 'linear-gradient(160deg, #12091a 0%, #1a0d2e 60%, #12091a 100%)' }}>
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(0,195,126,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(255,107,53,0.08) 0%, transparent 50%)' }} />

        <div className="container-xl relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Building2 size={14} className="text-rose-400" />
              <span className="text-white/80 text-sm font-medium">Built for Africa</span>
            </div>

            <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-5 leading-tight">
              Nationwide Field Ops,
              <span className="block text-rose-400 mt-1">One Platform</span>
            </h1>

            <p className="text-white/70 text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
              Taskeeu for Teams is Africa's field operations infrastructure. Deploy verified agents across any country, manage SLAs, track GPS proof, and pay securely, all from one company account.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Link to="/teams/register" className="btn-primary btn-lg">
                Register Your Company
              </Link>
              <Link to="/teams/login"
                className="bg-white/10 border border-white/25 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/20 transition-colors text-base">
                Team Login
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-white/50 text-sm">
              {['Domain-Verified Access', 'GPS Proof System', 'Escrow Payments', 'Auto Auth Letters', 'SLA Enforcement'].map(f => (
                <span key={f} className="flex items-center gap-1.5">
                  <CheckCircle size={13} className="text-rose-400" /> {f}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Floating stat cards */}
        <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col gap-3 opacity-80">
          {[
            { n: '44', label: 'Task Types', Icon: ClipboardList },
            { n: '36', label: 'States Covered', Icon: Map },
            { n: '4,500+', label: 'Verified Taskers', Icon: CheckCircle },
          ].map(s => (
            <div key={s.label} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 w-44 text-white">
              <s.Icon size={26} className="text-rose-500 mb-2" />
              <div className="font-heading font-bold text-2xl">{s.n}</div>
              <div className="text-xs text-white/60">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LOGOS / TRUST BAR ────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 py-6">
        <div className="container-xl text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">Trusted by forward-thinking companies across Africa</p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-40">
            {['BANKING', 'TELECOMS', 'INSURANCE', 'FMCG', 'REAL ESTATE', 'NGOS', 'LOGISTICS', 'ENERGY'].map(b => (
              <span key={b} className="font-heading font-black text-gray-400 text-sm tracking-wider">{b}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="py-20 bg-surface">
        <div className="container-xl">
          <div className="text-center mb-14">
            <span className="block text-rose-500 text-xs font-bold uppercase tracking-wider mb-3">Simple Process</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-dark mb-3">How Taskeeu for Teams Works</h2>
            <p className="text-muted max-w-xl mx-auto">From company setup to nationwide field deployment in minutes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n:'01', Icon:Building2, title:'HR Registers Company', desc:'HR creates the company account with your business domain (e.g. @yourcompany.com). Sets up departments, roles, and subscribes.' },
              { n:'02', Icon:Users, title:'Team Members Join', desc:'Employees sign up using their company email. System validates the domain automatically. HR approves each new member.' },
              { n:'03', Icon:ClipboardList, title:'Members Post Tasks', desc:'Team members pick from 44 fixed-price task types, modify prices if needed, set state deployments, and submit to their line manager.' },
              { n:'04', Icon:Zap, title:'Taskers Deploy & Prove', desc:'Verified taskers bid, get accepted with an auth letter, complete the task with GPS photo proof, and get paid after approval.' },
            ].map(s => (
              <div key={s.n} className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl text-sm font-bold text-white flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, var(--rose), var(--rose-dark))' }}>{s.n}</div>
                  <s.Icon size={20} className="text-rose-500" />
                </div>
                <h3 className="font-heading font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TASK TYPES & PRICES ───────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container-xl">
          <div className="text-center mb-10">
            <span className="block text-rose-500 text-xs font-bold uppercase tracking-wider mb-3">Fixed Pricing</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-dark mb-3">44 Task Types, Fixed Rates</h2>
            <p className="text-muted max-w-xl mx-auto">All priced between ₦10,000, ₦25,000 per person per task. Members can bulk-adjust prices up or down before submitting.</p>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  activeCategory === cat
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'
                }`}>
                {cat}
              </button>
            ))}
          </div>

          {taskTypes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(t => (
                <div key={t.id} className="card p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className="block text-xs text-muted font-semibold mb-2">{t.category}</span>
                      <h4 className="font-semibold text-sm text-gray-800 leading-tight">{t.name}</h4>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-rose-600 font-bold text-sm">₦{Number(t.base_price).toLocaleString()}</span>
                    <span className="text-xs text-muted">per person</span>
                  </div>
                </div>
              ))}
              <div className="card p-4 border-2 border-dashed border-rose-200 flex items-center justify-center text-center">
                <div>
                  <Pencil size={26} className="text-rose-500 mb-2" />
                  <p className="font-semibold text-sm text-rose-600">Custom Task Type</p>
                  <p className="text-xs text-muted mt-1">Create your own task if not in the list</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TASK_TYPES_SAMPLE.map(t => (
                <div key={t.name} className="card p-4">
                  <span className="block text-xs text-muted font-semibold mb-2">{t.cat}</span>
                  <h4 className="font-semibold text-sm text-gray-800 leading-tight">{t.name}</h4>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-rose-600 font-bold text-sm">₦{Number(t.price).toLocaleString()}</span>
                    <span className="text-xs text-muted">per person</span>
                  </div>
                </div>
              ))}
              <div className="card p-4 border-2 border-dashed border-rose-200 flex items-center justify-center text-center">
                <div><Plus size={26} className="text-rose-500 mb-2" /><p className="text-xs text-rose-600 font-medium">+36 More Task Types</p></div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── FEATURES GRID ────────────────────────────────────────── */}
      <section className="py-20 bg-surface">
        <div className="container-xl">
          <div className="text-center mb-14">
            <span className="block text-rose-500 text-xs font-bold uppercase tracking-wider mb-3">Platform Features</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-dark mb-3">Everything you need to run field ops</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="card p-6 hover:shadow-md transition-all hover:-translate-y-0.5">
                <f.Icon size={26} className="text-rose-500 mb-2" />
                <h3 className="font-heading font-bold text-gray-900 mb-2 text-base">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INDUSTRY USE CASES ───────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container-xl">
          <div className="text-center mb-12">
            <span className="block text-rose-500 text-xs font-bold uppercase tracking-wider mb-3">Industries</span>
            <h2 className="font-heading text-3xl font-bold text-dark mb-3">Built for every sector</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {USE_CASES.map(uc => (
              <div key={uc.industry} className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <uc.Icon size={20} className="text-rose-500" />
                  <h3 className="font-heading font-bold text-gray-900">{uc.industry}</h3>
                </div>
                <div className="space-y-2">
                  {uc.tasks.map(t => (
                    <div key={t} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle size={13} className="text-rose-500 flex-shrink-0" />{t}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────── */}
      <section className="py-20 bg-surface" id="pricing">
        <div className="container-xl max-w-4xl">
          <div className="text-center mb-12">
            <span className="block text-rose-500 text-xs font-bold uppercase tracking-wider mb-3">Pricing</span>
            <h2 className="font-heading text-3xl font-bold text-dark mb-3">Simple, transparent pricing</h2>
            <p className="text-muted">Subscribe once, deploy anywhere across Africa. Task costs are separate and funded from your wallet.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly */}
            <div className="card p-8 border-2 border-gray-200">
              <p className="text-sm font-semibold text-muted uppercase tracking-wide mb-4">Monthly Plan</p>
              <div className="flex items-end gap-1 mb-2">
                <span className="font-heading font-black text-4xl text-dark">₦200,000</span>
                <span className="text-muted mb-1.5">/month</span>
              </div>
              <p className="text-sm text-muted mb-6">Billed monthly. Cancel anytime.</p>
              <div className="space-y-3 mb-8">
                {['Unlimited team members','Unlimited departments','Full GPS proof system','Auto authorization letters','Priority tasker matching','Dedicated HR dashboard'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle size={15} className="text-rose-500 flex-shrink-0" />{f}
                  </div>
                ))}
              </div>
              <Link to="/teams/register" className="btn-outline w-full text-center block">Get Started →</Link>
            </div>
            {/* Yearly */}
            <div className="card p-8 border-2 border-rose-500 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full">SAVE ₦1.2M</div>
              <p className="text-sm font-semibold text-rose-600 uppercase tracking-wide mb-4">Yearly Plan</p>
              <div className="flex items-end gap-1 mb-2">
                <span className="font-heading font-black text-4xl text-dark">₦2,400,000</span>
                <span className="text-muted mb-1.5">/year</span>
              </div>
              <p className="text-sm text-muted mb-6">₦200,000/month equivalent. Best value.</p>
              <div className="space-y-3 mb-8">
                {['Everything in Monthly','Annual billing discount','Priority customer support','Custom SLA configuration','Advanced analytics dashboard','Dedicated account manager'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle size={15} className="text-rose-500 flex-shrink-0" />{f}
                  </div>
                ))}
              </div>
              <Link to="/teams/register" className="btn-primary w-full text-center block">Get Started →</Link>
            </div>
          </div>

          {/* Task costs note */}
          <div className="mt-8 p-5 bg-white rounded-2xl border border-gray-200 text-sm text-gray-700">
            <p className="font-semibold mb-2">About Task Costs (separate from subscription):</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-muted text-xs mt-3">
              <div className="flex gap-2"><CreditCard size={15} className="shrink-0 mt-0.5" /><span>Fund your Task Wallet via Flutterwave. Allocate per department or use a shared purse.</span></div>
              <div className="flex gap-2"><Lock size={15} className="shrink-0 mt-0.5" /><span>Funds are reserved when tasks are posted and only deducted after GPS proof is approved.</span></div>
              <div className="flex gap-2"><Banknote size={15} className="shrink-0 mt-0.5" /><span>Taskers earn 80% of task cost (paid 2 days after approval). Taskeeu retains 20% platform fee.</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #12091a 0%, #1a0d2e 60%, #12091a 100%)' }}>
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(ellipse at 30% 50%, rgba(0,195,126,0.15) 0%, transparent 60%)' }} />
        <div className="container-xl text-center relative z-10">
          <Rocket size={40} className="text-rose-400 mb-4 mx-auto" />
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-5">
            Deploy your first field task<br />across Africa today
          </h2>
          <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
            From Lagos to Maiduguri, verified taskers in every state, ready to execute with GPS-verified proof.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/teams/register" className="btn-primary btn-lg">Register Your Company</Link>
            <Link to="/teams/login" className="bg-white/10 border border-white/25 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/20 transition-colors text-lg">
              Already registered? Login →
            </Link>
          </div>
        </div>
      </section>
    </div>
  
    </>);
}
