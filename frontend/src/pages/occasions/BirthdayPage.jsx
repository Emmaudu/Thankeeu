import { SCHEMAS } from '../../hooks/useSEO';
import OccasionHeroTemplate, { CHECK, CROSS, PAID, DEFAULT_COMP_CARDS } from './OccasionHeroTemplate';
import { BIRTHDAY_PRIORITY_DESIGNS } from '../../utils/priorityCardDesigns';

/* ─── HeroShowcase data — birthday-specific ──────────────────────────── */
const BIRTHDAY_SAMPLE_MESSAGES = [
  { name:'Jessica Morgan', role:'VP of Product',  font:'font-vibes',
    media:'photo', photoUrl:'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&q=80',
    text:'Working across time zones with you has been one of the highlights of this role. Happy birthday — hope your day is as bright as the energy you bring!',
    avatar:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face' },
  { name:'Tunde Bakare',   role:'Operations Lead', font:'font-dancing',
    media:'gif', gifUrl:'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    text:'You are the reason the ops team runs as smoothly as it does. Have a fantastic celebration!',
    avatar:'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=120&h=120&fit=crop&crop=face' },
  { name:'Sarah Chen',     role:'Head of Design',  font:'font-dancing',
    media:'voice',
    text:"You have the rarest combination — impeccable taste and genuine humility. Happy birthday!",
    avatar:'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?w=120&h=120&fit=crop&crop=face' },
  { name:'Marcus Williams',role:'Sales Director',  font:'font-sacramento',
    media:'gif', gifUrl:'https://media.giphy.com/media/3o7abGQa0aRJUurpII/giphy.gif',
    text:'You make everyone around you sharper. Happy birthday to the most quietly influential person!',
    avatar:'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop&crop=face' },
];

const BIRTHDAY_DEMO_MESSAGES = [
  { initials:'AO', name:'Adaeze O.', color:'#7C3AED', bg:'#EDE9FE',
    text:"Happy birthday!! You're the reason our whole team smiles every day 🎂",
    gif:'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif' },
  { initials:'EK', name:'Emeka K.', color:'#0D9488', bg:'#CCFBF1',
    text:"Wishing you all the joy this year, boss! You deserve every single bit of it 🎉",
    gif:'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif' },
  { initials:'KI', name:'Kemi I.',  color:'#DB2777', bg:'#FCE7F3',
    text:"Another year wiser and still the coolest person in the office. Happy birthday! 🥳",
    gif:'https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif' },
  { initials:'BD', name:'Bolu D.', color:'#92400E', bg:'#FEF3C7',
    text:"From the whole team — we are so lucky to have you. Keep shining! ✨",
    gif:'https://media.giphy.com/media/3o7abGQa0aRJUurpII/giphy.gif' },
  { initials:'TN', name:'Tunde N.', color:'#1D4ED8', bg:'#DBEAFE',
    text:"You have no idea how much we appreciate everything you do. Have an amazing day! 💪",
    gif:'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif' },
];

/* ─── Hero slides ───────────────────────────────────────────────────── */
const SLIDES = [
  {
    tag: 'Birthday Card', cardLabel: 'birthday card',
    title: "Birthday this weekend? Everyone signs in minutes.",
    description: 'One link collects messages, photos, GIFs and voice notes from the whole team — plus a pooled birthday gift. Delivered at midnight on their day.',
    color: '#E84393', accent: '#FCE7F3', emoji: '🎂',
    count: 24, gift: '$120',
    messages: [
      { name: 'Adaeze O.', role: 'HR Manager',  color: '#E84393', bg: '#FCE7F3', text: "Happy birthday!! You're the reason our whole team smiles every single day." },
      { name: 'Emeka K.',  role: 'Team Lead',   color: '#0D9488', bg: '#CCFBF1', text: 'Wishing you all the joy this year, boss! You deserve every single bit of it.' },
      { name: 'Kemi I.',   role: 'Designer',    color: '#7C3AED', bg: '#EDE9FE', text: 'Another year wiser and still the coolest person in the entire office!' },
      { name: 'Bolu D.',   role: 'Engineer',    color: '#D97706', bg: '#FEF3C7', text: "From the whole team — we're so lucky to have you. Keep shining!" },
    ],
  },
  {
    tag: 'Birthday Card', cardLabel: 'birthday card',
    title: 'Midnight delivery — wake up to the surprise.',
    description: "Set the card to arrive at 12:00am. They wake up to messages, photos and voice notes from everyone who loves them.",
    color: '#7C3AED', accent: '#EDE9FE', emoji: '🌙',
    count: 31, gift: '$275',
    messages: [
      { name: 'Sarah M.',  role: 'Best friend', color: '#7C3AED', bg: '#EDE9FE', text: "You have no idea how much everyone here absolutely loves and adores you!" },
      { name: 'James R.',  role: 'Colleague',   color: '#E84393', bg: '#FCE7F3', text: '30 looks SO good on you. This is just the beginning — best decade incoming.' },
      { name: 'Priya K.',  role: 'Manager',     color: '#0D9488', bg: '#CCFBF1', text: 'The most quietly brilliant person on the team. Have the most amazing birthday!' },
      { name: 'Tom A.',    role: 'Friend',      color: '#D97706', bg: '#FEF3C7', text: 'Congrats! Drinks on you — the birthday rule is absolutely non-negotiable!' },
    ],
  },
  {
    tag: 'Birthday Card', cardLabel: 'birthday card',
    title: 'Pool a birthday gift — no cash chasing.',
    description: 'Everyone chips in when they sign. Any amount, any currency. The birthday person withdraws straight to their bank.',
    color: '#059669', accent: '#D1FAE5', emoji: '🎁',
    count: 19, gift: '₦380,000',
    messages: [
      { name: 'Ngozi A.',  role: 'Team',    color: '#059669', bg: '#D1FAE5', text: 'Every naira of this was given with so much love! Enjoy every penny of it.' },
      { name: 'Chidi M.',  role: 'Manager', color: '#7C3AED', bg: '#EDE9FE', text: 'A small token from the whole team to say: you are genuinely irreplaceable here.' },
      { name: 'Sola B.',   role: 'Finance', color: '#D97706', bg: '#FEF3C7', text: "We all pitched in because no gift is big enough for someone who gives so much." },
      { name: 'Dami A.',   role: 'Design',  color: '#E84393', bg: '#FCE7F3', text: 'Spend it on something ridiculous and wonderful. You deserve a proper treat!' },
    ],
  },
];

/* ─── Comparison rows ───────────────────────────────────────────────── */
const COMPARISON_ROWS = [
  { feature: 'Group birthday card (everyone signs)',  thankbox: CHECK, kudoboard: CHECK,   thankeeu: CHECK },
  { feature: 'No account needed to sign',             thankbox: CHECK, kudoboard: CHECK,   thankeeu: CHECK },
  { feature: 'Photo, video & GIF messages',           thankbox: CHECK, kudoboard: CHECK,   thankeeu: CHECK },
  { feature: 'Voice note messages',                   thankbox: CHECK, kudoboard: CROSS,   thankeeu: CHECK },
  { feature: 'Pooled birthday gift collection',       thankbox: CHECK, kudoboard: PAID,    thankeeu: CHECK },
  { feature: 'Midnight / exact-time delivery',        thankbox: CHECK, kudoboard: CHECK,   thankeeu: CHECK },
  { feature: 'GBP & USD payments',                   thankbox: CHECK, kudoboard: PAID,    thankeeu: CHECK },
  { feature: 'NGN / African currency payments',       thankbox: CROSS, kudoboard: CROSS,   thankeeu: CHECK },
  { feature: 'Memory Movie™ (auto-generated MP4)',   thankbox: CROSS, kudoboard: CROSS,   thankeeu: CHECK },
  { feature: 'HRIS sync — auto birthday cards',       thankbox: CROSS, kudoboard: CROSS,   thankeeu: CHECK },
  { feature: 'Free to create & collect messages',     thankbox: PAID,  kudoboard: PAID,    thankeeu: CHECK },
];

const FEATURES = [
  { icon: 'Users',        title: 'Unlimited signers',           desc: 'No cap. 5 people or 500 — the whole company can sign one card from one link. Great for office-wide birthdays.' },
  { icon: 'Mic',          title: 'Voice notes that hit different', desc: "Hearing a colleague or friend sing Happy Birthday or leave a personal voice message is something a text message can never match." },
  { icon: 'Gift',         title: 'Birthday gift pool built in', desc: 'Enable the collection pot. Everyone chips in when they sign — no chasing bank transfers, no fixed amounts, no awkwardness.' },
  { icon: 'Moon',         title: 'Midnight delivery',           desc: 'Schedule delivery for exactly 12:00am on their birthday. They wake up to the biggest surprise of their morning.' },
  { icon: 'Globe',        title: 'Remote teammates included',   desc: 'The link works from any device, anywhere. The colleague in another city or country signs the same card as everyone else.' },
  { icon: 'Film',         title: 'Memory Movie™ included',      desc: 'Every card auto-generates a 1080p MP4 from all messages, photos and voice notes. A birthday keepsake they keep forever.' },
];

const HOW_IT_WORKS = {
  heading: 'A birthday card worth remembering — in four steps',
  steps: [
    { icon: 'Wand',          n: '1', title: 'Create in 90 seconds', desc: 'Choose Birthday, pick a beautiful design, enter their name and email, set midnight delivery. Done.' },
    { icon: 'Share2',        n: '2', title: 'Share one link',       desc: 'Send via WhatsApp, Slack or email. Anyone clicks and adds their message — no account needed.' },
    { icon: 'MessageSquare', n: '3', title: 'Everyone signs',       desc: 'Messages, photos, GIFs, voice notes. Remote teammates sign the same card from their phone.' },
    { icon: 'Moon',          n: '4', title: 'Midnight surprise',    desc: 'Card arrives at the exact time you set. With a pooled gift, if you added one. First to wish them happy birthday.' },
  ],
};

const FAQS = [
  { q: 'How do I create an online birthday group card?', a: 'Go to thankeeu.com, click "Create a card", choose Birthday, enter the recipient\'s name and email, then share the link via WhatsApp or email. Anyone can sign without creating an account.' },
  { q: 'Can I schedule delivery at midnight on their birthday?', a: 'Yes. Set the exact date and time when creating the card. Thankeeu sends it automatically — even if you\'re asleep. Midnight delivery is one of the most popular options.' },
  { q: 'How does the birthday gift pool work?', a: 'Enable the gift collection when creating the card. Everyone who signs can add any amount using their preferred payment method. The birthday person withdraws the total directly to their bank account.' },
  { q: 'Do people need an account to sign?', a: 'No. Anyone with the link can sign instantly from their phone — no registration, no app download, no password.' },
  { q: 'How many people can sign a birthday card?', a: 'Unlimited. There is no cap on signers or message length. We have had birthday cards signed by hundreds of people.' },
  { q: 'What is the Memory Movie™?', a: 'After delivery, Thankeeu automatically generates a cinematic 1080p MP4 from all messages, photos and voice notes on the card — like a birthday video but without anyone having to edit anything. Included free with every plan.' },
];

export default function BirthdayPage() {
  return (
    <OccasionHeroTemplate
      seoProps={{
        title: 'Online Birthday Group Card — Everyone Signs in Minutes | Thankeeu',
        description: 'Create an online birthday group card the whole team or family signs from one link. Messages, photos, GIFs and voice notes — with a pooled gift and midnight delivery. Free to create.',
        keywords: 'online birthday group card, group birthday card, birthday card everyone signs, virtual birthday card, office birthday card, birthday card for colleague, pooled birthday gift, midnight birthday card delivery, digital birthday card, team birthday card',
        canonical: '/occasions/birthday',
        jsonLd: [
          SCHEMAS.organization,
          SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }, { name: 'Birthday Cards', url: '/occasions/birthday' }]),
          SCHEMAS.webPage('Online Birthday Group Card', 'Create a birthday group card the whole team signs from one link — with a pooled gift and midnight delivery.', '/occasions/birthday'),
          SCHEMAS.faqPage(FAQS.map(({ q, a }) => ({ q, a }))),
        ],
      }}
      heroEyebrow="🎂 Online Birthday Cards"
      heroHeadline={<>Give them more than<br/><span style={{color:'#FDE68A'}}>another birthday message.</span></>}
      heroSubline="Bring every message, photo, GIF and voice note into one beautiful keepsake — then deliver it at exactly the right moment. No chasing. Nobody left out."
      heroImage="/images/heroes/birthday-hero.jpg"
      ctaPath="/card/new?occasion=birthday"
      ctaLabel="Create Birthday Card — Free"
      trustBadges={['Free to create', 'No account to sign', 'Gift collection included', 'Midnight delivery']}
      slides={SLIDES}
      howItWorks={HOW_IT_WORKS}
      features={FEATURES}
      featuresHeadline="Everything a birthday card should be"
      featuresSubline="All included in every plan. No extras, no tiers, no surprises."
      pricingHeadline="Simple, honest pricing"
      pricingSubline="Free to create and collect messages. Pay once when you're ready to send. No subscription."
      comparisonTitle="Thankeeu vs Thankbox vs Kudoboard"
      comparisonBlurb="All three do group birthday cards. Here's what makes Thankeeu different."
      comparisonCards={DEFAULT_COMP_CARDS}
      comparisonRows={COMPARISON_ROWS}
      testimonialsHeadline={<>People who made<br/><span className="text-primary-500">someone's birthday unforgettable</span></>}
      faqs={FAQS}
      finalCtaEmoji="🎂"
      finalCtaHeadline={<>Make their birthday<br/>one they'll never forget.</>}
      finalCtaSubline="Free to create. The whole team signs. Delivered at exactly the right moment."
      sampleMessages={BIRTHDAY_SAMPLE_MESSAGES}
      demoMessages={BIRTHDAY_DEMO_MESSAGES}
      priorityDesigns={BIRTHDAY_PRIORITY_DESIGNS}
      priorityDesignOccasion="birthday"
      priorityDesignEyebrow="20 new birthday covers"
      priorityDesignTitle="Pick a birthday cover that already feels special"
      priorityDesignDescription="Browse ten premium A4 designs at a time. Choose one to open it in the album studio, then personalise the cover, messages and media."
    />
  );
}
