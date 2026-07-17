import { SCHEMAS } from '../hooks/useSEO';
import OccasionHeroTemplate, { CHECK, CROSS, PAID, DEFAULT_COMP_CARDS } from './occasions/OccasionHeroTemplate';
import { BABY_SHOWER_PRIORITY_DESIGNS } from '../utils/priorityCardDesigns';

/* ─── HeroShowcase data — baby shower-specific ───────────────────────── */
const BABY_SAMPLE_MESSAGES = [
  { name:'Amara Thomas',  role:'Best friend',     font:'font-vibes',
    media:'photo', photoUrl:'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&q=80',
    text:"You're going to be the most incredible mum. We're all already so in love with this little one. Congratulations!",
    avatar:'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&crop=face' },
  { name:'Ngozi Adeleke', role:'Office colleague', font:'font-dancing',
    media:'gif', gifUrl:'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    text:'From the whole office — we cannot wait to meet the newest member of the team! So excited for you both.',
    avatar:'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=120&h=120&fit=crop&crop=face' },
  { name:'Sola Briggs',   role:'Family',           font:'font-dancing',
    media:'voice',
    text:"This baby is already the most loved person we know. You have got an entire village cheering for you.",
    avatar:'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?w=120&h=120&fit=crop&crop=face' },
  { name:'Kemi Ihejirika', role:'Friend',          font:'font-sacramento',
    media:'gif', gifUrl:'https://media.giphy.com/media/3o7abGQa0aRJUurpII/giphy.gif',
    text:'Auntie Kemi is already practicing her babysitting skills. Cannot wait to meet them! 🍼',
    avatar:'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop&crop=face' },
];

const BABY_DEMO_MESSAGES = [
  { initials:'AT', name:'Amara T.', color:'#DB2777', bg:'#FCE7F3',
    text:"You're going to be the most incredible mum. We're all already so in love with this little one ",
    gif:'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif' },
  { initials:'NA', name:'Ngozi A.', color:'#7C3AED', bg:'#EDE9FE',
    text:"From the whole office — we cannot wait to meet the newest member of the team! So excited ",
    gif:'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif' },
  { initials:'SB', name:'Sola B.',  color:'#0D9488', bg:'#CCFBF1',
    text:"This baby is already the most loved person we know. You have an entire village cheering for you ",
    gif:'https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif' },
  { initials:'KI', name:'Kemi I.',  color:'#92400E', bg:'#FEF3C7',
    text:"Sending this from 5,000 miles away with all my heart. You and baby are going to be amazing ️",
    gif:'https://media.giphy.com/media/3o7abGQa0aRJUurpII/giphy.gif' },
  { initials:'BD', name:'Bolu D.',  color:'#1D4ED8', bg:'#DBEAFE',
    text:"Every naira here is wrapped in so much love. Enjoy every bit of it — you deserve it all! ",
    gif:'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif' },
];

/* ─── Hero slides ───────────────────────────────────────────────────── */
const SLIDES = [
  {
    tag: 'Baby Shower Card', cardLabel: 'baby shower card',
    title: "Mum-to-be deserves more than a group chat thread.",
    description: 'One link. Everyone signs from anywhere — warm wishes, photos, voice notes and a pooled baby shower gift. Delivered at the shower or whenever you choose.',
    color: '#DB2777', accent: '#FCE7F3', emoji: '👶',
    count: 22, gift: '$340',
    messages: [
      { name: 'Amara T.',  role: 'Best friend', color: '#DB2777', bg: '#FCE7F3', text: "You're going to be the most incredible mum. We're all already so in love with this little one." },
      { name: 'Ngozi A.',  role: 'Colleague',   color: '#7C3AED', bg: '#EDE9FE', text: 'From the whole office — we cannot wait to meet the newest member of the team! So excited for you.' },
      { name: 'Sola B.',   role: 'Family',      color: '#0D9488', bg: '#CCFBF1', text: 'This baby is already the most loved person we know. You have got an entire village cheering for you.' },
      { name: 'Kemi I.',   role: 'Friend',      color: '#D97706', bg: '#FEF3C7', text: 'Auntie Kemi is already practicing her babysitting skills. Cannot wait to meet them!' },
    ],
  },
  {
    tag: 'Baby Shower Card', cardLabel: 'baby shower card',
    title: "Virtual shower? Everyone joins from any city.",
    description: 'Friends in London, family in Lagos, cousins in New York — one link and everyone contributes messages and gifts from wherever they are.',
    color: '#7C3AED', accent: '#EDE9FE', emoji: '🌍',
    count: 38, gift: '£420',
    messages: [
      { name: 'Emma L.',  role: 'London',   color: '#7C3AED', bg: '#EDE9FE', text: "Missing the shower but absolutely not missing the chance to tell you how proud I am of you." },
      { name: 'Dami A.',  role: 'Lagos',    color: '#DB2777', bg: '#FCE7F3', text: "The whole family is sending so much love across the miles. This baby is already so blessed." },
      { name: 'Jake R.',  role: 'New York', color: '#0D9488', bg: '#CCFBF1', text: "Couldn't be there but wanted to make sure you felt all of us around you today. So much love." },
      { name: 'Priya K.', role: 'Austin',   color: '#D97706', bg: '#FEF3C7', text: "Sending this from 5,000 miles away with all my heart. You and baby are going to be amazing." },
    ],
  },
  {
    tag: 'Baby Shower Card', cardLabel: 'baby shower card',
    title: "Baby gift fund sorted — no envelope chasing.",
    description: "Enable the collection pot. Guests contribute when they sign — any amount, any currency. The mum-to-be withdraws straight to her bank.",
    color: '#059669', accent: '#D1FAE5', emoji: '🎁',
    count: 29, gift: '₦520,000',
    messages: [
      { name: 'Bolu D.',  role: 'Office',  color: '#059669', bg: '#D1FAE5', text: "Every naira here is wrapped in so much love and excitement. Enjoy every bit of it!" },
      { name: 'Lola M.',  role: 'Friend',  color: '#7C3AED', bg: '#EDE9FE', text: "We all pooled this because no individual gift could say what we all feel. So much love." },
      { name: 'Tunde N.', role: 'Family',  color: '#D97706', bg: '#FEF3C7', text: "Use it for anything you need — or something completely indulgent. You deserve both!" },
      { name: 'Chidi M.', role: 'Manager', color: '#DB2777', bg: '#FCE7F3', text: "From the whole team — welcome to parenthood! We are so excited for this next chapter." },
    ],
  },
];

/* ─── Comparison rows ───────────────────────────────────────────────── */
const COMPARISON_ROWS = [
  { feature: 'Group baby shower card (everyone signs)', thankbox: CHECK, kudoboard: CHECK,   thankeeu: CHECK },
  { feature: 'No account needed to sign',               thankbox: CHECK, kudoboard: CHECK,   thankeeu: CHECK },
  { feature: 'Photo, video & GIF messages',             thankbox: CHECK, kudoboard: CHECK,   thankeeu: CHECK },
  { feature: 'Voice note messages',                     thankbox: CHECK, kudoboard: CROSS,   thankeeu: CHECK },
  { feature: 'Pooled baby shower gift collection',      thankbox: CHECK, kudoboard: PAID,    thankeeu: CHECK },
  { feature: 'Scheduled delivery (any date & time)',    thankbox: CHECK, kudoboard: CHECK,   thankeeu: CHECK },
  { feature: 'GBP & USD payments',                     thankbox: CHECK, kudoboard: PAID,    thankeeu: CHECK },
  { feature: 'NGN / African currency payments',         thankbox: CROSS, kudoboard: CROSS,   thankeeu: CHECK },
  { feature: 'Memory Movie™ (auto-generated MP4)',     thankbox: CROSS, kudoboard: CROSS,   thankeeu: CHECK },
  { feature: 'Virtual shower — global contributors',   thankbox: CHECK, kudoboard: CHECK,   thankeeu: CHECK },
  { feature: 'Free to create & collect messages',       thankbox: PAID,  kudoboard: PAID,    thankeeu: CHECK },
];

const FEATURES = [
  { icon: 'Users',   title: 'The whole village signs',       desc: 'Colleagues, family, friends abroad — no cap on contributors. Everyone adds their wishes from one link, no account needed.' },
  { icon: 'Mic',     title: 'Voice notes from the heart',   desc: "A voice message from a best friend or a grandparent-to-be is something the mum-to-be will replay for years. Included in every card." },
  { icon: 'Gift',    title: 'Baby gift fund built in',      desc: 'Enable the optional collection pot. Guests contribute any amount when they sign — no Venmo, no bank transfers, no chasing.' },
  { icon: 'Globe',   title: 'Virtual shower friendly',      desc: 'Can\'t all be in the same room? The link works from any device, anywhere. London, Lagos, New York — all sign the same card.' },
  { icon: 'Clock',   title: 'Deliver at the shower itself', desc: 'Schedule delivery for the exact moment the card is revealed — open it on a screen at the shower, or sent privately at any time.' },
  { icon: 'Film',    title: 'Memory Movie™ included',       desc: 'Every card auto-generates a 1080p MP4 from all messages, photos and voice notes — a keepsake for the new family. Free with every plan.' },
];

const HOW_IT_WORKS = {
  heading: 'A baby shower card that reaches everyone — in four steps',
  steps: [
    { icon: 'Wand',          n: '1', title: 'Create in 90 seconds', desc: 'Choose Baby Shower, pick a beautiful design, set the delivery time. Done before the kettle boils.' },
    { icon: 'Share2',        n: '2', title: 'Share one link',       desc: 'Send to the WhatsApp group, email chain or Slack. Anyone clicks and adds their message — no account needed.' },
    { icon: 'MessageSquare', n: '3', title: 'Everyone signs',       desc: 'Warm messages, photos of past memories, GIFs, voice notes. Remote guests and overseas family included automatically.' },
    { icon: 'Baby',          n: '4', title: 'Reveal at the shower', desc: 'Deliver on screen at the party, or privately by email. With the pooled gift total, if contributions were enabled.' },
  ],
};

const FAQS = [
  { q: 'How does an online baby shower card work?', a: 'Create the card in under 2 minutes, share one link with guests, and everyone adds their warm message, photo, GIF or voice note from their phone. Schedule it to be revealed at the shower itself or delivered privately.' },
  { q: 'Can remote and overseas guests sign?', a: 'Yes — the link works from any device, anywhere. Friends in London, family in Lagos, cousins in New York — they all sign the same card from one link with no account needed.' },
  { q: 'How does the baby shower gift fund work?', a: 'Enable the optional gift collection when creating the card. Everyone contributes whatever amount they like when they sign — paid securely by card. The mum-to-be withdraws the total directly to her bank account.' },
  { q: 'Can we use the card at the shower itself?', a: 'Yes — schedule delivery for the exact time you want to reveal it. Many hosts display it on a screen during the party and let the mum-to-be scroll through every message live.' },
  { q: 'Do signers need an account?', a: 'No. Anyone with the link can sign instantly from their phone — no registration, no app download, no password. Just open and add a message.' },
  { q: 'What is the Memory Movie™?', a: 'After delivery, Thankeeu automatically generates a cinematic 1080p MP4 from all messages, photos and voice notes — a keepsake the new family can watch and download forever. Included free with every plan.' },
];

export default function BabyShowerPage() {
  return (
    <OccasionHeroTemplate
      seoProps={{
        title: 'Online Baby Shower Card — Group Cards & Gift Collections | Thankeeu',
        description: 'Create an online baby shower card the whole group signs from one link. Warm wishes, photos, GIFs and voice notes — with a pooled baby shower gift. Virtual shower friendly. Free to create.',
        keywords: 'online baby shower card, group baby shower card, baby shower ecard, virtual baby shower card, baby shower gift collection, baby shower card everyone signs, remote baby shower card, baby shower gift fund',
        canonical: '/cards/baby-shower',
        jsonLd: [
          SCHEMAS.organization,
          SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }, { name: 'Baby Shower Cards', url: '/cards/baby-shower' }]),
          SCHEMAS.webPage('Online Baby Shower Card', 'Create a baby shower card the whole group signs from one link — with a pooled gift.', '/cards/baby-shower'),
          SCHEMAS.faqPage(FAQS.map(({ q, a }) => ({ q, a }))),
        ],
      }}
      heroEyebrow="Online Baby Shower Cards"
      heroHeadline={<>The baby shower card<br/><span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg,#DB2777,#7C3AED)' }}>everyone can join.</span></>}
      heroSubline="One link. Friends, family and colleagues sign from anywhere — warm messages, photos, voice notes and a pooled baby shower gift. Perfect for virtual showers too."
      ctaPath="/card/new?occasion=baby-shower"
      ctaLabel="Create Baby Shower Card — Free"
      trustBadges={['Free to create', 'No account to sign', 'Gift fund included', 'Virtual shower friendly']}
      slides={SLIDES}
      howItWorks={HOW_IT_WORKS}
      features={FEATURES}
      featuresHeadline="Everything a baby shower card should have"
      featuresSubline="All included in every plan — no extras, no tiers, no surprises."
      pricingHeadline="Simple, honest pricing"
      pricingSubline="Free to create and collect messages. Pay once when you're ready to send. No subscription."
      comparisonTitle="Thankeeu vs Thankbox vs Kudoboard"
      comparisonBlurb="All three do group cards. Here's what makes Thankeeu the better choice for baby showers."
      comparisonCards={DEFAULT_COMP_CARDS}
      comparisonRows={COMPARISON_ROWS}
      testimonialsHeadline={<>People who made<br/><span className="text-primary-500">a mum-to-be feel truly celebrated</span></>}
      faqs={FAQS}
      finalCtaEmoji=""
      finalCtaHeadline={<>Celebrate the new arrival<br/>with everyone who loves her.</>}
      finalCtaSubline="Free to create. The whole group signs. Pooled gift collected automatically."
      sampleMessages={BABY_SAMPLE_MESSAGES}
      demoMessages={BABY_DEMO_MESSAGES}
      priorityDesigns={BABY_SHOWER_PRIORITY_DESIGNS}
      priorityDesignOccasion="baby_shower"
      priorityDesignEyebrow="Baby shower cover designs"
      priorityDesignTitle="Choose a cover for the new arrival"
      priorityDesignDescription="Five new A4 covers made for baby showers, ready to personalise with messages, photos, voice notes and a group gift."
    />
  );
}
