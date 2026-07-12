import { Link } from 'react-router-dom';
import Icon from './ui/Icon';
import Navbar from './Navbar';
import Footer from './Footer';

const CHECK = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100"><Icon name="Check" size={14} className="text-green-600" strokeWidth={3}/></span>;
const CROSS = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50"><Icon name="X" size={14} className="text-red-400" strokeWidth={3}/></span>;

const DEFAULT_FEATURES = [
  { title: 'No app. No account. No friction.', body: 'Guests scan the QR code and are uploading in under 10 seconds. Works on every phone, for guests of every age.' },
  { title: 'Messages + photos + gift in one', body: 'Most apps only collect photos. Thankeeu collects photos, heartfelt messages, voice notes, and wedding gift contributions — all in one card.' },
  { title: 'Live photo wall on venue screens', body: 'Open the Memory Wall on a TV or projector at your reception. Photos appear the moment guests upload them.' },
  { title: 'Automatic Wedding Memory Movie™', body: 'After the celebration, Thankeeu assembles every message, photo and video into a cinematic Memory Movie — a wedding film made by everyone who loves you.' },
  { title: 'Full quality, permanently preserved', body: 'Every photo uploads at original resolution. No compression. No expiry. The wall lives forever.' },
  { title: 'Works for guests anywhere in the world', body: 'Friends overseas can upload photos and write messages from anywhere. The wall captures every perspective, no matter the distance.' },
];

const DEFAULT_TABLE_ROWS = [
  ['QR code for guest photos', 'Some tools', CHECK],
  ['No app or account needed', 'Some tools', CHECK],
  ['Heartfelt written messages', CROSS, CHECK],
  ['Voice notes from guests', CROSS, CHECK],
  ['Wedding gift pot', CROSS, CHECK],
  ['Auto Memory Movie™', CROSS, CHECK],
  ['Photo + card in one link', CROSS, CHECK],
  ['Multi-currency payments', CROSS, CHECK],
  ['Permanent storage', 'Paid plans', CHECK],
];

const DEFAULT_FAQS = [
  { q: 'Is Thankeeu free for weddings?', a: 'Yes — creating and sharing the card is free. You pay only when sending the final card to the couple.' },
  { q: 'Do guests need to download an app?', a: 'No. Guests scan your QR code or tap the link — they upload photos, write messages, and contribute gifts directly from their phone browser. No app, no account, no friction.' },
  { q: 'How many guests can upload photos?', a: 'Unlimited. There is no cap on contributors. A 500-guest wedding can all upload from the same link at the same time.' },
  { q: 'Can guests who couldn\'t attend still contribute?', a: 'Yes. Anyone with the link — near or far — can write a message, upload photos, record a voice note, and contribute to the gift pot.' },
  { q: 'Does Thankeeu create a video from all the photos?', a: 'Yes. Thankeeu\'s Memory Movie™ automatically assembles every message, photo and video into a cinematic film — the couple\'s wedding story, told by everyone who was there.' },
];

export default function WeddingLandingTemplate({
  headline,
  subheadline,
  tagline,
  features = DEFAULT_FEATURES,
  tableRows = DEFAULT_TABLE_ROWS,
  tableCompetitorLabel = 'Other Apps',
  faqs = DEFAULT_FAQS,
  ctaHeadline = 'Capture every guest\'s perspective.',
  ctaSubline = 'Set up in 2 minutes. Guests scan, upload, done.',
  relatedLinks = [],
}) {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a0030] via-[#2d0052] to-[#1a0533] text-white pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-display font-extrabold leading-tight mb-6">
            {headline}
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-4">{subheadline}</p>
          {tagline && <p className="text-sm text-white/40 max-w-xl mx-auto mb-10">{tagline}</p>}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/card/new"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-600 font-bold text-lg shadow-xl transition-all hover:scale-105">
              Create Your Wedding Card →
            </Link>
            <Link to="/occasions/wedding"
              className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-lg border border-white/20 transition-all">
              See Wedding Cards
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-warm-900 text-center mb-10">
            Why couples choose Thankeeu
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map(({ title, body }) => (
              <div key={title} className="p-6 rounded-2xl bg-purple-50 border border-purple-100">
                <h3 className="font-bold text-warm-900 mb-2">{title}</h3>
                <p className="text-sm text-warm-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      {tableRows.length > 0 && (
        <section className="py-14 px-4 bg-gradient-to-br from-purple-50 to-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-display font-bold text-warm-900 text-center mb-10">
              Thankeeu vs {tableCompetitorLabel}
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-purple-100 shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-purple-50">
                    <th className="text-left p-4 text-sm font-bold text-warm-700">Feature</th>
                    <th className="text-center p-4 text-sm font-bold text-warm-400">{tableCompetitorLabel}</th>
                    <th className="text-center p-4 text-sm font-bold text-primary-600">Thankeeu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50">
                  {tableRows.map(([feature, comp, thankeeu]) => (
                    <tr key={feature} className="hover:bg-purple-50/40 transition-colors">
                      <td className="p-4 text-sm text-warm-700">{feature}</td>
                      <td className="p-4 text-center">{comp}</td>
                      <td className="p-4 text-center">{thankeeu}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-warm-900 text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {faqs.map(({ q, a }) => (
              <details key={q} className="rounded-2xl border border-purple-100 bg-white">
                <summary className="px-5 py-4 font-semibold text-warm-800 text-sm cursor-pointer list-none flex items-center justify-between">
                  {q}<span className="text-warm-400 flex-shrink-0 ml-3">+</span>
                </summary>
                <p className="px-5 pb-4 text-sm text-warm-500 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Related Links */}
      {relatedLinks.length > 0 && (
        <section className="py-10 px-4 bg-purple-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-lg font-bold text-warm-900 mb-6">Related pages</h2>
            <div className="flex flex-wrap gap-3">
              {relatedLinks.map(({ to, label }) => (
                <Link key={to} to={to}
                  className="text-xs font-semibold text-primary-600 bg-white border border-primary-200 px-4 py-2 rounded-xl hover:bg-primary-50 transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#1a0030] to-[#2d0052] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold mb-4">{ctaHeadline}</h2>
          <p className="text-white/60 mb-3 text-lg">{ctaSubline}</p>
          <p className="text-white/40 text-sm mb-10">No app · No account · Works on any phone · Full quality · Permanent</p>
          <Link to="/card/new"
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-600 font-bold text-lg shadow-xl transition-all hover:scale-105 inline-block">
            Create Your Wedding Card →
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
