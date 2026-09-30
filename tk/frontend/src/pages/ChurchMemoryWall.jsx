import { Link } from 'react-router-dom';
import { useSEO, SCHEMAS } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon'; export default function ChurchMemoryWallPage() { useSEO({ title: 'Church Memory Wall — Capture Every Moment From Conferences, Pastor Appreciation & Services | Thankeeu', description: 'Capture every moment from church conferences, pastor appreciation days, special services and milestones. The whole congregation uploads photos and messages to one permanent memory wall.', keywords: 'church memory wall, pastor appreciation card, church conference memory, congregation photo wall, church event photos, pastor appreciation group card', canonical: '/church-memory-wall', locale: 'en', jsonLd: [ SCHEMAS.organization, SCHEMAS.faqPage([ { q: 'How can a church collect photos from a conference?', a: 'Members scan a QR code printed in the order of service and upload photos and videos directly from their phones. Everything collects on one shared wall the whole congregation can access.' }, { q: 'Is the church memory wall permanent?', a: 'Yes. Every photo, video and message is preserved permanently — perfect for church archives, anniversaries and milestones.' }, { q: 'What church occasions does it suit?', a: 'Pastor appreciation, church anniversaries, youth conferences, ordination services, homecoming, baby dedications and any special service.' }, { q: 'Does it create a video of the service?', a: 'Yes. Thankeeu automatically assembles every contribution into a cinematic Memory Movie the church can share with the whole congregation.' }, ]), ], }); return ( <>
<Navbar />
<section className="relative overflow-hidden bg-gradient-to-br from-[#0d0020] to-[#2d1052] text-white pt-24 pb-20 px-4 text-center">
<div className="max-w-3xl mx-auto">
<h1 className="text-4xl sm:text-5xl font-display font-extrabold leading-tight mb-6">Capture Every Moment From Church Conferences, Pastor Appreciation & Special Services </h1>
<p className="text-lg text-white/70 mb-10">The whole congregation writes messages, uploads photos and shares videos — all collected in one place that lasts forever. Perfect for pastor appreciation, homecoming, conferences and milestones. </p>
<Link to="/card/new" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-600 font-bold text-lg shadow-xl inline-block hover:scale-105 transition-all">Create Church Memory Wall → </Link>
</div>
</section>
      {/* ── QR code callout ── */}
      <section className="py-10 px-4 bg-purple-50">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border-2 border-pink-100 p-6 sm:p-8 bg-white flex flex-col sm:flex-row items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-pink-100 flex items-center justify-center flex-shrink-0">
              <Icon name="QrCode" size={32} className="text-pink-600"/>
            </div>
            <div>
              <h3 className="font-extrabold text-warm-900 text-lg mb-2">QR code generated automatically for every church event</h3>
              <p className="text-warm-500 text-sm leading-relaxed mb-4">
                Enable the Live Memory Wall when creating your church card and Thankeeu instantly generates a unique QR code for the occasion. Print it in the order of service bulletin, display it on the church screen, or share the link via WhatsApp — members scan and upload from any phone, with no app download or account needed.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Print in bulletin', 'Display on church screen', 'Share via WhatsApp', 'Email to congregation', 'No app needed'].map(label => (
                  <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-pink-200 text-xs font-semibold text-warm-700 bg-pink-50">
                    <Icon name="Check" size={12} className="text-pink-500" strokeWidth={3}/>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
<div className="max-w-3xl mx-auto">
<h2 className="text-2xl font-bold text-warm-900 text-center mb-8">Occasions the church community loves</h2>
<div className="grid grid-cols-2 sm:grid-cols-3 gap-3"> {['Pastor Appreciation','Church Anniversary','Youth Conference','Ordination Service','Homecoming Sunday','Guest Speaker Welcome','Missionary Send-Off','Baby Dedication','Leadership Celebration','End-of-Year Service','Choir Anniversary','Women\'s Conference'].map(o => ( <div key={o} className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-xs font-semibold text-warm-700 text-center">{o}</div> ))} </div>
<div className="mt-12 text-center">
<Link to="/card/new" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-600 font-bold text-lg shadow-xl inline-block">Create Church Memory Wall → </Link>
</div>
</div>
</section>
<Footer />
</> );
}
