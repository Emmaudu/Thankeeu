/**
 * Shared, verified data for the Thankeeu for Teams landing pages.
 * Competitor facts are from each company's own pricing page, October 2026.
 * Plain data only. Copy rules as for the occasion pages: no dashes, no emojis.
 */
import { LANDING_MANIFEST } from '../occasionLandings/manifest.js';

export const TEAMS_COUNTRY = {
  us:        { short: 'the US', currency: 'USD', chargeable: true, locale: 'en_US' },
  uk:        { short: 'the UK', currency: 'GBP', chargeable: true, locale: 'en_GB' },
  canada:    { short: 'Canada', currency: 'CAD', chargeable: true, locale: 'en_CA' },
  germany:   { short: 'Germany', currency: 'EUR', chargeable: true, locale: 'en_DE', localLocale: 'de_DE' },
  mauritius: { short: 'Mauritius', currency: 'MUR', chargeable: false, locale: 'en_MU' },
};

/** Standard Teams plan rate, in NGN per employee per month (backend subscriptionController). */
export const TEAMS_RATE_NGN = 2000;
export const TEAM_SIZES = [10, 25, 50, 100, 250];

export const HRIS = ['Personio', 'HiBob', 'BambooHR', 'Rippling', 'Gusto', 'Deel', 'Zoho People', 'SeamlessHR', 'WorkPay'];

export const CTA = { demo: '/business', signup: '/company/signup' };

/** Competitor cells. true = yes, false = no, a key of UI.cells, or text. */
export const COMPETITORS = {
  bonusly: { name: 'Bonusly', price: '$5 per user a month (Team), free up to 8 users', cards: false, automation: true, hris: true, gift: 'pointsCatalog', keepsake: 'notListed', free: 'Up to 8 users' },
  kudoboard: { name: 'Kudoboard', price: 'From $299 a year (Business, 1 to 50 employees)', cards: true, automation: 'enterpriseOnly', hris: 'enterpriseOnly', gift: 'groupGift', keepsake: 'slideshowSome', free: false },
  assembly: { name: 'Assembly', price: '$3 per user a month (Empower, yearly)', cards: false, automation: true, hris: 'notListed', gift: 'rewardsCatalog', keepsake: 'notListed', free: 'notListed' },
  thankbox: { name: 'Thankbox for Teams', price: 'From 19 a month billed yearly (£, € or $), flat fee', cards: true, automation: true, hris: 'notListed', gift: 'feePerContribution', keepsake: 'slideshowPremium', free: false },
  applauz: { name: 'Applauz', price: '$3.75 per licence a month, or $12 per celebration', cards: false, automation: true, hris: 'notListed', gift: 'rewardsMarketplace', keepsake: 'notListed', free: false },
  rewardgateway: { name: 'Reward Gateway', price: '£8 per employee a month (from £6 yearly)', cards: false, automation: 'notListed', hris: 'notListed', gift: 'discounts', keepsake: 'notListed', free: false },
};
export const COMPARE_WITH = {
  us: ['bonusly', 'kudoboard', 'assembly'],
  uk: ['thankbox', 'kudoboard', 'rewardgateway'],
  canada: ['applauz', 'bonusly', 'kudoboard'],
  germany: ['bonusly', 'kudoboard', 'thankbox'],
  mauritius: ['bonusly', 'kudoboard', 'thankbox'],
};
export const COMPARE_ROWS = ['price', 'free', 'cards', 'automation', 'hris', 'gift', 'keepsake'];

/** Blog posts that support the B2B pages (live on thankeeu.com). */
export const TEAMS_BLOG = [
  ['/blog/best-online-group-card-websites-2026', 'The 5 best online group card websites in 2026'],
  ['/blog/employee-appreciation-ideas-remote-teams', 'Employee appreciation ideas for remote teams'],
  ['/blog/recognition-reporting-measure-impact-programme', 'Measuring the impact of a recognition programme'],
  ['/blog/company-employee-celebration-memories', 'Keeping company celebration memories'],
  ['/blog/employee-onboarding-making-new-hires-feel-welcome', 'Making new hires feel welcome'],
  ['/blog/celebrating-employee-promotions-why-matters-how', 'Celebrating employee promotions'],
];

/** Occasion pages in the same country worth linking from a Teams page. */
export const occasionLinksFor = (country) => LANDING_MANIFEST
  .filter(m => m.country === country && ['farewell', 'birthday', 'anniversary', 'group'].includes(m.occasion))
  .filter(m => !(m.occasion === 'anniversary' && m.variant === 'a'))
  .map(m => [m.path, m.anchor]);

export const TEAMS_UI = {
  en: {
    home: 'Thankeeu',
    demo: 'Book a demo',
    signup: 'Create a free company account',
    trust: 'Free company account. Team cards with no card fee. Free pilot on request.',
    integrations: 'Connects to your HR system',
    integrationsNote: 'or import a spreadsheet of your team.',
    automationsKicker: 'Runs on its own',
    pricingTitle: (c) => `Thankeeu for Teams pricing in ${c}`,
    perEmployee: 'per employee a month',
    standardRate: 'Standard rate',
    yearlyNote: 'Pay yearly and get 2 months free.',
    sizesCols: ['Team size', 'Monthly', 'Yearly'],
    employees: (n) => `${n} employees`,
    approx: (cur) => `Amounts in ${cur} are approximate, from today’s exchange rate; the plan is charged in US dollars.`,
    live: (cur) => `Amounts in ${cur} follow today’s exchange rate.`,
    pricingFoot: 'The Teams plan covers cards for your whole team, automations, the HR dashboard, imports and HR system sync, gift pooling, the Memory Movie and the Live Memory Wall. Larger organisations get a tailored quote.',
    freeTitle: 'Free company account',
    freeText: 'Create cards for any colleague, any occasion, with no card fee. Upgrade when you want birthdays and anniversaries to run on their own.',
    quote: 'Get a tailored quote',
    compareTitle: 'Thankeeu for Teams compared',
    feature: 'Feature',
    compareNote: 'Competitor prices and features as published on each company’s own pricing page in October 2026. Not listed means we could not find it there. Check their sites for changes.',
    rows: { price: 'Price', free: 'Free option', cards: 'Group cards the whole team signs', automation: 'Automatic birthdays and work anniversaries', hris: 'HR system sync', gift: 'Pooled gift', keepsake: 'Keepsake video' },
    cells: {
      yes: 'Yes', no: 'No', notListed: 'Not listed', enterpriseOnly: 'Enterprise plan only', pointsCatalog: 'Points for a rewards catalog',
      rewardsCatalog: 'Rewards catalog', groupGift: 'Group gift collection', feePerContribution: 'Collection, fee per contribution',
      rewardsMarketplace: 'Rewards marketplace', discounts: 'Discounts and rewards', slideshowSome: 'Slideshow on some boards',
      slideshowPremium: 'Slideshow on Premium',
    },
    us: {
      price: (rate) => `From ${rate} per employee a month, 2 months free yearly`,
      free: 'Free company account, team cards with no card fee',
      cards: 'Yes, on every plan',
      automation: 'Yes: birthdays, work anniversaries, new hires and more',
      hris: 'Personio, HiBob, BambooHR, Rippling, Gusto, Deel and more',
      gift: 'Cash pot, claimed to bank or as a gift card',
      keepsake: 'Memory Movie on every card',
    },
    faqTitle: 'Questions HR teams ask',
    linksTitle: (c) => `More for teams in ${c}`,
    otherCountries: 'Thankeeu for Teams in other countries',
    guides: 'Guides for HR and people teams',
    cardsTitle: 'Cards your team can send today',
  },
  de: {
    home: 'Thankeeu',
    demo: 'Demo buchen',
    signup: 'Kostenloses Firmenkonto erstellen',
    trust: 'Firmenkonto kostenlos. Teamkarten ohne Kartengebühr. Kostenloser Pilot auf Anfrage.',
    integrations: 'Verbindet sich mit Ihrem HR System',
    integrationsNote: 'oder importieren Sie Ihr Team per Tabelle.',
    automationsKicker: 'Läuft von allein',
    pricingTitle: () => 'Preise für Thankeeu for Teams in Deutschland',
    perEmployee: 'pro Mitarbeitendem und Monat',
    standardRate: 'Standardpreis',
    yearlyNote: 'Bei jährlicher Zahlung sind 2 Monate gratis.',
    sizesCols: ['Teamgröße', 'Monatlich', 'Jährlich'],
    employees: (n) => `${n} Mitarbeitende`,
    approx: (cur) => `Beträge in ${cur} sind ungefähre Werte nach dem heutigen Wechselkurs; abgerechnet wird in US Dollar.`,
    live: (cur) => `Beträge in ${cur} nach dem heutigen Wechselkurs.`,
    pricingFoot: 'Der Teams Plan umfasst Karten für Ihr ganzes Team, die Automatisierungen, das HR Dashboard, Import und Abgleich mit Ihrer Personalsoftware, Geldgeschenke im Team, den Memory Movie und die Live Memory Wall. Größere Organisationen erhalten ein individuelles Angebot.',
    freeTitle: 'Kostenloses Firmenkonto',
    freeText: 'Erstellen Sie Karten für jede Kollegin und jeden Anlass, ohne Kartengebühr. Upgraden Sie, wenn Geburtstage und Jubiläen von allein laufen sollen.',
    quote: 'Individuelles Angebot anfragen',
    compareTitle: 'Thankeeu for Teams im Vergleich',
    feature: 'Funktion',
    compareNote: 'Preise und Funktionen laut der eigenen Preisseite der Anbieter im Oktober 2026. Nicht angegeben heißt, dass wir es dort nicht gefunden haben. Bitte prüfen Sie die aktuellen Angaben.',
    rows: { price: 'Preis', free: 'Kostenlose Option', cards: 'Gruppenkarten, die das ganze Team unterschreibt', automation: 'Geburtstage und Dienstjubiläen automatisch', hris: 'Abgleich mit dem HR System', gift: 'Gemeinsames Geschenk', keepsake: 'Erinnerungsvideo' },
    cells: {
      yes: 'Ja', no: 'Nein', notListed: 'Nicht angegeben', enterpriseOnly: 'Nur im Enterprise Plan', pointsCatalog: 'Punkte für einen Prämienkatalog',
      rewardsCatalog: 'Prämienkatalog', groupGift: 'Geldsammlung im Team', feePerContribution: 'Sammlung, Gebühr pro Beitrag',
      rewardsMarketplace: 'Prämienmarktplatz', discounts: 'Rabatte und Prämien', slideshowSome: 'Diashow bei manchen Boards',
      slideshowPremium: 'Diashow mit Premium',
    },
    us: {
      price: (rate) => `Ab ${rate} pro Mitarbeitendem und Monat, jährlich 2 Monate gratis`,
      free: 'Kostenloses Firmenkonto, Teamkarten ohne Kartengebühr',
      cards: 'Ja, in jedem Plan',
      automation: 'Ja: Geburtstage, Dienstjubiläen, neue Kolleginnen und Kollegen und mehr',
      hris: 'Personio, HiBob, BambooHR, Rippling, Gusto, Deel und weitere',
      gift: 'Geldtopf, aufs Konto oder als Gutschein',
      keepsake: 'Memory Movie bei jeder Karte',
    },
    faqTitle: 'Fragen aus HR Teams',
    linksTitle: () => 'Mehr für Teams in Deutschland',
    otherCountries: 'Thankeeu for Teams in anderen Ländern',
    guides: 'Ratgeber für HR und People Teams',
    cardsTitle: 'Karten, die Ihr Team heute schon verschicken kann',
  },
};
