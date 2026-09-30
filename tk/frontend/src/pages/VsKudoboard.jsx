import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';

const CHECK = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100"><Icon name="Check" size={14} className="text-green-600" strokeWidth={3} /></span>;
const CROSS = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50"><Icon name="X" size={14} className="text-red-400" strokeWidth={3} /></span>;
const PARTIAL = <span className="text-xs text-warm-400 font-medium">Paid plans</span>;

const ROWS = [
  { feature: 'Online group card', kudoboard: CHECK, thankeeu: CHECK },
  { feature: 'No account needed to sign', kudoboard: CHECK, thankeeu: CHECK },
  { feature: 'Photo and video messages', kudoboard: CHECK, thankeeu: CHECK },
  { feature: 'Pooled gift collection', kudoboard: PARTIAL, thankeeu: CHECK },
  { feature: 'Voice note messages', kudoboard: CROSS, thankeeu: CHECK },
  { feature: 'Dedicated company workspace subdomain', kudoboard: CROSS, thankeeu: CHECK },
  { feature: 'HR and employee sign-in portal', kudoboard: PARTIAL, thankeeu: CHECK },
  { feature: 'Employee recognition workspace dashboards', kudoboard: PARTIAL, thankeeu: CHECK },
  { feature: 'HRIS sync for automated occasions', kudoboard: PARTIAL, thankeeu: CHECK },
  { feature: 'Live Photo Wall with QR code', kudoboard: CROSS, thankeeu: CHECK },
  { feature: 'Auto Memory Movie from card content', kudoboard: CROSS, thankeeu: CHECK },
  { feature: 'NGN and African currency payments', kudoboard: CROSS, thankeeu: CHECK },
  { feature: 'Nigerian occasion types', kudoboard: CROSS, thankeeu: CHECK },
  { feature: 'Affordable for small teams', kudoboard: CROSS, thankeeu: CHECK },
];

const FAQS = [
  {
    q: 'What is Kudoboard?',
    a: 'Kudoboard is a US-based online group card and employee recognition platform. It is popular with American companies and is priced around USD workflows.',
  },
  {
    q: 'How is Thankeeu different from Kudoboard?',
    a: 'Thankeeu supports group cards, gift pools and employee recognition, but also adds dedicated company workspace subdomains such as flutterwave.thankeeu.com, HR and member dashboards, native NGN payments, African/global currencies, Live Memory Wall and Memory Movie.',
  },
  {
    q: 'Does Thankeeu give each company its own workspace?',
    a: 'Yes. A company can use its own Thankeeu subdomain such as flutterwave.thankeeu.com or mtn.thankeeu.com for HR login, employee login, member signup, approvals, gift cards, HRIS sync and employee recognition automation.',
  },
  {
    q: 'Which is better for HR teams in Nigeria?',
    a: 'Thankeeu is built for Nigerian and global teams with African offices. It accepts Naira via Flutterwave, supports Nigerian occasions, and can connect employee records to birthdays, work anniversaries, farewells and promotions.',
  },
  {
    q: 'How does Thankeeu compare to Kudoboard on pricing?',
    a: 'Kudoboard is USD-first and subscription-led. Thankeeu supports local currencies and lets companies run group cards and recognition from a dedicated workspace, which is more practical for smaller teams and African offices.',
  },
];

export default function VsKudoboard() {
  useSEO({
    title: 'Thankeeu vs Kudoboard - Employee Recognition Workspaces',
    description: 'Thankeeu vs Kudoboard for group cards, gifts and employee recognition. Thankeeu adds dedicated company workspace subdomains like flutterwave.thankeeu.com, HR/member dashboards, NGN payments, HRIS sync, Live Memory Wall and Memory Movie.',
    keywords: 'Thankeeu vs Kudoboard, Kudoboard alternative Nigeria, Kudoboard alternative UK, employee recognition workspace, dedicated company subdomain, flutterwave.thankeeu.com, company group cards, online kudos platform Nigeria, birthday card for teams Nigeria',
    canonical: '/thankeeu-vs-kudoboard',
  });

  return (
    <>
      <Navbar />

      <section className="bg-gradient-to-br from-[#0d0020] to-[#2d1052] text-white pt-20 pb-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-300 mb-4">Comparison</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">Thankeeu vs Kudoboard</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-8">
            Kudoboard is US-first. Thankeeu is built for global and African teams that need group cards, local gift payments and dedicated employee recognition workspaces.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/business" className="px-7 py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 font-bold text-sm transition-all">Explore company workspaces</Link>
            <Link to="/pricing" className="px-7 py-3 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-sm border border-white/20 transition-all">See pricing</Link>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-5 mb-10">
            {[
              {
                name: 'Kudoboard',
                icon: 'Award',
                colour: '#f59e0b',
                bg: '#fffbeb',
                verdict: 'A US group card and recognition platform. Useful for American companies with USD budgets, but not designed around African currencies, Flutterwave payments or company-owned Thankeeu-style subdomains.',
                best: 'US companies with USD budgets and standard recognition requirements.',
              },
              {
                name: 'Thankeeu',
                icon: 'Building',
                colour: '#7C3AED',
                bg: '#F5F0FF',
                verdict: 'A group card, gift and employee recognition platform with dedicated company workspace subdomains, HR/member dashboards, NGN/GBP/USD gifts, HRIS sync and event memory tools.',
                best: 'Nigerian HR teams, global companies with African offices, and teams that want a branded recognition hub.',
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
              <span className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center"><Icon name="Globe" size={20} className="text-primary-600" /></span>
              <h2 className="text-xl font-extrabold text-warm-900">Company-owned workspaces are the big difference</h2>
            </div>
            <p className="text-sm text-warm-600 leading-relaxed">
              Thankeeu lets companies create a private recognition portal on a dedicated subdomain, for example <strong>flutterwave.thankeeu.com</strong>. Employees can sign in or sign up there, while HR manages birthdays, work anniversaries, farewells, approvals, gift cards and HRIS sync from the same workspace.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-purple-100 shadow-sm bg-white">
            <table className="w-full">
              <thead>
                <tr className="bg-purple-50 border-b border-purple-100">
                  <th className="text-left p-4 text-sm font-bold text-warm-700">Feature</th>
                  <th className="text-center p-4 text-sm font-bold text-warm-400">Kudoboard</th>
                  <th className="text-center p-4 text-sm font-bold text-primary-600">Thankeeu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {ROWS.map(({ feature, kudoboard, thankeeu }) => (
                  <tr key={feature} className="hover:bg-purple-50/40 transition-colors">
                    <td className="p-4 text-sm text-warm-700">{feature}</td>
                    <td className="p-4 text-center">{kudoboard}</td>
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
          <h2 className="text-2xl font-extrabold mb-3">The recognition workspace built for your market.</h2>
          <p className="text-white/60 mb-8">NGN, GBP or USD, with a private company workspace for HR and employees.</p>
          <Link to="/business" className="px-8 py-4 rounded-2xl bg-primary-500 hover:bg-primary-600 font-bold inline-block transition-all">Book a company demo</Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
