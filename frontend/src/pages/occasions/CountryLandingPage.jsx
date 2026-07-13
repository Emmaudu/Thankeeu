import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useSEO, SCHEMAS } from '../../hooks/useSEO';

/**
 * Country landing pages — target "online group cards <country>" head terms.
 * One shared component, unique per-country copy (NOT templated thin content:
 * each country block has its own payments, currency, use-cases, FAQs, and
 * internal links to that country's blog posts).
 */

const COUNTRIES = {
  uk: {
    path: '/online-group-cards-uk',
    title: 'Online Group Cards UK — Sign Together, Add a Group Gift | Thankeeu',
    desc: 'Create an online group card in the UK in under 2 minutes. Colleagues sign from one link — messages, photos, GIFs, voice notes — and chip in to a group gift in GBP. Free to start, no signup needed to sign.',
    keywords: 'online group cards UK, group ecard UK, group birthday card UK, leaving card online UK, farewell card for colleague UK, group card for coworker, collect money for colleague gift UK',
    h1: 'Online Group Cards for UK Teams',
    sub: 'One link. The whole team signs. Pool a gift in GBP. Delivered on the day.',
    currency: 'GBP (£)',
    locale: 'en_GB',
    payments: 'Pay by UK debit/credit card. Contributions pool in GBP with transparent fees.',
    useCases: [
      ['Leaving cards', 'The classic office leaving card — without chasing the card around the office. Everyone signs online, from anywhere.'],
      ['Birthday cards', 'Collect messages, photos and GIFs from the whole team, plus a group gift in pounds.'],
      ['Work anniversaries & retirements', 'Mark 5, 10, 25 years properly — messages from colleagues past and present.'],
      ['New baby, weddings & get well soon', 'For hybrid and remote UK teams where a paper card can\'t reach everyone.'],
    ],
    faqs: [
      ['How much does an online group card cost in the UK?', 'A single group card starts free to create; premium designs and gift pooling carry a small fee shown upfront in GBP. Teams get unlimited cards on a subscription.'],
      ['Can people sign without creating an account?', 'Yes — anyone with the link can add a message, photo, GIF or voice note without signing up.'],
      ['How do group gift contributions work in the UK?', 'Everyone chips in what they like by card in GBP. The organiser or recipient withdraws the pooled gift.'],
      ['Is Thankeeu a UK alternative to Thankbox or Kudoboard?', 'Yes — Thankeeu offers group cards with gift pooling in GBP, voice notes, scheduled delivery and team automation, often at a lower price point.'],
    ],
    blogLinks: [
      ['/blog/best-online-group-cards-uk-2025', 'Best online group cards in the UK (2025 comparison)'],
      ['/blog/thankbox-vs-kudoboard-vs-thankeeu-uk-2025', 'Thankbox vs Kudoboard vs Thankeeu — UK'],
      ['/blog/farewell-card-messages-uk-colleagues-2025', 'Farewell card messages for UK colleagues'],
      ['/blog/collect-money-colleague-gift-uk-2025', 'How to collect money for a colleague\'s gift in the UK'],
    ],
  },
  us: {
    path: '/online-group-cards-us',
    title: 'Online Group Cards US — Group Ecards & Group Gifts | Thankeeu',
    desc: 'Create an online group card for your US team. Coworkers sign from one link — messages, photos, GIFs, voice notes — and pool a group gift in USD. Free to start; nobody needs an account to sign.',
    keywords: 'online group cards US, group ecard, group birthday card for coworker, farewell card online, office group card, group card everyone can sign, collect money for coworker gift',
    h1: 'Online Group Cards for US Teams',
    sub: 'One link for the whole team. Sign, celebrate, and pool a gift in USD.',
    currency: 'USD ($)',
    locale: 'en_US',
    payments: 'Pay by US debit/credit card. Contributions pool in USD with fees shown upfront.',
    useCases: [
      ['Farewell & goodbye cards', 'A coworker\'s last day deserves more than a Slack thread. Everyone signs one card, from any office or time zone.'],
      ['Birthday cards', 'Messages, photos and GIFs from the whole team — plus a pooled gift card or cash gift.'],
      ['Work anniversaries & promotions', 'Automate recognition so nobody\'s milestone slips through the cracks.'],
      ['Remote & distributed teams', 'Built for teams spread across states and time zones — no printer, no envelope, no desk to pass a card around.'],
    ],
    faqs: [
      ['How much does an online group card cost in the US?', 'Creating a card is free to start; premium designs and gift pooling carry a small upfront fee in USD. Teams get unlimited cards on a subscription.'],
      ['Do coworkers need an account to sign?', 'No — anyone with the link can add messages, photos, GIFs or voice notes instantly.'],
      ['Can we pool money for a group gift?', 'Yes — everyone contributes what they want in USD, and the recipient or organizer withdraws the total.'],
      ['Is Thankeeu an alternative to Kudoboard in the US?', 'Yes — Thankeeu adds gift pooling, voice notes, scheduled delivery and HR automation, typically at a lower price.'],
    ],
    blogLinks: [
      ['/blog/best-online-group-cards-us-2025', 'Best online group cards in the US (2025)'],
      ['/blog/kudoboard-vs-thankeeu-us-hr-2025', 'Kudoboard vs Thankeeu for US teams'],
      ['/blog/online-farewell-cards-us-employees-2025', 'Online farewell cards for US employees'],
      ['/blog/group-card-ideas-us-workplace-occasions', 'Group card ideas for US workplace occasions'],
    ],
  },
  canada: {
    path: '/online-group-cards-canada',
    title: 'Online Group Cards Canada — Group Ecards & Gifts in CAD | Thankeeu',
    desc: 'Create an online group card for your Canadian team. Everyone signs from one link — messages, photos, GIFs, voice notes — and chips in to a group gift. Free to start, bilingual-team friendly.',
    keywords: 'online group cards Canada, group ecard Canada, group birthday card Canada, farewell card for colleague Canada, office card everyone signs, collect money for coworker gift Canada',
    h1: 'Online Group Cards for Canadian Teams',
    sub: 'One link, every colleague — from Vancouver to Halifax. Pool a gift together.',
    currency: 'CAD ($)',
    locale: 'en_CA',
    payments: 'Pay by Canadian debit/credit card. Contributions pool with fees shown upfront.',
    useCases: [
      ['Farewell & retirement cards', 'Send off a colleague properly, even across a fully remote Canadian team.'],
      ['Birthday cards', 'Messages, photos and GIFs from everyone — plus a pooled group gift.'],
      ['Bilingual teams', 'Colleagues sign in English or French — every message appears exactly as written.'],
      ['Work anniversaries', 'Automate milestone cards so distributed teams never miss one.'],
    ],
    faqs: [
      ['How much does an online group card cost in Canada?', 'Free to start; premium designs and gift pooling carry a small fee shown upfront. Teams get unlimited cards on a subscription.'],
      ['Can colleagues sign in French?', 'Yes — signers write in any language, and messages display exactly as written.'],
      ['Do signers need an account?', 'No — anyone with the link can sign instantly with a message, photo, GIF or voice note.'],
      ['Is Thankeeu available across Canada?', 'Yes — it\'s fully online, so it works for teams in every province and time zone.'],
    ],
    blogLinks: [
      ['/blog/best-online-group-cards-canada-2025', 'Best online group cards in Canada (2025)'],
      ['/blog/thankbox-vs-thankeeu-canada-2025', 'Thankbox vs Thankeeu — Canada'],
      ['/blog/group-cards-bilingual-canadian-teams', 'Group cards for bilingual Canadian teams'],
      ['/blog/farewell-card-messages-canadian-colleagues-2025', 'Farewell messages for Canadian colleagues'],
    ],
  },
  nigeria: {
    path: '/online-group-cards-nigeria',
    title: 'Online Group Cards Nigeria — Sign Together, Pool a Naira Gift | Thankeeu',
    desc: 'Create an online group card in Nigeria. The whole team signs from one WhatsApp link — messages, photos, voice notes — and pools a Naira gift with secure Flutterwave payments. Withdraw to any Nigerian bank.',
    keywords: 'online group cards Nigeria, group ecard Nigeria, group birthday card Nigeria, farewell card for colleague Nigeria, contribute money for colleague gift Nigeria, ajo for office gift',
    h1: 'Online Group Cards for Nigerian Teams',
    sub: 'Share one link on WhatsApp. Everyone signs. Pool a Naira gift — no cash chasing.',
    currency: 'NGN (₦)',
    locale: 'en_NG',
    payments: 'Pay by card, bank transfer or USSD via Flutterwave. Withdraw pooled gifts to any Nigerian bank account.',
    useCases: [
      ['Office birthdays', 'The whole team signs from their phones — messages, photos and voice notes — plus a pooled Naira gift.'],
      ['Send-forth & farewell cards', 'Give departing colleagues a proper Nigerian send-off, with contributions that go straight to their bank.'],
      ['Weddings, new babies & graduations', 'Family, church and colleagues celebrate together on one card — no matter the city.'],
      ['Company-wide recognition', 'HR teams automate birthday and anniversary cards for every staff member.'],
    ],
    faqs: [
      ['How do gift contributions work in Nigeria?', 'Everyone chips in by card, transfer or USSD through Flutterwave. The recipient withdraws the pooled Naira gift to any Nigerian bank.'],
      ['Do signers need an account?', 'No — anyone with the WhatsApp link can sign with a message, photo or voice note instantly.'],
      ['How much does it cost?', 'Free to start. Premium designs and gift pooling carry a small fee shown upfront in Naira.'],
      ['Does it work outside Lagos?', 'Yes — it\'s fully online and works anywhere in Nigeria, and diaspora family abroad can sign and contribute too.'],
    ],
    blogLinks: [
      ['/blog/best-online-group-cards-nigeria-2025', 'Best online group cards in Nigeria (2025)'],
      ['/blog/employee-recognition-ideas-nigerian-companies', 'Employee recognition ideas for Nigerian companies'],
      ['/blog/group-gifting-nigeria-paystack', 'Group gifting for Nigerian teams'],
      ['/blog/birthday-card-messages-colleagues-nigeria', 'Birthday messages for Nigerian colleagues'],
    ],
  },
};

export default function CountryLandingPage({ country }) {
  const d = COUNTRIES[country];

  useSEO(d ? {
    title: d.title,
    description: d.desc,
    keywords: d.keywords,
    canonical: d.path,
    locale: d.locale,
    jsonLd: [
      SCHEMAS.organization,
      SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }, { name: d.h1, url: d.path }]),
      SCHEMAS.webPage(d.title, d.desc, d.path),
      {
        '@type': 'FAQPage',
        mainEntity: (d.faqs || []).map(([q, a]) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
    ],
  } : { title: 'Group Cards — Thankeeu', description: 'Create a group card everyone signs.', canonical: '/', noIndex: true });

  if (!d) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col">
      <Navbar />
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-16 pb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-warm-900 mb-4">{d.h1}</h1>
        <p className="text-lg text-warm-600 mb-8 max-w-2xl mx-auto">{d.sub}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/card/new" className="btn-primary px-8 py-3 text-lg">Create a group card</Link>
          <Link to="/sample" className="btn-secondary px-8 py-3 text-lg">See a live demo</Link>
        </div>
      </section>

      {/* How it works (brief) */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-warm-900 mb-6 text-center">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="font-bold text-warm-900 mb-2">1. Create the card</p>
            <p className="text-sm text-warm-600">Pick an occasion and design, set the delivery date. Under 2 minutes.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="font-bold text-warm-900 mb-2">2. Share one link</p>
            <p className="text-sm text-warm-600">Everyone signs from their phone or laptop — no account needed. Messages, photos, GIFs and voice notes.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="font-bold text-warm-900 mb-2">3. Pool a gift in {d.currency}</p>
            <p className="text-sm text-warm-600">{d.payments}</p>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-warm-900 mb-6 text-center">What teams use it for</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {(d.useCases || []).map(([title, body]) => (
            <div key={title} className="bg-white rounded-2xl p-6 shadow-sm">
              <p className="font-bold text-warm-900 mb-2">{title}</p>
              <p className="text-sm text-warm-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-warm-900 mb-6 text-center">Frequently asked questions</h2>
        <div className="space-y-4">
          {(d.faqs || []).map(([q, a]) => (
            <details key={q} className="bg-white rounded-2xl p-5 shadow-sm">
              <summary className="font-semibold text-warm-900 cursor-pointer">{q}</summary>
              <p className="text-sm text-warm-600 mt-3">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Related guides — internal links */}
      <section className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-warm-900 mb-4 text-center">Guides &amp; comparisons</h2>
        <ul className="space-y-2 text-center">
          {(d.blogLinks || []).map(([href, label]) => (
            <li key={href}><Link to={href} className="text-primary-600 hover:underline">{label}</Link></li>
          ))}
        </ul>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-4 py-14 text-center">
        <h2 className="text-2xl font-bold text-warm-900 mb-4">Start your group card now</h2>
        <Link to="/card/new" className="btn-primary px-8 py-3 text-lg">Create a group card — free to start</Link>
      </section>
      <Footer />
    </div>
  );
}

export function GroupCardsUK()      { return <CountryLandingPage country="uk" />; }
export function GroupCardsUS()      { return <CountryLandingPage country="us" />; }
export function GroupCardsCanada()  { return <CountryLandingPage country="canada" />; }
export function GroupCardsNigeria() { return <CountryLandingPage country="nigeria" />; }
