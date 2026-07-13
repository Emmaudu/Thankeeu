/**
 * OccasionPage — reusable template for showing an occasion example:
 * birthday, farewell, graduation, anniversary, promotion, new-baby
 * Shows a beautiful example card with messages, voice note, photo, and gift pot.
 */
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';
import { useSEO } from '../hooks/useSEO';

const OCCASIONS = {
 birthday: {
 icon: 'Cake', accent: '#7C3AED', bg: '#F5F0FF',
 title: 'Birthday Group Cards',
 headline: 'Make every birthday unforgettable',
 desc: 'Pool a group gift and collect heartfelt messages, photos, and voice notes. Delivered on the exact day.',
 example: {
 recipient: 'Adaeze',
 cardTitle: "Happy Birthday Adaeze! ",
 messages: [
 { name: 'Emeka T.', msg: 'Wishing you the most wonderful birthday! The office is brighter because of you. ', gift: 5000 },
 { name: 'Kemi B.', msg: 'Happy birthday queen! Still remember when we covered for each other during the audit — best partner ever! ', gift: 10000 },
 { name: 'Tunde A.', msg: 'Another year of being fabulous! Hope your day is as amazing as you are.', gift: 5000 },
 { name: 'Sarah O.', msg: 'Voice note attached — listen for a surprise message!', isVoice: true, gift: 2500 },
 ],
 giftTotal: 87500,
 },
 seo: { title: 'Online Group Birthday Card + Gift Pot | Thankeeu', desc: 'Create a beautiful online group birthday card everyone can sign. Pool a Naira birthday gift via Flutterwave. Messages, photos, voice notes. From ₦5,000.', keywords: 'online group birthday card Nigeria, birthday group card everyone signs, birthday gift pool Nigeria, happy birthday group card' },
 },
 farewell: {
 icon: 'Briefcase', accent: '#0EA5E9', bg: '#EFF6FF',
 title: 'Farewell Group Cards',
 headline: 'Send them off with love',
 desc: 'Create a farewell card with memories, inside jokes, voice notes, and a group gift to celebrate their journey.',
 example: {
 recipient: 'Chukwuma',
 cardTitle: "Best wishes on your next chapter, Chukwuma! ",
 messages: [
 { name: 'David P.', msg: 'The office genuinely will not be the same. You brought the best energy every single day. Good luck — you deserve everything!', gift: 10000 },
 { name: 'Amaka N.', msg: 'Remember that time you stayed until 11pm to help us finish the proposal? That is the kind of colleague everyone deserves. Miss you already!', gift: 5000 },
 { name: 'James K.', msg: 'Five years of laughs, wins, and lessons. Go show the world what we already know you\'re capable of. ', gift: 15000 },
 { name: 'Blessing U.', msg: 'Voice note — hear from the whole team!', isVoice: true, gift: 5000 },
 ],
 giftTotal: 120000,
 },
 seo: { title: 'Online Group Farewell Card for Colleague | Thankeeu', desc: 'Send a heartfelt farewell card from the whole team. Collect messages, voice notes, photos and a pooled going-away gift in one beautiful card. For colleagues leaving.', keywords: 'online farewell card Nigeria, going away group card, colleague leaving card, group farewell gift Nigeria' },
 },
 graduation: {
 icon: 'GraduationCap', accent: '#10B981', bg: '#F0FDF4',
 title: 'Graduation Group Cards',
 headline: 'Celebrate their greatest achievement',
 desc: 'Years of hard work, all-nighters, and resilience. Celebrate with a card full of pride and love.',
 example: {
 recipient: 'Tobechukwu',
 cardTitle: "Congratulations Dr. Tobechukwu! ",
 messages: [
 { name: 'Mum & Dad', msg: 'We have watched you work so hard for this. We could not be prouder. This is just the beginning. ', gift: 50000 },
 { name: 'Ife A.', msg: 'Roommate to doctor — what a journey! I was there for the 3am study sessions. You earned every bit of this!', gift: 10000 },
 { name: 'Prof. Bello', msg: 'Watching you grow from a nervous first-year to a graduating doctor has been one of the joys of my career.', gift: 0 },
 { name: 'Study Group', msg: 'Voice message from the whole study group!', isVoice: true, gift: 25000 },
 ],
 giftTotal: 150000,
 },
 seo: { title: 'Online Group Graduation Card & Gift | Thankeeu', desc: 'Celebrate a graduation with a beautiful group card from family, friends and classmates. Pool a Naira graduation gift everyone contributes to. Makes them feel truly celebrated.', keywords: 'group graduation card Nigeria, graduation gift pool, online graduation card friends, NYSC graduation card' },
 },
 anniversary: {
 icon: 'Gift', accent: '#F43F5E', bg: '#FFF1F2',
 title: 'Anniversary Group Cards',
 headline: 'Celebrate love and commitment',
 desc: 'Whether it\'s a wedding anniversary or a work milestone, make it unforgettable with messages from everyone who cares.',
 example: {
 recipient: 'Mr. & Mrs. Okonkwo',
 cardTitle: "Happy 10th Anniversary! ",
 messages: [
 { name: 'Chioma F.', msg: 'Ten years and you two still look at each other the same way you did at the wedding. That is rare. That is love. ', gift: 20000 },
 { name: 'Victor O.', msg: 'Best best man I ever was for two people who so clearly belong together! Here is to decades more.', gift: 10000 },
 { name: 'The Adeyemis', msg: 'Watching your love story has inspired our own relationship more than you know. Happy anniversary!', gift: 15000 },
 { name: 'Family WhatsApp Group', msg: 'Special voice message from the whole family!', isVoice: true, gift: 50000 },
 ],
 giftTotal: 200000,
 },
 seo: { title: 'Online Group Anniversary Card & Gift Pool | Thankeeu', desc: 'Celebrate a work or wedding anniversary with a group card from the whole team or family. Everyone adds a message. Pool a Naira anniversary gift. Delivered on the day.', keywords: 'work anniversary group card Nigeria, wedding anniversary card online, group anniversary gift pool, staff anniversary card' },
 },
 promotion: {
 icon: 'TrendingUp', accent: '#F59E0B', bg: '#FFFBEB',
 title: 'Promotion Group Cards',
 headline: 'They earned it — celebrate them',
 desc: 'Hard work, late nights, and results — now it\'s time to celebrate their next level.',
 example: {
 recipient: 'Funmi',
 cardTitle: "Congratulations on your promotion, Funmi! ",
 messages: [
 { name: 'CEO', msg: 'This promotion is the result of three years of consistent excellence. The team is lucky to have you leading them. Congratulations!', gift: 0 },
 { name: 'Adaeze K.', msg: 'I remember when you joined as a junior analyst. Watching you grow into a leader has been one of the best parts of working here!', gift: 10000 },
 { name: 'Tech Team', msg: 'You always pushed us to do better. Now you have the title to match what we already knew. Congrats boss! ', gift: 25000 },
 { name: 'Entire Department', msg: 'Voice note from your whole department!', isVoice: true, gift: 30000 },
 ],
 giftTotal: 95000,
 },
 seo: { title: 'Online Group Promotion Congratulations Card | Thankeeu', desc: 'Celebrate a colleague\'s promotion with a group card from the whole team. Everyone signs and chips in for a pooled gift. The perfect way to say congratulations.', keywords: 'promotion congratulations card Nigeria, group card for promotion, colleague promotion gift Nigeria, work promotion online card' },
 },
 'new-baby': {
 icon: 'Baby', accent: '#EC4899', bg: '#FDF2F8',
 title: 'Baby Shower & New Baby Cards',
 headline: 'Welcome the newest member of the family',
 desc: 'Celebrate the joy of a new arrival with a card full of warm wishes, memories, and a group gift for the new parents.',
 example: {
 recipient: 'The Ogundimu Family',
 cardTitle: "Welcome baby Zara! ",
 messages: [
 { name: 'Tolu M.', msg: 'She is absolutely perfect. You are going to be the most amazing parents — the way you both show up for people shows exactly who you are. Welcome Zara! ', gift: 15000 },
 { name: 'Seun P.', msg: 'We have been waiting for you for 9 months, Zara! The aunties are ready with all the love in the world. ', gift: 10000 },
 { name: 'Office Team', msg: 'Congratulations! We promise to be the best work-family little Zara could ask for. Sending all our love!', gift: 20000 },
 { name: 'Grandparents', msg: 'A very special voice message from grandma and grandpa!', isVoice: true, gift: 50000 },
 ],
 giftTotal: 175000,
 },
 seo: { title: 'Online Group Baby Shower Card & Gift | Thankeeu', desc: 'Welcome the new baby with a group card full of warm wishes from family, friends and colleagues. Pool a baby shower gift everyone contributes to — delivered straight to the parents.', keywords: 'baby shower group card Nigeria, new baby card online, group baby gift pool Nigeria, welcome baby card colleagues' },
 },
};

export default function OccasionPage() {
 const { occasion } = useParams();
 const data = OCCASIONS[occasion];

 if (!data) {
 return (
 <div className="min-h-screen section-dots" style={{ background:'#F5F3FF' }}>
 <Navbar />
 <div className="flex items-center justify-center min-h-[60vh] px-4 text-center">
 <div>
 <div className="text-5xl mb-4 text-warm-200">?</div>
 <h2 className="text-2xl font-bold text-warm-900 mb-3">Occasion not found</h2>
 <Link to="/" className="btn-primary px-6 py-3">← Back to home</Link>
 </div>
 </div>
 <Footer />
 </div>
 );
 }

 useSEO({ title: data?.seo?.title || data?.title || "Thankeeu", description: data?.seo?.desc || "", canonical: `/occasions/${occasion}`, keywords: data.seo.keywords || '' });

 const { example } = data;
 const giftFmt = (n) => n > 0 ? `₦${n.toLocaleString()}` : null;

 return (
 <div className="min-h-screen flex flex-col section-dots" style={{ background: '#F8F6FF' }}>
 <Navbar />

 {/* Hero */}
 <section className="py-14 md:py-20 px-4 text-center" style={{ background: `linear-gradient(160deg,${data.bg},#FDFCFF 60%)` }}>
 <div className="max-w-2xl mx-auto">
 {data.icon && <div className="mb-4 flex justify-center"><div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{background:data.bg}}><Icon name={data.icon} size={32} style={{color:data.accent}}/></div></div>}
 <div className="mx-auto mb-4" style={{ borderColor: `${data.accent}40`, color: data.accent }}>
 {data.title}
 </div>
 <h1 style={{ fontFamily:"'Nunito',sans-serif", fontWeight:900, fontSize:'clamp(1.75rem,6vw,3rem)', letterSpacing:'-0.02em', color:'#1A1035', marginBottom:'1rem' }}>
 {data.headline}
 </h1>
 <p className="text-base sm:text-lg text-warm-600 mb-8 max-w-lg mx-auto">{data.desc}</p>
 <div className="flex flex-col sm:flex-row gap-3 justify-center">
 <Link to="/card/new" className="btn-primary px-8 py-4 text-base">Create a {data.icon} card</Link>
 <Link to="/pricing" className="btn-secondary px-8 py-4 text-base">See pricing</Link>
 </div>
 </div>
 </section>

 {/* Example card */}
 <section className="py-14 px-4">
 <div className="max-w-4xl mx-auto">
 <div className="text-center mb-8">
 <h2 style={{ fontFamily:"'Nunito',sans-serif", fontWeight:900, fontSize:'1.6rem', color:'#1A1035', letterSpacing:'-0.01em' }}>
 Here's what it looks like
 </h2>
 <p className="text-warm-500 mt-2">A real-style example — every message, voice note, photo, and gift collected automatically.</p>
 </div>

 {/* Card header */}
 <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ background: data.bg, border: `2px solid ${data.accent}30` }}>
 <div className="text-center px-6 py-10" style={{ background: `linear-gradient(135deg,${data.accent}15,${data.accent}05)` }}>
 {data.icon && <div className="mb-3 flex justify-center"><div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{background:data.bg}}><Icon name={data.icon} size={24} style={{color:data.accent}}/></div></div>}
 <h2 style={{ fontFamily:"'Nunito',sans-serif", fontWeight:900, fontSize:'1.75rem', color:'#1A1035' }}>
 {example.cardTitle}
 </h2>
 <div className="flex flex-wrap justify-center gap-3 mt-4">
 <span className="bg-white/80 rounded-xl px-4 py-1.5 text-sm font-bold text-warm-700">
 {example.messages.length} people signed
 </span>
 <span className="rounded-xl px-4 py-1.5 text-sm font-bold text-white" style={{ background: data.accent }}>
 {giftFmt(example.giftTotal)} gift pot
 </span>
 </div>
 </div>

 {/* Messages */}
 <div className="p-6 grid sm:grid-cols-2 gap-4">
 {example.messages.map((msg, i) => (
 <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-white">
 <div className="flex items-center gap-3 mb-3">
 <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: data.accent }}>
 {msg.name.slice(0,2).toUpperCase()}
 </div>
 <p className="font-bold text-sm text-warm-900">{msg.name}</p>
 {msg.gift > 0 && (
 <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-xl flex-shrink-0">
 +{giftFmt(msg.gift)}
 </span>
 )}
 </div>
 {msg.isVoice ? (
 <div className="flex items-center gap-3 bg-purple-50 rounded-xl px-4 py-3">
 <span className="inline-flex w-8 h-8 rounded-xl bg-primary-100 items-center justify-center flex-shrink-0"></span>
 <div>
 <p className="text-sm font-semibold text-primary-700">Voice note</p>
 <div className="flex items-center gap-1 mt-1">
 <div className="h-1.5 w-24 bg-primary-200 rounded-xl overflow-hidden">
 <div className="h-full bg-primary-500 rounded-xl" style={{ width:'65%' }} />
 </div>
 <span className="text-xs text-warm-400">0:18</span>
 </div>
 </div>
 </div>
 ) : (
 <p className="text-sm text-warm-700 leading-relaxed">{msg.msg}</p>
 )}
 </div>
 ))}
 </div>

 {/* Gift pot total */}
 <div className="mx-6 mb-6 rounded-2xl p-5 text-white" style={{ background: `linear-gradient(135deg,${data.accent},${data.accent}cc)` }}>
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm font-bold opacity-80 mb-1">Total gift pot</p>
 <p style={{ fontSize:'2rem', fontFamily:"'Nunito',sans-serif", fontWeight:900 }}>
 {giftFmt(example.giftTotal)}
 </p>
 <p className="text-sm opacity-75 mt-1">Withdrawn directly to {example.recipient}'s bank account via Flutterwave</p>
 </div>
 
 </div>
 </div>
 </div>
 </div>
 </section>

 {/* How it works for this occasion */}
 <section className="py-14 px-4" style={{ background: data.bg }}>
 <div className="max-w-3xl mx-auto text-center">
 <h2 style={{ fontFamily:"'Nunito',sans-serif", fontWeight:900, fontSize:'1.6rem', color:'#1A1035', marginBottom:'2rem' }}>
 Create this card in under 2 minutes
 </h2>
 <div className="grid sm:grid-cols-3 gap-6">
 {[
 { num:'1', title:'Create the card', desc:`Pick the ${data.icon} occasion, add ${example.recipient}'s name and the delivery date.` },
 { num:'2', title:'Share signing link', desc:'Drop the link in WhatsApp or email. Everyone signs at their own time — no account needed.' },
 { num:'3', title:'It delivers itself', desc:`On the day, ${example.recipient} gets a beautiful card and can withdraw the gift to their bank account.` },
 ].map(s => (
 <div key={s.num} className="bg-white rounded-2xl p-6 border-2" style={{ borderColor: `${data.accent}25` }}>
 <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white mb-3 mx-auto" style={{ background: data.accent }}>
 {s.num}
 </div>
 <h3 style={{ fontFamily:"'Nunito',sans-serif", fontWeight:800, color:'#1A1035', marginBottom:'0.5rem' }}>{s.title}</h3>
 <p className="text-sm text-warm-500 leading-relaxed">{s.desc}</p>
 </div>
 ))}
 </div>
 <Link to="/card/new" className="btn-primary inline-block mt-8 px-8 py-4 text-base">
 Get started — ₦5,000 to send
 </Link>
 </div>
 </section>

 <Footer />
 </div>
 );
}
