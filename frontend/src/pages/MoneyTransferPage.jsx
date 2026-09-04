import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSEO, SCHEMAS } from '../hooks/useSEO';
import { RotatingPrice } from '../utils/currencyUI';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';
import MoneyCardArt from '../components/MoneyCardArt';

/*
 * MoneyTransferPage — send money tucked inside a greeting card.
 *
 * Positioning: this is the SINGLE-card money-gift flow (not the group / board /
 * live-wall flow). A sender picks a design, writes a message, adds money via
 * Flutterwave, and sends it to one recipient's email. The recipient opens a
 * 3D flip card, reads it, then withdraws the money — to their bank or as a
 * gift card — after signing up with the same email the card was sent to.
 *
 * The CTA routes to signup; after auth the app opens the Money Transfer flow.
 * (App-side routing wired separately against live files.)
 */

const SEND_MONEY_TAB = '/dashboard/send-money';
const CTA = `/signup?returnTo=${encodeURIComponent(SEND_MONEY_TAB)}`;

const STEPS = [
  { n: '1', title: 'Pick a design', body: 'Choose a card cover you love. No board, no group link — just one beautiful card for one person.' },
  { n: '2', title: 'Add the details', body: "Who it's for, the occasion, and the email where it should land." },
  { n: '3', title: 'Write your message', body: 'Say the thing you actually mean. Add photos if you want.' },
  { n: '4', title: 'Add the money', body: 'Tuck any amount inside the card with Flutterwave. It travels with your words, not in a cold separate transfer.' },
  { n: '5', title: 'Send it', body: 'They get an email, flip through the card, read your message — then withdraw the money to their bank or as a gift card.' },
];

const WITHDRAW_OPTIONS = [
  { icon: 'CreditCard', title: 'Straight to their bank', body: 'The recipient enters their account details and the money lands in their bank. Powered by Flutterwave transfers.' },
  { icon: 'Gift',       title: 'Or as a gift card',       body: 'Prefer to shop? They can take it as a gift card — shopping, food, flowers and more, across Nigeria, the UK and the US.' },
];

const COMPARISON = [
  { them: 'A cold bank transfer with a reference line nobody reads', us: 'Money wrapped inside a card they actually open and keep' },
  { them: 'A separate app just to move money', us: 'The message and the money in one place, one link' },
  { them: 'Generic “you received a transfer” text', us: 'A 3D card they flip through with your photos and words' },
  { them: 'Recipient needs your app installed', us: 'They just open an email and withdraw — bank or gift card' },
];

const FAQS = [
  { q: 'How does sending money in a greeting card work?', a: 'You create a single greeting card, write your message, and add any amount of money using Flutterwave during creation. The card is emailed to your recipient. They open a 3D flip card, read your message, and then withdraw the money — either to their bank account or as a gift card.' },
  { q: 'How does the recipient withdraw the money?', a: 'The recipient opens the card from the email you sent it to. To withdraw, they sign up using that same email address for security, then choose to send the money to their bank account or claim it as a gift card. The email match ensures only the intended person can withdraw.' },
  { q: 'Can they take the money as a gift card instead of cash?', a: 'Yes. When withdrawing, the recipient can choose a bank transfer or a gift card across categories like shopping, food and flowers, available in Nigeria, the UK and the US.' },
  { q: 'Is it safe to send money this way?', a: 'Money is collected securely through Flutterwave, and withdrawal is locked to the recipient email you addressed the card to. Only the person who receives the email and signs up with it can claim the funds.' },
  { q: 'How is this different from LemFi, Chipper Cash or a normal transfer?', a: 'Those move money from A to B with nothing around it. Thankeeu sends the money inside a real greeting card — a designed cover, your written message, photos and a 3D flip experience — so the moment feels like a gift, not a transaction. The recipient still gets real money they can withdraw to their bank.' },
  { q: 'What does it cost?', a: 'Creating and personalising the card is free. A small one-time fee applies when you send, and the money you add travels to your recipient. There is no subscription.' },
];

export default function MoneyTransferPage() {
  useSEO({
    title: 'Send Money in a Greeting Card | Thankeeu Money Transfer',
    description: 'Send money to friends and family tucked inside a beautiful greeting card. They open a 3D card, read your message, and withdraw to their bank or as a gift card. A warmer alternative to a cold transfer.',
    canonical: 'https://www.thankeeu.com/send-money-greeting-card',
    ogType: 'website',
    jsonLd: [
      SCHEMAS.webPage(
        'Send Money in a Greeting Card',
        'Send money to loved ones inside a personalised greeting card. Recipients withdraw to their bank or as a gift card.',
        '/send-money-greeting-card'
      ),
      SCHEMAS.breadcrumb([
        { name: 'Home', path: '/' },
        { name: 'Send Money in a Greeting Card', path: '/send-money-greeting-card' },
      ]),
      SCHEMAS.faqPage(FAQS),
    ],
  });

  const [flip, setFlip] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setFlip(f => !f), 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-white">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold text-primary-700 bg-primary-100 px-3 py-1.5 rounded-full mb-5">
              <Icon name="Sparkles" size={14} /> Money that arrives as a gift, not a transfer
            </span>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-warm-900 leading-[1.05] mb-5">
              Send money inside a greeting card
            </h1>
            <p className="text-lg text-warm-600 leading-relaxed mb-8 max-w-xl">
              Tuck real money into a card your friend actually opens. They flip through it, read your message, and withdraw to their bank or as a gift card. Warmer than a cold transfer, realer than a text.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to={CTA} className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-primary-500 text-white font-bold text-lg hover:bg-primary-600 shadow-purple transition-colors">
                Send money in a card <Icon name="ArrowRight" size={20} />
              </Link>
              <a href="#how" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-primary-200 text-primary-700 font-bold text-lg hover:bg-primary-50 transition-colors">
                See how it works
              </a>
            </div>
            <p className="text-sm text-warm-500 mt-4 flex items-center gap-2">
              <Icon name="Shield" size={15} className="text-primary-500" /> Secured by Flutterwave · Withdraw to bank or gift card
            </p>
          </div>

          {/* 3D flip card visual */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative" style={{ perspective: '1400px' }}>
              <div
                className="relative w-[300px] h-[380px] transition-transform duration-700"
                style={{ transformStyle: 'preserve-3d', transform: flip ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
              >
                {/* Front */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl shadow-card"
                  style={{ backfaceVisibility: 'hidden' }}>
                  <MoneyCardArt amount="₦25,000" label="For you" hint="Tap to open your card" />
                </div>
                {/* Back */}
                <div className="absolute inset-0 rounded-3xl shadow-card bg-white border border-primary-100 p-7 flex flex-col"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                  <p className="text-xs font-bold text-primary-600 uppercase tracking-wide mb-3">Happy birthday</p>
                  <p className="text-warm-700 text-sm leading-relaxed flex-1">
                    Couldn't be there today, but I didn't want the day to pass without something real. Get yourself something lovely. Love you always.
                  </p>
                  <div className="mt-4 rounded-2xl bg-primary-50 p-4 text-center">
                    <p className="text-xs text-warm-500 mb-1">Gift inside</p>
                    <p className="font-display font-extrabold text-2xl text-primary-700">₦25,000</p>
                    <p className="text-xs text-primary-600 mt-1">Withdraw to bank or gift card</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-warm-900 mb-3">From your heart to their account, in five steps</h2>
          <p className="text-warm-600 text-lg max-w-2xl mx-auto">One card. One recipient. Real money inside.</p>
        </div>
        <div className="space-y-4">
          {STEPS.map(s => (
            <div key={s.n} className="flex items-start gap-5 rounded-2xl border border-primary-100 bg-white p-6 hover:shadow-card transition-shadow">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary-500 text-white font-display font-extrabold text-lg flex items-center justify-center">{s.n}</div>
              <div>
                <h3 className="font-bold text-warm-900 text-lg mb-1">{s.title}</h3>
                <p className="text-warm-600 leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to={CTA} className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary-500 text-white font-bold hover:bg-primary-600 shadow-purple">
            Start your money card <Icon name="ArrowRight" size={18} />
          </Link>
        </div>
      </section>

      {/* ── Withdraw options ── */}
      <section className="bg-warm-50 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-warm-900 mb-3">They choose how to receive it</h2>
            <p className="text-warm-600 text-lg">The recipient opens the card from their email, signs up with that same email to keep it secure, and withdraws.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {WITHDRAW_OPTIONS.map(o => (
              <div key={o.title} className="rounded-3xl bg-white border border-primary-100 p-8">
                <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center mb-5">
                  <Icon name={o.icon} size={24} className="text-primary-600" />
                </div>
                <h3 className="font-bold text-warm-900 text-xl mb-2">{o.title}</h3>
                <p className="text-warm-600 leading-relaxed">{o.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-warm-900 mb-3">A transfer moves money. A card moves people.</h2>
          <p className="text-warm-600 text-lg">Apps like a plain bank transfer get the money there. Thankeeu makes it mean something.</p>
        </div>
        <div className="rounded-3xl border border-primary-100 overflow-hidden">
          <div className="grid grid-cols-2 bg-primary-500 text-white font-bold text-sm">
            <div className="p-4 border-r border-white/20">A normal transfer</div>
            <div className="p-4">Money in a Thankeeu card</div>
          </div>
          {COMPARISON.map((row, i) => (
            <div key={i} className={`grid grid-cols-2 text-sm ${i % 2 ? 'bg-white' : 'bg-primary-50/40'}`}>
              <div className="p-4 border-r border-primary-100 text-warm-500 flex items-start gap-2">
                <Icon name="X" size={16} className="text-warm-400 flex-shrink-0 mt-0.5" /> {row.them}
              </div>
              <div className="p-4 text-warm-800 flex items-start gap-2">
                <Icon name="Check" size={16} className="text-primary-500 flex-shrink-0 mt-0.5" /> {row.us}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing strip ── */}
      <section className="bg-gradient-to-br from-primary-600 to-fuchsia-600 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center text-white">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl mb-3">Free to make. Small fee to send.</h2>
          <p className="text-white/85 text-lg mb-8">
            Personalise the whole card for free. Pay a small one-time fee only when you send — starting from <RotatingPrice amountNGN={5000} className="font-bold" />. The money you add goes to your recipient. No subscription.
          </p>
          <Link to={CTA} className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-primary-700 font-bold text-lg hover:bg-primary-50 transition-colors">
            Send money in a card <Icon name="ArrowRight" size={20} />
          </Link>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-warm-900 mb-10 text-center">Questions people ask</h2>
        <div className="space-y-4">
          {FAQS.map((f, i) => (
            <details key={i} className="group rounded-2xl border border-primary-100 bg-white p-6">
              <summary className="flex items-center justify-between cursor-pointer font-bold text-warm-900 list-none">
                {f.q}
                <Icon name="ChevronDown" size={20} className="text-primary-500 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-warm-600 leading-relaxed mt-4">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
        <div className="rounded-3xl bg-primary-50 border border-primary-100 p-10 sm:p-14 text-center">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-warm-900 mb-4">Send the money. Send the moment.</h2>
          <p className="text-warm-600 text-lg mb-8 max-w-xl mx-auto">
            Next time you'd send a plain transfer, send a card with the money inside instead. They'll remember it.
          </p>
          <Link to={CTA} className="inline-flex items-center gap-2 px-9 py-4 rounded-2xl bg-primary-500 text-white font-bold text-lg hover:bg-primary-600 shadow-purple">
            Get started free <Icon name="ArrowRight" size={20} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
