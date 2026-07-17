import { Link } from 'react-router-dom';
import { useSEO, SCHEMAS } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';
import SympathyDesignGallery, { createSympathyCardUrl } from '../components/SympathyDesignGallery';
import { PET_LOSS_PRIORITY_DESIGNS } from '../utils/priorityCardDesigns';

/* ── Rainbow-bridge themed SVG hero (self-contained, no external asset) ── */
const RainbowBridgeHero = () => (
  <svg viewBox="0 0 480 360" className="w-full h-auto" role="img" aria-label="A soft rainbow bridge over a peaceful meadow with a paw print">
    <defs>
      <linearGradient id="pl-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fdf4ff" /><stop offset="0.55" stopColor="#f5e9ff" /><stop offset="1" stopColor="#eadcff" />
      </linearGradient>
      <linearGradient id="pl-hill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c7f0d8" /><stop offset="1" stopColor="#8fdcb0" />
      </linearGradient>
    </defs>
    <rect width="480" height="360" fill="url(#pl-sky)" />
    {/* soft clouds */}
    <g fill="#ffffff" opacity="0.85">
      <ellipse cx="90" cy="70" rx="46" ry="20" /><ellipse cx="130" cy="66" rx="38" ry="17" />
      <ellipse cx="380" cy="52" rx="52" ry="21" /><ellipse cx="418" cy="58" rx="34" ry="15" />
    </g>
    {/* rainbow */}
    {['#f9a8d4', '#fca5a5', '#fcd34d', '#86efac', '#93c5fd', '#c4b5fd'].map((c, i) => (
      <path key={i} d={`M ${70 + i * 9} 300 A ${170 - i * 9} ${170 - i * 9} 0 0 1 ${410 - i * 9} 300`}
        fill="none" stroke={c} strokeWidth="9" strokeLinecap="round" opacity="0.8" />
    ))}
    {/* meadow hills */}
    <path d="M0 300 C 120 268, 360 268, 480 300 L480 360 L0 360 Z" fill="url(#pl-hill)" />
    <path d="M0 322 C 140 300, 340 300, 480 322 L480 360 L0 360 Z" fill="#7bd0a2" opacity="0.7" />
    {/* paw print */}
    <g transform="translate(240 322)" fill="#5b21b6" opacity="0.85">
      <ellipse cx="0" cy="6" rx="12" ry="10" />
      <circle cx="-13" cy="-8" r="4.5" /><circle cx="-4" cy="-14" r="4.5" />
      <circle cx="6" cy="-14" r="4.5" /><circle cx="14" cy="-8" r="4.5" />
    </g>
    {/* sparkles */}
    {[[120, 150], [360, 140], [300, 100], [170, 110]].map(([x, y], i) => (
      <path key={i} d={`M${x} ${y - 6} L${x + 1.5} ${y - 1.5} L${x + 6} ${y} L${x + 1.5} ${y + 1.5} L${x} ${y + 6} L${x - 1.5} ${y + 1.5} L${x - 6} ${y} L${x - 1.5} ${y - 1.5} Z`} fill="#fbbf24" opacity="0.75" />
    ))}
  </svg>
);

const STEPS = [
  { icon: 'Heart', title: 'Create the memorial card', body: 'Pick a soft, comforting cover, add their name, and choose the perfect words. It takes about two minutes.' },
  { icon: 'Link', title: 'Share one gentle link', body: 'Send it by WhatsApp, text or email to family, friends, colleagues and fellow pet lovers. No account needed to sign.' },
  { icon: 'Users', title: 'Everyone adds a memory', body: 'Loved ones write a message, upload a favourite photo or video, or record a voice note — at their own pace.' },
  { icon: 'Gift', title: 'Deliver it — or give together', body: 'Send the finished card whenever feels right. Optionally pool a gift toward a memorial, a donation, or a keepsake.' },
];

const USE_CASES = [
  ['Loss of a dog', 'A group dog sympathy card where everyone who knew your best friend can share a memory, a photo from a favourite walk, or a heartfelt goodbye.'],
  ['Loss of a cat', 'Gather warm words and photos for a beloved cat — the sunny windowsills, the purrs, the years of quiet company.'],
  ['Loss of a bird, rabbit or small pet', 'Birds, rabbits, guinea pigs and every small companion deserve a proper goodbye. One link, every voice, kept forever.'],
  ['Rainbow Bridge remembrance', 'A Rainbow Bridge pet memorial the whole family can sign — a comforting place to gather memories and say “until we meet again”.'],
  ['From the whole team or clinic', 'Colleagues, a workplace, or a veterinary clinic can send one shared condolence card to a grieving pet parent.'],
  ['A lasting memorial page', 'Unlike a paper card, a Thankeeu pet memorial stays online forever — a photo album and Memory Movie™ they can return to any time.'],
];

const FEATURES = [
  { icon: 'UserCheck', title: 'No account needed to sign', body: 'Anyone with the link can add a message instantly — no registration, no app to download, at a moment that is already hard.' },
  { icon: 'Camera', title: 'Photos, videos & voice notes', body: 'Attach a favourite photo, a short video, or record a voice note. The little details are what bring the most comfort.' },
  { icon: 'Film', title: 'Automatic Memory Movie™', body: 'Every message, photo and video is woven into a gentle cinematic keepsake movie — a tribute they can keep forever.' },
  { icon: 'Clock', title: 'Send whenever feels right', body: 'Deliver instantly, or schedule it for a quiet moment. There is no rush and no pressure.' },
  { icon: 'Gift', title: 'Optional memorial gift pool', body: 'Chip in together toward a shrub, a paw-print keepsake, or a donation to an animal shelter in their pet’s name.' },
  { icon: 'Infinity', title: 'Kept online forever', body: 'A paper card gets put away in a drawer. A Thankeeu pet memorial stays online — every word and photo preserved.' },
];

const FAQS = [
  { q: 'What is a group pet sympathy card?', a: 'A group pet sympathy card is one online condolence card that many people sign together. Instead of everyone sending a separate message, family, friends, colleagues or fellow pet lovers all add their own message, photo, video or voice note to a single beautiful card for the grieving pet owner.' },
  { q: 'How do I create an online pet loss card?', a: 'Choose a comforting cover design, add the pet’s name and your words, then share one link by WhatsApp, text or email. Everyone signs from their own phone — no account needed. When you’re ready, deliver the card by email or a shareable link. It takes about two minutes to set up.' },
  { q: 'Is it a dog sympathy card, cat sympathy card, or for any pet?', a: 'Any pet. The designs and messages work beautifully for a dog, cat, bird, rabbit, horse, guinea pig or any beloved companion. You add the pet’s name and photos, so the card is completely personal to them.' },
  { q: 'Can we include the Rainbow Bridge poem or theme?', a: 'Yes. Many of the cover designs carry a soft, hopeful Rainbow Bridge feeling, and contributors can include the Rainbow Bridge poem or their own words in their messages. It’s a gentle way to say “until we meet again”.' },
  { q: 'Is the pet memorial card free?', a: 'It is free to create the card and collect every message, photo and voice note. A small fee applies only when you send or activate the card, and it is always shown upfront. Collecting messages costs nothing.' },
  { q: 'Can we collect money for a memorial or shelter donation?', a: 'Yes. You can turn on an optional gift pool so contributors add a small amount alongside their message — toward a memorial keepsake, a paw-print, or a donation to an animal shelter or rescue in the pet’s name. The organiser withdraws the total securely.' },
  { q: 'Does the grieving pet owner need an account to see the card?', a: 'No. They receive a link and open the full card immediately — every message, photo, video and voice note, plus the Memory Movie™. No login, no app.' },
  { q: 'How is this better than a paper pet sympathy card?', a: 'A paper card has room for one line and is seen by only a few people. An online pet memorial card lets everyone who loved the pet contribute from anywhere, holds unlimited photos and voice notes, becomes a keepsake Memory Movie, and stays online forever for the owner to revisit on hard days.' },
];

export default function PetLossCardPage() {
  useSEO({
    title: 'Online Pet Loss & Pet Sympathy Card — Group Memorial Cards Everyone Signs | Thankeeu',
    description: 'Create an online pet loss card the whole family and friends sign from one link. A group pet sympathy & memorial card for the loss of a dog, cat, bird or any beloved pet — messages, photos, voice notes and a Rainbow Bridge keepsake. Free to start, no signup to sign.',
    canonical: '/cards/pet-loss-card',
    keywords: 'pet loss card, pet sympathy card, dog sympathy card, cat sympathy card, loss of pet card, pet memorial card, pet condolence card, rainbow bridge card, group pet sympathy card, online pet sympathy card, dog memorial card, pet bereavement card, loss of a pet sympathy message',
    jsonLd: [
      SCHEMAS.organization,
      SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }, { name: 'Pet Loss Card', url: '/cards/pet-loss-card' }]),
      SCHEMAS.webPage('Online Pet Loss & Pet Sympathy Card', 'Create a group pet memorial card the whole family and friends sign from one link.', '/cards/pet-loss-card'),
      SCHEMAS.faqPage(FAQS),
    ],
  });

  const topDesign = PET_LOSS_PRIORITY_DESIGNS[0];
  const startUrl = topDesign ? createSympathyCardUrl(topDesign.id, 'pet-loss-hero') : '/card/customize?occasion=sympathy&layout=album';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pt-12 pb-16" style={{ background: 'linear-gradient(180deg,#faf5ff 0%,#fdf4ff 45%,#ffffff 100%)' }}>
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-pink-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary-200/40 blur-3xl" />
        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div className="text-center lg:text-left">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary-600 mb-5">Online Pet Memorial Cards</p>
            <h1 className="font-extrabold text-warm-900 leading-[1.08] mb-4" style={{ fontSize: 'clamp(2.3rem,6vw,4rem)', letterSpacing: '-0.02em' }}>
              The pet sympathy card<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg,#7C3AED,#DB2777)' }}>everyone can sign.</span>
            </h1>
            <p className="text-warm-500 text-lg sm:text-xl max-w-xl mx-auto lg:mx-0 mb-7 leading-relaxed">
              When a beloved dog, cat, bird or companion crosses the Rainbow Bridge, gather everyone who loved them into one online pet memorial card — messages, photos, voice notes and a keepsake movie. One link. Everyone signs from anywhere.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-6">
              <Link to={startUrl} className="inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 font-bold text-white text-base transition-all hover:scale-105 hover:shadow-xl" style={{ background: 'linear-gradient(135deg,#7C3AED,#9333EA)', boxShadow: '0 8px 24px rgba(124,58,237,0.35)' }}>
                <Icon name="Heart" size={17} /> Create a pet loss card — free
              </Link>
              <a href="#designs" className="inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 font-bold text-primary-600 text-base border-2 border-primary-200 hover:bg-primary-50 transition-all">
                See cover designs
              </a>
            </div>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-sm text-warm-400 font-medium">
              <span className="flex items-center gap-1.5"><Icon name="Check" size={14} className="text-green-500" />Free to create</span>
              <span className="flex items-center gap-1.5"><Icon name="Check" size={14} className="text-green-500" />No account to sign</span>
              <span className="flex items-center gap-1.5"><Icon name="Check" size={14} className="text-green-500" />Dog, cat, bird & every pet</span>
              <span className="flex items-center gap-1.5"><Icon name="Check" size={14} className="text-green-500" />Kept forever online</span>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-[2rem] bg-white p-3 shadow-[0_30px_80px_rgba(76,29,149,0.18)] ring-1 ring-black/5">
              <div className="overflow-hidden rounded-[1.5rem]"><RainbowBridgeHero /></div>
              <p className="text-center text-sm font-semibold text-warm-500 py-3">“Until we meet again at the Rainbow Bridge.”</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Intro / empathy ── */}
      <section className="px-4 py-14 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-4">Losing a pet is losing family</h2>
          <p className="text-warm-600 leading-relaxed text-lg">
            A pet is a member of the family — the wag at the door, the purr on your lap, the little companion who was always there. When they’re gone, the grief is real, and words matter. A group pet sympathy card lets everyone who loved them come together in one place, so the person grieving knows they’re not alone. Every memory, every photo, every kind word — gathered and kept forever.
          </p>
        </div>
      </section>

      {/* ── Design gallery (auto-updates from sympathy designs) ── */}
      <SympathyDesignGallery
        designs={PET_LOSS_PRIORITY_DESIGNS}
        source="pet-loss-gallery"
        recipient="Bella"
        title="Forever in our hearts"
        background="#faf7ff"
        eyebrow="Pet memorial cover designs"
        heading="Choose a cover that honours their memory"
        description="These are our softest, most comforting covers — perfect for a dog, cat, bird or any beloved pet. Pick one and everyone can add their message, photo and favourite memory. New designs appear here automatically."
      />

      {/* ── How it works ── */}
      <section id="how-it-works" className="px-4 py-16 md:py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-2">How a group pet memorial card works</h2>
            <p className="text-warm-500">Gentle, simple, and done in a couple of minutes.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-2xl bg-purple-50 p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-primary-600 text-white flex items-center justify-center"><Icon name={s.icon} size={22} /></div>
                <p className="text-xs font-extrabold text-primary-500 mb-1">Step {i + 1}</p>
                <p className="font-bold text-warm-900 mb-2">{s.title}</p>
                <p className="text-sm text-warm-600 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use cases ── */}
      <section className="px-4 py-14" style={{ background: '#F5F0FF' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-2">For every kind of goodbye</h2>
            <p className="text-warm-500">A dog, a cat, a bird, a lifelong companion — every pet deserves a proper send-off.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {USE_CASES.map(([title, body]) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-purple-50">
                <p className="font-bold text-warm-900 mb-2">{title}</p>
                <p className="text-sm text-warm-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-4 py-16 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-2">Everything a pet memorial card should be</h2>
            <p className="text-warm-500">Comforting, personal, and kept forever.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-purple-50">
                <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600"><Icon name={f.icon} size={22} /></span>
                <p className="font-bold text-warm-900 mb-2">{f.title}</p>
                <p className="text-sm text-warm-600 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What to write (SEO: "loss of a pet sympathy message") ── */}
      <section className="px-4 py-14" style={{ background: '#faf7ff' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-2">What to write in a pet sympathy card</h2>
            <p className="text-warm-500">Not sure what to say? These gentle messages are a good place to start.</p>
          </div>
          <div className="space-y-3">
            {[
              '“I’m so sorry for the loss of {pet}. They were so loved, and so lucky to have you.”',
              '“{pet} brought so much joy into all our lives. Their pawprints will stay in our hearts forever.”',
              '“Run free, sweet {pet}. Until you meet again at the Rainbow Bridge.”',
              '“Thinking of you as you grieve {pet}. They were family, and they mattered.”',
              '“How lucky we were to love something that made saying goodbye this hard.”',
            ].map((m, i) => (
              <div key={i} className="rounded-2xl bg-white border border-purple-50 px-5 py-4 text-warm-700 shadow-sm">{m}</div>
            ))}
          </div>
          <p className="text-center text-sm text-warm-400 mt-6">Add these when you sign, or write your own from the heart.</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-4 py-16 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-8 text-center">Pet loss card — frequently asked questions</h2>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
                <summary className="font-semibold text-warm-900 cursor-pointer text-base leading-snug">{q}</summary>
                <p className="text-sm text-warm-600 mt-4 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Related reading (link the blog → this page cluster) ── */}
      <section className="px-4 py-14" style={{ background: '#F5F0FF' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-warm-900 mb-8 text-center">Pet loss guides &amp; comfort</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              ['/blog/condolence-messages-loss-of-pet', 'Condolence messages for the loss of a pet'],
              ['/blog/what-to-write-sympathy-card-messages', 'What to write in a sympathy card: messages & examples'],
              ['/blog/what-to-write-sympathy-card-coworker', 'What to write in a sympathy card for a coworker'],
              ['/cards/sympathy', 'Group sympathy cards — for any loss'],
            ].map(([href, label]) => (
              <Link key={href} to={href} className="flex items-center gap-4 bg-white border border-purple-50 rounded-2xl p-5 shadow-sm hover:border-primary-200 hover:shadow-md transition-all group">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex-shrink-0 flex items-center justify-center text-primary-600 group-hover:bg-primary-100 transition-colors"><Icon name="ArrowRight" size={18} /></div>
                <span className="text-sm font-semibold text-warm-800 group-hover:text-primary-700 transition-colors">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-4 py-16 text-center" style={{ background: 'linear-gradient(135deg,#7C3AED,#6d28d9)' }}>
        <div className="max-w-2xl mx-auto text-white">
          <h2 className="text-3xl font-extrabold mb-3">Say goodbye, together</h2>
          <p className="text-primary-100 mb-8 text-lg">Create a pet memorial card everyone can sign. Free to start, no account needed, and kept forever.</p>
          <Link to={startUrl} className="inline-flex items-center gap-2 bg-white text-primary-700 font-bold px-8 py-3.5 rounded-2xl hover:bg-primary-50 transition-colors text-lg">
            <Icon name="Heart" size={18} /> Create a pet loss card now
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
