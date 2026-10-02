// Thankeeu for Teams pages: mauritius. See ../SCHEMA.md.
const A = {
  key: 'teams-mauritius-a',
  title: 'Employee Recognition Mauritius: Cards, HR Sync | Thankeeu',
  description: 'Employee recognition in Mauritius for HR teams in Port Louis and Ebene. Automatic birthday and anniversary cards, HR sync and a team gift pot paid in USD.',
  keywords: 'employee recognition Mauritius, staff appreciation Mauritius, HR recognition tool, employee engagement Mauritius, reconnaissance des employés, employee recognition platform Mauritius, staff recognition Ebene, Bonusly alternative Mauritius, Kudoboard alternative, Thankbox alternative, employee appreciation Port Louis',
  breadcrumb: 'Employee recognition Mauritius',
  tagline: 'For HR teams across Mauritius',
  h1: 'Employee recognition in Mauritius that remembers every person on your payroll',
  subtitle: 'Your people work in English, French and Kreol, cover clients from Paris to Johannesburg to Sydney, and celebrate festivals from every community on the island. Thankeeu for Teams turns that busy calendar into cards that arrive on time, signed by the whole team, without HR keeping a spreadsheet of birthdays.',
  heroAlbums: [
    {
      recipient: 'Kreshna', label: 'Birthday', cover: 'birthday/bd3-crown',
      gift: { amount: '$180', claimLine: 'Kreshna claims the pot to his bank or as a digital gift card, no envelope passed round the floor.' },
      signers: [
        { name: 'Anoushka P.', role: 'Payroll, Ebene', text: 'Joyeux anniversaire Kreshna! The month end close is calmer with you in the room. Have a lovely day off.', media: { kind: 'gif', gif: 'cake' } },
        { name: 'Jean Marc L.', role: 'Client services, Port Louis', text: 'Bonne fête mon frère! Dinner at Caudan is on the team this Friday, no excuses.', media: { kind: 'photo', photo: 'team', caption: 'Team lunch, Caudan' } },
        { name: 'Sheetal R.', role: 'Funds team, Ebene', text: 'Recorded this between two London calls.', media: { kind: 'voice', length: 11, gif: 'love', line: 'Kreshna, happy birthday! Thank you for always explaining the reconciliations twice without sighing. Enjoy every minute.' } },
        { name: 'Olivier T.', role: 'Team lead, Moka', text: 'Another year of you being the calmest person on the floor. Happy birthday from the whole Moka office.', media: { kind: 'gif', gif: 'party' } },
      ],
    },
    {
      recipient: 'Noella', label: 'Farewell', cover: 'leaving/mc-fw7-compass', gift: null,
      signers: [
        { name: 'Yashvin D.', role: 'Front office, Flic en Flac', text: 'Nine seasons and not one guest complaint about your welcome. The lobby will miss you, Noella.', media: { kind: 'gif', gif: 'hug' } },
        { name: 'Karine A.', role: 'Housekeeping, Belle Mare', text: 'Bonne continuation! Come back and visit us when you are settled in Réunion.', media: { kind: 'photo', photo: 'celebration', caption: 'Staff party, December' } },
      ],
    },
    {
      recipient: 'Faizal', label: 'Work anniversary', cover: 'congratulations/cg1-podium', gift: null,
      signers: [
        { name: 'Melissa C.', role: 'HR, Port Louis', text: 'Ten years with the bank, Faizal. Thank you for every branch you helped open and every new joiner you trained.', media: { kind: 'gif', gif: 'clap' } },
        { name: 'Rohan B.', role: 'Retail banking, Curepipe', text: 'You taught me how to talk to customers properly. Here is to the next ten years.', media: { kind: 'voice', length: 9, gif: 'confetti', line: 'Faizal, congratulations on ten years. Curepipe branch is proud of you, enjoy the celebration.' } },
        { name: 'Aurelie M.', role: 'Compliance', text: 'A decade of patience and good humour. Congratulations from the whole compliance team.', media: { kind: 'gif', gif: 'confetti' } },
      ],
    },
  ],
  proof: [
    ['Every occasion on time', 'Birthdays and work anniversaries come from each profile and go out on the day, every year.'],
    ['Signed in any language', 'Colleagues write in English, French or Kreol. The card keeps every word as they wrote it.'],
    ['Gift pot in US dollars', 'Teammates chip in by card in USD, because our payment provider cannot charge MUR yet.'],
    ['Free to start', 'A free company account makes team cards with no card fee. Upgrade when you want automation.'],
  ],
  problemTitle: 'Why staff appreciation in Mauritius slips through the cracks',
  problemIntro: 'Most HR teams on the island care about recognition. The trouble is that the calendar is crowded, the workforce is spread across shifts and sites, and the reminders live in one person’s head.',
  problems: [
    ['Birthdays found out at lunchtime', 'Someone notices a colleague’s birthday on Facebook at noon, a card is bought at the Jumbo near the office and half the team has gone home before it reaches them.'],
    ['Shift workers never sign', 'Hotel teams, contact centre agents on night cover and branch staff in Rose Hill or Goodlands rarely see the card that sits on a desk in head office.'],
    ['Collections that go nowhere', 'Cash envelopes for a leaving gift move from floor to floor, nobody knows the total, and the person collecting it is out of pocket by the end of the week.'],
  ],
  automationTitle: 'Recognition that runs while HR gets on with the rest',
  automationIntro: 'Import your team once. From then on Thankeeu creates each card, emails the signing link to their department or the whole company, and sends it to the recipient’s inbox at the time you chose.',
  automations: [
    ['Cake', 'Birthdays', 'Every birthday on your HR records becomes a card that the team signs in the days before and the person opens on the morning itself.'],
    ['Award', 'Work anniversaries', 'One year, five years, twenty years with the group. Service milestones are picked up from the start date with no manual tracking.'],
    ['Users', 'New hire welcomes', 'A welcome card is started for each joiner so the first week in Ebene or at the resort begins with messages from the people they will work with.'],
    ['Calendar', 'Company wide moments', 'International Women’s Day, Workers’ Day on 1 May, Valentine’s Day, Mother’s Day and Father’s Day can each go out to the whole company.'],
    ['Briefcase', 'Farewells and retirements', 'When someone resigns, moves abroad or retires after decades in the sugar estate offices, start the card in a couple of clicks.'],
    ['Heart', 'Promotions, babies and harder days', 'Promotions, baby showers, get well wishes and sympathy cards are ready when HR needs them, in the same workspace.'],
  ],
  integrationsIntro: 'Many Mauritian employers run payroll on local software and keep people data in an international HR system, especially global business companies with parents in Europe or South Africa. Thankeeu syncs from the HR systems below, and if your records sit in a spreadsheet exported from local payroll, upload that instead. Resync whenever people join or leave.',
  featuresTitle: 'What an HR recognition tool for Mauritius should actually do',
  featuresIntro: 'Recognition here has to work for a bilingual head office, a hotel housekeeping team and a remote analyst serving clients in Europe, all at once.',
  features: [
    ['Globe', 'Built for multilingual teams', 'Messages can be written in English, French, Kreol, Hindi or any language your people use. The app itself is in English.'],
    ['Smartphone', 'No app, no login to sign', 'Anyone with the link signs from their phone, so staff without a company laptop are part of it too. Share it on WhatsApp, email, Slack or Teams.'],
    ['Wallet', 'A gift pot that works from Mauritius', 'Colleagues contribute by card in USD. The recipient claims the total to their bank account or as a digital gift card.'],
    ['Mic', 'Voice notes and video', 'A Kreol voice note from the kitchen brigade often says more than a typed line. Every card takes voice, video, photos and GIFs.'],
    ['Building2', 'Your own company workspace', 'Employees open yourcompany.thankeeu.com to see and sign the company’s cards. Invites arrive by email.'],
    ['Film', 'Memory Movie on every card', 'Each card becomes a short film with music from the messages, photos and voice notes, ready to play at the leaving drinks.'],
  ],
  sections: [
    {
      h2: 'Employee engagement in Mauritius: what is different here',
      paragraphs: [
        'Mauritian workplaces mix communities, languages and working hours more than most. A team in Ebene Cybercity can include a fund accountant who grew up in Vacoas, a French expatriate manager and a new graduate from the University of Mauritius, all speaking a different mix of English, French and Kreol across a single meeting. Recognition that only works in one language, or only reaches people at their desks, leaves somebody out.',
        'The calendar is full too. Thaipoosam Cavadee, Maha Shivaratree, Chinese Spring Festival, Eid ul Fitr, Ganesh Chaturthi, Divali, Assumption and Christmas all sit alongside Independence Day on 12 March and the Abolition of Slavery on 1 February. HR teams already plan around those dates. Personal moments like birthdays and service anniversaries are the ones that tend to get lost in between.',
        'Thankeeu takes those personal dates off the HR to do list. The festivals stay yours to mark as you always have, and the individual milestones go out automatically, so nobody’s birthday is missed because it landed the week after Divali.',
      ],
    },
    {
      h2: 'Recognition for offshore, BPO and global business teams',
      paragraphs: [
        'A large part of the island’s professional workforce serves clients elsewhere. Management companies administer funds for investors in Europe and Asia, BPO and contact centres in Ebene and Port Louis support customers in France, Belgium and the UK, and software teams ship for companies they have never visited. Hours follow the client, so the day shift and the evening shift may barely overlap.',
        'An online card fits that pattern. The link stays open for days, people sign when their shift allows, and the card arrives at the minute you schedule. The French account team signs at lunch, the late shift signs at midnight, and the person still opens one card from everybody.',
      ],
      items: [
        ['Global business and management companies', 'Recognise long serving administrators and the analysts who carry year end, without HR keeping a separate list.'],
        ['BPO and contact centres', 'Shift teams sign from their phones between calls, and team leaders see who has signed on the HR dashboard.'],
        ['Hotels and hospitality groups', 'Housekeeping, kitchen and front office staff across several resorts can all sign one farewell card.'],
        ['Banks and insurers', 'Branch networks from Grand Baie to Mahebourg share one card for a retiring manager.'],
      ],
    },
    {
      h2: 'Reconnaissance des employés, in the language your team uses',
      paragraphs: [
        'Many Mauritian HR leaders search in French as often as in English, and reconnaissance des employés means the same thing in both: noticing people, by name, at the moments that matter to them. Thankeeu cards accept any language, so a French speaking manager, a Kreol speaking supervisor and an English speaking client lead can all write in the way that feels natural.',
        'That matters most in teams where English is the working language on paper and French or Kreol is the language of the corridor. People write warmer messages in the language they think in.',
      ],
    },
    {
      h2: 'Why payments are in US dollars from Mauritius',
      paragraphs: [
        'Online payments in Mauritian rupees are not supported by our card processor yet, so the Teams plan is charged in US dollars and gift pot contributions are paid in USD.',
        'The live price table below shows the rupee figures at today’s exchange rate as a guide, so finance can see roughly what each team size costs before it is charged in dollars.',
      ],
    },
  ],
  rolloutTitle: 'Rolling out staff appreciation in Mauritius in one week',
  rollout: [
    ['Day 1: book a demo or create the account', 'We walk you through the workspace and set up a free pilot if you would like to test it with one department first.'],
    ['Day 2: bring your people in', 'Sync from your HR system or upload a spreadsheet with names, emails, birthdays and start dates.'],
    ['Days 3 to 4: choose what runs automatically', 'Turn on birthdays, work anniversaries and new hire welcomes, set send times, and pick which company wide moments to include.'],
    ['Day 5: tell the team', 'Employees get an email invite to the workspace. Share the link in your WhatsApp groups so shift teams can sign from their phones.'],
  ],
  pricingIntro: 'Thankeeu for Teams is priced per employee per month, and paying yearly gives you two months free. Because our payment provider cannot charge MUR yet, the plan is billed in US dollars; the table shows rupee amounts at today’s rate so you can budget. Larger organisations, such as hotel groups or banks with several hundred staff, can ask for a tailored quote.',
  comparisonIntro: 'Bonusly, Kudoboard and Thankbox for Teams are all solid choices with different strengths. Bonusly is a points and rewards platform with automation and HR sync on its Team plan, but no group cards. Kudoboard makes good group boards, with birthday automation and HR sync on its Enterprise plan. Thankbox for Teams automates birthday and anniversary cards for a flat yearly fee, with a fee on each gift contribution. Here is how they line up for a Mauritian team.',
  faqs: [
    { q: 'What is the best employee recognition tool in Mauritius?', a: 'The best one is the tool your whole workforce can actually use, including shift staff without laptops. Thankeeu for Teams works from a link on any phone, accepts messages in any language and runs birthdays and work anniversaries automatically from your HR data.' },
    { q: 'Can we pay in Mauritian rupees?', a: 'No, because our payment provider cannot charge MUR yet, the plan and gift pot contributions are paid in US dollars. The price table shows rupee figures at today’s rate as a guide.' },
    { q: 'Do our employees need to download an app?', a: 'No. Colleagues sign from a link in their browser, with no account and no app, which is why it suits hotel and contact centre staff who mostly use their phones.' },
    { q: 'Can people write in French or Kreol?', a: 'Yes. Signers can write in English, French, Kreol or any other language, and the card shows their words exactly. The Thankeeu interface itself is in English.' },
    { q: 'Which HR systems does Thankeeu connect to?', a: 'Personio, HiBob, BambooHR, Rippling, Gusto, Deel, Zoho People, WorkPay and others shown on this page. If your data lives in local payroll software, export a spreadsheet and import that.' },
    { q: 'How do automatic birthday cards work for staff in Mauritius?', a: 'Once your team is imported, Thankeeu creates a card for each birthday, emails the signing link to their department or the whole company and sends it to the person’s inbox at the time you chose on the day.' },
    { q: 'Can we mark public holidays like Divali or Eid with Thankeeu?', a: 'Company wide moments such as Workers’ Day, International Women’s Day, Mother’s Day and Father’s Day are built in. For community festivals you can start a company card yourself in a couple of clicks whenever you want to send one.' },
    { q: 'Is there a free option?', a: 'Yes. A free company account lets you create team cards with no card fee for any occasion. The paid Teams plan adds automation, HR sync and the full dashboard.' },
    { q: 'Can we try it before committing?', a: 'Yes. Book a demo and ask for a free pilot of 14 or 30 days, for example with one department or one hotel.' },
    { q: 'Is there a setup fee?', a: 'No setup fee is charged. You pay the per employee rate on the plan you choose, monthly or yearly.' },
    { q: 'How does the group gift pot work from Mauritius?', a: 'Colleagues chip in by card in USD when they sign. The recipient claims the total to their bank account or as a digital gift card.' },
    { q: 'Is Thankeeu a Bonusly alternative for Mauritian companies?', a: 'It is a different approach. Bonusly rewards people with points for a catalog; Thankeeu focuses on group cards, automatic milestones, HR sync and a cash gift pot.' },
    { q: 'What does HR see on the dashboard?', a: 'Who has signed each card, upcoming birthdays and anniversaries, an activity log and analytics. The yearly plan adds advanced birthday analytics and data export.' },
    { q: 'Can a card be played at a farewell event?', a: 'Yes. Every card becomes a Memory Movie with music, and the Live Memory Wall lets guests at the event scan a QR code and see their photos appear on a screen.' },
    { q: 'Does it work for teams spread across time zones?', a: 'Yes. A colleague seconded to Johannesburg or working remotely from France signs from the same link whatever their time zone, and the card arrives at the time you schedule.' },
  ],
  ctaTitle: 'Bring every Mauritian milestone into one place',
  ctaText: 'Book a demo to see your own team in the workspace, or create a free company account and send your first card today.',
};

const B = {
  key: 'teams-mauritius-b',
  title: 'Staff Celebration Software Mauritius: Auto Cards | Thankeeu',
  description: 'Staff celebration software for Mauritius: birthday cards, work anniversary cards and farewell cards that colleagues sign from one link and HR never forgets.',
  keywords: 'staff celebration software, staff birthday cards Mauritius, farewell card colleague Mauritius, work anniversary card, carte d\'anniversaire collègue, automated birthday cards Mauritius, online leaving card Mauritius, group card for colleague Mauritius, employee birthday reminder, service anniversary card Mauritius',
  breadcrumb: 'Staff celebration software Mauritius',
  tagline: 'Birthdays, anniversaries and farewells',
  h1: 'Staff celebration software for Mauritius: birthday, anniversary and farewell cards',
  subtitle: 'Set the dates once and let the cards look after themselves. Every colleague gets a birthday card signed by their team, every service milestone is noticed, and when someone leaves for Réunion, Dubai or Melbourne, the whole floor gets to say goodbye.',
  heroAlbums: [
    {
      recipient: 'Shabnam', label: 'Birthday', cover: 'birthday/ar-bd3-watercolour-wreath',
      gift: { amount: '$145', claimLine: 'Shabnam picks her bank account or a digital gift card for the team pot.' },
      signers: [
        { name: 'Vikash G.', role: 'Contact centre, Ebene', text: 'Happy birthday to the only person who can calm a French customer at 7pm on a Friday. We are lucky to have you.', media: { kind: 'gif', gif: 'party' } },
        { name: 'Stephanie R.', role: 'Quality team, Rose Hill', text: 'Joyeux anniversaire ma belle! Gâteaux piments are waiting in the break room.', media: { kind: 'photo', photo: 'party', caption: 'Break room, Rose Hill' } },
        { name: 'Ashwin N.', role: 'Night shift lead', text: 'Signed from the night shift, with love.', media: { kind: 'voice', length: 13, gif: 'love', line: 'Shabnam, happy birthday from all of us on nights. Eat too much cake and do not answer a single email today.' } },
        { name: 'Laura F.', role: 'Account manager, Lyon', text: 'Happy birthday from the client side in Lyon. Thank you for always being one step ahead.', media: { kind: 'gif', gif: 'confetti' } },
      ],
    },
    {
      recipient: 'Ludovic', label: 'Work anniversary', cover: 'thank_you/ad-ty1-team-mvp', gift: null,
      signers: [
        { name: 'Priyanka S.', role: 'Engineering, Moka', text: 'Five years since you joined with one laptop and a whiteboard. Thank you for building half of what we run on.', media: { kind: 'gif', gif: 'clap' } },
        { name: 'Didier P.', role: 'Product, remote', text: 'Five years, zero lost tempers in code review. Bravo Ludo.', media: { kind: 'photo', photo: 'team', caption: 'Team day at Le Morne' } },
      ],
    },
    {
      recipient: 'Poonam', label: 'Leaving', cover: 'leaving/3m-suitcase', gift: null,
      signers: [
        { name: 'Kevin A.', role: 'Treasury, Port Louis', text: 'Toronto is getting the best reconciler on the island. Bonne route Poonam, and send photos of the snow.', media: { kind: 'gif', gif: 'hug' } },
        { name: 'Natacha L.', role: 'HR, Port Louis', text: 'Eleven years, three office moves and one very memorable cyclone week. We will miss you.', media: { kind: 'voice', length: 10, gif: 'love', line: 'Poonam, thank you for everything. The door is always open if you come home.' } },
        { name: 'Deven H.', role: 'Treasury', text: 'Who will remind me about the cut off times now? Good luck with the big move.', media: { kind: 'gif', gif: 'dance' } },
      ],
    },
  ],
  proof: [
    ['Nobody forgotten', 'Every birthday and start date on your records becomes a card, year after year.'],
    ['Signed from a phone', 'One link in the WhatsApp group. No login, no app, no desk needed.'],
    ['Lands at your chosen hour', 'Delivered by email at the time you schedule, signed by colleagues wherever they are.'],
    ['A pot for the gift', 'Colleagues chip in by card in US dollars instead of passing an envelope.'],
  ],
  problemTitle: 'How staff birthdays and farewells get missed today',
  problemIntro: 'Ask any office manager in Port Louis how birthdays are tracked and you usually hear one of three answers. None of them survive a busy month.',
  problems: [
    ['The shared calendar nobody updates', 'New joiners never get added, leavers never get removed, and the reminder pops up on the morning itself when it is too late to gather messages.'],
    ['The paper card on one desk', 'It reaches whoever is in the building that afternoon. Colleagues on leave, on another site or working the evening shift for a European client never see it.'],
    ['The anniversary nobody counted', 'Ten years of service passes quietly because no one noticed the start date. Long serving staff notice when their milestone goes unmarked.'],
  ],
  automationTitle: 'Set it once, and the celebrations take care of themselves',
  automationIntro: 'Staff celebration software should feel like a thoughtful colleague who never forgets a date. Here is what Thankeeu handles for you after the team is imported.',
  automations: [
    ['Cake', 'Staff birthday cards', 'A card opens for signing a few days ahead and arrives in the person’s inbox on their birthday at the hour you set.'],
    ['Award', 'Work anniversary cards', 'First year, fifth year, twenty fifth year. Each anniversary is read from the start date and celebrated automatically.'],
    ['Send', 'Welcome cards for joiners', 'New starters receive a card from the team in their first days, which helps when the office is large and the faces are new.'],
    ['Bell', 'Reminders for signers', 'Colleagues are invited to sign, and HR can see on the dashboard who has added a message before it goes out.'],
    ['Briefcase', 'Farewell cards in two clicks', 'When a colleague leaves, start the card, set their last day and share the link. The same goes for retirements and promotions.'],
    ['Calendar', 'Whole company occasions', 'Workers’ Day, International Women’s Day, Valentine’s Day, Mother’s Day and Father’s Day cards can go to everyone at once.'],
  ],
  integrationsIntro: 'If you already keep birthdays and start dates in an HR system, connect it and Thankeeu keeps the list current. Smaller teams in Mauritius often work from an Excel sheet exported from payroll, and that works just as well: upload it, check the columns, done. Resync whenever someone joins or leaves.',
  featuresTitle: 'Cards your colleagues will actually open twice',
  featuresIntro: 'A good celebration card is about the people who sign it. These are the details that make a Thankeeu card feel personal rather than corporate.',
  features: [
    ['MessageCircle', 'Any language on the page', 'A carte d’anniversaire collègue can carry French, English and Kreol messages side by side, exactly as people wrote them.'],
    ['Camera', 'Photos from the team', 'Add the picture from the team day at Le Morne or the end of year dinner. Photos, GIFs and video all fit on the card.'],
    ['Mic', 'Voice notes', 'Some people speak better than they type. A short voice note from the night shift lands right next to the written messages.'],
    ['Lock', 'Private messages', 'A signer can mark a message private so only the recipient reads it, useful for a heartfelt note from a manager.'],
    ['QrCode', 'Live Memory Wall', 'At a farewell lunch or long service dinner, guests scan a QR code and their photos appear on a screen in the room.'],
    ['Download', 'Keep it forever', 'Download the card as a PDF, or watch it back as a Memory Movie with music.'],
  ],
  sections: [
    {
      h2: 'Staff birthday cards in Mauritius, without the scramble',
      paragraphs: [
        'In many Mauritian offices the birthday routine is warm but improvised: someone orders a cake from the bakery down the road, someone else buys a card, and messages are written in a hurry around the coffee machine. It works when the team is small and everyone sits together. It falls apart when the company has staff in Ebene, a warehouse in Riche Terre and remote analysts working for a client in Paris.',
        'With automatic staff birthday cards, the card is ready a few days early and the link is shared with the right team. People sign when it suits them, add a photo or a voice note, and the card arrives on the birthday itself. Keep the cake; the card simply means nobody is left out of it.',
      ],
    },
    {
      h2: 'Work anniversary cards for long serving teams',
      paragraphs: [
        'Mauritius has plenty of people who stay with one employer for decades, in banking, insurance, sugar and hospitality especially. A work anniversary card is a small, sincere way to say the company noticed, and it carries more weight when it is signed by the colleagues who were there for those years.',
        'Thankeeu reads each start date and starts the card on time. HR can choose which milestones to celebrate, and colleagues from other sites or other countries in the group can add their messages too.',
      ],
      items: [
        ['First year', 'A warm note that the first twelve months mattered.'],
        ['Five and ten years', 'Messages from the people who trained them and the people they trained.'],
        ['Twenty years and beyond', 'A Memory Movie that can be played at the long service dinner.'],
      ],
    },
    {
      h2: 'A farewell card for a colleague leaving Mauritius',
      paragraphs: [
        'People leave for many reasons: a new job across Ebene, a move to Réunion, Australia, Canada or the Gulf, a retirement after a long career. A farewell card for a colleague in Mauritius often has to reach friends who have already left the company and are now overseas. One link handles that easily, and the card can be scheduled for the last afternoon.',
        'For the leaving gift, the team can chip in through the gift pot in US dollars. The person leaving claims it to their bank or as a digital gift card, which is far easier to carry on a plane than a present. If you want to send a one off card outside the Teams plan, see our [online group cards](/online-group-card).',
      ],
    },
    {
      h2: 'Choosing staff celebration software for a Mauritian company',
      paragraphs: [
        'Check four things. Can staff sign without an account, from a phone? Does it accept every language your team writes in? Does it import birthdays and start dates from your records? And does the gift collection actually work from Mauritius, given that rupee payments online are limited? Thankeeu answers yes to each, with contributions and billing in USD.',
        'Start with a free company account if you only need cards on demand. Move to the Teams plan when you want birthdays and anniversaries to send themselves.',
      ],
    },
  ],
  rolloutTitle: 'From spreadsheet to first birthday card in a week',
  rollout: [
    ['Monday: create the company workspace', 'Sign up for a free company account or book a demo to discuss a free pilot.'],
    ['Tuesday: import the team', 'Connect your HR system or upload the payroll spreadsheet with birthdays and start dates.'],
    ['Wednesday: set your rules', 'Pick send times and decide which anniversaries to mark.'],
    ['Thursday onward: watch it run', 'Staff receive their invite by email and the first automatic card goes out on the next birthday.'],
  ],
  pricingIntro: 'The Teams plan costs a set amount per employee per month, with two months free when you pay yearly. Billing is in US dollars because our payment provider cannot charge MUR yet; the table converts to rupees at today’s rate so you can plan the budget. The free company account stays free for cards you start yourself.',
  comparisonIntro: 'If you are comparing staff celebration software, Bonusly, Kudoboard and Thankbox for Teams are the names that usually come up. Bonusly centres on points and a rewards catalog rather than cards. Kudoboard offers group boards, but birthday automation and HR sync sit on its Enterprise plan. Thankbox for Teams sends automatic birthday and anniversary cards for a flat yearly fee and charges a fee on each gift contribution. The table sets out the details.',
  faqs: [
    { q: 'What is staff celebration software?', a: 'It is a tool that remembers birthdays, work anniversaries and other milestones for HR and sends a group card from the team at the right time. Thankeeu does this from your HR data.' },
    { q: 'How do I send staff birthday cards in Mauritius automatically?', a: 'Import your team with birthdays into Thankeeu for Teams and switch on birthdays. Each card is created, signed by colleagues and delivered on the day.' },
    { q: 'How do I make a farewell card for a colleague in Mauritius?', a: 'Start a farewell card in your company workspace, add their name, set the last day as the delivery date and share the link in email or WhatsApp.' },
    { q: 'Can former colleagues abroad sign the card?', a: 'Yes. Anyone with the link can sign from any country, with no account needed.' },
    { q: 'What should I write on a work anniversary card?', a: 'Be specific: name a project, a habit or a moment from their years with you. Thank them for one real thing rather than writing a generic line.' },
    { q: 'Can I write a carte d’anniversaire collègue in French?', a: 'Yes. Every signer can write in French, English, Kreol or any language they like.' },
    { q: 'Can we collect money for a leaving gift?', a: 'Yes. Colleagues chip in by card in US dollars through the gift pot, and the recipient claims it to their bank account or as a digital gift card.' },
    { q: 'Why are contributions in US dollars and not rupees?', a: 'Mauritian rupees cannot be charged online through our payment provider yet, so USD is used.' },
    { q: 'What time does the card arrive?', a: 'At the exact time you schedule, so pick an hour when it can be waiting as they arrive at the office.' },
    { q: 'Can managers add a private message?', a: 'Yes. Any signer can mark their message as private so only the recipient sees it.' },
    { q: 'Do we need an HR system to use it?', a: 'No. A spreadsheet with names, emails, birthdays and start dates is enough, and you can re import it whenever it changes.' },
    { q: 'Can we celebrate new joiners too?', a: 'Yes. Welcome cards for new hires are created automatically, alongside birthdays and anniversaries.' },
    { q: 'Is there a free trial for staff celebration software?', a: 'You can use a free company account for cards with no card fee, and request a free 14 or 30 day pilot of the Teams plan through a demo.' },
    { q: 'Can we show the card at the leaving party?', a: 'Yes. Play the Memory Movie on a screen, or run the Live Memory Wall so guests add photos by QR code during the event.' },
  ],
  ctaTitle: 'Never miss another colleague’s big day',
  ctaText: 'Create a free company account to send your first card now, or book a demo and set up automatic celebrations for the whole company.',
};

export default [A, B];
