/**
 * Wedding landing pages (guestbook, photo-sharing, gift and comparison pages).
 * Each renders the homepage layout (pages/Home.jsx with a `landing` prop) with
 * wedding-only copy: a fixed "wedding" hero (no rotating occasion words),
 * wedding covers, wedding sample wishes, and the page's own FAQs/comparison.
 *
 * Plain data (no JSX) so scripts/prerender.js builds the static HTML from the
 * same source. Comparison cells: true = ✓, false = ✗, a string = shown as is.
 */

const PHOTO = 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80';
const GIF_1 = 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif';
const GIF_2 = 'https://media.giphy.com/media/3o7abGQa0aRJUurpII/giphy.gif';
const AV = (id) => `https://images.unsplash.com/${id}?w=120&h=120&fit=crop&crop=face`;

// Example wishes shown in the hero: illustrative card content, not reviews.
export const WEDDING_SAMPLE_WISHES = [
  { name: 'Aunt Grace', role: 'The bride’s aunt', font: 'font-vibes', media: 'photo', photoUrl: PHOTO,
    text: 'Watching you two say “I do” was the best part of my year. May your home always be loud with laughter. All my love.',
    avatar: AV('photo-1494790108377-be9c29b29330') },
  { name: 'Daniel', role: 'Best man', font: 'font-dancing', media: 'gif', gifUrl: GIF_1,
    text: 'Twelve years of friendship and I’ve never seen you grin like you did today. Congratulations, you two!',
    avatar: AV('photo-1607746882042-944635dfe10e') },
  { name: 'Mei', role: 'Maid of honour', font: 'font-dancing', media: 'voice',
    text: 'Recorded this between the speeches because I couldn’t wait. You look radiant. Here’s to forever!',
    avatar: AV('photo-1573496799652-408c2ac9fe98') },
  { name: 'Uncle Marcus', role: 'The groom’s uncle', font: 'font-sacramento', media: 'gif', gifUrl: GIF_2,
    text: 'Welcome to the family! I couldn’t travel for the day, so here’s my best dance move instead. Blessings to you both.',
    avatar: AV('photo-1539571696357-5a69c17a67c6') },
];

const DEFAULT_FEATURES = [
  ['No app. No account.', 'Guests scan your QR code or tap the link and they’re writing their wishes a few seconds later. It works on any phone, for grandma and for the teenagers.'],
  ['Messages, photos, voice notes and a gift in one place', 'Most tools only collect photos. Thankeeu collects messages, photos, videos, voice notes and gift money, all in one card for the couple.'],
  ['A live photo wall at the reception', 'Put the Live Memory Wall™ on a TV or projector. Photos and wishes pop up on screen as guests share them.'],
  ['A Wedding Memory Movie™, made for you', 'After the day, every message, photo and voice note is turned into a film. It’s a wedding video made by everyone who loves them.'],
  ['Kept for good', 'Everything guests share stays on the card, so the couple can look back on it at their first anniversary and their fiftieth.'],
  ['Guests anywhere can join in', 'Family overseas and friends who couldn’t make it can sign and chip in from the same link, from any country.'],
];

const DEFAULT_FAQS = [
  { q: 'Is Thankeeu free for weddings?', a: 'Making the card and collecting messages, photos and voice notes costs nothing. You pay a small fee once, only when you send the finished card to the couple. It starts from $3.15 and you see it before you pay.' },
  { q: 'Do guests need to download an app?', a: 'No. Guests scan your QR code or tap the link and add photos, messages and voice notes in their phone’s browser. No app and no account.' },
  { q: 'How many guests can take part?', a: 'As many as you invite. A wedding of 500 guests can all sign and share from the same link.' },
  { q: 'Can guests who couldn’t attend still take part?', a: 'Yes. Anyone with the link, near or far, can write a message, add photos, record a voice note and give to the gift.' },
  { q: 'Does Thankeeu make a video from everything guests share?', a: 'Yes. The Memory Movie™ turns every message, photo and voice note into a film the couple can keep and share.' },
];

// ✓ / ✗ rows shared by the photo-app pages. Competitor cells describe the
// category in general ("most photo-only tools"), not a named product.
const PHOTO_TOOL_ROWS = [
  ['Guests upload photos by QR code', true, true],
  ['No app or account for guests', 'Some', true],
  ['Written wishes from every guest', false, true],
  ['Voice note blessings', false, true],
  ['Wedding gift pot', false, true],
  ['Automatic Memory Movie™', false, true],
  ['Live photo wall at the venue', 'Some', true],
  ['Photo wall and group card in one link', false, true],
];

const COMPARISON_NOTE = 'Based on each product’s publicly listed features when we wrote this. Check their websites for current plans.';

const RELATED = {
  guestbook: [['/digital-wedding-guest-book', 'Digital wedding guest book'], ['/online-wedding-guestbook', 'Online wedding guestbook'], ['/wedding-voice-note-guest-book', 'Voice note guest book'], ['/wedding-video-message-book', 'Video message book']],
  photos: [['/wedding-photo-sharing-app', 'Wedding photo sharing app'], ['/qr-code-for-wedding-photos', 'QR code for wedding photos'], ['/wedding-memory-wall', 'Wedding memory wall'], ['/collect-wedding-guest-photos', 'Collect guest photos']],
  compare: [['/best-wedding-photo-sharing-app', 'Best wedding photo sharing apps'], ['/guestpix-alternative', 'GuestPix alternative'], ['/thankeeu-vs-wedtrove', 'Thankeeu vs Wedtrove'], ['/kululu-alternative', 'Kululu alternative'], ['/pov-alternative', 'POV alternative'], ['/guestcam-alternative', 'GuestCam alternative'], ['/weduploader-alternative', 'WedUploader alternative']],
  card: [['/wedding-group-card', 'Wedding group card'], ['/wedding-cash-gift-platform', 'Wedding cash gift pot'], ['/occasions/wedding', 'Wedding cards']],
};

const WEDDING_DEFAULTS = {
  coverOccasions: ['wedding'],
  coversPerCategory: 10,
  coversTitle: 'Pick a wedding cover, then every guest signs',
  coversSubtitle: 'Illustrated covers made for the happy couple. Tap one to start your card. It’s free and there’s no signup.',
  ctaTo: '/card/new?occasion=wedding',
  ctaLabel: 'Start a wedding card',
  sampleMessages: WEDDING_SAMPLE_WISHES,
  hideTeams: true,
  breadcrumbParents: [{ name: 'Wedding cards', url: '/occasions/wedding' }],
  heroVariant: 'wedding',
  intentStart: 'wedding',
  demo: {
    groupName: 'Ada & Tom’s Wedding',
    buriedSub: 'wedding wishes lost under memes and seating plans',
    cardGreeting: 'Congratulations, Ada & Tom!',
    mockIcon: 'Heart',
    mockTitle: 'Ada & Tom’s Wedding Card',
    mockMessages: [
      { av: 'AG', name: 'Aunt Grace', msg: 'May your home always be loud with laughter. All my love!' },
      { av: 'DK', name: 'Daniel K.', msg: 'Never seen you grin like today. Congrats, you two!' },
      { av: 'ML', name: 'Mei L.', msg: 'Here’s to forever. You looked radiant!' },
      { av: 'UM', name: 'Uncle Marcus', msg: 'Welcome to the family! Blessings to you both.' },
    ],
  },
  hideSendMoney: true,
  hideOccasions: true,
  sharedFaqCount: 0,
  useCasesTitle: 'Why couples pick Thankeeu',
  useCases: DEFAULT_FEATURES,
  faqs: DEFAULT_FAQS,
  linksTitle: 'More ideas for your wedding',
  ctaLead: 'Give them a keepsake',
  ctaAccent: 'from everyone who loves them',
  locale: 'en',
};

const alt = (name, slug, pitch, extraRows, faqs) => ({
  path: slug,
  breadcrumb: `${name} Alternative`,
  breadcrumbParents: [{ name: 'Wedding cards', url: '/occasions/wedding' }],
  title: `${name} Alternative for Wedding Guest Photos: Photos, Wishes & Gifts | Thankeeu`,
  description: `Want a ${name} alternative? Thankeeu collects wedding photos, videos, voice notes, wishes and cash gifts from every guest in one link. No app needed.`.slice(0, 160),
  keywords: `${name.toLowerCase()} alternative, better than ${name.toLowerCase()}, ${name.toLowerCase()} vs thankeeu, wedding guest photo app, wedding photo sharing QR code, collect wedding photos from guests`,
  tagline: `A ${name} alternative for weddings`,
  h1Lead: `The ${name} alternative`,
  h1Accent: 'for photos, wishes and gifts.',
  subtitle: pitch,
  comparison: {
    title: `Thankeeu vs ${name}`,
    columns: [name, 'Thankeeu'],
    rows: [...PHOTO_TOOL_ROWS.map(([f, , t]) => [f, extraRows[f] ?? PHOTO_TOOL_ROWS.find(r => r[0] === f)[1], t])],
    note: COMPARISON_NOTE,
  },
  useCasesTitle: `Why couples move from ${name} to Thankeeu`,
  faqs,
  related: RELATED.compare.filter(([h]) => h !== slug).concat(RELATED.photos.slice(0, 2)),
});

const PAGES = {
  // ── Guestbooks ────────────────────────────────────────────────────────────
  'digital-wedding-guest-book': {
    path: '/digital-wedding-guest-book',
    breadcrumb: 'Digital Wedding Guest Book',
    title: 'Digital Wedding Guest Book: Messages, Photos & Voice Notes | Thankeeu',
    description: 'A digital wedding guest book for messages, photos, videos and voice notes from every guest. Guests sign on any phone with no app, and it’s kept for good.',
    keywords: 'digital wedding guest book, digital guest book wedding, wedding guest book online, virtual wedding guest book, electronic wedding guest book, QR code wedding guest book',
    tagline: 'Digital wedding guest book',
    h1Lead: 'A digital wedding guest book',
    h1Accent: 'that holds more than signatures.',
    subtitle: 'Every guest writes a message, and can add a photo, a video or a voice note if they want. It all lands in one card for the couple. No lost pages and no handwriting to squint at.',
    comparison: { columns: ['Paper guest book', 'Thankeeu'], rows: [
      ['Written wishes', true, true], ['Photos and videos', false, true], ['Voice note blessings', false, true],
      ['Guests who couldn’t attend can sign', false, true], ['Wedding gift pot', false, true], ['Can’t be lost, damaged or left at the venue', false, true],
      ['Automatic Memory Movie™', false, true],
    ] },
    faqs: [
      { q: 'What is a digital wedding guest book?', a: 'It’s the paper guest book, moved online. On Thankeeu guests also add photos, videos and voice notes, and it all reaches the couple in one card.' },
      { q: 'How does a digital guest book work at the wedding?', a: 'Make your wedding card and put the QR code on a sign at the entrance or on each table. Guests scan it with their phone camera and sign in under a minute. No app, no account.' },
      { q: 'Is a digital guest book better than a paper one?', a: 'For most couples, yes. It holds photos and voices as well as words, guests anywhere in the world can sign it, and nobody can lose it or leave it at the venue.' },
      ...DEFAULT_FAQS.slice(0, 2),
    ],
    related: [...RELATED.guestbook.filter(([h]) => h !== '/digital-wedding-guest-book'), ...RELATED.card.slice(0, 1)],
  },
  'online-wedding-guestbook': {
    path: '/online-wedding-guestbook',
    breadcrumb: 'Online Wedding Guestbook',
    title: 'Online Wedding Guestbook: Messages, Photos & Voice Notes | Thankeeu',
    description: 'An online wedding guestbook that does more than paper. Guests leave messages, photos, voice notes and gifts from their phone. No app needed.',
    keywords: 'online wedding guestbook, online guestbook for wedding, digital wedding guestbook, virtual wedding guestbook, replace paper wedding guestbook, wedding guestbook alternative',
    tagline: 'Online wedding guestbook',
    h1Lead: 'An online wedding guestbook',
    h1Accent: 'that holds it all.',
    subtitle: 'A paper guestbook gets a signature and a line or two. An online wedding guestbook on Thankeeu gets messages, photos, voice notes and video wishes from every guest, at the venue or from the other side of the world.',
    comparison: { columns: ['Paper guestbook', 'Thankeeu'], rows: [
      ['Written wishes', true, true], ['Photos and videos', false, true], ['Voice note blessings', false, true],
      ['Signed from anywhere', false, true], ['Wedding gift pot', false, true], ['Nothing to print, order or run out of', false, true],
    ] },
    faqs: [
      { q: 'What is an online wedding guestbook?', a: 'A page where guests leave their wishes, photos and memories for the couple. A paper book can’t take photos, voice notes or videos. This can, and it never gets lost or damaged.' },
      { q: 'How do guests sign an online guestbook?', a: 'Share a link or QR code. Guests open it on their phone, write a message, add a photo or voice note and tap send. It takes under a minute and needs no account.' },
      { q: 'Can I use it as the guestbook at the reception?', a: 'Yes. Put the QR code at a signing table, on each table or at the entrance. Guests sign on their own phones as they arrive, over drinks or at dinner.' },
      { q: 'Can I add the guestbook to our wedding website?', a: 'Yes. Put the link on your wedding website, in the invitations and in your group chats. Guests can sign from any device, before and after the day.' },
      DEFAULT_FAQS[0],
    ],
    related: [...RELATED.guestbook.filter(([h]) => h !== '/online-wedding-guestbook'), ...RELATED.card.slice(0, 1)],
  },
  'wedding-voice-note-guest-book': {
    path: '/wedding-voice-note-guest-book',
    breadcrumb: 'Wedding Voice Note Guest Book',
    title: 'Wedding Voice Note Guest Book: Hear Every Guest’s Blessing | Thankeeu',
    description: 'A wedding voice note guest book with no phone booth to rent. Guests record blessings on their own phone, no app, next to their messages and photos.',
    keywords: 'wedding voice note guest book, audio guest book wedding, wedding audio guestbook, voice message guest book, wedding voicemail guest book, audio guestbook alternative',
    tagline: 'Voice note wedding guest book',
    h1Lead: 'Hear every guest’s blessing',
    h1Accent: 'in their own voice.',
    subtitle: 'Guests tap the microphone and say their blessing, toast or prayer. It goes into the couple’s wedding card next to their message and photos. It’s a voice note guest book with no rented phone and no queue.',
    comparison: { columns: ['Audio guest book phone', 'Thankeeu'], rows: [
      ['Voice messages from guests', true, true], ['No hardware to rent or return', false, true], ['No queue, guests record on their own phones', false, true],
      ['Guests who couldn’t attend can record', false, true], ['Written wishes and photos too', false, true], ['Wedding gift pot', false, true],
    ] },
    faqs: [
      { q: 'What is a voice note guest book?', a: 'An audio guest book where guests record a spoken message for the couple. On Thankeeu they record it on their own phone, so there’s no rented handset and no queue.' },
      { q: 'How long can a voice note be?', a: 'Long enough for a proper toast or blessing. Each note is saved on the card next to the guest’s written message and photos.' },
      { q: 'Can elderly relatives record one?', a: 'Yes. They scan the QR code, tap the microphone and talk. No app and no account.' },
      ...DEFAULT_FAQS.slice(0, 2),
    ],
    related: [...RELATED.guestbook.filter(([h]) => h !== '/wedding-voice-note-guest-book'), ...RELATED.card.slice(0, 1)],
  },
  'wedding-video-message-book': {
    path: '/wedding-video-message-book',
    breadcrumb: 'Wedding Video Message Book',
    title: 'Wedding Video Message Book: Video Wishes from Every Guest | Thankeeu',
    description: 'A wedding video message book: every guest records or uploads a short clip from their phone, no app, and it all becomes a Memory Movie.',
    keywords: 'wedding video message book, wedding video guest book, video wishes for wedding, collect wedding video messages, wedding video guestbook, video messages from guests',
    tagline: 'Wedding video message book',
    h1Lead: 'Video wishes from every guest,',
    h1Accent: 'in one wedding keepsake.',
    subtitle: 'Guests record or upload a short video from their phone. No app, no account. Each clip sits in the couple’s card next to written wishes, photos and voice notes, then goes into their Memory Movie™.',
    faqs: [
      { q: 'How do guests send a video message?', a: 'They open the link or scan the QR code, then record or upload a short clip from their phone. No app and no account.' },
      { q: 'Can guests who couldn’t attend send a video?', a: 'Yes. Share the link before or after the day and anyone, anywhere, can add a video wish.' },
      DEFAULT_FAQS[4], DEFAULT_FAQS[0], DEFAULT_FAQS[2],
    ],
    comparison: { columns: ['Video apps', 'Thankeeu'], rows: [
      ['Video wishes from guests', true, true], ['No app for guests', 'Some', true], ['Written wishes and photos too', false, true],
      ['Voice note blessings', false, true], ['Wedding gift pot', false, true], ['Automatic Memory Movie™', 'Some', true],
    ], note: COMPARISON_NOTE },
    related: [...RELATED.guestbook.filter(([h]) => h !== '/wedding-video-message-book'), ...RELATED.card.slice(0, 1)],
  },
  'wedding-memory-book': {
    path: '/wedding-memory-book',
    breadcrumb: 'Wedding Memory Book',
    title: 'Wedding Memory Book: Every Message, Photo & Video in One | Thankeeu',
    description: 'A wedding memory book written by every guest: messages, photos, voice notes and videos, made into a Memory Movie after the day. Free to start.',
    keywords: 'wedding memory book, digital wedding memory book, wedding keepsake book, wedding memories from guests, wedding memory album, wedding memory keepsake',
    tagline: 'Wedding memory book',
    h1Lead: 'A wedding memory book',
    h1Accent: 'written by everyone who was there.',
    subtitle: 'Every guest adds a message, photo, voice note or video. Thankeeu puts it together into one wedding memory book for the couple, then turns it into a Memory Movie™ they can watch every anniversary.',
    comparison: { columns: ['Printed memory book', 'Thankeeu'], rows: [
      ['Messages from guests', true, true], ['Photos', true, true], ['Voice notes and videos', false, true],
      ['Guests anywhere can add to it', false, true], ['Automatic Memory Movie™', false, true], ['No design or printing work', false, true],
    ] },
    related: [...RELATED.guestbook, ...RELATED.card.slice(0, 1)],
  },
  // ── Main wedding card page ────────────────────────────────────────────────
  'occasions-wedding': {
    path: '/occasions/wedding',
    breadcrumbParents: [],
    breadcrumb: 'Wedding Cards',
    title: 'Online Wedding Cards: Group Wedding Cards Everyone Signs | Thankeeu',
    description: 'Online wedding cards that family, friends and colleagues all sign, with wishes, photos, voice notes and a pooled wedding gift. Free to create.',
    keywords: 'online wedding card, wedding congratulations group card, group wedding card, wedding card everyone signs, digital wedding card, group wedding ecard, team wedding card, wedding gift pool, congratulations on your wedding',
    tagline: 'Online wedding cards',
    h1Lead: 'Online wedding cards',
    h1Accent: 'from everyone who loves them.',
    subtitle: 'Family, friends and colleagues all sign one card with wishes, photos, GIFs and voice notes, and put money into one wedding gift from wherever they live. It arrives on the big day, at the exact time you pick.',
    useCases: [
      ['Blessings in their own voice', 'A blessing from a parent or grandparent means a lot. With voice notes, family can say it in their own voice, and the couple keeps it for life.'],
      ['No awkward gift collecting', 'Everyone chips in securely online when they sign, and the couple withdraws the total to their bank account.'],
      ['For every kind of wedding', 'Civil ceremony, religious wedding, destination trip or small dinner. One card brings everyone together.'],
      ['Family everywhere can sign', 'Relatives in other countries and friends who can’t travel sign and give from the same link.'],
      ['Photos, GIFs and voice notes', 'Each guest can add a photo, a GIF or a recording to their message, straight from their phone.'],
      ['A Memory Movie™ for the couple', 'Every message, photo and voice note is made into a film the couple keeps for good.'],
    ],
    comparison: { columns: ['Paper wedding card', 'Thankeeu'], rows: [
      ['Everyone signs one card', true, true], ['Family abroad can sign', false, true], ['Photos, GIFs and voice notes', false, true],
      ['Pooled wedding gift', false, true], ['Delivered at an exact time', false, true], ['Automatic Memory Movie™', false, true],
    ] },
    faqs: [
      { q: 'How do I create a wedding group card?', a: 'Tap “Start a wedding card”, pick a cover and type the couple’s names. Then share the link with family, friends and colleagues. Nobody needs an account to sign.' },
      { q: 'Can we pool a wedding gift?', a: 'Yes. Any number of people can chip in any amount when they sign, and the couple withdraws the total to their bank account.' },
      { q: 'Can family abroad contribute to the gift?', a: 'Yes. Family and friends anywhere in the world can sign the card and give to the same wedding gift.' },
      { q: 'How many people can sign a wedding card?', a: 'There’s no limit. The whole family, the wedding party and the office can all sign the same card.' },
      DEFAULT_FAQS[0],
    ],
    // The hub links to every wedding page, so each one is reachable from it.
    related: [
      ...RELATED.card.filter(([h]) => h !== '/occasions/wedding'), ...RELATED.guestbook, ...RELATED.photos,
      ['/wedding-memory-book', 'Wedding memory book'], ['/wedding-photo-gallery', 'Wedding photo gallery'],
      ['/wedding-photo-album-online', 'Online wedding photo album'], ['/wedding-photo-upload-app', 'Wedding photo upload app'],
      ['/wedding-guest-photo-collection', 'Wedding guest photo collection'], ['/uk-wedding-photo-sharing', 'Wedding photo sharing UK'],
      ['/usa-wedding-photo-sharing', 'Wedding photo sharing USA'], ['/best-wedding-photo-sharing-app', 'Best wedding photo sharing apps'],
    ],
  },
  // ── Cards & gifts ─────────────────────────────────────────────────────────
  'wedding-group-card': {
    path: '/wedding-group-card',
    breadcrumb: 'Wedding Group Card',
    title: 'Wedding Group Card: Everyone Signs, Plus a Wedding Gift | Thankeeu',
    description: 'A wedding group card everyone signs, with messages, photos, voice notes and a pooled wedding gift in one card for the couple. Free to create.',
    keywords: 'wedding group card, group wedding card, wedding card everyone signs, online wedding card, digital wedding card from group, wedding card for colleague, group wedding gift',
    tagline: 'Wedding group card',
    h1Lead: 'A wedding group card',
    h1Accent: 'signed by everyone who loves them.',
    subtitle: 'One card, every guest. Messages, photos, voice notes and a pooled wedding gift reach the couple together, at the exact moment you choose.',
    comparison: { columns: ['Paper group card', 'Thankeeu'], rows: [
      ['Everyone signs one card', true, true], ['Signed from anywhere', false, true], ['Photos, videos and voice notes', false, true],
      ['Pooled wedding gift', false, true], ['Delivered at an exact time', false, true], ['Automatic Memory Movie™', false, true],
    ] },
    faqs: [
      { q: 'What is a wedding group card?', a: 'A card the wedding party, guests, colleagues or friends all sign together. Everyone adds their own message, photo or voice note, and the couple gets one combined card.' },
      { q: 'Can I add a gift collection to the wedding card?', a: 'Yes. Everyone can chip in to a pooled wedding gift when they sign, and the couple withdraws the total to their bank account.' },
      { q: 'Can colleagues sign a wedding card for a coworker?', a: 'Yes, teams do this a lot. Share the link in Slack, email or a group chat. Nobody needs an account to sign.' },
      DEFAULT_FAQS[2], DEFAULT_FAQS[0],
    ],
    related: [...RELATED.card.filter(([h]) => h !== '/wedding-group-card'), ...RELATED.guestbook.slice(0, 2)],
  },
  'wedding-cash-gift-platform': {
    path: '/wedding-cash-gift-platform',
    breadcrumb: 'Wedding Cash Gift Platform',
    title: 'Wedding Cash Gift Pot: Guests Give with Their Wishes | Thankeeu',
    description: 'A wedding cash gift pot guests actually use. They write a message and chip in at the same time, from any country. The couple withdraws to their bank.',
    keywords: 'wedding cash gift platform, wedding cash fund, wedding money gift online, honeymoon fund, collect wedding gifts online, wedding gift pot, cash wedding registry',
    tagline: 'Wedding cash gift pot',
    h1Lead: 'A wedding gift pot',
    h1Accent: 'guests actually use.',
    subtitle: 'Guests open the wedding card, write their wishes and chip in to the cash gift in the same step. No separate payment link and no awkward requests for bank details. The couple withdraws the total to their bank account.',
    currency: null,
    payments: 'Guests pay securely by card from any country, and every fee is shown before they pay.',
    comparison: { columns: ['Separate cash registry', 'Thankeeu'], rows: [
      ['Guests can give money', true, true], ['Wishes and gift in one step', false, true], ['Photos and voice notes with the gift', false, true],
      ['Guests from any country', 'Some', true], ['No account needed to give', 'Some', true], ['A keepsake card for the couple', false, true],
    ], note: COMPARISON_NOTE },
    faqs: [
      { q: 'How do guests contribute a cash gift?', a: 'They open the wedding card link, write their message, pick an amount in the gift section and pay by card. It all adds up to one gift for the couple.' },
      { q: 'Is it safe to give money through Thankeeu?', a: 'Yes. Payments go through Flutterwave, a regulated, PCI DSS compliant payment provider. Card details never touch Thankeeu’s servers.' },
      { q: 'How does the couple receive the gift?', a: 'Once the card is delivered, the couple asks for a withdrawal and the pooled gift is paid into their bank account.' },
      { q: 'Can guests send a message and a gift together?', a: 'Yes, that’s the idea. Guests write their wishes, add a photo or voice note and give to the gift in one go, so the couple gets the words and the money together.' },
      DEFAULT_FAQS[0],
    ],
    related: [...RELATED.card.filter(([h]) => h !== '/wedding-cash-gift-platform'), ...RELATED.guestbook.slice(0, 2)],
  },
  // ── Photo sharing ─────────────────────────────────────────────────────────
  'wedding-photo-sharing-app': {
    path: '/wedding-photo-sharing-app',
    breadcrumb: 'Wedding Photo Sharing App',
    title: 'Wedding Photo Sharing App: Guests Upload by QR Code | Thankeeu',
    description: 'A wedding photo sharing app guests don’t have to download. They scan a QR code and upload photos straight away, plus wishes, voice notes and a gift.',
    keywords: 'wedding photo sharing app, wedding photo app for guests, wedding photo sharing QR code, share wedding photos with guests, wedding photo sharing no app, guest photo sharing app',
    tagline: 'Wedding photo sharing, nothing to download',
    h1Lead: 'The wedding photo sharing app',
    h1Accent: 'your guests actually use.',
    subtitle: 'Put one QR code up at the venue. Guests scan it, upload, and every photo shows up in your shared wedding gallery and on the live wall. Nothing to download, no account, and it works on every phone.',
    comparison: { columns: ['Photo apps', 'Thankeeu'], rows: PHOTO_TOOL_ROWS, note: COMPARISON_NOTE },
    related: [...RELATED.photos.filter(([h]) => h !== '/wedding-photo-sharing-app'), ...RELATED.compare.slice(0, 2)],
  },
  'wedding-photo-upload-app': {
    path: '/wedding-photo-upload-app',
    breadcrumb: 'Wedding Photo Upload App',
    title: 'Wedding Photo Upload App: Guests Upload from Their Phones | Thankeeu',
    description: 'A wedding photo upload app that needs no download. Guests scan a QR code and their photos go straight into your wedding gallery from their phone.',
    keywords: 'wedding photo upload app, upload wedding photos guests, guest photo upload wedding, wedding photo upload QR code, wedding guest upload photos',
    tagline: 'Wedding photo upload',
    h1Lead: 'Let every guest upload photos',
    h1Accent: 'straight from their phone.',
    subtitle: 'No app to download and no account to make. Guests tap your link or scan the QR code and their photos go straight into your wedding gallery, with a note for the couple if they like.',
    comparison: { columns: ['Upload apps', 'Thankeeu'], rows: PHOTO_TOOL_ROWS, note: COMPARISON_NOTE },
    related: [...RELATED.photos, ...RELATED.compare.slice(0, 1)],
  },
  'collect-wedding-guest-photos': {
    path: '/collect-wedding-guest-photos',
    breadcrumb: 'Collect Wedding Guest Photos',
    title: 'Collect Wedding Guest Photos: One Link, Every Memory | Thankeeu',
    description: 'Collect wedding guest photos in one place with one link or QR code. Guests need no app. You also get wishes, voice notes and a gift. Free to start.',
    keywords: 'collect wedding guest photos, collect photos from wedding guests, how to collect wedding photos from guests, gather wedding photos, wedding photo collection',
    tagline: 'Collect your guests’ wedding photos',
    h1Lead: 'Collect every guest’s photos',
    h1Accent: 'from one shared link.',
    subtitle: 'Share one link before, during and after the wedding. Guests add their best shots and you watch the collection grow live. No more chasing people in group chats for weeks.',
    comparison: { columns: ['Shared drives & chats', 'Thankeeu'], rows: [
      ['One place for everyone’s photos', 'Some', true], ['No app or account for guests', false, true], ['Live photo wall at the venue', false, true],
      ['Written wishes and voice notes', false, true], ['Wedding gift pot', false, true], ['Automatic Memory Movie™', false, true],
    ] },
    related: [...RELATED.photos.filter(([h]) => h !== '/collect-wedding-guest-photos'), ...RELATED.guestbook.slice(0, 1)],
  },
  'wedding-guest-photo-collection': {
    path: '/wedding-guest-photo-collection',
    breadcrumb: 'Wedding Guest Photo Collection',
    title: 'Wedding Guest Photo Collection: Every Shot in One Place | Thankeeu',
    description: 'Wedding guest photo collection without the chasing. Put a QR code at the venue and guests scan and upload without downloading anything. Kept for good.',
    keywords: 'wedding guest photo collection, guest photo collection wedding, wedding photos from guests, gather wedding guest photos, wedding photo QR code',
    tagline: 'Wedding guest photo collection',
    h1Lead: 'Gather every guest’s photos',
    h1Accent: 'without asking each one.',
    subtitle: 'Stop chasing guests for photos after the wedding. Put one QR code at the venue and their best shots go straight into your shared collection, along with their wishes for the couple.',
    comparison: { columns: ['Asking guests afterwards', 'Thankeeu'], rows: [
      ['Photos collected on the day', false, true], ['No app or account for guests', true, true], ['Everything in one place', false, true],
      ['Live photo wall at the venue', false, true], ['Wishes and voice notes too', false, true],
    ] },
    related: [...RELATED.photos, ...RELATED.guestbook.slice(0, 1)],
  },
  'wedding-photo-gallery': {
    path: '/wedding-photo-gallery',
    breadcrumb: 'Wedding Photo Gallery',
    title: 'Wedding Photo Gallery: A Shared Gallery Guests Fill Live | Thankeeu',
    description: 'A shared wedding photo gallery that fills up during the reception. Guests upload by QR code, no app, and their photos appear live.',
    keywords: 'wedding photo gallery, shared wedding photo gallery, online wedding gallery, wedding gallery guests upload, live wedding photo gallery',
    tagline: 'Shared wedding photo gallery',
    h1Lead: 'A shared wedding gallery',
    h1Accent: 'that fills itself at the reception.',
    subtitle: 'Put your QR code up at the venue and every guest who scans it adds photos live. Watch the gallery grow from the first dance to the last song, then keep it for good.',
    comparison: { columns: ['Gallery apps', 'Thankeeu'], rows: PHOTO_TOOL_ROWS, note: COMPARISON_NOTE },
    related: [...RELATED.photos, ...RELATED.compare.slice(0, 1)],
  },
  'wedding-photo-album-online': {
    path: '/wedding-photo-album-online',
    breadcrumb: 'Online Wedding Photo Album',
    title: 'Online Wedding Photo Album: Shared by Every Guest | Thankeeu',
    description: 'An online wedding photo album every guest adds to. They upload by QR code with nothing to download, and add their wishes for the couple. Kept for good.',
    keywords: 'wedding photo album online, online wedding photo album, shared wedding album, digital wedding album, wedding album guests upload',
    tagline: 'Online wedding photo album',
    h1Lead: 'An online wedding album',
    h1Accent: 'seen through every guest’s eyes.',
    subtitle: 'Your photographer sees one angle. Your 200 guests see 200. Thankeeu puts them into one shared album, with the messages and voice notes that explain each shot.',
    comparison: { columns: ['Cloud albums', 'Thankeeu'], rows: [
      ['Shared photo album', true, true], ['No app or account for guests', 'Some', true], ['Live photo wall at the venue', false, true],
      ['Wishes and voice notes with the photos', false, true], ['Wedding gift pot', false, true], ['Automatic Memory Movie™', false, true],
    ] },
    related: [...RELATED.photos, ...RELATED.guestbook.slice(0, 1)],
  },
  'uk-wedding-photo-sharing': {
    path: '/uk-wedding-photo-sharing',
    breadcrumb: 'UK Wedding Photo Sharing',
    title: 'Wedding Photo Sharing UK: Guest Photos by QR Code | Thankeeu',
    description: 'Wedding photo sharing for UK couples. Guests upload photos by QR code with no app, and add wishes, voice notes and a gift in GBP. Free to start.',
    keywords: 'wedding photo sharing UK, UK wedding photo app, wedding guest photos UK, QR code wedding photos UK, wedding photo sharing app UK, wedding guest book UK',
    tagline: 'Wedding photo sharing for UK couples',
    h1Lead: 'Wedding photo sharing',
    h1Accent: 'for UK couples.',
    subtitle: 'From a register office in London to a barn in the Cotswolds, put a QR code on the tables and every guest’s photos land in your shared gallery, with their wishes and a gift in pounds.',
    comparison: { columns: ['Photo apps', 'Thankeeu'], rows: PHOTO_TOOL_ROWS, note: COMPARISON_NOTE },
    related: [['/usa-wedding-photo-sharing', 'US wedding photo sharing'], ...RELATED.photos.slice(0, 3)],
  },
  'usa-wedding-photo-sharing': {
    path: '/usa-wedding-photo-sharing',
    breadcrumb: 'USA Wedding Photo Sharing',
    title: 'Wedding Photo Sharing USA: Guest Photos by QR Code | Thankeeu',
    description: 'Wedding photo sharing for US couples. Guests upload photos by QR code with nothing to download, and add wishes, voice notes and a gift in USD.',
    keywords: 'wedding photo sharing USA, US wedding photo app, wedding guest photos app, QR code wedding photos, wedding photo sharing app no download, wedding guest book USA',
    tagline: 'Wedding photo sharing for US couples',
    h1Lead: 'Wedding photo sharing',
    h1Accent: 'for couples across the US.',
    subtitle: 'From a vineyard in California to a backyard in Texas, put up one QR code and every guest adds their photos right away, with their wishes and a gift in USD. No app, no signup.',
    comparison: { columns: ['Photo apps', 'Thankeeu'], rows: PHOTO_TOOL_ROWS, note: COMPARISON_NOTE },
    related: [['/uk-wedding-photo-sharing', 'UK wedding photo sharing'], ...RELATED.photos.slice(0, 3)],
  },
  'qr-code-for-wedding-photos': {
    path: '/qr-code-for-wedding-photos',
    breadcrumb: 'QR Code for Wedding Photos',
    title: 'QR Code for Wedding Photos: Guests Upload Instantly | Thankeeu',
    description: 'Get a QR code for wedding photos so every guest uploads to a live shared wall. Print it on table cards, no app needed. From $3.15.',
    keywords: 'QR code for wedding photos, wedding photo QR code, QR code wedding guest photos, wedding QR code photo sharing, table card QR code wedding',
    tagline: 'QR code for wedding photos',
    h1Lead: 'One QR code on the tables,',
    h1Accent: 'every guest’s wedding photos.',
    subtitle: 'Thankeeu gives you a QR code for wedding photos, ready to print. Guests scan it with their phone camera and their photos show up on your live wall, along with wishes, voice notes and a gift for the couple.',
    comparison: { columns: ['QR photo tools', 'Thankeeu'], rows: PHOTO_TOOL_ROWS, note: COMPARISON_NOTE },
    faqs: [
      { q: 'How do I get a QR code for wedding guest photos?', a: 'Make your wedding card on Thankeeu and switch on the Live Memory Wall. Thankeeu gives you a QR code ready to print for table cards, the welcome sign or the photo booth.' },
      { q: 'Where should I put the QR code at my wedding?', a: 'On every table, on the welcome sign at the entrance, at the bar and in the photo booth. The more places guests see it, the more photos you get.' },
      { q: 'Can I show the photos live on a screen?', a: 'Yes. Open the Memory Wall on a TV or projector at the reception and photos appear as guests share them.' },
      { q: 'How much does it cost?', a: 'Making the card and collecting uploads is free. You pay a small fee once, when you send the finished card, from $3.15. No subscription and no charge per photo.' },
      DEFAULT_FAQS[1],
    ],
    related: [...RELATED.photos.filter(([h]) => h !== '/qr-code-for-wedding-photos'), ...RELATED.compare.slice(0, 1)],
  },
  'wedding-memory-wall': {
    path: '/wedding-memory-wall',
    breadcrumb: 'Wedding Memory Wall',
    title: 'Wedding Memory Wall: Live Guest Photo Wall by QR Code | Thankeeu',
    description: 'A wedding memory wall guests fill by QR code, with no app or account. Photos appear live on the venue screen, with wishes and voice notes.',
    keywords: 'wedding memory wall, wedding live photo wall, wedding photo wall QR code, live photo wall wedding reception, wedding guest photo sharing, wedding photo sharing no app',
    tagline: 'Live Memory Wall™ for weddings',
    h1Lead: 'A live wedding photo wall',
    h1Accent: 'your guests fill as the night goes on.',
    subtitle: 'Guests scan the QR code and their photos, videos and wishes appear on the big screen at your reception as they share them. Afterwards they stay on the couple’s card for good.',
    comparison: { columns: ['Photo walls', 'Thankeeu'], rows: PHOTO_TOOL_ROWS, note: COMPARISON_NOTE },
    related: [...RELATED.photos.filter(([h]) => h !== '/wedding-memory-wall'), ['/live-memory-wall', 'Live Memory Wall for any event']],
  },
  // ── Comparisons ───────────────────────────────────────────────────────────
  'best-wedding-photo-sharing-app': {
    path: '/best-wedding-photo-sharing-app',
    breadcrumb: 'Best Wedding Photo Sharing App',
    title: 'Best Wedding Photo Sharing Apps Compared: Honest Guide | Thankeeu',
    description: 'The best wedding photo sharing app? GuestPix, WedUploader, Wedtrove and Thankeeu compared. Only one also collects wishes, voice notes and a gift.',
    keywords: 'best wedding photo sharing app, best app to share wedding photos, wedding photo sharing app comparison, GuestPix vs Thankeeu, WedUploader vs Thankeeu, Wedtrove vs Thankeeu',
    tagline: 'Wedding photo sharing apps compared',
    h1Lead: 'The best wedding photo sharing app',
    h1Accent: 'for couples who want more than photos.',
    subtitle: 'GuestPix, WedUploader, Wedtrove and Thankeeu all let guests upload photos. If photos are all you need, any of them will do. If you also want the wishes, the voices and the gift, only one does that.',
    comparison: { title: 'Wedding photo sharing apps compared', columns: ['GuestPix', 'WedUploader', 'Wedtrove', 'Thankeeu'], rows: [
      ['Guests upload photos by QR code', true, true, true, true],
      ['No app for guests', true, true, true, true],
      ['Written wishes from guests', false, false, false, true],
      ['Voice note blessings', false, false, false, true],
      ['Wedding gift pot', false, false, false, true],
      ['Automatic Memory Movie™', false, false, false, true],
    ], note: COMPARISON_NOTE },
    useCasesTitle: 'What to look for in a wedding photo app',
    related: RELATED.compare.filter(([h]) => h !== '/best-wedding-photo-sharing-app').concat(RELATED.photos.slice(0, 2)),
  },
  'thankeeu-vs-wedtrove': {
    path: '/thankeeu-vs-wedtrove',
    breadcrumb: 'Thankeeu vs Wedtrove',
    breadcrumbParents: [{ name: 'Wedding cards', url: '/occasions/wedding' }],
    title: 'Thankeeu vs Wedtrove: Which Is Better for Wedding Guest Photos?',
    description: 'Thankeeu vs Wedtrove for wedding guest photos. Both collect photos by QR code. Thankeeu also takes wishes, voice notes and a gift, and makes a Memory Movie.',
    keywords: 'thankeeu vs wedtrove, wedtrove alternative, wedtrove review, wedding photo sharing comparison, wedtrove vs, better than wedtrove',
    tagline: 'Thankeeu vs Wedtrove',
    h1Lead: 'Thankeeu vs Wedtrove',
    h1Accent: 'for your wedding memories.',
    subtitle: 'Both collect guest photos by QR code and both show them live at the venue. The difference: Thankeeu also collects every guest’s wishes, voice notes and a wedding gift, and turns it all into a Memory Movie™.',
    comparison: { title: 'Thankeeu vs Wedtrove', columns: ['Wedtrove', 'Thankeeu'], rows: [
      ['Guests upload photos by QR code', true, true], ['No app or account for guests', true, true], ['Live display on venue screens', true, true],
      ['Written wishes from guests', false, true], ['Voice note blessings', false, true], ['Wedding gift pot', false, true],
      ['Automatic Memory Movie™', false, true], ['Photo wall and group card in one link', false, true],
    ], note: COMPARISON_NOTE },
    useCasesTitle: 'Why couples pick Thankeeu over Wedtrove',
    faqs: [
      { q: 'Is Wedtrove free?', a: 'Wedtrove lists a free tier with limits and paid plans for more. Thankeeu is free to make and share. You pay only when you send the finished card, from $3.15.' },
      { q: 'Can Wedtrove collect gift money from guests?', a: 'Not from what its public features show. It focuses on photos. Thankeeu puts guest photos, written wishes, voice notes and a pooled gift in one link.' },
      { q: 'Does Wedtrove make a wedding video?', a: 'Its focus is the photo album. Thankeeu turns every message, photo and voice note into a Memory Movie™ for you.' },
      { q: 'Which has the better live photo wall?', a: 'Both show photos live on a venue screen. On Thankeeu the wall is part of the wedding card, so the same link also collects wishes and gifts.' },
      DEFAULT_FAQS[1],
    ],
    related: RELATED.compare.filter(([h]) => h !== '/thankeeu-vs-wedtrove').concat(RELATED.photos.slice(0, 1)),
  },
  'guestpix-alternative': alt('GuestPix', '/guestpix-alternative',
    'GuestPix is good at collecting guest photos. Thankeeu collects the photos and everything around them: the written wishes, the voice notes from grandparents and a wedding gift pot. Then it makes a Memory Movie™ from all of it.',
    { 'No app or account for guests': true, 'Live photo wall at the venue': true },
    [
      { q: 'What makes Thankeeu a GuestPix alternative?', a: 'Both collect wedding guest photos by QR code. Thankeeu also collects written wishes, voice notes, videos and a pooled wedding gift in the same link, and makes a Memory Movie™ from all of it.' },
      { q: 'Do guests need an app with Thankeeu?', a: 'No. Guests scan the QR code or tap the link and upload in their phone’s browser. No app, no account.' },
      { q: 'Can I show photos live at the reception?', a: 'Yes. Open the Live Memory Wall™ on a TV or projector and photos appear as guests share them.' },
      DEFAULT_FAQS[0], DEFAULT_FAQS[2],
    ]),
  'kululu-alternative': alt('Kululu', '/kululu-alternative',
    'Kululu gathers photos at the event. Thankeeu gathers the photos plus what people actually say: written wishes, voice blessings and a wedding gift pot, all in one link. Then it makes a Memory Movie™ from it.',
    { 'No app or account for guests': true, 'Live photo wall at the venue': true },
    [
      { q: 'Why look for a Kululu alternative?', a: 'If you want more than a photo collection, such as guests’ written wishes, voice notes and a wedding gift pot next to the photos, Thankeeu puts it all in one link.' },
      { q: 'Does Thankeeu work without an app?', a: 'Yes. Guests scan a QR code and add photos, wishes and voice notes in their phone’s browser.' },
      { q: 'Can guests give a cash gift?', a: 'Yes. Guests can chip in to a pooled wedding gift when they sign, from any country, and the couple withdraws it to their bank.' },
      DEFAULT_FAQS[4], DEFAULT_FAQS[0],
    ]),
  'pov-alternative': alt('POV', '/pov-alternative',
    'POV turns guests into photographers with a disposable camera feel. Thankeeu gets their photos too, plus their wishes, voice notes and a wedding gift, and keeps it all for good in one card for the couple.',
    { 'Guests upload photos by QR code': true, 'No app or account for guests': 'Some' },
    [
      { q: 'What is the difference between POV and Thankeeu?', a: 'POV focuses on disposable camera style photos from guests. Thankeeu collects photos plus written wishes, voice notes, videos and a pooled gift, and turns it all into a Memory Movie™.' },
      { q: 'Do guests need to install anything for Thankeeu?', a: 'No. Everything works in the phone’s browser after they scan your QR code.' },
      DEFAULT_FAQS[3], DEFAULT_FAQS[0], DEFAULT_FAQS[2],
    ]),
  'guestcam-alternative': alt('GuestCam', '/guestcam-alternative',
    'GuestCam gives guests a camera. Thankeeu gives them a voice as well: photos, written wishes, voice blessings and a wedding gift pot, all from one QR code and all kept in one card for the couple.',
    { 'Guests upload photos by QR code': true },
    [
      { q: 'Why choose Thankeeu over GuestCam?', a: 'If you want guests’ wishes, voice notes and a wedding gift next to their photos, and a Memory Movie™ made for you afterwards, Thankeeu does it all from one link.' },
      { q: 'Is there a live photo wall?', a: 'Yes. The Live Memory Wall™ shows photos and wishes on a venue screen as guests share them.' },
      DEFAULT_FAQS[1], DEFAULT_FAQS[0], DEFAULT_FAQS[2],
    ]),
  'weduploader-alternative': alt('WedUploader', '/weduploader-alternative',
    'WedUploader is built to get guests’ photos and videos uploaded. Thankeeu does that too, and also collects their wishes, voice blessings and a wedding gift pot. Then it makes a Memory Movie™ from everything.',
    { 'No app or account for guests': true },
    [
      { q: 'What makes Thankeeu a WedUploader alternative?', a: 'Both collect guest photos and videos. Thankeeu also collects written wishes, voice notes and a pooled wedding gift in the same link, and makes a Memory Movie™ from all of it.' },
      { q: 'Does Thankeeu handle wedding videos as well as photos?', a: 'Yes. Guests can add short videos from their phones next to their photos and messages.' },
      DEFAULT_FAQS[1], DEFAULT_FAQS[0], DEFAULT_FAQS[3],
    ]),
};


// ── Page-specific FAQs (2026-09-30) ───────────────────────────────────────
// Every page answers its own questions; no FAQ block is shared across pages.
const PAGE_FAQS = {
  'wedding-photo-sharing-app': [
    { q: 'Do wedding guests need to download a photo sharing app?', a: 'No. Thankeeu runs in the phone’s web browser. Guests scan your QR code or tap the link and upload photos straight away. Nothing to install and no account to make.' },
    { q: 'Does it work on both iPhone and Android?', a: 'Yes. Any phone with a camera and a web browser can scan the QR code and upload: iPhone, Android or tablet.' },
    { q: 'Can guests share photos before and after the wedding?', a: 'Yes. Share the link early for photos from getting ready and travelling, and again after the day for anything guests find in their camera roll later.' },
    { q: 'How much does the wedding photo sharing app cost?', a: 'Making your wedding card and collecting uploads is free. You pay a small fee once, when you send the finished card, from $3.15. No subscription and no charge per photo.' },
  ],
  'wedding-photo-upload-app': [
    { q: 'How do guests upload wedding photos from their phone?', a: 'They scan the QR code with their camera or tap your link, pick photos or videos from their camera roll and tap send. It takes a few seconds.' },
    { q: 'Can guests upload videos as well as photos?', a: 'Yes. Guests can upload short video clips with their photos, and add a written message or voice note if they like.' },
    { q: 'What if the venue has poor signal?', a: 'Guests can upload whenever they’re back on signal or wifi. The link keeps working after the wedding, so nothing gets lost.' },
    { q: 'Is there a limit on how many guests can upload?', a: 'No. Every guest can upload from the same link or QR code.' },
  ],
  'collect-wedding-guest-photos': [
    { q: 'What’s the easiest way to collect photos from wedding guests?', a: 'Share one link, plus a QR code at the venue, where every guest can upload from their phone. It’s far quicker than asking each guest in group chats after the wedding.' },
    { q: 'When should I share the photo link with guests?', a: 'Before the wedding in your invitations or on your website, on the day with QR codes on the tables, and once more afterwards in your thank you message.' },
    { q: 'Can guests add a message with their photos?', a: 'Yes. Each guest can add a written message or a voice note with their photos, so you hear the story behind each shot.' },
    { q: 'Do guests need an account?', a: 'No. Guests upload straight from their phone’s browser without signing up.' },
  ],
  'wedding-guest-photo-collection': [
    { q: 'How do I gather guests’ photos without chasing everyone?', a: 'Put a QR code on every table and at the bar. Guests upload while they already have their phones out at the wedding, so you don’t have to ask each person afterwards.' },
    { q: 'Where should the QR code go at the venue?', a: 'On each table, on the welcome sign, at the bar and in the photo booth. The more places guests see it, the more photos you get.' },
    { q: 'Can guests who left early still add photos?', a: 'Yes. The same link works after the wedding, so guests can add photos from home.' },
    { q: 'What does it cost?', a: 'Making the card and collecting uploads is free. You pay a small fee once, when you send the finished card, from $3.15.' },
  ],
  'wedding-photo-gallery': [
    { q: 'Can the wedding photo gallery be shown on a screen at the reception?', a: 'Yes. Open the Live Memory Wall™ on a TV or projector and guest photos appear as they’re uploaded.' },
    { q: 'How do guests add photos to the gallery?', a: 'They scan your QR code or open your link and upload from their phone. No app, no account.' },
    { q: 'What happens to the gallery after the wedding?', a: 'It stays on the couple’s wedding card with every message and voice note, and becomes part of the Memory Movie™.' },
    { q: 'Can we share the gallery with family who couldn’t attend?', a: 'Yes. Anyone with the link can view it and add to it from anywhere.' },
  ],
  'wedding-photo-album-online': [
    { q: 'What is a shared online wedding album?', a: 'An album every guest adds their own photos to, from their phone. You see the day from every angle, not only the photographer’s.' },
    { q: 'Does a guest album replace our photographer?', a: 'No, use both. The photographer gets the key moments looking their best. Guests get the candid moments the photographer never sees.' },
    { q: 'Can guests add captions or messages?', a: 'Yes. Guests can add a message or voice note with their photos.' },
    { q: 'Do guests need to sign up?', a: 'No. They upload straight from their phone’s browser.' },
  ],
  'wedding-memory-book': [
    { q: 'What is a digital wedding memory book?', a: 'A keepsake every guest adds to, with messages, photos, voice notes and videos. The couple gets it as one card, and a Memory Movie™ is made from it.' },
    { q: 'How is it different from a printed memory book?', a: 'There’s nothing to design, chase or print. Guests add their own pages from their phones, and it can hold voices and video as well as words and photos.' },
    { q: 'Can guests contribute before the wedding?', a: 'Yes. Share the link early so friends and family can add messages and old photos before the day.' },
    { q: 'How much does a wedding memory book cost?', a: 'Making it and collecting contributions is free. You pay a small fee once, when you send it, from $3.15.' },
  ],
  'uk-wedding-photo-sharing': [
    { q: 'Does it work at UK venues with poor signal?', a: 'Yes. Guests can upload on the venue wifi, or later from home. The link keeps working after the wedding.' },
    { q: 'Can guests give a wedding gift in pounds?', a: 'Yes. Guests can give to the wedding gift by card in GBP when they upload or sign.' },
    { q: 'Does it replace our wedding photographer?', a: 'No. It works alongside them and collects the candid photos your guests take.' },
    { q: 'Do guests need an app?', a: 'No. Guests scan a QR code and upload from their phone’s browser.' },
  ],
  'usa-wedding-photo-sharing': [
    { q: 'Can guests upload photos from the rehearsal dinner too?', a: 'Yes. Share the link before the wedding and guests can add photos from the rehearsal dinner and from getting ready.' },
    { q: 'Can guests give a wedding gift in USD?', a: 'Yes. Guests can give to the wedding gift by card in USD when they upload or sign.' },
    { q: 'Does it work alongside our photographer and videographer?', a: 'Yes. It collects the candid guest photos they can’t be there for.' },
    { q: 'Do guests need to download anything?', a: 'No. Guests scan a QR code and upload from their phone’s browser.' },
  ],
  'best-wedding-photo-sharing-app': [
    { q: 'What is the best wedding photo sharing app?', a: 'It depends on what you want. For photos only, dedicated uploaders like GuestPix, WedUploader and Wedtrove work well. If you also want guests’ messages, voice notes and a wedding gift in the same link, Thankeeu does all of that.' },
    { q: 'Is there a wedding photo app that needs no download?', a: 'Yes. Thankeeu and several others run in the phone’s browser. Guests scan a QR code and upload without installing anything.' },
    { q: 'Which wedding photo app makes a video from the photos?', a: 'Thankeeu turns guests’ photos, messages and voice notes into a Memory Movie™ for you.' },
    { q: 'How did you compare the apps?', a: 'We compared publicly listed features: guest uploads, access without an app, live display, messages, voice notes, gifts and keepsakes. Check each product’s website for current plans and prices.' },
  ],
  'wedding-voice-note-guest-book': [
    { q: 'What is a voice note guest book?', a: 'An audio guest book where guests record a spoken message for the couple. On Thankeeu they record it on their own phone, so there’s no rented handset and no queue.' },
    { q: 'How long can a voice note be?', a: 'Long enough for a proper toast or blessing. Each note is saved on the card next to the guest’s written message and photos.' },
    { q: 'Can elderly relatives record one?', a: 'Yes. They scan the QR code, tap the microphone and talk. No app and no account.' },
    { q: 'Can guests who couldn’t attend record a message?', a: 'Yes. Send them the link and they can record from anywhere, before or after the wedding.' },
  ],
  'wedding-video-message-book': [
    { q: 'How do guests send a video message?', a: 'They open the link or scan the QR code, then record or upload a short clip from their phone. No app and no account.' },
    { q: 'Can guests who couldn’t attend send a video?', a: 'Yes. Share the link before or after the day and anyone, anywhere, can add a video wish.' },
    { q: 'Are the videos turned into a film?', a: 'Yes. Every video, photo and message goes into the couple’s Memory Movie™.' },
    { q: 'Can guests write a message instead?', a: 'Yes. Guests can write, record a voice note or add photos if they’d rather not be on camera.' },
  ],
  'guestpix-alternative': [
    { q: 'What makes Thankeeu a GuestPix alternative?', a: 'Both collect wedding guest photos by QR code. Thankeeu also collects written wishes, voice notes, videos and a pooled wedding gift in the same link, and makes a Memory Movie™ from all of it.' },
    { q: 'Do guests need an app with Thankeeu?', a: 'No. Guests scan the QR code or tap the link and upload in their phone’s browser. No app, no account.' },
    { q: 'Can I show photos live at the reception?', a: 'Yes. Open the Live Memory Wall™ on a TV or projector and photos appear as guests share them.' },
    { q: 'Is GuestPix or Thankeeu cheaper?', a: 'They charge in different ways, so check GuestPix’s current plans. Thankeeu is free to make and collect uploads, with a single fee from $3.15 when you send the card.' },
  ],
  'kululu-alternative': [
    { q: 'Why look for a Kululu alternative?', a: 'If you want more than a photo collection, such as guests’ written wishes, voice notes and a wedding gift next to the photos, Thankeeu puts it all in one link.' },
    { q: 'Does Thankeeu work without an app?', a: 'Yes. Guests scan a QR code and add photos, wishes and voice notes in their phone’s browser.' },
    { q: 'Can guests give a cash gift?', a: 'Yes. Guests can chip in to a pooled wedding gift when they sign, from any country, and the couple withdraws it to their bank.' },
    { q: 'Does Thankeeu make a wedding video?', a: 'Yes. Every photo, video, message and voice note is turned into a Memory Movie™ with music.' },
  ],
  'pov-alternative': [
    { q: 'What is the difference between POV and Thankeeu?', a: 'POV focuses on disposable camera style photos from guests. Thankeeu collects photos plus written wishes, voice notes, videos and a pooled gift, and turns it all into a Memory Movie™.' },
    { q: 'Do guests need to install anything for Thankeeu?', a: 'No. Everything works in the phone’s browser after they scan your QR code.' },
    { q: 'Can guests who aren’t at the wedding take part?', a: 'Yes. Anyone with the link can add photos, messages and voice notes from wherever they are.' },
    { q: 'Can we collect a wedding gift too?', a: 'Yes. Guests can give to a wedding gift from the same link they use to upload.' },
  ],
  'guestcam-alternative': [
    { q: 'Why choose Thankeeu over GuestCam?', a: 'If you want guests’ wishes, voice notes and a wedding gift next to their photos, and a Memory Movie™ made for you afterwards, Thankeeu does it all from one link.' },
    { q: 'Is there a live photo wall?', a: 'Yes. The Live Memory Wall™ shows photos and wishes on a venue screen as guests share them.' },
    { q: 'Can I send the link on WhatsApp?', a: 'Yes. The link opens on any phone without an app, so it works well in WhatsApp invitations.' },
    { q: 'Do guests have to sign up to take part?', a: 'No. Guests upload photos and leave wishes without making an account.' },
  ],
  'weduploader-alternative': [
    { q: 'What makes Thankeeu a WedUploader alternative?', a: 'Both collect guest photos and videos. Thankeeu also collects written wishes, voice notes and a pooled wedding gift in the same link, and makes a Memory Movie™ from all of it.' },
    { q: 'Can guests add wedding videos with Thankeeu, not only photos?', a: 'Yes. Guests can add short videos from their phones next to their photos and messages.' },
    { q: 'Can grandparents use it without help?', a: 'Usually, yes. Scan the QR code, tap upload, choose a photo. No passwords and no app stores.' },
    { q: 'Can guests who couldn’t attend contribute?', a: 'Yes. Anyone with the link can upload and write a message from anywhere.' },
  ],
};
Object.entries(PAGE_FAQS).forEach(([k, faqs]) => { PAGES[k].faqs = faqs; });
// The generic feature list is shown on the homepage; landing pages use their
// own article instead, so it is not repeated across 25 URLs.
WEDDING_DEFAULTS.useCases = [];

// ── Search continuity (2026-09-30) ─────────────────────────────────────────
// Titles, H1 wording, descriptions and FAQs these URLs ranked with before the
// homepage-layout redesign, restored so Google sees the same page topic.
// Only inaccurate claims were changed (no Naira/Stripe/ZIP/2025).
export const SEARCH_CONTINUITY = {
  "occasions-wedding": {
    "title": "Wedding Congratulations Group Cards: Sign as a Team, Gift Together | Thankeeu",
    "description": "A wedding congratulations group card from everyone. Family, friends and colleagues add their best wishes, and you pool a wedding gift together.",
    "h1Lead": "Celebrate love",
    "h1Accent": "from everyone who matters."
  },
  "wedding-group-card": {
    "title": "Wedding Group Card: Everyone Signs, Messages, Photos & Gifts | Thankeeu",
    "description": "Make a wedding group card that everyone signs. Guests leave messages, photos, voice notes and gift money, all in one card. Free to create.",
    "h1Lead": "A Wedding Group Card",
    "h1Accent": "Signed by Everyone Who Loves Them",
    "faqs": [
      {
        "q": "What is a wedding group card?",
        "a": "A wedding group card is a digital card the whole wedding party and all the guests sign together. Everyone leaves a personal message, photo or voice note, and the couple gets it as one combined gift."
      },
      {
        "q": "How many people can sign a wedding group card?",
        "a": "As many as you like. There’s no cap on signers, so a wedding of 500 guests can all add to the same card."
      },
      {
        "q": "Can I add a gift collection to the wedding group card?",
        "a": "Yes. A Thankeeu wedding card holds messages, photos, voice notes and a pooled cash gift in one link. Guests can add any or all of these."
      },
      {
        "q": "Can the wedding group card include photos?",
        "a": "Yes. Every guest can attach a photo or video to their message. The card keeps everything together, and after the wedding Thankeeu puts it all into a Memory Movie."
      },
      {
        "q": "Is the wedding group card free?",
        "a": "Making the card and collecting signatures is free. You pay only when you deliver the finished card to the couple."
      }
    ]
  },
  "online-wedding-guestbook": {
    "title": "Online Wedding Guestbook: Messages, Photos & Voice Notes | Thankeeu",
    "description": "An online wedding guestbook that holds more than paper. Guests write messages, upload photos, record voice notes and give gifts from their phone.",
    "h1Lead": "Replace the Paper Guestbook",
    "h1Accent": "With One That Captures Everything",
    "faqs": [
      {
        "q": "What is an online wedding guestbook?",
        "a": "An online wedding guestbook is a page where guests leave their wishes, photos and memories for the couple. A paper book can’t hold photos, voice notes or videos. This can, and it never gets lost or damaged."
      },
      {
        "q": "How do guests sign an online guestbook?",
        "a": "You share a link or QR code with your guests. They open it on their phone, write a message, add a photo or voice note and tap submit. It takes less than a minute and needs no account."
      },
      {
        "q": "Can I use Thankeeu as a guestbook at the reception?",
        "a": "Yes. Put your QR code at a signing table, on each table or at the entrance. Guests sign on their own phones as they arrive, during cocktail hour or at their tables."
      },
      {
        "q": "Can I add the online guestbook to my wedding website?",
        "a": "Yes. Share the Thankeeu link on your wedding website, in your invitations and in your WhatsApp groups. Guests can open it on any device."
      },
      {
        "q": "Is an online guestbook cheaper than a paper one?",
        "a": "Yes. Thankeeu is free to start and you pay only when you send the finished card. No printing costs, no personalised books to order and no running out of pages."
      }
    ]
  },
  "digital-wedding-guest-book": {
    "title": "Digital Wedding Guest Book: Messages, Photos & Voice Notes | Thankeeu",
    "description": "A digital wedding guest book for messages, voice notes, photos and videos from every guest. Guests sign on any device, no app needed.",
    "h1Lead": "A Digital Wedding Guest Book",
    "h1Accent": "That Captures More Than Words",
    "faqs": [
      {
        "q": "What is a digital wedding guest book?",
        "a": "A digital wedding guest book is the paper guest book moved online, where guests leave messages and memories. On Thankeeu, guests write messages, record voice notes, upload photos and videos, and give to the gift pot, all in one card."
      },
      {
        "q": "How does a digital guest book work?",
        "a": "You make your wedding card on Thankeeu and share the link or QR code with guests. They open it on any device, leave a message or upload photos, and the couple gets everything together when the card is delivered."
      },
      {
        "q": "Can I print my digital wedding guest book?",
        "a": "Thankeeu is built for screens first. Every message, photo and video stays on the card, so you can print your favourites whenever you like. The Memory Movie™ also gives you a video version of what every guest shared."
      },
      {
        "q": "Is a digital guest book better than a paper one?",
        "a": "For most couples, yes. A digital guest book holds photos and videos as well as text, never gets damaged or lost, can be shared with family anywhere in the world, and arrives tidy in one place after the wedding."
      },
      {
        "q": "Can guests who couldn't attend sign the digital guest book?",
        "a": "Yes. Anyone with the link can add to it: guests who couldn’t come, family overseas, or friends sending their wishes from far away."
      }
    ]
  },
  "wedding-memory-wall": {
    "title": "Wedding Guest Photo Sharing: Collect Every Photo with a QR Code | Thankeeu",
    "description": "Wedding guest photo sharing with one QR code. Guests upload photos and videos with no app or account, and they show live on the reception screen.",
    "h1Lead": "Collect Every Wedding Guest’s Photos",
    "h1Accent": "With One QR Code, No App Needed",
    "faqs": [
      {
        "q": "How do wedding guests share photos without downloading an app?",
        "a": "Guests scan your QR code, printed on table cards, welcome signs or the order of service, or tap the link you share in the invite. They upload photos and videos from their phone in seconds. No app, no account, no fuss. It works on iPhone, Android and any other device."
      },
      {
        "q": "How is Thankeeu different from Wedtrove or Chivent for wedding photos?",
        "a": "Wedtrove and Chivent focus on collecting photos. Thankeeu’s Live Memory Wall™ lives inside your wedding group card, so guests write messages, add voice notes, upload photos and videos, and give to the gift pot in one place. Every photo and message also goes into a Wedding Memory Movie™."
      },
      {
        "q": "Can we display the wedding photos live on a screen at the reception?",
        "a": "Yes. Open the Memory Wall on a TV, projector or laptop at your venue. As guests upload, their photos appear live, and the whole room watches the slideshow build."
      },
      {
        "q": "Do wedding photos disappear after the event?",
        "a": "No. Instagram Stories vanish and some apps only keep photos for 30 to 90 days. Every photo and video on your Thankeeu wedding memory wall is kept permanently. Browse, download and share them years later."
      },
      {
        "q": "Can we collect photos from guests who could not attend?",
        "a": "Yes. Anyone with the link can add to it: guests who watched the livestream, family who couldn’t travel, or friends sending their love from across the country or the world."
      },
      {
        "q": "Does it automatically create a wedding video from guest photos?",
        "a": "Yes. After the wedding, Thankeeu puts every message, photo and video into a Wedding Memory Movie™. It’s your wedding film, made by everyone who loves you."
      },
      {
        "q": "How many guests can upload photos?",
        "a": "All of them. There’s no cap on contributors, so a wedding with 500 guests can all upload from the same link."
      }
    ]
  },
  "qr-code-for-wedding-photos": {
    "title": "QR Code for Wedding Photos: Let Guests Upload Instantly | Thankeeu",
    "description": "A QR code for wedding photos, so every guest uploads to a live shared wall. Print it on table cards or a welcome sign. No app needed.",
    "h1Lead": "One QR code.",
    "h1Accent": "Every guest’s photo. Instantly.",
    "faqs": [
      {
        "q": "How do I create a QR code for wedding guest photos?",
        "a": "Make your wedding card on Thankeeu and switch on the Live Memory Wall. Thankeeu gives you a QR code ready to print straight away. Put it on table cards, the welcome sign or in the photo booth. Guests scan it and upload from their phone camera. No app, no account."
      },
      {
        "q": "Do guests need to download an app or create an account?",
        "a": "No. They scan the QR code with any phone camera, tap the link, and they’re uploading photos in under 10 seconds. It works on every phone and for guests of every age, including the ones who find technology hard."
      },
      {
        "q": "Can I display the live photo wall on a screen at the venue?",
        "a": "Yes. Open the Memory Wall link on any device plugged into a TV or projector at your reception. Photos appear on screen the moment guests upload them. Couples love starting the reception with a wall that’s already filling up."
      },
      {
        "q": "Where should I display the QR code at my wedding?",
        "a": "The spots that work best: each reception table, the welcome sign at the entrance, the bar and inside the photo booth. The more places guests see it, the more photos you get."
      },
      {
        "q": "What happens to the photos after the wedding?",
        "a": "Every photo stays saved in your Thankeeu wedding card, so you can look through them any time. Thankeeu also turns them into a Memory Movie™, a film made by everyone who was there."
      },
      {
        "q": "Can guests also write messages and contribute to a gift?",
        "a": "Yes, and that’s what sets Thankeeu apart from basic QR photo tools. Guests can upload photos, write messages, record voice notes and give to a pooled wedding gift, all from the same link."
      },
      {
        "q": "How much does a QR code photo wall for a wedding cost?",
        "a": "Making the card and collecting uploads is free. You pay a small fee once, when you’re ready to send the finished card to the couple, from $3.15 USD. No subscription and no charge per photo."
      }
    ]
  },
  "wedding-photo-sharing-app": {
    "title": "Wedding Photo Sharing App: Collect Guest Photos with QR Code | Thankeeu",
    "description": "The wedding photo sharing app guests actually use. They scan a QR code and upload photos with no download and no account. Plus messages and a gift.",
    "h1Lead": "The Wedding Photo Sharing App",
    "h1Accent": "Guests Actually Use"
  },
  "thankeeu-vs-wedtrove": {
    "title": "Thankeeu vs Wedtrove: Which Is Better for Wedding Guest Photos?",
    "description": "Thankeeu vs Wedtrove, compared honestly for wedding guest photos. Both collect photos by QR code. Thankeeu also takes messages, voice notes and gifts.",
    "h1Lead": "Thankeeu vs Wedtrove",
    "h1Accent": "",
    "faqs": [
      {
        "q": "Is Wedtrove free?",
        "a": "Wedtrove lists a free tier with limits and paid plans for more, so check its website for current prices. Thankeeu is free to make and share. You pay only when you send the finished card, from $3.15."
      },
      {
        "q": "Which is better when guests are spread across countries: Wedtrove or Thankeeu?",
        "a": "Both work in a phone browser, so guests anywhere can upload photos. Thankeeu also lets guests write messages, record voice notes and give to a wedding gift by card from any country, all from the same link."
      },
      {
        "q": "Can Wedtrove collect gift money from wedding guests?",
        "a": "Not from what its public features show. Wedtrove focuses on collecting photos. Thankeeu puts guest photo uploads, written messages, voice notes and a pooled gift in a single link."
      },
      {
        "q": "Does Wedtrove create a wedding video from photos?",
        "a": "Wedtrove focuses on the photo album. Thankeeu puts every message, photo and video into a Memory Movie™ the couple keeps for good."
      },
      {
        "q": "How does Thankeeu compare to Wedtrove for the live photo wall?",
        "a": "Both offer a live display for venue screens. The main difference: on Thankeeu the live wall is one part of a full wedding card, so guests also write messages and give to a gift from the same link."
      }
    ]
  },
  "best-wedding-photo-sharing-app": {
    "title": "Best Wedding Photo Sharing App: Honest Comparison | Thankeeu",
    "description": "Looking for the best wedding photo sharing app? GuestPix, WedUploader, Wedtrove and Thankeeu side by side: photos, messages, voice notes and gifts.",
    "h1Lead": "The Best Wedding Photo Sharing App",
    "h1Accent": "Honest Comparison"
  },
  "wedding-cash-gift-platform": {
    "title": "Wedding Cash Gift Platform: Pool Gifts in USD, GBP & More | Thankeeu",
    "description": "A wedding cash gift platform: pool gifts from guests along with their messages and photos. Guests give in seconds from any country, no account needed.",
    "h1Lead": "A Wedding Gift Pot",
    "h1Accent": "Guests Actually Use",
    "faqs": [
      {
        "q": "How do guests contribute cash gifts on Thankeeu?",
        "a": "Guests open the wedding card link, go to the gift section, pick an amount and pay by card. The money goes into one pot for the couple."
      },
      {
        "q": "Is it safe to collect cash gifts online through Thankeeu?",
        "a": "Yes. Payments go through Flutterwave, a regulated, PCI DSS compliant payment provider used by thousands of businesses. Card details never touch Thankeeu’s servers."
      },
      {
        "q": "Can guests in other countries contribute?",
        "a": "Yes. Guests can give by card from anywhere in the world, and they see every fee before they pay."
      },
      {
        "q": "When does the couple receive the gift funds?",
        "a": "The couple asks for a withdrawal after the wedding card is delivered, and the pooled gift is paid into their bank account."
      },
      {
        "q": "Can guests contribute both a message and a cash gift?",
        "a": "Yes, that’s what makes Thankeeu different. Guests write a message, add photos or a voice note, and give to the gift in one go. The couple gets everything together."
      }
    ]
  },
  "collect-wedding-guest-photos": {
    "title": "Collect Wedding Guest Photos: One Link, Every Memory | Thankeeu",
    "description": "Collect wedding guest photos in one place. Share a single link or QR code and guests upload with no app. You also get messages, voice notes and a gift.",
    "h1Lead": "Collect Every Guest’s Photos",
    "h1Accent": "From One Shared Link"
  },
  "wedding-guest-photo-collection": {
    "title": "Wedding Guest Photo Collection: Gather Every Shot in One Place | Thankeeu",
    "description": "Wedding guest photo collection that runs itself. Put a QR code up at the venue and guests scan and upload without downloading anything.",
    "h1Lead": "Gather Every Guest’s Photos",
    "h1Accent": "Without Asking Each Person Individually"
  },
  "wedding-memory-book": {
    "title": "Wedding Memory Book: Collect Every Message, Photo & Video | Thankeeu",
    "description": "A wedding memory book with messages, photos, voice notes and videos from every guest, made into a Memory Movie after the wedding.",
    "h1Lead": "A Wedding Memory Book",
    "h1Accent": "Built by Everyone Who Was There"
  },
  "wedding-photo-album-online": {
    "title": "Online Wedding Photo Album: Shared by Every Guest | Thankeeu",
    "description": "An online wedding photo album every guest adds to. Guests upload photos by QR code with no app to download. Plus messages and a gift pot.",
    "h1Lead": "An Online Wedding Photo Album",
    "h1Accent": "Curated by 200 Different Guests"
  },
  "wedding-photo-gallery": {
    "title": "Wedding Photo Gallery: Share & Collect Guest Photos Online | Thankeeu",
    "description": "A shared online wedding photo gallery. Guests upload photos by QR code, no app needed, and the gallery fills up live during the reception.",
    "h1Lead": "A Shared Wedding Photo Gallery",
    "h1Accent": "That Fills Itself During the Reception"
  },
  "wedding-photo-upload-app": {
    "title": "Wedding Photo Upload App: Let Guests Upload Directly from Their Phones | Thankeeu",
    "description": "A wedding photo upload app that needs no download. Guests scan a QR code and their photos go straight from their phone into your wedding gallery.",
    "h1Lead": "Let Every Guest Upload Photos",
    "h1Accent": "Straight from Their Phone"
  },
  "wedding-video-message-book": {
    "title": "Wedding Video Message Book: Collect Video Wishes from Every Guest | Thankeeu",
    "description": "A wedding video message book for wishes from every guest. Guests record or upload a short clip from their phone. No app needed.",
    "h1Lead": "Collect Video Messages",
    "h1Accent": "From Every Guest at Your Wedding"
  },
  "wedding-voice-note-guest-book": {
    "title": "Wedding Voice Note Guest Book: Hear Every Guest's Blessing | Thankeeu",
    "description": "A wedding voice note guest book inside your wedding card. Guests record blessings on their phone with no app, and you hear each one in their own voice.",
    "h1Lead": "Hear Every Guest’s Blessing",
    "h1Accent": "In Their Own Voice"
  },
  "uk-wedding-photo-sharing": {
    "title": "Wedding Photo Sharing UK: Collect Guest Photos at Your British Wedding | Thankeeu",
    "description": "Wedding photo sharing for UK couples. Guests upload photos by QR code with no app, and can give a gift in GBP. Works alongside your photographer.",
    "h1Lead": "Wedding Photo Sharing for UK Couples",
    "h1Accent": "Collect Every Guest’s Shot in GBP"
  },
  "usa-wedding-photo-sharing": {
    "title": "Wedding Photo Sharing USA: Collect Guest Photos at Your American Wedding | Thankeeu",
    "description": "Wedding photo sharing for US couples. Guests upload photos by QR code with nothing to download, and can give a gift in USD. Works with your photographer.",
    "h1Lead": "Wedding Photo Sharing for US Couples",
    "h1Accent": "Your Guests Have Thousands of Photos"
  },
  "guestpix-alternative": {
    "title": "The Best GuestPix Alternative for Wedding Guest Photo Sharing | Thankeeu",
    "description": "Looking for a GuestPix alternative? Thankeeu collects wedding photos, videos, voice notes, wishes and cash gifts in one place. No app needed.",
    "h1Lead": "The Best GuestPix Alternative",
    "h1Accent": "for Wedding Guest Photo Sharing"
  },
  "kululu-alternative": {
    "title": "The Best Kululu Alternative for Wedding Guest Photo Sharing | Thankeeu",
    "description": "Looking for a Kululu alternative? Thankeeu does more than photo uploads. Collect voice notes, videos, written wishes and cash gifts in one place.",
    "h1Lead": "The Best Kululu Alternative",
    "h1Accent": "for Wedding Guest Photo Sharing"
  },
  "pov-alternative": {
    "title": "The Best POV Alternative for Wedding Guest Photo Sharing | Thankeeu",
    "description": "Looking for a POV wedding app alternative? Thankeeu collects photos, videos, voice notes, wishes and cash gifts in one place for the couple.",
    "h1Lead": "The Best POV Alternative",
    "h1Accent": "for Wedding Guest Photo Sharing"
  },
  "guestcam-alternative": {
    "title": "The Best GuestCam Alternative for Wedding Guest Photo Sharing | Thankeeu",
    "description": "Looking for a GuestCam alternative? Thankeeu collects photos, videos, voice notes, wishes and cash gifts from every wedding guest by QR code.",
    "h1Lead": "The Best GuestCam Alternative",
    "h1Accent": "for Wedding Guest Photo Sharing"
  },
  "weduploader-alternative": {
    "title": "The Best WedUploader Alternative for Wedding Guest Photo Sharing | Thankeeu",
    "description": "Looking for a WedUploader alternative? Thankeeu collects wedding photos, videos, voice notes, wishes and cash gifts in one place. No app needed.",
    "h1Lead": "The Best WedUploader Alternative",
    "h1Accent": "for Wedding Guest Photo Sharing"
  }
};

/** Full landing config for a wedding page: defaults + the page's own copy. */
export const weddingLanding = (key) => {
  const page = PAGES[key];
  if (!page) throw new Error(`Unknown wedding landing: ${key}`);
  return { ...WEDDING_DEFAULTS, ...page, ...(SEARCH_CONTINUITY[key] || {}) };
};

export const WEDDING_LANDING_KEYS = Object.keys(PAGES);
