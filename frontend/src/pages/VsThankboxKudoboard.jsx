import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';

const CHECK = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100"><Icon name="Check" size={14} className="text-green-600" strokeWidth={3} /></span>;
const CROSS = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50"><Icon name="X" size={14} className="text-red-400" strokeWidth={3} /></span>;
const PARTIAL = <span className="text-xs text-warm-400 font-medium">Limited</span>;

const ROWS = [
  { feature: 'Online group cards', thankbox: CHECK, kudoboard: CHECK, thankeeu: CHECK },
  { feature: 'Gift collection', thankbox: CHECK, kudoboard: PARTIAL, thankeeu: CHECK },
  { feature: 'No account needed for signers', thankbox: CHECK, kudoboard: CHECK, thankeeu: CHECK },
  { feature: 'Dedicated company subdomain', thankbox: CROSS, kudoboard: CROSS, thankeeu: CHECK },
  { feature: 'Private HR and employee workspace', thankbox: CROSS, kudoboard: PARTIAL, thankeeu: CHECK },
  { feature: 'Employee recognition automation', thankbox: PARTIAL, kudoboard: CHECK, thankeeu: CHECK },
  { feature: 'HRIS sync', thankbox: CROSS, kudoboard: PARTIAL, thankeeu: CHECK },
  { feature: 'Live event photo wall', thankbox: CROSS, kudoboard: CROSS, thankeeu: CHECK },
  { feature: 'Automatic memory movie', thankbox: CROSS, kudoboard: CROSS, thankeeu: CHECK },
  { feature: 'NGN and African payments', thankbox: CROSS, kudoboard: CROSS, thankeeu: CHECK },
  { feature: 'GBP, USD and global currencies', thankbox: CHECK, kudoboard: PARTIAL, thankeeu: CHECK },
];

const PLATFORMS = [
  {
    name: 'Thankbox',
    icon: 'Mail',
    colour: '#0ea5e9',
    bg: '#f0f9ff',
    summary: 'Best known for UK group cards and gift collections. Strong for simple farewell and birthday cards, but not designed as a company-owned workspace platform.',
  },
  {
    name: 'Kudoboard',
    icon: 'Award',
    colour: '#f59e0b',
    bg: '#fffbeb',
    summary: 'A US-first group card and recognition product. Useful for American teams, but less practical for African offices, NGN payments and dedicated subdomain workspaces.',
  },
  {
    name: 'Thankeeu',
    icon: 'Building',
    colour: '#7C3AED',
    bg: '#F5F0FF',
    summary: 'A group card, gift and employee recognition workspace. Companies get private subdomains like flutterwave.thankeeu.com, with HR/member login, HRIS sync, approvals and local currencies.',
  },
];

export default function VsThankboxKudoboard() {
  useSEO({
    title: 'Thankeeu vs Thankbox vs Kudoboard - Employee Recognition Comparison',
    description: 'Compare Thankeeu, Thankbox and Kudoboard for group cards, gifts and employee recognition. Thankeeu adds dedicated company workspace subdomains like flutterwave.thankeeu.com, HR/member dashboards, HRIS sync, NGN payments, Live Memory Wall and Memory Movie.',
    keywords: 'Thankeeu vs Thankbox vs Kudoboard, Thankbox vs Kudoboard vs Thankeeu, employee recognition platform comparison, group card comparison, company workspace subdomain, flutterwave.thankeeu.com, HR group cards, Kudoboard alternative, Thankbox alternative',
    canonical: '/thankeeu-vs-thankbox-vs-kudoboard',
  });

  return (
    <>
      <Navbar />

      <section className="bg-gradient-to-br from-[#0d0020] to-[#2d1052] text-white pt-20 pb-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-300 mb-4">Three-way comparison</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">Thankeeu vs Thankbox vs Kudoboard</h1>
          <p className="text-white/70 text-lg max-w-3xl mx-auto mb-8">
            Thankbox is strong for UK cards. Kudoboard is strong for US recognition. Thankeeu combines group cards, gifts and employee recognition with dedicated company workspaces like flutterwave.thankeeu.com.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/business" className="px-7 py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 font-bold text-sm transition-all">Explore company workspaces</Link>
            <Link to="/thankeeu-vs-thankbox" className="px-7 py-3 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-sm border border-white/20 transition-all">Compare Thankbox</Link>
            <Link to="/thankeeu-vs-kudoboard" className="px-7 py-3 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-sm border border-white/20 transition-all">Compare Kudoboard</Link>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {PLATFORMS.map(({ name, icon, colour, bg, summary }) => (
              <div key={name} className="rounded-2xl p-6 border-2" style={{ background: bg, borderColor: `${colour}30` }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${colour}18` }}>
                    <Icon name={icon} size={20} style={{ color: colour }} />
                  </span>
                  <h2 className="font-extrabold text-warm-900">{name}</h2>
                </div>
                <p className="text-sm text-warm-600 leading-relaxed">{summary}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl p-6 border-2 mb-10 bg-primary-50 border-primary-100">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center"><Icon name="LayoutDashboard" size={20} className="text-primary-600" /></span>
              <h2 className="text-xl font-extrabold text-warm-900">The high-value Thankeeu feature: dedicated company workspaces</h2>
            </div>
            <p className="text-sm text-warm-600 leading-relaxed">
              Thankeeu lets a company run employee recognition from a private, company-owned Thankeeu subdomain. Examples include <strong>flutterwave.thankeeu.com</strong>, <strong>mtn.thankeeu.com</strong> and <strong>access-bank.thankeeu.com</strong>. The workspace becomes the home for HR sign-in, employee sign-in, member signup, birthdays, work anniversaries, farewell cards, gift pools, gift cards, approvals and HRIS sync.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-purple-100 shadow-sm bg-white">
            <table className="w-full">
              <thead>
                <tr className="bg-purple-50 border-b border-purple-100">
                  <th className="text-left p-4 text-sm font-bold text-warm-700">Feature</th>
                  <th className="text-center p-4 text-sm font-bold text-warm-400">Thankbox</th>
                  <th className="text-center p-4 text-sm font-bold text-warm-400">Kudoboard</th>
                  <th className="text-center p-4 text-sm font-bold text-primary-600">Thankeeu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {ROWS.map(({ feature, thankbox, kudoboard, thankeeu }) => (
                  <tr key={feature} className="hover:bg-purple-50/40 transition-colors">
                    <td className="p-4 text-sm text-warm-700">{feature}</td>
                    <td className="p-4 text-center">{thankbox}</td>
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
          <h2 className="text-2xl font-extrabold text-warm-900 text-center mb-6">Which platform should companies choose?</h2>
          <div className="space-y-3">
            {[
              ['Choose Thankbox', 'if you mainly need simple UK group cards and GBP gift collection.'],
              ['Choose Kudoboard', 'if you are a US-first company already budgeting for USD recognition tools.'],
              ['Choose Thankeeu', 'if you want group cards, gifts and employee recognition inside a private company workspace with HR automation, local currencies and employee accounts.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-purple-100 bg-white p-5">
                <p className="font-bold text-warm-900">{title}</p>
                <p className="text-sm text-warm-500 mt-1">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 text-center bg-gradient-to-br from-[#0d0020] to-[#2d1052] text-white">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-extrabold mb-3">Move employee recognition into your own workspace.</h2>
          <p className="text-white/60 mb-8">Cards, gifts, HRIS sync and employee dashboards under your company subdomain.</p>
          <Link to="/business" className="px-8 py-4 rounded-2xl bg-primary-500 hover:bg-primary-600 font-bold inline-block transition-all">Book a company demo</Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
