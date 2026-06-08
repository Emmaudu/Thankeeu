import { useSEO } from '../hooks/useSEO';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const STEPS = [
  { num:'01', icon:'✨', title:'Create your card in 2 minutes', desc:'Choose from 14 occasions — birthday, farewell, graduation, promotion and more. Pick a beautiful design, add the recipient\'s name and set a delivery date.', tip:'Tip: You don\'t need the recipient\'s email yet. Just set it up and share the signing link first.' },
  { num:'02', icon:'📲', title:'Share the signing link', desc:'You\'ll get a unique signing link. Drop it in your WhatsApp group, Slack channel, or email thread. Your signers click it — no app download, no login needed.', tip:'Tip: Set a deadline so everyone signs before the card is sent.' },
  { num:'03', icon:'💬', title:'Everyone adds their message', desc:'Each person writes a heartfelt message. They can also attach a photo, video, voice note, or GIF. Private messages are only visible to the recipient.', tip:'Tip: Send reminders from your dashboard to nudge anyone who hasn\'t signed yet.' },
  { num:'04', icon:'🎁', title:'Pool a gift — optional but loved', desc:'Enable the gift pot and signers can chip in any amount via Paystack. No awkward cash collection — it all pools automatically.', tip:'Tip: Set a suggested gift amount during card creation to make it easy for contributors.' },
  { num:'05', icon:'🚀', title:'Send it — scheduled or instantly', desc:'When you\'re ready, pay the one-time ₦5,000 activation fee and send. Or schedule it for a specific date and time — even weeks in advance.', tip:'Tip: Schedule it for 8am on their birthday so they wake up to a surprise.' },
  { num:'06', icon:'🎊', title:'Recipient opens the card', desc:'Your recipient gets a beautiful email with a link to their card. They read every message, watch videos, listen to voice notes — and claim the gift to their bank account.', tip:'Tip: Share the card link on social media after — it makes a beautiful memory.' },
];

export default function HowItWorks() {
  useSEO({
    title: 'How Thankeeu Works — Create, Sign, Gift in Minutes',
    description: 'Step-by-step guide to creating a group card on Thankeeu. Create, invite signers, pool a Naira gift via Paystack, and deliver the surprise.',
    canonical: '/how-it-works',
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background:'#FDFCFF' }}>
      <Navbar />

      {/* Hero */}
      <section className="py-14 md:py-20 px-4 text-center" style={{ background:'linear-gradient(160deg,#F5F0FF,#FDFCFF 60%,#FFF0F5)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="pill mx-auto mb-4">💡 How it works</div>
          <h1 style={{ fontFamily:"'Nunito',sans-serif", fontWeight:900, fontSize:'clamp(2rem,6vw,3rem)', letterSpacing:'-0.02em', color:'#1A1035', marginBottom:'1rem' }}>
            Celebrate anyone, anywhere<br/><span style={{ color:'#7C3AED' }}>in under 3 minutes</span>
          </h1>
          <p className="text-warm-600 text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            No design skills needed. No spreadsheets. No chasing people for contributions. Just a beautiful card and a gift — delivered.
          </p>
          <Link to="/signup" className="btn-primary px-8 py-4 text-base">✨ Create your first card free</Link>
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
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <h2 style={{ fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:'1.25rem', color:'#1A1035', marginBottom:'0.5rem', letterSpacing:'-0.01em' }}>{s.title}</h2>
                  <p className="text-warm-600 text-sm leading-relaxed mb-3">{s.desc}</p>
                  <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-2.5 text-xs text-primary-700 font-medium">
                    💡 {s.tip}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 text-center" style={{ background:'linear-gradient(135deg,#F5F0FF,#FFF0F5)' }}>
        <div className="max-w-lg mx-auto">
          <h2 style={{ fontFamily:"'Nunito',sans-serif", fontWeight:900, fontSize:'clamp(1.6rem,5vw,2.2rem)', letterSpacing:'-0.02em', color:'#1A1035', marginBottom:'0.75rem' }}>
            Ready to make someone's day?
          </h2>
          <p className="text-warm-600 mb-7">Free to start. ₦5,000 to send. No subscriptions.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup" className="btn-primary px-8 py-4 text-base w-full sm:w-auto">✨ Start free</Link>
            <Link to="/pricing" className="btn-secondary px-8 py-4 text-base w-full sm:w-auto">💳 See pricing</Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
