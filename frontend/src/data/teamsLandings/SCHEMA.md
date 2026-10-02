# Thankeeu for Teams pages: writing brief

Audience: HR managers, people and culture leads, office managers, founders and
team leads. Goal: they book a demo (/business) or create a free company
account (/company/signup). Each country has two pages with different search
intent (see `manifest.js`):

- `a`: recognition platform or software (commercial, "employee recognition
  platform", "staff recognition platform", "employee recognition software").
- `b`: automated birthday, work anniversary and leaving cards for staff (the
  occasion led searches a small brand can win). Germany `b` is in German.

Read the occasion brief too (`../occasionLandings/SCHEMA.md`): the hard rules
there apply here exactly (no hyphens or dashes, no emojis, no stock filler,
real covers and GIF and photo keys, page language, unique wording, no invented
facts, statistics, customers, reviews or quotes).

Check with: `cd frontend && ONLY=<country> npx vitest run src/tests/teams-landings.test.js`

## Page object

```js
{
  key: 'teams-us-a',
  title, description, keywords, breadcrumb, tagline, h1, subtitle,   // same limits as occasion pages
  heroAlbums: [3 albums],         // workplace cards: a birthday, a farewell or leaving, a work anniversary (congratulations or thank_you covers); first album 4 signers incl. a voice note
  proof: [[title, text] x4],      // short strip under the hero (what HR gets)
  problemTitle, problemIntro, problems: [[title, text] x3],      // what goes wrong today without a system
  automationTitle, automationIntro, automations: [[Icon, title, text] x6],
  integrationsIntro,              // one paragraph; the HR system list is shown automatically
  featuresTitle, featuresIntro, features: [[Icon, title, text] x6],
  sections: [{ h2, paragraphs: [2 to 3], items? } x3 or more],   // country HR context
  rolloutTitle, rollout: [[title, text] x4],                     // how a company rolls it out in a week
  pricingIntro, comparisonIntro,
  faqs: [{ q, a } x14 or more],
  ctaTitle, ctaText,
}
```

The template adds: both call to action buttons, the HR system list, 12 card
covers, the live price table (standard rate per employee in the local
currency, team size examples, yearly with 2 months free, free company account),
the competitor comparison table, internal links, schema markup.

## What is true about Thankeeu for Teams (only claim these)

- **Free company account.** Cards created from a company account have no card fee. Anyone with the link signs, no account or app needed. Messages, photos, GIFs, video, voice notes, private messages.
- **Teams plan (paid):** standard rate per employee per month (shown live on the page; never write the amount), billed monthly or yearly with 2 months free. Larger organisations get a tailored quote. A free pilot (14 or 30 days) is available on request through a demo. No setup fee is charged (do not claim anything else about contracts).
- **Automated cards notify colleagues** by email with the signing link: the person's department or the whole company, depending on the occasion's setting. Automated cards are delivered at the scheduled time; do NOT claim delivery in each recipient's own time zone for automated cards, and do NOT claim employees can opt out or be excluded.
- **Automations:** once the team is imported, birthdays, work anniversaries and new hire welcomes are created automatically from each person's profile, plus company wide moments such as International Women's Day, Workers' Day, Valentine's Day, Mother's Day and Father's Day. The card is sent to the person's inbox at the chosen time. Farewells, retirements, promotions, baby showers, get well and sympathy cards are started in a couple of clicks.
- **HR systems:** imports and syncs from Personio, HiBob, BambooHR, Rippling, Gusto, Deel, Zoho People, SeamlessHR and WorkPay, or a spreadsheet import. Re-sync any time.
- **Company workspace** on its own address (yourcompany.thankeeu.com) where HR admins and employees see and sign the company's cards. Team members get an invite by email.
- **HR dashboard:** who signed, upcoming occasions, activity log, analytics. Yearly plan adds priority support, custom email branding, a dedicated account manager, advanced birthday analytics and data export.
- **Group gift pot:** colleagues chip in by card; the recipient claims it to their bank or as a digital gift card. Contributions in GBP, EUR, CAD or USD (USD where the local currency cannot be charged, e.g. Mauritius).
- **Memory Movie** on every card (a short film with music from messages, photos and voice notes). **Live Memory Wall** for events: photos via QR code on a screen. PDF download.
- **Do NOT claim:** SSO, SOC 2, ISO certification, GDPR or DSGVO compliance or data residency, Slack or Microsoft Teams integrations, points or rewards catalogs, specific customers, ratings, number of companies. You may say people can share the signing link in Slack, Teams, email or WhatsApp.
- Competitors (from their own pricing pages, October 2026; be accurate and fair): Bonusly $5 per user per month Team plan, free up to 8 users, points and rewards catalog, automation and HRIS on Team plan, no group cards. Kudoboard Business from $299 a year for 1 to 50 employees, group cards yes, birthday automation and HRIS only on Enterprise. Assembly $3 per user per month (Empower, yearly), milestones, rewards catalog. Thankbox for Teams from 19 a month billed yearly (flat, £/€/$), automatic birthday and anniversary cards, gift collection with a fee per contribution, HR system sync not stated. Applauz (Canada) $3.75 per licence per month or $12 per celebration, rewards marketplace. Reward Gateway (UK) £8 per employee per month or from £6 yearly. Workhuman, Achievers, Nectar: quote only. Positioning: points platforms reward with points; card tools miss automation and HR sync below enterprise; Thankeeu combines group cards, automation, HR sync and a cash gift pot at a low per employee price.
- Money in copy: write NO prices at all (no $, £, €, Rs amounts). The live price table shows them.

## Keyword targets (use naturally in title, H1, headings, FAQs)

- US a: employee recognition platform, employee recognition software, employee appreciation platform, peer recognition, Bonusly alternative, Kudoboard alternative, employee recognition program.
- US b: automated birthday cards for employees, employee birthday automation, work anniversary cards for employees, coworker farewell card, group card for coworker, employee milestone celebrations.
- UK a: staff recognition platform, employee recognition platform UK, reward and recognition platform, staff appreciation ideas, Thankbox alternative, colleague recognition.
- UK b: staff birthday cards, colleague birthday card, online leaving card for colleague, group leaving card, work anniversary card UK, automated staff birthday reminders.
- Canada a: employee recognition software Canada, employee recognition platform, Applauz alternative, staff appreciation Canada, logiciel de reconnaissance des employés (one mention).
- Canada b: work anniversary automation, employee birthday cards Canada, service anniversary card, farewell card for coworker Canada, carte de départ collègue (one mention).
- Germany a (English): employee recognition software Germany, employee appreciation tool, team recognition for international teams in Germany, Personio birthdays.
- Germany b (German): Mitarbeiterwertschätzung Tool, Mitarbeiteranerkennung, Mitarbeiter Geburtstage automatisch, Geburtstagskarte Kollegen digital, Dienstjubiläum Karte, Abschiedskarte Kollegen digital, Personio Geburtstage.
- Mauritius a: employee recognition Mauritius, staff appreciation Mauritius, HR recognition tool, employee engagement Mauritius, reconnaissance des employés (one mention).
- Mauritius b: staff celebration software, staff birthday cards Mauritius, farewell card colleague Mauritius, work anniversary card, carte d'anniversaire collègue (one mention).
