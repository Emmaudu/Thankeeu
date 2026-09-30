/**
 * Country landing pages that reuse the homepage layout (pages/Home.jsx with a
 * `landing` prop): /online-group-cards-uk, -canada, -nigeria.
 *
 * Plain data (only imports homeFaqs.js), so scripts/prerender.js can import it too and the
 * static HTML repeats exactly what the React page renders (title, description,
 * H1, hero copy, FAQs). A test keeps the two identical.
 *
 * coverOccasions — cover categories shown on the page, in order (ids from
 * utils/illustratedCoverRows.js); each shows its lead covers.
 */

export const LANDING_COVERS_PER_CATEGORY = 5;

export const OCCASION_LABELS = {
  birthday: 'Birthday', leaving: 'Leaving and farewell', retirement: 'Retirement', thank_you: 'Thank you',
  get_well: 'Get well soon', congratulations: 'Congratulations', anniversary: 'Anniversary',
  wedding: 'Wedding', sympathy: 'Sympathy', christmas: 'Christmas', baby_shower: 'Baby shower',
  graduation: 'Graduation',
};


// Example messages shown in each page's hero: illustrative card content (not
// reviews), written per page so the hero isn't a copy of the homepage.
const PHOTO = 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80';
const GIF_A = 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif';
const GIF_B = 'https://media.giphy.com/media/3o7abGQa0aRJUurpII/giphy.gif';
const AV = (id) => `https://images.unsplash.com/${id}?w=120&h=120&fit=crop&crop=face`;
const sample = (a, b, c, d) => [
  { ...a, font: 'font-vibes', media: 'photo', photoUrl: PHOTO, avatar: AV('photo-1494790108377-be9c29b29330') },
  { ...b, font: 'font-dancing', media: 'gif', gifUrl: GIF_A, avatar: AV('photo-1607746882042-944635dfe10e') },
  { ...c, font: 'font-dancing', media: 'voice', avatar: AV('photo-1573496799652-408c2ac9fe98') },
  { ...d, font: 'font-sacramento', media: 'gif', gifUrl: GIF_B, avatar: AV('photo-1539571696357-5a69c17a67c6') },
];
const SAMPLES = {
  uk: sample(
    { name: 'Hannah Clarke', role: 'Finance, Leeds', text: 'Twelve years of tea rounds and awful puns. The office won’t be the same without you. Good luck in the new job, you’ll smash it!' },
    { name: 'Tom Price', role: 'Operations', text: 'Who’s going to fix the printer now? Joking aside, thanks for everything. Pint on Friday!' },
    { name: 'Priya Shah', role: 'Marketing, remote', text: 'Recorded this in my kitchen in Bristol. Couldn’t let you go without a proper goodbye.' },
    { name: 'James Walker', role: 'Team lead', text: 'You made Monday mornings bearable. First round at your leaving do is on me. All the best!' },
  ),
  us: sample(
    { name: 'Emily Johnson', role: 'Product, Austin', text: 'Three launches and one very long offsite later, it’s been a privilege. Your new team is lucky.' },
    { name: 'Carlos Rivera', role: 'Engineering, Denver', text: 'Standup won’t be the same without your GIFs. Keep in touch!' },
    { name: 'Aisha Brooks', role: 'Customer Success', text: 'Sending a voice note from the West Coast office. Congrats on the new role!' },
    { name: 'Mike Chen', role: 'Sales, NYC', text: 'Best coworker, best lunch spots. We’ll miss you. Go crush it.' },
  ),
  canada: sample(
    { name: 'Sophie Tremblay', role: 'Montréal', text: 'Merci pour tout ! Thirty years of kindness and good advice. Bonne retraite, you’ve earned every minute.' },
    { name: 'Liam MacDonald', role: 'Halifax office', text: 'Congrats from the whole Halifax crew! The lake is waiting for you.' },
    { name: 'Nadia Karim', role: 'Toronto', text: 'Couldn’t fit it all in writing, so I recorded it. Enjoy every bit of retirement!' },
    { name: 'Ryan Kowalski', role: 'Calgary', text: 'Thanks for always having our backs. Happy retirement from all of us out west!' },
  ),
  global: sample(
    { name: 'Maria Santos', role: 'Lisbon', text: 'Happy birthday from the other side of the world! Wish I was there. Sending the biggest hug.' },
    { name: 'David Mensah', role: 'Accra', text: 'Another year, another excuse to celebrate you. Enjoy every minute!' },
    { name: 'Chloe Martin', role: 'London', text: 'Recorded this on the bus to work. Happy birthday, you legend!' },
    { name: 'Arjun Patel', role: 'Toronto', text: 'From your old team, wherever we all ended up. Have the best day.' },
  ),
  general: sample(
    { name: 'Grace Okoro', role: 'Sister', text: 'Thirty looks great on you! So proud of everything you built this year.' },
    { name: 'Ben Taylor', role: 'Old flatmate', text: 'I still owe you for the fridge incident. Happy birthday, drinks are on me!' },
    { name: 'Lucia Romero', role: 'Colleague', text: 'A quick voice note from the whole design team. Hope your day is perfect.' },
    { name: 'Sam Wilson', role: 'Best friend', text: 'Twenty years of friendship and you still make me laugh the hardest. Love you!' },
  ),
};

export const COUNTRY_LANDINGS = {
  uk: {
    path: '/online-group-cards-uk',
    breadcrumb: 'Online Group Cards UK',
    title: 'Online Group Cards UK: Sign Together, Add a Group Gift | Thankeeu',
    description: 'Create an online group card in the UK in 2 minutes. Colleagues sign from one link with messages, photos, GIFs and voice notes, and chip in to a gift in GBP.',
    keywords: 'online group cards UK, group card UK, online leaving card UK, group birthday card UK, group ecard UK, farewell card for colleague UK, collect money for colleague gift UK, Thankbox alternative UK, Kudoboard alternative UK',
    locale: 'en_GB',
    intentStart: 'leaving',
    tagline: 'Online group cards for UK teams',
    sampleMessages: SAMPLES.uk,
    h1Lead: 'Online Group Cards',
    h1Accent: 'for UK Teams',
    subtitle: 'Leaving cards, birthdays, retirements and thank yous. Share one link, everyone adds messages, photos, GIFs and voice notes, and you can pool a gift in pounds. The card arrives at the exact time you pick.',
    coversTitle: 'Group card covers for every UK office moment',
    coverOccasions: ['leaving', 'birthday', 'retirement', 'thank_you', 'get_well', 'congratulations', 'anniversary', 'wedding', 'baby_shower', 'sympathy', 'christmas'],
    currency: 'GBP (£)',
    payments: 'Pay by UK debit or credit card. Gift contributions are pooled in GBP, and every fee is shown upfront.',
    useCases: [
      ['Leaving cards', 'The classic office leaving card, minus the envelope going desk to desk. Everyone signs online, remote colleagues included.'],
      ['Birthday cards', 'Messages, photos and GIFs from the whole team, plus a group gift in pounds.'],
      ['Retirements and work anniversaries', 'Mark 5, 10 or 25 years properly, with messages from colleagues old and new.'],
      ['New baby, weddings and get well soon', 'For hybrid and remote UK teams where a paper card can’t reach everyone.'],
    ],
    faqs: [
      { q: 'How much does an online group card cost in the UK?', a: 'Making a card and collecting messages is free. You pay a small single fee only when you’re ready to send it, from $3.15 (about £2.45), shown upfront. There’s no subscription and no charge per signer.' },
      { q: 'Can people sign without creating an account?', a: 'Yes. Anyone with the link can add a message, photo, GIF or voice note without signing up.' },
      { q: 'How do group gift contributions work in the UK?', a: 'When people sign, they can chip in whatever they like by card, in GBP. The recipient or organiser then withdraws the pooled gift.' },
      { q: 'Is Thankeeu a UK alternative to Thankbox or Kudoboard?', a: 'Yes. Thankeeu gives you group cards with gift collection in GBP, voice notes, scheduled delivery and an automatic Memory Movie™, and it usually costs less.' },
    ],
    blogLinks: [
      ['/blog/best-online-group-cards-uk-2025', 'Best online group cards in the UK'],
      ['/blog/thankbox-vs-kudoboard-vs-thankeeu-uk-2025', 'Thankbox vs Kudoboard vs Thankeeu in the UK'],
      ['/blog/farewell-card-messages-uk-colleagues-2025', 'Farewell card messages for UK colleagues'],
      ['/blog/collect-money-colleague-gift-uk-2025', 'How to collect money for a colleague’s gift in the UK'],
    ],
    related: [['/cards/leaving-card', 'Online leaving cards'], ['/online-group-cards-canada', 'Group cards Canada'], ['/online-group-cards-us', 'Group cards US']],
  },
  canada: {
    path: '/online-group-cards-canada',
    breadcrumb: 'Online Group Cards Canada',
    title: 'Online Group Cards Canada: Group Ecards & Gifts in CAD | Thankeeu',
    description: 'Create an online group card for your Canadian team. Everyone signs from one link with messages, photos, GIFs and voice notes, and chips in to a group gift.',
    keywords: 'online group cards Canada, group card Canada, group ecard Canada, online farewell card Canada, group birthday card Canada, leaving card Canada, collect money for coworker gift Canada, bilingual group card',
    locale: 'en_CA',
    tagline: 'Online group cards for Canadian teams',
    sampleMessages: SAMPLES.canada,
    h1Lead: 'Online Group Cards',
    h1Accent: 'for Canadian Teams',
    subtitle: 'From Vancouver to Halifax, one link is all it takes. Colleagues sign in English or French with messages, photos, GIFs and voice notes, and you can add a group gift. The card arrives on the day, in their time zone.',
    coversTitle: 'Group card covers for every Canadian team moment',
    coverOccasions: ['leaving', 'birthday', 'retirement', 'thank_you', 'get_well', 'congratulations', 'anniversary', 'wedding', 'baby_shower', 'christmas', 'sympathy'],
    currency: 'CAD or USD',
    payments: 'Pay by Canadian debit or credit card. Gift contributions are pooled, and every fee is shown upfront.',
    useCases: [
      ['Farewell and retirement cards', 'Give a colleague a proper send off, even when the team is fully remote across six time zones.'],
      ['Birthday cards', 'Messages, photos and GIFs from everyone, plus a pooled group gift.'],
      ['Bilingual teams', 'Colleagues sign in English or French, and every message shows exactly as written.'],
      ['Work anniversaries and thank yous', 'Mark milestones and wins so a spread out team never misses one.'],
    ],
    faqs: [
      { q: 'How much does an online group card cost in Canada?', a: 'Making a card and collecting messages is free. You pay a small single fee only when you’re ready to send it, from $3.15 USD, shown upfront. There’s no subscription and no charge per signer.' },
      { q: 'Can colleagues sign in French?', a: 'Yes. People can write in any language, and messages show exactly as written.' },
      { q: 'Do signers need an account?', a: 'No. Anyone with the link can sign right away with a message, photo, GIF or voice note.' },
      { q: 'Does it work across every province and time zone?', a: 'Yes. It all happens online, and you set the delivery time in the recipient’s own time zone, so the card arrives at the right moment wherever they are.' },
    ],
    blogLinks: [
      ['/blog/best-online-group-cards-canada-2025', 'Best online group cards in Canada'],
      ['/blog/thankbox-vs-thankeeu-canada-2025', 'Thankbox vs Thankeeu in Canada'],
      ['/blog/group-cards-bilingual-canadian-teams', 'Group cards for bilingual Canadian teams'],
      ['/blog/farewell-card-messages-canadian-colleagues-2025', 'Farewell messages for Canadian colleagues'],
    ],
    related: [['/cards/leaving-card', 'Online leaving cards'], ['/online-group-cards-uk', 'Group cards UK'], ['/online-group-cards-us', 'Group cards US']],
  },
  // URL kept for its existing rankings; the page itself is global and in USD.
  nigeria: {
    path: '/online-group-cards-nigeria',
    breadcrumb: 'Online Group Cards',
    title: 'Online Group Cards: Everyone Signs, Pool a Gift in USD | Thankeeu',
    description: 'Online group cards for teams, friends and family anywhere. Everyone signs from one link with messages, photos and voice notes, plus a group gift in USD.',
    keywords: 'online group cards, group card online, group ecard, digital group card, group card everyone signs, group birthday card, online farewell card, collect money for group gift, virtual group card',
    locale: 'en_US',
    tagline: 'Online group cards for teams everywhere',
    sampleMessages: SAMPLES.global,
    h1Lead: 'Online group cards',
    h1Accent: 'everyone signs, from anywhere.',
    subtitle: 'Birthdays, farewells, weddings and thank yous. Share one link by WhatsApp, email or Slack, everyone adds messages, photos, GIFs and voice notes, and you can pool a gift in USD. The card arrives at the exact time you pick, in their time zone.',
    coversTitle: 'Group card covers for every celebration',
    coverOccasions: ['birthday', 'leaving', 'wedding', 'baby_shower', 'thank_you', 'congratulations', 'graduation', 'retirement', 'anniversary', 'get_well', 'christmas', 'sympathy'],
    currency: 'USD ($)',
    payments: 'Pay by Visa, Mastercard or American Express. Signers can chip in from any country, and every fee is shown upfront.',
    useCases: [
      ['Team birthdays', 'The whole team signs from their phones with messages, photos and voice notes, and you can add a pooled gift.'],
      ['Farewell and leaving cards', 'Give a colleague a proper send off, signed by everyone, remote teammates included.'],
      ['Weddings, new babies and graduations', 'Family, friends and colleagues celebrate together on one card, whatever country they live in.'],
      ['Company wide recognition', 'HR teams can automate birthday and work anniversary cards for every employee.'],
    ],
    faqs: [
      { q: 'How much does an online group card cost?', a: 'Making a card and collecting messages is free. You pay a small single fee only when you’re ready to send it, from $3.15, shown upfront. There’s no subscription and no charge per signer.' },
      { q: 'Do signers need an account?', a: 'No. Anyone with the link can sign right away with a message, photo, GIF or voice note.' },
      { q: 'How does the group gift work?', a: 'When people sign, they can chip in whatever they like, from any country. The recipient withdraws the pooled gift to their bank account.' },
      { q: 'Does it work for international teams?', a: 'Yes. It all happens online, and you set the delivery time in the recipient’s own time zone, so the card arrives at the right moment wherever they are.' },
    ],
    blogLinks: [
      ['/blog/online-group-cards-global-comparison-canada-uk-us-nigeria', 'Online group cards compared across countries'],
      ['/blog/best-online-group-cards-us-2025', 'Best online group cards'],
    ],
    related: [['/cards/leaving-card', 'Online leaving cards'], ['/online-group-cards-us', 'Group cards US'], ['/online-group-cards-uk', 'Group cards UK'], ['/online-group-cards-canada', 'Group cards Canada']],
  },
  us: {
    path: '/online-group-cards-us',
    breadcrumb: 'Online Group Cards US',
    title: 'Online Group Cards US: Group Ecards & Group Gifts | Thankeeu',
    description: 'Create an online group card for your US team. Coworkers sign from one link with messages, photos, GIFs and voice notes, and pool a group gift in USD.',
    keywords: 'online group cards US, group ecard, group card for coworker, online farewell card, group birthday card for coworker, office group card, group card everyone can sign, collect money for coworker gift, Kudoboard alternative',
    locale: 'en_US',
    tagline: 'Online group cards for US teams',
    sampleMessages: SAMPLES.us,
    h1Lead: 'Online Group Cards',
    h1Accent: 'for US Teams',
    subtitle: 'Farewells, birthdays, work anniversaries and thank yous. Share one link in Slack or email, every coworker adds messages, photos, GIFs and voice notes, and you pool a gift in USD. The card shows up on time in every time zone.',
    coversTitle: 'Group card covers for every office moment',
    coverOccasions: ['birthday', 'leaving', 'thank_you', 'retirement', 'congratulations', 'get_well', 'anniversary', 'wedding', 'baby_shower', 'sympathy', 'christmas'],
    currency: 'USD ($)',
    payments: 'Pay by US debit or credit card. Gift contributions are pooled in USD, and every fee is shown upfront.',
    useCases: [
      ['Farewell and goodbye cards', 'A coworker’s last day deserves more than a Slack thread. Everyone signs one card, from any office or time zone.'],
      ['Birthday cards', 'Messages, photos and GIFs from the whole team, plus a pooled gift.'],
      ['Work anniversaries and promotions', 'Mark milestones so nobody’s big day slips through the cracks.'],
      ['Remote and distributed teams', 'Made for teams spread across states and time zones. No printer, no envelope, no desk to pass a card around.'],
    ],
    faqs: [
      { q: 'How much does an online group card cost in the US?', a: 'Making a card and collecting messages is free. You pay a small single fee only when you’re ready to send it, from $3.15, shown upfront. There’s no subscription and no charge per signer.' },
      { q: 'Do coworkers need an account to sign?', a: 'No. Anyone with the link can add messages, photos, GIFs or voice notes right away.' },
      { q: 'Can we pool money for a group gift?', a: 'Yes. Everyone chips in what they want in USD when they sign, and the recipient or organizer withdraws the total.' },
      { q: 'Is Thankeeu an alternative to Kudoboard?', a: 'Yes. Thankeeu adds a pooled gift, voice notes, scheduled delivery and an automatic Memory Movie™, and it usually costs less.' },
    ],
    blogLinks: [
      ['/blog/best-online-group-cards-us-2025', 'Best online group cards in the US'],
      ['/blog/kudoboard-vs-thankeeu-us-hr-2025', 'Kudoboard vs Thankeeu for US teams'],
      ['/blog/online-farewell-cards-us-employees-2025', 'Online farewell cards for US employees'],
      ['/blog/group-card-ideas-us-workplace-occasions', 'Group card ideas for US workplace occasions'],
    ],
    related: [['/cards/leaving-card', 'Online leaving cards'], ['/online-group-cards-uk', 'Group cards UK'], ['/online-group-cards-canada', 'Group cards Canada']],
  },
};

// General (non-country) group-card landing on the homepage layout.
export const GENERAL_LANDINGS = {
  'online-group-card': {
    path: '/online-group-card',
    breadcrumb: 'Online Group Card',
    title: 'Online Group Card: Everyone Signs Together | Thankeeu',
    description: 'Create a free online group card that everyone signs. Great for birthdays, farewells, retirements, weddings and more. Anyone with the link can sign.',
    keywords: 'online group card, free online group card, digital group card, group card everyone signs, virtual group card, create group card online, group ecard',
    locale: 'en',
    tagline: 'Online group cards for any occasion',
    sampleMessages: SAMPLES.general,
    h1Lead: 'One card.',
    h1Accent: 'Everyone signs. Any occasion.',
    subtitle: 'Make a free group card in 2 minutes and share one link with the team, the family or the group chat. Everyone adds a message, photo, GIF or voice note, you can pool a gift, and the recipient gets one lovely card at the exact time you pick.',
    coversTitle: 'Group card covers for every occasion',
    coverOccasions: ['birthday', 'leaving', 'thank_you', 'wedding', 'baby_shower', 'retirement', 'congratulations', 'graduation', 'get_well', 'anniversary', 'christmas', 'sympathy'],
    currency: 'USD ($)',
    payments: 'Pay by Visa, Mastercard or American Express. Signers can chip in from any country, and every fee is shown upfront.',
    useCasesTitle: 'What people use it for',
    useCases: [
      ['Birthdays', 'Messages, photos and GIFs from everyone who loves them, plus a pooled gift.'],
      ['Farewells and leaving cards', 'A proper send off signed by the whole team, remote colleagues included.'],
      ['Weddings and new babies', 'Family and friends near and far celebrate together on one card.'],
      ['Thank yous, retirements and get well soon', 'Whatever the moment, one link gets everyone on the same card.'],
    ],
    faqs: [
      { q: 'What is an online group card?', a: 'A digital card that lots of people sign together for one person. Each signer adds their own message, photo, GIF or voice note, and the recipient gets it all as one card.' },
      { q: 'Is an online group card free?', a: 'Making the card and inviting people to sign is free. You pay a small single fee only when you send it, from $3.15, shown upfront.' },
      { q: 'How do I invite people to sign?', a: 'Share the link by WhatsApp, email, Slack or any messaging app. Anyone with the link can sign from their phone or laptop, and nobody needs an account.' },
      { q: 'What occasions does it work for?', a: 'Any time a group wants to celebrate someone: birthdays, farewells, retirements, weddings, anniversaries, new babies, graduations, promotions and more.' },
    ],
    sharedFaqCount: 3,
    blogLinks: [],
    related: [['/cards/leaving-card', 'Online leaving cards'], ['/occasions/birthday', 'Birthday group cards'], ['/occasions/wedding', 'Wedding cards'], ['/online-group-cards-us', 'Group cards US'], ['/online-group-cards-uk', 'Group cards UK'], ['/online-group-cards-canada', 'Group cards Canada']],
  },
};

import { HOME_FAQS } from './homeFaqs.js';

// Country FAQs first, then the homepage FAQs that hold everywhere (the cost and
// payment-method ones are replaced by each country's own answer).
export const landingFaqs = (landing) => [
  ...landing.faqs,
  ...HOME_FAQS.filter(f => !/free to create a card|payment methods/i.test(f.q)).slice(0, landing.sharedFaqCount ?? 5),
];
