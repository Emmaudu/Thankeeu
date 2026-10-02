/**
 * Shared, verified data for the occasion × country landing pages:
 * countries, occasions, interface words per language, the competitor
 * comparison and the supporting blog posts.
 *
 * Copy rules for everything shown on these pages: no dashes or hyphens in
 * text, no emojis. Prices are written as the launch price ("$3.15", "$12.60")
 * and replaced with today's price on screen (utils/pricing livePriceText).
 *
 * Plain data only.
 */

export const COUNTRY_META = {
  uk:          { name: 'the UK', short: 'UK', currency: 'GBP', chargeable: true, locale: 'en_GB' },
  us:          { name: 'the US', short: 'US', currency: 'USD', chargeable: true, locale: 'en_US' },
  canada:      { name: 'Canada', short: 'Canada', currency: 'CAD', chargeable: true, locale: 'en_CA' },
  germany:     { name: 'Germany', short: 'Germany', currency: 'EUR', chargeable: true, locale: 'en_DE', localLocale: 'de_DE', native: 'Deutschland' },
  netherlands: { name: 'the Netherlands', short: 'Netherlands', currency: 'EUR', chargeable: true, locale: 'en_NL', localLocale: 'nl_NL', native: 'Nederland' },
  colombia:    { name: 'Colombia', short: 'Colombia', currency: 'COP', chargeable: false, locale: 'en_CO', localLocale: 'es_CO', native: 'Colombia' },
  mauritius:   { name: 'Mauritius', short: 'Mauritius', currency: 'MUR', chargeable: false, locale: 'en_MU' },
  philippines: { name: 'the Philippines', short: 'Philippines', currency: 'PHP', chargeable: false, locale: 'en_PH' },
  australia:   { name: 'Australia', short: 'Australia', currency: 'AUD', chargeable: false, locale: 'en_AU' },
  france:      { name: 'France', short: 'France', currency: 'EUR', chargeable: true, locale: 'en_FR', localLocale: 'fr_FR', native: 'France' },
};

/**
 * Covers shown on each occasion's pages: `lead` is the occasion's own
 * illustrated category (6 covers), `others` adds one row of other
 * categories (6 covers), so every page shows 12 sample cards.
 */
export const OCCASION_META = {
  group:       { lead: 'thank_you',    others: ['birthday', 'leaving', 'congratulations', 'retirement', 'get_well', 'wedding'], createOccasion: 'thank_you' },
  farewell:    { lead: 'leaving',      others: ['retirement', 'thank_you', 'birthday', 'congratulations', 'get_well', 'anniversary'], createOccasion: 'leaving' },
  birthday:    { lead: 'birthday',     others: ['congratulations', 'thank_you', 'leaving', 'anniversary', 'get_well', 'graduation'], createOccasion: 'birthday' },
  babyshower:  { lead: 'baby_shower',  others: ['congratulations', 'wedding', 'birthday', 'thank_you', 'get_well', 'leaving'], createOccasion: 'baby_shower' },
  anniversary: { lead: 'anniversary',  others: ['wedding', 'congratulations', 'birthday', 'thank_you', 'retirement', 'leaving'], createOccasion: 'anniversary' },
};
// Work anniversary pages lead with congratulations and thank you covers.
export const WORK_ANNIVERSARY_COVERS = { lead: 'congratulations', others: ['thank_you', 'anniversary', 'retirement', 'birthday', 'leaving', 'get_well'], createOccasion: 'anniversary' };
export const coverPlanFor = (m) => (m.occasion === 'anniversary' && m.variant === 'b' ? WORK_ANNIVERSARY_COVERS : OCCASION_META[m.occasion]);

/** Existing pages on the site worth linking from each occasion. */
export const CORE_LINKS = {
  group:       [['/online-group-card', 'Online group card'], ['/pricing', 'Pricing'], ['/memory-movie', 'Memory Movie'], ['/live-memory-wall', 'Live Memory Wall']],
  farewell:    [['/cards/leaving-card', 'Online leaving cards'], ['/occasions/farewell', 'Farewell cards'], ['/memory-movie', 'Memory Movie'], ['/pricing', 'Pricing']],
  birthday:    [['/occasions/birthday', 'Birthday group cards'], ['/birthday-memory-wall', 'Birthday memory wall'], ['/memory-movie', 'Memory Movie'], ['/pricing', 'Pricing']],
  babyshower:  [['/cards/baby-shower', 'Baby shower cards'], ['/cards/maternity-leave', 'Maternity leave cards'], ['/memory-movie', 'Memory Movie'], ['/pricing', 'Pricing']],
  anniversary: [['/occasions/anniversary', 'Anniversary cards'], ['/memory-movie', 'Memory Movie'], ['/live-memory-wall', 'Live Memory Wall'], ['/pricing', 'Pricing']],
};

/** The comparison post written alongside these pages. */
export const TOP5_POST = ['/blog/best-online-group-card-websites-2026', 'The 5 best online group card websites in 2026'];

/**
 * Supporting blog posts (all published on thankeeu.com, checked against the
 * live sitemap in October 2026). `uk: true` posts are only linked from UK pages.
 */
export const BLOG_POSTS = {
  group: [
    ['/blog/how-to-make-a-group-ecard', 'How to make a group ecard'],
    ['/blog/group-card-for-coworker-without-awkwardness', 'A group card for a coworker, without the awkwardness'],
    ['/blog/group-cards-vs-whatsapp-messages', 'Group cards vs WhatsApp messages'],
    ['/blog/thankeeu-vs-thankbox-vs-kudoboard-2026', 'Thankeeu vs Thankbox vs Kudoboard'],
    ['/blog/group-gifting-work-office-gift-pools', 'Group gifting at work'],
    ['/blog/online-group-cards-vs-paper-cards-uk', 'Online group cards vs paper cards', { uk: true }],
    ['/blog/thankbox-alternative-uk-2026', 'Thankbox alternative UK', { uk: true }],
  ],
  farewell: [
    ['/blog/virtual-farewell-card-ideas', 'Virtual farewell card ideas'],
    ['/blog/what-to-write-in-a-leaving-card', 'What to write in a leaving card'],
    ['/blog/create-farewell-video-from-team-messages', 'Turn team messages into a farewell video'],
    ['/blog/group-card-for-coworker-without-awkwardness', 'A group card for a coworker, without the awkwardness'],
    ['/blog/leaving-card-messages-colleague-uk', 'Leaving card messages for a colleague', { uk: true }],
    ['/blog/collect-money-leaving-gift-uk', 'Collecting money for a leaving gift', { uk: true }],
    ['/blog/funny-leaving-card-messages-uk', 'Funny leaving card messages', { uk: true }],
  ],
  birthday: [
    ['/blog/how-to-send-group-birthday-card-step-by-step', 'How to send a group birthday card'],
    ['/blog/15-virtual-birthday-card-ideas', '15 virtual birthday card ideas'],
    ['/blog/create-surprise-birthday-video-with-friends', 'Make a surprise birthday video with friends'],
    ['/blog/best-birthday-gift-is-a-memory', 'Why the best birthday gift is a memory'],
    ['/blog/birthday-messages-for-colleague-uk', 'Birthday messages for a colleague', { uk: true }],
    ['/blog/office-birthday-card-ideas-uk', 'Office birthday card ideas', { uk: true }],
  ],
  babyshower: [
    ['/blog/baby-shower-group-card-ideas-celebrate-new-mum', 'Baby shower group card ideas'],
    ['/blog/combine-voice-notes-photos-into-keepsake-video', 'Turn voice notes and photos into a keepsake video'],
    ['/blog/group-gifting-work-office-gift-pools', 'Group gifting at work'],
    ['/blog/what-to-write-baby-shower-card-uk', 'What to write in a baby shower card', { uk: true }],
    ['/blog/maternity-leave-card-messages-uk', 'Maternity leave card messages', { uk: true }],
  ],
  anniversary: [
    ['/blog/combine-voice-notes-photos-into-keepsake-video', 'Turn voice notes and photos into a keepsake video'],
    ['/blog/company-employee-celebration-memories', 'Keeping company celebration memories'],
    ['/blog/employee-appreciation-ideas-remote-teams', 'Appreciation ideas for remote teams'],
    ['/blog/work-anniversary-messages-uk-colleague', 'Work anniversary messages for a colleague', { uk: true }],
    ['/blog/work-anniversary-messages-what-to-write-uk', 'What to write for a work anniversary', { uk: true }],
  ],
};

export const blogLinksFor = (m) => [
  TOP5_POST,
  ...BLOG_POSTS[m.occasion].filter(([, , o]) => !o?.uk || m.country === 'uk').map(([href, label]) => [href, label]),
].slice(0, 6);

/**
 * Competitor facts, from each company's own pricing page in October 2026
 * (USD list prices). Thankeeu's price cells are filled in live.
 * Cell values: true = yes, false = no, string = shown as written.
 */
export const COMPARISON = {
  columns: ['Thankeeu', 'Kudoboard', 'Thankbox', 'GroupGreeting'],
  rows: [
    ['price', { kudoboard: '$6.99 (20 posts)', thankbox: '$5.99', groupgreeting: '$5.99' }],
    ['packPrice', { kudoboard: '$7.00 (5 boards)', thankbox: 'Packs of 1 to 100', groupgreeting: '$3.99 (100 cards)' }],
    ['unlimited', { kudoboard: 'Milestone, $19.99', thankbox: true, groupgreeting: true }],
    ['video', { kudoboard: 'Premium, $9.99', thankbox: 'Premium, $9.99', groupgreeting: 'notListed' }],
    ['voice', { kudoboard: 'notListed', thankbox: 'Premium, $9.99', groupgreeting: 'notListed' }],
    ['cashGift', { kudoboard: 'giftCard', thankbox: true, groupgreeting: 'giftCard' }],
    ['movie', { kudoboard: 'slideshow', thankbox: 'slideshow', groupgreeting: 'notListed' }],
    ['wall', { kudoboard: 'notListed', thankbox: 'notListed', groupgreeting: 'notListed' }],
    ['expiry', { kudoboard: 'yearly', thankbox: 'twelveMonths', groupgreeting: 'twelveMonths' }],
  ],
};

/** Interface words, by page language. */
export const UI = {
  en: {
    home: 'Thankeeu',
    freeLine: 'Free to start. From $3.15 to send. No subscription.',
    create: 'Create a card',
    demo: 'See a sample card',
    coversHint: 'Tap a cover to start your card. You can change it later.',
    seeAll: 'See all covers',
    pricingTitle: (c) => `Group card prices in ${c}`,
    pricingCols: ['Plan', 'Cards', 'Price', 'Per card'],
    plans: { card_fee: 'Classic', standard: 'Standard', pack5: 'Pack of 5', pack10: 'Pack of 10', pack25: 'Pack of 25', pack50: 'Pack of 50', pack100: 'Pack of 100' },
    freeRow: 'Creating the card and collecting messages',
    free: 'Free',
    approx: (cur) => `Prices in ${cur} are approximate, from today’s exchange rate. Cards are charged in US dollars.`,
    charged: (cur) => `Prices in ${cur} follow today’s exchange rate. Pay by Visa, Mastercard or American Express. International cards can also pay with Apple Pay, Google Pay or PayPal.`,
    pricingFoot: 'Credits never expire. Every card includes unlimited signers, photos, GIFs, video, voice notes, the Memory Movie and a PDF download.',
    fullPricing: 'Full pricing',
    compareTitle: 'How Thankeeu compares',
    compareFeature: 'Feature',
    compareNote: 'Competitor prices and features as listed on each company’s own pricing page in October 2026, in US dollars. Not listed means we could not find it there. Check their sites for changes.',
    rows: {
      price: 'Price for one card', packPrice: 'Lowest price per card in a pack', unlimited: 'Unlimited messages on the starter card',
      video: 'Video messages', voice: 'Voice notes', cashGift: 'Pooled group gift', movie: 'Keepsake video',
      wall: 'Live photo wall by QR code', expiry: 'Credits expire',
    },
    cells: {
      yes: 'Yes', no: 'No', notListed: 'Not listed', giftCard: 'Gift card', slideshow: 'Slideshow, top tier',
      yearly: 'Yearly plans', twelveMonths: 'After 12 months', never: 'Never',
      thankeeuVideo: 'Every card', thankeeuVoice: 'Every card', thankeeuGift: 'Yes, claimed to bank or gift card',
      thankeeuMovie: 'Memory Movie on every card', thankeeuWall: 'Every card',
    },
    faqTitle: 'Frequently asked questions',
    linksTitle: (c) => `More group cards in ${c}`,
    otherCountries: 'The same card in other countries',
    guides: 'Guides and comparisons',
    alsoSee: 'Also on Thankeeu',
    messagesCta: 'Use one of these on your card',
    langNote: null,
  },
  de: {
    home: 'Thankeeu',
    freeLine: 'Kostenlos starten. Versand ab $3.15. Kein Abo.',
    create: 'Karte erstellen',
    demo: 'Beispielkarte ansehen',
    coversHint: 'Tippe auf ein Motiv, um deine Karte zu starten. Du kannst es später ändern.',
    seeAll: 'Alle Motive ansehen',
    pricingTitle: () => 'Preise für Gruppenkarten in Deutschland',
    pricingCols: ['Paket', 'Karten', 'Preis', 'Pro Karte'],
    plans: { card_fee: 'Classic', standard: 'Standard', pack5: '5er Paket', pack10: '10er Paket', pack25: '25er Paket', pack50: '50er Paket', pack100: '100er Paket' },
    freeRow: 'Karte erstellen und Nachrichten sammeln',
    free: 'Kostenlos',
    approx: (cur) => `Preise in ${cur} sind ungefähre Werte nach dem heutigen Wechselkurs. Abgerechnet wird in US Dollar.`,
    charged: (cur) => `Preise in ${cur} nach dem heutigen Wechselkurs. Bezahlen mit Visa, Mastercard oder American Express. Internationale Karten auch mit Apple Pay, Google Pay oder PayPal.`,
    pricingFoot: 'Guthaben verfällt nie. Jede Karte enthält unbegrenzt viele Unterschriften, Fotos, GIFs, Videos, Sprachnachrichten, den Memory Movie und einen PDF Download.',
    fullPricing: 'Alle Preise',
    compareTitle: 'Thankeeu im Vergleich',
    compareFeature: 'Funktion',
    compareNote: 'Preise und Funktionen der Anbieter laut ihrer eigenen Preisseite im Oktober 2026, in US Dollar. Nicht angegeben heißt, dass wir es dort nicht gefunden haben. Bitte prüfe die aktuellen Angaben auf ihren Websites.',
    rows: {
      price: 'Preis für eine Karte', packPrice: 'Niedrigster Preis pro Karte im Paket', unlimited: 'Unbegrenzte Nachrichten bei der günstigsten Karte',
      video: 'Videonachrichten', voice: 'Sprachnachrichten', cashGift: 'Gemeinsames Geldgeschenk', movie: 'Erinnerungsvideo',
      wall: 'Live Fotowand per QR Code', expiry: 'Guthaben verfällt',
    },
    cells: {
      yes: 'Ja', no: 'Nein', notListed: 'Nicht angegeben', giftCard: 'Gutschein', slideshow: 'Diashow, höchste Stufe',
      yearly: 'Jahrespläne', twelveMonths: 'Nach 12 Monaten', never: 'Nie',
      thankeeuVideo: 'Jede Karte', thankeeuVoice: 'Jede Karte', thankeeuGift: 'Ja, aufs Konto oder als Gutschein',
      thankeeuMovie: 'Memory Movie bei jeder Karte', thankeeuWall: 'Jede Karte',
    },
    faqTitle: 'Häufige Fragen',
    linksTitle: () => 'Weitere Gruppenkarten in Deutschland',
    otherCountries: 'Dieselbe Karte in anderen Ländern',
    guides: 'Ratgeber und Vergleiche',
    alsoSee: 'Mehr bei Thankeeu',
    messagesCta: 'Nutze einen dieser Texte für deine Karte',
    langNote: 'Thankeeu ist auf Englisch. Nachrichten auf der Karte kann jeder in seiner Sprache schreiben, also natürlich auch auf Deutsch.',
  },
  nl: {
    home: 'Thankeeu',
    freeLine: 'Gratis beginnen. Versturen vanaf $3.15. Geen abonnement.',
    create: 'Kaart maken',
    demo: 'Voorbeeldkaart bekijken',
    coversHint: 'Tik op een ontwerp om je kaart te beginnen. Je kunt het later nog wijzigen.',
    seeAll: 'Alle ontwerpen bekijken',
    pricingTitle: () => 'Prijzen van groepskaarten in Nederland',
    pricingCols: ['Pakket', 'Kaarten', 'Prijs', 'Per kaart'],
    plans: { card_fee: 'Classic', standard: 'Standard', pack5: 'Pakket van 5', pack10: 'Pakket van 10', pack25: 'Pakket van 25', pack50: 'Pakket van 50', pack100: 'Pakket van 100' },
    freeRow: 'Kaart maken en berichten verzamelen',
    free: 'Gratis',
    approx: (cur) => `Prijzen in ${cur} zijn bij benadering, volgens de wisselkoers van vandaag. Er wordt afgerekend in Amerikaanse dollars.`,
    charged: (cur) => `Prijzen in ${cur} volgens de wisselkoers van vandaag. Betalen met Visa, Mastercard of American Express. Internationale kaarten kunnen ook met Apple Pay, Google Pay of PayPal betalen.`,
    pricingFoot: 'Tegoed verloopt nooit. Elke kaart heeft onbeperkt ondertekenaars, foto’s, GIFs, video, spraakberichten, de Memory Movie en een PDF download.',
    fullPricing: 'Alle prijzen',
    compareTitle: 'Thankeeu vergeleken',
    compareFeature: 'Functie',
    compareNote: 'Prijzen en functies van andere aanbieders zoals vermeld op hun eigen prijspagina in oktober 2026, in Amerikaanse dollars. Niet vermeld betekent dat we het daar niet vonden. Controleer hun website voor wijzigingen.',
    rows: {
      price: 'Prijs voor één kaart', packPrice: 'Laagste prijs per kaart in een pakket', unlimited: 'Onbeperkt berichten op de goedkoopste kaart',
      video: 'Videoberichten', voice: 'Spraakberichten', cashGift: 'Gezamenlijk cadeau in geld', movie: 'Herinneringsvideo',
      wall: 'Live fotomuur via QR code', expiry: 'Tegoed verloopt',
    },
    cells: {
      yes: 'Ja', no: 'Nee', notListed: 'Niet vermeld', giftCard: 'Cadeaubon', slideshow: 'Diavoorstelling, hoogste niveau',
      yearly: 'Jaarplannen', twelveMonths: 'Na 12 maanden', never: 'Nooit',
      thankeeuVideo: 'Elke kaart', thankeeuVoice: 'Elke kaart', thankeeuGift: 'Ja, naar de bank of als cadeaubon',
      thankeeuMovie: 'Memory Movie bij elke kaart', thankeeuWall: 'Elke kaart',
    },
    faqTitle: 'Veelgestelde vragen',
    linksTitle: () => 'Meer groepskaarten in Nederland',
    otherCountries: 'Dezelfde kaart in andere landen',
    guides: 'Gidsen en vergelijkingen',
    alsoSee: 'Meer op Thankeeu',
    messagesCta: 'Gebruik een van deze teksten op je kaart',
    langNote: 'Thankeeu is in het Engels. Berichten op de kaart schrijft iedereen in zijn eigen taal, dus gewoon in het Nederlands.',
  },
  es: {
    home: 'Thankeeu',
    freeLine: 'Gratis para empezar. Envío desde $3.15 USD. Sin suscripción.',
    create: 'Crear una tarjeta',
    demo: 'Ver una tarjeta de ejemplo',
    coversHint: 'Toca un diseño para empezar tu tarjeta. Puedes cambiarlo después.',
    seeAll: 'Ver todos los diseños',
    pricingTitle: () => 'Precios de tarjetas grupales en Colombia',
    pricingCols: ['Plan', 'Tarjetas', 'Precio', 'Por tarjeta'],
    plans: { card_fee: 'Classic', standard: 'Standard', pack5: 'Paquete de 5', pack10: 'Paquete de 10', pack25: 'Paquete de 25', pack50: 'Paquete de 50', pack100: 'Paquete de 100' },
    freeRow: 'Crear la tarjeta y reunir mensajes',
    free: 'Gratis',
    approx: (cur) => `Los precios en ${cur} son aproximados, según la tasa de cambio de hoy. El cobro se hace en dólares estadounidenses.`,
    charged: (cur) => `Precios en ${cur} según la tasa de cambio de hoy. Paga con Visa, Mastercard o American Express. Las tarjetas internacionales también pueden pagar con Apple Pay, Google Pay o PayPal.`,
    pricingFoot: 'Los créditos nunca vencen. Cada tarjeta incluye firmantes ilimitados, fotos, GIFs, video, notas de voz, la Memory Movie y descarga en PDF.',
    fullPricing: 'Todos los precios',
    compareTitle: 'Thankeeu frente a otras opciones',
    compareFeature: 'Función',
    compareNote: 'Precios y funciones de cada empresa según su propia página de precios en octubre de 2026, en dólares estadounidenses. No indicado significa que no lo encontramos allí. Revisa sus sitios por si hay cambios.',
    rows: {
      price: 'Precio de una tarjeta', packPrice: 'Precio más bajo por tarjeta en paquete', unlimited: 'Mensajes ilimitados en la tarjeta básica',
      video: 'Mensajes de video', voice: 'Notas de voz', cashGift: 'Regalo grupal en dinero', movie: 'Video de recuerdo',
      wall: 'Muro de fotos en vivo con código QR', expiry: 'Los créditos vencen',
    },
    cells: {
      yes: 'Sí', no: 'No', notListed: 'No indicado', giftCard: 'Tarjeta de regalo', slideshow: 'Presentación, plan superior',
      yearly: 'Planes anuales', twelveMonths: 'A los 12 meses', never: 'Nunca',
      thankeeuVideo: 'En cada tarjeta', thankeeuVoice: 'En cada tarjeta', thankeeuGift: 'Sí, al banco o como tarjeta de regalo',
      thankeeuMovie: 'Memory Movie en cada tarjeta', thankeeuWall: 'En cada tarjeta',
    },
    faqTitle: 'Preguntas frecuentes',
    linksTitle: () => 'Más tarjetas grupales en Colombia',
    otherCountries: 'La misma tarjeta en otros países',
    guides: 'Guías y comparaciones',
    alsoSee: 'También en Thankeeu',
    messagesCta: 'Usa uno de estos mensajes en tu tarjeta',
    langNote: 'Thankeeu está en inglés. Cada persona escribe su mensaje en el idioma que quiera, así que en español sin problema.',
  },
  fr: {
    home: 'Thankeeu',
    freeLine: 'Gratuit pour commencer. Envoi à partir de $3.15. Sans abonnement.',
    create: 'Créer une carte',
    demo: 'Voir une carte exemple',
    coversHint: 'Touchez un visuel pour commencer votre carte. Vous pourrez le changer ensuite.',
    seeAll: 'Voir tous les visuels',
    pricingTitle: () => 'Prix des cartes de groupe en France',
    pricingCols: ['Formule', 'Cartes', 'Prix', 'Par carte'],
    plans: { card_fee: 'Classic', standard: 'Standard', pack5: 'Lot de 5', pack10: 'Lot de 10', pack25: 'Lot de 25', pack50: 'Lot de 50', pack100: 'Lot de 100' },
    freeRow: 'Créer la carte et réunir les messages',
    free: 'Gratuit',
    approx: (cur) => `Les prix en ${cur} sont approximatifs, selon le taux de change du jour. Le paiement se fait en dollars américains.`,
    charged: (cur) => `Prix en ${cur} selon le taux de change du jour. Paiement par Visa, Mastercard ou American Express. Les cartes internationales peuvent aussi payer avec Apple Pay, Google Pay ou PayPal.`,
    pricingFoot: 'Les crédits n’expirent jamais. Chaque carte comprend des signataires illimités, photos, GIFs, vidéos, messages vocaux, le Memory Movie et un téléchargement PDF.',
    fullPricing: 'Tous les prix',
    compareTitle: 'Thankeeu face aux autres',
    compareFeature: 'Fonction',
    compareNote: 'Prix et fonctions des autres services tels qu’indiqués sur leur propre page de tarifs en octobre 2026, en dollars américains. Non indiqué signifie que nous ne l’y avons pas trouvé. Vérifiez leurs sites pour les changements.',
    rows: {
      price: 'Prix d’une carte', packPrice: 'Prix le plus bas par carte en lot', unlimited: 'Messages illimités sur la carte de base',
      video: 'Messages vidéo', voice: 'Messages vocaux', cashGift: 'Cagnotte commune', movie: 'Vidéo souvenir',
      wall: 'Mur photo en direct par QR code', expiry: 'Les crédits expirent',
    },
    cells: {
      yes: 'Oui', no: 'Non', notListed: 'Non indiqué', giftCard: 'Carte cadeau', slideshow: 'Diaporama, offre haute',
      yearly: 'Formules annuelles', twelveMonths: 'Après 12 mois', never: 'Jamais',
      thankeeuVideo: 'Chaque carte', thankeeuVoice: 'Chaque carte', thankeeuGift: 'Oui, vers la banque ou en carte cadeau',
      thankeeuMovie: 'Memory Movie sur chaque carte', thankeeuWall: 'Chaque carte',
    },
    faqTitle: 'Questions fréquentes',
    linksTitle: () => 'Autres cartes de groupe en France',
    otherCountries: 'La même carte dans d’autres pays',
    guides: 'Guides et comparatifs',
    alsoSee: 'Aussi sur Thankeeu',
    messagesCta: 'Utilisez un de ces messages sur votre carte',
    langNote: 'Thankeeu est en anglais. Chacun écrit son message dans la langue qu’il veut, donc en français sans souci.',
  },
};

/** Hero flipbook words, by language. */
export const ALBUM_LABELS = {
  en: { aria: (r, o) => `${r}'s ${o} card`, for: 'For', intro: 'Every page in this book was written by someone who cares about you.', turn: 'Turn the page', gift: 'Group gift', chipped: (n) => `from ${n} people who chipped in`, withLove: 'With love,', signed: (n) => `${n} people signed this card`, movie: 'Memory Movie ready to watch', cta: 'Create a card like this' },
  de: { aria: (r, o) => `Karte für ${r}: ${o}`, for: 'Für', intro: 'Jede Seite in diesem Buch hat jemand geschrieben, dem du wichtig bist.', turn: 'Umblättern', gift: 'Gruppengeschenk', chipped: (n) => `von ${n} Leuten, die mitgemacht haben`, withLove: 'Alles Liebe,', signed: (n) => `${n} Leute haben unterschrieben`, movie: 'Memory Movie ist fertig', cta: 'So eine Karte erstellen' },
  nl: { aria: (r, o) => `Kaart voor ${r}: ${o}`, for: 'Voor', intro: 'Elke pagina in dit boek is geschreven door iemand die om je geeft.', turn: 'Blader verder', gift: 'Groepscadeau', chipped: (n) => `van ${n} mensen die meededen`, withLove: 'Liefs,', signed: (n) => `${n} mensen hebben getekend`, movie: 'Memory Movie staat klaar', cta: 'Zo’n kaart maken' },
  fr: { aria: (r, o) => `Carte pour ${r} : ${o}`, for: 'Pour', intro: 'Chaque page de ce livre a été écrite par quelqu’un qui tient à vous.', turn: 'Tournez la page', gift: 'Cadeau commun', chipped: (n) => `de ${n} personnes qui ont participé`, withLove: 'Avec affection,', signed: (n) => `${n} personnes ont signé cette carte`, movie: 'Memory Movie prêt à regarder', cta: 'Créer une carte semblable' },
  es: { aria: (r, o) => `Tarjeta para ${r}: ${o}`, for: 'Para', intro: 'Cada página de este libro la escribió alguien que te quiere.', turn: 'Pasa la página', gift: 'Regalo grupal', chipped: (n) => `de ${n} personas que aportaron`, withLove: 'Con cariño,', signed: (n) => `${n} personas firmaron esta tarjeta`, movie: 'Memory Movie lista para ver', cta: 'Crear una tarjeta así' },
};

/** Photos and GIFs the hero flipbooks may use (all known to load). */
export const HERO_PHOTOS = {
  team: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=640&q=70',
  picnic: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=640&q=70',
  party: 'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=640&q=70',
  celebration: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=640&q=70',
  couple: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=640&q=70',
};
export const HERO_GIFS = {
  party: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
  clap: 'https://media.giphy.com/media/3o7abGQa0aRJUurpII/giphy.gif',
  love: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif',
  dance: 'https://media.giphy.com/media/RrVzUOXldFe8M/giphy.gif',
  confetti: 'https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif',
  hug: 'https://media.giphy.com/media/l4Ki2obCyAQS5WhFe/giphy.gif',
  cake: 'https://media.giphy.com/media/3o7abKhkRnlFXUVzpe/giphy.gif',
};
export const HERO_ACCENTS = ['#7C3AED', '#DB2777', '#0E7490'];
export const SIGNER_TINTS = ['#EC4899', '#0EA5E9', '#7C3AED', '#F59E0B', '#10B981', '#6366F1'];
