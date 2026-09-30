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
  birthday: 'Birthday', leaving: 'Leaving & farewell', retirement: 'Retirement', thank_you: 'Thank you',
  get_well: 'Get well soon', congratulations: 'Congratulations', anniversary: 'Anniversary',
  wedding: 'Wedding', sympathy: 'Sympathy', christmas: 'Christmas',
};

export const COUNTRY_LANDINGS = {
  uk: {
    path: '/online-group-cards-uk',
    breadcrumb: 'Online Group Cards UK',
    title: 'Online Group Cards UK — Leaving & Birthday Cards Everyone Signs | Thankeeu',
    description: 'Online group cards for UK teams. Everyone signs from one link with messages, photos, GIFs and voice notes, plus a group gift in GBP. Free to start.',
    keywords: 'online group cards UK, group card UK, online leaving card UK, group birthday card UK, group ecard UK, farewell card for colleague UK, collect money for colleague gift UK, Thankbox alternative UK, Kudoboard alternative UK',
    locale: 'en_GB',
    intentStart: 'leaving',
    tagline: 'Online group cards for UK teams',
    h1Lead: 'Online group cards',
    h1Accent: 'the whole UK office signs.',
    subtitle: 'Leaving cards, birthdays, retirements and thank-yous — share one link, everyone adds messages, photos, GIFs and voice notes, and you can pool a gift in pounds. Delivered at the exact time you choose.',
    coversTitle: 'Group card covers for every UK office moment',
    coverOccasions: ['leaving', 'birthday', 'retirement', 'thank_you', 'get_well', 'congratulations', 'anniversary', 'wedding', 'sympathy', 'christmas'],
    currency: 'GBP (£)',
    payments: 'Pay by UK debit or credit card. Gift contributions pool in GBP, with every fee shown upfront.',
    useCases: [
      ['Leaving cards', 'The classic office leaving card — without passing an envelope round the office. Everyone signs online, including remote colleagues.'],
      ['Birthday cards', 'Messages, photos and GIFs from the whole team, plus a group gift in pounds.'],
      ['Retirements & work anniversaries', 'Mark 5, 10 or 25 years properly — with messages from colleagues past and present.'],
      ['New baby, weddings & get well soon', 'For hybrid and remote UK teams where a paper card can’t reach everyone.'],
    ],
    faqs: [
      { q: 'How much does an online group card cost in the UK?', a: 'Creating a card and collecting messages is free. You pay a small one-time fee only when you’re ready to send it — from $3.15 (about £2.45), always shown upfront. No subscription and no per-signer charges.' },
      { q: 'Can people sign without creating an account?', a: 'Yes — anyone with the link can add a message, photo, GIF or voice note without signing up.' },
      { q: 'How do group gift contributions work in the UK?', a: 'Everyone chips in what they like by card in GBP when they sign. The recipient or organiser withdraws the pooled gift.' },
      { q: 'Is Thankeeu a UK alternative to Thankbox or Kudoboard?', a: 'Yes — Thankeeu gives you group cards with a GBP gift collection, voice notes, scheduled delivery and an automatic Memory Movie™, usually for less.' },
    ],
    blogLinks: [
      ['/blog/best-online-group-cards-uk-2025', 'Best online group cards in the UK'],
      ['/blog/thankbox-vs-kudoboard-vs-thankeeu-uk-2025', 'Thankbox vs Kudoboard vs Thankeeu — UK'],
      ['/blog/farewell-card-messages-uk-colleagues-2025', 'Farewell card messages for UK colleagues'],
      ['/blog/collect-money-colleague-gift-uk-2025', 'How to collect money for a colleague’s gift in the UK'],
    ],
    related: [['/cards/leaving-card', 'Online leaving cards'], ['/online-group-cards-canada', 'Group cards Canada'], ['/online-group-cards-us', 'Group cards US']],
  },
  canada: {
    path: '/online-group-cards-canada',
    breadcrumb: 'Online Group Cards Canada',
    title: 'Online Group Cards Canada — Cards the Whole Team Signs | Thankeeu',
    description: 'Online group cards for Canadian teams. Everyone signs from one link in English or French — messages, photos, voice notes — plus a group gift. Free to start.',
    keywords: 'online group cards Canada, group card Canada, group ecard Canada, online farewell card Canada, group birthday card Canada, leaving card Canada, collect money for coworker gift Canada, bilingual group card',
    locale: 'en_CA',
    tagline: 'Online group cards for Canadian teams',
    h1Lead: 'Online group cards',
    h1Accent: 'for teams across Canada.',
    subtitle: 'From Vancouver to Halifax — one link, and every colleague signs in English or French with messages, photos, GIFs and voice notes, plus an optional group gift. Delivered on the day, in their time zone.',
    coversTitle: 'Group card covers for every Canadian team moment',
    coverOccasions: ['leaving', 'birthday', 'retirement', 'thank_you', 'get_well', 'congratulations', 'anniversary', 'wedding', 'christmas', 'sympathy'],
    currency: 'CAD or USD',
    payments: 'Pay by Canadian debit or credit card. Gift contributions pool with every fee shown upfront.',
    useCases: [
      ['Farewell & retirement cards', 'Send off a colleague properly, even across a fully remote team spread over six time zones.'],
      ['Birthday cards', 'Messages, photos and GIFs from everyone — plus a pooled group gift.'],
      ['Bilingual teams', 'Colleagues sign in English or French — every message appears exactly as written.'],
      ['Work anniversaries & thank-yous', 'Recognise milestones and wins so distributed teams never miss one.'],
    ],
    faqs: [
      { q: 'How much does an online group card cost in Canada?', a: 'Creating a card and collecting messages is free. You pay a small one-time fee only when you’re ready to send it — from $3.15 USD, always shown upfront. No subscription and no per-signer charges.' },
      { q: 'Can colleagues sign in French?', a: 'Yes — signers write in any language, and messages display exactly as written.' },
      { q: 'Do signers need an account?', a: 'No — anyone with the link can sign instantly with a message, photo, GIF or voice note.' },
      { q: 'Does it work across every province and time zone?', a: 'Yes — it’s fully online, and you set the delivery time in the recipient’s own time zone, so the card lands at the right moment wherever they are.' },
    ],
    blogLinks: [
      ['/blog/best-online-group-cards-canada-2025', 'Best online group cards in Canada'],
      ['/blog/thankbox-vs-thankeeu-canada-2025', 'Thankbox vs Thankeeu — Canada'],
      ['/blog/group-cards-bilingual-canadian-teams', 'Group cards for bilingual Canadian teams'],
      ['/blog/farewell-card-messages-canadian-colleagues-2025', 'Farewell messages for Canadian colleagues'],
    ],
    related: [['/cards/leaving-card', 'Online leaving cards'], ['/online-group-cards-uk', 'Group cards UK'], ['/online-group-cards-us', 'Group cards US']],
  },
  // URL kept for its existing rankings; the page itself is global and in USD.
  nigeria: {
    path: '/online-group-cards-nigeria',
    breadcrumb: 'Online Group Cards',
    title: 'Online Group Cards — Everyone Signs, Pool a Gift in USD | Thankeeu',
    description: 'Online group cards for teams, friends and family anywhere. Everyone signs from one link with messages, photos and voice notes, plus a group gift in USD.',
    keywords: 'online group cards, group card online, group ecard, digital group card, group card everyone signs, group birthday card, online farewell card, collect money for group gift, virtual group card',
    locale: 'en_US',
    tagline: 'Online group cards for teams everywhere',
    h1Lead: 'Online group cards',
    h1Accent: 'everyone signs, from anywhere.',
    subtitle: 'Birthdays, farewells, weddings and thank-yous — share one link by WhatsApp, email or Slack, everyone adds messages, photos, GIFs and voice notes, and you can pool a gift in USD. Delivered at the exact time you choose, in their time zone.',
    coversTitle: 'Group card covers for every celebration',
    coverOccasions: ['birthday', 'leaving', 'wedding', 'thank_you', 'congratulations', 'retirement', 'anniversary', 'get_well', 'christmas', 'sympathy'],
    currency: 'USD ($)',
    payments: 'Pay by Visa, Mastercard or American Express. Signers can chip in from any country, and every fee is shown upfront.',
    useCases: [
      ['Team birthdays', 'The whole team signs from their phones — messages, photos and voice notes — plus a pooled gift.'],
      ['Farewell & leaving cards', 'Give a departing colleague a proper send-off, signed by everyone, including remote teammates.'],
      ['Weddings, new babies & graduations', 'Family, friends and colleagues celebrate together on one card, whatever country they’re in.'],
      ['Company-wide recognition', 'HR teams automate birthday and work-anniversary cards for every employee.'],
    ],
    faqs: [
      { q: 'How much does an online group card cost?', a: 'Creating a card and collecting messages is free. You pay a small one-time fee only when you’re ready to send it — from $3.15, always shown upfront. No subscription and no per-signer charges.' },
      { q: 'Do signers need an account?', a: 'No — anyone with the link can sign instantly with a message, photo, GIF or voice note.' },
      { q: 'How does the group gift work?', a: 'Everyone chips in what they like when they sign, from any country. The recipient withdraws the pooled gift to their bank account.' },
      { q: 'Does it work for international teams?', a: 'Yes — it’s fully online, and you set the delivery time in the recipient’s own time zone, so the card lands at the right moment wherever they are.' },
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
    title: 'Online Group Cards US — Group Ecards Your Whole Team Signs | Thankeeu',
    description: 'Online group cards for US teams. Coworkers sign from one link with messages, photos, GIFs and voice notes, plus a group gift in USD. Free to start.',
    keywords: 'online group cards US, group ecard, group card for coworker, online farewell card, group birthday card for coworker, office group card, group card everyone can sign, collect money for coworker gift, Kudoboard alternative',
    locale: 'en_US',
    tagline: 'Online group cards for US teams',
    h1Lead: 'Online group cards',
    h1Accent: 'your whole team signs.',
    subtitle: 'Farewells, birthdays, work anniversaries and thank-yous — share one link in Slack or email, every coworker adds messages, photos, GIFs and voice notes, and you pool a gift in USD. Delivered on time in every time zone.',
    coversTitle: 'Group card covers for every office moment',
    coverOccasions: ['birthday', 'leaving', 'thank_you', 'retirement', 'congratulations', 'get_well', 'anniversary', 'wedding', 'sympathy', 'christmas'],
    currency: 'USD ($)',
    payments: 'Pay by US debit or credit card. Gift contributions pool in USD, with every fee shown upfront.',
    useCases: [
      ['Farewell & goodbye cards', 'A coworker’s last day deserves more than a Slack thread. Everyone signs one card, from any office or time zone.'],
      ['Birthday cards', 'Messages, photos and GIFs from the whole team — plus a pooled gift.'],
      ['Work anniversaries & promotions', 'Recognise milestones so nobody’s big day slips through the cracks.'],
      ['Remote & distributed teams', 'Built for teams spread across states and time zones — no printer, no envelope, no desk to pass a card around.'],
    ],
    faqs: [
      { q: 'How much does an online group card cost in the US?', a: 'Creating a card and collecting messages is free. You pay a small one-time fee only when you’re ready to send it — from $3.15, always shown upfront. No subscription and no per-signer charges.' },
      { q: 'Do coworkers need an account to sign?', a: 'No — anyone with the link can add messages, photos, GIFs or voice notes instantly.' },
      { q: 'Can we pool money for a group gift?', a: 'Yes — everyone contributes what they want in USD when they sign, and the recipient or organizer withdraws the total.' },
      { q: 'Is Thankeeu an alternative to Kudoboard?', a: 'Yes — Thankeeu adds a pooled gift, voice notes, scheduled delivery and an automatic Memory Movie™, usually for less.' },
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
    title: 'Online Group Card — One Card Everyone Signs, Any Occasion | Thankeeu',
    description: 'Create a free online group card everyone signs from one link — messages, photos, GIFs and voice notes, plus a group gift. Any occasion. No account to sign.',
    keywords: 'online group card, free online group card, digital group card, group card everyone signs, virtual group card, create group card online, group ecard',
    locale: 'en',
    tagline: 'Online group cards for any occasion',
    h1Lead: 'One online group card.',
    h1Accent: 'Everyone signs. Any occasion.',
    subtitle: 'Create a free group card in 2 minutes and share one link with the team, the family or the friend group. Everyone adds a message, photo, GIF or voice note, you can pool a gift, and the recipient gets one beautiful card at the exact time you choose.',
    coversTitle: 'Group card covers for every occasion',
    coverOccasions: ['birthday', 'leaving', 'thank_you', 'wedding', 'retirement', 'congratulations', 'get_well', 'anniversary', 'christmas', 'sympathy'],
    currency: 'USD ($)',
    payments: 'Pay by Visa, Mastercard or American Express. Signers can chip in from any country, and every fee is shown upfront.',
    useCasesTitle: 'What people use it for',
    useCases: [
      ['Birthdays', 'Messages, photos and GIFs from everyone who loves them — plus a pooled gift.'],
      ['Farewells & leaving cards', 'A proper send-off signed by the whole team, including remote colleagues.'],
      ['Weddings & new babies', 'Family and friends near and far celebrate together on one card.'],
      ['Thank-yous, retirements & get well soon', 'Whatever the moment, one link gathers every voice.'],
    ],
    faqs: [
      { q: 'What is an online group card?', a: 'A digital card that many people sign together for one recipient. Everyone adds their own message, photo, GIF or voice note, and the recipient receives it as one combined card.' },
      { q: 'Is an online group card free?', a: 'Creating the card and inviting people to sign is free. You pay a small one-time fee only when you send it — from $3.15, always shown upfront.' },
      { q: 'How do I invite people to sign?', a: 'Share the link by WhatsApp, email, Slack or any messaging app. Anyone with the link can sign from their phone or laptop — no account needed.' },
      { q: 'What occasions does it work for?', a: 'Any moment a group wants to celebrate someone: birthdays, farewells, retirements, weddings, anniversaries, new babies, graduations, promotions and more.' },
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
