import { useSEO } from '../../hooks/useSEO';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const OCCASIONS = {
  birthday: { title:'Birthday Group Cards & Gift Pots', emoji:'🎂', color:'#E84393', bg:'from-pink-50 via-rose-50 to-purple-50', tagline:'Make their birthday unforgettable', desc:"A birthday only comes once a year. A Thankeeu birthday card brings together heartfelt messages, photos, voice notes, and a pooled cash gift from everyone who cares.", sampleTitle:"Tolu's 30th Birthday", signers:24, amount:'₦85,000' },
  farewell: { title:'Farewell Group Cards', emoji:'👋', color:'#7C6EFF', bg:'from-purple-50 via-indigo-50 to-blue-50', tagline:"Send them off with love they'll never forget", desc:"When a colleague leaves, everyone wants to say goodbye properly. A Thankeeu farewell card gives the whole team one beautiful voice — messages, memories, and a parting gift.", sampleTitle:"Emeka's Farewell", signers:42, amount:'₦120,000' },
  anniversary: { title:'Work Anniversary Cards', emoji:'🏆', color:'#F59E0B', bg:'from-amber-50 via-yellow-50 to-orange-50', tagline:'Celebrate loyalty and years of dedication', desc:"Work anniversaries mark years of commitment. Recognise your colleague's milestones with warm appreciation from the whole team.", sampleTitle:"Kemi's 5-Year Anniversary", signers:18, amount:'₦50,000' },
  promotion: { title:'Promotion Celebration Cards', emoji:'🌟', color:'#10B981', bg:'from-green-50 via-emerald-50 to-teal-50', tagline:'Cheer their hard-earned milestone', desc:"Promotions are earned with years of effort. Celebrate them loudly with a group card full of genuine pride, warm wishes, and a collective gift.", sampleTitle:"Amaka's Promotion to Lead", signers:31, amount:'₦75,000' },
  wedding: { title:'Wedding Congratulations Cards', emoji:'💍', color:'#EC4899', bg:'from-pink-50 via-fuchsia-50 to-rose-50', tagline:'Celebrate love together as a team', desc:"Nothing unites a team like a wedding! Create a beautiful card filled with heartfelt wishes, wedding memories, and a generous pooled gift.", sampleTitle:"Tunde & Zainab's Wedding", signers:37, amount:'₦200,000' },
};

export default function OccasionLandingPage({ occasion }) {
  const d = OCCASIONS[occasion] || OCCASIONS.birthday;
  useSEO({ title:`${d.title} — Thankeeu`, description: d.desc });

  return (
    <div className={`min-h-screen bg-gradient-to-br ${d.bg}`}>
      <Navbar />
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="text-7xl mb-5">{d.emoji}</div>
        <div className="pill mx-auto mb-4" style={{ background:`${d.color}15`, borderColor:`${d.color}40`, color:d.color }}>{d.title}</div>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-warm-900 mb-5 leading-tight">{d.tagline}</h1>
        <p className="text-warm-500 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">{d.desc}</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/create-card" className="btn-primary px-8 py-4 text-base">✨ Create a card — from ₦5,000</Link>
          <Link to="/company/signup" className="btn-secondary px-8 py-4 text-base">🏢 For teams — free setup</Link>
        </div>
      </section>

      {/* Mock card preview */}
      <section className="max-w-lg mx-auto px-4 pb-16">
        <div className="bg-white rounded-3xl shadow-xl border border-purple-100 overflow-hidden">
          <div className="h-2" style={{ background: d.color }} />
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{d.emoji}</span>
              <div><p className="font-display font-bold text-warm-900">{d.sampleTitle}</p>
              <p className="text-xs text-warm-400">{d.signers} people signed</p></div>
              <span className="ml-auto text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-full">✓ Active</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[{n:'Ada O.',m:'You deserve every bit of this! ❤️'},{n:'Emeka K.',m:'So proud of you 🌟'},{n:'Kemi B.',m:'You worked so hard for this 💜'},{n:'Tunde A.',m:'Congrats! Drinks on you 😄'}].map((item,i)=>(
                <div key={i} className="bg-warm-50 rounded-xl p-3 border border-purple-100">
                  <p className="text-xs font-bold text-warm-700 mb-1">{item.n}</p>
                  <p className="text-xs text-warm-500">{item.m}</p>
                </div>
              ))}
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
              <span className="text-2xl">🎁</span>
              <div className="flex-1">
                <div className="flex justify-between mb-1"><span className="text-xs font-bold text-green-700">Gift pot</span><span className="text-xs font-bold text-green-700">{d.amount}</span></div>
                <div className="h-1.5 bg-green-200 rounded-full"><div className="h-full bg-green-500 rounded-full" style={{ width:'78%' }} /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="font-display text-2xl font-bold text-center text-warm-900 mb-8">What's inside every card</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[['💌','Unlimited messages','Everyone writes a personal message'],['📸','Photos & videos','Up to 5 uploads shown as carousel'],['🎙️','Voice notes','Record audio directly from your phone'],['🎁','Cash gift pot','Everyone contributes via Paystack'],['⏰','Scheduled delivery','Set exact date and time'],['♾️','Saved forever','Never expires — always accessible']].map(([icon,t,desc],i)=>(
            <div key={i} className="bg-white rounded-2xl border border-purple-100 p-5">
              <div className="text-3xl mb-2">{icon}</div>
              <p className="font-bold text-warm-800 mb-1">{t}</p>
              <p className="text-warm-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-primary-500 to-pink-500 text-white py-16 px-4 text-center">
        <h2 className="font-display text-3xl font-bold mb-3">Ready to make someone's day?</h2>
        <p className="text-white/80 mb-8 text-lg">Start free. Pay only when you send.</p>
        <Link to="/create-card" className="inline-flex items-center bg-white text-primary-600 font-bold px-8 py-4 rounded-2xl text-base shadow-lg hover:shadow-xl transition-all">✨ Create your first card →</Link>
      </section>
      <Footer />
    </div>
  );
}
