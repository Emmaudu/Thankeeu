import { useSEO } from '../hooks/useSEO';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';

const FAQS = [
  { cat:'Getting started', q:'Is Thankeeu free to use?', a:'Creating a card and collecting messages and contributions is completely free. You pay a one-time ₦5,000 activation fee when you\'re ready to send the card to the recipient. No subscriptions for personal use.' },
  { cat:'Getting started', q:'Do I need a Thankeeu account to sign a card?', a:'No. Signers just need the link. They click it, write their message, and optionally contribute to the gift pot — no account or app required.' },
  { cat:'Getting started', q:'Does the recipient need an account?', a:'No. The recipient receives an email with a link to their card. They can read all messages, watch videos, listen to voice notes and claim the gift without signing up.' },
  { cat:'Getting started', q:'How long does it take to create a card?', a:'Less than 2 minutes. Pick an occasion, set the recipient\'s name, choose a design, set a delivery date, pay ₦5,000 and share the signing link. Done.' },
  { cat:'Payments & gifts', q:'What payment methods are supported?', a:'All Nigerian debit and credit cards (Visa, Mastercard, Verve), bank transfers, USSD (*737#, *822# etc) and mobile money via Flutterwave. Flutterwave also accepts some international cards.' },
  { cat:'Payments & gifts', q:'How does the gift pot work?', a:'When you create a card, you can optionally enable a gift pot. Contributors pay via Flutterwave when they sign the card. All contributions are pooled automatically. The recipient can withdraw the total to their bank account when the card arrives.' },
  { cat:'Payments & gifts', q:'Is there a minimum gift contribution?', a:'Yes — ₦2,500 minimum per contributor. This ensures payment processing fees don\'t eat into small contributions.' },
  { cat:'Payments & gifts', q:'Can people outside Nigeria contribute?', a:'Yes. Flutterwave accepts international Visa and Mastercard. Your signers can chip in from anywhere in the world.' },
  { cat:'Payments & gifts', q:'How does the recipient withdraw their gift?', a:'The recipient saves their Nigerian bank account details in their Thankeeu profile (or when they first claim). Then they click "Withdraw to bank" and the money is transferred via Flutterwave usually within 1–2 business days.' },
  { cat:'Cards & media', q:'What types of messages can contributors leave?', a:'Text messages, photos, videos (up to 50MB), voice notes, and GIFs. Multiple media files can be attached per message. Private messages are only visible to the recipient.' },
  { cat:'Cards & media', q:'Can I schedule a card to send on a specific date?', a:'Yes. Pick any future date and time during card creation. Thankeeu sends the card automatically even if you forget — great for birthdays you want to plan ahead.' },
  { cat:'Cards & media', q:'Is there a limit on how many people can sign?', a:'No. Invite your entire company, school, or friend group. The more signatures, the more meaningful the card.' },
  { cat:'Cards & media', q:'Can signers set a deadline for signing?', a:'The card creator sets a signing deadline. After the deadline, the card is locked and sent. Contributors who miss the deadline won\'t be able to add their message.' },
  { cat:'For companies', q:'What is Thankeeu for Teams?', a:'Thankeeu for Teams is a subscription service for HR teams. It automatically creates birthday and occasion cards for your employees, notifies their department to sign, and handles the gift pot — all without any manual effort.' },
  { cat:'For companies', q:'How does the HRIS integration work?', a:'Connect your HRIS platform (SeamlessHR, BambooHR, Zoho People, WorkPay etc). Thankeeu imports all employee birthdays and occasion data. After that, cards are created and sent automatically on schedule.' },
  { cat:'For companies', q:'What is the company subscription price?', a:'₦200,000/month or ₦2,400,000/year. This covers unlimited employees and all automated occasions. HRIS sync and advanced analytics are included.' },
  { cat:'For companies', q:'Can team leaders request deductions from gift pots?', a:'Yes. Team leaders can request a deduction from a card\'s gift pot (e.g. for physical decorations or a team lunch). HR approves the amount, and the leader withdraws directly to their bank account.' },
];

const cats = ['All', ...new Set(FAQS.map(f => f.cat))];

export default function FAQ() {
  useSEO({
    title: 'FAQ — Frequently Asked Questions about Thankeeu',
    description: 'Everything you need to know about Thankeeu group cards, Naira gift pots, secure payments, company subscriptions and more.',
    canonical: '/faq',
  });

  const [activeCat, setActiveCat] = useState('All');
  const [open, setOpen] = useState(null);
  const filtered = activeCat === 'All' ? FAQS : FAQS.filter(f => f.cat === activeCat);

  return (
    <div className="min-h-screen flex flex-col" style={{ background:'#FDFCFF' }}>
      <Navbar />

      <section className="py-12 md:py-16 px-4 text-center" style={{ background:'linear-gradient(160deg,#F5F0FF,#FDFCFF 60%,#FFF0F5)' }}>
        <div className="pill mx-auto mb-4 inline-flex items-center gap-1.5"><Icon name="HelpCircle" size={13}/> FAQ</div>
        <h1 style={{ fontFamily:"'Nunito',sans-serif", fontWeight:900, fontSize:'clamp(1.75rem,6vw,3rem)', letterSpacing:'-0.02em', color:'#1A1035', marginBottom:'0.75rem' }}>
          Frequently asked questions
        </h1>
        <p className="text-warm-600 max-w-xl mx-auto">Everything you need to know about Thankeeu.</p>
      </section>

      <section className="py-10 md:py-14 px-4 flex-1">
        <div className="max-w-3xl mx-auto">
          {/* Category pills */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {cats.map(cat => (
              <button key={cat} onClick={() => setActiveCat(cat)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all border-2 ${activeCat === cat ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-warm-600 border-purple-200 hover:border-primary-300'}`}>
                {cat}
              </button>
            ))}
          </div>

          {/* FAQs */}
          <div className="space-y-2">
            {filtered.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border-2 border-purple-100 overflow-hidden">
                <button onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left gap-4 hover:bg-purple-50 transition-colors">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary-50 text-primary-600 flex-shrink-0 mt-0.5">{faq.cat}</span>
                    <span style={{ fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:'0.875rem', color:'#1A1035' }}>{faq.q}</span>
                  </div>
                  <span className={`text-primary-400 flex-shrink-0 text-xl font-bold transition-transform ${open === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {open === i && (
                  <div className="px-5 pb-5 animate-fade-in">
                    <p className="text-sm text-warm-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 text-center" style={{ background:'linear-gradient(135deg,#F5F0FF,#FFF0F5)' }}>
        <div className="max-w-lg mx-auto">
          <h2 style={{ fontFamily:"'Nunito',sans-serif", fontWeight:900, fontSize:'1.5rem', letterSpacing:'-0.01em', color:'#1A1035', marginBottom:'0.5rem' }}>Still have questions?</h2>
          <p className="text-warm-600 text-sm mb-6">Our team responds within 24 hours.</p>
          <a href="mailto:support@thankeeu.com" className="btn-primary px-8 py-3.5 inline-flex items-center gap-2"><Icon name="Mail" size={16}/> Email support</a>
        </div>
      </section>
      <Footer />
    </div>
  );
}
