import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';

const CHECK = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100"><Icon name="Check" size={14} className="text-green-600" strokeWidth={3} /></span>;
const CROSS = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50"><Icon name="X" size={14} className="text-red-400" strokeWidth={3} /></span>;
const PARTIAL = <span className="text-xs text-warm-400 font-medium">Limited</span>;

const ROWS = [
  { feature: 'Online group card everyone signs', thankbox: CHECK, thankeeu: CHECK },
  { feature: 'No account needed to sign', thankbox: CHECK, thankeeu: CHECK },
  { feature: 'Video and voice note messages', thankbox: CHECK, thankeeu: CHECK },
  { feature: 'Pooled group gift collection', thankbox: CHECK, thankeeu: CHECK },
  { feature: 'Scheduled delivery', thankbox: CHECK, thankeeu: CHECK },
  { feature: 'Dedicated company workspace subdomain', thankbox: CROSS, thankeeu: CHECK },
  { feature: 'HR and employee sign-in portal', thankbox: CROSS, thankeeu: CHECK },
  { feature: 'Employee recognition dashboard', thankbox: PARTIAL, thankeeu: CHECK },
  { feature: 'HRIS sync for occasion automation', thankbox: CROSS, thankeeu: CHECK },
  { feature: 'Live Photo Wall with QR uploads', thankbox: CROSS, thankeeu: CHECK },
  { feature: 'Auto Memory Movie from card content', thankbox: CROSS, thankeeu: CHECK },
  { feature: 'Nigerian Naira payments', thankbox: CROSS, thankeeu: CHECK },
  { feature: 'Flutterwave and local bank payments', thankbox: CROSS, thankeeu: CHECK },
  { feature: 'GBP payments', thankbox: CHECK, thankeeu: CHECK },
];

const FAQS = [
  {
    q: 'How is Thankeeu different from Thankbox?',
    a: 'Thankbox is strong for simple UK group cards. Thankeeu adds company-owned workspaces such as flutterwave.thankeeu.com, HR and employee dashboards, HRIS sync, automated employee recognition, Live Memory Wall, Memory Movie and NGN payments through Flutterwave.',
  },
  {
    q: 'Does Thankeeu give companies their own subdomain?',
    a: 'Yes. Every registered company can use a dedicated Thankeeu workspace such as flutterwave.thankeeu.com, mtn.thankeeu.com or access-bank.thankeeu.com. HR admins and employees sign in there for cards, approvals, directories, gift cards, HRIS sync and recognition workflows.',
  },
  {
    q: 'Is Thankeeu better for employee recognition?',
    a: 'For teams that want more than one-off cards, yes. Thankeeu combines group cards, employee accounts, work anniversary and birthday automation, approvals, gift pools and company workspace dashboards in one system.',
  },
  {
    q: 'Does Thankbox work in Nigeria?',
    a: 'Thankbox is UK and Stripe focused. Thankeeu supports Naira, Flutterwave, Nigerian bank cards and African/global currencies, making it more practical for Nigerian teams and companies with African offices.',
  },
  {
    q: 'Which should HR teams choose?',
    a: 'Choose Thankbox for a simple UK card flow. Choose Thankeeu when you need employee recognition automation, dedicated company workspaces, HRIS sync, local currencies and private HR/member dashboards.',
  },
];

export default function VsThankbox() {
  useSEO({
    title: 'Thankeeu vs Thankbox - Group Cards, Gifts & Company Workspaces',
    description: 'Thankeeu vs Thankbox for online group cards, gifts and employee recognition. Thankeeu adds dedicated company subdomain workspaces like flutterwave.thankeeu.com, HR dashboards, HRIS sync, Memory Movie, Live Photo Wall and native Naira payments.',
    keywords: 'Thankeeu vs Thankbox, Thankbox alternative, employee recognition workspace, company group card workspace, dedicated company subdomain, flutterwave.thankeeu.com, HR group cards, online farewell card, group birthday card platform',
    canonical: '/thankeeu-vs-thankbox',
  });

  return (
    <>
      <Navbar />

      <section className="bg-gradient-to-br from-[#0d0020] to-[#2d1052] text-white pt-20 pb-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-300 mb-4">Comparison</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">Thankeeu vs Thankbox</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-8">
            Both help teams collect group card messages. Thankeeu also gives companies a dedicated employee recognition workspace, like flutterwave.thankeeu.com, with HR and member sign-in built in.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/business" className="px-7 py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 font-bold text-sm transition-all">Explore company workspaces</Link>
            <Link to="/card/new" className="px-7 py-3 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-sm border border-white/20 transition-all">Try Thankeeu free</Link>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-5 mb-10">
            {[
              {
                name: 'Thankbox',
                icon: 'Mail',
                colour: '#0ea5e9',
                bg: '#f0f9ff',
                verdict: 'A polished UK group card and gift collection product. Best for simple farewell cards and work occasion cards, but it does not provide company-owned subdomain workspaces, Naira payments or native HRIS sync.',
                best: 'UK and US teams that only need straightforward group cards.',
              },
              {
                name: 'Thankeeu',
                icon: 'Building',
                colour: '#7C3AED',
                bg: '#F5F0FF',
                verdict: 'A group card, gift and employee recognition workspace platform. Each company can get a dedicated subdomain with HR tools, employee accounts, approvals, HRIS sync and recognition automation.',
                best: 'Companies that want a branded recognition hub, not just one-off cards.',
              },
            ].map(({ name, icon, colour, bg, verdict, best }) => (
              <div key={name} className="rounded-2xl p-6 border-2" style={{ background: bg, borderColor: `${colour}30` }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${colour}18` }}>
                    <Icon name={icon} size={20} style={{ color: colour }} />
                  </div>
                  <h2 className="font-extrabold text-warm-900">{name}</h2>
                </div>
                <p className="text-warm-600 text-sm mb-3 leading-relaxed">{verdict}</p>
                <p className="text-xs font-bold text-warm-400 uppercase tracking-wide mb-1">Best for</p>
                <p className="text-sm text-warm-700">{best}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl p-6 border-2 mb-10 bg-primary-50 border-primary-100">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center"><Icon name="LayoutDashboard" size={20} className="text-primary-600" /></span>
              <h2 className="text-xl font-extrabold text-warm-900">Thankeeu adds dedicated company workspaces</h2>
            </div>
            <p className="text-sm text-warm-600 leading-relaxed">
              A company can run recognition from its own Thankeeu subdomain, for example <strong>flutterwave.thankeeu.com</strong>, <strong>mtn.thankeeu.com</strong> or <strong>access-bank.thankeeu.com</strong>. HR admins and employees use that workspace for sign in, member signup, employee directories, approval queues, gift cards, HRIS sync and automated birthdays, anniversaries, farewells and promotions.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-purple-100 shadow-sm bg-white">
            <table className="w-full">
              <thead>
                <tr className="bg-purple-50 border-b border-purple-100">
                  <th className="text-left p-4 text-sm font-bold text-warm-700">Feature</th>
                  <th className="text-center p-4 text-sm font-bold text-warm-400">Thankbox</th>
                  <th className="text-center p-4 text-sm font-bold text-primary-600">Thankeeu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {ROWS.map(({ feature, thankbox, thankeeu }) => (
                  <tr key={feature} className="hover:bg-purple-50/40 transition-colors">
                    <td className="p-4 text-sm text-warm-700">{feature}</td>
                    <td className="p-4 text-center">{thankbox}</td>
                    <td className="p-4 text-center">{thankeeu}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-purple-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-warm-900 text-center mb-6">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="rounded-2xl border border-purple-100 bg-white group">
                <summary className="px-5 py-4 font-semibold text-warm-800 text-sm cursor-pointer list-none flex items-center justify-between">
                  {q}<Icon name="ChevronDown" size={16} className="text-warm-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-3" />
                </summary>
                <p className="px-5 pb-4 text-sm text-warm-500 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 text-center bg-gradient-to-br from-[#0d0020] to-[#2d1052] text-white">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-extrabold mb-3">Give your company its own recognition workspace.</h2>
          <p className="text-white/60 mb-8">Employee cards, gift pools, approvals and HR automation in one branded place.</p>
          <Link to="/business" className="px-8 py-4 rounded-2xl bg-primary-500 hover:bg-primary-600 font-bold inline-block transition-all">Book a company demo</Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
