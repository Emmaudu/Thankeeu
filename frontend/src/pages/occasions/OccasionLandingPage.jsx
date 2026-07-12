import { useSEO, SCHEMAS } from '../../hooks/useSEO';
import Icon from '../../components/ui/Icon';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const BASE = 'https://www.thankeeu.com';

const OCCASIONS = {
 birthday: {
 title: 'Online Birthday Group Cards Nigeria',
 h1: 'Send a Group Birthday Card in Nigeria — Everyone Signs in Minutes',
 emoji: 'Cake',
 tagline: 'Make their birthday unforgettable — the whole team, in one card',
 desc: 'Create an online birthday group card in Nigeria that everyone signs from their phone. Add photos, voice notes, and a pooled Naira gift. Delivered at the perfect moment.',
 keywords: 'online birthday card Nigeria, birthday card Lagos, buy birthday card Nigeria, where to buy birthday card in Nigeria, customised birthday card Nigeria, personalised birthday card Nigeria, birthday card delivery Lagos, send birthday card Nigeria, happy birthday card design Nigeria, birthday card for colleague Nigeria, group birthday card Nigeria, online birthday group card Nigeria, birthday card everyone signs Nigeria, group birthday gift pool Nigeria, virtual birthday card Lagos Abuja, office birthday card Nigeria',
 color: '#E84393', accent: '#FF6FB7', gradient: 'linear-gradient(135deg,#FF6FB7 0%,#7C6EFF 100%)',
 bg: '#FFF0F7', cardBg: 'linear-gradient(135deg,#FF6FB7,#E84393)', inkColor: '#fff',
 signers: 24, amount: '₦85,000', sampleTitle: "Tolu's 30th Birthday ",
 messages: [
 { name: 'Ada O.', text: 'You deserve every bit of this! ', type: 'text' },
 { name: 'Emeka K.', text: 'Voice note (0:18)', type: 'voice' },
 { name: 'Kemi B.', text: '', type: 'gif', gif: '' },
 { name: 'Tunde A.', text: 'Congrats! Drinks on you ', type: 'text' },
 { name: 'Ngozi P.', text: 'Photo memory', type: 'photo', emoji: '' },
 { name: 'Uche S.', text: '30 looks SO good on you!', type: 'text' },
 ],
 heroBullets: [
 'Works for birthdays at the office, at home, and remotely',
 'Anyone in Nigeria can sign — just share the link via WhatsApp',
 'Pool Naira gift contributions from the whole team or family',
 'Schedule delivery to land exactly at midnight on their birthday',
 ],
 whySection: {
 heading: 'Why Nigerians Choose Thankeeu for Birthday Group Cards',
 points: [
 { icon: 'MessageCircle', title: 'Share via WhatsApp — No App Needed', body: 'One link does it all. Your colleague in Abuja and your friend in Port Harcourt can both sign the same card from their phone — no downloads, no login required.' },
 { icon: 'CreditCard', title: 'Pay in Naira with Nigerian Cards', body: 'Gift contributions are powered by Flutterwave and work with every Nigerian bank card, USSD, and mobile money. No dollar card headaches.' },
 { icon: 'Mic', title: 'Voice Notes That Give Goosebumps', body: 'This is what sets Thankeeu apart. A recorded voice message from a colleague or loved one lands differently. Nigerians are sending voice notes daily — now they can do it on a birthday card.' },
 { icon: 'Clock', title: 'Scheduled Delivery at Midnight', body: 'Be the first to wish them happy birthday. Set the card to deliver at 12:00am on their birthday, and they wake up to the most beautiful surprise of their day.' },
 ],
 },
 useCases: ['Office birthday card for colleagues', 'Family birthday card that everyone signs', '30th or 40th milestone birthday surprise', 'Remote team birthday celebrations', 'Boss birthday card from the whole department'],
 faqs: [
 { q: 'How do I create an online birthday group card in Nigeria?', a: 'Go to thankeeu.com, click "Create a card", choose Birthday, enter the recipient\'s name and email, then share the link via WhatsApp or email. Anyone can sign without creating an account.' },
 { q: 'Can everyone sign the card from their phone?', a: 'Yes. Thankeeu works on any smartphone — iPhone or Android. No app download is needed. Just open the link and sign.' },
 { q: 'How do we contribute money to a birthday gift in Nigeria?', a: 'When you create a card, you can enable a gift pot. Everyone who signs can add any Naira amount via Flutterwave — using their bank card, bank transfer, or USSD. The total is pooled and the birthday person can withdraw to their account.' },
 { q: 'Can I schedule the birthday card to be delivered on the exact day?', a: 'Yes. When setting up the card, you choose the delivery date and time. Thankeeu will send it automatically at midnight or any time you set — even if you are asleep.' },
 { q: 'Does Thankeeu work for office birthday cards in Lagos and Abuja?', a: 'Absolutely. Teams across Lagos, Abuja, Port Harcourt, and beyond use Thankeeu daily. It is designed for Nigerian offices and remote teams.' },
 ],
 seoMicrocopy: 'Used by teams across Lagos, Abuja, Port Harcourt, Ibadan, and Kano.',
 cta: 'Start a Birthday Group Card',
 },

 farewell: {
 title: 'Online Farewell Group Cards Nigeria',
 h1: 'Send a Group Farewell Card in Nigeria — The Whole Team Signs in One Place',
 emoji: '',
 tagline: "Send them off with love they'll never forget",
 desc: "When a colleague leaves your company in Nigeria, don't let them go without a proper send-off. One Thankeeu link, the whole team signs — messages, photos, voice notes, and a pooled going-away gift.",
 keywords: 'farewell group card Nigeria, going away card colleagues Nigeria, farewell card for colleague Nigeria, leaving card online Nigeria, group farewell gift pool Nigeria, goodbye card colleague Lagos, online leaving card Nigeria, farewell message colleague Nigeria, farewell card work Nigeria, staff farewell card Nigeria, virtual farewell card Nigeria, farewell group ecard Nigeria',
 color: '#7C6EFF', accent: '#A78BFA', gradient: 'linear-gradient(135deg,#7C6EFF 0%,#5B4BDF 100%)',
 bg: '#F5F3FF', cardBg: 'linear-gradient(135deg,#7C6EFF,#5B4BDF)', inkColor: '#fff',
 signers: 42, amount: '₦120,000', sampleTitle: "Emeka's Farewell ",
 messages: [
 { name: 'Bisi A.', text: 'We will genuinely miss you around here!', type: 'text' },
 { name: 'Taiwo R.', text: 'Heartfelt voice note (0:32)', type: 'voice' },
 { name: 'Ola M.', text: '', type: 'gif', gif: '' },
 { name: 'Funmi N.', text: 'Our team outing memory', type: 'photo', emoji: '' },
 { name: 'Seun K.', text: 'All the best in the next chapter ', type: 'text' },
 { name: 'HR Team', text: 'From all of us — thank you. ', type: 'text' },
 ],
 heroBullets: [
 'Perfect for colleagues leaving for a new job, relocating, or retiring',
 'Share via WhatsApp — remote and on-site team members all sign together',
 'Pool a leaving gift in Naira — no awkward cash collection',
 'Add team photos and voice notes to make it a lasting memory',
 ],
 whySection: {
 heading: 'Why Nigerian Teams Use Thankeeu for Farewell Cards',
 points: [
 { icon: 'Users', title: 'No More Chasing People to Sign', body: 'Share one link via WhatsApp or Slack and everyone signs at their own time. No more walking around the office with a card, asking people to write something.' },
 { icon: 'Globe', title: 'Works for Remote & Hybrid Teams', body: 'Your colleague in Portharcourt can sign. The one in Ibadan can add a voice note. The remote team in Abuja can contribute to the gift. Thankeeu brings the whole team together from anywhere.' },
 { icon: 'Gift', title: 'Collect the Going-Away Gift Digitally', body: 'Instead of a shared bank account or awkward cash contributions, Thankeeu\'s gift pot lets every team member contribute via Flutterwave. The leaver withdraws the money to their own account.' },
 { icon: 'Heart', title: 'A Farewell They\'ll Screenshot and Keep Forever', body: 'Nigerians share everything on WhatsApp. When they open a Thankeeu farewell card with 40+ messages, photos and voice notes from their team, they will screenshot it and share it for years.' },
 ],
 },
 useCases: ['Employee resignation farewell', 'Relocation send-off card', 'End of internship farewell card', 'Colleague leaving for abroad (japa) going away card', 'Retirement farewell from the whole department'],
 faqs: [
 { q: 'How do I create a farewell group card for a colleague in Nigeria?', a: 'Visit thankeeu.com, click "Create a card", select Farewell, fill in the colleague\'s details, and share the signing link via WhatsApp or email. No account needed to sign.' },
 { q: 'What should I write in a farewell card for a colleague?', a: 'Keep it personal — mention a shared memory, what you admired about them, or a wish for their next chapter. Thankeeu lets everyone write their own heartfelt message.' },
 { q: 'Can we pool a going-away gift using Thankeeu?', a: 'Yes. The gift pot feature lets every team member contribute any Naira amount. The recipient withdraws the full amount to their Nigerian bank account.' },
 { q: 'Does Thankeeu work for farewell cards for someone who is relocating abroad (japa)?', a: 'Perfectly. The card is digital, so it travels with them. They can open it anywhere in the world, and contributors can pay in Naira while they receive the equivalent abroad.' },
 { q: 'How many people can sign a farewell card on Thankeeu?', a: 'Unlimited. We have had farewell cards signed by over 200 people. There is no cap on signers or message length.' },
 ],
 seoMicrocopy: 'Used by companies in Lagos, Abuja, Port Harcourt, Enugu, and everywhere in between.',
 cta: 'Create a Farewell Group Card',
 },

 anniversary: {
 title: 'Work Anniversary Group Cards Nigeria',
 h1: 'Celebrate Work Anniversaries as a Team — Automated Group Cards in Nigeria',
 emoji: 'Gift',
 tagline: 'Recognise loyalty and years of service — together',
 desc: 'Work anniversaries deserve more than a Slack message. Create an automatic work anniversary group card signed by the whole Nigerian team, with messages, photos, and a pooled gift.',
 keywords: 'work anniversary group card Nigeria, staff anniversary card Nigeria, employee years of service card Nigeria, work anniversary gift pool Nigeria, employee recognition Nigeria, staff appreciation card Nigeria, 1 year work anniversary Nigeria, 5 year work anniversary Nigeria, work anniversary message Nigeria, online anniversary card colleague Nigeria, employee milestone card Nigeria, HR anniversary automation Nigeria',
 color: '#F59E0B', accent: '#FBBF24', gradient: 'linear-gradient(135deg,#F59E0B 0%,#D97706 100%)',
 bg: '#FFFBEB', cardBg: 'linear-gradient(135deg,#FBBF24,#F59E0B)', inkColor: '#1c1917',
 signers: 18, amount: '₦50,000', sampleTitle: "Kemi's 5-Year Anniversary ",
 messages: [
 { name: 'MD Office', text: '5 incredible years. We are grateful! ', type: 'text' },
 { name: 'Chidi F.', text: 'Special tribute (0:45)', type: 'voice' },
 { name: 'Amaka S.', text: '', type: 'gif', gif: '' },
 { name: 'Sales Team', text: ' 5-year team photo', type: 'photo', emoji: '' },
 { name: 'HR Lead', text: 'Your dedication inspires us all!', type: 'text' },
 { name: 'Tobi N.', text: "Here's to 5 more amazing years ", type: 'text' },
 ],
 heroBullets: [
 'Recognise 1, 3, 5, 10-year milestones the right way',
 'HR teams can automate anniversary cards with Thankeeu for Teams',
 'Pool a Naira appreciation gift from the whole company',
 'Whole team signs via one WhatsApp link — no app needed',
 ],
 whySection: {
 heading: 'Why Nigerian Companies Use Thankeeu for Work Anniversary Cards',
 points: [
 { icon: 'Calendar', title: 'Never Miss Another Anniversary', body: 'With Thankeeu for Teams, HR sets up anniversary automation once. The platform detects upcoming anniversaries from your employee data and triggers the group card automatically.' },
 { icon: 'Star', title: 'Turn Loyalty into a Moment', body: 'Employees in Nigeria work hard. A 5-year anniversary is a big deal. A group card signed by colleagues and leadership — with personal messages and a gift — makes them feel truly seen.' },
 { icon: 'CheckCircle', title: 'Improve Staff Retention', body: 'Recognised employees stay longer. Work anniversary cards are one of the simplest, highest-impact employee retention tools a Nigerian HR team can implement.' },
 { icon: 'CheckCircle', title: 'Integrates with Nigerian HR Systems', body: 'Thankeeu connects with SeamlessHR, BambooHR, WorkPay, Zoho People, and SAP SuccessFactors — the HR tools already used by Nigerian companies.' },
 ],
 },
 useCases: ['1-year staff anniversary recognition', '5-year loyalty milestone card', '10-year long service award card', 'Automated HR anniversary cards for large teams', 'MD appreciation card from the whole company'],
 faqs: [
 { q: 'How do I create a work anniversary group card for an employee in Nigeria?', a: 'Visit thankeeu.com, click "Create a card", choose Anniversary, enter the employee\'s name and delivery date. Share the signing link with their team. Thankeeu delivers it automatically on the date you set.' },
 { q: 'Can Thankeeu automate work anniversary cards for my whole company?', a: 'Yes. Thankeeu for Teams connects with your HRIS (SeamlessHR, BambooHR, WorkPay, etc.) and automatically creates and sends anniversary cards for every employee on the right date — no manual work.' },
 { q: 'What is a good work anniversary message for a Nigerian employee?', a: 'Mention their specific contributions, how they\'ve grown, and what they mean to the team. Something like: "5 years of showing up and giving your best — this company is better because of you." Personal is always better than generic.' },
 { q: 'How many years of service should I recognise with a group card?', a: 'We recommend recognising every year — especially 1, 3, 5, 10 years. Even a 1-year card shows new employees they are valued and sets the tone for long-term loyalty.' },
 { q: 'Can we add a gift to the work anniversary card?', a: 'Yes. The Thankeeu gift pot lets team members and leadership contribute any Naira amount. The employee withdraws the total to their Nigerian bank account.' },
 ],
 seoMicrocopy: 'Trusted by Nigerian companies using SeamlessHR, WorkPay, and BambooHR.',
 cta: 'Create a Work Anniversary Card',
 },

 promotion: {
 title: 'Promotion Congratulations Group Cards Nigeria',
 h1: 'Group Promotion Congratulations Card Nigeria — Celebrate the Win Together',
 emoji: 'PartyPopper',
 tagline: "Cheer their hard-earned promotion — the whole team, one card",
 desc: "A promotion is a big deal. Celebrate it properly with a Thankeeu group card signed by the entire Nigerian team — personal messages, photos, voice notes, and a pooled congratulations gift.",
 keywords: 'group promotion congratulations card Nigeria, congratulations card for promotion Nigeria, colleague promotion gift Nigeria, online promotion card Nigeria, congratulations on new role Nigeria, team congratulations card Nigeria, promotion celebration card Nigeria, staff promotion card Nigeria, promotion message colleague Nigeria, promotion group ecard Nigeria, promotion announcement card Nigeria, congrats card for promotion Nigeria',
 color: '#10B981', accent: '#34D399', gradient: 'linear-gradient(135deg,#10B981 0%,#059669 100%)',
 bg: '#ECFDF5', cardBg: 'linear-gradient(135deg,#34D399,#10B981)', inkColor: '#fff',
 signers: 31, amount: '₦75,000', sampleTitle: "Amaka's Promotion to Lead ",
 messages: [
 { name: 'CEO', text: 'Truly well-deserved. Onwards and upwards! ', type: 'text' },
 { name: 'Dev Team', text: 'Congratulations song (0:22)', type: 'voice' },
 { name: 'Design', text: '', type: 'gif', gif: '' },
 { name: 'Marketing', text: 'Celebration selfie!', type: 'photo', emoji: '' },
 { name: 'HR Team', text: 'You earned every bit of this!', type: 'text' },
 { name: 'Ade O.', text: "Watch out world — she's on the move! ", type: 'text' },
 ],
 heroBullets: [
 'Celebrate a new role, new title, or new responsibility the right way',
 'Share the signing link via WhatsApp — the whole team contributes',
 'Pool a Naira congratulations gift from everyone',
 'Time the card to arrive right when the announcement is made',
 ],
 whySection: {
 heading: 'Why Nigerian Teams Use Thankeeu for Promotion Celebrations',
 points: [
 { icon: 'CheckCircle', title: 'Make the Moment Feel Real', body: 'Getting promoted is exciting. A card with 30+ personal messages from colleagues — including a voice note from the MD — turns an email announcement into a memory they will talk about for years.' },
 { icon: 'CheckCircle', title: 'Leadership Sets the Culture', body: 'When the CEO contributes a personal message to a promotion card, it signals that achievement is celebrated at every level. Nigerian companies that do this consistently have stronger workplace cultures.' },
 { icon: 'CheckCircle', title: 'Pool a Meaningful Gift Instantly', body: 'Instead of quietly hoping someone organises a celebration, Thankeeu lets the team chip in a Naira amount that adds up to a real, meaningful gift — no awkward organising required.' },
 { icon: 'Linkedin', title: 'A Card They\'ll Share on LinkedIn', body: 'Nigerians celebrate their wins online. A beautifully designed Thankeeu card with messages from the whole team is something they will screenshot and share on LinkedIn and WhatsApp — great for your employer brand too.' },
 ],
 },
 useCases: ['New job title celebration', 'Senior role promotion card', 'Team lead or manager promotion', 'Director or VP appointment card', 'Congratulations on new job offer'],
 faqs: [
 { q: 'How do I create a congratulations card for a colleague\'s promotion in Nigeria?', a: 'Visit thankeeu.com, select Promotion, fill in the colleague\'s name and new role, then share the signing link with the team via WhatsApp or email. No account needed to sign.' },
 { q: 'What should I write in a promotion congratulations card?', a: 'Mention why they deserved it — a specific skill, their attitude, or a result they achieved. Specific messages are 10x more meaningful than generic ones. Example: "The way you handled the Q3 client crisis showed exactly why you deserve this promotion."' },
 { q: 'Can I schedule the promotion card to arrive at the same time as the announcement?', a: 'Yes. Set the delivery date and time when creating the card. If the promotion announcement is at 2pm on Friday, schedule the Thankeeu card to arrive at 2:05pm as a beautiful follow-up surprise.' },
 { q: 'Can we add a cash gift to the promotion congratulations card?', a: 'Yes. Enable the gift pot and every team member can contribute any amount via Flutterwave. The promoted colleague withdraws it to their bank account.' },
 { q: 'Does Thankeeu work for congratulations cards for someone getting a new job at another company?', a: 'Absolutely. The card is digital and can be delivered to any email address — whether they are staying at your company or leaving for a new opportunity.' },
 ],
 seoMicrocopy: 'Celebrated by teams across fintech, oil & gas, banking, and tech companies in Nigeria.',
 cta: 'Create a Promotion Congratulations Card',
 },

 wedding: {
 title: 'Wedding Congratulations Group Cards Nigeria',
 h1: 'Group Wedding Congratulations Card Nigeria — Sign as a Team, Gift in Naira',
 emoji: 'PartyPopper',
 tagline: 'Celebrate love from the whole team — no awkward cash collection',
 desc: 'Send a beautiful wedding congratulations group card in Nigeria. Everyone on the team or in the family adds their warmest wishes, and you pool a Naira wedding gift — all in one place.',
 keywords: 'wedding congratulations group card Nigeria, group wedding gift pool Nigeria, online wedding card colleagues Nigeria, team wedding card Nigeria, wedding congratulations message Nigeria, wedding gift contribution Nigeria, congratulations on your wedding Nigeria, digital wedding card Nigeria, traditional wedding card Nigeria, group wedding ecard Nigeria, wedding card everyone signs Nigeria, nikkai or church wedding card Nigeria',
 color: '#EC4899', accent: '#F472B6', gradient: 'linear-gradient(135deg,#EC4899 0%,#DB2777 100%)',
 bg: '#FDF2F8', cardBg: 'linear-gradient(135deg,#F472B6,#EC4899)', inkColor: '#fff',
 signers: 37, amount: '₦200,000', sampleTitle: "Tunde & Zainab's Wedding ",
 messages: [
 { name: 'Team Lead', text: 'Wishing you a lifetime of happiness! ', type: 'text' },
 { name: 'Blessing A.', text: 'Wedding toast voice note (0:40)', type: 'voice' },
 { name: 'Adaeze O.', text: '', type: 'gif', gif: '' },
 { name: 'Engineering', text: 'Office send-off photo!', type: 'photo', emoji: '' },
 { name: 'Finance Team', text: 'May your bond grow stronger each day!', type: 'text' },
 { name: 'HR Team', text: 'From all of us — congratulations! ', type: 'text' },
 ],
 heroBullets: [
 'Works for court weddings, traditional introduction, church & Nikkai ceremonies',
 'Share via WhatsApp — friends, family and colleagues all sign together',
 'Pool a Naira wedding gift contribution — no cash awkwardness',
 'Add prayers and voice blessings from family members who cannot attend',
 ],
 whySection: {
 heading: 'Why Nigerians Use Thankeeu for Wedding Congratulations Cards',
 points: [
 { icon: 'CheckCircle', title: 'Prayers and Blessings in Their Voice', body: 'In Nigerian culture, a blessing from an elder means everything. Thankeeu\'s voice note feature lets grandparents, parents, and elders record their wedding prayers in their own voice — a keepsake for life.' },
 { icon: 'CheckCircle', title: 'No More WhatsApp Cash Collection Drama', body: 'Collecting wedding contributions on WhatsApp is chaotic. Thankeeu\'s gift pot organises everything — everyone contributes via Flutterwave, and the couple sees the total and withdraws it cleanly.' },
 { icon: 'CheckCircle', title: 'Covers All Nigerian Wedding Types', body: 'Whether it\'s a traditional introduction, Yoruba engagement, Igbo wine-carrying, court wedding, or church ceremony — a Thankeeu card covers every occasion with the right message.' },
 { icon: 'CheckCircle', title: 'Family in Diaspora Can Sign Too', body: 'Uncle in London, auntie in Houston, cousin in Canada — they can all sign the card and contribute to the gift from anywhere in the world, while the couple receives in Naira.' },
 ],
 },
 useCases: ['Colleague wedding card from the office team', 'Traditional introduction congratulations card', 'Family wedding congratulations group card', 'Church or court wedding team card', 'Wedding gift pool from colleagues in Nigeria'],
 faqs: [
 { q: 'How do I create a wedding congratulations group card in Nigeria?', a: 'Visit thankeeu.com, click "Create a card", choose Wedding, enter the couple\'s details, then share the link via WhatsApp with family, friends, and colleagues. Everyone signs without needing an account.' },
 { q: 'Can we pool a wedding gift in Naira using Thankeeu?', a: 'Yes. The gift pot allows any number of contributors to send any Naira amount via Flutterwave. The couple withdraws the total directly to their Nigerian bank account.' },
 { q: 'What is a good wedding congratulations message for a Nigerian colleague?', a: 'Prayers are always welcome in Nigerian culture. Something like: "Congratulations! May God bless your union with joy, peace, and many beautiful children " — or keep it humorous if you know them well.' },
 { q: 'Can family members abroad contribute to a Nigerian wedding gift on Thankeeu?', a: 'Yes. Contributors pay in their local currency and the couple can receive in Naira. Family in the UK, US, and Canada can all contribute to the same wedding gift pot.' },
 { q: 'Does the card work for traditional Nigerian weddings (introduction, Yoruba, Igbo)?', a: 'Absolutely. Thankeeu cards are occasion-labelled but message-open — the team writes whatever is culturally appropriate for Yoruba, Igbo, Hausa, or any other Nigerian tradition.' },
 ],
 seoMicrocopy: 'Loved by Nigerian office teams, families, and diaspora communities worldwide.',
 cta: 'Create a Wedding Congratulations Card',
 },

 graduation: {
 title: 'Graduation Congratulations Group Cards Nigeria',
 h1: 'Online Graduation Group Card Nigeria — Celebrate Their Degree Together',
 emoji: 'PartyPopper',
 tagline: "Honour their greatest academic achievement — everyone cheers at once",
 desc: "Years of JAMB, WAEC, sleepless nights, and hard work led to this moment. A Thankeeu graduation group card in Nigeria lets family, friends and church community celebrate them together — with messages, photos, voice notes, and a cash gift.",
 keywords: 'graduation congratulations group card Nigeria, graduation card Nigeria, congratulations on your degree Nigeria, graduation gift pool Nigeria, university graduation card Nigeria, NYSC congratulations card Nigeria, first class degree congratulations Nigeria, convocation card Nigeria, graduation message Nigeria, family graduation card Nigeria, graduation celebration Nigeria, online graduation card Lagos Abuja',
 color: '#6366F1', accent: '#818CF8', gradient: 'linear-gradient(135deg,#6366F1 0%,#4F46E5 100%)',
 bg: '#EEF2FF', cardBg: 'linear-gradient(135deg,#818CF8,#6366F1)', inkColor: '#fff',
 signers: 29, amount: '₦90,000', sampleTitle: "Chidi's Graduation Day ",
 messages: [
 { name: 'Mum ', text: 'We are beyond proud of you, my son!', type: 'text' },
 { name: 'Dad', text: 'Special message (1:02)', type: 'voice' },
 { name: 'Best Friends', text: '', type: 'gif', gif: '' },
 { name: 'Course Mates', text: 'Graduation day photo!', type: 'photo', emoji: '' },
 { name: 'Femi A.', text: 'DOCTOR in the making! ', type: 'text' },
 { name: 'Aunty Ngozi', text: 'This degree belongs to all of us ', type: 'text' },
 ],
 heroBullets: [
 'Perfect for university graduation, NYSC completion, MBA, and professional certifications',
 'Entire family signs from anywhere — no WhatsApp group coordination needed',
 'Pool a graduation cash gift in Naira from family and friends',
 'Parents record their congratulations in their own voice — a keepsake forever',
 ],
 whySection: {
 heading: 'Why Nigerian Families Use Thankeeu for Graduation Cards',
 points: [
 { icon: 'CheckCircle', title: 'It Takes a Village — The Card Should Show It', body: 'In Nigeria, a child\'s graduation is a family victory. The whole extended family, church members, and family friends all celebrate. Thankeeu lets all of them sign one card and contribute to one gift — organised, beautiful, and meaningful.' },
 { icon: 'Mic', title: 'Mum\'s Voice. Grandpa\'s Prayer. Forever.', body: 'The voice note feature is the most emotional part of a Thankeeu graduation card. When parents, grandparents, and siblings record personal messages in their voice — that is a gift that cannot be bought in any store.' },
 { icon: 'CheckCircle', title: 'Graduation Gift Collection Made Simple', body: 'Instead of relatives sending money to different accounts, Thankeeu\'s gift pot collects every contribution in one place via Flutterwave. The graduate withdraws a clean, combined gift to their bank account.' },
 { icon: 'CheckCircle', title: 'Works for Every Nigerian Milestone', body: 'UNILAG, UNIABUJA, OAU, UNIBEN, Covenant University — wherever they graduated, Thankeeu celebrates it. NYSC completion, professional exams, HND, BSc, MSc, or PhD — every certificate deserves a moment.' },
 ],
 },
 useCases: ['University graduation congratulations card', 'NYSC completion group card', 'First class degree celebration card', 'MBA graduation family card', 'Professional certification congratulations'],
 faqs: [
 { q: 'How do I create a graduation group card in Nigeria?', a: 'Go to thankeeu.com, select Graduation, enter the graduate\'s name and convocation date, then share the signing link via WhatsApp with family, church members, and friends.' },
 { q: 'What should I write in a graduation congratulations card for a Nigerian?', a: 'Reference their specific journey — the university, the challenges, the degree. "5 years of sacrifice, God\'s grace, and sheer determination — and you did it! Doctor [Name], we are beyond proud. " Personal messages always hit harder.' },
 { q: 'Can family in the diaspora contribute to a graduation gift on Thankeeu?', a: 'Yes. Family in the UK, US, Canada, and beyond can contribute to the gift pot. They pay in their currency and the graduate receives in Naira.' },
 { q: 'Does Thankeeu work for NYSC congratulations cards?', a: 'Yes. NYSC completion is a major milestone. Create a card, choose Graduation, and share it with family and friends to celebrate the end of service year.' },
 { q: 'How many people can sign a graduation card on Thankeeu?', a: 'Unlimited. We have seen graduation cards with 80+ family members, church friends, and coursemates all signing together.' },
 ],
 seoMicrocopy: 'Celebrating graduates from UNILAG, LASU, OAU, Covenant, UNIABUJA, UNIBEN and beyond.',
 cta: 'Create a Graduation Group Card',
 },

 'new-baby': {
 title: 'New Baby & Baby Shower Group Cards Nigeria',
 h1: 'Online New Baby Congratulations Group Card Nigeria — Welcome the Bundle of Joy',
 emoji: 'PartyPopper',
 tagline: 'Welcome the newest blessing — the whole team celebrates together',
 desc: "A new baby is the greatest gift. Celebrate Nigerian parents with a beautiful group card full of love, prayers, and blessings — plus a pooled Naira baby gift from colleagues and family.",
 keywords: 'new baby congratulations group card Nigeria, baby shower card Nigeria, online baby shower card Nigeria, new baby gift pool Nigeria, congratulations new baby Nigeria, welcome baby card Nigeria, baby shower message colleague Nigeria, group baby card Nigeria, new baby card office Nigeria, maternity gift collection Nigeria, baby arrival card Nigeria, newborn congratulations Nigeria',
 color: '#F97316', accent: '#FB923C', gradient: 'linear-gradient(135deg,#FB923C 0%,#F97316 100%)',
 bg: '#FFF7ED', cardBg: 'linear-gradient(135deg,#FB923C,#F97316)', inkColor: '#fff',
 signers: 22, amount: '₦65,000', sampleTitle: "Welcome Baby Zara ",
 messages: [
 { name: 'HR Team', text: 'The whole office is over the moon for you! ', type: 'text' },
 { name: 'Temi A.', text: 'Lullaby voice note (0:35)', type: 'voice' },
 { name: 'Design Team', text: '', type: 'gif', gif: '' },
 { name: 'Marketing', text: 'Baby shower photo!', type: 'photo', emoji: '' },
 { name: 'Bola O.', text: 'She is already so loved! ', type: 'text' },
 { name: 'CEO', text: 'Best wishes to your growing family ', type: 'text' },
 ],
 heroBullets: [
 'Perfect for welcoming a new baby, baby shower gifts, and maternity leave celebrations',
 'Family and colleagues add prayers and blessings from anywhere',
 'Pool a Naira baby gift — no need to coordinate separate bank transfers',
 'Add baby shower photos and memories to the card',
 ],
 whySection: {
 heading: 'Why Nigerian Teams & Families Use Thankeeu for New Baby Cards',
 points: [
 { icon: 'CheckCircle', title: 'Prayers in Every Signature', body: 'A new baby in a Nigerian family is a community celebration. Grandparents, aunties, pastors, and colleagues all have blessings to give. Thankeeu lets every single one of them add their prayer to one beautiful card.' },
 { icon: 'CheckCircle', title: 'Organise the Baby Gift Without the WhatsApp Chaos', body: 'Collecting baby shower contributions on WhatsApp is stressful. Thankeeu\'s gift pot lets every colleague or family member contribute via Flutterwave — the new parents withdraw one clean total to their account.' },
 { icon: 'CheckCircle', title: 'Perfect for Maternity Leave Send-Offs', body: 'When a colleague goes on maternity leave, send them off with a card signed by the whole office. It is warm, thoughtful, and tells them they are valued beyond their role.' },
 { icon: 'Zap', title: 'Baby Doesn\'t Wait — Cards Can Be Instant', body: 'Baby arrival timing is unpredictable. With Thankeeu, you can create and share a card the same day the news breaks. The team can sign in minutes and the parents receive it within hours.' },
 ],
 },
 useCases: ['Colleague maternity leave card from the office', 'Baby shower gift pool from colleagues', 'New baby welcome card from family', 'First baby congratulations group card', 'Newborn baby prayers and blessings card'],
 faqs: [
 { q: 'How do I create a new baby congratulations card for a colleague in Nigeria?', a: 'Visit thankeeu.com, select New Baby / Baby Shower, enter the parents\'names, then share the link with the team via WhatsApp or email. Everyone signs without an account.' },
 { q: 'Can we collect baby shower money contributions using Thankeeu?', a: 'Yes. Enable the gift pot when creating the card. Every colleague or family member can contribute any Naira amount via Flutterwave. The new parents receive and withdraw the total.' },
 { q: 'What do you write in a new baby card for a Nigerian colleague?', a: '"Congratulations on your newest blessing! May this child bring you immeasurable joy and fulfil every prayer. " — Nigerian warmth always includes a prayer. Make it personal by adding the baby\'s name if you know it.' },
 { q: 'Does Thankeeu work for baby shower cards and gifts?', a: 'Yes. You can create the card before the baby arrives and use it for the baby shower — collecting gifts and messages all in one place.' },
 { q: 'Can family members abroad send baby shower gifts via Thankeeu?', a: 'Yes. Family in the UK, US, Canada, and abroad can contribute to the gift pot, and the parents receive the Naira total in their Nigerian bank account.' },
 ],
 seoMicrocopy: 'Loved by Nigerian offices, families, and diaspora communities celebrating new arrivals.',
 cta: 'Create a New Baby Group Card',
 },

 'staff-appreciation': {
 title: 'Staff Appreciation & Employee Recognition Cards Nigeria',
 h1: 'Staff Appreciation Group Cards Nigeria — Recognise Your Team the Right Way',
 emoji: 'Star',
 tagline: 'Show your team they matter — not just on one day, every day',
 desc: 'The most effective Nigerian HR teams use Thankeeu to send personalised staff appreciation cards — for Employee Appreciation Day, quarterly milestones, peer recognition, and spontaneous thank-yous that boost retention.',
 keywords: 'staff appreciation card Nigeria, employee recognition card Nigeria, employee appreciation card Nigeria, staff recognition Nigeria, team appreciation message Nigeria, employee appreciation day Nigeria, HR recognition tool Nigeria, thank you card for employee Nigeria, staff thank you card Nigeria, employee recognition software Nigeria, staff welfare card Nigeria, peer recognition card Nigeria, employee morale Nigeria, company appreciation card Nigeria, automated birthday card Nigeria HR, staff engagement Nigeria',
 color: '#7C3AED', accent: '#A78BFA', gradient: 'linear-gradient(135deg,#7C3AED 0%,#5B4BDF 100%)',
 bg: '#F5F3FF', cardBg: 'linear-gradient(135deg,#A78BFA,#7C3AED)', inkColor: '#fff',
 signers: 35, amount: '₦95,000', sampleTitle: "Thank You, Adaeze — Q3 MVP ",
 messages: [
 { name: 'MD', text: 'Your work on the Q3 campaign was exceptional. Truly.', type: 'text' },
 { name: 'HR Lead', text: 'Appreciation message (0:28)', type: 'voice' },
 { name: 'Team Lead', text: '', type: 'gif', gif: '' },
 { name: 'Peer', text: 'Team photo — Q3 close-out', type: 'photo', emoji: '' },
 { name: 'Colleague 1', text: 'We see how hard you work. Thank you! ', type: 'text' },
 { name: 'Colleague 2', text: 'The office wouldn\'t be the same without you.', type: 'text' },
 ],
 heroBullets: [
 'Automate Employee Appreciation Day cards for your whole Nigerian team',
 'Connect with SeamlessHR, BambooHR, WorkPay — send cards automatically',
 'Enable peer-to-peer recognition that the whole team can see',
 'Pool a Naira recognition gift — the employee withdraws it themselves',
 ],
 whySection: {
 heading: 'Why Nigerian HR Teams Use Thankeeu for Staff Recognition',
 points: [
 { icon: 'CheckCircle', title: 'Recognition = Retention in Nigeria', body: 'Nigerian talent has options. Companies that consistently recognise employees — with personalised cards, not just cash bonuses — see lower turnover. A "thank you" with 30 colleagues\'names on it is priceless.' },
 { icon: 'Briefcase', title: 'Automate What HR Teams Don\'t Have Time For', body: 'Nigerian HR teams are stretched thin. Thankeeu for Teams automates birthday cards, work anniversary cards, and milestone recognitions — so your HR team focuses on strategy, not remembering dates.' },
 { icon: 'CheckCircle', title: 'Works with Nigerian HR Systems', body: 'Thankeeu integrates with SeamlessHR, BambooHR, WorkPay, Zoho People, and SAP SuccessFactors. Plug in your employee data and every recognition moment is triggered automatically.' },
 { icon: 'CheckCircle', title: 'Works for Distributed Nigerian Teams', body: 'Whether your team is in Lagos, Abuja, Enugu, remote, or hybrid — everyone signs the same digital card. Remote employees feel just as recognised as those in the office.' },
 ],
 },
 useCases: ['Employee Appreciation Day cards for the whole company', 'Monthly MVP recognition card', 'End-of-year staff appreciation from the CEO', 'Peer-to-peer thank you cards', 'Department-wide appreciation during tough projects'],
 faqs: [
 { q: 'How does Thankeeu help Nigerian HR teams with staff appreciation?', a: 'Thankeeu for Teams connects with your HR system and automates recognition cards for birthdays, anniversaries, and milestones. For one-off appreciation, HR or managers create a card manually and share the signing link with the team.' },
 { q: 'What is a good staff appreciation message for a Nigerian employee?', a: 'Be specific. "Thank you for the late nights during the product launch — your work directly contributed to our record revenue this quarter. We see you." Specificity turns a thank-you card into a career memory.' },
 { q: 'How can I send an Employee Appreciation Day card to all my staff in Nigeria?', a: 'With Thankeeu for Teams, you can create one appreciation card per employee and schedule them all to deliver on the same day. Or create a single company-wide card that leadership signs and sends to every staff member.' },
 { q: 'Can Thankeeu integrate with SeamlessHR or BambooHR for automated staff recognition?', a: 'Yes. Thankeeu for Teams integrates with SeamlessHR, BambooHR, WorkPay, Zoho People, and SAP SuccessFactors. It reads your employee data and triggers recognition cards automatically on the right dates.' },
 { q: 'Can employees use Thankeeu to recognise each other (peer recognition)?', a: 'Yes. Any team member can create a peer appreciation card and share the link for others to co-sign. This builds a bottom-up recognition culture — not just top-down HR-driven appreciation.' },
 { q: 'Is Thankeeu affordable for Nigerian companies of all sizes?', a: 'Yes. Individual cards start from ₦5,000. Packs bring the per-card price to ₦4,000. Thankeeu for Teams has plans for startups and enterprises, with per-employee pricing. No minimum team size required.' },
 ],
 seoMicrocopy: 'Trusted by Nigerian startups, banks, telcos, and NGOs for employee recognition.',
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

export default function OccasionLandingPage({ occasion }) {
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
 areaServed: [
 { '@type': 'Country', name: 'Nigeria' },
 { '@type': 'City', name: 'Lagos' },
 { '@type': 'City', name: 'Abuja' },
 { '@type': 'City', name: 'Port Harcourt' },
 { '@type': 'City', name: 'Ibadan' },
 { '@type': 'City', name: 'Kano' },
 { '@type': 'Country', name: 'United Kingdom' },
 { '@type': 'Country', name: 'United States' },
 { '@type': 'Country', name: 'Canada' },
 ],
 url: canonicalUrl,
 offers: {
 '@type': 'Offer',
 price: '5000',
 priceCurrency: 'NGN',
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
 {d.cta} — from ₦5,000
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

 {/* ── Sample Card Preview (unchanged) ── */}
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
 ['', 'Naira gift pot', 'Everyone contributes any amount via Flutterwave — pooled and ready for the recipient to withdraw.'],
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

 {/* ── Why Nigeria section ── */}
 <section className="max-w-5xl mx-auto px-4 pb-16">
 <h2 className="font-display text-2xl font-bold text-center mb-2" style={{ color: '#1a1a2e' }}>
 {d.whySection.heading}
 </h2>
 <p className="text-center text-warm-500 text-sm mb-8">Built for Nigerian offices, families, and teams — everywhere</p>
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
 <p className="text-center text-warm-500 text-sm mb-8">No design skills needed. No WhatsApp group chasing.</p>
 <div className="grid sm:grid-cols-3 gap-6">
 {[
 { step: '1', icon: 'Sparkles', title: 'Create the card', body: 'Choose the occasion, add the recipient\'s name, and write your message. Takes 2 minutes.' },
 { step: '2', icon: 'Share2', title: 'Share the link', body: 'Send the signing link via WhatsApp, email, or Slack. Anyone can sign from their phone — no account needed.' },
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
 <p className="text-white/80 mb-2 text-lg">Start in 2 minutes. Pay from ₦5,000 only when you send.</p>
 <p className="text-white/60 text-sm mb-8">No design skills needed · Share via WhatsApp · Naira payments via Flutterwave</p>
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
