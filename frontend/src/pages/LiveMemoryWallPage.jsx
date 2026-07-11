import { Link } from 'react-router-dom';
import { useSEO, SCHEMAS } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';

const OCCASIONS = ['Birthday','Wedding','Baby Shower','Graduation','Farewell','Retirement','Anniversary','Memorial','Church Conference','Pastor Appreciation','Employee Appreciation','Office Party','Team Retreat','Baby Dedication','Engagement','Housewarming'];
const FAQS = [
  ['What is a Live Memory Wall?','A Live Memory Wall is a shared, real-time photo and video timeline that everyone at your celebration can contribute to. Unlike Instagram Stories, it never disappears — every upload is preserved forever as a permanent keepsake.'],
  ['How do contributors add to the Memory Wall?','You share one link. Anyone with the link can upload a photo, video or caption instantly — no account needed, no app to download. It works from any phone or computer.'],
  ['Does the Memory Wall replace the group card?','Not unless you want it to. You can choose Group Card Only, Live Memory Wall Only, or both together. The recommended option is both — contributors write heartfelt messages AND upload event photos to the wall.'],
  ['What happens to the Memory Wall after the event?','Everything is preserved forever. Visitors can browse, download, search and share every memory. The wall also feeds into the automatic Thankeeu Memory Movie™.'],
  ['Is the Live Memory Wall included on all plans?','Yes — the Live Memory Wall is included on every Thankeeu plan, from Classic through to team subscriptions.'],
];

export default function LiveMemoryWallPage() {
  useSEO({
    title: 'Live Memory Wall™ — Collect Every Photo & Video From Your Event | Thankeeu',
    description: 'Your Instagram Stories disappear. Your memories shouldn\'t. Collect every photo, video and moment from everyone at your celebration in one beautiful shared memory wall that lasts forever.',
    keywords: 'live memory wall, shared photo wall event, collect wedding photos guests, birthday memory wall, event photo collection, collaborative memory album, group photo sharing event',
    canonical: '/live-memory-wall',
    locale: 'en',
    jsonLd: [SCHEMAS.organization, SCHEMAS.faqPage(FAQS.map(([q,a])=>({q,a})))],
  });

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0d0020] via-[#1a0533] to-[#2d1052] text-white pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-xs font-bold uppercase tracking-widest border border-white/20 mb-6">
            📸 New Feature
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-tight mb-6">
            Your Instagram Stories disappear.
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
              Your memories shouldn't.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10">
            Collect every photo, video and moment from everyone at your celebration in one beautiful shared memory wall that lasts forever.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/card/new" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 font-bold text-lg shadow-xl transition-all hover:scale-105">
              Create Memory Wall →
            </Link>
            <Link to="/sample" className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-lg border border-white/20 transition-all">
              Watch Demo
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-center text-warm-900 mb-12">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step:1, icon:'Link', title:'Share one link', desc:'Share a single link with everyone attending — via WhatsApp, QR code at the venue, or email. No account needed to contribute.' },
              { step:2, icon:'Upload', title:'Everyone uploads', desc:'Guests instantly upload photos, videos and short captions throughout the event. Every upload appears on the wall in real time.' },
              { step:3, icon:'Heart', title:'Preserved forever', desc:'The wall never disappears. Every photo, video and caption is kept permanently — and automatically becomes part of the Memory Movie.' },
            ].map(({step,icon,title,desc}) => (
              <div key={step} className="text-center p-6 rounded-2xl bg-purple-50 border border-purple-100">
                <div className="w-10 h-10 rounded-full bg-primary-500 text-white font-bold flex items-center justify-center mx-auto mb-4 text-lg">{step}</div>
                <Icon name={icon} size={28} className="text-primary-400 mx-auto mb-3" />
                <h3 className="font-bold text-warm-900 mb-2">{title}</h3>
                <p className="text-sm text-warm-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* vs Instagram Stories */}
      <section className="py-16 px-4 bg-gradient-to-br from-purple-50 to-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-center text-warm-900 mb-10">Live Memory Wall™ vs Instagram Stories</h2>
          <div className="overflow-x-auto rounded-2xl border border-purple-100 shadow-sm">
            <table className="w-full">
              <thead><tr className="bg-purple-50">
                <th className="text-left p-4 text-sm font-bold text-warm-700">Feature</th>
                <th className="text-center p-4 text-sm font-bold text-warm-400">Instagram Stories</th>
                <th className="text-center p-4 text-sm font-bold text-primary-600">Live Memory Wall™</th>
              </tr></thead>
              <tbody className="divide-y divide-purple-50">
                {[
                  ['Disappears after 24 hours','Yes ✗','No — permanent ✓'],
                  ['Everyone contributes','No — one account','Yes — anyone with link ✓'],
                  ['Works without an account','No','Yes ✓'],
                  ['Searchable by person','No','Yes ✓'],
                  ['Downloadable','Limited','Full download ✓'],
                  ['Becomes a Memory Movie','No','Automatically ✓'],
                  ['Gift collection built in','No','Yes ✓'],
                ].map(([f,a,b]) => (
                  <tr key={f}>
                    <td className="p-4 text-sm text-warm-700">{f}</td>
                    <td className="p-4 text-sm text-center text-warm-400">{a}</td>
                    <td className="p-4 text-sm text-center text-primary-600 font-semibold">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Occasions */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-display font-bold text-warm-900 mb-6">Works for every occasion</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {OCCASIONS.map(o => (
              <Link key={o} to="/card/new" className="px-4 py-2 rounded-full bg-purple-50 border border-purple-100 hover:border-primary-300 text-sm font-medium text-warm-700 transition-colors">
                {o}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-gradient-to-br from-purple-50 to-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-warm-900 text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQS.map(([q,a]) => (
              <details key={q} className="rounded-2xl border border-purple-100 group bg-white">
                <summary className="px-5 py-4 font-semibold text-warm-800 text-sm cursor-pointer list-none flex items-center justify-between">
                  {q}<Icon name="ChevronDown" size={16} className="text-warm-400 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="px-5 pb-4 text-sm text-warm-500 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#0d0020] to-[#2d1052] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold mb-4">Every moment. Preserved forever.</h2>
          <p className="text-white/60 mb-8 text-lg">Create a card with a Live Memory Wall. Everyone uploads. Thankeeu keeps it forever.</p>
          <Link to="/card/new" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 font-bold text-lg shadow-xl transition-all hover:scale-105">
            Create Memory Wall →
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
