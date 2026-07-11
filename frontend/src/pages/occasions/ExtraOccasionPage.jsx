import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useSEO, SCHEMAS } from '../../hooks/useSEO';

/**
 * Occasion landing pages targeting keywords Thankbox ranks for that Thankeeu
 * previously had no page for. Each occasion has unique copy — not templated
 * country-swaps — with FAQ schema for rich results.
 */

const OCCASIONS = {
  'leaving-card': {
    path: '/cards/leaving-card',
    title: 'Online Leaving Card — Group Leaving Cards for Colleagues | Thankeeu',
    desc: "Create an online leaving card the whole team signs from one link. Messages, photos, GIFs and voice notes, plus an optional gift collection. Free to start — no signup needed to sign.",
    keywords: 'online leaving card, leaving card for colleague, group leaving card, virtual leaving card, goodbye card online, leaving card everyone can sign, office leaving card, leaving collection for colleague',
    h1: 'Online Leaving Cards the Whole Team Can Sign',
    sub: "Say a proper goodbye — one link, everyone signs, and chip in for a leaving gift together.",
    useCases: [
      ['Colleague leaving for a new job', 'Collect messages, memories, photos and inside jokes from the whole office — even people working remotely or on leave.'],
      ['Boss or manager leaving', 'A dignified send-off signed by the entire team, delivered on their last day at the exact time you choose.'],
      ['Team member relocating', 'Distance is the point — an online leaving card reaches them wherever they go, and they keep it forever.'],
      ['Leaving gift collection', 'Skip chasing people for cash. Everyone contributes securely online when they sign, and the pot goes to one great gift.'],
    ],
    faqs: [
      ['How does an online leaving card work?', 'Create the card in under 2 minutes, share one link with colleagues, and everyone adds their message, photo, GIF or voice note. Schedule it to arrive on their last day.'],
      ['Can we collect money for a leaving gift too?', 'Yes — every card includes an optional gift collection. People chip in when they sign, and the recipient or organiser withdraws the pooled amount.'],
      ['Do people need an account to sign the leaving card?', 'No. Anyone with the link can sign instantly — no registration, no app download.'],
      ['How much does an online leaving card cost?', 'Free to create and collect messages. A small fee applies when you send, always shown upfront.'],
    ],
    blogLinks: [
      ['/blog/best-way-celebrate-colleague-leaving-work', 'The best way to celebrate a colleague leaving work'],
      ['/blog/farewell-card-ideas-for-colleagues', 'Farewell card ideas for colleagues'],
      ['/blog/farewell-card-messages-uk-colleagues-2025', 'What to write in a leaving card (UK)'],
      ['/blog/collect-money-colleague-gift-uk-2025', "How to collect money for a colleague's gift"],
    ],
  },
  retirement: {
    path: '/cards/retirement',
    title: 'Online Retirement Card — Group Retirement Cards & Gifts | Thankeeu',
    desc: 'Honour decades of service with an online retirement card signed by everyone — colleagues past and present. Messages, photos, voice notes, and a pooled retirement gift.',
    keywords: 'online retirement card, group retirement card, retirement card for colleague, retirement card everyone signs, virtual retirement card, retirement collection, happy retirement card online',
    h1: 'Retirement Cards Signed by Everyone They Worked With',
    sub: 'A career deserves more than one signature. Gather messages from colleagues past and present.',
    useCases: [
      ['Long-service retirements', 'Invite colleagues from every era of their career — one link works for current staff and old teammates alike.'],
      ['Retirement gift collections', 'Pool contributions from everyone into one meaningful retirement gift, with no cash chasing.'],
      ['Voice notes they can keep', 'A written message is lovely; hearing a colleague\'s voice years later is priceless. Thankeeu cards keep both forever.'],
      ['Scheduled for the send-off', 'Deliver the card at the retirement party, on their last day, or the morning after — you pick the exact moment.'],
    ],
    faqs: [
      ['Can former colleagues sign the retirement card too?', 'Yes — anyone with the link can sign from anywhere, whether they still work with you or left years ago.'],
      ['How do retirement gift contributions work?', 'Everyone chips in what they like when signing. The pooled gift is withdrawn by the organiser or the retiree.'],
      ['Does the retiree keep the card?', 'Yes — the card stays online for them to revisit, with every message, photo and voice note preserved.'],
      ['How long does it take to set up?', 'Under 2 minutes. Share the link, and messages start arriving immediately.'],
    ],
    blogLinks: [
      ['/blog/how-to-celebrate-employee-work-anniversaries', 'How to celebrate employee work anniversaries'],
      ['/blog/work-anniversary-cards-guide', 'Work anniversary cards — the complete guide'],
      ['/blog/best-way-celebrate-colleague-leaving-work', 'Celebrating a colleague who is leaving'],
      ['/blog/why-group-cards-beat-individual-cards', 'Why group cards beat individual cards'],
    ],
  },
  'get-well-soon': {
    path: '/cards/get-well-soon',
    title: 'Online Get Well Soon Card — Group Get Well Cards | Thankeeu',
    desc: 'Send strength from the whole team with an online get well soon card. Everyone signs from one link — kind words, photos and voice notes — delivered when it matters most.',
    keywords: 'online get well soon card, group get well card, get well card for colleague, get well soon card everyone signs, virtual get well card, get well wishes for coworker',
    h1: 'Get Well Soon Cards from the Whole Team',
    sub: 'When a colleague is unwell, one card full of warm wishes says more than a hundred separate texts.',
    useCases: [
      ['Colleague recovering from illness or surgery', 'Gentle messages, encouragement and prayers from everyone — collected in one place they can read at their own pace.'],
      ['Long recovery periods', 'The card stays open — teammates can keep adding messages over weeks, and the recipient can revisit them anytime.'],
      ['Support fund', 'Optionally pool contributions to help with recovery costs or send a thoughtful gift.'],
      ['Voice notes for comfort', 'Hearing familiar voices lifts spirits in a way text can\'t. Anyone can record one straight from their phone.'],
    ],
    faqs: [
      ['Is it appropriate to send a group get well card?', 'Yes — a single card from everyone is warm without overwhelming someone who is unwell with dozens of individual messages.'],
      ['Can we add a contribution for the person?', 'Yes — every card includes an optional collection pot people can add to when they sign.'],
      ['Can the card stay open during a long recovery?', 'Yes — you control when it\'s delivered and can keep collecting messages afterwards too.'],
      ['Do signers need an account?', 'No — anyone with the link can sign instantly.'],
    ],
    blogLinks: [
      ['/blog/why-group-cards-beat-individual-cards', 'Why group cards beat individual cards'],
      ['/blog/group-cards-remote-teams-inclusion', 'Group cards for remote teams'],
      ['/blog/employee-appreciation-vs-recognition', 'Appreciation vs recognition at work'],
      ['/blog/build-workplace-culture-fast-growing-nigerian-company', 'Building workplace culture'],
    ],
  },
  'thank-you': {
    path: '/cards/thank-you',
    title: 'Online Thank You Card — Group Thank You Cards & Ecards | Thankeeu',
    desc: 'Say thank you together. Create an online thank you card the whole team signs — messages, photos, GIFs and voice notes, with an optional group gift. Free to start.',
    keywords: 'online thank you card, group thank you card, thank you ecard, thank you card everyone signs, appreciation card online, thank you card for colleague, thank you card for teacher, thank you card for boss',
    h1: 'Thank You Cards Signed by Everyone',
    sub: 'Gratitude hits different when it comes from the whole group — teachers, mentors, doctors, colleagues.',
    useCases: [
      ['Thanking a teacher or lecturer', 'The whole class signs one card — messages, photos and memories — plus an optional group gift.'],
      ['Thanking a departing mentor or boss', 'Years of guidance deserve more than a handshake. Collect appreciation from everyone they helped.'],
      ['Project wrap-ups', 'Close a big project by letting the team thank the people who carried it.'],
      ['Thanking healthcare workers, coaches & volunteers', 'One link lets an entire community say thank you at once.'],
    ],
    faqs: [
      ['What can people add to a thank you card?', 'Messages, photos, GIFs and voice notes — each signer personalises their own entry.'],
      ['Can we add a gift to the thank you card?', 'Yes — an optional collection lets everyone chip in for a group gift when they sign.'],
      ['Do signers need to register?', 'No — anyone with the link signs instantly, no account needed.'],
      ['When is the card delivered?', 'Whenever you choose — instantly, or scheduled for a specific date and time.'],
    ],
    blogLinks: [
      ['/blog/employee-appreciation-vs-recognition', 'Employee appreciation vs recognition'],
      ['/blog/employee-recognition-ideas-nigerian-companies', 'Employee recognition ideas'],
      ['/blog/why-group-cards-beat-individual-cards', 'Why group cards beat individual cards'],
      ['/blog/creating-employee-recognition-programme-from-scratch', 'Creating a recognition programme from scratch'],
    ],
  },
  'maternity-leave': {
    path: '/cards/maternity-leave',
    title: 'Maternity Leave Card — Group Cards for Mums-to-Be | Thankeeu',
    desc: 'Send a colleague off on maternity leave with a group card the whole team signs — warm wishes, photos, voice notes, and a pooled baby gift.',
    keywords: 'maternity leave card, group maternity card, maternity card for colleague, baby shower card online, good luck maternity leave card, card for colleague going on maternity leave',
    h1: 'Maternity Leave Cards from the Whole Team',
    sub: 'Send her off with love — one card, every colleague, and a pooled gift for the new arrival.',
    useCases: [
      ['Maternity send-offs', 'Warm wishes from the whole office before she goes — delivered on her last day before leave.'],
      ['Baby gift collections', 'Pool contributions for a meaningful baby gift instead of chasing cash around the office.'],
      ['Remote teammates included', 'Colleagues in other cities or countries sign the same card from one link.'],
      ['Paternity leave too', 'Works exactly the same for dads-to-be heading off on leave.'],
    ],
    faqs: [
      ['When should we send a maternity leave card?', 'Most teams schedule it for the colleague\'s last working day before leave — Thankeeu delivers it at the exact time you choose.'],
      ['Can we pool money for a baby gift?', 'Yes — everyone contributes when they sign, and the pooled gift goes to the parent-to-be.'],
      ['Can people sign without an account?', 'Yes — one link, no registration, works on any phone.'],
      ['Can we send another card when the baby arrives?', 'Absolutely — many teams send a maternity card at leave and a new baby card after the arrival.'],
    ],
    blogLinks: [
      ['/blog/baby-shower-group-card-ideas-celebrate-new-mum', 'Baby shower group card ideas'],
      ['/blog/group-cards-remote-teams-inclusion', 'Group cards for remote teams'],
      ['/blog/group-gifting-work-office-gift-pools', 'Group gifting at work'],
      ['/blog/why-group-cards-beat-individual-cards', 'Why group cards beat individual cards'],
    ],
  },
  christmas: {
    path: '/cards/christmas',
    title: 'Online Christmas Card — Group Christmas Cards for Teams | Thankeeu',
    desc: 'Send one beautiful online Christmas card from the whole team. Everyone signs from one link — festive messages, photos, GIFs — with an optional group gift or bonus pool.',
    keywords: 'online christmas card, group christmas card, team christmas card, company christmas card online, christmas ecard for colleagues, christmas card everyone signs, secret santa alternative',
    h1: 'Group Christmas Cards for Teams & Companies',
    sub: 'One festive card, signed by everyone — for clients, colleagues, or the whole company.',
    useCases: [
      ['Company-wide Christmas cards', 'One card the entire company signs — far warmer than a templated corporate email blast.'],
      ['Cards for clients & partners', 'Send clients a card genuinely signed by the team that works with them.'],
      ['End-of-year appreciation', 'Pair the card with a pooled gift or bonus contribution for standout teammates.'],
      ['Distributed teams', 'Everyone signs from wherever they are — office, home, or another continent.'],
    ],
    faqs: [
      ['Can a large company sign one Christmas card?', 'Yes — there is no limit on signers. Hundreds of colleagues can add messages, photos and GIFs to one card.'],
      ['Can we schedule it for Christmas morning?', 'Yes — pick the exact date and time and it arrives on the dot, regardless of timezone.'],
      ['Is it cheaper than posting physical cards?', 'Significantly — one online card replaces printing and postage for the whole list, with no waste.'],
      ['Can we add a gift collection?', 'Yes — every card includes an optional collection pot for a group gift.'],
    ],
    blogLinks: [
      ['/blog/group-cards-remote-teams-inclusion', 'Group cards for remote teams'],
      ['/blog/why-group-cards-beat-individual-cards', 'Why group cards beat individual cards'],
      ['/blog/group-gifting-work-office-gift-pools', 'Group gifting and office gift pools'],
      ['/blog/build-workplace-culture-fast-growing-nigerian-company', 'Building workplace culture'],
    ],
  },

  // ── UK Tier 1 ──────────────────────────────────────────────────────────────
  'sympathy': {
    path: '/cards/sympathy',
    title: 'Online Sympathy Card — Group Condolence Cards | Thankeeu',
    desc: 'Send heartfelt condolences from the whole team with an online sympathy card. Everyone signs from one link — kind words, memories and support — delivered privately when needed most.',
    keywords: 'online sympathy card, group sympathy card, condolence card online, sympathy card for colleague, bereavement card group, online condolence card, sympathy card everyone signs',
    h1: 'Sympathy Cards from the Whole Team',
    sub: 'When a colleague experiences loss, a card full of warm words from everyone says more than any single message can.',
    useCases: [
      ['Bereavement at work', 'Colleagues want to reach out but sending dozens of individual messages can overwhelm someone who is grieving. One card collects every voice in one quiet, private place.'],
      ['Loss of a parent, partner or child', 'The whole team, including those who work remotely or in other offices, can add a personal message from one link — delivered by email at a time of your choosing.'],
      ['Loss of a pet', 'For many colleagues, a pet is family. A card from the team acknowledges that without overstepping.'],
      ['Supporting a colleague long-term', 'The card stays open — teammates can keep adding messages over weeks, and the recipient can revisit them in their own time.'],
    ],
    faqs: [
      ['How do I send a group sympathy card without making it overwhelming?', 'Share the link privately with contributors only, set a close date, and deliver it to the recipient by email. They receive one card they can open when they are ready — not a flood of individual messages.'],
      ['Can contributors add photos to a sympathy card?', 'Yes — contributors can add a photo of a shared memory alongside their message, which is often the most meaningful part of a sympathy card.'],
      ['Do contributors need an account?', 'No — anyone with the link can sign instantly.'],
      ['Can we include a contribution for the recipient?', 'Yes — an optional collection pot lets contributors add a financial gift for flowers, funeral costs, or practical support.'],
    ],
    blogLinks: [
      ['/blog/why-group-cards-beat-individual-cards', 'Why group cards beat individual cards'],
      ['/blog/group-cards-remote-teams-inclusion', 'Group cards for remote teams'],
      ['/blog/employee-appreciation-vs-recognition', 'Supporting colleagues through difficult times'],
      ['/blog/build-workplace-culture-fast-growing-nigerian-company', 'Building workplace culture'],
    ],
  },
  'welcome': {
    path: '/cards/welcome',
    title: 'Online Welcome Card — Group Welcome Cards for New Starters | Thankeeu',
    desc: 'Make a new starter feel at home from day one with a welcome card signed by the whole team. Everyone adds a message, photo or GIF from one link. Free to start.',
    keywords: 'online welcome card, welcome card for new starter, new hire welcome card, welcome to the team card, onboarding card, group welcome card, new employee card',
    h1: 'Welcome Cards That Make New Starters Feel at Home',
    sub: 'First impressions stick. A card from the whole team on day one tells a new starter they joined somewhere that pays attention.',
    useCases: [
      ['New hire first day', 'Schedule the card to land in their inbox at 9am on their first day — before they have even opened their laptop. It sets the tone for everything that follows.'],
      ['Remote onboarding', 'Distributed teams can struggle to make new starters feel connected. A welcome card from colleagues they haven\'t met yet closes that gap immediately.'],
      ['Returning from leave', 'A colleague returning from maternity, paternity or long-term sick leave often needs a warm "welcome back" as much as any new hire.'],
      ['Transfer or promotion into a new team', 'When someone joins a team from another department, a welcome card from their new colleagues signals genuine inclusion rather than just a process.'],
    ],
    faqs: [
      ['How early should I create the welcome card?', 'A week before the start date gives enough time for the whole team to sign without rushing. Schedule delivery for their first morning.'],
      ['Can I include a gift with the welcome card?', 'Yes — an optional collection lets the team pool a welcome gift (coffee voucher, stationery, gift card) alongside their messages.'],
      ['What should people write in a welcome card?', 'Name + role + one personal touch: a favourite thing about the team, a practical tip, or a warm promise to be a helpful resource. Short and genuine beats long and formal.'],
      ['Do contributors need to register?', 'No — anyone with the link can sign from their phone or laptop instantly.'],
    ],
    blogLinks: [
      ['/blog/employee-onboarding-making-new-hires-feel-welcome', 'Making new hires feel welcome'],
      ['/blog/build-workplace-culture-fast-growing-nigerian-company', 'Building workplace culture'],
      ['/blog/group-cards-remote-teams-inclusion', 'Group cards for remote teams'],
      ['/blog/employee-recognition-ideas-nigerian-companies', 'Employee recognition ideas'],
    ],
  },
  'good-luck': {
    path: '/cards/good-luck',
    title: 'Online Good Luck Card — Group Good Luck Cards | Thankeeu',
    desc: 'Send good luck wishes from the whole group with one online card. Perfect for job interviews, exams, surgery, a new venture, or any big moment. Everyone signs from one link.',
    keywords: 'online good luck card, group good luck card, good luck card for colleague, good luck ecard, virtual good luck card, good luck card everyone signs, good luck in new job card',
    h1: 'Good Luck Cards from Everyone Who\'s Rooting for Them',
    sub: 'Big moments are less daunting when the whole team is in their corner. One card collects everyone\'s encouragement in one place.',
    useCases: [
      ['Starting a new job', 'A card from former colleagues saying "we believe in you" is one of the most meaningful things someone can receive before their first day at a new company.'],
      ['Exams and professional qualifications', 'Classmates, study groups, and supportive colleagues can all sign one card wishing someone the best in a big exam or certification.'],
      ['Surgery or medical procedure', 'Good luck cards for medical occasions sit between get well soon and sympathy — warm, encouraging, forward-looking. The whole team can sign from one link.'],
      ['A new business or venture', 'When a colleague takes the leap to start their own thing, a card from everyone who has worked with them and believes in them is a powerful send-off.'],
    ],
    faqs: [
      ['What\'s the difference between a good luck card and a leaving card?', 'A leaving card marks the end of a chapter. A good luck card looks forward — it\'s specifically about cheering someone on for what\'s ahead, regardless of whether they\'re leaving.'],
      ['Can I send a good luck card to someone outside my organisation?', 'Yes — anyone with the link can contribute, so family members, friends and colleagues from other companies can all sign the same card.'],
      ['Can we include a gift?', 'Yes — an optional collection lets contributors chip in for a good luck gift alongside their messages.'],
      ['When should I send it?', 'The day before or the morning of the big event, scheduled for a specific time so it lands at just the right moment.'],
    ],
    blogLinks: [
      ['/blog/why-group-cards-beat-individual-cards', 'Why group cards beat individual cards'],
      ['/blog/group-cards-remote-teams-inclusion', 'Group cards for remote teams'],
      ['/blog/celebrating-employee-promotions-why-matters-how', 'Celebrating employee promotions'],
      ['/blog/best-way-celebrate-colleague-leaving-work', 'Celebrating a colleague leaving'],
    ],
  },
  'baby-shower': {
    path: '/cards/baby-shower',
    title: 'Online Baby Shower Card — Group Cards & Gift Collections | Thankeeu',
    desc: 'Create an online baby shower card the whole team or group signs from one link. Messages, photos, GIFs and voice notes, with an optional pooled baby shower gift.',
    keywords: 'online baby shower card, group baby shower card, baby shower ecard, baby shower card for colleague, virtual baby shower card, baby shower gift collection, baby shower card everyone signs',
    h1: 'Baby Shower Cards from Everyone Who Loves Them',
    sub: 'Gather warm wishes and pool a gift for the mum-to-be — all in one link, before the big day.',
    useCases: [
      ['Office baby shower', 'Colleagues can sign the card and chip into a group gift in the weeks before the baby arrives — no chasing cash, no passing a card round the office.'],
      ['Virtual baby shower', 'Friends and family spread across different cities or countries can all sign one card and contribute to one pooled gift, regardless of distance.'],
      ['Remote team celebration', 'Distributed teams can\'t throw an in-person shower, but a group card delivered on the day makes the occasion just as special from afar.'],
      ['Extended family gift pool', 'Aunties, cousins and family friends can all contribute to one meaningful baby gift instead of buying five separate small ones.'],
    ],
    faqs: [
      ['What\'s the difference between a baby shower card and a new baby card?', 'A baby shower card is sent before the birth — it\'s celebratory and anticipatory. A new baby card is sent after the arrival to congratulate the parents. Thankeeu has both.'],
      ['Can remote friends contribute to the gift?', 'Yes — contributors anywhere in the world can add a message and chip into the gift collection from one link.'],
      ['Do contributors need an account?', 'No — anyone with the link can sign and contribute instantly.'],
      ['When should we send the card?', 'Before the due date — at the baby shower itself (delivered to a screen) or scheduled to arrive a few days before the expected date.'],
    ],
    blogLinks: [
      ['/blog/baby-shower-group-card-ideas-celebrate-new-mum', 'Baby shower group card ideas'],
      ['/blog/group-gifting-work-office-gift-pools', 'Group gifting at work'],
      ['/blog/group-cards-remote-teams-inclusion', 'Group cards for remote teams'],
      ['/blog/why-group-cards-beat-individual-cards', 'Why group cards beat individual cards'],
    ],
  },
  'teacher-thank-you': {
    path: '/cards/teacher-thank-you',
    title: 'Online Teacher Thank You Card — Group Cards from the Class | Thankeeu',
    desc: 'Create a thank you card for a teacher or teaching assistant from the whole class. Every pupil, parent and family member signs from one link — messages, photos, drawings and voice notes.',
    keywords: 'teacher thank you card online, group thank you card for teacher, class thank you card, end of year teacher card, teacher appreciation card, thank you card for teaching assistant, virtual card for teacher',
    h1: 'Teacher Thank You Cards from the Whole Class',
    sub: 'Every pupil. Every parent. One beautiful card. No paper, no chasing, no last-minute panic.',
    useCases: [
      ['End of school year', 'The class parent shares one link with all families; every child adds a message, drawing description or photo; the teacher receives one card with every voice in the class.'],
      ['Teacher leaving or retiring', 'When a beloved teacher moves on, a card signed by current and former pupils — going back years — is something they keep for the rest of their career.'],
      ['Teaching assistant appreciation', 'TAs rarely get the recognition they deserve. A group card from the class and their parents is a simple way to fix that.'],
      ['Thank you from parents', 'Parents can add their own messages alongside their children\'s, making the card a fuller picture of the impact a teacher has had.'],
    ],
    faqs: [
      ['How do I organise a class thank you card for a teacher?', 'Share the link with all class parents via the school WhatsApp or email group. Ask each family to add their child\'s message before the last day. Schedule it to deliver at the end-of-term assembly or on the last day.'],
      ['Can children sign themselves?', 'Yes — any child old enough to type can add their own message. Younger children can dictate to a parent who types it.'],
      ['Can we include a gift collection?', 'Yes — parents can contribute to a pooled gift card or cash gift alongside their message.'],
      ['Is there a limit on signers?', 'No — every pupil and parent in the class can sign.'],
    ],
    blogLinks: [
      ['/blog/employee-appreciation-vs-recognition', 'The importance of appreciation'],
      ['/blog/why-group-cards-beat-individual-cards', 'Why group cards beat individual cards'],
      ['/blog/group-gifting-work-office-gift-pools', 'Group gifting ideas'],
      ['/blog/creating-employee-recognition-programme-from-scratch', 'Building a culture of recognition'],
    ],
  },
  'engagement': {
    path: '/cards/engagement',
    title: 'Online Engagement Card — Group Congratulations Cards | Thankeeu',
    desc: 'Celebrate an engagement with a group card from everyone who loves them. Messages, photos, GIFs, voice notes and an optional pooled engagement gift — all from one shared link.',
    keywords: 'online engagement card, group engagement card, engagement congratulations card, congratulations on engagement card, virtual engagement card, engagement card everyone signs, engaged card online',
    h1: 'Engagement Cards Signed by Everyone Who Loves Them',
    sub: 'An engagement deserves more than a flurry of individual WhatsApp messages. One card collects every congratulations in one beautiful place.',
    useCases: [
      ['Office engagement announcement', 'When a colleague gets engaged, the whole team can sign one card from one link — no chasing anyone down, no passing a card around.'],
      ['Family and friends group', 'Parents, siblings, childhood friends and newer friends can all sign the same card, turning it into a record of everyone who celebrated this moment with them.'],
      ['Long-distance celebration', 'Friends and family who can\'t be there in person can still be part of the moment — contributing a message and a share of the gift from anywhere.'],
      ['Gift pool for the couple', 'Instead of ten individual small gifts, everyone chips in to one meaningful engagement present the couple actually wants.'],
    ],
    faqs: [
      ['Should we send an engagement card or wait for the wedding?', 'Both. An engagement is its own milestone worth marking. Send a card now and another for the wedding — they\'re different moments.'],
      ['Can we include both people in the card?', 'Yes — address it to both partners and contributors can write to either or both.'],
      ['How do we pool a gift?', 'Enable the optional collection when creating the card. Everyone contributes when they sign and the couple withdraws the total as a gift.'],
      ['Do contributors need to register?', 'No — anyone with the link can sign and contribute instantly.'],
    ],
    blogLinks: [
      ['/blog/why-group-cards-beat-individual-cards', 'Why group cards beat individual cards'],
      ['/blog/wedding-wishes-prayers-nigerian-couple-card', 'Wedding wishes for a couple'],
      ['/blog/group-gifting-work-office-gift-pools', 'Group gifting at work'],
      ['/blog/group-cards-remote-teams-inclusion', 'Group cards for remote and distributed teams'],
    ],
  },
  'new-home': {
    path: '/cards/new-home',
    title: 'Online New Home Card — Group Cards & Housewarming Gifts | Thankeeu',
    desc: 'Celebrate a new home with a group card from family, friends and colleagues. Everyone signs from one link — messages, photos and GIFs — with an optional pooled housewarming gift.',
    keywords: 'online new home card, group new home card, housewarming card online, new home congratulations card, virtual new home card, housewarming ecard, new home card everyone signs',
    h1: 'New Home Cards from Everyone Who\'s Celebrating With Them',
    sub: 'Moving is chaotic. A card from everyone who loves you waiting on the other side makes it worth it.',
    useCases: [
      ['Housewarming from colleagues', 'A card from the whole office signed before or after the move-in is a warm gesture that goes beyond the usual group chat congratulations.'],
      ['First home', 'Buying your first home is a major life milestone. A card from family and close friends with personal messages is something people keep for years.'],
      ['Family moving abroad', 'When someone moves to another country, a card from everyone back home is a piece of the old life they take with them.'],
      ['Pooled housewarming gift', 'Instead of everyone buying individually, pool contributions for one useful, meaningful housewarming gift the new homeowners actually want.'],
    ],
    faqs: [
      ['When is the right time to send a new home card?', 'On moving day, scheduled to arrive when they\'ve had a chance to catch their breath — the evening of the move or the morning after tends to land well.'],
      ['What do people write in a new home card?', 'Wishes for warmth, happiness and many good memories in the new space. If you know the person well, something specific about what the home means to them.'],
      ['Can we pool a housewarming gift?', 'Yes — enable the collection when creating the card and contributors chip in when they sign.'],
      ['Can people outside the immediate group sign?', 'Yes — anyone with the link can sign from anywhere.'],
    ],
    blogLinks: [
      ['/blog/why-group-cards-beat-individual-cards', 'Why group cards beat individual cards'],
      ['/blog/group-gifting-work-office-gift-pools', 'Group gifting ideas'],
      ['/blog/group-cards-remote-teams-inclusion', 'Group cards for remote teams'],
      ['/blog/how-to-surprise-someone-birthday-nigeria-ideas', 'Creative ways to celebrate people'],
    ],
  },

  // ── US Tier 1 — US-specific occasions ─────────────────────────────────────
  'administrative-professionals-day': {
    path: '/cards/administrative-professionals-day',
    title: 'Administrative Professionals Day Card — Group Thank You Cards | Thankeeu',
    desc: 'Celebrate Administrative Professionals Day with a group thank you card from the whole office. Everyone signs from one link — personal messages, photos and GIFs — with an optional gift collection.',
    keywords: 'administrative professionals day card, admin professionals day card, admin assistant appreciation card, secretary day card, administrative assistant thank you card, group card administrative professionals day',
    h1: 'Administrative Professionals Day Cards from the Whole Office',
    sub: 'One card. Every message. Because the person who holds the office together deserves to hear it from everyone.',
    useCases: [
      ['Office-wide appreciation', 'Every executive, manager and colleague who relies on an admin professional can sign one card from one link — no chasing signatures around the building.'],
      ['Remote and hybrid teams', 'Distributed teams can still show coordinated appreciation — everyone contributes from wherever they\'re working.'],
      ['Executive assistant recognition', 'EAs manage the unmeasurable. A card with personal messages from every person they support is one of the most meaningful gifts they can receive.'],
      ['Team gift collection', 'Add an optional collection to pool a gift card, spa voucher or experience alongside the card messages.'],
    ],
    faqs: [
      ['When is Administrative Professionals Day?', 'The last Wednesday of April — it falls within Administrative Professionals Week. Mark your calendar and start the card a week out so everyone has time to sign.'],
      ['What should I write in an Administrative Professionals Day card?', 'Be specific: mention one thing they handled that saved the team, a problem they solved quietly, or simply the way they make the office run. Specific > generic every time.'],
      ['Can we include a gift?', 'Yes — enable the collection when creating the card. Contributors add a message and chip in toward a group gift simultaneously.'],
      ['Do contributors need an account?', 'No — anyone with the link signs instantly from their phone or desktop.'],
    ],
    blogLinks: [
      ['/blog/employee-appreciation-vs-recognition', 'Employee appreciation vs recognition'],
      ['/blog/creating-employee-recognition-programme-from-scratch', 'Building a recognition programme'],
      ['/blog/why-group-cards-beat-individual-cards', 'Why group cards beat individual cards'],
      ['/blog/group-gifting-work-office-gift-pools', 'Group gifting at work'],
    ],
  },
  'boss-day': {
    path: '/cards/boss-day',
    title: 'Boss\'s Day Card — Online Group Cards for Your Manager | Thankeeu',
    desc: 'Celebrate Boss\'s Day with a group card the whole team signs. Messages, photos and GIFs from everyone — plus an optional gift collection. One link, no account needed.',
    keywords: "boss's day card, boss day card online, national boss day card, group card for boss, happy boss day card, boss appreciation card, thank you boss card group",
    h1: "Boss's Day Cards from the Whole Team",
    sub: 'Show your manager the team appreciates them — one card, every voice, delivered on Boss\'s Day.',
    useCases: [
      ['Whole-team appreciation', 'Every direct report signing one card carries more weight than a single message from one person. It shows a coordinated, genuine appreciation.'],
      ['Remote teams', 'Distributed teams can contribute from any time zone — the card collects everyone\'s message before Boss\'s Day and delivers at the right moment.'],
      ['New manager welcome + appreciation', 'A card celebrating a manager\'s first Boss\'s Day with the team is a warm gesture that builds rapport fast.'],
      ['Gift from the team', 'Pool contributions for a group gift alongside the card messages — one meaningful present instead of several individual ones.'],
    ],
    faqs: [
      ["When is Boss's Day?", "National Boss's Day (also called National Boss Day) is October 16 in the US. Start the card a week out so everyone has time to contribute."],
      ["What should I write in a Boss's Day card?", 'Be genuine and specific. Mention one thing your manager did that made a real difference to you or the team — not generic praise. Specific messages are more memorable and meaningful.'],
      ['Can the whole team contribute?', 'Yes — share one link via email or Slack and everyone adds their own message. No account needed to sign.'],
      ['Can we include a gift?', 'Yes — enable the collection pot when creating the card. The team chips in a gift contribution alongside their messages.'],
    ],
    blogLinks: [
      ['/blog/what-to-write-birthday-card-boss-nigeria', "What to write in your boss's birthday card"],
      ['/blog/employee-appreciation-vs-recognition', 'Employee appreciation vs recognition'],
      ['/blog/creating-employee-recognition-programme-from-scratch', 'Building a recognition programme'],
      ['/blog/why-group-cards-beat-individual-cards', 'Why group cards beat individual cards'],
    ],
  },
  'teacher-appreciation': {
    path: '/cards/teacher-appreciation',
    title: 'Teacher Appreciation Card — Group Cards from the Class | Thankeeu',
    desc: 'Create a teacher appreciation card the whole class signs. Every student and parent contributes messages, photos and drawings from one link — with an optional group gift.',
    keywords: 'teacher appreciation card online, teacher appreciation week card, group card for teacher, class thank you card for teacher, virtual teacher appreciation card, teacher gift card group, end of year teacher card',
    h1: 'Teacher Appreciation Cards from Every Student and Parent',
    sub: 'Teacher Appreciation Week only comes once a year. Make it count with a card that holds every voice in the class.',
    useCases: [
      ['Teacher Appreciation Week (May)', 'The class parent creates one card, shares the link with all families via the class app or group, and the teacher receives every student\'s message in one place on the big day.'],
      ['End of school year', 'The most popular time for teacher appreciation — combine messages from students, parents and families into one card the teacher keeps long after the year ends.'],
      ['Favorite teacher retirement', 'Former students and parents from previous years can sign the same card, making it a tribute to an entire career rather than just one year.'],
      ['Pooled teacher gift', 'Parents chip into a group gift card (Amazon, Target, school supplies store) alongside their child\'s message — no Venmo requests, no chasing.'],
    ],
    faqs: [
      ['When is Teacher Appreciation Week?', 'The first full week of May in the US. Teacher Appreciation Day falls on the Tuesday of that week. Start the card two weeks out to collect everyone\'s messages.'],
      ['Can students sign the card themselves?', 'Yes — older students can type their own message. For younger children, parents add a message on their behalf.'],
      ['What should we write?', 'Ask your child what their favorite thing about the teacher is and write that — specific, genuine memories mean more than generic appreciation.'],
      ['Can we include a gift card?', 'Yes — enable the collection pot and parents contribute when they sign. The teacher receives the card and the pooled gift together.'],
    ],
    blogLinks: [
      ['/blog/employee-appreciation-vs-recognition', 'The importance of genuine appreciation'],
      ['/blog/why-group-cards-beat-individual-cards', 'Why group cards beat individual cards'],
      ['/blog/group-gifting-work-office-gift-pools', 'Group gifting ideas'],
      ['/blog/creating-employee-recognition-programme-from-scratch', 'Recognition that actually lands'],
    ],
  },
  'thanksgiving': {
    path: '/cards/thanksgiving',
    title: 'Online Thanksgiving Card — Group Cards for Teams & Clients | Thankeeu',
    desc: 'Send a Thanksgiving card from the whole team. Colleagues sign from one link — personal messages, photos and GIFs — perfect for client appreciation and team gratitude.',
    keywords: 'online thanksgiving card, thanksgiving card for team, thanksgiving card for clients, group thanksgiving card, thanksgiving ecard business, virtual thanksgiving card, thanksgiving appreciation card',
    h1: 'Thanksgiving Cards from the Whole Team',
    sub: 'The holiday of gratitude is the perfect time for your team to say thank you — to each other, to clients, and to the people who make the work worthwhile.',
    useCases: [
      ['Client appreciation cards', 'Send every key client a Thanksgiving card that\'s actually signed by the people who work with them — not a templated corporate email blast from marketing.'],
      ['Team-to-team gratitude', 'Cross-functional teams can thank the departments they rely on — engineering thanking design, sales thanking operations — with one coordinated card.'],
      ['Manager to direct reports', 'A Thanksgiving card from a manager with personal messages for each team member is one of the most valued year-end gestures.'],
      ['Remote team connection', 'Distributed teams across time zones can all contribute to one card that arrives in time for Thanksgiving, no matter where everyone is.'],
    ],
    faqs: [
      ['When should I send a Thanksgiving card to clients?', 'The week before Thanksgiving — it arrives before the holiday rush and stands out better than the wave of December holiday cards every client receives at the same time.'],
      ['Can multiple people sign one client\'s Thanksgiving card?', 'Yes — every person who works with that client can add a personal message to one card, making it far warmer than a single email.'],
      ['Is this appropriate for professional relationships?', 'Yes — Thanksgiving appreciation cards are a well-established US business tradition. Warm and genuine beats formal and generic every time.'],
      ['Do contributors need an account to sign?', 'No — one link, sign instantly, no registration.'],
    ],
    blogLinks: [
      ['/blog/employee-appreciation-vs-recognition', 'Employee appreciation vs recognition'],
      ['/blog/creating-employee-recognition-programme-from-scratch', 'Building a recognition programme'],
      ['/blog/group-cards-remote-teams-inclusion', 'Group cards for remote teams'],
      ['/blog/why-group-cards-beat-individual-cards', 'Why group cards beat individual cards'],
    ],
  },
  'mothers-day': {
    path: '/cards/mothers-day',
    title: 'Online Mother\'s Day Card — Group Cards from the Whole Family | Thankeeu',
    desc: 'Create a Mother\'s Day card the whole family signs from one link — messages, photos, voice notes and memories. Pool a gift together. Delivered on Mother\'s Day.',
    keywords: "online mother's day card, group mother's day card, mother's day card from family, virtual mother's day card, happy mother's day card everyone signs, mother's day gift collection family",
    h1: "Mother's Day Cards from the Whole Family",
    sub: 'Every sibling. Every grandchild. Every person who wants to say thank you — gathered in one card, delivered on her day.',
    useCases: [
      ['Siblings coordinating across distance', 'Brothers and sisters spread across states or countries can all sign one card from one link — no one gets left out, no one has to coordinate shipping.'],
      ['Grandchildren to grandmother', 'The whole family signs one card from the grandkids — messages, drawings described in text, and photos — that grandma can keep and revisit forever.'],
      ['Gift from the whole family', 'Instead of everyone buying separately, pool contributions for one meaningful Mother\'s Day gift the whole family is proud of.'],
      ['Stepmothers, mother figures and maternal mentors', 'The card can be addressed to anyone who has filled a maternal role — it\'s about the relationship, not just the title.'],
    ],
    faqs: [
      ["When is Mother's Day in the US?", "The second Sunday of May. Start the card one to two weeks out so everyone has time to add their message before it delivers on the day."],
      ['Can we include photos?', 'Yes — each contributor can add a personal photo alongside their message, turning the card into a family album as well as a card.'],
      ['Can family members abroad sign?', 'Yes — anyone with the link can contribute from anywhere in the world.'],
      ['Can we pool a gift?', 'Yes — enable the collection and family members contribute when they sign. The gift recipient or organiser withdraws the total.'],
    ],
    blogLinks: [
      ['/blog/why-group-cards-beat-individual-cards', 'Why group cards beat individual cards'],
      ['/blog/group-gifting-work-office-gift-pools', 'Group gifting ideas'],
      ['/blog/birthday-wishes-for-sister-nigeria', 'Heartfelt messages for the women in your life'],
      ['/blog/group-cards-remote-teams-inclusion', 'Group cards for distributed families'],
    ],
  },
  'online-birthday-nigeria': {
    path: '/online-birthday-cards-nigeria',
    title: 'Online Birthday Cards Nigeria — Buy, Personalise & Send Same Day | Thankeeu',
    desc: 'Buy an online birthday card in Nigeria — personalised, delivered instantly, signed by everyone who loves them. No printing, no Lagos traffic, no delivery fees. Add a pooled Naira gift via Flutterwave.',
    keywords: 'online birthday card Nigeria, birthday card Lagos, buy birthday card Nigeria, where to buy birthday card in Nigeria, customised birthday card Nigeria, personalised birthday card Nigeria, birthday card delivery Lagos, send birthday card Nigeria, happy birthday card design Nigeria, birthday card for colleague Nigeria, group birthday card Nigeria, birthday card Abuja',
    h1: 'Online Birthday Cards in Nigeria — Personalised, Instant, Signed by Everyone',
    sub: 'Skip the traffic, the printing and the delivery fees. Create a beautiful birthday card online, get everyone to sign it, and deliver it at midnight — anywhere in Nigeria.',
    useCases: [
      ['Instead of buying a card in Lagos traffic', 'Physical cards in Lagos mean finding a shop, hoping the design is right, and paying ₦2,000–₦15,000 plus delivery. An online card is created in 2 minutes, costs less, and looks exactly how you want it.'],
      ['Same-day and midnight delivery, free', 'Card shops need orders before 10am for same-day delivery — and never deliver on weekends. Thankeeu delivers at the exact minute you choose, any day, at no delivery cost, to any phone in Nigeria.'],
      ['Personalised by everyone, not just you', 'A physical card carries one or two signatures. An online group card carries messages, photos and voice notes from everyone — colleagues, family, friends abroad.'],
      ['With a Naira gift built in', 'Instead of an envelope of cash taped to a card, contributors chip into a secure gift pool via Flutterwave when they sign. The celebrant withdraws to any Nigerian bank.'],
    ],
    faqs: [
      ['Can I send an online birthday card anywhere in Nigeria?', 'Yes — Lagos, Abuja, Port Harcourt, Kano, anywhere with a phone signal. The card is delivered by email and viewable on any device, so there are no delivery zones, no courier fees, and no "we don\'t deliver on Sundays."'],
      ['How is this different from buying a physical birthday card?', 'A physical card is one design, one or two signatures, delivered by dispatch rider if you\'re lucky. An online group card is personalised by everyone who signs it — messages, photos, voice notes — delivered at the exact moment you choose, and kept forever.'],
      ['Can I customise the design?', 'Yes — choose from beautiful designs for every occasion and personality, add a cover photo of the celebrant, and every signer personalises their own message.'],
      ['How much does an online birthday card cost in Nigeria?', 'Free to create and collect messages. A small fee, always shown upfront in Naira, applies when you send. Compare that to ₦2,000–₦15,000 for a premium physical card plus ₦1,500+ delivery in Lagos.'],
    ],
    blogLinks: [
      ['/blog/where-to-buy-birthday-cards-nigeria', 'Where to buy birthday cards in Nigeria'],
      ['/blog/physical-vs-digital-birthday-card-colleague-nigeria', 'Physical vs digital birthday cards compared'],
      ['/blog/birthday-wishes-for-colleague-nigeria-prayers-pidgin', 'Birthday wishes for a Nigerian colleague'],
      ['/blog/how-to-surprise-someone-birthday-nigeria-ideas', 'Birthday surprise ideas that work in Nigeria'],
    ],
  },
  'leaving-card-uk': {
    path: '/leaving-cards-uk',
    title: 'Online Leaving Cards UK — Group Leaving Cards Everyone Signs | Thankeeu',
    desc: 'Create an online leaving card for a UK colleague in under 2 minutes. The whole team signs from one link — messages, photos, GIFs, voice notes — with a leaving gift collection in GBP. Delivered on their last day.',
    keywords: 'online leaving card UK, leaving card for colleague UK, group leaving card UK, virtual leaving card UK, online farewell card UK, leaving collection UK, farewell card everyone signs UK, leaving card free UK',
    h1: 'Online Leaving Cards for UK Teams',
    sub: 'One link. Everyone signs. The leaving collection sorted at the same time. Delivered on their last day at the exact minute you choose.',
    useCases: [
      ['Colleague moving to a new role', 'Every team member signs from one link — office staff, remote workers and the person on annual leave. Messages, photos from team events, and voice notes collected in one card.'],
      ['Leaving gift collection included', 'Enable the optional gift pool and contributors add their message and their contribution at the same time. No separate email, no bank transfer to a personal account, no chasing.'],
      ['Manager or team leader leaving', 'A proper send-off for someone who has led the team — with full-length messages from every direct report, including those in other offices.'],
      ['Someone made redundant', 'A card signed by everyone says: whatever the circumstances, you were valued here. Remote signing means nobody is excluded because they were working from home.'],
    ],
    faqs: [
      ['How much does an online leaving card cost in the UK?', 'Free to create and collect messages. A small fee, shown upfront in GBP, applies when you send. Significantly less than a decent card from a shop, before delivery is added.'],
      ['Can remote colleagues sign?', 'Yes — the link works from any device, anywhere. Your Manchester office, the person on parental leave and the colleague who left last year but wants to sign can all contribute.'],
      ['How does the leaving gift collection work in GBP?', 'Enable the optional collection when creating the card. Contributors pay by debit or credit card in GBP — no personal bank accounts involved. The recipient or organiser withdraws the total directly.'],
      ['When should I create the card?', 'At least a week before their last day, ideally two — this gives everyone time to sign without rushing. Set delivery for their last morning.'],
    ],
    blogLinks: [
      ['/blog/what-to-write-leaving-card-uk', 'What to write in a leaving card (UK)'],
      ['/blog/funny-leaving-card-messages-uk', 'Funny leaving card messages (UK)'],
      ['/blog/leaving-card-messages-colleague-uk', 'Leaving card messages by relationship'],
      ['/blog/collect-money-leaving-gift-uk', 'How to collect money for a leaving gift (UK)'],
    ],
  },
  'birthday-uk': {
    path: '/birthday-cards-uk',
    title: 'Online Birthday Cards UK — Group Birthday Cards for Every Team | Thankeeu',
    desc: 'Create an online birthday group card for a UK colleague in under 2 minutes. Everyone signs from one link — messages, photos, GIFs and voice notes — with a birthday gift collection in GBP. Delivered at midnight.',
    keywords: 'online birthday card UK, group birthday card UK, birthday card for colleague UK, virtual birthday card UK, birthday card everyone signs UK, office birthday card UK, birthday gift collection UK, group ecard UK birthday',
    h1: 'Online Birthday Cards for UK Teams',
    sub: 'Midnight delivery. Every colleague signs. Birthday gift collection in GBP. No carrier bag, no cramped margins.',
    useCases: [
      ['Office birthday cards that actually include everyone', 'The person working from home, the team in another city, the colleague on holiday — they all sign the same card from one link.'],
      ['Birthday gift collection without the awkwardness', 'Contributors add their message and their contribution simultaneously. No chasing bank transfers, no personal accounts, no fixed amounts causing friction.'],
      ['Weekend and weekday birthdays', 'Schedule delivery for midnight on the birthday — any day of the week, including weekends and bank holidays — at no extra cost.'],
      ['Whole-office birthday cards', 'For large organisations, one link handles any number of contributors. Every department, every floor, every office — one card.'],
    ],
    faqs: [
      ['How much does an online birthday card cost in the UK?', 'Free to create and collect messages. A small sending fee shown upfront in GBP — less than a decent card from a shop, with no delivery charge.'],
      ['Can it be delivered at midnight on their birthday?', 'Yes — set any date and time, including midnight, for a surprise the celebrant opens first thing.'],
      ['How does the birthday gift collection work?', 'Enable the pool when creating the card. Everyone pays by debit or credit card in GBP when they sign. The recipient withdraws the total directly.'],
      ['Is this better than a paper birthday card?', 'For groups: yes. Unlimited messages, remote colleagues included, gift collection built in, delivered on time regardless of day of the week.'],
    ],
    blogLinks: [
      ['/blog/birthday-messages-for-colleague-uk', 'Birthday messages for a UK colleague'],
      ['/blog/office-birthday-card-ideas-uk', 'Office birthday card ideas (UK)'],
      ['/blog/birthday-card-messages-uk-colleagues-2025', 'Birthday card messages for UK colleagues'],
      ['/blog/best-online-group-cards-uk-2025', 'Best online group cards UK'],
    ],
  },
  'retirement-uk': {
    path: '/retirement-cards-uk',
    title: 'Online Retirement Cards UK — Group Cards for Retiring Colleagues | Thankeeu',
    desc: 'Create an online retirement group card for a UK colleague — signed by current and former colleagues, with messages, photos, voice notes and an optional retirement gift collection in GBP.',
    keywords: 'online retirement card UK, retirement card for colleague UK, group retirement card UK, virtual retirement card UK, retirement gift collection UK, retirement leaving card UK, retirement card everyone signs UK',
    h1: 'Online Retirement Cards for UK Colleagues',
    sub: 'A career of that length deserves more than a card bought in the petrol station on the way in.',
    useCases: [
      ['Long-service retirements', 'Former colleagues who left years ago can sign alongside current ones — one link works for anyone with the URL, regardless of when they last worked with the retiree.'],
      ['Retirement gift collection in GBP', 'Pool contributions from the whole team into one meaningful retirement gift — no envelopes, no chasing, no personal accounts.'],
      ['Voice notes for a retirement card', 'Hearing familiar voices from a decades-long career is something a paper card cannot do. Every contributor can record a voice note straight from their phone.'],
      ['Delivered at the retirement party or on the last day', 'Schedule the card for the moment it will land most meaningfully — during the party, on the last morning, or at the retirement dinner.'],
    ],
    faqs: [
      ['Can former colleagues sign the retirement card?', 'Yes — anyone with the link can sign, regardless of whether they still work at the organisation. A retiree with a 30-year career may have colleagues from every decade who want to contribute.'],
      ['Is there a limit on how many people can sign?', 'No — retirement cards often have very large signing lists. There is no limit on contributors.'],
      ['How does the retirement gift collection work in GBP?', 'Enable the collection when creating the card. Everyone contributes by card or bank transfer in GBP. The retiree or organiser withdraws the total directly.'],
      ['When should I start the card?', 'At least two weeks before the retirement date — more if you want to invite former colleagues, who may need more time to see the link.'],
    ],
    blogLinks: [
      ['/blog/what-to-write-retirement-card-uk', 'What to write in a retirement card (UK)'],
      ['/blog/retirement-messages-uk-colleague', 'Retirement messages for a UK colleague'],
      ['/blog/work-anniversary-cards-guide', 'Work anniversary and retirement card guide'],
      ['/blog/best-way-celebrate-colleague-leaving-work', 'How to celebrate a colleague leaving'],
    ],
  },
  'get-well-soon-uk': {
    path: '/get-well-soon-cards-uk',
    title: 'Online Get Well Soon Cards UK — Group Cards from the Whole Team | Thankeeu',
    desc: 'Send strength from the whole UK team with an online get well soon card. Everyone signs from one link — messages, photos and voice notes — delivered privately when it matters most.',
    keywords: 'online get well soon card UK, group get well card UK, get well card for colleague UK, virtual get well soon card UK, get well soon card everyone signs UK, get well card UK office',
    h1: 'Get Well Soon Cards from the Whole Team',
    sub: 'One card. Every colleague. Delivered when they need it most — not a flood of individual WhatsApp messages.',
    useCases: [
      ['Serious illness or surgery', 'Coordinate quietly — share the link with colleagues without the recipient knowing, set delivery for when they\'ve had a chance to settle, and let every message arrive together.'],
      ['Long recovery', 'The card stays live — contributors can keep adding messages over weeks, and the recipient can revisit them whenever they need lifting.'],
      ['Remote and hybrid UK teams', 'Colleagues working from home, in other offices and on flexible arrangements all sign the same card from one link.'],
      ['Optional support collection', 'For situations where a financial contribution would be welcome — help with costs or a thoughtful gift — enable the optional pool alongside the card.'],
    ],
    faqs: [
      ['How do I send a get well soon card without overwhelming someone who is unwell?', 'Create the card privately, share the link only with contributors, set delivery for a time when they\'ll have space to read it — not the day of an operation, but a few days later. One card with many messages is much gentler than many individual messages arriving all at once.'],
      ['Can contributors add voice notes?', 'Yes — hearing a familiar voice when you\'re unwell and isolated is genuinely comforting. Anyone can record a voice note from their phone.'],
      ['Do contributors need an account?', 'No — anyone with the link can sign instantly.'],
      ['Can we include a contribution?', 'Yes — enable the optional gift pool for practical help alongside the messages.'],
    ],
    blogLinks: [
      ['/blog/get-well-soon-messages-uk-colleague', 'Get well soon messages for a UK colleague'],
      ['/blog/get-well-soon-messages-colleague-friend-nigeria', 'Get well soon messages — what to write'],
      ['/blog/why-group-cards-beat-individual-cards', 'Why group cards beat individual messages'],
      ['/blog/group-cards-remote-teams-inclusion', 'Group cards for remote and hybrid teams'],
    ],
  },
  'fathers-day': {
    path: '/cards/fathers-day',
    title: "Online Father's Day Card — Group Cards from the Whole Family | Thankeeu",
    desc: "Create a Father's Day card the whole family signs from one link — messages, photos, voice notes and memories. Pool a gift together. Delivered on Father's Day.",
    keywords: "online father's day card, group father's day card, father's day card from family, virtual father's day card, happy father's day card everyone signs, father's day gift collection family",
    h1: "Father's Day Cards from the Whole Family",
    sub: 'Every kid. Every grandkid. Everyone who wants to say they\'re grateful — in one card he\'ll keep for years.',
    useCases: [
      ['Kids coordinating a surprise', 'Siblings can secretly set up the card, invite family members, and schedule it to deliver at a specific time on Father\'s Day morning.'],
      ['Grandchildren to grandfather', 'The whole extended family signs one card — messages, drawings, old photos — creating something far more meaningful than any individual gift.'],
      ['Pooled gift from the family', 'Pool contributions for one experience or meaningful gift instead of everyone buying separately.'],
      ['Stepfathers, father figures and mentors', 'The card works for anyone who has been a father figure — coaches, uncles, family friends who stepped in. It\'s about the relationship.'],
    ],
    faqs: [
      ["When is Father's Day in the US?", "The third Sunday of June. Start the card one to two weeks out to collect everyone's messages before delivery day."],
      ['Can we make it a surprise?', 'Yes — share the link only with contributors and schedule delivery for Father\'s Day morning. The recipient never sees the card until it arrives.'],
      ['Can family members in other states sign?', 'Yes — the link works from anywhere, on any device, with no account needed.'],
      ['Can we include a gift?', 'Yes — enable the collection pot and family members contribute when they sign.'],
    ],
    blogLinks: [
      ['/blog/why-group-cards-beat-individual-cards', 'Why group cards beat individual cards'],
      ['/blog/group-gifting-work-office-gift-pools', 'Group gifting ideas'],
      ['/blog/birthday-wishes-for-brother-nigeria', 'Heartfelt messages for the men in your life'],
      ['/blog/group-cards-remote-teams-inclusion', 'Group cards for distributed families'],
    ],
  },
};

export default function ExtraOccasionPage({ occasion }) {
  const d = OCCASIONS[occasion];

  useSEO({
    title: d.title,
    description: d.desc,
    keywords: d.keywords,
    canonical: d.path,
    jsonLd: [
      SCHEMAS.organization,
      SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }, { name: d.h1, url: d.path }]),
      SCHEMAS.webPage(d.title, d.desc, d.path),
      {
        '@type': 'FAQPage',
        mainEntity: d.faqs.map(([q, a]) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
    ],
  });

  const STEPS = [
    { n: '1', title: 'Create the card', body: 'Choose an occasion, pick a design, and set your delivery date. Done in under 2 minutes.' },
    { n: '2', title: 'Share one link', body: 'Send the link by WhatsApp, Slack, email or text. Anyone can sign — no account needed.' },
    { n: '3', title: 'Everyone signs', body: 'Contributors add personal messages, photos, GIFs and voice notes at their own pace.' },
    { n: '4', title: 'Deliver perfectly', body: 'Schedule exact delivery by email. Optionally add a pooled gift — withdrawn straight to any bank.' },
  ];

  const FEATURES = [
    { icon: '✉️', title: 'No account needed to sign', body: 'Anyone with the link can add a message instantly — no registration, no app download.' },
    { icon: '📸', title: 'Photos, GIFs & voice notes', body: 'Contributors personalise their message with photos, GIFs, or a voice recording right from their phone.' },
    { icon: '⏰', title: 'Scheduled delivery', body: 'Set the exact date and time for the card to arrive — midnight on their birthday, 9am on their first day.' },
    { icon: '🎁', title: 'Built-in gift collection', body: 'Enable an optional gift pool. Contributors add their message and chip in — paid securely via Flutterwave.' },
    { icon: '🌍', title: 'Works for remote teams', body: 'The link works from anywhere in the world. Nobody gets left out because they work from home or another country.' },
    { icon: '🔒', title: 'Private delivery', body: 'The recipient only sees the card when you send it — contributors sign without the recipient ever knowing.' },
  ];

  const STATS = [
    { n: '69%', label: 'of employees say they\'d work harder if they felt better recognised — Gallup' },
    { n: '40%', label: 'of people say recognition is more motivating than a pay rise — McKinsey' },
    { n: '5×', label: 'higher employee engagement at companies with strong recognition cultures — Deloitte' },
    { n: '2bn+', label: 'greeting cards sent globally every year — Greeting Card Association' },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* ── Hero ── */}
      <section className="bg-gradient-to-b from-primary-50 to-white pt-14 pb-12 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-warm-900 mb-4 leading-tight">{d.h1}</h1>
          <p className="text-lg text-warm-600 mb-8 max-w-2xl mx-auto">{d.sub}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/card/new" className="btn-primary px-8 py-3 text-lg">Create a card — free to start</Link>
            <Link to="/sample" className="btn-secondary px-8 py-3 text-lg">See a live demo</Link>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-2 text-center">How it works</h2>
        <p className="text-warm-500 text-center mb-10">Set up in minutes. Your group does the rest.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map(s => (
            <div key={s.n} className="bg-primary-50 rounded-2xl p-6 text-center">
              <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-extrabold text-lg mx-auto mb-4">{s.n}</div>
              <p className="font-bold text-warm-900 mb-2">{s.title}</p>
              <p className="text-sm text-warm-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Perfect for (use cases) ── */}
      <section className="bg-gray-50 py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-2 text-center">Perfect for</h2>
          <p className="text-warm-500 text-center mb-10">Every occasion where a group wants to say something that matters.</p>
          <div className="grid sm:grid-cols-2 gap-6">
            {d.useCases.map(([title, body]) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="font-bold text-warm-900 mb-2">{title}</p>
                <p className="text-sm text-warm-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why digital beats paper ── */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-4">A digital group card beats paper, every time</h2>
            <p className="text-warm-600 mb-4 leading-relaxed">A paper card gets passed around, runs out of space, and gets left out entirely for anyone who works remotely. Someone always misses it. The handwriting is cramped. The gift envelope is separate.</p>
            <p className="text-warm-600 mb-4 leading-relaxed">With Thankeeu, everyone signs from their own phone from wherever they are — messages as long as they want, photos, voice notes, GIFs. The card delivers at the exact moment you choose and stays accessible forever. The recipient can go back to it on a difficult day, months or years later.</p>
            <p className="text-warm-600 leading-relaxed">And there's no envelope of cash to chase — the gift pool collects automatically when people sign, and withdraws straight to a bank account.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Paper card', ['Limited space', 'Only office staff sign', 'Gift collected separately', 'Lost or thrown away', 'No scheduled delivery']],
              ['Thankeeu', ['Unlimited messages', 'Remote team included', 'Gift pool built-in', 'Kept forever online', 'Delivered at perfect moment']],
            ].map(([label, points]) => (
              <div key={label} className={`rounded-2xl p-5 ${label === 'Thankeeu' ? 'bg-primary-50 border-2 border-primary-200' : 'bg-gray-50 border border-gray-200'}`}>
                <p className={`font-bold text-sm mb-3 ${label === 'Thankeeu' ? 'text-primary-700' : 'text-warm-500'}`}>{label}</p>
                <ul className="space-y-2">
                  {points.map(p => (
                    <li key={p} className="flex items-start gap-2 text-sm">
                      <span className={label === 'Thankeeu' ? 'text-green-500' : 'text-red-400'}>{label === 'Thankeeu' ? '✓' : '✗'}</span>
                      <span className="text-warm-700">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="bg-primary-600 py-12 px-4">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">
          {STATS.map(s => (
            <div key={s.n}>
              <p className="text-4xl font-extrabold mb-2">{s.n}</p>
              <p className="text-sm text-primary-100 leading-relaxed">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-2 text-center">Everything a group card can do</h2>
        <p className="text-warm-500 text-center mb-10">Every feature included. No hidden extras.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <span className="text-2xl mb-3 block">{f.icon}</span>
              <p className="font-bold text-warm-900 mb-2">{f.title}</p>
              <p className="text-sm text-warm-600 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mid-page CTA ── */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-500 py-12 px-4 text-center text-white">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to create yours?</h2>
        <p className="text-primary-100 mb-7 max-w-xl mx-auto">Free to start. No account needed to sign. Takes under 2 minutes to set up.</p>
        <Link to="/card/new" className="inline-block bg-white text-primary-700 font-bold px-8 py-3 rounded-xl hover:bg-primary-50 transition-colors text-lg">Create a group card now</Link>
      </section>

      {/* ── Related guides ── */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-warm-900 mb-8 text-center">Related guides &amp; ideas</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {d.blogLinks.map(([href, label]) => (
            <Link key={href} to={href} className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:border-primary-200 hover:shadow-md transition-all group">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex-shrink-0 flex items-center justify-center text-primary-600 font-bold text-lg group-hover:bg-primary-100 transition-colors">→</div>
              <span className="text-sm font-semibold text-warm-800 group-hover:text-primary-700 transition-colors">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-gray-50 py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-8 text-center">Frequently asked questions</h2>
          <div className="space-y-4">
            {d.faqs.map(([q, a]) => (
              <details key={q} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <summary className="font-semibold text-warm-900 cursor-pointer text-base leading-snug">{q}</summary>
                <p className="text-sm text-warm-600 mt-4 leading-relaxed">{a}</p>
              </details>
            ))}
            {/* Generic platform FAQs — same on every card page */}
            <details className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <summary className="font-semibold text-warm-900 cursor-pointer text-base leading-snug">How much does an online group card cost?</summary>
              <p className="text-sm text-warm-600 mt-4 leading-relaxed">Free to create and collect messages. A small fee applies when you send or activate the card, always shown upfront before you pay. Teams get unlimited cards on a subscription — see <Link to="/pricing" className="text-primary-600 hover:underline">Pricing</Link>.</p>
            </details>
            <details className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <summary className="font-semibold text-warm-900 cursor-pointer text-base leading-snug">Does the recipient need an account to view their card?</summary>
              <p className="text-sm text-warm-600 mt-4 leading-relaxed">No — the recipient gets a link by email. They click it and see the full card immediately, with every message, photo, GIF and voice note. No login, no app download.</p>
            </details>
            <details className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <summary className="font-semibold text-warm-900 cursor-pointer text-base leading-snug">How do group gift contributions work?</summary>
              <p className="text-sm text-warm-600 mt-4 leading-relaxed">Enable the optional gift pool when creating the card. Contributors add their message and chip in any amount by card, bank transfer or USSD (via Flutterwave). The organiser or recipient withdraws the total to any bank account. No personal account involved — all pooled securely on the card itself.</p>
            </details>
            <details className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <summary className="font-semibold text-warm-900 cursor-pointer text-base leading-snug">Can I schedule the card to send at a specific time?</summary>
              <p className="text-sm text-warm-600 mt-4 leading-relaxed">Yes — set the exact date and time and Thankeeu delivers it at that moment, in any time zone. Midnight on their birthday, 9am on their first day, 5pm on their last Friday — you choose.</p>
            </details>
            <details className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <summary className="font-semibold text-warm-900 cursor-pointer text-base leading-snug">Is there a limit on how many people can sign?</summary>
              <p className="text-sm text-warm-600 mt-4 leading-relaxed">No — there's no limit on contributors. Whole companies, school classes, extended families — everyone gets a space for their message.</p>
            </details>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-extrabold text-warm-900 mb-4">Create yours in under 2 minutes</h2>
        <p className="text-warm-600 mb-8 max-w-lg mx-auto">Free to start. No account needed to sign. Works for teams of any size, anywhere in the world.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/card/new" className="btn-primary px-8 py-3 text-lg">Start your group card</Link>
          <Link to="/how-it-works" className="btn-secondary px-8 py-3 text-lg">How it works</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export function LeavingCardPage()   { return <ExtraOccasionPage occasion="leaving-card" />; }
export function RetirementPage()    { return <ExtraOccasionPage occasion="retirement" />; }
export function GetWellSoonPage()   { return <ExtraOccasionPage occasion="get-well-soon" />; }
export function ThankYouCardPage()  { return <ExtraOccasionPage occasion="thank-you" />; }
export function MaternityLeavePage(){ return <ExtraOccasionPage occasion="maternity-leave" />; }
export function ChristmasCardPage() { return <ExtraOccasionPage occasion="christmas" />; }
// UK Tier 1
export function SympathyCardPage()           { return <ExtraOccasionPage occasion="sympathy" />; }
export function WelcomeCardPage()            { return <ExtraOccasionPage occasion="welcome" />; }
export function GoodLuckCardPage()           { return <ExtraOccasionPage occasion="good-luck" />; }
export function BabyShowerCardPage()         { return <ExtraOccasionPage occasion="baby-shower" />; }
export function TeacherThankYouPage()        { return <ExtraOccasionPage occasion="teacher-thank-you" />; }
export function EngagementCardPage()         { return <ExtraOccasionPage occasion="engagement" />; }
export function NewHomeCardPage()            { return <ExtraOccasionPage occasion="new-home" />; }
// US Tier 1
export function AdminProfessionalsDayPage()  { return <ExtraOccasionPage occasion="administrative-professionals-day" />; }
export function BossDayPage()                { return <ExtraOccasionPage occasion="boss-day" />; }
export function TeacherAppreciationPage()    { return <ExtraOccasionPage occasion="teacher-appreciation" />; }
export function ThanksgivingCardPage()       { return <ExtraOccasionPage occasion="thanksgiving" />; }
export function MothersDayCardPage()         { return <ExtraOccasionPage occasion="mothers-day" />; }
export function FathersDayCardPage()         { return <ExtraOccasionPage occasion="fathers-day" />; }
export function OnlineBirthdayNigeriaPage()  { return <ExtraOccasionPage occasion="online-birthday-nigeria" />; }
// UK-specific occasion pages
export function LeavingCardUKPage()          { return <ExtraOccasionPage occasion="leaving-card-uk" />; }
export function BirthdayCardUKPage()         { return <ExtraOccasionPage occasion="birthday-uk" />; }
export function RetirementCardUKPage()       { return <ExtraOccasionPage occasion="retirement-uk" />; }
export function GetWellSoonUKPage()          { return <ExtraOccasionPage occasion="get-well-soon-uk" />; }
