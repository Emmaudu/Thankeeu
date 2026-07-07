import { Link } from 'react-router-dom';
import { useSEO, SCHEMAS } from '../../hooks/useSEO';

/**
 * Occasion landing pages targeting keywords Thankbox ranks for that Thankeeu
 * previously had no page for. Each occasion has unique copy — not templated
 * country-swaps — with FAQ schema for rich results.
 */

const OCCASIONS = {
  'leaving-card': {
    path: '/cards/leaving-card',
    title: 'Online Leaving Card — Group Leaving Cards for Colleagues | Thankeeu',
    desc: "Create an online leaving card the whole team signs from one link. Messages, photos, GIFs and voice notes, plus an optional gift collection. Free to start — no signup needed to sign.",
    keywords: 'online leaving card, leaving card for colleague, group leaving card, virtual leaving card, goodbye card online, leaving card everyone can sign, office leaving card, leaving collection for colleague',
    h1: 'Online Leaving Cards the Whole Team Can Sign',
    sub: "Say a proper goodbye — one link, everyone signs, and chip in for a leaving gift together.",
    useCases: [
      ['Colleague leaving for a new job', 'Collect messages, memories, photos and inside jokes from the whole office — even people working remotely or on leave.'],
      ['Boss or manager leaving', 'A dignified send-off signed by the entire team, delivered on their last day at the exact time you choose.'],
      ['Team member relocating', 'Distance is the point — an online leaving card reaches them wherever they go, and they keep it forever.'],
      ['Leaving gift collection', 'Skip chasing people for cash. Everyone contributes securely online when they sign, and the pot goes to one great gift.'],
    ],
    faqs: [
      ['How does an online leaving card work?', 'Create the card in under 2 minutes, share one link with colleagues, and everyone adds their message, photo, GIF or voice note. Schedule it to arrive on their last day.'],
      ['Can we collect money for a leaving gift too?', 'Yes — every card includes an optional gift collection. People chip in when they sign, and the recipient or organiser withdraws the pooled amount.'],
      ['Do people need an account to sign the leaving card?', 'No. Anyone with the link can sign instantly — no registration, no app download.'],
      ['How much does an online leaving card cost?', 'Free to create and collect messages. A small fee applies when you send, always shown upfront.'],
    ],
    blogLinks: [
      ['/blog/best-way-celebrate-colleague-leaving-work', 'The best way to celebrate a colleague leaving work'],
      ['/blog/farewell-card-ideas-for-colleagues', 'Farewell card ideas for colleagues'],
      ['/blog/farewell-card-messages-uk-colleagues-2025', 'What to write in a leaving card (UK)'],
      ['/blog/collect-money-colleague-gift-uk-2025', "How to collect money for a colleague's gift"],
    ],
  },
  retirement: {
    path: '/cards/retirement',
    title: 'Online Retirement Card — Group Retirement Cards & Gifts | Thankeeu',
    desc: 'Honour decades of service with an online retirement card signed by everyone — colleagues past and present. Messages, photos, voice notes, and a pooled retirement gift.',
    keywords: 'online retirement card, group retirement card, retirement card for colleague, retirement card everyone signs, virtual retirement card, retirement collection, happy retirement card online',
    h1: 'Retirement Cards Signed by Everyone They Worked With',
    sub: 'A career deserves more than one signature. Gather messages from colleagues past and present.',
    useCases: [
      ['Long-service retirements', 'Invite colleagues from every era of their career — one link works for current staff and old teammates alike.'],
      ['Retirement gift collections', 'Pool contributions from everyone into one meaningful retirement gift, with no cash chasing.'],
      ['Voice notes they can keep', 'A written message is lovely; hearing a colleague\'s voice years later is priceless. Thankeeu cards keep both forever.'],
      ['Scheduled for the send-off', 'Deliver the card at the retirement party, on their last day, or the morning after — you pick the exact moment.'],
    ],
    faqs: [
      ['Can former colleagues sign the retirement card too?', 'Yes — anyone with the link can sign from anywhere, whether they still work with you or left years ago.'],
      ['How do retirement gift contributions work?', 'Everyone chips in what they like when signing. The pooled gift is withdrawn by the organiser or the retiree.'],
      ['Does the retiree keep the card?', 'Yes — the card stays online for them to revisit, with every message, photo and voice note preserved.'],
      ['How long does it take to set up?', 'Under 2 minutes. Share the link, and messages start arriving immediately.'],
    ],
    blogLinks: [
      ['/blog/how-to-celebrate-employee-work-anniversaries', 'How to celebrate employee work anniversaries'],
      ['/blog/work-anniversary-cards-guide', 'Work anniversary cards — the complete guide'],
      ['/blog/best-way-celebrate-colleague-leaving-work', 'Celebrating a colleague who is leaving'],
      ['/blog/why-group-cards-beat-individual-cards', 'Why group cards beat individual cards'],
    ],
  },
  'get-well-soon': {
    path: '/cards/get-well-soon',
    title: 'Online Get Well Soon Card — Group Get Well Cards | Thankeeu',
    desc: 'Send strength from the whole team with an online get well soon card. Everyone signs from one link — kind words, photos and voice notes — delivered when it matters most.',
    keywords: 'online get well soon card, group get well card, get well card for colleague, get well soon card everyone signs, virtual get well card, get well wishes for coworker',
    h1: 'Get Well Soon Cards from the Whole Team',
    sub: 'When a colleague is unwell, one card full of warm wishes says more than a hundred separate texts.',
    useCases: [
      ['Colleague recovering from illness or surgery', 'Gentle messages, encouragement and prayers from everyone — collected in one place they can read at their own pace.'],
      ['Long recovery periods', 'The card stays open — teammates can keep adding messages over weeks, and the recipient can revisit them anytime.'],
      ['Support fund', 'Optionally pool contributions to help with recovery costs or send a thoughtful gift.'],
      ['Voice notes for comfort', 'Hearing familiar voices lifts spirits in a way text can\'t. Anyone can record one straight from their phone.'],
    ],
    faqs: [
      ['Is it appropriate to send a group get well card?', 'Yes — a single card from everyone is warm without overwhelming someone who is unwell with dozens of individual messages.'],
      ['Can we add a contribution for the person?', 'Yes — every card includes an optional collection pot people can add to when they sign.'],
      ['Can the card stay open during a long recovery?', 'Yes — you control when it\'s delivered and can keep collecting messages afterwards too.'],
      ['Do signers need an account?', 'No — anyone with the link can sign instantly.'],
    ],
    blogLinks: [
      ['/blog/why-group-cards-beat-individual-cards', 'Why group cards beat individual cards'],
      ['/blog/group-cards-remote-teams-inclusion', 'Group cards for remote teams'],
      ['/blog/employee-appreciation-vs-recognition', 'Appreciation vs recognition at work'],
      ['/blog/build-workplace-culture-fast-growing-nigerian-company', 'Building workplace culture'],
    ],
  },
  'thank-you': {
    path: '/cards/thank-you',
    title: 'Online Thank You Card — Group Thank You Cards & Ecards | Thankeeu',
    desc: 'Say thank you together. Create an online thank you card the whole team signs — messages, photos, GIFs and voice notes, with an optional group gift. Free to start.',
    keywords: 'online thank you card, group thank you card, thank you ecard, thank you card everyone signs, appreciation card online, thank you card for colleague, thank you card for teacher, thank you card for boss',
    h1: 'Thank You Cards Signed by Everyone',
    sub: 'Gratitude hits different when it comes from the whole group — teachers, mentors, doctors, colleagues.',
    useCases: [
      ['Thanking a teacher or lecturer', 'The whole class signs one card — messages, photos and memories — plus an optional group gift.'],
      ['Thanking a departing mentor or boss', 'Years of guidance deserve more than a handshake. Collect appreciation from everyone they helped.'],
      ['Project wrap-ups', 'Close a big project by letting the team thank the people who carried it.'],
      ['Thanking healthcare workers, coaches & volunteers', 'One link lets an entire community say thank you at once.'],
    ],
    faqs: [
      ['What can people add to a thank you card?', 'Messages, photos, GIFs and voice notes — each signer personalises their own entry.'],
      ['Can we add a gift to the thank you card?', 'Yes — an optional collection lets everyone chip in for a group gift when they sign.'],
      ['Do signers need to register?', 'No — anyone with the link signs instantly, no account needed.'],
      ['When is the card delivered?', 'Whenever you choose — instantly, or scheduled for a specific date and time.'],
    ],
    blogLinks: [
      ['/blog/employee-appreciation-vs-recognition', 'Employee appreciation vs recognition'],
      ['/blog/employee-recognition-ideas-nigerian-companies', 'Employee recognition ideas'],
      ['/blog/why-group-cards-beat-individual-cards', 'Why group cards beat individual cards'],
      ['/blog/creating-employee-recognition-programme-from-scratch', 'Creating a recognition programme from scratch'],
    ],
  },
  'maternity-leave': {
    path: '/cards/maternity-leave',
    title: 'Maternity Leave Card — Group Cards for Mums-to-Be | Thankeeu',
    desc: 'Send a colleague off on maternity leave with a group card the whole team signs — warm wishes, photos, voice notes, and a pooled baby gift.',
    keywords: 'maternity leave card, group maternity card, maternity card for colleague, baby shower card online, good luck maternity leave card, card for colleague going on maternity leave',
    h1: 'Maternity Leave Cards from the Whole Team',
    sub: 'Send her off with love — one card, every colleague, and a pooled gift for the new arrival.',
    useCases: [
      ['Maternity send-offs', 'Warm wishes from the whole office before she goes — delivered on her last day before leave.'],
      ['Baby gift collections', 'Pool contributions for a meaningful baby gift instead of chasing cash around the office.'],
      ['Remote teammates included', 'Colleagues in other cities or countries sign the same card from one link.'],
      ['Paternity leave too', 'Works exactly the same for dads-to-be heading off on leave.'],
    ],
    faqs: [
      ['When should we send a maternity leave card?', 'Most teams schedule it for the colleague\'s last working day before leave — Thankeeu delivers it at the exact time you choose.'],
      ['Can we pool money for a baby gift?', 'Yes — everyone contributes when they sign, and the pooled gift goes to the parent-to-be.'],
      ['Can people sign without an account?', 'Yes — one link, no registration, works on any phone.'],
      ['Can we send another card when the baby arrives?', 'Absolutely — many teams send a maternity card at leave and a new baby card after the arrival.'],
    ],
    blogLinks: [
      ['/blog/baby-shower-group-card-ideas-celebrate-new-mum', 'Baby shower group card ideas'],
      ['/blog/group-cards-remote-teams-inclusion', 'Group cards for remote teams'],
      ['/blog/group-gifting-work-office-gift-pools', 'Group gifting at work'],
      ['/blog/why-group-cards-beat-individual-cards', 'Why group cards beat individual cards'],
    ],
  },
  christmas: {
    path: '/cards/christmas',
    title: 'Online Christmas Card — Group Christmas Cards for Teams | Thankeeu',
    desc: 'Send one beautiful online Christmas card from the whole team. Everyone signs from one link — festive messages, photos, GIFs — with an optional group gift or bonus pool.',
    keywords: 'online christmas card, group christmas card, team christmas card, company christmas card online, christmas ecard for colleagues, christmas card everyone signs, secret santa alternative',
    h1: 'Group Christmas Cards for Teams & Companies',
    sub: 'One festive card, signed by everyone — for clients, colleagues, or the whole company.',
    useCases: [
      ['Company-wide Christmas cards', 'One card the entire company signs — far warmer than a templated corporate email blast.'],
      ['Cards for clients & partners', 'Send clients a card genuinely signed by the team that works with them.'],
      ['End-of-year appreciation', 'Pair the card with a pooled gift or bonus contribution for standout teammates.'],
      ['Distributed teams', 'Everyone signs from wherever they are — office, home, or another continent.'],
    ],
    faqs: [
      ['Can a large company sign one Christmas card?', 'Yes — there is no limit on signers. Hundreds of colleagues can add messages, photos and GIFs to one card.'],
      ['Can we schedule it for Christmas morning?', 'Yes — pick the exact date and time and it arrives on the dot, regardless of timezone.'],
      ['Is it cheaper than posting physical cards?', 'Significantly — one online card replaces printing and postage for the whole list, with no waste.'],
      ['Can we add a gift collection?', 'Yes — every card includes an optional collection pot for a group gift.'],
    ],
    blogLinks: [
      ['/blog/group-cards-remote-teams-inclusion', 'Group cards for remote teams'],
      ['/blog/why-group-cards-beat-individual-cards', 'Why group cards beat individual cards'],
      ['/blog/group-gifting-work-office-gift-pools', 'Group gifting and office gift pools'],
      ['/blog/build-workplace-culture-fast-growing-nigerian-company', 'Building workplace culture'],
    ],
  },
};

export default function ExtraOccasionPage({ occasion }) {
  const d = OCCASIONS[occasion];

  useSEO({
    title: d.title,
    description: d.desc,
    keywords: d.keywords,
    canonical: d.path,
    jsonLd: [
      SCHEMAS.organization,
      SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }, { name: d.h1, url: d.path }]),
      SCHEMAS.webPage(d.title, d.desc, d.path),
      {
        '@type': 'FAQPage',
        mainEntity: d.faqs.map(([q, a]) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
    ],
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <section className="max-w-4xl mx-auto px-4 pt-16 pb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-warm-900 mb-4">{d.h1}</h1>
        <p className="text-lg text-warm-600 mb-8 max-w-2xl mx-auto">{d.sub}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/card/new" className="btn-primary px-8 py-3 text-lg">Create a card — free to start</Link>
          <Link to="/sample" className="btn-secondary px-8 py-3 text-lg">See a live demo</Link>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-warm-900 mb-6 text-center">Perfect for</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {d.useCases.map(([title, body]) => (
            <div key={title} className="bg-white rounded-2xl p-6 shadow-sm">
              <p className="font-bold text-warm-900 mb-2">{title}</p>
              <p className="text-sm text-warm-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-warm-900 mb-6 text-center">Frequently asked questions</h2>
        <div className="space-y-4">
          {d.faqs.map(([q, a]) => (
            <details key={q} className="bg-white rounded-2xl p-5 shadow-sm">
              <summary className="font-semibold text-warm-900 cursor-pointer">{q}</summary>
              <p className="text-sm text-warm-600 mt-3">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-warm-900 mb-4 text-center">Guides &amp; ideas</h2>
        <ul className="space-y-2 text-center">
          {d.blogLinks.map(([href, label]) => (
            <li key={href}><Link to={href} className="text-primary-600 hover:underline">{label}</Link></li>
          ))}
        </ul>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-14 text-center">
        <h2 className="text-2xl font-bold text-warm-900 mb-4">Create yours in under 2 minutes</h2>
        <Link to="/card/new" className="btn-primary px-8 py-3 text-lg">Start your group card</Link>
      </section>
    </div>
  );
}

export function LeavingCardPage()   { return <ExtraOccasionPage occasion="leaving-card" />; }
export function RetirementPage()    { return <ExtraOccasionPage occasion="retirement" />; }
export function GetWellSoonPage()   { return <ExtraOccasionPage occasion="get-well-soon" />; }
export function ThankYouCardPage()  { return <ExtraOccasionPage occasion="thank-you" />; }
export function MaternityLeavePage(){ return <ExtraOccasionPage occasion="maternity-leave" />; }
export function ChristmasCardPage() { return <ExtraOccasionPage occasion="christmas" />; }
