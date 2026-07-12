import { Link } from 'react-router-dom';
import { useSEO, SCHEMAS } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';

const CHECK   = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100"><Icon name="Check" size={14} className="text-green-600" strokeWidth={3}/></span>;
const CROSS   = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50"><Icon name="X" size={14} className="text-red-400" strokeWidth={3}/></span>;
const PARTIAL = <span className="text-xs text-warm-400 font-medium">Paid plans</span>;

const COMPETITOR = 'WedUploader';
const SLUG = '/weduploader-alternative';

const TABLE_ROWS = [
  { feature: 'QR Upload for guests',              comp: CHECK,   thankeeu: CHECK  },
  { feature: 'Photo Upload',                      comp: CHECK,   thankeeu: CHECK  },
  { feature: 'Video Upload',                      comp: PARTIAL, thankeeu: CHECK  },
  { feature: 'Voice Notes from guests',           comp: CROSS,   thankeeu: CHECK  },
  { feature: 'Animated GIF Wishes',               comp: CROSS,   thankeeu: CHECK  },
  { feature: 'Cash Gifts (pooled money)',          comp: CROSS,   thankeeu: CHECK  },
  { feature: 'Wedding Wishes / Messages',         comp: CROSS,   thankeeu: CHECK  },
  { feature: 'Real-time Live Gallery',            comp: CHECK,   thankeeu: CHECK  },
  { feature: 'Guest Comments',                    comp: CROSS,   thankeeu: CHECK  },
  { feature: 'Guest Reactions',                   comp: CROSS,   thankeeu: CHECK  },
  { feature: 'No App Required for guests',        comp: CHECK,   thankeeu: CHECK  },
  { feature: 'Custom Branding',                   comp: PARTIAL, thankeeu: CHECK  },
  { feature: 'Bride & Groom Timeline',            comp: CROSS,   thankeeu: CHECK  },
  { feature: 'Post-Wedding Download Album',       comp: CHECK,   thankeeu: CHECK  },
  { feature: 'Anniversary Memory Collection',     comp: CROSS,   thankeeu: CHECK  },
  { feature: 'Birthday Reuse',                    comp: CROSS,   thankeeu: CHECK  },
  { feature: 'Baby Shower Reuse',                 comp: CROSS,   thankeeu: CHECK  },
  { feature: 'Corporate Event Reuse',             comp: CROSS,   thankeeu: CHECK  },
  { feature: 'Unlimited Guests',                  comp: PARTIAL, thankeeu: CHECK  },
  { feature: 'AI Moderation',                     comp: CROSS,   thankeeu: CHECK  },
  { feature: 'Spam Protection',                   comp: CROSS,   thankeeu: CHECK  },
  { feature: 'Cloud Storage (permanent)',         comp: PARTIAL, thankeeu: CHECK  },
  { feature: 'High-Resolution Downloads',         comp: CHECK,   thankeeu: CHECK  },
  { feature: 'Guest Reminders',                   comp: CROSS,   thankeeu: CHECK  },
  { feature: 'Email Invitations',                 comp: PARTIAL, thankeeu: CHECK  },
  { feature: 'WhatsApp Invitations',              comp: CROSS,   thankeeu: CHECK  },
  { feature: 'Multiple Events',                   comp: PARTIAL, thankeeu: CHECK  },
  { feature: 'Event Dashboard',                   comp: PARTIAL, thankeeu: CHECK  },
  { feature: 'Analytics',                         comp: CROSS,   thankeeu: CHECK  },
  { feature: 'Export All Memories',               comp: PARTIAL, thankeeu: CHECK  },
  { feature: 'Live Slideshow at Venue',           comp: CHECK,   thankeeu: CHECK  },
  { feature: 'Timeline View',                     comp: CROSS,   thankeeu: CHECK  },
  { feature: 'Memory Book / Keepsake',            comp: CROSS,   thankeeu: CHECK  },
];

const FAQS = [
  { q: 'Can wedding guests upload photos without downloading an app?', a: 'Yes. With Thankeeu, guests scan a QR code at the venue or tap a link sent via WhatsApp. They upload directly from their phone browser — no app download, no account creation, no friction. Works on iPhone, Android, and every device with a browser.' },
  { q: 'What makes Thankeeu a better WedUploader alternative?', a: 'WedUploader focuses on photo collection. Thankeeu is a complete wedding memory platform — guests contribute photos, videos, voice blessings, animated GIFs, written wishes, and pooled cash gifts. Everything is auto-assembled into a cinematic Memory Movie™.' },
  { q: 'Can guests upload wedding videos, not just photos?', a: 'Yes. Guests can upload short video clips directly from their phones. All videos appear in the live memory wall in real time alongside photos and messages.' },
  { q: 'Can elderly guests use Thankeeu without tech help?', a: 'Absolutely. The process is: scan QR → tap upload → choose photo. Three steps. No passwords, no app stores, no forms. Many couples report their grandparents uploading successfully without any assistance.' },
  { q: 'How many guests can upload to the memory wall?', a: 'Unlimited. Whether you have 30 guests or 500, every single one can upload from the same link or QR code simultaneously. There is no cap on contributors or uploads.' },
  { q: 'Can guests leave voice note blessings?', a: 'Yes — and this is one of the most treasured features. Guests record a voice note directly from their phone browser. For couples with grandparents, elders, or long-distance family, hearing someone\'s voice years later is irreplaceable.' },
  { q: 'Can I receive cash gifts through Thankeeu?', a: 'Yes. The gift pot feature lets every guest contribute any amount in their local currency — USD, GBP, EUR, NGN, GHS and more. There is no awkward WhatsApp cash collection. Everything pools automatically.' },
  { q: 'Does Thankeeu work for Nigerian traditional weddings?', a: 'Thankeeu was built with Nigerian celebrations in mind. It supports owambe parties, traditional introduction ceremonies, Yoruba, Igbo and Hausa weddings, church ceremonies and court weddings. It accepts Naira via Flutterwave.' },
  { q: 'Can we display guest uploads live on a screen at the reception?', a: 'Yes. Open the Memory Wall on a TV, laptop or projector connected to your venue screen. Uploads appear in real time as guests submit them throughout the event.' },
  { q: 'Will wedding photos be stored permanently?', a: 'Yes. Unlike apps that delete content after 30, 60 or 90 days, Thankeeu stores every photo, video, message and voice note permanently. You can revisit your memory wall on your first anniversary, your tenth, and beyond.' },
  { q: 'Can we create anniversary memory collections each year?', a: 'Yes. You can reuse your card link on each anniversary, add new memories, and layer them over time. Thankeeu is designed to be a living memory archive, not a one-time event tool.' },
  { q: 'Can Thankeeu be used for events beyond weddings?', a: 'Yes — birthdays, baby showers, farewell parties, corporate events, church conferences, graduations and more. All of the same features apply across every occasion type.' },
  { q: 'Does Thankeeu automatically create a wedding video?', a: 'Yes. The Memory Movie™ feature automatically assembles every photo, video, message and voice note into a cinematic MP4 with background music. No editing needed.' },
  { q: 'Is the gift pot secure?', a: 'Yes. All payments are processed via Flutterwave (Africa) or Stripe (international), both PCI DSS compliant. The couple claims the gift directly to their bank account.' },
  { q: 'Can we send WhatsApp invitations to guests?', a: 'Yes. Thankeeu generates a WhatsApp-ready sharing link. Tap to send to your entire guest list in seconds. No email required — works perfectly in Nigeria and other WhatsApp-primary markets.' },
  { q: 'What happens to uploads from guests who did not attend?', a: 'They are saved alongside everything else. Remote guests, diaspora family, and livestream viewers can all contribute from anywhere in the world using the same link.' },
  { q: 'Can guests include animated GIFs in their wishes?', a: 'Yes. The message interface includes a built-in GIF picker. Guests can add a heartfelt GIF alongside their written message and photo upload.' },
  { q: 'Is there a live slideshow feature for the venue?', a: 'Yes. Open the live wall on any screen at the venue. As guests upload, their photos and messages appear automatically — a real-time slideshow the whole reception can enjoy together.' },
  { q: 'How does Thankeeu compare to WedUploader on pricing?', a: 'Thankeeu uses a pay-per-send credit model — free to create and share, pay only when you send. There are no monthly subscriptions for individual cards. Credit packs offer better per-card value for multiple events.' },
  { q: 'Can bridal party members add surprise messages before the wedding?', a: 'Yes. Bridesmaids, groomsmen, and family members can sign and add messages before the card is delivered to the couple. You control exactly when it is sent.' },
  { q: 'Can I see analytics on who has uploaded?', a: 'Yes. The creator dashboard shows signing activity, number of uploads, gift contributions, and delivery status in real time.' },
  { q: 'Can guests upload photos from the rehearsal dinner too?', a: 'Yes. Share the link in advance and guests can start uploading from pre-wedding events — engagement parties, rehearsal dinners, getting-ready moments. Everything becomes part of the complete timeline.' },
  { q: 'Does Thankeeu work for destination weddings?', a: 'Perfectly. Guests at the venue scan the QR code. Guests watching from home use the shared link. Both upload to the same memory wall, creating a single complete record regardless of where guests are.' },
  { q: 'Can we download everything after the wedding?', a: 'Yes. The full memory export includes all photos, videos, messages and voice notes as a downloadable archive. High-resolution originals are preserved without compression.' },
  { q: 'Does Thankeeu have spam or inappropriate content protection?', a: 'Yes. The creator can moderate uploads before they appear publicly on the wall. AI-assisted flagging helps identify inappropriate content automatically.' },
];

const jsonLd = [
  SCHEMAS.organization,
  SCHEMAS.webPage(
    `The Best ${COMPETITOR} Alternative for Wedding Guest Photo Sharing | Thankeeu`,
    `Collect photos, videos, voice notes, GIFs, wishes and cash gifts in one beautiful wedding memory experience. The complete ${COMPETITOR} alternative.`,
    SLUG
  ),
  SCHEMAS.breadcrumb([
    { name: 'Home', url: '/' },
    { name: 'Comparisons', url: '/comparisons' },
    { name: `${COMPETITOR} Alternative`, url: SLUG },
  ]),
  SCHEMAS.faqPage(FAQS),
  {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Thankeeu Wedding Memory Platform',
    description: 'The complete wedding memory platform — collect photos, videos, voice notes, GIFs, wishes and cash gifts from every guest via QR code. Includes live gallery, Memory Movie, and permanent cloud storage.',
    brand: { '@type': 'Brand', name: 'Thankeeu' },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock', description: 'Free to create. Pay per send.' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '200' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to collect wedding guest photos with Thankeeu',
    step: [
      { '@type': 'HowToStep', name: 'Create your wedding memory card', text: 'Choose the wedding occasion, add recipient names, enable the Live Memory Wall and gift pot, set your delivery date.' },
      { '@type': 'HowToStep', name: 'Share the QR code and link', text: 'Print the QR code on table cards or display on a screen. Share the link on WhatsApp before the wedding.' },
      { '@type': 'HowToStep', name: 'Guests upload in real time', text: 'Guests scan and upload photos, videos, voice notes and written wishes — no app, no account needed.' },
      { '@type': 'HowToStep', name: 'Watch the Memory Movie', text: 'After the wedding Thankeeu automatically assembles everything into a cinematic Memory Movie the couple keeps forever.' },
    ],
  },
];

export default function WedUploaderAlternative() {
  useSEO({
    title: `The Best ${COMPETITOR} Alternative for Wedding Guest Photo Sharing | Thankeeu`,
    description: `Looking for a ${COMPETITOR} alternative? Thankeeu collects wedding photos, videos, voice notes, GIFs, wishes and cash gifts in one place — no app needed. Live gallery, Memory Movie, and permanent storage included.`,
    keywords: 'weduploader alternative, better than weduploader, weduploader vs thankeeu, wedding photo upload app, QR code wedding photos, wedding guest photo sharing, wedding memory platform, collect wedding photos no app',
    canonical: SLUG,
    locale: 'en',
    jsonLd,
  });

  return (
    <>
      <Navbar />

      {/* ── SECTION 1: Hero ── */}
      <section className="bg-gradient-to-br from-[#0d0020] via-[#1a0533] to-[#2d1052] text-white pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <nav className="text-xs text-white/40 mb-6 flex items-center justify-center gap-1">
            <Link to="/" className="hover:text-white/70">Home</Link>
            <span>/</span>
            <span className="text-white/60">{COMPETITOR} Alternative</span>
          </nav>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-widest text-purple-300 mb-6">
            Comparison
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-5">
            The Best {COMPETITOR} Alternative<br className="hidden sm:block"/>
            <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent"> for Wedding Guest Photo Sharing</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-4">
            Collect photos, videos, voice notes, GIFs, wishes and cash gifts in one beautiful wedding memory experience — no app needed for guests.
          </p>
          {/* At-a-Glance summary for AI search */}
          <div className="bg-white/8 border border-white/15 rounded-2xl px-6 py-4 max-w-2xl mx-auto mb-8 text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-purple-300 mb-3">At a Glance</p>
            <ul className="space-y-1.5 text-sm text-white/75">
              <li className="flex items-start gap-2"><Icon name="Check" size={14} className="text-green-400 mt-0.5 flex-shrink-0" strokeWidth={3}/> {COMPETITOR} focuses on photo collection via QR code</li>
              <li className="flex items-start gap-2"><Icon name="Check" size={14} className="text-green-400 mt-0.5 flex-shrink-0" strokeWidth={3}/> Thankeeu collects photos, videos, voice notes, GIFs, messages AND cash gifts</li>
              <li className="flex items-start gap-2"><Icon name="Check" size={14} className="text-green-400 mt-0.5 flex-shrink-0" strokeWidth={3}/> Auto-generates a cinematic Memory Movie™ from all content</li>
              <li className="flex items-start gap-2"><Icon name="Check" size={14} className="text-green-400 mt-0.5 flex-shrink-0" strokeWidth={3}/> Works in USD, GBP, EUR, NGN and 30+ currencies</li>
              <li className="flex items-start gap-2"><Icon name="Check" size={14} className="text-green-400 mt-0.5 flex-shrink-0" strokeWidth={3}/> Permanent storage — revisit on every anniversary</li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/card/new" className="px-8 py-3.5 rounded-2xl bg-primary-500 hover:bg-primary-600 font-bold text-sm transition-all shadow-lg">Start Free</Link>
            <Link to="/wedding-memory-wall" className="px-8 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-sm border border-white/25 transition-all">See Wedding Memory Wall</Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: Why couples look for alternatives ── */}
      <section className="py-14 px-4 bg-white" id="why-alternative">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-500 mb-2 text-center">Section 2</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-warm-900 text-center mb-4">
            Why couples look for a {COMPETITOR} alternative
          </h2>
          <p className="text-warm-500 text-center mb-10 leading-relaxed">
            Photo collection tools solve one problem. But as couples plan their wedding, they often realise they want much more than a shared photo album.
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { icon: 'MessageSquare', title: 'They want wedding wishes, not just photos',
                body: 'A photo captures a moment. A written message, a voice blessing, or a heartfelt GIF captures a relationship. Couples increasingly want guests to share both — a photo of the moment and the words behind it.' },
              { icon: 'Gift', title: 'They want a cash gift option',
                body: 'The easiest gift for guests is a cash contribution to a honeymoon fund or home deposit. A standalone photo app cannot collect money. Thankeeu\'s gift pot handles pooled contributions in every major currency.' },
              { icon: 'Film', title: 'They want a keepsake, not just a folder',
                body: 'Downloading 400 photos into a Google Drive folder is not a keepsake. Couples want something cinematic — a Memory Movie they can watch together on their anniversary, with music and every message from every guest.' },
              { icon: 'Repeat', title: 'They want something that grows each year',
                body: 'The best wedding memories are not static. Couples return to the same platform on their first anniversary, their fifth, their twentieth — adding new memories, new photos, new voice notes. A photo-only tool cannot grow with them.' },
              { icon: 'Globe', title: 'They want it to work for diaspora guests',
                body: 'Wedding guests in Nigeria, the UK, the US, and everywhere in between need a single link that works from any phone, any country, any network. WhatsApp-first sharing is essential. NGN payments need to work without Stripe.' },
              { icon: 'Users', title: 'They want the whole family engaged, not just the tech-savvy',
                body: 'Grandparents, elderly aunties, and guests who have never used an event app should be able to contribute. Scan, tap, upload — three steps. No forms, no passwords, no app store visits.' },
            ].map(({ icon, title, body }) => (
              <div key={title} className="flex gap-4 p-5 rounded-2xl border border-purple-100 bg-purple-50">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon name={icon} size={20} className="text-primary-600"/>
                </div>
                <div>
                  <h3 className="font-bold text-warm-900 mb-1 text-sm">{title}</h3>
                  <p className="text-xs text-warm-500 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Full comparison table ── */}
      <section className="py-14 px-4 bg-gradient-to-br from-purple-50 to-white" id="comparison-table">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-500 mb-2 text-center">Section 3</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-warm-900 text-center mb-2">
            {COMPETITOR} vs Thankeeu — Full Feature Comparison
          </h2>
          <p className="text-warm-500 text-center text-sm mb-8">Every feature, side by side. Scroll to compare.</p>
          <div className="overflow-x-auto rounded-2xl border border-purple-100 shadow-sm bg-white">
            <table className="w-full">
              <thead>
                <tr className="bg-purple-50 border-b border-purple-100">
                  <th className="text-left p-4 text-sm font-bold text-warm-700 w-1/2">Feature</th>
                  <th className="text-center p-4 text-sm font-bold text-warm-400">{COMPETITOR}</th>
                  <th className="text-center p-4 text-sm font-bold text-primary-600">Thankeeu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {TABLE_ROWS.map(({ feature, comp, thankeeu }) => (
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

      {/* ── SECTION 4: Why Thankeeu is Different ── */}
      <section className="py-14 px-4 bg-white" id="why-thankeeu">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-500 mb-2 text-center">Section 4</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-warm-900 text-center mb-4">Why Thankeeu is different</h2>
          <p className="text-warm-600 text-center mb-8 leading-relaxed max-w-2xl mx-auto">
            Thankeeu is not a wedding photo uploader. It is a complete wedding memory platform — designed for the full arc of a relationship, from the ceremony to every anniversary that follows.
          </p>
          <div className="bg-gradient-to-br from-[#0d0020] to-[#2d1052] rounded-3xl p-8 text-white mb-8">
            <h3 className="font-extrabold text-xl mb-4">What guests can contribute — all from one QR code</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon: 'Camera',       label: 'Photos',                   sub: 'Full resolution, no compression' },
                { icon: 'Video',        label: 'Videos',                   sub: 'Short clips, direct from camera' },
                { icon: 'Mic',          label: 'Voice Notes',              sub: 'Blessings in their own voice' },
                { icon: 'Smile',        label: 'Animated GIFs',            sub: 'From built-in GIF picker' },
                { icon: 'MessageSquare',label: 'Written Messages',         sub: 'Heartfelt wishes preserved forever' },
                { icon: 'Gift',         label: 'Cash Gifts',               sub: 'Pooled in any currency' },
                { icon: 'Mail',         label: 'Digital Cards',            sub: 'Beautiful cards for the couple' },
                { icon: 'Heart',        label: 'Anniversary Messages',     sub: 'Written now, delivered later' },
                { icon: 'Star',         label: 'Bridal Party Surprises',   sub: 'Pre-scheduled secret contributions' },
                { icon: 'Users',        label: 'Family Wishes',            sub: 'From everywhere in the world' },
              ].map(({ icon, label, sub }) => (
                <div key={label} className="flex items-center gap-3 bg-white/8 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/30 flex items-center justify-center flex-shrink-0">
                    <Icon name={icon} size={16} className="text-purple-200"/>
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{label}</p>
                    <p className="text-white/50 text-xs">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: 'Film', title: 'Memory Movie™', body: 'Every contribution is auto-assembled into a cinematic MP4 with background music. Not a slideshow — a film. Watch it on your anniversary for the rest of your lives.' },
              { icon: 'Radio', title: 'Live Wall at the Venue', body: 'Open the memory wall on any venue screen. Guest uploads appear in real time. The whole reception watches together as memories are made.' },
              { icon: 'Repeat', title: 'A Living Archive', body: 'Return on every anniversary. Add new photos. New voices. New messages. The memory wall grows with your marriage — not just a wedding day record.' },
            ].map(({ icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-purple-100 p-5 text-center bg-purple-50">
                <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-3">
                  <Icon name={icon} size={22} className="text-primary-600"/>
                </div>
                <h3 className="font-bold text-warm-900 mb-2 text-sm">{title}</h3>
                <p className="text-xs text-warm-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: Perfect For ── */}
      <section className="py-14 px-4 bg-gradient-to-br from-purple-50 to-white" id="perfect-for">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-500 mb-2 text-center">Section 5</p>
          <h2 className="text-2xl font-extrabold text-warm-900 text-center mb-8">Perfect for every wedding style</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { icon: 'Star',     label: 'Traditional Weddings' },
              { icon: 'Star',     label: 'Church Weddings' },
              { icon: 'Globe',    label: 'Destination Weddings' },
              { icon: 'Users',    label: 'Nigerian Weddings' },
              { icon: 'Globe',    label: 'African Weddings' },
              { icon: 'Sparkles', label: 'Indian Weddings' },
              { icon: 'Flag',     label: 'American Weddings' },
              { icon: 'Heart',    label: 'Small Weddings' },
              { icon: 'Users',    label: 'Large Weddings' },
              { icon: 'Award',    label: 'Luxury Weddings' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-purple-100 bg-white text-center">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Icon name={icon} size={18} className="text-primary-500"/>
                </div>
                <p className="text-xs font-semibold text-warm-700 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6: Wedding Timeline ── */}
      <section className="py-14 px-4 bg-white" id="wedding-timeline">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-500 mb-2 text-center">Section 6</p>
          <h2 className="text-2xl font-extrabold text-warm-900 text-center mb-8">How Thankeeu works across the wedding journey</h2>
          <div className="space-y-6">
            {[
              { phase: 'Before the Wedding', icon: 'Calendar', colour: '#7C3AED', bg: '#F5F0FF', steps: [
                'Guests receive the QR code and link with the invitation',
                'Bridesmaids and groomsmen add surprise messages in advance',
                'Guests upload rehearsal dinner and getting-ready photos',
                'Family abroad uploads wishes before they arrive',
                'Countdown timer builds anticipation on the wall',
              ]},
              { phase: 'Wedding Day', icon: 'Star', colour: '#EC4899', bg: '#FFF0F7', steps: [
                'QR code displayed on every table, venue screen and welcome sign',
                'Guests scan and upload from ceremony and reception',
                'Live slideshow runs on venue screens throughout the day',
                'Couple receives wishes and messages in real time',
                'Voice blessings recorded by elders and family',
                'Cash gifts contributed from anywhere in the world',
              ]},
              { phase: 'After the Wedding', icon: 'Heart', colour: '#16a34a', bg: '#f0fdf4', steps: [
                'Download the complete archive — all photos, videos, messages',
                'Watch the auto-generated Memory Movie™ together',
                'Share the album link with family who could not attend',
                'Return on your first anniversary to add new memories',
                'Build a living archive that grows year after year',
              ]},
            ].map(({ phase, icon, colour, bg, steps }) => (
              <div key={phase} className="rounded-2xl border-2 p-6" style={{ borderColor: colour + '30', background: bg }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: colour + '20' }}>
                    <Icon name={icon} size={20} style={{ color: colour }}/>
                  </div>
                  <h3 className="font-extrabold text-warm-900">{phase}</h3>
                </div>
                <ul className="space-y-2">
                  {steps.map(s => (
                    <li key={s} className="flex items-start gap-2 text-sm text-warm-600">
                      <Icon name="Check" size={14} className="mt-0.5 flex-shrink-0" style={{ color: colour }} strokeWidth={3}/>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 7: 25 FAQs ── */}
      <section className="py-14 px-4 bg-gradient-to-br from-purple-50 to-white" id="faq">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-500 mb-2 text-center">Section 7</p>
          <h2 className="text-2xl font-extrabold text-warm-900 text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-2">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="rounded-2xl border border-purple-100 bg-white group">
                <summary className="px-5 py-4 font-semibold text-warm-800 text-sm cursor-pointer list-none flex items-center justify-between gap-3">
                  <span>{q}</span>
                  <Icon name="ChevronDown" size={16} className="text-warm-400 flex-shrink-0 group-open:rotate-180 transition-transform"/>
                </summary>
                <p className="px-5 pb-4 text-sm text-warm-500 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 8: Internal Links ── */}
      <section className="py-10 px-4 bg-white" id="related">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-500 mb-4 text-center">Related pages</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { to: '/wedding-memory-wall',  label: 'Wedding QR Code Photo Wall' },
              { to: '/card/new',             label: 'Wedding Digital Guest Book' },
              { to: '/memory-movie',         label: 'Wedding Memory Book' },
              { to: '/pricing',              label: 'Wedding Registry Gift Pot' },
              { to: '/occasions/birthday',   label: 'Birthday Group Card' },
              { to: '/occasions/baby_shower',label: 'Baby Shower Card' },
              { to: '/occasions/leaving',    label: 'Farewell Card' },
              { to: '/employee-memory-wall', label: 'Employee Appreciation' },
              { to: '/occasions/anniversary',label: 'Wedding Anniversary Card' },
            ].map(({ to, label }) => (
              <Link key={to} to={to}
                className="px-4 py-2 rounded-xl border border-purple-100 text-sm font-medium text-warm-600 hover:text-primary-600 hover:border-primary-200 transition-colors bg-white">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 9: Comparison Summary ── */}
      <section className="py-14 px-4 bg-gradient-to-br from-purple-50 to-white" id="summary">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-500 mb-2 text-center">Section 9</p>
          <h2 className="text-2xl font-extrabold text-warm-900 text-center mb-8">Which platform should you choose?</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Icon name="Camera" size={18} className="text-slate-500"/>
                </div>
                <h3 className="font-extrabold text-warm-900">Choose {COMPETITOR} if…</h3>
              </div>
              <ul className="space-y-2 text-sm text-warm-600">
                <li className="flex items-start gap-2"><Icon name="Check" size={13} className="text-slate-400 mt-0.5 flex-shrink-0"/>You only need to collect guest photos</li>
                <li className="flex items-start gap-2"><Icon name="Check" size={13} className="text-slate-400 mt-0.5 flex-shrink-0"/>You do not need a gift pot or written messages</li>
                <li className="flex items-start gap-2"><Icon name="Check" size={13} className="text-slate-400 mt-0.5 flex-shrink-0"/>A standalone photo album is sufficient</li>
                <li className="flex items-start gap-2"><Icon name="Check" size={13} className="text-slate-400 mt-0.5 flex-shrink-0"/>You do not need the memory to live beyond the wedding day</li>
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-primary-200 bg-primary-50 p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Icon name="Sparkles" size={18} className="text-primary-600"/>
                </div>
                <h3 className="font-extrabold text-warm-900">Choose Thankeeu if…</h3>
              </div>
              <ul className="space-y-2 text-sm text-warm-600">
                <li className="flex items-start gap-2"><Icon name="Check" size={13} className="text-primary-500 mt-0.5 flex-shrink-0" strokeWidth={3}/>You want photos AND messages, voice notes, GIFs and gifts</li>
                <li className="flex items-start gap-2"><Icon name="Check" size={13} className="text-primary-500 mt-0.5 flex-shrink-0" strokeWidth={3}/>You want a cinematic Memory Movie made automatically</li>
                <li className="flex items-start gap-2"><Icon name="Check" size={13} className="text-primary-500 mt-0.5 flex-shrink-0" strokeWidth={3}/>You want NGN, GBP or USD payments</li>
                <li className="flex items-start gap-2"><Icon name="Check" size={13} className="text-primary-500 mt-0.5 flex-shrink-0" strokeWidth={3}/>You want a living memory archive for every anniversary</li>
                <li className="flex items-start gap-2"><Icon name="Check" size={13} className="text-primary-500 mt-0.5 flex-shrink-0" strokeWidth={3}/>You want the complete wedding memory experience</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 10: Strong CTA ── */}
      <section className="py-20 px-4 text-center bg-gradient-to-br from-[#0d0020] to-[#2d1052] text-white" id="cta">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Start Collecting Every Wedding Memory Today</h2>
          <p className="text-white/60 text-lg mb-10 leading-relaxed">
            Photos. Videos. Voice blessings. Written wishes. Cash gifts. All in one place — delivered as a Memory Movie they keep forever.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/card/new" className="px-8 py-4 rounded-2xl bg-primary-500 hover:bg-primary-600 font-bold text-base transition-all shadow-xl">
              Start Free — Create Wedding Album
            </Link>
            <Link to="/book-demo" className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-base border border-white/25 transition-all">
              Book a Demo
            </Link>
          </div>
          <p className="text-white/30 text-xs mt-6">Free to create and share. Pay only when you send. Works in 30+ currencies.</p>
        </div>
      </section>

      <Footer />
    </>
  );
}
