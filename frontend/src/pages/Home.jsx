import { useSEO, SCHEMAS } from '../hooks/useSEO';
import { useState, useEffect, useRef } from 'react';
import { RotatingPrice, CurrencyToggle } from '../utils/currencyUI';
import { formatCurrency } from '../utils/currency';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';
import VoiceRecorder from '../components/VoiceRecorder';
import { demoAPI } from '../utils/api';
import { CARD_DESIGNS } from '../utils/cardDesigns';
import toast from 'react-hot-toast';

const HERO_FONT_INJECT = `
@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Sacramento&family=Great+Vibes&display=swap');
.font-dancing    { font-family:'Dancing Script', cursive; }
.font-vibes      { font-family:'Great Vibes', cursive; }
.font-sacramento { font-family:'Sacramento', cursive; }
`;

const ROTATING_WORDS = [
  'Birthday', 'Leaving', 'Thank You', 'Appreciation', 'Recognition', 'Farewell',
  'Shout-Out', "Valentine's", 'Anniversary', 'Wedding', 'Baby Shower', 'Graduation',
  'Promotion', 'Retirement', 'Christmas', 'Get Well',
];

const SAMPLE_MESSAGES = [
  { name: 'Jessica Morgan', role: 'VP of Product', font: 'font-vibes',
    media: 'photo', photoUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80',
    text: 'Working across time zones with you has been one of the highlights of this role. Happy birthday — hope your day is as bright as the energy you bring! 🎉',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face' },
  { name: 'Tunde Bakare', role: 'Operations Lead', font: 'font-dancing',
    media: 'gif', gifUrl: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    text: 'You are the reason the ops team runs as smoothly as it does. Have a fantastic celebration! 🙌',
    avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=120&h=120&fit=crop&crop=face' },
  { name: 'Sarah Chen', role: 'Head of Design', font: 'font-dancing',
    media: 'voice',
    text: "You have the rarest combination — impeccable taste and genuine humility. Happy birthday! 🌸",
    avatar: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?w=120&h=120&fit=crop&crop=face' },
  { name: 'Marcus Williams', role: 'Sales Director', font: 'font-sacramento',
    media: 'gif', gifUrl: 'https://media.giphy.com/media/3o7abGQa0aRJUurpII/giphy.gif',
    text: 'You make everyone around you sharper. Happy birthday to the most quietly influential person! 🎯',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop&crop=face' },
];

const OCCASIONS = [
  { icon: 'Cake', label: 'Birthday' },      { icon: 'Heart', label: "Valentine's" },
  { icon: 'Briefcase', label: 'Farewell' },  { icon: 'Gift', label: 'Anniversary' },
  { icon: 'HandHeart', label: 'Wedding' },   { icon: 'Baby', label: 'Baby Shower' },
  { icon: 'GraduationCap', label: 'Graduation' }, { icon: 'TrendingUp', label: 'Promotion' },
  { icon: 'Sun', label: 'Retirement' },      { icon: 'Snowflake', label: 'Christmas' },
  { icon: 'HeartPulse', label: 'Get Well' }, { icon: 'Party', label: 'More…' },
];

const STEPS = [
  { num:'01', icon:'Wand',   label:'Create',  title:'Pick occasion & design', desc:'14 occasions, beautiful designs, set delivery date. Done in 2 minutes.' },
  { num:'02', icon:'Share',  label:'Invite',  title:'Share signing link',     desc:'WhatsApp, email, Slack. Anyone can sign — no account needed.' },
  { num:'03', icon:'Heart',  label:'Collect', title:'Pool a gift together',   desc:'Chip in from ₦500. Flutterwave handles everything — no cash chasing.' },
  { num:'04', icon:'Rocket', label:'Deliver', title:'Deliver the surprise',   desc:'Schedule or send instantly. Your recipient opens a full card with messages, media & gift.' },
];

const FEATURES = [
  { icon:'Zap',         title:'Instant signing links', desc:'Copy a WhatsApp link in one click. No account needed to sign.' },
  { icon:'Gift',        title:'Built-in gift pots',    desc:'Everyone chips in via Flutterwave. Pooled automatically.' },
  { icon:'Smartphone',  title:'Any media type',        desc:'Text, photo, video, voice note, GIF — all in one card.' },
  { icon:'Clock',       title:'Scheduled delivery',    desc:'Set the date. Card arrives exactly when it should.' },
  { icon:'Lock',        title:'Private messages',      desc:'Contributors can mark personal notes visible only to the recipient.' },
  { icon:'BarChart',    title:'Real-time tracking',    desc:"See who's signed, how much is collected, in your dashboard." },
];

const TESTIMONIALS = [
  { name:'Adaeze O.', role:'HR Manager',   location:'Lagos, Nigeria',        text:"Our colleague's farewell card had 34 messages and a ₦120k spa voucher. She cried. Thankeeu made it ridiculously easy.", stars:5 },
  { name:'Emeka T.',  role:'Engineer',     location:'Abuja, Nigeria',        text:"Organised my girlfriend's birthday from London. 22 people signed, raised ₦500k. She was genuinely shocked. 10/10.", stars:5 },
  { name:'Kemi B.',   role:'People Ops',   location:'Port Harcourt, Nigeria', text:"No more Google Forms and chasing receipts. Everything just works. The HRIS sync alone saved us hours per week.", stars:5 },
];

const TEAM_SIZE_OPTIONS = ['1–10','11–50','51–200','201–500','500+'];

/* ─── Demo messages for the hero flipbook ───────────────────────────── */
const DEMO_MESSAGES = [
  { initials: 'AO', name: 'Adaeze O.',  color: '#7C3AED', bg: '#EDE9FE',
    text: "Happy birthday!! You're the reason our whole team smiles every day 🎉",
    gif: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif' },
  { initials: 'EK', name: 'Emeka K.',   color: '#0D9488', bg: '#CCFBF1',
    text: 'Wishing you all the joy this year, boss! You deserve every bit of it 🙌',
    gif: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif' },
  { initials: 'KI', name: 'Kemi I.',    color: '#DB2777', bg: '#FCE7F3',
    text: 'Another year wiser and still the coolest person in the office 😂❤️',
    gif: 'https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif' },
  { initials: 'BD', name: 'Bolu D.',    color: '#92400E', bg: '#FEF3C7',
    text: 'From the whole team — we are so lucky to have you. Keep shining! ✨',
    gif: 'https://media.giphy.com/media/3o7abGQa0aRJUurpII/giphy.gif' },
  { initials: 'TN', name: 'Tunde N.',   color: '#1D4ED8', bg: '#DBEAFE',
    text: 'You have no idea how much we appreciate everything you do. 🫶',
    gif: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif' },
];

/* Giphy URLs available in the sign form GIF picker */
const GIPHY_OPTIONS = [
  { url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',   label: '🎉 Celebrate' },
  { url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',   label: '🌟 Star' },
  { url: 'https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif',    label: '🎂 Birthday' },
  { url: 'https://media.giphy.com/media/3o7abGQa0aRJUurpII/giphy.gif',   label: '👏 Clap' },
  { url: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif',         label: '💜 Love' },
  { url: 'https://media.giphy.com/media/RrVzUOXldFe8M/giphy.gif',         label: '🎊 Party' },
];

/* ─── B2B demo modal ─────────────────────────────────────────────────── */
const DemoModal = ({ onClose }) => {
  const [form, setForm] = useState({ contact_name:'', email:'', company_name:'', phone:'', team_size:'', message:'' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.contact_name.trim() || !form.email.trim() || !form.company_name.trim())
      return toast.error('Please fill in your name, email and company name');
    setLoading(true);
    try { await demoAPI.submit(form); setDone(true); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed. Email us at support@thankeeu.com'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background:'rgba(26,16,53,0.6)', backdropFilter:'blur(8px)' }} onClick={onClose}>
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[92vh] overflow-y-auto"
        style={{ background:'#fff', border:'1.5px solid #EDE5FF' }} onClick={e => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-50 flex items-center justify-center animate-bounce-soft"><Icon name="Party" size={32} className="text-primary-500"/></div>
            <h3 className="text-2xl font-bold text-warm-900 mb-2">Request received!</h3>
            <p className="text-warm-500 text-sm mb-6">We'll reach out within 12 hours.</p>
            <button onClick={onClose} className="btn-primary px-8">Close</button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="pill mb-2 inline-flex items-center gap-1.5"><Icon name="Calendar" size={13}/> Book a demo</div>
                <h3 className="text-xl font-bold text-warm-900">See Thankeeu for Teams live</h3>
                <p className="text-warm-500 text-sm mt-1">Free · 30 min · Usually within 24hrs</p>
              </div>
              <button onClick={onClose} className="text-warm-400 hover:text-warm-700 w-9 h-9 flex items-center justify-center rounded-xl hover:bg-warm-100">
                <Icon name="X" size={18}/>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">Full name *</label>
                  <input className="input" placeholder="Your name" value={form.contact_name} onChange={e=>setForm(p=>({...p,contact_name:e.target.value}))} required/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">Work email *</label>
                  <input type="email" className="input" placeholder="you@company.com" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} required/>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">Company name *</label>
                  <input className="input" placeholder="Acme Corp" value={form.company_name} onChange={e=>setForm(p=>({...p,company_name:e.target.value}))} required/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">Phone</label>
                  <input className="input" placeholder="+234…" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1.5">Team size</label>
                <div className="flex flex-wrap gap-2">
                  {TEAM_SIZE_OPTIONS.map(s => (
                    <button type="button" key={s} onClick={()=>setForm(p=>({...p,team_size:s}))}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${form.team_size===s?'border-primary-400 bg-primary-50 text-primary-600':'border-purple-100 text-warm-600 hover:border-primary-300'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1.5">What would you like to see?</label>
                <textarea className="input resize-none" rows={3} placeholder="Birthday automations, HRIS sync..." value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))}/>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base">
                {loading?<span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Booking…</span>:<span className="inline-flex items-center justify-center gap-2"><Icon name="Calendar" size={16}/> Book my demo <Icon name="ArrowRight" size={16}/></span>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

/* ─── Live flipbook card preview (hero) ─────────────────────────────── */
const LiveCardPreview = () => {
  const [activeIdx,   setActiveIdx]   = useState(0);
  const [signerName,  setSignerName]  = useState('');
  const [signerMsg,   setSignerMsg]   = useState('');
  const [signerGif,   setSignerGif]   = useState('');
  const [messages,    setMessages]    = useState(DEMO_MESSAGES);
  const [signed,      setSigned]      = useState(false);
  const [flipping,    setFlipping]    = useState(false);
  const [showGifPick,  setShowGifPick]  = useState(false);
  const [showEmoji,    setShowEmoji]    = useState(false);
  const [signerPhoto,  setSignerPhoto]  = useState(null);  // { url, file }
  const photoInputRef = useRef();

  const handleSign = () => {
    if (!signerName.trim() || !signerMsg.trim()) return;
    const colors = ['#7C3AED','#0D9488','#DB2777','#92400E','#1D4ED8'];
    const bgs    = ['#EDE9FE','#CCFBF1','#FCE7F3','#FEF3C7','#DBEAFE'];
    const idx    = messages.length % colors.length;
    setMessages(prev => [...prev, {
      initials: signerName.trim().split(' ').map(w=>w[0].toUpperCase()).join('').slice(0,2),
      name: signerName.trim(), color: colors[idx], bg: bgs[idx],
      text: signerMsg.trim(),
      gif:  signerGif || undefined,
      photo: signerPhoto?.url || undefined,
    }]);
    setSigned(true);
    setActiveIdx(messages.length);
  };

  const goTo = (dir) => {
    if (flipping) return;
    setFlipping(true);
    setTimeout(() => {
      setActiveIdx(i => Math.max(0, Math.min(messages.length - 1, i + dir)));
      setFlipping(false);
    }, 220);
  };

  const msg = messages[activeIdx];

  return (
    <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: '1.25rem', boxSizing: 'border-box' }}>

      {/* ── Album card ── */}
      {/* margin:0 52px creates the space the arrows (left:-26, right:-26) sit in */}
      <div style={{ position: 'relative', width: 'calc(100% - 104px)', margin: '0 auto', overflow: 'visible' }}>
        {/* Stack shadows */}
        <div style={{ position:'absolute', left:'50%', transform:'translateX(calc(-50% - 16px)) rotate(-3deg)', width:'calc(100% - 28px)', height:'100%', background:'#fff', borderRadius:20, border:'1.5px solid #DDD6FE', zIndex:0 }}/>
        <div style={{ position:'absolute', left:'50%', transform:'translateX(calc(-50% + 16px)) rotate(3deg)',  width:'calc(100% - 14px)', height:'100%', background:'#fff', borderRadius:20, border:'1.5px solid #DDD6FE', zIndex:0 }}/>

        {/* Main card */}
        <div style={{
          position: 'relative', zIndex: 1,
          borderRadius: 20, border: '2px solid #DDD6FE',
          padding: '1.25rem 1.5rem 3rem',
          background: msg.bg,
          boxShadow: '0 8px 40px rgba(124,58,237,0.12)',
          transition: 'all 0.22s ease',
          transform: flipping ? 'rotateY(90deg)' : 'rotateY(0deg)',
          opacity: flipping ? 0 : 1,
          minHeight: 340,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.875rem', flexShrink:0 }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:msg.color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.875rem', flexShrink:0 }}>
              {msg.initials}
            </div>
            <div>
              <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:'0.9375rem', color:'#1A1035', margin:0, lineHeight:1.3 }}>{msg.name}</p>
              <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'0.75rem', color:'#7C5CBF', margin:0 }}>signed this card</p>
            </div>
          </div>

          {/* Photo or GIF */}
          {(msg.gif || msg.photo) && (
            <div style={{ borderRadius:12, overflow:'hidden', marginBottom:'0.75rem', flexShrink:0, lineHeight:0 }}>
              <img src={msg.photo || msg.gif} alt="" style={{ width:'100%', height:140, objectFit:'cover', display:'block' }} loading="lazy"/>
            </div>
          )}

          {/* Message */}
          <p style={{ fontFamily:"'Caveat', cursive", fontSize:'1.25rem', lineHeight:1.6, color:'#1A1035', margin:'0 0 auto', flex:1 }}>
            {msg.text}
          </p>

          {/* Dots */}
          <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:'0.75rem', flexShrink:0 }}>
            {messages.map((_,i) => (
              <button key={i} onClick={()=>setActiveIdx(i)} aria-label={`Page ${i+1}`}
                style={{ width: i===activeIdx ? 22 : 8, height:8, borderRadius: i===activeIdx ? 4 : '50%', background: i===activeIdx ? msg.color : '#DDD6FE', border:'none', cursor:'pointer', padding:0, transition:'all 0.2s' }}/>
            ))}
          </div>

        </div>

        {/* Nav arrows — on the WRAPPER (overflow:visible), NOT inside the card (overflow:hidden) */}
        <button onClick={()=>goTo(-1)} disabled={activeIdx===0}
          style={{ position:'absolute', left:-26, top:'50%', transform:'translateY(-50%)', width:48, height:48, borderRadius:'50%', background:'#fff', border:'2.5px solid #C4B5FD', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#7C3AED', opacity: activeIdx===0 ? 0.25 : 1, zIndex:20, boxShadow:'0 4px 20px rgba(124,58,237,0.22)', flexShrink:0 }}>
          <Icon name="ChevronLeft" size={22}/>
        </button>
        <button onClick={()=>goTo(1)} disabled={activeIdx===messages.length-1}
          style={{ position:'absolute', right:-26, top:'50%', transform:'translateY(-50%)', width:48, height:48, borderRadius:'50%', background:'#fff', border:'2.5px solid #C4B5FD', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#7C3AED', opacity: activeIdx===messages.length-1 ? 0.25 : 1, zIndex:20, boxShadow:'0 4px 20px rgba(124,58,237,0.22)', flexShrink:0 }}>
          <Icon name="ChevronRight" size={22}/>
        </button>

        {/* Count badge */}
        <div style={{ position:'absolute', top:-12, right:16, background:'#fff', border:'1.5px solid #DDD6FE', borderRadius:20, padding:'3px 10px', fontSize:'0.75rem', fontWeight:700, color:'#7C3AED', display:'flex', alignItems:'center', gap:5, zIndex:2 }}>
          <Icon name="FileText" size={12}/> {activeIdx+1} / {messages.length}
        </div>
      </div>

      {/* ── Sign panel ── */}
      {!signed ? (
        <div style={{ background:'#fff', border:'2px solid #EDE5FF', borderRadius:20, padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'0.875rem', fontWeight:700, color:'#4A3A7A', margin:0, display:'flex', alignItems:'center', gap:6 }}>
            <Icon name="PenLine" size={14}/> <strong>Sign this demo card</strong> — no account needed
          </p>

          {/* Name */}
          <input className="lcp-input" placeholder="Your name" value={signerName} onChange={e=>setSignerName(e.target.value)} maxLength={60}/>

          {/* Message textarea + emoji button */}
          <div style={{ position:'relative' }}>
            <textarea className="lcp-textarea" placeholder="Write your message here…" rows={3}
              value={signerMsg} onChange={e=>setSignerMsg(e.target.value)} maxLength={500}
              style={{ resize:'none', paddingRight:'2.5rem' }}/>
            {/* Emoji toggle */}
            <button type="button" onClick={()=>{ setShowEmoji(s=>!s); setShowGifPick(false); }}
              style={{ position:'absolute', bottom:8, right:8, width:32, height:32, borderRadius:'50%', background:'#F5F0FF', border:'1.5px solid #DDD6FE', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>
              😊
            </button>
            {/* Emoji picker */}
            {showEmoji && (
              <div style={{ position:'absolute', bottom:'calc(100% + 4px)', right:0, zIndex:50, background:'#fff', border:'1.5px solid #EDE9FE', borderRadius:16, padding:12, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', display:'flex', flexWrap:'wrap', gap:6, maxWidth:220 }}>
                {['🎉','🎂','❤️','🙌','✨','😊','🥳','💜','🎁','👏','😂','🌟','🔥','💐','🫶','🎊','💝','🌸','😍','🤗'].map(emoji => (
                  <button key={emoji} type="button" onClick={()=>{ setSignerMsg(m=>m+emoji); setShowEmoji(false); }}
                    style={{ width:34, height:34, borderRadius:8, border:'none', background:'#F5F0FF', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Media buttons row */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, position:'relative' }}>
            {/* Photos */}
            <button type="button" onClick={()=>photoInputRef.current?.click()}
              style={{ background: signerPhoto ? '#EDE9FE' : '#F5F0FF', border:`1.5px solid ${signerPhoto?'#A78BFA':'#DDD6FE'}`, borderRadius:12, padding:'6px 12px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:'0.8125rem', color:'#7C3AED', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6 }}>
              📷 {signerPhoto ? 'Change photo' : 'Add photo'}
            </button>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) setSignerPhoto({ url: URL.createObjectURL(f), file: f });
              }}/>
            {signerPhoto && (
              <button type="button" onClick={()=>setSignerPhoto(null)}
                style={{ background:'none', border:'none', cursor:'pointer', fontSize:'0.8rem', color:'#DC2626', fontWeight:700, alignSelf:'center' }}>✕</button>
            )}

            {/* GIF */}
            <button type="button" onClick={()=>{ setShowGifPick(s=>!s); setShowEmoji(false); }}
              style={{ background: signerGif ? '#EDE9FE' : '#F5F0FF', border:`1.5px solid ${signerGif?'#A78BFA':'#DDD6FE'}`, borderRadius:12, padding:'6px 12px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:'0.8125rem', color:'#7C3AED', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6 }}>
              🎞️ {signerGif ? 'Change GIF' : 'Add a GIF'}
            </button>
            {signerGif && (
              <button type="button" onClick={()=>setSignerGif('')}
                style={{ background:'none', border:'none', cursor:'pointer', fontSize:'0.8rem', color:'#DC2626', fontWeight:700, alignSelf:'center' }}>✕</button>
            )}

            {/* Voice note */}
            <VoiceRecorder onRecorded={f => {
              // Store voice as a local URL for demo purposes
              const url = URL.createObjectURL(f);
              setSignerMsg(m => m + (m ? ' ' : '') + '🎙️');
              // show a brief toast-like indicator
            }}/>

            {/* GIF grid */}
            {showGifPick && (
              <div style={{ width:'100%', marginTop:4, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                {GIPHY_OPTIONS.map(g => (
                  <button key={g.url} type="button"
                    onClick={()=>{ setSignerGif(g.url); setShowGifPick(false); }}
                    style={{ position:'relative', borderRadius:10, overflow:'hidden', border:`2.5px solid ${signerGif===g.url?'#7C3AED':'transparent'}`, cursor:'pointer', padding:0, lineHeight:0 }}>
                    <img src={g.url} alt={g.label} style={{ width:'100%', height:60, objectFit:'cover', display:'block' }} loading="lazy"/>
                    <span style={{ position:'absolute', bottom:3, left:0, right:0, textAlign:'center', fontSize:10, fontWeight:700, color:'#fff', textShadow:'0 1px 3px rgba(0,0,0,0.6)' }}>{g.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Photo preview */}
          {signerPhoto && (
            <div style={{ borderRadius:12, overflow:'hidden', lineHeight:0 }}>
              <img src={signerPhoto.url} alt="Your photo" style={{ width:'100%', height:90, objectFit:'cover', display:'block', borderRadius:12 }}/>
            </div>
          )}

          {/* GIF preview */}
          {signerGif && !showGifPick && (
            <div style={{ borderRadius:10, overflow:'hidden', lineHeight:0 }}>
              <img src={signerGif} alt="Selected GIF" style={{ width:'100%', height:80, objectFit:'cover', display:'block', borderRadius:10 }}/>
            </div>
          )}

          <button className="lcp-sign-btn" onClick={handleSign} disabled={!signerName.trim()||!signerMsg.trim()}>
            <Icon name="Heart" size={15}/> Add my message
          </button>
        </div>
      ) : (
        <div style={{ background:'#F0FDF4', border:'2px solid #BBF7D0', borderRadius:20, padding:'1.25rem', textAlign:'center' }}>
          <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>🎉</div>
          <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:'1.125rem', color:'#14532D', margin:'0 0 0.25rem' }}>You signed it!</p>
          <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'0.875rem', color:'#166534', margin:'0 0 0.75rem' }}>Your message is on page {activeIdx + 1}. Ready to create your own?</p>
          <Link to="/card/new" className="btn-primary w-full text-center py-3 inline-flex items-center justify-center gap-2">
            <Icon name="Sparkles" size={15}/> Create a card — it's free
          </Link>
        </div>
      )}
    </div>
  );
};

/* ─── Main Home ──────────────────────────────────────────────────────── */
const Home = () => {
  useSEO({
    title:'Thankeeu — Online Group Cards & Gifts for Every Occasion',
    description:"The world's favourite online group card and gift platform. Birthdays, farewells, promotions and more.",
    canonical:'/',
    jsonLd:[SCHEMAS.organization, SCHEMAS.website, SCHEMAS.softwareApp],
  });

  const [showDemo,     setShowDemo]     = useState(false);
  const [homeCurrency, setHomeCurrency] = useState('NGN');
  const [wordIndex,    setWordIndex]    = useState(0);

  useEffect(() => {
    const id = setInterval(() => setWordIndex(i => (i + 1) % ROTATING_WORDS.length), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen" style={{ background:'linear-gradient(180deg,#F5F0FF 0%,#FDFCFF 20%)' }}>
      <style>{HERO_FONT_INJECT}</style>
      <Navbar onBookDemo={() => setShowDemo(true)} />

      {/* ══ HERO ══ */}
      <section className="relative overflow-visible pt-0 pb-10 md:pt-0 md:pb-14 px-2 sm:px-4 gc-font section-dots">

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-32 pointer-events-none" style={{ background:'radial-gradient(ellipse,rgba(139,92,246,0.12) 0%,transparent 70%)' }}/>

        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-16 items-start">

            {/* Left: headline + CTAs + sample card grid */}
            <div className="text-center lg:text-left">
              <h1 className="font-extrabold text-warm-900 mb-6" style={{ fontSize:'clamp(3.5rem,9vw,7rem)', lineHeight:1.0, letterSpacing:'-0.03em' }}>
                <span style={{ display:'block', fontSize:'clamp(2.8rem,7vw,5.5rem)', color:'#1A1035' }}>Send a Group</span>
                <span style={{ display:'block', background:'linear-gradient(135deg,#8B5CF6,#7C3AED 50%,#F43F5E)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', minWidth:'1px', fontSize:'clamp(3.5rem,9vw,7rem)' }}>
                  {ROTATING_WORDS[wordIndex]}
                </span>
                <span style={{ display:'block', fontSize:'clamp(2.8rem,7vw,5.5rem)', color:'#1A1035' }}>Card Online</span>
              </h1>

              <p className="text-warm-600 mb-9 max-w-xl mx-auto lg:mx-0" style={{ fontSize:'clamp(1.2rem,2.8vw,1.45rem)', lineHeight:1.6 }}>
                Share a group card with your friends and colleagues, let them send in heartfelt messages, gifts, GIFs, voice notes, pictures, videos for your birthdays and special occasions, all in one place.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-6">
                <Link to="/card/new" className="gc-btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2">
                  <Icon name="Sparkles" size={18}/> Create a card
                </Link>
                <Link to="/sample" className="gc-btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2">
                  <Icon name="Eye" size={18}/> Try our demo card
                </Link>
              </div>
              <p className="text-sm font-medium text-warm-500 text-center lg:text-left">No signup needed to start · Takes under 2 minutes</p>

              {/* Sample card grid — large, rich tiles matching GroupCards style */}
              <div className="hidden lg:grid grid-cols-2 gap-4 mt-8" style={{ maxWidth: 660 }}>
                {SAMPLE_MESSAGES.map((m, i) => (
                  <div key={m.name} className="bg-white rounded-3xl border-2 border-purple-100 overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                    style={{ marginTop: i % 2 === 1 ? 44 : 0, minHeight: 400 }}>
                    {/* Media — large, fills top of card */}
                    {m.media === 'photo' && (
                      <div style={{ height: 160, overflow:'hidden' }}>
                        <img src={m.photoUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} loading="lazy"/>
                      </div>
                    )}
                    {m.media === 'gif' && (
                      <div style={{ height: 160, overflow:'hidden', background:'#1A1035' }}>
                        <img src={m.gifUrl} alt="GIF" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} loading="lazy"/>
                      </div>
                    )}
                    {m.media === 'voice' && (
                      <div style={{ height: 100, background:'linear-gradient(135deg,#EDE9FE,#F5F0FF)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, padding:'0 16px' }}>
                        <div style={{ display:'flex', gap:3, alignItems:'flex-end', height:36 }}>
                          {Array.from({length:20},(_,i)=>(
                            <div key={i} style={{ width:3, borderRadius:2, background:'#7C3AED', height: 10+Math.sin(i*0.7)*16, opacity:0.6+Math.sin(i)*0.4 }}/>
                          ))}
                        </div>
                        <span style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:11, fontWeight:700, color:'#7C3AED' }}>🎙️ Voice note · 0:34</span>
                      </div>
                    )}
                    {/* Card body */}
                    <div style={{ padding:'18px 20px 22px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                        <img src={m.avatar} alt={m.name} style={{ width:36, height:36, borderRadius:10, objectFit:'cover', flexShrink:0 }}/>
                        <div>
                          <p className={m.font} style={{ fontWeight:700, fontSize:'1.05rem', color:'#1A1035', margin:0, lineHeight:1.2 }}>{m.name}</p>
                          <p style={{ fontSize:'0.7rem', color:'#9CA3AF', margin:0 }}>{m.role}</p>
                        </div>
                      </div>
                      <p className={m.font} style={{ fontSize:'1.2rem', color:'#374151', lineHeight:1.65, margin:0 }}>{m.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile sample cards — also bigger */}
              <div className="lg:hidden grid grid-cols-2 gap-3 mt-4 max-w-sm mx-auto">
                {SAMPLE_MESSAGES.map(m => (
                  <div key={m.name} className="bg-white rounded-2xl border-2 border-purple-100 overflow-hidden shadow-sm">
                    {m.media === 'photo' && <div style={{ height:90, overflow:'hidden' }}><img src={m.photoUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy"/></div>}
                    {m.media === 'gif'   && <div style={{ height:90, overflow:'hidden', background:'#1A1035' }}><img src={m.gifUrl} alt="GIF" style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy"/></div>}
                    {m.media === 'voice' && (
                      <div style={{ height:60, background:'linear-gradient(135deg,#EDE9FE,#F5F0FF)', display:'flex', alignItems:'center', justifyContent:'center', gap:2 }}>
                        {Array.from({length:14},(_,i)=><div key={i} style={{ width:3, borderRadius:2, background:'#7C3AED', height:8+Math.sin(i*0.8)*10, opacity:0.7 }}/>)}
                      </div>
                    )}
                    <div style={{ padding:'13px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
                        <img src={m.avatar} alt={m.name} style={{ width:28, height:28, borderRadius:8, objectFit:'cover', flexShrink:0 }}/>
                        <p className={m.font} style={{ fontWeight:700, fontSize:'0.92rem', color:'#1A1035', margin:0 }}>{m.name}</p>
                      </div>
                      <p style={{ fontSize:'1rem', color:'#52525B', lineHeight:1.65, margin:0 }}>{m.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: live flipbook demo */}
            <div className="lcp-outer-wrap" style={{ paddingTop: '0.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
              <LiveCardPreview />
            </div>
          </div>
        </div>
      </section>

      <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>

      {/* ══ REAL CARD GALLERY — 20 actual card designs ══ */}
      <section className="py-14 md:py-20 px-4 gc-font" style={{ background:'linear-gradient(180deg,#F5F0FF 0%,#FDFCFF 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <div className="pill mx-auto mb-3 inline-flex items-center gap-1.5"><Icon name="Sparkles" size={13}/> 25 stunning designs</div>
            <h2 className="font-bold text-warm-900 mb-3" style={{ fontSize:'clamp(1.85rem,5.5vw,2.75rem)' }}>
              Beautiful cards your people<br/><span className="text-primary-500">will actually remember</span>
            </h2>
            <p className="text-warm-500 text-sm sm:text-base max-w-xl mx-auto">
              Every card is a canvas for photos, voice notes, GIFs and heartfelt words — not just a template.
            </p>
          </div>

          {/* 3-column persuasive callouts above the grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 mt-8">
            {[
              { icon:'Heart', title:'Everyone signs, anywhere', desc:'Share one link on WhatsApp or Slack. No app needed, no login — just click and add a message.' },
              { icon:'Gift', title:'Pool a gift in minutes', desc:'Add a gift pot and let everyone chip in. Money collected safely via Flutterwave — zero cash chasing.' },
              { icon:'Smile', title:'More than just text', desc:'Photos, videos, voice notes, GIFs — your team can express themselves in any way they want.' },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl border-2 border-purple-100 p-5 flex gap-3 items-start">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Icon name={f.icon} size={18} className="text-primary-500"/>
                </div>
                <div>
                  <p className="text-sm font-bold text-warm-900 mb-1">{f.title}</p>
                  <p className="text-xs text-warm-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <style>{`
            .svg-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:14px; }
            @media(max-width:900px){.svg-grid{grid-template-columns:repeat(3,1fr);}}
            @media(max-width:540px){.svg-grid{grid-template-columns:repeat(2,1fr);}}
            .svg-tile { position:relative; border-radius:16px; overflow:hidden; cursor:pointer; aspect-ratio:10/7; box-shadow:0 2px 12px rgba(0,0,0,0.10); transition:transform 0.18s,box-shadow 0.18s; text-decoration:none; display:block; }
            .svg-tile:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(124,58,237,0.18); }
            .svg-tile img { width:100%; height:100%; object-fit:cover; display:block; }
          `}</style>

          <div className="svg-grid">
            {[
              { n:'01', label:'Elegant Bloom' },
              { n:'02', label:'Bold Celebration' },
              { n:'03', label:'Floral Joy' },
              { n:'04', label:'Golden Wishes' },
              { n:'05', label:'Sunshine Birthday' },
              { n:'06', label:'Neon Party' },
              { n:'07', label:'Midnight Stars' },
              { n:'08', label:'Rose Garden' },
              { n:'09', label:'Confetti Pop' },
              { n:'10', label:'Deep Teal' },
              { n:'11', label:'Pastel Dreams' },
              { n:'12', label:'Tropical Vibes' },
              { n:'13', label:'Modern Chic' },
              { n:'14', label:'Royal Purple' },
              { n:'15', label:'Midnight Blue' },
              { n:'16', label:'Cherry Blossom' },
              { n:'17', label:'Sunset Glow' },
              { n:'18', label:'Forest Green' },
              { n:'19', label:'Ice & Sky' },
              { n:'20', label:'Unicorn Magic' },
            ].map(({ n, label }) => (
              <Link key={n} to="/card/new" className="svg-tile" title={`${label} card design`}>
                <img src={`/cards/birthday_${n}.svg`} alt={label} loading="lazy"/>
                <div style={{
                  position:'absolute', bottom:0, left:0, right:0,
                  background:'linear-gradient(0deg,rgba(0,0,0,0.55) 0%,transparent 100%)',
                  padding:'20px 10px 8px', pointerEvents:'none',
                }}>
                  <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:11, color:'#fff', margin:0, textShadow:'0 1px 3px rgba(0,0,0,0.5)' }}>{label}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <p className="text-warm-500 text-sm mb-4">All 25 designs available — pick yours and start in 2 minutes</p>
            <Link to="/card/new" className="gc-btn-primary inline-flex items-center gap-2 px-8 py-4 text-base">
              <Icon name="Sparkles" size={18}/> Start with any design — it's free
            </Link>
          </div>
        </div>
      </section>

            {/* ══ MORE REAL CARDS + SOCIAL PROOF ══ */}
      <section className="py-14 md:py-20 px-4 gc-font" style={{ background:'linear-gradient(180deg,#1A1035 0%,#2D1B69 100%)' }}>
        <div className="max-w-6xl mx-auto">

          {/* Dark section headline */}
          <div className="text-center mb-12">
            <div className="pill mx-auto mb-3 inline-flex items-center gap-1.5" style={{ background:'rgba(255,255,255,0.1)', color:'#E9D5FF', borderColor:'rgba(255,255,255,0.15)' }}>
              <Icon name="Star" size={13}/> Real cards, real moments
            </div>
            <h2 className="font-bold mb-4" style={{ fontSize:'clamp(1.85rem,5.5vw,2.75rem)', color:'#fff' }}>
              More than a card.<br/><span style={{ background:'linear-gradient(135deg,#A78BFA,#F472B6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>A memory they'll keep forever.</span>
            </h2>
            <p style={{ color:'#C4B5FD', fontSize:'clamp(1rem,2.5vw,1.2rem)', maxWidth:520, margin:'0 auto', lineHeight:1.6 }}>
              From heartfelt farewells to wild birthday surprises — Thankeeu turns a simple card into something that actually moves people.
            </p>
          </div>

          {/* 5 more SVG cards (21–25) */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, marginBottom:48 }}>
            {[
              { n:'21', label:'Lavender Luxe',    copy:'Perfect for farewells' },
              { n:'22', label:'Fire & Gold',       copy:'Big energy, big love' },
              { n:'23', label:'Ocean Breeze',      copy:'Calm, warm, beautiful' },
              { n:'24', label:'Midnight Garden',   copy:'Sophisticated & elegant' },
              { n:'25', label:'Candy Pop',         copy:'Fun, bright & bold' },
            ].map(({ n, label, copy }) => (
              <Link key={n} to="/card/new" title={label}
                style={{ position:'relative', borderRadius:16, overflow:'hidden', aspectRatio:'10/7', boxShadow:'0 4px 20px rgba(0,0,0,0.4)', transition:'transform 0.18s,box-shadow 0.18s', textDecoration:'none', display:'block' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-5px)'; e.currentTarget.style.boxShadow='0 16px 40px rgba(167,139,250,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.4)'; }}>
                <img src={`/cards/birthday_${n}.svg`} alt={label} loading="lazy" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(0deg,rgba(0,0,0,0.7) 0%,transparent 100%)', padding:'24px 10px 8px' }}>
                  <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:11, color:'#fff', margin:'0 0 1px', textShadow:'0 1px 3px rgba(0,0,0,0.6)' }}>{label}</p>
                  <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:600, fontSize:9, color:'rgba(255,255,255,0.75)', margin:0 }}>{copy}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* 3-column stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:48 }}>
            {[
              { num:'50,000+', label:'Cards sent', sub:'And counting 🚀' },
              { num:'₦2.3B+',  label:'Gift money pooled', sub:'Safely via Flutterwave' },
              { num:'4.9 ★',   label:'Average rating', sub:'From 3,000+ reviews' },
            ].map(s => (
              <div key={s.num} style={{ background:'rgba(255,255,255,0.06)', border:'1.5px solid rgba(255,255,255,0.12)', borderRadius:20, padding:'24px 20px', textAlign:'center' }}>
                <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:900, fontSize:'clamp(1.75rem,4vw,2.5rem)', color:'#E9D5FF', margin:'0 0 4px', lineHeight:1 }}>{s.num}</p>
                <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:14, color:'#fff', margin:'0 0 2px' }}>{s.label}</p>
                <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:11, color:'#C4B5FD', margin:0 }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Quote testimonials */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(1,1fr)', gap:16, marginBottom:48 }}
            className="sm:grid-cols-3">
            {[
              { text:'"Our colleague's farewell card had 34 messages and a ₦120k spa voucher. She cried. Thankeeu made it ridiculously easy."', name:'Adaeze O.', role:'HR Manager, Lagos' },
              { text:'"Organised my girlfriend's birthday from London. 22 people signed, raised ₦500k. She was genuinely shocked. 10/10."', name:'Emeka T.', role:'Engineer, Abuja' },
              { text:'"No more Google Forms and chasing receipts. Everything just works. The whole team uses it now."', name:'Kemi B.', role:'People Ops, Port Harcourt' },
            ].map(t => (
              <div key={t.name} style={{ background:'rgba(255,255,255,0.06)', border:'1.5px solid rgba(255,255,255,0.12)', borderRadius:20, padding:'24px 20px' }}>
                <div style={{ fontSize:24, marginBottom:12 }}>⭐⭐⭐⭐⭐</div>
                <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:13, color:'#E9D5FF', lineHeight:1.65, margin:'0 0 14px', fontStyle:'italic' }}>{t.text}</p>
                <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:13, color:'#fff', margin:'0 0 2px' }}>{t.name}</p>
                <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:11, color:'#A78BFA', margin:0 }}>{t.role}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link to="/card/new" className="gc-btn-primary inline-flex items-center gap-2 px-8 py-4 text-base" style={{ fontSize:'1.05rem' }}>
              <Icon name="Sparkles" size={18}/> Create your card now — free
            </Link>
            <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', color:'#A78BFA', fontSize:13, marginTop:12 }}>No signup to start · Pay only when you send · Takes 2 minutes</p>
          </div>
        </div>
      </section>

            {/* ══ OCCASIONS ══ */}
      <section className="py-12 md:py-16 px-4 section-dots" style={{ background:'linear-gradient(180deg,#F5F0FF,#F8F4FF)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="pill mx-auto mb-3 inline-flex items-center gap-1.5"><Icon name="Party" size={13}/> 14 occasions</div>
            <h2 className="font-bold text-warm-900" style={{ fontSize:'clamp(1.85rem,5.5vw,2.75rem)' }}>
              Whatever the moment,<br/><span className="text-primary-500">there's a card for it</span>
            </h2>
          </div>
          <div className="occasion-grid">
            {OCCASIONS.map(({ icon, label }) => (
              <Link key={label} to="/card/new"
                className="bg-white border-2 border-purple-100 rounded-2xl p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2 text-center transition-all hover:border-primary-300 hover:bg-primary-50 hover:-translate-y-1 hover:shadow-md active:scale-95">
                <Icon name={icon} size={26} className="text-primary-500"/>
                <span className="text-xs font-semibold text-warm-600 leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>

      {/* ══ HOW IT WORKS ══ */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="pill mx-auto mb-3 inline-flex items-center gap-1.5"><Icon name="Zap" size={13}/> Beautifully simple</div>
            <h2 className="font-bold text-warm-900" style={{ fontSize:'clamp(1.85rem,5.5vw,2.75rem)' }}>
              From zero to delivered<br/><span className="text-primary-500">in under 5 minutes</span>
            </h2>
          </div>
          <div className="steps-grid">
            {STEPS.map(s => (
              <div key={s.num} className="bg-white border-2 border-purple-100 rounded-3xl p-5 transition-all hover:border-primary-300 hover:shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-xl bg-primary-50 border-2 border-primary-200 flex items-center justify-center font-display text-sm font-bold text-primary-600 flex-shrink-0">{s.num}</span>
                  <Icon name={s.icon} size={20} className="text-primary-500"/>
                  <span className="text-xs font-bold uppercase tracking-wide text-primary-500">{s.label}</span>
                </div>
                <h3 className="font-bold text-warm-900 mb-2 text-base">{s.title}</h3>
                <p className="text-sm text-warm-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>

      {/* ══ FEATURES + MOCK CARD ══ */}
      <section className="py-12 md:py-16 px-4 section-dots" style={{ background:'linear-gradient(180deg,#F5F0FF,#F8F4FF)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div>
              <div className="pill mb-4 inline-flex items-center gap-1.5"><Icon name="Heart" size={13}/> For individuals</div>
              <h2 className="font-bold text-warm-900 mb-4" style={{ fontSize:'clamp(1.85rem,5.5vw,2.6rem)' }}>
                Everything a group card<br/><span className="text-primary-500">should actually have</span>
              </h2>
              <p className="text-warm-500 mb-6 leading-relaxed">No generic e-cards. One link, everyone signs, gift collected — and it looks stunning.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7">
                {FEATURES.map(f => (
                  <div key={f.title} className="bg-white rounded-2xl border-2 border-purple-100 p-4 flex gap-3">
                    <Icon name={f.icon} size={18} className="text-primary-500 flex-shrink-0 mt-0.5"/>
                    <div>
                      <p className="text-sm font-bold text-warm-900 mb-0.5">{f.title}</p>
                      <p className="text-xs text-warm-500 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/card/new" className="gc-btn-primary px-7 py-3.5 text-sm w-full sm:w-auto inline-flex items-center justify-center gap-2">
                <Icon name="Sparkles" size={15}/> Create your first card <Icon name="ArrowRight" size={15}/>
              </Link>
            </div>
            {/* Mock card */}
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-50 to-rose-50 border-2 border-purple-200 rounded-3xl p-5 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-purple-100"><Icon name="Cake" size={18} className="text-primary-500"/></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-warm-900 text-sm truncate">Tolu's Birthday Card</p>
                    <p className="text-xs text-warm-500">28 signed · ₦85,000 collected</p>
                  </div>
                  <span className="text-xs font-bold bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full flex-shrink-0 inline-flex items-center gap-1"><Icon name="Check" size={12}/> Active</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { av:'AO', name:'Adaeze O.', msg:"Happy birthday!! You're such an inspiration" },
                    { av:'EK', name:'Emeka K.',  msg:'Wishing you all the joy this year!' },
                    { av:'KI', name:'Kemi I.',   msg:'Another year wiser! Enjoy every moment' },
                    { av:'BD', name:'Bolu D.',   msg:'You deserve all the good things, boss!' },
                  ].map(m => (
                    <div key={m.av} className="bg-white rounded-2xl p-3 border border-purple-100">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{m.av}</div>
                        <span className="text-xs font-semibold text-warm-800 truncate">{m.name}</span>
                      </div>
                      <p className="text-xs text-warm-600 leading-relaxed line-clamp-2">{m.msg}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-green-50 border border-green-200 rounded-2xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Gift" size={17} className="text-green-600"/>
                    <span className="text-xs font-bold text-green-800 flex-1">Gift pot · 28 contributors</span>
                    <span className="font-display text-base font-bold text-green-700">₦85,000</span>
                  </div>
                  <div className="w-full h-2 bg-green-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width:'85%', background:'linear-gradient(90deg,#10B981,#34D399)' }}/>
                  </div>
                  <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">₦85,000 raised · Goal: ₦100,000 <Icon name="Target" size={11}/></p>
                </div>
              </div>
              <div className="absolute -top-3 -right-3 w-9 h-9 rounded-2xl bg-white border-2 border-purple-100 flex items-center justify-center animate-bounce-soft shadow-sm"><Icon name="Party" size={16} className="text-primary-500"/></div>
              <div className="absolute -top-2 -left-3 w-8 h-8 rounded-2xl bg-white border-2 border-purple-100 flex items-center justify-center animate-float shadow-sm"><Icon name="Gift" size={14} className="text-pink-500"/></div>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>

      {/* ══ TESTIMONIALS ══ */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="pill mx-auto mb-3 inline-flex items-center gap-1.5"><Icon name="Star" size={13}/> Real stories</div>
            <h2 className="font-bold text-warm-900" style={{ fontSize:'clamp(1.85rem,5.5vw,2.75rem)' }}>
              People who actually<br/><span className="text-primary-500">made someone's day</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white border-2 border-purple-100 rounded-3xl p-5 flex flex-col gap-3 hover:border-primary-300 hover:shadow-md transition-all">
                <div className="flex gap-0.5">{Array(t.stars).fill(0).map((_,i)=><Icon key={i} name="Star" size={14} className="text-amber-400 fill-amber-400"/>)}</div>
                <p className="text-sm text-warm-600 leading-relaxed italic flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-purple-50">
                  <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold flex-shrink-0">{t.name.split(' ').map(n=>n[0]).join('')}</div>
                  <div>
                    <p className="text-sm font-bold text-warm-900">{t.name}</p>
                    <p className="text-xs text-warm-400">{t.role} · {t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>

      {/* ══ FOR TEAMS ══ */}
      <section className="py-12 md:py-16 px-4 gc-font section-dots" style={{ background:'linear-gradient(180deg,#F5F0FF,#F8F4FF)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="pill mx-auto mb-3 inline-flex items-center gap-1.5"><Icon name="Building" size={13}/> For HR &amp; People teams</div>
            <h2 className="font-bold text-warm-900 mb-3" style={{ fontSize:'clamp(1.85rem,5.5vw,2.75rem)' }}>
              Automate every celebration.<br/><span className="text-primary-500">Zero manual effort.</span>
            </h2>
            <p className="text-warm-500 max-w-xl mx-auto text-sm leading-relaxed">
              Connect your HRIS once. Thankeeu creates cards, notifies departments, pools gifts, and delivers — on the exact right day. Every time.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {[
              { icon:'Link',    title:'HRIS Integration',         desc:'SeamlessHR, BambooHR, Zoho People, WorkPay — one sync and your whole org is in.' },
              { icon:'Party',   title:'12 Occasions Automated',   desc:"Birthdays, farewells, promotions, new hires, Women's Day — zero manual effort." },
              { icon:'Mail',    title:'Whole-dept Notifications', desc:'Every department member gets an email to sign. No one left out.' },
              { icon:'Card',    title:'Gift pot per employee',     desc:'Flutterwave handles multi-currency collections. HR never chases money again.' },
              { icon:'File',    title:'HR Analytics Dashboard',   desc:'Full visibility into automations, upcoming occasions, and spending.' },
              { icon:'Shield',  title:'Approval Workflows',       desc:'Team leaders sign off on card creation. Full control maintained.' },
            ].map(f => (
              <div key={f.title} className="gc-card gc-card-hover p-4 flex gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0"><Icon name={f.icon} size={18} className="text-primary-500"/></div>
                <div>
                  <p className="font-bold text-warm-900 text-sm mb-1">{f.title}</p>
                  <p className="text-xs text-warm-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/company/signup" className="gc-btn-primary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto inline-flex items-center justify-center gap-2"><Icon name="Building" size={16}/> Start for your team <Icon name="ArrowRight" size={15}/></Link>
            <button onClick={() => setShowDemo(true)} className="gc-btn-secondary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto inline-flex items-center justify-center gap-2"><Icon name="Calendar" size={16}/> Book a 30-min demo</button>
          </div>
        </div>
      </section>

      <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>

      {/* ══ PRICING ══ */}
      <section className="py-12 md:py-16 px-4 gc-font">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <p className="text-xs font-semibold text-warm-500 mb-2 uppercase tracking-wide">See prices in your currency</p>
            <CurrencyToggle selected={homeCurrency} onChange={setHomeCurrency}/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-gradient-to-br from-purple-50 to-rose-50 border-2 border-purple-200 rounded-3xl p-7">
              <div className="w-12 h-12 rounded-2xl bg-white border-2 border-purple-200 flex items-center justify-center mb-4"><Icon name="Heart" size={22} className="text-primary-500"/></div>
              <h3 className="text-2xl font-bold text-warm-900 mb-1">For individuals</h3>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-primary-600 font-extrabold text-2xl">{formatCurrency(5000, homeCurrency)}</span>
                <span className="text-warm-400 text-sm">one-time</span>
              </div>
              {homeCurrency !== 'NGN' && <p className="text-xs text-warm-400 mb-3">≈ ₦5,000 · charged at live rate</p>}
              <p className="text-warm-600 mb-5 text-sm leading-relaxed">Create a card for anyone — friend, colleague, family. No account needed to sign.</p>
              <ul className="space-y-2 mb-6">
                {['✓ Quick card creation','✓ Unlimited signers','✓ Global gift pot','✓ Photo & video messages'].map(f => (
                  <li key={f} className="text-sm text-warm-700 flex gap-2"><span className="text-primary-500 font-bold">{f.slice(0,1)}</span>{f.slice(1)}</li>
                ))}
              </ul>
              <Link to="/card/new" className="gc-btn-primary px-7 py-3 w-full sm:w-auto inline-flex items-center justify-center">Get started →</Link>
            </div>
            <div className="rounded-3xl p-7 border-2 border-primary-800" style={{ background:'linear-gradient(135deg,#1A1035,#2E1F6B)' }}>
              <div className="w-12 h-12 rounded-2xl bg-purple-900/40 border-2 border-purple-700 flex items-center justify-center mb-4"><Icon name="Building" size={22} className="text-purple-200"/></div>
              <h3 className="font-display text-2xl font-bold text-purple-100 mb-1">For companies</h3>
              <p className="text-purple-200 font-extrabold text-2xl mb-1">Get a quote</p>
              <p className="text-xs text-purple-400 mb-2">Price based on your team size</p>
              <p className="text-purple-300 mb-5 text-sm leading-relaxed">Automate all team celebrations. Connect your HRIS. Never forget a birthday again.</p>
              <ul className="space-y-2 mb-6">
                {['✓ Unlimited employees','✓ HRIS integration','✓ 12 automated occasions','✓ HR analytics dashboard'].map(f => (
                  <li key={f} className="text-sm text-purple-200 flex gap-2"><span className="text-purple-400 font-bold">{f.slice(0,1)}</span>{f.slice(1)}</li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setShowDemo(true)} className="gc-btn-primary px-6 py-3 text-sm">Get a quote →</button>
                <Link to="/company/signup" className="px-6 py-3 text-sm font-bold rounded-2xl border-2 border-purple-500 text-purple-200 hover:bg-purple-800 transition-colors">Create account</Link>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-warm-400 mt-4 flex items-center justify-center gap-1.5"><Icon name="Globe" size={13}/> Works in Nigeria, UK, US, Canada, Ghana, Kenya, South Africa and beyond · Pay in your local currency</p>
        </div>
      </section>

      <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>

      {/* ══ HOW IT WORKS DETAIL ══ */}
      <section id="how-it-works" className="py-14 md:py-20 px-4 gc-font section-dots" style={{ background:'linear-gradient(180deg,#F5F0FF,#F8F4FF)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="pill mx-auto mb-3 inline-flex items-center gap-1.5"><Icon name="Lightbulb" size={13}/> How it works</div>
            <h2 style={{ fontWeight:800, fontSize:'clamp(2rem,5.5vw,3rem)', letterSpacing:'-0.02em', color:'#1A1035' }}>
              From zero to celebration<br/><span className="text-primary-500">in under 3 minutes</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              { num:'1', icon:'Wand',   title:'Create your card',         desc:'Pick an occasion, choose a design, set the recipient and delivery date. Takes 2 minutes flat.' },
              { num:'2', icon:'Share',  title:'Share the signing link',   desc:'Copy a WhatsApp link or email it. No login needed — anyone can sign from their phone.' },
              { num:'3', icon:'Heart',  title:'Watch messages roll in',   desc:'Your signers add messages, photos, voice notes, GIFs and chip in to the gift pot via Flutterwave.' },
              { num:'4', icon:'Gift',   title:'Deliver the surprise',     desc:'Card and gift arrive by email on the exact day. The recipient opens a beautiful card, reads every message and claims the gift.' },
            ].map(s => (
              <div key={s.num} className="gc-card gc-card-hover p-6 flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-extrabold flex-shrink-0">{s.num}</div>
                <div>
                  <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center mb-2"><Icon name={s.icon} size={16} className="text-primary-500"/></div>
                  <h3 className="font-extrabold" style={{ fontSize:'1rem', color:'#1A1035', marginBottom:'0.3rem' }}>{s.title}</h3>
                  <p className="text-sm text-warm-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-warm-400 mt-8">Need a walkthrough? <a href="/how-it-works" className="text-primary-500 font-semibold hover:underline">See the full guide →</a></p>
        </div>
      </section>

      <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>

      {/* ══ FAQ ══ */}
      <section id="faq" className="py-14 md:py-20 px-4 gc-font">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="pill mx-auto mb-3 inline-flex items-center gap-1.5"><Icon name="HelpCircle" size={13}/> FAQ</div>
            <h2 className="font-extrabold" style={{ fontSize:'clamp(2rem,5.5vw,2.8rem)', letterSpacing:'-0.02em', color:'#1A1035' }}>
              Questions we get all the time
            </h2>
          </div>
          {[
            { q:'Is it really free to create a card?', a:"Yes — creating a card and collecting messages is 100% free. You only pay ₦5,000 when you're ready to activate and send the card to the recipient." },
            { q:'Does the recipient need to create an account?', a:"No. The recipient simply opens a link, reads all the messages and can claim the gift — no sign-up required." },
            { q:'What payment methods are supported?', a:'All Nigerian debit and credit cards (Visa, Mastercard, Verve), bank transfers, USSD (*737#, *822# etc) and mobile money via Flutterwave.' },
            { q:'Can people outside Nigeria contribute to the gift pot?', a:'Yes. Flutterwave supports international Visa and Mastercard cards. Your signers can contribute from anywhere in the world.' },
            { q:'What types of media can contributors add?', a:'Text messages, photos, videos (up to 50MB), voice notes, and GIFs — all in one beautiful card.' },
            { q:'How does the gift pot work for companies?', a:"Each celebration card has its own Flutterwave gift pot. Department members chip in individually. Once the card is sent, the recipient can withdraw the total to their bank account." },
            { q:'Can I schedule the card to send on a specific date?', a:"Yes. Pick any future date and time during card creation. Thankeeu sends it automatically — even if you forget." },
            { q:'Is there a limit on how many people can sign?', a:'No limit. Invite your entire company if you want. The more signatures, the more meaningful the card.' },
          ].map((item, i) => {
            const [open, setOpen] = useState(false);
            return (
              <div key={i} className="border-b border-purple-100">
                <button onClick={() => setOpen(!open)}
                  className="w-full text-left flex items-center justify-between py-4 gap-4 hover:text-primary-600 transition-colors">
                  <span className="font-bold" style={{ fontSize:'0.9rem', color:'#1A1035' }}>{item.q}</span>
                  <span className={`text-primary-400 flex-shrink-0 text-lg transition-transform ${open?'rotate-45':''}`}>+</span>
                </button>
                {open && <p className="text-sm text-warm-600 leading-relaxed pb-4">{item.a}</p>}
              </div>
            );
          })}
          <p className="text-center text-xs text-warm-400 mt-8">More questions? <a href="/faq" className="text-primary-500 font-semibold hover:underline">See all FAQs →</a></p>
        </div>
      </section>

      <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>

      {/* ══ ECOSYSTEM: Pals + Vendor ══ */}
      <section className="py-14 md:py-20 px-4" style={{ background:'#fff' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="pill mx-auto mb-3 inline-flex items-center gap-1.5"><Icon name="Layers" size={13}/> More ways to celebrate</div>
            <h2 className="font-extrabold text-warm-900 mb-3" style={{ fontSize:'clamp(2rem,5.5vw,2.9rem)' }}>Beyond the card</h2>
            <p className="text-warm-500 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Thankeeu is a full celebration platform — not just a card tool. Send real gifts. Celebrate with your inner circle. Do it all in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative rounded-3xl overflow-hidden border-2 border-purple-100 p-7 flex flex-col" style={{ background:'linear-gradient(135deg,#F5F0FF 0%,#FFF0F8 100%)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background:'linear-gradient(135deg,#8B5CF6,#EC4899)' }}>🤝</div>
                <div>
                  <p className="text-xs font-bold text-primary-500 uppercase tracking-wider mb-0.5">New</p>
                  <h3 className="text-xl font-extrabold text-warm-900">Thankeeu Pals</h3>
                </div>
              </div>
              <p className="text-warm-600 text-sm leading-relaxed mb-4">A private celebration circle for your closest people — best friends, family, a tight-knit crew. Everyone joins, adds their dates, and Thankeeu automatically creates a group card when someone's special day arrives.</p>
              <ul className="space-y-2 mb-6">
                {['Up to 15 people in a private group','Auto-created cards for every occasion','Gift pot collected and paid out at 6 pm on the day','No HR. No company. Just your people.'].map((item,i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-warm-700"><span className="text-primary-500 mt-0.5 flex-shrink-0">✓</span>{item}</li>
                ))}
              </ul>
              <div className="mt-auto flex flex-wrap gap-3">
                <Link to="/pals" className="gc-btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-1.5"><Icon name="Users" size={14}/> Learn about Pals</Link>
                <Link to="/pals/signup" className="gc-btn-secondary px-5 py-2.5 text-sm inline-flex items-center gap-1.5">Start a group →</Link>
              </div>
            </div>
            <div className="relative rounded-3xl overflow-hidden border-2 border-amber-100 p-7 flex flex-col" style={{ background:'linear-gradient(135deg,#FFFBEB 0%,#FFF5F0 100%)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background:'linear-gradient(135deg,#F59E0B,#EF4444)' }}>🛍️</div>
                <div>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">Marketplace</p>
                  <h3 className="text-xl font-extrabold text-warm-900">Gift Marketplace</h3>
                </div>
              </div>
              <p className="text-warm-600 text-sm leading-relaxed mb-4">Attach a real, physical gift to any card — straight from local vendors. Pick from cakes, flowers, chocolates, jewellery, hampers and more. The vendor is notified with the delivery deadline so your gift arrives on time.</p>
              <ul className="space-y-2 mb-6">
                {['Browse verified local gift vendors','Order cakes, flowers, chocolates & more','Vendor notified with your celebration date','Sell on Thankeeu? Apply to become a vendor'].map((item,i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-warm-700"><span className="text-amber-500 mt-0.5 flex-shrink-0">✓</span>{item}</li>
                ))}
              </ul>
              <div className="mt-auto flex flex-wrap gap-3">
                <Link to="/vendors" className="px-5 py-2.5 text-sm font-bold rounded-2xl inline-flex items-center gap-1.5 transition-all" style={{ background:'linear-gradient(135deg,#F59E0B,#EF4444)', color:'#fff' }}>
                  <Icon name="Store" size={14}/> Browse gift vendors
                </Link>
                <Link to="/vendors" className="px-5 py-2.5 text-sm font-bold rounded-2xl border-2 border-amber-200 text-amber-700 hover:bg-amber-50 transition-all inline-flex items-center gap-1.5">Sell on Thankeeu →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>

      {/* ══ BOTTOM CTA ══ */}
      <section className="py-16 md:py-24 px-4 text-center gc-font section-dots" style={{ background:'linear-gradient(135deg,#F5F0FF,#FFF0F5)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center gap-2 sm:gap-3 mb-6">
            {['Cake','Gift','Party','Heart','Sparkles'].map((name,i) => (
              <span key={i} className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-white border-2 border-purple-100 flex items-center justify-center animate-float" style={{ animationDelay:`${i*0.15}s` }}>
                <Icon name={name} size={22} className="text-primary-500"/>
              </span>
            ))}
          </div>
          <h2 className="font-bold text-warm-900 mb-4" style={{ fontSize:'clamp(2.1rem,6.5vw,3.6rem)' }}>
            Make someone feel<br/>
            <span style={{ background:'linear-gradient(135deg,#8B5CF6,#7C3AED 50%,#F43F5E)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>genuinely loved</span>
          </h2>
          <p className="text-warm-500 mb-8 text-base sm:text-lg">From <RotatingPrice amountNGN={5000}/> per card · Pay only when you send · Works worldwide</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/card/new" className="gc-btn-primary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto inline-flex items-center justify-center gap-2"><Icon name="Sparkles" size={16}/> Get started — takes 2 min</Link>
            <Link to="/pricing" className="gc-btn-secondary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto inline-flex items-center justify-center gap-2"><Icon name="Card" size={16}/> See pricing</Link>
          </div>
          <p className="text-xs text-warm-400 mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1"><Icon name="Lock" size={12}/> Secure payments</span><span>·</span>
            <span className="inline-flex items-center gap-1"><Icon name="Sparkles" size={12}/> No credit card needed</span><span>·</span>
            <span className="inline-flex items-center gap-1"><Icon name="Globe" size={12}/> Used worldwide</span>
          </p>
          <p className="text-xs text-warm-300 mt-4">
            Got a tight group of friends or family?{' '}<Link to="/pals" className="text-primary-400 hover:text-primary-600 hover:underline">Start a free Thankeeu Pals group</Link>
            {' '}· Sell cakes, flowers &amp; gifts?{' '}<Link to="/vendors" className="text-primary-400 hover:text-primary-600 hover:underline">Become a vendor</Link>
          </p>
        </div>
      </section>

      <Footer/>
      {showDemo && <DemoModal onClose={() => setShowDemo(false)}/>}
    </div>
  );
};

export default Home;
