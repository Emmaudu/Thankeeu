import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';

const CHECK = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100"><Icon name="Check" size={14} className="text-green-600" strokeWidth={3}/></span>;
const CROSS = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50"><Icon name="X" size={14} className="text-red-400" strokeWidth={3}/></span>;
const PARTIAL = <span className="text-xs text-warm-400 font-medium">Paid only</span>;

const ROWS = [
  { feature: 'Online group card (everyone signs)',     thankbox: CHECK,   thankeeu: CHECK },
  { feature: 'No account needed to sign',              thankbox: CHECK,   thankeeu: CHECK },
  { feature: 'Video & voice note messages',            thankbox: CHECK,   thankeeu: CHECK },
  { feature: 'Pooled group gift collection',           thankbox: CHECK,   thankeeu: CHECK },
  { feature: 'Scheduled delivery',                     thankbox: CHECK,   thankeeu: CHECK },
  { feature: 'Live Photo Wall — guest QR uploads',     thankbox: CROSS,   thankeeu: CHECK },
  { feature: 'Auto Memory Movie™ from card content',  thankbox: CROSS,   thankeeu: CHECK },
  { feature: 'Nigerian Naira (NGN) payments',          thankbox: CROSS,   thankeeu: CHECK },
  { feature: 'Flutterwave / local bank payments',      thankbox: CROSS,   thankeeu: CHECK },
  { feature: 'Nigerian occasion types (owambe etc)',   thankbox: CROSS,   thankeeu: CHECK },
  { feature: 'GBP payments',                          thankbox: CHECK,   thankeeu: CHECK },
  { feature: 'HRIS sync (SeamlessHR, BambooHR)',       thankbox: CROSS,   thankeeu: CHECK },
  { feature: 'HR occasion automation',                 thankbox: PARTIAL, thankeeu: CHECK },
  { feature: 'Free to create & share',                 thankbox: PARTIAL, thankeeu: CHECK },
];

const FAQS = [
  { q: 'What is Thankbox?', a: 'Thankbox is a UK-based online group card platform where colleagues and friends sign a shared digital card and pool a gift. It\'s popular for farewell cards and work anniversaries in the UK and US.' },
  { q: 'How is Thankeeu different from Thankbox?', a: 'Thankbox and Thankeeu both do group cards well. The key differences: Thankeeu adds a Live Memory Wall where event guests can upload real-time photos via QR code, auto-generates a Memory Movie™ from all card content, and fully supports Nigerian payments via Flutterwave — features Thankbox does not have.' },
  { q: 'Does Thankbox work in Nigeria?', a: 'Thankbox processes payments via Stripe in GBP and USD — it does not support Naira or Flutterwave. Nigerian users report difficulty completing payments. Thankeeu is built specifically for the Nigerian market and supports every Nigerian bank card, USSD, and mobile money via Flutterwave.' },
  { q: 'Is Thankbox free?', a: 'Thankbox requires payment before a card can be sent — free accounts can only create cards but cannot send them without upgrading. Thankeeu works the same way: free to create, pay when you send. Prices are comparable in GBP; Thankeeu is significantly cheaper in Naira.' },
  { q: 'Which has better HRIS integration?', a: 'Thankeeu integrates natively with SeamlessHR, BambooHR, Zoho People, and WorkPay. Thankbox does not offer native HRIS integration. For HR teams automating birthday and work anniversary cards, Thankeeu is the better choice.' },
];

export default function VsThankbox() {
  useSEO({
    title: 'Thankeeu vs Thankbox — Group Card Comparison (2025)',
    description: 'Comparing Thankeeu vs Thankbox for online group cards and gifts. Both do group cards — but Thankeeu adds a Live Photo Wall, Memory Movie, and native Naira payments. Better for Nigerian teams and global users. Full feature comparison.',
    keywords: 'Thankeeu vs Thankbox, Thankbox alternative, Thankbox Nigeria, online group card comparison, group card app UK, best group card platform, Thankbox vs alternative, online farewell card, group birthday card platform',
    canonical: '/thankeeu-vs-thankbox',
  });

  return (
    <>
      <Navbar />

      <section className="bg-gradient-to-br from-[#0d0020] to-[#2d1052] text-white pt-20 pb-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-300 mb-4">Comparison</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">Thankeeu vs Thankbox</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-8">Both are online group card platforms. One works in Naira and comes with a live photo wall and cinematic movie. Guess which.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/card/new" className="px-7 py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 font-bold text-sm transition-all">Try Thankeeu Free</Link>
            <Link to="/how-it-works" className="px-7 py-3 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-sm border border-white/20 transition-all">See how it works</Link>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-5 mb-10">
            {[
              { name: 'Thankbox', icon: 'Mail', colour: '#0ea5e9', bg: '#f0f9ff',
                verdict: 'A solid UK group card platform. Clean design, GBP gift collection, widely used for farewells and work occasions in the UK. Does not support Naira or HRIS automation.',
                best: 'UK/US companies not needing Nigerian payments or live photo walls.' },
              { name: 'Thankeeu', icon: 'Sparkles', colour: '#7C3AED', bg: '#F5F0FF',
                verdict: 'Group cards with Naira/GBP/USD support, HRIS sync, live guest photo wall, auto Memory Movie, and Nigerian occasion types. Built for Nigerian and global teams.',
                best: 'Nigerian companies and global teams who want more than a card.' },
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
          <h2 className="text-2xl font-extrabold mb-3">Group cards that actually work for your team — wherever they are.</h2>
          <p className="text-white/60 mb-8">Nigeria, UK, US or anywhere in between.</p>
          <Link to="/card/new" className="px-8 py-4 rounded-2xl bg-primary-500 hover:bg-primary-600 font-bold inline-block transition-all">Create a free group card</Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
