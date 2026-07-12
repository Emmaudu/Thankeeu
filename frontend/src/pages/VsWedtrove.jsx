import { Link } from 'react-router-dom';
import { useSEO, SCHEMAS } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';

const CHECK = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100"><Icon name="Check" size={14} className="text-green-600" strokeWidth={3}/></span>;
const CROSS = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50"><Icon name="X" size={14} className="text-red-400" strokeWidth={3}/></span>;
const PARTIAL = <span className="text-xs text-warm-400 font-medium">Some plans</span>;

const ROWS = [
  { feature: 'Guest photo upload via QR code',         wedtrove: CHECK,   thankeeu: CHECK },
  { feature: 'No app or account for guests',           wedtrove: CHECK,   thankeeu: CHECK },
  { feature: 'Unlimited guest uploads',                wedtrove: CHECK,   thankeeu: CHECK },
  { feature: 'Full-resolution photos (no compression)',wedtrove: CHECK,   thankeeu: CHECK },
  { feature: 'Live display on venue screens',          wedtrove: CHECK,   thankeeu: CHECK },
  { feature: 'Heartfelt written messages from guests', wedtrove: CROSS,   thankeeu: CHECK },
  { feature: 'Voice note blessings',                   wedtrove: CROSS,   thankeeu: CHECK },
  { feature: 'Wedding gift pot (pooled money)',        wedtrove: CROSS,   thankeeu: CHECK },
  { feature: 'Auto Memory Movie™ from all content',   wedtrove: CROSS,   thankeeu: CHECK },
  { feature: 'Photo wall + group card in one link',    wedtrove: CROSS,   thankeeu: CHECK },
  { feature: 'NGN / GBP / USD payments',               wedtrove: CROSS,   thankeeu: CHECK },
  { feature: 'Nigerian traditional wedding support',   wedtrove: CROSS,   thankeeu: CHECK },
  { feature: 'Permanent storage — no expiry',          wedtrove: PARTIAL, thankeeu: CHECK },
  { feature: 'Download all photos as a ZIP',           wedtrove: PARTIAL, thankeeu: CHECK },
];

const FAQS = [
  { q: 'Is Wedtrove free?', a: 'Wedtrove offers a free tier with limited uploads and basic features. Paid plans unlock unlimited uploads and the live slideshow. Thankeeu is free to create and share — you pay only when you send the final card.' },
  { q: 'Which is better for Nigerian weddings — Wedtrove or Thankeeu?', a: 'Thankeeu is built with Nigerian celebrations in mind. It accepts Naira payments via Flutterwave, supports traditional weddings, owambe parties, and works well on the lower-bandwidth connections common across Nigeria. Wedtrove is UK/US focused with no NGN support.' },
  { q: 'Can Wedtrove collect gift money from wedding guests?', a: 'No. Wedtrove is a photo-collection tool only — it has no gift pot feature. Thankeeu combines guest photo uploads, heartfelt written messages, voice notes, and a pooled gift — all from a single link.' },
  { q: 'Does Wedtrove create a wedding video from photos?', a: 'No. Wedtrove delivers a photo album only. Thankeeu automatically assembles every message, photo, and video into a cinematic Memory Movie™ the couple keeps forever.' },
  { q: 'How does Thankeeu compare to Wedtrove for the live photo wall?', a: 'Both support a live display for venue screens. The key difference: on Thankeeu, the live wall is one part of a complete wedding card experience — guests also write messages and contribute gifts from the same link. Wedtrove is photos only.' },
];

export default function VsWedtrove() {
  useSEO({
    title: 'Thankeeu vs Wedtrove — Which Is Better for Wedding Guest Photos? (2025)',
    description: 'Honest comparison of Thankeeu vs Wedtrove for wedding guest photo sharing. Both collect photos via QR code — but Thankeeu also collects messages, voice notes and gifts, creates a Memory Movie, and works in Naira. See the full feature comparison.',
    keywords: 'Thankeeu vs Wedtrove, Wedtrove alternative, wedding photo sharing comparison, wedding guest photo app comparison, best wedding photo sharing app, collect wedding photos guests, QR code wedding photos app',
    canonical: '/thankeeu-vs-wedtrove',
  });

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0d0020] to-[#2d1052] text-white pt-20 pb-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-300 mb-4">Comparison</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
            Thankeeu vs Wedtrove
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-8">
            Both let wedding guests upload photos via QR code. Only one collects messages, gifts, and creates a cinematic movie too.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/card/new" className="px-7 py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 font-bold text-sm transition-all">
              Try Thankeeu Free
            </Link>
            <Link to="/wedding-memory-wall" className="px-7 py-3 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-sm border border-white/20 transition-all">
              See Wedding Memory Wall
            </Link>
          </div>
        </div>
      </section>

      {/* Verdict summary */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { name: 'Wedtrove', icon: 'Camera', colour: '#64748b', bg: '#f8fafc',
                verdict: 'A clean photo-collection tool for weddings. Great at what it does: QR upload, live slideshow, unlimited guests. But it stops there — no messages, no gifts, no movie.',
                best: 'Couples who only want guest photos collected, nothing else.' },
              { name: 'Thankeeu', icon: 'Sparkles', colour: '#7C3AED', bg: '#F5F0FF',
                verdict: 'A complete wedding celebration platform. Photos + messages + voice blessings + gift pot + Memory Movie — all from one QR code or link. Made for Nigerian and global weddings.',
                best: 'Couples who want the full picture: every photo, every message, every gift, one beautiful memory.' },
            ].map(({ name, icon, colour, bg, verdict, best }) => (
              <div key={name} className="rounded-2xl p-6 border-2" style={{ background: bg, borderColor: colour + '30' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: colour + '18' }}>
                    <Icon name={icon} size={20} style={{ color: colour }} />
                  </div>
                  <h2 className="font-extrabold text-warm-900">{name}</h2>
                </div>
                <p className="text-warm-600 text-sm mb-3 leading-relaxed">{verdict}</p>
                <p className="text-xs font-bold text-warm-400 uppercase tracking-wide">Best for</p>
                <p className="text-sm text-warm-700">{best}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature comparison table */}
      <section className="py-12 px-4 bg-purple-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-warm-900 text-center mb-2">Full feature comparison</h2>
          <p className="text-center text-warm-500 text-sm mb-8">Every feature, side by side</p>
          <div className="overflow-x-auto rounded-2xl border border-purple-100 shadow-sm bg-white">
            <table className="w-full">
              <thead>
                <tr className="bg-purple-50 border-b border-purple-100">
                  <th className="text-left p-4 text-sm font-bold text-warm-700">Feature</th>
                  <th className="text-center p-4 text-sm font-bold text-warm-400">Wedtrove</th>
                  <th className="text-center p-4 text-sm font-bold text-primary-600">Thankeeu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {ROWS.map(({ feature, wedtrove, thankeeu }) => (
                  <tr key={feature} className="hover:bg-purple-50/40 transition-colors">
                    <td className="p-4 text-sm text-warm-700">{feature}</td>
                    <td className="p-4 text-center">{wedtrove}</td>
                    <td className="p-4 text-center">{thankeeu}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Key differentiators */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-warm-900 text-center mb-8">Why couples choose Thankeeu over Wedtrove</h2>
          <div className="space-y-4">
            {[
              { icon: 'MessageSquare', title: 'Messages, not just photos', body: "Wedtrove collects photos — that's it. Thankeeu collects photos AND heartfelt written messages, voice notes from elders, GIFs, and a pooled cash gift. Your guests contribute the full picture of who they are to you, not just a selfie." },
              { icon: 'Film', title: 'The Memory Movie they didn\'t expect', body: 'Every message, photo, and voice blessing is automatically assembled into a cinematic Memory Movie™. Something to watch on your first anniversary, your fifth, your twentieth. Wedtrove delivers a folder of photos.' },
              { icon: 'Gift', title: 'One link collects everything', body: 'Instead of separate links — one for photos, one for a gift WhatsApp group, one for a digital guest book — Thankeeu does all of it from one link. Couples in Nigeria especially appreciate not having to coordinate multiple platforms.' },
              { icon: 'CreditCard', title: 'Naira payments that actually work', body: 'Wedtrove processes in GBP/USD. Thankeeu works in Naira via Flutterwave — every Nigerian bank card, USSD, and mobile money is supported. No dollar card headaches for Nigerian guests contributing to the gift.' },
            ].map(({ icon, title, body }) => (
              <div key={title} className="flex gap-4 p-5 rounded-2xl border border-purple-100 bg-purple-50">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Icon name={icon} size={20} className="text-primary-600" />
                </div>
                <div>
                  <h3 className="font-bold text-warm-900 mb-1">{title}</h3>
                  <p className="text-sm text-warm-500 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
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

      {/* CTA */}
      <section className="py-16 px-4 text-center bg-gradient-to-br from-[#0d0020] to-[#2d1052] text-white">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Photos, messages, gifts and a movie — all from one link.</h2>
          <p className="text-white/60 mb-8">Wedtrove does one thing. Thankeeu does everything.</p>
          <Link to="/card/new" className="px-8 py-4 rounded-2xl bg-primary-500 hover:bg-primary-600 font-bold inline-block transition-all">
            Create your wedding card free
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
