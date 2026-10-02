# Occasion × country landing pages: writing brief

Each file in `pages/` exports `default [ ...pages ]`. One object per page,
keyed by the manifest key (see `manifest.js` for the URL, language, and what
each variant targets). The worked example is `farewell-uk-a` in
`pages/farewell-1.js`. Match its depth and shape, never its sentences.

Check your file with:

    cd frontend && ONLY=<file name without .js> npx vitest run src/tests/occasion-landings.test.js

## Page object

```js
{
  key: 'birthday-us-b',
  title: '... | Thankeeu',          // 35 to 65 chars incl. " | Thankeeu". Primary keyword first.
  description: '...',               // 130 to 160 chars. Keyword + benefit + reason to click.
  keywords: 'a, b, c, ...',         // 8 to 14 real search phrases, country specific
  breadcrumb: '...',                // short page name
  tagline: '...',                   // eyebrow above the H1, a few words
  h1: '...',                        // max 80 chars, contains the main keyword naturally
  subtitle: '...',                  // 2 or 3 sentences
  heroAlbums: [ album, album, album ],   // see below
  highlights: [[title, text] x4],   // short strip under the hero
  coversTitle, coversIntro,         // above 12 sample covers (covers are added automatically)
  stepsTitle, steps: [[title, text] x4],
  featuresTitle, featuresIntro, features: [[Icon, title, text] x6],
  sections: [{ h2, paragraphs: [2 to 3], items?: [[title, text]] } x3 or more],
  messagesTitle, messagesIntro, messages: [8 to 10 example card messages],
  pricingIntro,                     // one paragraph before the live price table
  comparisonIntro,                  // one paragraph before the competitor table
  faqs: [{ q, a } x12 or more],
  ctaTitle, ctaText,
}
```

The template adds by itself: the 12 cover samples, the live price table in the
country's currency, the competitor comparison table, the internal links (all
other pages of the same country, the same page in other countries, blog posts)
and all schema markup. Do not write those.

### Hero albums

Three albums, like the homepage. The first album has 4 signers, the other two
have 2 or 3.

```js
{
  recipient: 'Ifeoma',              // first name (or "Ana and Luis" for couples); unique across ALL pages, see your letters
  label: 'Birthday',                // occasion word in the page language
  cover: 'birthday/b1-cake',        // '<occasion>/<stem>' from the list below
  gift: { amount: '$340', claimLine: 'one sentence' } | null,   // first album usually has a gift; amount in the country's money
  signers: [
    { name: 'Dana R.', role: 'Payroll, Ohio', text: 'max 150 chars, page language',
      media: { kind: 'gif', gif: 'party' } },
    // or { kind: 'photo', photo: 'team', caption: 'short' }
    // or { kind: 'voice', length: 8 to 14, gif: 'love', line: 'what the voice note says, page language' }
  ],
}
```

GIF keys: party, clap, love, dance, confetti, hug, cake.
Photo keys: team, picnic, party, celebration, couple.
Every album needs a mix: at least one voice note in the first album, one photo somewhere.

Cover stems (use these exact strings):

- leaving: 3t-farewell-legend, 3l-teary-cat, fw3-airplane, 3n-new-door, mc-fw4-mountain, 3s-rainbow, fw1-moving-box, ar-fw7-watercolour-corners, fw10-map-pin, mc-fw7-compass, 3r-signpost, ad-fw5-road-trip, 3m-suitcase, 3o-blast-off, ar-fw5-painted-pattern, mc-fw6-door, 3k-paper-plane, ad-fw10-cheers, ar-fw10-watercolour-garland, 3p-keep-growing, 3q-coffee-buddy, mc-fw8-bird, ad-fw8-mountain, fw2-road-trip
- birthday: b1-cake, 2a-cake, b2-balloons, b3-gift, mc-bd2-balloons, ad-bd2-rocket, b5-party-hat, bd3-crown, ar-bd3-watercolour-wreath, b10-birthday-star, mc-bd10-cheers, 2b-balloons, ad-bd7-surf, ar-bd10-watercolour-corners, b4-cupcake, bd2-presents, b6-donut, mc-bd9-party, ad-bd1-cake, b7-ice-cream, b8-popper, ar-bd5-painted-pattern, ad-bd6-balloons, b9-party-cat
- baby_shower: bs7-booties, bs3-bottle, bs2-rattle, bs5-stork, mc-bs6-heart-balloons, bs16-bear, ad-bs3-rattle, bs24-twinkle, ar-bs9-painted-pattern, bs11-elephant, mc-bs7-star, bs4-pram, bs23-cloud-nine, ad-bs7-rainbow, ar-bs7-watercolour-garland, bs31-baby-love, mc-bs4-booties, bs6-duck, ad-bs4-onesie, bs8-pacifier, bs9-mobile
- anniversary (couples): a1-rings, a3-mugs, a10-cheers, a2-lovebirds, mc-an9-bouquet, a4-penguins, a5-lock, ad-an9-map, ar-an3-watercolour-wreath, a7-calendar, mc-an1-rings, a8-two-plants, ad-an7-mugs, ar-an6-linocut, an1-heart-chain, a9-heart-balloons, ad-an8-lovebirds, a6-heart-balloon, ar-an8-painted-scene-sunset, an2-socks, ad-an10-cheers, ar-an5-painted-pattern, an3-shakers
- congratulations (good for work anniversaries): c4-fireworks, c1-trophy, c8-popper, c10-champagne, mc-cg5-star, c9-star, c2-medal, ad-cg6-medal, c5-rocket, cg1-podium, ar-cg6-linocut, mc-cg4-fireworks, cg3-big-tick, ad-cg3-stairs, cg2-shooting-star, c3-rosette, ad-cg1-trophy, mc-cg3-rosette, c6-mountain
- thank_you: ty1-big-heart, ty9-letter, ty2-sunflower, ty19-cloud-nine, ty11-trophy, mc-ty5-latte, ad-ty1-team-mvp, ty12-star, ar-ty10-watercolour-corners, ty16-rainbow, ty20-bouquet, mc-ty4-gift, ad-ty4-rocket, ty17-balloons, ty3-bee, ty4-owl, mc-ty3-star, ty6-latte, mc-ty7-trophy, ty7-melon

Use three different covers per page. Group card pages should mix occasions
(for example a leaving, a birthday and a thank you album).

Feature icons (only these): Users, Wallet, Mic, Video, Clock, Film, Lock, Globe,
Gift, Image, QrCode, Calendar, Smartphone, Share2, Download, Sparkles,
MessageCircle, Shield, Star, Briefcase, Cake, Baby, Award, PenLine, Send, Camera,
Music, Heart, Mail, Bell, Building2, Repeat.

## Hard rules (the test enforces most of them)

1. **No hyphens or dashes anywhere in the copy.** Not "e-card" (write "ecard"),
   not "sign-up" (write "sign up"), not "co-workers" (write "coworkers"), not
   "last-minute" (write "last minute"), no en or em dashes. Rewrite the sentence.
2. **No emojis.**
3. **No stock filler.** Banned: seamless, elevate, unleash, game changer, delve,
   tapestry, effortless, look no further, whether you're, cutting edge,
   revolutionise, embark, treasure trove, "in today's digital world". Write like
   a sharp human marketer who knows the country: concrete, specific, warm, plain.
4. **Prices:** the only money amounts allowed in copy are $3.15 (one card),
   $5.67 (two cards), $12.60 (pack of five) and, on UK pages only, £2.45. They
   are swapped for today's live price on screen. Never convert prices into
   local money in the copy: the page shows a live price table in the local
   currency right after `pricingIntro`. (Hero gift totals are exempt.)
5. **Every page is unique.** Different angle, different examples, different
   FAQs, different sentences, also between the two variants of one country and
   between the same occasion in different countries. The test fails if two
   pages share 20% of their three word phrases. Do not reuse sentence frames
   across your pages.
6. **Length:** at least 1,400 words of copy per page (aim for 1,600 to 2,000).
7. **Country fit:** money, spelling (British for UK, Mauritius; American for US
   and Philippines; Canadian for Canada), workplace habits, holidays, time
   zones, cities, names and phrases that people in that country actually use.
   Be accurate: no invented statistics, no invented laws, no invented customers
   or reviews, no fake quotes. Hero signers are clearly sample card content.
8. **Local language pages** (`lang` de, nl, es, fr in the manifest): write the whole
   page in natural German, Dutch or Colombian Spanish (titles, FAQs, hero signer
   messages, everything). Keywords in that language too.
9. **Internal links in copy** are optional and use `[anchor](/path)`. Only link
   to paths in `manifest.js` or these: /pricing, /sample, /memory-movie,
   /live-memory-wall, /online-group-card, /cards/leaving-card,
   /occasions/farewell, /occasions/birthday, /occasions/anniversary,
   /cards/baby-shower, /cards/maternity-leave, /birthday-memory-wall,
   /retirement-cards-uk (UK only), /birthday-cards-uk (UK only),
   /online-group-cards-uk, /online-group-cards-us, /online-group-cards-canada.
   One to three links per page, placed where they help.
10. **FAQs:** at least 12, specific to the page's search intent and country.
    Answer directly in the first sentence. Include the questions people really
    type into Google for that keyword in that country.

## What is true about Thankeeu (only claim these)

- One link; anyone can sign from a phone or laptop; **no account or app needed to sign**. Unlimited signers on every card.
- Signers add a written message plus photos, GIFs, **video** and **voice notes**. Messages can be marked **private** (only the recipient sees them). People can write in any language. The app itself is in English.
- 650+ illustrated cover designs across birthday, leaving, retirement, thank you, get well, congratulations, anniversary, wedding, sympathy, Christmas, baby shower, graduation. The recipient's name goes on the cover. The card opens as a book whose pages flip.
- **Scheduled delivery** to the minute, in the recipient's time zone, by email; or share the card link yourself.
- **Group gift (gift pot):** signers chip in any amount by card when they sign; the total builds on the card; the recipient claims it to their bank account or as a digital gift card. Contributions are paid in GBP, EUR, CAD or USD (USD for countries whose currency cannot be charged, such as Mauritius, the Philippines, Colombia and Australia). Fees are shown before paying. Do not name specific gift card brands or banks.
- **Memory Movie**: every card is turned into a short film (MP4 with music) from the messages, photos and voice notes. **Live Memory Wall**: guests at an event scan a QR code and their photos appear on a screen, no app needed. **PDF download** of the card.
- The recipient can reply to individual signers. The organiser sees who has signed.
- **Price:** free to create and collect messages; you pay once when you send it: $3.15 for one card, $5.67 for two, $12.60 for a pack of five (credits never expire). No subscription for individuals. Pay by Visa, Mastercard or American Express; international cards can also pay with Apple Pay, Google Pay or PayPal.
- **Thankeeu for Teams:** a company plan that automates birthday and work anniversary cards for every employee, imports staff from HR systems, gives a company workspace. (Do not state its price.)
- Competitors (facts from their own pricing pages, October 2026, USD): Kudoboard single boards $6.99 (Lite, up to 20 posts), $9.99 (Premium, video), $19.99 (Milestone, unlimited posts, slideshow); Thankbox $5.99 Classic, $9.99 Premium (video, voice notes, slideshow), gift collection with a fee per contribution; GroupGreeting $5.99 a card, packs down to $3.99 a card, gift cards from merchants. Be fair: describe them accurately and without insults; explain where Thankeeu is better (price, voice notes and video on every card, cash gift pot, Memory Movie, live photo wall, credits never expire).
