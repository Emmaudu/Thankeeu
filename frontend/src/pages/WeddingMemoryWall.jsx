import { Link } from 'react-router-dom';
import { useSEO, SCHEMAS } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function WeddingMemoryWallPage() {
  useSEO({
    title: 'Wedding Memory Wall — Collect Every Guest\'s Photos & Videos In One Place | Thankeeu',
    description: 'Collect every guest\'s wedding photos and videos in one beautiful shared memory wall. Guests scan a QR code and upload instantly — no app download, no account needed.',
    keywords: 'wedding memory wall, collect wedding guest photos, wedding photo sharing, wedding digital guest book, share wedding photos online, wedding photo wall',
    canonical: '/wedding-memory-wall',
    locale: 'en',
    jsonLd: [
      SCHEMAS.organization,
      SCHEMAS.faqPage([
        { q: 'How do wedding guests add photos to the memory wall?', a: 'Guests scan a QR code printed on your table cards or order of service and upload photos and videos instantly from their phones. No app download and no account are required.' },
        { q: 'Do the wedding photos disappear after the day?', a: 'No. Unlike Instagram Stories, every photo and video on your Thankeeu wedding memory wall is preserved permanently. You can browse, download and share them forever.' },
        { q: 'Can we collect photos from guests who could not attend?', a: 'Yes. Anyone with the link can contribute, including guests who joined remotely or family who could not travel.' },
        { q: 'Does it create a wedding video automatically?', a: 'Yes. After the wedding, Thankeeu automatically assembles every photo, video and message into a cinematic Memory Movie you keep forever.' },
      ]),
    ],
  });
  return (
    <>
      <Navbar />
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a0030] via-[#2d0052] to-[#1a0533] text-white pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-4xl mb-6 block">💍</span>
          <h1 className="text-4xl sm:text-5xl font-display font-extrabold leading-tight mb-6">
            Collect Every Guest's Wedding Photos & Videos In One Place
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10">
            Your guests have hundreds of photos on their phones. Thankeeu's Live Memory Wall™ collects every single one — guests simply scan a QR code at the venue and upload. No app, no account, no friction.
          </p>
          <Link to="/card/new" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-600 font-bold text-lg shadow-xl transition-all hover:scale-105">
            Create Wedding Memory Wall →
          </Link>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-warm-900 text-center mb-10">Why couples use Thankeeu for their wedding</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { emoji:'📷', title:'Every perspective captured', desc:'The bride\'s aunt has a photo you never knew existed. The groomsmen have videos from the reception. The Memory Wall collects every single one.' },
              { emoji:'⚡', title:'Instant upload from any phone', desc:'Guests don\'t download an app or create an account. They scan the QR code, tap upload, and their photo appears on the wall in seconds.' },
              { emoji:'💌', title:'Plus heartfelt wedding messages', desc:'Combine the Memory Wall with a group wedding card. Guests write messages AND upload photos — everything together in one place.' },
              { emoji:'🎥', title:'Automatically becomes a movie', desc:'After the wedding, Thankeeu assembles every message, photo and video into a cinematic Memory Movie™ — your wedding film, made by everyone who loves you.' },
            ].map(({emoji,title,desc}) => (
              <div key={title} className="p-6 rounded-2xl bg-purple-50 border border-purple-100">
                <span className="text-3xl mb-3 block">{emoji}</span>
                <h3 className="font-bold text-warm-900 mb-2">{title}</h3>
                <p className="text-sm text-warm-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gradient-to-br from-purple-50 to-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-warm-900 mb-4">How to set it up</h2>
          <div className="space-y-4 text-left max-w-lg mx-auto mb-10">
            {['Create a Thankeeu card and enable the Live Memory Wall™','Choose "Group Card + Live Memory Wall" for the full experience','Share the QR code on table cards, order of service, and your wedding website','Guests scan and upload throughout the day — it all collects in real time','After the celebration, watch the automatic Memory Movie™ of your whole day'].map((s,i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="w-7 h-7 rounded-full bg-primary-500 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                <p className="text-warm-700 text-sm">{s}</p>
              </div>
            ))}
          </div>
          <Link to="/card/new" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-600 font-bold text-lg shadow-xl inline-block">
            Create Wedding Memory Wall →
          </Link>
        </div>
      </section>
      <Footer />
    </>
  );
}
