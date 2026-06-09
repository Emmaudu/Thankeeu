import { useSEO } from '../../hooks/useSEO';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const OCCASIONS = {
  birthday: {
    title: 'Birthday Group Cards & Gift Pots', emoji: '🎂', tagline: 'Make their birthday unforgettable',
    desc: "A birthday only comes once a year. Thankeeu brings together heartfelt messages, photos, voice notes, and a pooled cash gift from everyone who cares.",
    color: '#E84393', accent: '#FF6FB7', gradient: 'linear-gradient(135deg,#FF6FB7 0%,#7C6EFF 100%)',
    bg: '#FFF0F7', cardBg: 'linear-gradient(135deg,#FF6FB7,#E84393)', inkColor: '#fff',
    signers: 24, amount: '₦85,000', sampleTitle: "Tolu's 30th Birthday 🎂",
    messages: [
      { name: 'Ada O.', text: 'You deserve every bit of this! ❤️', type: 'text' },
      { name: 'Emeka K.', text: '🎵 Voice note (0:18)', type: 'voice' },
      { name: 'Kemi B.', text: '🌸', type: 'gif', gif: '🥳' },
      { name: 'Tunde A.', text: 'Congrats! Drinks on you 😄', type: 'text' },
      { name: 'Ngozi P.', text: '📸 Photo memory', type: 'photo', emoji: '🤩' },
      { name: 'Uche S.', text: '30 looks SO good on you!', type: 'text' },
    ],
  },
  farewell: {
    title: 'Farewell Group Cards', emoji: '👋', tagline: "Send them off with love they'll never forget",
    desc: "When a colleague leaves, everyone wants to say goodbye properly. One beautiful card brings the whole team's voice together.",
    color: '#7C6EFF', accent: '#A78BFA', gradient: 'linear-gradient(135deg,#7C6EFF 0%,#5B4BDF 100%)',
    bg: '#F5F3FF', cardBg: 'linear-gradient(135deg,#7C6EFF,#5B4BDF)', inkColor: '#fff',
    signers: 42, amount: '₦120,000', sampleTitle: "Emeka's Farewell 👋",
    messages: [
      { name: 'Bisi A.', text: 'We will genuinely miss you around here!', type: 'text' },
      { name: 'Taiwo R.', text: '🎵 Heartfelt voice note (0:32)', type: 'voice' },
      { name: 'Ola M.', text: '🥹', type: 'gif', gif: '🥹' },
      { name: 'Funmi N.', text: '📸 Our team outing memory', type: 'photo', emoji: '🌟' },
      { name: 'Seun K.', text: 'All the best in the next chapter 💜', type: 'text' },
      { name: 'HR Team', text: 'From all of us — thank you. ✨', type: 'text' },
    ],
  },
  anniversary: {
    title: 'Work Anniversary Cards', emoji: '🏆', tagline: 'Celebrate loyalty and years of dedication',
    desc: "Work anniversaries mark years of commitment. Recognise your colleague's milestones with warm appreciation from the whole team.",
    color: '#F59E0B', accent: '#FBBF24', gradient: 'linear-gradient(135deg,#F59E0B 0%,#D97706 100%)',
    bg: '#FFFBEB', cardBg: 'linear-gradient(135deg,#FBBF24,#F59E0B)', inkColor: '#1c1917',
    signers: 18, amount: '₦50,000', sampleTitle: "Kemi's 5-Year Anniversary 🏆",
    messages: [
      { name: 'MD Office', text: '5 incredible years. We are grateful! 🙏', type: 'text' },
      { name: 'Chidi F.', text: '🎵 Special tribute (0:45)', type: 'voice' },
      { name: 'Amaka S.', text: '⭐', type: 'gif', gif: '⭐' },
      { name: 'Sales Team', text: '📸 5-year team photo', type: 'photo', emoji: '📸' },
      { name: 'HR Lead', text: 'Your dedication inspires us all!', type: 'text' },
      { name: 'Tobi N.', text: 'Here\'s to 5 more amazing years 🥂', type: 'text' },
    ],
  },
  promotion: {
    title: 'Promotion Celebration Cards', emoji: '🌟', tagline: 'Cheer their hard-earned milestone',
    desc: "Promotions are earned with years of effort. Celebrate them loudly with a group card full of genuine pride, warm wishes, and a collective gift.",
    color: '#10B981', accent: '#34D399', gradient: 'linear-gradient(135deg,#10B981 0%,#059669 100%)',
    bg: '#ECFDF5', cardBg: 'linear-gradient(135deg,#34D399,#10B981)', inkColor: '#fff',
    signers: 31, amount: '₦75,000', sampleTitle: "Amaka's Promotion to Lead 🌟",
    messages: [
      { name: 'CEO', text: 'Truly well-deserved. Onwards and upwards! 🚀', type: 'text' },
      { name: 'Dev Team', text: '🎵 Congratulations song (0:22)', type: 'voice' },
      { name: 'Design', text: '🎊', type: 'gif', gif: '🎊' },
      { name: 'Marketing', text: '📸 Celebration selfie!', type: 'photo', emoji: '🤩' },
      { name: 'HR Team', text: 'You earned every bit of this!', type: 'text' },
      { name: 'Ade O.', text: 'Watch out world — she\'s on the move! 💚', type: 'text' },
    ],
  },
  wedding: {
    title: 'Wedding Congratulations Cards', emoji: '💍', tagline: 'Celebrate love together as a team',
    desc: "Nothing unites a team like a wedding! Create a beautiful card filled with heartfelt wishes and a generous pooled gift.",
    color: '#EC4899', accent: '#F472B6', gradient: 'linear-gradient(135deg,#EC4899 0%,#DB2777 100%)',
    bg: '#FDF2F8', cardBg: 'linear-gradient(135deg,#F472B6,#EC4899)', inkColor: '#fff',
    signers: 37, amount: '₦200,000', sampleTitle: "Tunde & Zainab's Wedding 💍",
    messages: [
      { name: 'Team Lead', text: 'Wishing you a lifetime of happiness! 💕', type: 'text' },
      { name: 'Blessing A.', text: '🎵 Wedding toast voice note (0:40)', type: 'voice' },
      { name: 'Adaeze O.', text: '💍', type: 'gif', gif: '💍' },
      { name: 'Engineering', text: '📸 Office send-off photo!', type: 'photo', emoji: '🥂' },
      { name: 'Finance Team', text: 'May your bond grow stronger each day!', type: 'text' },
      { name: 'HR Team', text: 'From all of us — congratulations! 🎉', type: 'text' },
    ],
  },
  graduation: {
    title: 'Graduation Celebration Cards', emoji: '🎓', tagline: 'Honour their greatest academic achievement',
    desc: "Years of hard work, late nights, and determination led to this moment. A Thankeeu graduation card lets everyone celebrate them together — with messages, photos, and a gift.",
    color: '#6366F1', accent: '#818CF8', gradient: 'linear-gradient(135deg,#6366F1 0%,#4F46E5 100%)',
    bg: '#EEF2FF', cardBg: 'linear-gradient(135deg,#818CF8,#6366F1)', inkColor: '#fff',
    signers: 29, amount: '₦90,000', sampleTitle: "Chidi's Graduation Day 🎓",
    messages: [
      { name: 'Mum 💕', text: 'We are beyond proud of you, my son!', type: 'text' },
      { name: 'Dad', text: '🎵 Special message (1:02)', type: 'voice' },
      { name: 'Best Friends', text: '🎓', type: 'gif', gif: '🎓' },
      { name: 'Course Mates', text: '📸 Graduation day photo!', type: 'photo', emoji: '📸' },
      { name: 'Femi A.', text: 'DOCTOR in the making! 🩺🔥', type: 'text' },
      { name: 'Aunty Ngozi', text: 'This degree belongs to all of us 💙', type: 'text' },
    ],
  },
  'new-baby': {
    title: 'New Baby & Baby Shower Cards', emoji: '👶', tagline: 'Welcome the newest bundle of joy',
    desc: "A new baby is the greatest gift. Celebrate the parents with a beautiful group card full of love, blessings, and a gift to help them through those wonderful early days.",
    color: '#F97316', accent: '#FB923C', gradient: 'linear-gradient(135deg,#FB923C 0%,#F97316 100%)',
    bg: '#FFF7ED', cardBg: 'linear-gradient(135deg,#FB923C,#F97316)', inkColor: '#fff',
    signers: 22, amount: '₦65,000', sampleTitle: "Welcome Baby Zara 👶",
    messages: [
      { name: 'HR Team', text: 'The whole office is over the moon for you! 👶', type: 'text' },
      { name: 'Temi A.', text: '🎵 Lullaby voice note (0:35)', type: 'voice' },
      { name: 'Design Team', text: '👶', type: 'gif', gif: '🍼' },
      { name: 'Marketing', text: '📸 Baby shower photo!', type: 'photo', emoji: '🎀' },
      { name: 'Bola O.', text: 'She is already so loved! ❤️', type: 'text' },
      { name: 'CEO', text: 'Best wishes to your growing family 🌟', type: 'text' },
    ],
  },
};

const MessageMiniCard = ({ msg, color }) => {
  const icons = { voice: '🎙️', gif: msg.gif, photo: msg.emoji || '📸', text: null };
  return (
    <div className="rounded-2xl p-3 border flex flex-col gap-1.5 relative overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.92)', borderColor: 'rgba(0,0,0,0.07)', minHeight: 80 }}>
      {msg.type === 'photo' && (
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
          <span className="text-sm">🎙️</span>
          <div className="flex gap-0.5 items-end h-4">
            {[3,5,7,4,6,8,5,3,7,5,4,6].map((h,i) => (
              <div key={i} className="w-0.5 rounded-full" style={{ height: h*2, background: color, opacity: 0.7 }} />
            ))}
          </div>
          <span className="text-xs text-purple-600 font-medium">{msg.text.split('(')[1]?.replace(')','') || '0:20'}</span>
        </div>
      )}
      {msg.type === 'gif' && (
        <div className="text-3xl text-center leading-tight">{msg.gif}</div>
      )}
      {msg.type === 'photo' && (
        <div className="text-center text-2xl">📸 <span className="text-xs text-gray-500 font-medium">{msg.text.replace('📸 ','')}</span></div>
      )}
      {msg.type === 'text' && (
        <p className="text-xs text-gray-600 leading-relaxed">{msg.text}</p>
      )}
    </div>
  );
};

export default function OccasionLandingPage({ occasion }) {
  const d = OCCASIONS[occasion] || OCCASIONS.birthday;
  useSEO({ title: `${d.title} — Thankeeu`, description: d.desc, noIndex: false });

  return (
    <div className="min-h-screen" style={{ background: d.bg }}>
      <Navbar />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-12 text-center">
        <div className="text-7xl mb-5">{d.emoji}</div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-5"
          style={{ background: `${d.color}15`, border: `1.5px solid ${d.color}40`, color: d.color }}>
          {d.title}
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold mb-5 leading-tight"
          style={{ color: '#1a1a2e' }}>{d.tagline}</h1>
        <p className="text-warm-500 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">{d.desc}</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/create-card"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-base shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            style={{ background: d.gradient }}>
            ✨ Create a card — from ₦5,000
          </Link>
          <Link to="/company/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base border-2 transition-all hover:-translate-y-0.5"
            style={{ borderColor: d.color, color: d.color, background: 'white' }}>
            🏢 For teams — free setup
          </Link>
        </div>
      </section>

      {/* Card Preview — rich with media types */}
      <section className="max-w-lg mx-auto px-4 pb-16">
        <div className="rounded-3xl shadow-2xl overflow-hidden border border-white/60"
          style={{ background: 'white' }}>
          {/* Card header bar */}
          <div className="h-2.5" style={{ background: d.gradient }} />
          <div className="p-5">
            {/* Card title + meta */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{d.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-gray-900 truncate">{d.sampleTitle}</p>
                <p className="text-xs text-gray-400">{d.signers} people signed · photos, VNs, GIFs & gifts</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: `${d.color}15`, color: d.color }}>
                ✓ Active
              </span>
            </div>

            {/* Messages grid — shows mixed media */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {d.messages.map((msg, i) => (
                <MessageMiniCard key={i} msg={msg} color={d.color} />
              ))}
            </div>

            {/* Gift pot */}
            <div className="rounded-2xl p-3.5 flex items-center gap-3"
              style={{ background: `${d.color}0d`, border: `1.5px solid ${d.color}30` }}>
              <span className="text-2xl">🎁</span>
              <div className="flex-1">
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs font-bold" style={{ color: d.color }}>Gift pot</span>
                  <span className="text-xs font-extrabold" style={{ color: d.color }}>{d.amount}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: `${d.color}25` }}>
                  <div className="h-full rounded-full" style={{ width: '78%', background: d.gradient }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's inside */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="font-display text-2xl font-bold text-center mb-2" style={{ color: '#1a1a2e' }}>
          What goes inside every card
        </h2>
        <p className="text-center text-warm-500 text-sm mb-8">
          Each card is a collection of individual message cards — like a digital card box
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            ['💌', 'Personal messages', 'Everyone writes a heartfelt message with their name attached'],
            ['📸', 'Photos & videos', 'Upload up to 5 photos or videos — shown as a beautiful carousel'],
            ['🎙️', 'Voice notes', 'Record an audio message directly from any phone — heard in their voice'],
            ['😂', 'GIFs & reactions', 'Add animated GIFs and emoji reactions to make it come alive'],
            ['🎁', 'Cash gift pot', 'Everyone contributes any amount via Flutterwave — pooled for the recipient'],
            ['⏰', 'Scheduled delivery', 'Set the exact date and time — delivered at the perfect moment'],
          ].map(([icon, title, desc], i) => (
            <div key={i} className="rounded-2xl p-5 border-2 transition-all hover:shadow-md"
              style={{ background: 'white', borderColor: `${d.color}20` }}>
              <div className="text-3xl mb-2">{icon}</div>
              <p className="font-bold text-gray-900 mb-1">{title}</p>
              <p className="text-gray-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-white py-16 px-4 text-center"
        style={{ background: d.gradient }}>
        <h2 className="font-display text-3xl font-extrabold mb-3">Ready to make someone's day?</h2>
        <p className="text-white/80 mb-8 text-lg">Start free. Pay only when you send.</p>
        <Link to="/create-card"
          className="inline-flex items-center gap-2 bg-white font-bold px-8 py-4 rounded-2xl text-base shadow-lg hover:shadow-xl transition-all"
          style={{ color: d.color }}>
          ✨ Create your first card →
        </Link>
      </section>

      <Footer />
    </div>
  );
}
