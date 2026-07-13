import { useSEO, SCHEMAS } from '../hooks/useSEO';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';

const STEPS = [
  { num:'01', icon:'Sparkles', title:'Set up your card — 2 minutes', desc:'Choose from 14 occasions. Pick a design, add the recipient\'s name and set a delivery date. Enable the Live Photo Wall™ and a QR code is automatically generated for you — ready to print or display at the venue.', tip:'Tip: Your QR code is ready the moment you create the card. No extra setup needed.' },
  { num:'02', icon:'Share', title:'Share the link — or print the QR code', desc:'You get a unique signing link AND a QR code. Drop the link in WhatsApp, email or Slack. For live events, print the QR on table cards or show it on screen — guests scan and contribute instantly.', tip:'Tip: For parties and weddings, QR codes on every table mean zero chasing.' },
  { num:'03', icon:'Message', title:'Everyone adds their message', desc:'Each person writes a heartfelt message. They can also attach a photo, video, voice note, or GIF. Private messages are only visible to the recipient.', tip:'Tip: Send reminders from your dashboard to nudge anyone who hasn\'t signed yet.' },
  { num:'04', icon:'Gift', title:'Pool a gift — no chasing, no awkwardness', desc:'Enable the gift pot and anyone can chip in whatever they can afford. Works in USD, GBP, EUR, NGN and 30+ currencies. No cash collection. No awkward messages. It all pools automatically.', tip:'Tip: Set a suggested gift amount during card creation to make it easy for contributors.' },
  { num:'05', icon:'Rocket', title:'Send it — scheduled or instantly', desc:'When you\'re ready, pay the one-time sending fee (from $3.99 / £2.99 / ₦5,000 depending on your currency) and send. Or schedule it for a specific date and time — even weeks in advance.', tip:'Tip: Schedule it for 8am on their birthday so they wake up to a surprise.' },
  { num:'06', icon:'Party', title:'They open the card — and the movie', desc:'Your recipient gets a beautiful email with a link to their card. They read every message, watch videos, listen to voice notes, claim the gift — and watch their auto-generated Memory Movie™, a cinematic film of everyone who celebrated them.', tip:'Tip: Share the card link on social media after — it makes a beautiful memory worth revisiting.' },
];

export default function HowItWorks() {
  useSEO({
    title: 'How It Works — Create an Online Group Card in 2 Minutes | Thankeeu',
    description: 'Create a group card, share one link, collect messages, photos and gifts, then deliver it automatically. Optionally add a Memory Movie slideshow and a Live Photo Wall to collect guest photos via QR code. No signup needed to sign. Free to start.',
    keywords: 'how to create group card online, how group cards work, WhatsApp group card, memory movie slideshow, collect guest photos QR code, live photo wall event',
    canonical: '/how-it-works',
    jsonLd: [
      SCHEMAS.organization,
      SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }, { name: 'How it works', url: '/how-it-works' }]),
      SCHEMAS.webPage('How Thankeeu works', 'Create a group card in 2 minutes — share one link, collect messages and gifts, deliver automatically.', '/how-it-works'),
      SCHEMAS.howTo(
        'How to create and send an online group card with Thankeeu',
        'Set up a group card, collect messages and a pooled gift from everyone via one link, then deliver it at a scheduled time.',
        STEPS.map(s => ({ name: s.title, text: s.desc })),
        '/how-it-works',
      ),
    ],
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background:'#FDFCFF' }}>
      <Navbar />

      {/* Hero */}
      <section className="py-14 md:py-20 px-4 text-center section-dots" style={{ background:'linear-gradient(160deg,#F5F0FF,#FDFCFF 60%,#FFF0F5)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="mx-auto mb-4 inline-flex items-center gap-1.5"><Icon name="Lightbulb" size={13}/> How it works</div>
          <h1 style={{ fontFamily:"'Nunito',sans-serif", fontWeight:900, fontSize:'clamp(2rem,6vw,3rem)', letterSpacing:'-0.02em', color:'#1A1035', marginBottom:'1rem' }}>
            From one link to a card they'll<br/><span style={{ color:'#7C3AED' }}>treasure for years</span>
          </h1>
          <p className="text-warm-600 text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            One link. Everyone signs from their phone. A gift pools automatically. The card delivers itself at exactly the right moment — and becomes a cinematic Memory Movie they keep forever.
          </p>
          <Link to="/card/new" className="btn-primary px-8 py-4 text-base inline-flex items-center gap-2"><Icon name="Sparkles" size={17}/> Create a free card</Link>
        </div>
      </section>

      {/* Steps */}
      <section className="py-14 md:py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-8">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex gap-5 sm:gap-7">
                <div className="flex flex-col items-center gap-0 flex-shrink-0">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm"
                    style={{ background:'linear-gradient(135deg,#8B5CF6,#7C3AED)', color:'#fff', fontFamily:"'Nunito',sans-serif", fontWeight:900 }}>
                    {s.num}
                  </div>
                  {i < STEPS.length - 1 && <div className="w-0.5 flex-1 mt-2 min-h-[2rem]" style={{ background:'linear-gradient(180deg,#C4B5FD,transparent)' }} />}
                </div>
                <div className="pb-8 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center mb-3"><Icon name={s.icon} size={22} className="text-primary-600"/></div>
                  <h2 style={{ fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:'1.25rem', color:'#1A1035', marginBottom:'0.5rem', letterSpacing:'-0.01em' }}>{s.title}</h2>
                  <p className="text-warm-600 text-sm leading-relaxed mb-3">{s.desc}</p>
                  <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-2.5 text-xs text-primary-700 font-medium flex items-start gap-2">
                    <Icon name="Lightbulb" size={14} className="flex-shrink-0 mt-0.5"/> {s.tip}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 text-center section-dots" style={{ background:'linear-gradient(135deg,#F5F0FF,#FFF0F5)' }}>
        <div className="max-w-lg mx-auto">
          <h2 style={{ fontFamily:"'Nunito',sans-serif", fontWeight:900, fontSize:'clamp(1.6rem,5vw,2.2rem)', letterSpacing:'-0.02em', color:'#1A1035', marginBottom:'0.75rem' }}>
            Ready to make someone's day?
          </h2>
          <p className="text-warm-600 mb-7">Free to create and share. Pay only when you send. Works in USD, GBP, EUR, NGN and 30+ currencies.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/card/new" className="btn-primary px-8 py-4 text-base w-full sm:w-auto inline-flex items-center justify-center gap-2"><Icon name="Sparkles" size={17}/> Create a free card</Link>
            <Link to="/pricing" className="btn-secondary px-8 py-4 text-base w-full sm:w-auto inline-flex items-center justify-center gap-2"><Icon name="Card" size={17}/> See pricing</Link>
          </div>
        </div>
      </section>
      {/* QR Code callout for live events */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl border-2 border-pink-100 overflow-hidden" style={{background:'linear-gradient(135deg,#FFF0F7,#F5F0FF)'}}>
            <div className="p-7 sm:p-10">
              <div className="flex flex-col sm:flex-row gap-8 items-start">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-pink-100 text-pink-700 text-xs font-bold uppercase tracking-widest mb-4">
                    <Icon name="QrCode" size={14}/> Live Events
                  </div>
                  <h3 className="text-2xl font-extrabold text-warm-900 mb-3">
                    Your event QR code is generated automatically
                  </h3>
                  <p className="text-warm-600 text-base mb-5 leading-relaxed">
                    Enable the Live Memory Wall when creating your card and Thankeeu generates a unique QR code for your event — instantly. No extra steps. Print it, display it on a venue screen, or share the link on WhatsApp. Guests scan and upload from any phone.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 mb-6">
                    {[
                      { icon: 'Printer', text: 'Print on table cards or welcome signs' },
                      { icon: 'Monitor', text: 'Display on venue screen or projector' },
                      { icon: 'MessageCircle', text: 'Share link on WhatsApp before the event' },
                      { icon: 'Download', text: 'Download high-res PNG — print ready' },
                    ].map(({ icon, text }) => (
                      <div key={text} className="flex items-start gap-2 text-sm text-warm-600">
                        <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon name={icon} size={14} className="text-primary-600"/>
                        </div>
                        {text}
                      </div>
                    ))}
                  </div>
                  <Link to="/live-memory-wall" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white transition-all hover:scale-105" style={{background:'linear-gradient(135deg,#EC4899,#DB2777)'}}>
                    <Icon name="QrCode" size={16}/> See how the Live Memory Wall works
                  </Link>
                </div>
                <div className="sm:w-48 flex-shrink-0 text-center">
                  <div className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm mx-auto max-w-[180px]">
                    <div className="w-20 h-20 mx-auto mb-3 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <Icon name="QrCode" size={40} className="text-primary-500"/>
                    </div>
                    <p className="text-xs font-bold text-warm-700 mb-1">Auto-generated QR</p>
                    <p className="text-xs text-warm-400 leading-snug">Ready to print or share the moment your card is created</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      <Footer />
    </div>
  );
}
