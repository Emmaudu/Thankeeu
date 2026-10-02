import { useState } from 'react';
import SEO, { makeFAQSchema } from '../components/seo/SEO';
import { Link } from 'react-router-dom';
import { CheckCircle, X, Building2 } from 'lucide-react';

const INDIVIDUAL_PLANS = [
  {
    name: 'Free',
    emoji: '',
    price: 0,
    period: 'forever',
    desc: 'For occasional requesters',
    color: 'border-gray-200',
    btnClass: 'btn-outline',
    btnLabel: 'Get Started Free',
    href: '/auth',
    features: [
      { text: 'Post up to 3 tasks/month', included: true },
      { text: 'Browse verified taskers', included: true },
      { text: 'Real-time chat', included: true },
      { text: 'Basic escrow payments', included: true },
      { text: 'Standard tasker matching', included: true },
      { text: 'Email notifications', included: true },
      { text: 'Priority support', included: false },
      { text: 'Bulk task posting', included: false },
    ],
  },
  {
    name: 'Pro',
    emoji: '',
    price: 5000,
    period: '/month',
    desc: 'For power users & small teams',
    color: 'border-rose-500',
    popular: true,
    btnClass: 'btn-primary',
    btnLabel: 'Start Pro',
    href: '/auth',
    features: [
      { text: 'Unlimited task posting', included: true },
      { text: 'Browse verified taskers', included: true },
      { text: 'Real-time chat + file uploads', included: true },
      { text: 'Full escrow payment suite', included: true },
      { text: 'Priority tasker matching', included: true },
      { text: 'Email + SMS notifications', included: true },
      { text: 'Priority support', included: true },
      { text: 'Task history & analytics', included: true },
    ],
  },
];

const ENTERPRISE_FEATURES = [
  { emoji: '', text: 'Company account with domain-verified access' },
  { emoji: '', text: 'Unlimited team members across departments' },
  { emoji: '', text: 'Multi-level permissions (HR, Dept Leader, Finance, Member)' },
  { emoji: '', text: '44 fixed-price task types (₦10k to ₦25k)' },
  { emoji: '', text: 'Task Wallet with per-department budget allocation' },
  { emoji: '', text: 'Line manager approval workflow for every task' },
  { emoji: '', text: 'GPS timestamp photo proof system with SLA enforcement' },
  { emoji: '', text: 'Auto-generated authorization letters for taskers' },
  { emoji: '', text: 'Integrated Jitsi video meetings with all taskers' },
  { emoji: '', text: 'Broadcast messaging to all accepted taskers' },
  { emoji: '', text: 'Tasker blacklisting per company' },
  { emoji: '', text: 'Full audit history for HR and team leaders' },
  { emoji: '', text: '80/20 tasker payout model (paid 2 days after approval)' },
  { emoji: '', text: 'Full escrow protection: funds reserved, not spent until approved' },
  { emoji: '', text: 'Automated email alerts for every action' },
  { emoji: '', text: 'Multi-state deployment in a single task' },
];

const TASKER_PRICING = [
  { emoji: '', label: 'Signup', desc: 'Free to sign up and apply' },
  { emoji: '', label: 'KYC Review', desc: 'Free admin verification' },
  { emoji: '', label: 'Bidding', desc: 'Free to bid on tasks' },
  { emoji: '', label: 'Earnings', desc: '80% of workmanship fee' },
  { emoji: '', label: 'Payout', desc: '2 days after task approval' },
  { emoji: '', label: 'Transfer', desc: 'Direct to your bank account' },
];

const FAQS = [
  { q: 'Is there a free trial for Taskeeu for Teams?', a: 'Yes. When you register your company, you get a 7-day trial period to explore the platform before subscribing.' },
  { q: 'Can I switch between monthly and yearly?', a: 'Yes. You can upgrade from monthly to yearly at any time. The difference will be prorated.' },
  { q: 'How does the Task Wallet work?', a: 'You fund your wallet via Flutterwave. When a task is posted and approved by a line manager, the estimated cost is reserved (not deducted). The actual deduction happens only after GPS proof is approved and the task is marked complete.' },
  { q: 'Are task costs included in the subscription?', a: 'No. The subscription fee (₦200k/month or ₦2.4M/year) covers platform access. Task costs are separate and paid from your Task Wallet at ₦10,000 to ₦25,000 per person per task.' },
  { q: 'What is the platform fee?', a: 'Taskeeu charges a 20% platform fee on all enterprise task workmanship. Taskers receive 80% of the task rate, paid 2 days after task completion and approval.' },
  { q: 'Can different departments have separate budgets?', a: 'Yes. HR can either use a shared general wallet for all departments or allocate specific budgets to each department. Team members see their department\'s available balance in their dashboard.' },
  { q: 'What if no taskers are available in my area?', a: 'You will be notified. You can expand the search radius or wait for new taskers to join in your area. The Taskeeu tasker network is growing daily across Africa.' },
  { q: 'Can I cancel my subscription?', a: 'Yes. Monthly plans can be cancelled before the next billing cycle. Yearly plans can be cancelled but are non-refundable after the first 14 days.' },
];

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <>
    <div className="card overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors">
        <span className="font-semibold text-gray-800 text-sm pr-4">{q}</span>
        <span className={`text-rose-500 flex-shrink-0 text-xl transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-muted leading-relaxed border-t border-gray-100 pt-4">{a}</div>
      )}
    </div>
  
    </>);
}

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState('monthly');

  return (
      <>
      <SEO
        title="Pricing | Free, Pro & Enterprise Plans" description="Taskeeu is free for individuals. Pro plan at ₦5,000/month for power users. Taskeeu for Teams enterprise plan from ₦200,000/month for companies needing nationwide field operations." canonical="https://taskeeu.com/pricing" keywords="Taskeeu pricing, task outsourcing price Africa  Taskeeu for Teams cost, enterprise field ops pricing" breadcrumbs={[{name:'Home',url:'https://taskeeu.com'},{name:'Pricing',url:'https://taskeeu.com/pricing'}]}
      />
    <div className="pt-20 page-enter">

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100 py-16 md:py-20">
        <div className="container-xl text-center">
          <span className="inline-flex badge-green mb-4">Pricing</span>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-dark mb-5">
            Simple, transparent pricing
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Whether you are an individual outsourcing personal tasks or a company running nationwide field operations, Taskeeu has a plan for you.
          </p>
        </div>
      </section>

      {/* ── INDIVIDUAL PLANS ─────────────────────────────────────── */}
      <section className="py-20 bg-surface">
        <div className="container-xl">
          <div className="text-center mb-12">
            <span className="inline-flex badge-blue mb-3">For Individuals</span>
            <h2 className="font-heading text-3xl font-bold text-dark">Personal task outsourcing</h2>
            <p className="text-muted mt-2">Post tasks and hire verified taskers across Africa</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {INDIVIDUAL_PLANS.map(plan => (
              <div key={plan.name}
                className={`card p-8 border-2 ${plan.color} relative ${plan.popular ? 'shadow-glow' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{plan.emoji}</span>
                  <div>
                    <h3 className="font-heading font-bold text-xl text-dark">{plan.name}</h3>
                    <p className="text-sm text-muted">{plan.desc}</p>
                  </div>
                </div>
                <div className="flex items-end gap-1 mb-6">
                  {plan.price === 0 ? (
                    <span className="font-heading font-black text-4xl text-dark">Free</span>
                  ) : (
                    <>
                      <span className="font-heading font-black text-4xl text-dark">
                        ₦{Number(plan.price).toLocaleString()}
                      </span>
                      <span className="text-muted mb-1.5">{plan.period}</span>
                    </>
                  )}
                </div>
                <div className="space-y-3 mb-8">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm">
                      {f.included
                        ? <CheckCircle size={15} className="text-rose-500 flex-shrink-0" />
                        : <X size={15} className="text-gray-300 flex-shrink-0" />}
                      <span className={f.included ? 'text-gray-700' : 'text-gray-400'}>{f.text}</span>
                    </div>
                  ))}
                </div>
                <Link to={plan.href} className={`${plan.btnClass} w-full text-center block`}>
                  {plan.btnLabel}
                </Link>
              </div>
            ))}
          </div>

          {/* Tasker note */}
          <div className="mt-10 max-w-3xl mx-auto">
            <div className="card p-6 bg-dark text-white border-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-xl"></div>
                <div>
                  <h3 className="font-heading font-bold">Earning as a Tasker</h3>
                  <p className="text-gray-400 text-sm">Always free to join. No subscription. No upfront cost.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {TASKER_PRICING.map(t => (
                  <div key={t.label} className="p-3 bg-white/5 rounded-xl">
                    <div className="text-xl mb-1">{t.emoji}</div>
                    <p className="font-semibold text-sm text-white">{t.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
                <p className="text-gray-400 text-sm">For individual tasks: Taskeeu charges <strong className="text-white">10%</strong> platform fee on workmanship</p>
                <Link to="/tasker/signup" className="btn-primary btn-sm">Apply as Tasker →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ENTERPRISE PLANS ─────────────────────────────────────── */}
      <section className="py-20 bg-white" id="enterprise">
        <div className="container-xl">
          <div className="text-center mb-12">
            <span className="inline-flex badge-orange mb-3">For Enterprises</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-dark mb-3">
              Taskeeu for Teams
            </h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              Africa's field operations infrastructure platform. Built for banks, telecoms, FMCG, insurance, NGOs, and any company running physical field tasks .
            </p>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4 mb-10">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-dark' : 'text-muted'}`}>Monthly</span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="toggle on-light" data-on={String(billingCycle === 'yearly')}
              aria-label="Toggle billing cycle"/>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-dark' : 'text-muted'}`}>
              Yearly <span className="badge-green ml-1">Save ₦1.2M</span>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Pricing card */}
            <div className="card p-8 border-2 border-rose-500 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                <Building2 size={11}/> ENTERPRISE
              </div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-2xl"></div>
                <div>
                  <h3 className="font-heading font-bold text-xl text-dark">Taskeeu for Teams</h3>
                  <p className="text-sm text-muted">Full field ops infrastructure</p>
                </div>
              </div>

              <div className="flex items-end gap-2 mb-2">
                <span className="font-heading font-black text-5xl text-dark">
                  {billingCycle === 'monthly' ? '₦200k' : '₦2.4M'}
                </span>
                <span className="text-muted mb-2 text-base">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
              </div>
              {billingCycle === 'monthly'? <p className="text-sm text-muted mb-2">Billed monthly. Cancel anytime.</p>
                : <p className="text-sm text-rose-600 font-semibold mb-2">You save ₦1,200,000 vs monthly billing </p>
              }

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-700 mb-5">Task costs (₦10k to ₦25k/person) are separate and funded from your Task Wallet, not the subscription fee.
              </div>

              <div className="space-y-2 mb-8">
                {ENTERPRISE_FEATURES.slice(0, 10).map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm">
                    <span className="flex-shrink-0 text-base">{f.emoji}</span>
                    <span className="text-gray-700">{f.text}</span>
                  </div>
                ))}
                <p className="text-xs text-rose-600 font-semibold pt-1">+ {ENTERPRISE_FEATURES.length - 10} more features →</p>
              </div>

              <div className="space-y-3">
                <Link to="/teams/register" className="btn-primary w-full text-center block btn-lg">
                  Register Your Company
                </Link>
                <Link to="/teams" className="btn-outline w-full text-center block text-sm">
                  Learn More About Teams →
                </Link>
              </div>
            </div>

            {/* Features column */}
            <div className="space-y-3">
              <h4 className="font-heading font-bold text-lg text-dark mb-4">Everything included:</h4>
              {ENTERPRISE_FEATURES.map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-surface rounded-xl">
                  <span className="flex-shrink-0 text-lg">{f.emoji}</span>
                  <span className="text-sm text-gray-700">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Add-on: Task costs breakdown */}
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="card p-6 bg-surface border border-gray-200">
              <h4 className="font-heading font-bold text-gray-800 mb-5">Enterprise Task Cost Reference (per person per task)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { name: 'Address Verification', price: 10000 },
                  { name: 'Delivery Verification', price: 10000 },
                  { name: 'Mystery Shopping', price: 11000 },
                  { name: 'Photo & Video Documentation', price: 11000 },
                  { name: 'Merchant Verification', price: 12000 },
                  { name: 'ATM Inspection', price: 12000 },
                  { name: 'Inventory Audits', price: 14000 },
                  { name: 'Property Inspection', price: 15000 },
                  { name: 'Brand Compliance Audits', price: 15000 },
                  { name: 'Solar Installation Verification', price: 18000 },
                  { name: 'Insurance Claims Inspection', price: 20000 },
                  { name: 'Construction Site Inspection', price: 20000 },
                  { name: 'Safety Compliance Audits', price: 22000 },
                  { name: 'Telecom Tower Inspection', price: 22000 },
                  { name: 'Drone Site Coverage', price: 25000 },
                  { name: 'Emergency Dispatch Tasks', price: 25000 },
                ].map(t => (
                  <div key={t.name} className="p-3 bg-white rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-700 font-medium leading-tight">{t.name}</p>
                    <p className="text-rose-600 font-bold text-sm mt-1.5">₦{Number(t.price).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted mt-4">* Members can bulk-modify prices (add, subtract, multiply, or divide) before submitting tasks. Custom task types also supported with member-defined pricing.</p>
              <p className="text-xs text-muted mt-1">* Taskeeu retains 20% of task workmanship as platform fee. Taskers receive 80%, paid 2 days after task completion and proof approval.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ─────────────────────────────────────── */}
      <section className="py-20 bg-surface">
        <div className="container-xl max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl font-bold text-dark">Individual vs Enterprise</h2>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold text-gray-600">Feature</th>
                    <th className="px-5 py-4 text-center font-semibold text-gray-600">Free</th>
                    <th className="px-5 py-4 text-center font-semibold text-rose-600">Pro </th>
                    <th className="px-5 py-4 text-center font-semibold text-gray-600">Teams </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Task posting', '3/month', 'Unlimited', 'Unlimited'],
                    ['Tasker bidding', '', '', '(Fixed prices)'],
                    ['Real-time chat', '', '', ''],
                    ['Escrow payments', 'Basic', 'Full suite', 'Full suite'],
                    ['Department management', 'Not included', 'Not included', ''],
                    ['Task wallet & budgets', 'Not included', 'Not included', ''],
                    ['GPS photo proof system', 'Not included', 'Not included', ''],
                    ['Line manager approval flow', 'Not included', 'Not included', ''],
                    ['Auto authorization letters', 'Not included', 'Not included', ''],
                    ['Broadcast to taskers', 'Not included', 'Not included', ''],
                    ['Video meeting integration', 'Not included', 'Not included', ''],
                    ['Multi-state deployment', 'Not included', 'Not included', ''],
                    ['Tasker blacklisting', 'Not included', 'Not included', ''],
                    ['HR & permission system', 'Not included', 'Not included', ''],
                    ['Platform fee on workmanship', '10%', '10%', '20%'],
                    ['Tasker payout timing', 'Instant', 'Instant', '2 days'],
                  ].map(([feat, free, pro, teams], i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-700">{feat}</td>
                      <td className="px-5 py-3 text-center text-gray-600">{free}</td>
                      <td className="px-5 py-3 text-center text-gray-700 font-medium">{pro}</td>
                      <td className="px-5 py-3 text-center text-rose-600 font-medium">{teams}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQs ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container-xl max-w-3xl">
          <div className="text-center mb-10">
            <span className="inline-flex badge-blue mb-3">FAQs</span>
            <h2 className="font-heading text-2xl font-bold text-dark">Pricing questions answered</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => <FAQ key={i} q={faq.q} a={faq.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-20 hero-gradient hero-mesh">
        <div className="container-xl text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to outsource across Africa?
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            Start for free with individual tasks or set up your company account to power nationwide field operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth" className="btn-primary btn-lg">Get Started Free</Link>
            <Link to="/teams/register" className="bg-white/10 border border-white/25 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/20 transition-colors text-lg">
              Register Company →
            </Link>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
