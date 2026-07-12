import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';

const CHECK = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100"><Icon name="Check" size={14} className="text-green-600" strokeWidth={3}/></span>;
const CROSS = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50"><Icon name="X" size={14} className="text-red-400" strokeWidth={3}/></span>;
const PARTIAL = <span className="text-xs text-warm-400 font-medium">Paid plans</span>;

const ROWS = [
  { feature: 'Online group card',                      kudoboard: CHECK,   thankeeu: CHECK },
  { feature: 'No account needed to sign',              kudoboard: CHECK,   thankeeu: CHECK },
  { feature: 'Photo & video messages',                 kudoboard: CHECK,   thankeeu: CHECK },
  { feature: 'Pooled gift collection',                 kudoboard: PARTIAL, thankeeu: CHECK },
  { feature: 'Free to create & share',                 kudoboard: PARTIAL, thankeeu: CHECK },
  { feature: 'Voice note messages',                    kudoboard: CROSS,   thankeeu: CHECK },
  { feature: 'Live Photo Wall via QR code',            kudoboard: CROSS,   thankeeu: CHECK },
  { feature: 'Auto Memory Movie™',                    kudoboard: CROSS,   thankeeu: CHECK },
  { feature: 'NGN / African currency payments',        kudoboard: CROSS,   thankeeu: CHECK },
  { feature: 'GBP payments',                          kudoboard: PARTIAL, thankeeu: CHECK },
  { feature: 'HRIS integration (Nigerian platforms)',  kudoboard: CROSS,   thankeeu: CHECK },
  { feature: 'Automated birthday & work anniversary',  kudoboard: PARTIAL, thankeeu: CHECK },
  { feature: 'Nigerian occasion types',                kudoboard: CROSS,   thankeeu: CHECK },
  { feature: 'Affordable for small teams',             kudoboard: CROSS,   thankeeu: CHECK },
];

const FAQS = [
  { q: 'What is Kudoboard?', a: 'Kudoboard is a US-based online group card and recognition platform popular among American companies. It supports team kudos, milestone cards, and group GIF boards. Pricing is in USD only.' },
  { q: 'Is Kudoboard free?', a: 'Kudoboard\'s free plan allows only one board per email address with limited posts. Sending and full features require a paid subscription. Thankeeu is also pay-per-send but has a more flexible credit model and is significantly cheaper for NGN users.' },
  { q: 'Does Kudoboard work in Nigeria?', a: 'Kudoboard is USD-only and relies on Stripe, which limits payment access in Nigeria. There is no NGN support, no Flutterwave integration, and no HRIS sync with Nigerian platforms like SeamlessHR or WorkPay.' },
  { q: 'Which is better for HR teams in Nigeria?', a: 'Thankeeu was built for Nigerian HR teams. It integrates with SeamlessHR, BambooHR, Zoho People, and WorkPay; accepts Naira payments; automates birthday and work anniversary cards; and has a live guest photo wall for team events. Kudoboard has none of these for the Nigerian market.' },
  { q: 'How does Thankeeu compare to Kudoboard on pricing?', a: 'Kudoboard charges per month per team, which gets expensive. Thankeeu uses a pay-per-card credit model — buy credits when you need them. For Nigerian teams, prices start from NGN 4,000 per card (about $2.50), which is a fraction of Kudoboard\'s USD subscription cost.' },
];

export default function VsKudoboard() {
  useSEO({
    title: 'Thankeeu vs Kudoboard — Best Group Card for Nigerian & Global Teams (2025)',
    description: 'Thankeeu vs Kudoboard: which is better for group cards, team recognition and gifts? Kudoboard is US-only. Thankeeu works in NGN, GBP and USD with HRIS integration, live photo walls and Memory Movie. Full feature comparison.',
    keywords: 'Thankeeu vs Kudoboard, Kudoboard alternative Nigeria, Kudoboard alternative UK, group card for teams, online kudos platform Nigeria, work anniversary card platform, birthday card for teams Nigeria, employee recognition platform Nigeria',
    canonical: '/thankeeu-vs-kudoboard',
  });

  return (
    <>
      <Navbar />

      <section className="bg-gradient-to-br from-[#0d0020] to-[#2d1052] text-white pt-20 pb-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-300 mb-4">Comparison</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">Thankeeu vs Kudoboard</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-8">Kudoboard is US-first, USD-only, and has no live photo wall. Thankeeu works in Naira, GBP, and USD — with HRIS sync and a live Memory Wall for every event.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/card/new" className="px-7 py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 font-bold text-sm transition-all">Try Thankeeu Free</Link>
            <Link to="/pricing" className="px-7 py-3 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-sm border border-white/20 transition-all">See pricing</Link>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-5 mb-10">
            {[
              { name: 'Kudoboard', icon: 'Award', colour: '#f59e0b', bg: '#fffbeb',
                verdict: 'A US group card and employee recognition platform. Good for American companies. USD-only, no live photo wall, no Nigerian HRIS integration, expensive for small teams.',
                best: 'US-based companies with USD budgets and no need for African market support.' },
              { name: 'Thankeeu', icon: 'Sparkles', colour: '#7C3AED', bg: '#F5F0FF',
                verdict: 'Full group card platform with Naira payments, HRIS sync, live photo walls, and Memory Movies. Credit-based pricing — affordable for teams of all sizes in Nigeria, UK and beyond.',
                best: 'Nigerian HR teams, global companies with African offices, and anyone who wants more than a card.' },
            ].map(({ name, icon, colour, bg, verdict, best }) => (
              <div key={name} className="rounded-2xl p-6 border-2" style={{ background: bg, borderColor: colour + '30' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: colour + '18' }}>
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
          <h2 className="text-2xl font-extrabold mb-3">The group card platform built for your market.</h2>
          <p className="text-white/60 mb-8">NGN, GBP or USD — we've got you covered.</p>
          <Link to="/card/new" className="px-8 py-4 rounded-2xl bg-primary-500 hover:bg-primary-600 font-bold inline-block transition-all">Create a free group card</Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
