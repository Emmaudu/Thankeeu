import { useSEO, SCHEMAS } from '../../hooks/useSEO';
import Icon from '../../components/ui/Icon';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import PriorityDesignGallery from '../../components/PriorityDesignGallery';

const BASE = 'https://www.thankeeu.com';

const OCCASIONS = {
  birthday: {
    title: 'Online Birthday Group Cards — Everyone Signs in Minutes',
    h1: 'Send a Group Birthday Card — Everyone Signs in Minutes',
    emoji: 'Cake',
    tagline: 'Make their birthday unforgettable — the whole team, in one card',
    desc: 'Create an online birthday group card that everyone signs from their phone. Add photos, voice notes, and a pooled gift in any currency. Delivered at the perfect moment — anywhere in the world.',
    keywords: 'online birthday group card, group birthday card, birthday card everyone signs, virtual birthday card, office birthday card, birthday card for colleague, personalised birthday card online, birthday card delivery, send birthday card online, group birthday gift pool, digital birthday card, team birthday card',
    color: '#E84393', accent: '#FF6FB7', gradient: 'linear-gradient(135deg,#FF6FB7 0%,#7C6EFF 100%)',
    bg: '#FFF0F7', cardBg: 'linear-gradient(135deg,#FF6FB7,#E84393)', inkColor: '#fff',
    signers: 24, amount: '$850', sampleTitle: "Alex's 30th Birthday ",
    messages: [
      { name: 'Sarah O.', text: 'You deserve every bit of this! ', type: 'text' },
      { name: 'Mike K.', text: 'Voice note (0:18)', type: 'voice' },
      { name: 'Jamie B.', text: '', type: 'gif', gif: '' },
      { name: 'Tom A.', text: 'Congrats! Drinks on you ', type: 'text' },
      { name: 'Nina P.', text: 'Photo memory', type: 'photo', emoji: '' },
      { name: 'Chris S.', text: '30 looks SO good on you!', type: 'text' },
    ],
    heroBullets: [
      'Works for birthdays at the office, at home, and remotely',
      'Anyone can sign — just share the link via email or messaging app',
      'Pool a gift contribution in any currency from the whole team or family',
      'Schedule delivery to land exactly at midnight on their birthday',
    ],
    whySection: {
      heading: 'Why Teams Worldwide Choose Thankeeu for Birthday Group Cards',
      points: [
        { icon: 'MessageCircle', title: 'Share via Link — No App Needed', body: 'One link does it all. Your colleague across town and your friend on the other side of the world can both sign the same card from their phone — no downloads, no login required.' },
        { icon: 'CreditCard', title: 'Pay in Any Currency', body: 'Gift contributions work with all major payment methods worldwide — credit cards, debit cards, and local payment options. No currency headaches for global teams.' },
        { icon: 'Mic', title: 'Voice Notes That Give Goosebumps', body: 'This is what sets Thankeeu apart. A recorded voice message from a colleague or loved one lands differently. People are sending voice messages daily — now they can do it on a birthday card.' },
        { icon: 'Clock', title: 'Scheduled Delivery at Midnight', body: 'Be the first to wish them happy birthday. Set the card to deliver at 12:00am on their birthday, and they wake up to the most beautiful surprise of their day.' },
      ],
    },
    useCases: ['Office birthday card for colleagues', 'Family birthday card that everyone signs', '30th or 40th milestone birthday surprise', 'Remote team birthday celebrations', 'Boss birthday card from the whole department'],
    faqs: [
      { q: 'How do I create an online birthday group card?', a: 'Go to thankeeu.com, click "Create a card", choose Birthday, enter the recipient\'s name and email, then share the link via email or your preferred messaging app. Anyone can sign without creating an account.' },
      { q: 'Can everyone sign the card from their phone?', a: 'Yes. Thankeeu works on any smartphone — iPhone or Android. No app download is needed. Just open the link and sign.' },
      { q: 'How do we contribute money to a birthday gift?', a: 'When you create a card, you can enable a gift pot. Everyone who signs can add any amount using their preferred payment method — credit card, debit card, or local options. The total is pooled and the birthday person can withdraw to their account.' },
      { q: 'Can I schedule the birthday card to be delivered on the exact day?', a: 'Yes. When setting up the card, you choose the delivery date and time. Thankeeu will send it automatically at midnight or any time you set — even if you are asleep.' },
      { q: 'Does Thankeeu work for office birthday cards across different locations?', a: 'Absolutely. Teams across cities, countries, and continents use Thankeeu daily. It is designed for modern distributed offices and remote teams.' },
    ],
    seoMicrocopy: 'Used by teams across the US, UK, Canada, Australia, and beyond.',
    cta: 'Start a Birthday Group Card',
  },

  farewell: {
    title: 'Online Farewell Group Cards — The Whole Team Signs in One Place',
    h1: 'Send a Group Farewell Card — The Whole Team Signs in One Place',
    emoji: '',
    tagline: "Send them off with love they'll never forget",
    desc: "When a colleague leaves your company, don't let them go without a proper send-off. One Thankeeu link, the whole team signs — messages, photos, voice notes, and a pooled going-away gift.",
    keywords: 'farewell group card, going away card colleagues, farewell card for colleague, leaving card online, group farewell gift pool, goodbye card colleague, online leaving card, farewell message colleague, farewell card work, staff farewell card, virtual farewell card, farewell group ecard',
    color: '#7C6EFF', accent: '#A78BFA', gradient: 'linear-gradient(135deg,#7C6EFF 0%,#5B4BDF 100%)',
    bg: '#F5F3FF', cardBg: 'linear-gradient(135deg,#7C6EFF,#5B4BDF)', inkColor: '#fff',
    signers: 42, amount: '$1,200', sampleTitle: "Jordan's Farewell ",
    messages: [
      { name: 'Lisa A.', text: 'We will genuinely miss you around here!', type: 'text' },
      { name: 'Mark R.', text: 'Heartfelt voice note (0:32)', type: 'voice' },
      { name: 'Priya M.', text: '', type: 'gif', gif: '' },
      { name: 'Emma N.', text: 'Our team outing memory', type: 'photo', emoji: '' },
      { name: 'James K.', text: 'All the best in the next chapter ', type: 'text' },
      { name: 'HR Team', text: 'From all of us — thank you. ', type: 'text' },
    ],
    heroBullets: [
      'Perfect for colleagues leaving for a new job, relocating, or retiring',
      'Share via email or messaging app — remote and on-site team members all sign together',
      'Pool a leaving gift in any currency — no awkward cash collection',
      'Add team photos and voice notes to make it a lasting memory',
    ],
    whySection: {
      heading: 'Why Teams Use Thankeeu for Farewell Cards',
      points: [
        { icon: 'Users', title: 'No More Chasing People to Sign', body: 'Share one link via email or Slack and everyone signs at their own time. No more walking around the office with a card, asking people to write something.' },
        { icon: 'Globe', title: 'Works for Remote & Hybrid Teams', body: 'Your colleague working from home can sign. The one in another city can add a voice note. The remote team member abroad can contribute to the gift. Thankeeu brings the whole team together from anywhere.' },
        { icon: 'Gift', title: 'Collect the Going-Away Gift Digitally', body: 'Instead of a shared bank account or awkward cash contributions, Thankeeu\'s gift pot lets every team member contribute securely online. The leaver withdraws the money directly to their own account.' },
        { icon: 'Heart', title: 'A Farewell They\'ll Keep Forever', body: 'When someone opens a Thankeeu farewell card with 40+ messages, photos and voice notes from their team, it becomes one of the most meaningful keepsakes from their career.' },
      ],
    },
    useCases: ['Employee resignation farewell', 'Relocation send-off card', 'End of internship farewell card', 'Colleague leaving for abroad — going away card', 'Retirement farewell from the whole department'],
    faqs: [
      { q: 'How do I create a farewell group card for a colleague?', a: 'Visit thankeeu.com, click "Create a card", select Farewell, fill in the colleague\'s details, and share the signing link with the team via email or messaging app. No account needed to sign.' },
      { q: 'What should I write in a farewell card for a colleague?', a: 'Keep it personal — mention a shared memory, what you admired about them, or a wish for their next chapter. Thankeeu lets everyone write their own heartfelt message.' },
      { q: 'Can we pool a going-away gift using Thankeeu?', a: 'Yes. The gift pot feature lets every team member contribute any amount. The recipient withdraws the full amount directly to their bank account.' },
      { q: 'How many people can sign a farewell card on Thankeeu?', a: 'Unlimited. We have had farewell cards signed by over 200 people. There is no cap on signers or message length.' },
    ],
    seoMicrocopy: 'Used by companies across the US, UK, Canada, Australia, and worldwide.',
    cta: 'Create a Farewell Group Card',
  },

  anniversary: {
    title: 'Work Anniversary Group Cards — Automated for Your Whole Team',
    h1: 'Celebrate Work Anniversaries as a Team — Automated Group Cards',
    emoji: 'Gift',
    tagline: 'Recognise loyalty and years of service — together',
    desc: 'Work anniversaries deserve more than a Slack message. Create an automatic work anniversary group card signed by the whole team, with messages, photos, and a pooled gift — worldwide.',
    keywords: 'work anniversary group card, staff anniversary card, employee years of service card, work anniversary gift pool, employee recognition, staff appreciation card, 1 year work anniversary, 5 year work anniversary, work anniversary message, online anniversary card colleague, employee milestone card, HR anniversary automation',
    color: '#F59E0B', accent: '#FBBF24', gradient: 'linear-gradient(135deg,#F59E0B 0%,#D97706 100%)',
    bg: '#FFFBEB', cardBg: 'linear-gradient(135deg,#FBBF24,#F59E0B)', inkColor: '#1c1917',
    signers: 18, amount: '$500', sampleTitle: "Sarah's 5-Year Anniversary ",
    messages: [
      { name: 'CEO', text: '5 incredible years. We are grateful! ', type: 'text' },
      { name: 'David F.', text: 'Special tribute (0:45)', type: 'voice' },
      { name: 'Rachel S.', text: '', type: 'gif', gif: '' },
      { name: 'Sales Team', text: ' 5-year team photo', type: 'photo', emoji: '' },
      { name: 'HR Lead', text: 'Your dedication inspires us all!', type: 'text' },
      { name: 'Tom N.', text: "Here's to 5 more amazing years ", type: 'text' },
    ],
    heroBullets: [
      'Recognise 1, 3, 5, 10-year milestones the right way',
      'HR teams can automate anniversary cards with Thankeeu for Teams',
      'Pool an appreciation gift from the whole company in any currency',
      'Whole team signs via one link — no app needed',
    ],
    whySection: {
      heading: 'Why Companies Use Thankeeu for Work Anniversary Cards',
      points: [
        { icon: 'Calendar', title: 'Never Miss Another Anniversary', body: 'With Thankeeu for Teams, HR sets up anniversary automation once. The platform detects upcoming anniversaries from your employee data and triggers the group card automatically.' },
        { icon: 'Star', title: 'Turn Loyalty into a Moment', body: 'Employees work hard. A 5-year anniversary is a big deal. A group card signed by colleagues and leadership — with personal messages and a gift — makes them feel truly seen.' },
        { icon: 'CheckCircle', title: 'Improve Staff Retention', body: 'Recognised employees stay longer. Work anniversary cards are one of the simplest, highest-impact employee retention tools any HR team can implement.' },
        { icon: 'CheckCircle', title: 'Integrates with Leading HR Systems', body: 'Thankeeu connects with BambooHR, Workday, ADP, Zoho People, SAP SuccessFactors, and more — the HR tools already used by companies worldwide.' },
      ],
    },
    useCases: ['1-year staff anniversary recognition', '5-year loyalty milestone card', '10-year long service award card', 'Automated HR anniversary cards for large teams', 'CEO appreciation card from the whole company'],
    faqs: [
      { q: 'How do I create a work anniversary group card for an employee?', a: 'Visit thankeeu.com, click "Create a card", choose Anniversary, enter the employee\'s name and delivery date. Share the signing link with their team. Thankeeu delivers it automatically on the date you set.' },
      { q: 'Can Thankeeu automate work anniversary cards for my whole company?', a: 'Yes. Thankeeu for Teams connects with your HRIS (BambooHR, Workday, SAP SuccessFactors, etc.) and automatically creates and sends anniversary cards for every employee on the right date — no manual work.' },
      { q: 'What is a good work anniversary message for an employee?', a: 'Mention their specific contributions, how they\'ve grown, and what they mean to the team. Something like: "5 years of showing up and giving your best — this company is better because of you." Personal is always better than generic.' },
      { q: 'Can we add a gift to the work anniversary card?', a: 'Yes. The Thankeeu gift pot lets team members and leadership contribute any amount. The employee withdraws the total directly to their bank account.' },
    ],
    seoMicrocopy: 'Trusted by companies using BambooHR, Workday, ADP, and SAP SuccessFactors.',
    cta: 'Create a Work Anniversary Card',
  },

  promotion: {
    title: 'Promotion Congratulations Group Cards — Celebrate the Win Together',
    h1: 'Group Promotion Congratulations Card — Celebrate the Win Together',
    emoji: 'PartyPopper',
    tagline: "Cheer their hard-earned promotion — the whole team, one card",
    desc: "A promotion is a big deal. Celebrate it properly with a Thankeeu group card signed by the entire team — personal messages, photos, voice notes, and a pooled congratulations gift.",
    keywords: 'group promotion congratulations card, congratulations card for promotion, colleague promotion gift, online promotion card, congratulations on new role, team congratulations card, promotion celebration card, staff promotion card, promotion message colleague, promotion group ecard, promotion announcement card, congrats card for promotion',
    color: '#10B981', accent: '#34D399', gradient: 'linear-gradient(135deg,#10B981 0%,#059669 100%)',
    bg: '#ECFDF5', cardBg: 'linear-gradient(135deg,#34D399,#10B981)', inkColor: '#fff',
    signers: 31, amount: '$750', sampleTitle: "Maya's Promotion to Lead ",
    messages: [
      { name: 'CEO', text: 'Truly well-deserved. Onwards and upwards! ', type: 'text' },
      { name: 'Dev Team', text: 'Congratulations song (0:22)', type: 'voice' },
      { name: 'Design', text: '', type: 'gif', gif: '' },
      { name: 'Marketing', text: 'Celebration selfie!', type: 'photo', emoji: '' },
      { name: 'HR Team', text: 'You earned every bit of this!', type: 'text' },
      { name: 'Sam O.', text: "Watch out world — she's on the move! ", type: 'text' },
    ],
    heroBullets: [
      'Celebrate a new role, new title, or new responsibility the right way',
      'Share the signing link via email — the whole team contributes',
      'Pool a congratulations gift from everyone in any currency',
      'Time the card to arrive right when the announcement is made',
    ],
    whySection: {
      heading: 'Why Teams Use Thankeeu for Promotion Celebrations',
      points: [
        { icon: 'CheckCircle', title: 'Make the Moment Feel Real', body: 'Getting promoted is exciting. A card with 30+ personal messages from colleagues — including a voice note from the CEO — turns an email announcement into a memory they will talk about for years.' },
        { icon: 'CheckCircle', title: 'Leadership Sets the Culture', body: 'When the CEO contributes a personal message to a promotion card, it signals that achievement is celebrated at every level. Companies that do this consistently have stronger workplace cultures.' },
        { icon: 'CheckCircle', title: 'Pool a Meaningful Gift Instantly', body: 'Instead of quietly hoping someone organises a celebration, Thankeeu lets the team chip in an amount that adds up to a real, meaningful gift — no awkward organising required.' },
        { icon: 'Linkedin', title: 'A Card They\'ll Share on LinkedIn', body: 'People celebrate their wins online. A beautifully designed Thankeeu card with messages from the whole team is something they will screenshot and share on LinkedIn — great for your employer brand too.' },
      ],
    },
    useCases: ['New job title celebration', 'Senior role promotion card', 'Team lead or manager promotion', 'Director or VP appointment card', 'Congratulations on new job offer'],
    faqs: [
      { q: 'How do I create a congratulations card for a colleague\'s promotion?', a: 'Visit thankeeu.com, select Promotion, fill in the colleague\'s name and new role, then share the signing link with the team via email or messaging app. No account needed to sign.' },
      { q: 'What should I write in a promotion congratulations card?', a: 'Mention why they deserved it — a specific skill, their attitude, or a result they achieved. Specific messages are 10x more meaningful than generic ones.' },
      { q: 'Can I schedule the promotion card to arrive at the same time as the announcement?', a: 'Yes. Set the delivery date and time when creating the card. If the promotion announcement is at 2pm, schedule the Thankeeu card to arrive at 2:05pm as a beautiful follow-up surprise.' },
      { q: 'Can we add a cash gift to the promotion congratulations card?', a: 'Yes. Enable the gift pot and every team member can contribute any amount. The promoted colleague withdraws it directly to their account.' },
    ],
    seoMicrocopy: 'Celebrated by teams across tech, finance, healthcare, and companies worldwide.',
    cta: 'Create a Promotion Congratulations Card',
  },

  wedding: {
    title: 'Wedding Congratulations Group Cards — Sign as a Team, Gift Together',
    h1: 'Group Wedding Congratulations Card — Sign as a Team, Gift Together',
    emoji: 'PartyPopper',
    tagline: 'Celebrate love from the whole team — no awkward cash collection',
    desc: 'Send a beautiful wedding congratulations group card. Everyone on the team or in the family adds their warmest wishes, and you pool a wedding gift in any currency — all in one place.',
    keywords: 'wedding congratulations group card, group wedding gift pool, online wedding card colleagues, team wedding card, wedding congratulations message, wedding gift contribution, congratulations on your wedding, digital wedding card, group wedding ecard, wedding card everyone signs',
    color: '#EC4899', accent: '#F472B6', gradient: 'linear-gradient(135deg,#EC4899 0%,#DB2777 100%)',
    bg: '#FDF2F8', cardBg: 'linear-gradient(135deg,#F472B6,#EC4899)', inkColor: '#fff',
    signers: 37, amount: '$2,000', sampleTitle: "Tom & Zara's Wedding ",
    messages: [
      { name: 'Team Lead', text: 'Wishing you a lifetime of happiness! ', type: 'text' },
      { name: 'Claire A.', text: 'Wedding toast voice note (0:40)', type: 'voice' },
      { name: 'Sophie O.', text: '', type: 'gif', gif: '' },
      { name: 'Engineering', text: 'Office send-off photo!', type: 'photo', emoji: '' },
      { name: 'Finance Team', text: 'May your bond grow stronger each day!', type: 'text' },
      { name: 'HR Team', text: 'From all of us — congratulations! ', type: 'text' },
    ],
    heroBullets: [
      'Works for civil ceremonies, religious weddings, and destination celebrations',
      'Share via email or messaging — friends, family and colleagues all sign together',
      'Pool a wedding gift contribution in any currency — no cash awkwardness',
      'Add blessings and voice notes from family members who cannot attend',
    ],
    whySection: {
      heading: 'Why People Choose Thankeeu for Wedding Congratulations Cards',
      points: [
        { icon: 'CheckCircle', title: 'Personal Blessings in Their Voice', body: 'A blessing from a parent or grandparent means everything. Thankeeu\'s voice note feature lets family members record their wedding wishes in their own voice — a keepsake for life.' },
        { icon: 'CheckCircle', title: 'No More Gift Collection Drama', body: 'Collecting wedding contributions informally is chaotic. Thankeeu\'s gift pot organises everything — everyone contributes securely online, and the couple sees the total and withdraws it cleanly.' },
        { icon: 'CheckCircle', title: 'Works for All Wedding Styles', body: 'Whether it\'s a civil ceremony, religious wedding, destination celebration, or intimate gathering — a Thankeeu card brings everyone together with the right message.' },
        { icon: 'CheckCircle', title: 'Family Everywhere Can Sign', body: 'Relatives in other countries, friends who cannot make the journey — they can all sign the card and contribute to the gift from anywhere in the world.' },
      ],
    },
    useCases: ['Colleague wedding card from the office team', 'Family wedding congratulations group card', 'Church or civil wedding team card', 'Wedding gift pool from colleagues', 'Long-distance family wedding card'],
    faqs: [
      { q: 'How do I create a wedding congratulations group card?', a: 'Visit thankeeu.com, click "Create a card", choose Wedding, enter the couple\'s details, then share the link via email with family, friends, and colleagues. Everyone signs without needing an account.' },
      { q: 'Can we pool a wedding gift using Thankeeu?', a: 'Yes. The gift pot allows any number of contributors to send any amount. The couple withdraws the total directly to their bank account.' },
      { q: 'Can family members abroad contribute to a wedding gift on Thankeeu?', a: 'Yes. Contributors can pay in their local currency. Family anywhere in the world can all contribute to the same wedding gift pot.' },
      { q: 'How many people can sign a wedding congratulations card?', a: 'Unlimited. We have seen wedding cards with 100+ family members, friends, and colleagues all signing together.' },
    ],
    seoMicrocopy: 'Loved by office teams, families, and communities worldwide.',
    cta: 'Create a Wedding Congratulations Card',
  },

  graduation: {
    title: 'Graduation Congratulations Group Cards — Celebrate Their Degree Together',
    h1: 'Online Graduation Group Card — Celebrate Their Degree Together',
    emoji: 'PartyPopper',
    tagline: "Honour their greatest academic achievement — everyone cheers at once",
    desc: "Years of sleepless nights and hard work led to this moment. A Thankeeu graduation group card lets family, friends and community celebrate together — with messages, photos, voice notes, and a cash gift.",
    keywords: 'graduation congratulations group card, graduation card online, congratulations on your degree, graduation gift pool, university graduation card, graduation message, family graduation card, graduation celebration, online graduation card, graduation group ecard',
    color: '#6366F1', accent: '#818CF8', gradient: 'linear-gradient(135deg,#6366F1 0%,#4F46E5 100%)',
    bg: '#EEF2FF', cardBg: 'linear-gradient(135deg,#818CF8,#6366F1)', inkColor: '#fff',
    signers: 29, amount: '$900', sampleTitle: "Chris's Graduation Day ",
    messages: [
      { name: 'Mum ', text: 'We are beyond proud of you, my child!', type: 'text' },
      { name: 'Dad', text: 'Special message (1:02)', type: 'voice' },
      { name: 'Best Friends', text: '', type: 'gif', gif: '' },
      { name: 'Course Mates', text: 'Graduation day photo!', type: 'photo', emoji: '' },
      { name: 'Ben A.', text: 'Future doctor in the making! ', type: 'text' },
      { name: 'Aunt Linda', text: 'This degree belongs to all of us ', type: 'text' },
    ],
    heroBullets: [
      'Perfect for university graduation, Masters, MBA, and professional certifications',
      'Entire family signs from anywhere — no group chat coordination needed',
      'Pool a graduation cash gift from family and friends in any currency',
      'Parents record their congratulations in their own voice — a keepsake forever',
    ],
    whySection: {
      heading: 'Why Families Use Thankeeu for Graduation Cards',
      points: [
        { icon: 'CheckCircle', title: 'It Takes a Village — The Card Should Show It', body: 'A graduation is a family victory. The whole extended family, community members, and friends all celebrate. Thankeeu lets all of them sign one card and contribute to one gift — organised, beautiful, and meaningful.' },
        { icon: 'Mic', title: 'Mum\'s Voice. Dad\'s Pride. Forever.', body: 'The voice note feature is the most emotional part of a Thankeeu graduation card. When parents, grandparents, and siblings record personal messages in their voice — that is a gift that cannot be bought in any store.' },
        { icon: 'CheckCircle', title: 'Graduation Gift Collection Made Simple', body: 'Instead of relatives sending money to different accounts, Thankeeu\'s gift pot collects every contribution in one place. The graduate withdraws a clean, combined gift directly to their account.' },
        { icon: 'CheckCircle', title: 'Works for Every Academic Milestone', body: 'Bachelor\'s degree, Master\'s, PhD, professional certifications, law school, medical school — wherever they graduated, Thankeeu celebrates it.' },
      ],
    },
    useCases: ['University graduation congratulations card', 'Master\'s graduation family card', 'First class degree celebration card', 'MBA graduation group card', 'Professional certification congratulations'],
    faqs: [
      { q: 'How do I create a graduation group card?', a: 'Go to thankeeu.com, select Graduation, enter the graduate\'s name and convocation date, then share the signing link via email with family and friends.' },
      { q: 'Can family abroad contribute to a graduation gift on Thankeeu?', a: 'Yes. Family anywhere in the world can contribute to the gift pot. They pay in their local currency and the graduate receives the total.' },
      { q: 'How many people can sign a graduation card on Thankeeu?', a: 'Unlimited. We have seen graduation cards with 80+ family members and friends all signing together.' },
    ],
    seoMicrocopy: 'Celebrating graduates from universities across the US, UK, Canada, Australia, and worldwide.',
    cta: 'Create a Graduation Group Card',
  },

  'new-baby': {
    title: 'New Baby & Baby Shower Group Cards — Welcome the Bundle of Joy',
    h1: 'Online New Baby Congratulations Group Card — Welcome the Bundle of Joy',
    emoji: 'PartyPopper',
    tagline: 'Welcome the newest blessing — the whole team celebrates together',
    desc: "A new baby is the greatest gift. Celebrate new parents with a beautiful group card full of love and blessings — plus a pooled baby gift from colleagues and family, in any currency.",
    keywords: 'new baby congratulations group card, baby shower card online, online baby shower card, new baby gift pool, congratulations new baby, welcome baby card, baby shower message colleague, group baby card, new baby card office, baby arrival card, newborn congratulations',
    color: '#F97316', accent: '#FB923C', gradient: 'linear-gradient(135deg,#FB923C 0%,#F97316 100%)',
    bg: '#FFF7ED', cardBg: 'linear-gradient(135deg,#FB923C,#F97316)', inkColor: '#fff',
    signers: 22, amount: '$650', sampleTitle: "Welcome Baby Zara ",
    messages: [
      { name: 'HR Team', text: 'The whole office is over the moon for you! ', type: 'text' },
      { name: 'Amy A.', text: 'Lullaby voice note (0:35)', type: 'voice' },
      { name: 'Design Team', text: '', type: 'gif', gif: '' },
      { name: 'Marketing', text: 'Baby shower photo!', type: 'photo', emoji: '' },
      { name: 'Kate O.', text: 'She is already so loved! ', type: 'text' },
      { name: 'CEO', text: 'Best wishes to your growing family ', type: 'text' },
    ],
    heroBullets: [
      'Perfect for welcoming a new baby, baby shower gifts, and maternity leave celebrations',
      'Family and colleagues add wishes and blessings from anywhere in the world',
      'Pool a baby gift in any currency — no need to coordinate separate bank transfers',
      'Add baby shower photos and memories to the card',
    ],
    whySection: {
      heading: 'Why Teams & Families Use Thankeeu for New Baby Cards',
      points: [
        { icon: 'CheckCircle', title: 'Wishes in Every Signature', body: 'A new baby is a community celebration. Grandparents, aunties, friends, and colleagues all have blessings to give. Thankeeu lets every single one of them add their wishes to one beautiful card.' },
        { icon: 'CheckCircle', title: 'Organise the Baby Gift Without the Chaos', body: 'Collecting baby shower contributions informally is stressful. Thankeeu\'s gift pot lets every colleague or family member contribute securely — the new parents withdraw one clean total to their account.' },
        { icon: 'CheckCircle', title: 'Perfect for Maternity Leave Send-Offs', body: 'When a colleague goes on maternity leave, send them off with a card signed by the whole office. It is warm, thoughtful, and tells them they are valued beyond their role.' },
        { icon: 'Zap', title: 'Baby Doesn\'t Wait — Cards Can Be Instant', body: 'Baby arrival timing is unpredictable. With Thankeeu, you can create and share a card the same day the news breaks. The team can sign in minutes and the parents receive it within hours.' },
      ],
    },
    useCases: ['Colleague maternity leave card from the office', 'Baby shower gift pool from colleagues', 'New baby welcome card from family', 'First baby congratulations group card', 'Newborn baby wishes and blessings card'],
    faqs: [
      { q: 'How do I create a new baby congratulations card for a colleague?', a: 'Visit thankeeu.com, select New Baby / Baby Shower, enter the parents\'names, then share the link with the team via email or messaging app. Everyone signs without an account.' },
      { q: 'Can we collect baby shower gift contributions using Thankeeu?', a: 'Yes. Enable the gift pot when creating the card. Every colleague or family member can contribute any amount. The new parents receive and withdraw the total.' },
      { q: 'Can family members abroad send baby shower gifts via Thankeeu?', a: 'Yes. Family anywhere in the world can contribute to the gift pot, and the parents receive the total in their preferred currency.' },
    ],
    seoMicrocopy: 'Loved by offices, families, and communities celebrating new arrivals worldwide.',
    cta: 'Create a New Baby Group Card',
  },

  'staff-appreciation': {
    title: 'Staff Appreciation & Employee Recognition Cards — Recognise Your Team',
    h1: 'Staff Appreciation Group Cards — Recognise Your Team the Right Way',
    emoji: 'Star',
    tagline: 'Show your team they matter — not just on one day, every day',
    desc: 'The most effective HR teams worldwide use Thankeeu to send personalised staff appreciation cards — for Employee Appreciation Day, quarterly milestones, peer recognition, and spontaneous thank-yous that boost retention.',
    keywords: 'staff appreciation card, employee recognition card, employee appreciation card, staff recognition, team appreciation message, employee appreciation day, HR recognition tool, thank you card for employee, staff thank you card, employee recognition software, peer recognition card, employee morale, company appreciation card, automated anniversary card HR, staff engagement',
    color: '#7C3AED', accent: '#A78BFA', gradient: 'linear-gradient(135deg,#7C3AED 0%,#5B4BDF 100%)',
    bg: '#F5F3FF', cardBg: 'linear-gradient(135deg,#A78BFA,#7C3AED)', inkColor: '#fff',
    signers: 35, amount: '$950', sampleTitle: "Thank You, Maya — Q3 MVP ",
    messages: [
      { name: 'CEO', text: 'Your work on the Q3 campaign was exceptional. Truly.', type: 'text' },
      { name: 'HR Lead', text: 'Appreciation message (0:28)', type: 'voice' },
      { name: 'Team Lead', text: '', type: 'gif', gif: '' },
      { name: 'Peer', text: 'Team photo — Q3 close-out', type: 'photo', emoji: '' },
      { name: 'Colleague 1', text: 'We see how hard you work. Thank you! ', type: 'text' },
      { name: 'Colleague 2', text: 'The office wouldn\'t be the same without you.', type: 'text' },
    ],
    heroBullets: [
      'Automate Employee Appreciation Day cards for your whole team',
      'Connect with BambooHR, Workday, ADP — send cards automatically',
      'Enable peer-to-peer recognition that the whole team can see',
      'Pool a recognition gift in any currency — the employee withdraws it themselves',
    ],
    whySection: {
      heading: 'Why HR Teams Use Thankeeu for Staff Recognition',
      points: [
        { icon: 'CheckCircle', title: 'Recognition = Retention', body: 'Top talent has options. Companies that consistently recognise employees — with personalised cards, not just cash bonuses — see lower turnover. A "thank you" with 30 colleagues\' names on it is priceless.' },
        { icon: 'Briefcase', title: 'Automate What HR Teams Don\'t Have Time For', body: 'HR teams are stretched thin. Thankeeu for Teams automates birthday cards, work anniversary cards, and milestone recognitions — so your HR team focuses on strategy, not remembering dates.' },
        { icon: 'CheckCircle', title: 'Works with Leading HR Systems', body: 'Thankeeu integrates with BambooHR, Workday, ADP, Zoho People, and SAP SuccessFactors. Plug in your employee data and every recognition moment is triggered automatically.' },
        { icon: 'CheckCircle', title: 'Works for Distributed Teams Everywhere', body: 'Whether your team is in the same building, across multiple cities, or spread across the world — everyone signs the same digital card. Remote employees feel just as recognised as those in the office.' },
      ],
    },
    useCases: ['Employee Appreciation Day cards for the whole company', 'Monthly MVP recognition card', 'End-of-year staff appreciation from the CEO', 'Peer-to-peer thank you cards', 'Department-wide appreciation during tough projects'],
    faqs: [
      { q: 'How does Thankeeu help HR teams with staff appreciation?', a: 'Thankeeu for Teams connects with your HR system and automates recognition cards for birthdays, anniversaries, and milestones. For one-off appreciation, HR or managers create a card manually and share the signing link with the team.' },
      { q: 'What is a good staff appreciation message for an employee?', a: 'Be specific. "Thank you for the late nights during the product launch — your work directly contributed to our record revenue this quarter. We see you." Specificity turns a thank-you card into a career memory.' },
      { q: 'Can Thankeeu integrate with BambooHR or Workday for automated staff recognition?', a: 'Yes. Thankeeu for Teams integrates with BambooHR, Workday, ADP, Zoho People, and SAP SuccessFactors. It reads your employee data and triggers recognition cards automatically on the right dates.' },
      { q: 'Can employees use Thankeeu to recognise each other (peer recognition)?', a: 'Yes. Any team member can create a peer appreciation card and share the link for others to co-sign. This builds a bottom-up recognition culture — not just top-down HR-driven appreciation.' },
      { q: 'Is Thankeeu affordable for companies of all sizes?', a: 'Yes. Individual cards start from $5. Thankeeu for Teams has plans for startups and enterprises, with per-employee pricing. No minimum team size required.' },
    ],
    seoMicrocopy: 'Trusted by startups, enterprises, banks, and companies across 30+ countries.',
    cta: 'Start Recognising Your Team Today',
  },
};

const MessageMiniCard = ({ msg, color }) => {
  return (
    <div className="rounded-2xl p-3 border flex flex-col gap-1.5 relative overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.92)', borderColor: 'rgba(0,0,0,0.07)', minHeight: 80 }}>
      {msg.type === 'photo' && msg.emoji && (
        <div className="absolute inset-0 flex items-center justify-center opacity-10 text-5xl pointer-events-none select-none">
          {msg.emoji}
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ background: color }}>
          {msg.name[0]}
        </div>
        <span className="text-xs font-semibold text-gray-700 truncate">{msg.name}</span>
      </div>
      {msg.type === 'voice' && (
        <div className="flex items-center gap-1.5 bg-purple-50 rounded-lg px-2 py-1">
          <span className="text-sm"></span>
          <div className="flex gap-0.5 items-end h-4">
            {[3,5,7,4,6,8,5,3,7,5,4,6].map((h,i) => (
              <div key={i} className="w-0.5 rounded-xl" style={{ height: h*2, background: color, opacity: 0.7 }} />
            ))}
          </div>
          <span className="text-xs text-purple-600 font-medium">{msg.text.split('(')[1]?.replace(')','') || '0:20'}</span>
        </div>
      )}
      {msg.type === 'gif' && (
        <div className="text-3xl text-center leading-tight">{msg.gif}</div>
      )}
      {msg.type === 'photo' && (
        <div className="text-center text-2xl"> <span className="text-xs text-gray-500 font-medium">{msg.text.replace(' ','')}</span></div>
      )}
      {msg.type === 'text' && (
        <p className="text-xs text-gray-600 leading-relaxed">{msg.text}</p>
      )}
    </div>
  );
};

export default function OccasionLandingPage({
  occasion,
  priorityDesigns,
  priorityDesignOccasion = occasion,
  priorityDesignEyebrow,
  priorityDesignTitle,
  priorityDesignDescription,
}) {
  const d = OCCASIONS[occasion] || OCCASIONS.birthday;
  const path = `/occasions/${occasion}`;
  const canonicalUrl = `${BASE}${path}`;

  const jsonLd = [
    SCHEMAS.webPage(d.title, d.desc, path),
    SCHEMAS.breadcrumb([
      { name: 'Home', url: '/' },
      { name: 'Occasions', url: '/occasions/birthday' },
      { name: d.title },
    ]),
    SCHEMAS.faqPage(d.faqs),
    {
      '@type': 'Service',
      name: d.title,
      description: d.desc,
      provider: { '@id': `${BASE}/#organization` },
      areaServed: { '@type': 'Place', name: 'Worldwide' },
      url: canonicalUrl,
      offers: {
        '@type': 'Offer',
        price: '5',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    },
  ];

  useSEO({
    title: d.title,
    description: d.desc,
    keywords: d.keywords,
    canonical: path,
    noIndex: false,
    jsonLd,
  });

  return (
    <div className="min-h-screen" style={{ background: d.bg }}>
      <Navbar />

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-bold mb-5"
          style={{ background: `${d.color}15`, border: `1.5px solid ${d.color}40`, color: d.color }}>
          {d.title}
        </div>
        <h1 className="font-display text-3xl md:text-5xl font-extrabold mb-5 leading-tight"
          style={{ color: '#1a1a2e' }}>{d.h1}</h1>
        <p className="text-warm-500 text-lg max-w-2xl mx-auto mb-6 leading-relaxed">{d.tagline}</p>

        {/* Hero bullet trust signals */}
        <div className="max-w-xl mx-auto mb-8 text-left grid sm:grid-cols-2 gap-2">
          {d.heroBullets.map((b, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl px-3 py-2"
              style={{ background: `${d.color}10` }}>
              <span className="text-sm leading-relaxed" style={{ color: '#374151' }}>{b}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/card/new"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-base shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            style={{ background: d.gradient }}>
            {d.cta} — from $5
          </Link>
          <Link to="/company/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base border-2 transition-all hover:-translate-y-0.5"
            style={{ borderColor: d.color, color: d.color, background: 'white' }}>
            For teams — free setup
          </Link>
        </div>

        {/* GEO signal */}
        <p className="mt-4 text-xs" style={{ color: d.color }}>{d.seoMicrocopy}</p>
      </section>

      {/* ── Sample Card Preview ── */}
      <section className="max-w-lg mx-auto px-4 pb-16">
        <p className="text-center text-xs font-bold mb-3 uppercase tracking-widest" style={{ color: d.color }}>Sample card</p>
        <div className="rounded-3xl shadow-2xl overflow-hidden border border-white/60" style={{ background: 'white' }}>
          <div className="h-2.5" style={{ background: d.gradient }} />
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-gray-900 truncate">{d.sampleTitle}</p>
                <p className="text-xs text-gray-400">{d.signers} people signed · photos, VNs, GIFs & gifts</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-xl"
                style={{ background: `${d.color}15`, color: d.color }}>
                Active
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {d.messages.map((msg, i) => (
                <MessageMiniCard key={i} msg={msg} color={d.color} />
              ))}
            </div>
            <div className="rounded-2xl p-3.5 flex items-center gap-3"
              style={{ background: `${d.color}0d`, border: `1.5px solid ${d.color}30` }}>
              <span className="inline-flex w-8 h-8 rounded-xl items-center justify-center flex-shrink-0" style={{background:'rgba(0,0,0,0.06)'}}></span>
              <div className="flex-1">
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs font-bold" style={{ color: d.color }}>Gift pot</span>
                  <span className="text-xs font-extrabold" style={{ color: d.color }}>{d.amount}</span>
                </div>
                <div className="h-2 rounded-xl overflow-hidden" style={{ background: `${d.color}25` }}>
                  <div className="h-full rounded-xl" style={{ width: '78%', background: d.gradient }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── What's inside ── */}
      {priorityDesigns?.length > 0 && (
        <PriorityDesignGallery
          designs={priorityDesigns}
          occasion={priorityDesignOccasion}
          eyebrow={priorityDesignEyebrow}
          title={priorityDesignTitle}
          description={priorityDesignDescription}
          background="#ffffff"
        />
      )}

      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="font-display text-2xl font-bold text-center mb-2" style={{ color: '#1a1a2e' }}>
          What goes inside every card
        </h2>
        <p className="text-center text-warm-500 text-sm mb-8">
          Each card is a collection of individual message cards — like a digital card box
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            ['', 'Personal messages', 'Everyone writes their own heartfelt message. No copying and pasting — real words, real names.'],
            ['', 'Photos & videos', 'Upload memories, team photos, or throwback pictures shown as a beautiful carousel.'],
            ['', 'Voice notes', 'Record audio directly from any phone. Heard in their voice — the most emotional feature we have.'],
            ['', 'GIFs & reactions', 'Add animated GIFs and emoji reactions to give the card real personality and fun.'],
            ['', 'Gift pot', 'Everyone contributes any amount in their preferred currency — pooled and ready for the recipient to withdraw.'],
            ['', 'Scheduled delivery', 'Set the exact date and time. Thankeeu delivers it automatically at the perfect moment.'],
          ].map(([icon, title, desc], i) => (
            <div key={i} className="rounded-2xl p-5 border-2 transition-all hover:shadow-md"
              style={{ background: 'white', borderColor: `${d.color}20` }}>
              {icon && <div className="mb-2 text-primary-500"><Icon name={icon} size={22}/></div>}
              <p className="font-bold text-gray-900 mb-1">{title}</p>
              <p className="text-gray-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why section ── */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="font-display text-2xl font-bold text-center mb-2" style={{ color: '#1a1a2e' }}>
          {d.whySection.heading}
        </h2>
        <p className="text-center text-warm-500 text-sm mb-8">Built for offices, families, and teams — everywhere in the world</p>
        <div className="grid sm:grid-cols-2 gap-5">
          {d.whySection.points.map(({ icon, title, body }, i) => (
            <div key={i} className="rounded-2xl p-6 border-2" style={{ background: 'white', borderColor: `${d.color}20` }}>
              {icon && <div className="mb-3 text-primary-500"><Icon name={icon} size={22}/></div>}
              <p className="font-bold text-gray-900 mb-2">{title}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Use cases ── */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="font-display text-xl font-bold text-center mb-6" style={{ color: '#1a1a2e' }}>
          Perfect for every situation
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {d.useCases.map((uc, i) => (
            <span key={i} className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: `${d.color}12`, color: d.color, border: `1.5px solid ${d.color}30` }}>
              {uc}
            </span>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="font-display text-2xl font-bold text-center mb-2" style={{ color: '#1a1a2e' }}>
          Ready in 3 minutes
        </h2>
        <p className="text-center text-warm-500 text-sm mb-8">No design skills needed. No group chat chasing.</p>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { step: '1', icon: 'Sparkles', title: 'Create the card', body: 'Choose the occasion, add the recipient\'s name, and write your message. Takes 2 minutes.' },
            { step: '2', icon: 'Share2', title: 'Share the link', body: 'Send the signing link via email, messaging app, or Slack. Anyone can sign from their phone — no account needed.' },
            { step: '3', icon: 'Clock', title: 'It delivers itself', body: 'Set the delivery date and time. Thankeeu sends it automatically. You don\'t need to be online.' },
          ].map(({ step, icon, title, body }) => (
            <div key={step} className="text-center rounded-2xl p-6 border-2"
              style={{ background: 'white', borderColor: `${d.color}20` }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-white mx-auto mb-3 text-lg"
                style={{ background: d.gradient }}>{step}</div>
              {icon && <div className="mb-2 text-primary-500"><Icon name={icon} size={22}/></div>}
              <p className="font-bold text-gray-900 mb-1">{title}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <h2 className="font-display text-2xl font-bold text-center mb-8" style={{ color: '#1a1a2e' }}>
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {d.faqs.map(({ q, a }, i) => (
            <div key={i} className="rounded-2xl p-5 border-2" style={{ background: 'white', borderColor: `${d.color}20` }}>
              <p className="font-bold text-gray-900 mb-2">{q}</p>
              <p className="text-gray-600 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="text-white py-16 px-4 text-center" style={{ background: d.gradient }}>
        <h2 className="font-display text-3xl font-extrabold mb-3">Ready to make someone's day?</h2>
        <p className="text-white/80 mb-2 text-lg">Start in 2 minutes. Pay from $5 only when you send.</p>
        <p className="text-white/60 text-sm mb-8">No design skills needed · Share via any app · Secure payments in 30+ currencies</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/card/new"
            className="inline-flex items-center gap-2 bg-white font-bold px-8 py-4 rounded-2xl text-base shadow-lg hover:shadow-xl transition-all"
            style={{ color: d.color }}>
            {d.cta} →
          </Link>
          <Link to="/company/signup"
            className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-2xl text-base border-2 border-white/50 text-white hover:bg-white/10 transition-all">
            Set up for your team — free
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
