/**
 * HeroShowcase — the homepage hero interactive section, reused on:
 *   - LeavingCardPage
 *   - BirthdayPage (via OccasionHeroTemplate)
 *   - BabyShowerPage (via OccasionHeroTemplate)
 *
 * Contains exactly three elements shown in the screenshots:
 *   1. Sample card grid  (staggered cards with photo/gif/voice/gif)
 *   2. LiveCardPreview   (interactive flipbook + sign panel)
 *   3. Feature mini-cards (Group Card + Memory Movie™) — no Live Photo Wall
 *
 * Props:
 *   ctaPath       string  — passed to "Create a card" CTA after signing
 *   ctaLabel      string  — e.g. "Create Leaving Card — Free"
 *   sampleMessages array  — 4 cards for the staggered grid
 *   demoMessages  array   — messages loaded into the flipbook
 */

import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Icon from './ui/Icon';
import VoiceRecorder from './VoiceRecorder';

/* ─── Font injection (same as Home.jsx) ───────────────────────────────── */
const HERO_FONT_INJECT = `
@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Sacramento&family=Great+Vibes&display=swap');
.font-dancing  { font-family:'Dancing Script', cursive; }
.font-vibes    { font-family:'Great Vibes', cursive; }
.font-sacramento { font-family:'Sacramento', cursive; }
`;

/* ─── GIF options for the sign form ───────────────────────────────────── */
const GIPHY_OPTIONS = [
  { url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', label: 'Celebrate' },
  { url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif', label: 'Star'      },
  { url: 'https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif', label: 'Birthday'  },
  { url: 'https://media.giphy.com/media/3o7abGQa0aRJUurpII/giphy.gif', label: 'Clap'      },
  { url: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif',      label: 'Love'      },
  { url: 'https://media.giphy.com/media/RrVzUOXldFe8M/giphy.gif',      label: 'Party'     },
];

/* ─── LiveCardPreview (exact copy from Home.jsx, accepts initialMessages prop) */
const LiveCardPreview = ({ demoMessages, ctaPath, ctaLabel }) => {
  const [activeIdx,   setActiveIdx]   = useState(0);
  const [signerName,  setSignerName]  = useState('');
  const [signerMsg,   setSignerMsg]   = useState('');
  const [signerGif,   setSignerGif]   = useState('');
  const [messages,    setMessages]    = useState(demoMessages);
  const [signed,      setSigned]      = useState(false);
  const [flipping,    setFlipping]    = useState(false);
  const [showGifPick, setShowGifPick] = useState(false);
  const [showEmoji,   setShowEmoji]   = useState(false);
  const [signerPhoto, setSignerPhoto] = useState(null);
  const photoInputRef = useRef();

  const handleSign = () => {
    if (!signerName.trim() || !signerMsg.trim()) return;
    const colors = ['#7C3AED','#0D9488','#DB2777','#92400E','#1D4ED8'];
    const bgs    = ['#EDE9FE','#CCFBF1','#FCE7F3','#FEF3C7','#DBEAFE'];
    const idx    = messages.length % colors.length;
    setMessages(prev => [...prev, {
      initials: signerName.trim().split(' ').map(w => w[0].toUpperCase()).join('').slice(0,2),
      name:  signerName.trim(),
      color: colors[idx], bg: bgs[idx],
      text:  signerMsg.trim(),
      gif:   signerGif  || undefined,
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
    <div style={{ width:'100%', maxWidth:520, display:'flex', flexDirection:'column', gap:'1.25rem', boxSizing:'border-box' }}>

      {/* ── Album card ── */}
      <div style={{ position:'relative', width:'calc(100% - 104px)', margin:'0 auto', overflow:'visible' }}>
        {/* Stack shadows */}
        <div style={{ position:'absolute', left:'50%', transform:'translateX(calc(-50% - 16px)) rotate(-3deg)', width:'calc(100% - 28px)', height:'100%', background:'#fff', borderRadius:20, border:'1.5px solid #DDD6FE', zIndex:0 }}/>
        <div style={{ position:'absolute', left:'50%', transform:'translateX(calc(-50% + 16px)) rotate(3deg)',  width:'calc(100% - 14px)', height:'100%', background:'#fff', borderRadius:20, border:'1.5px solid #DDD6FE', zIndex:0 }}/>

        {/* Main card */}
        <div style={{
          position:'relative', zIndex:1,
          borderRadius:20, border:'2px solid #DDD6FE',
          padding:'1.25rem 1.5rem 3rem',
          background: msg.bg,
          boxShadow:'0 8px 40px rgba(124,58,237,0.12)',
          transition:'all 0.22s ease',
          transform:  flipping ? 'rotateY(90deg)' : 'rotateY(0deg)',
          opacity:    flipping ? 0 : 1,
          minHeight:340, display:'flex', flexDirection:'column',
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
              <button key={i} onClick={() => setActiveIdx(i)} aria-label={`Page ${i+1}`}
                style={{ width:i===activeIdx?22:8, height:8, borderRadius:i===activeIdx?4:'50%', background:i===activeIdx?msg.color:'#DDD6FE', border:'none', cursor:'pointer', padding:0, transition:'all 0.2s' }}/>
            ))}
          </div>
        </div>

        {/* Nav arrows */}
        <button onClick={() => goTo(-1)} disabled={activeIdx===0}
          style={{ position:'absolute', left:-26, top:'50%', transform:'translateY(-50%)', width:48, height:48, borderRadius:'50%', background:'#fff', border:'2.5px solid #C4B5FD', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#7C3AED', opacity:activeIdx===0?0.25:1, zIndex:20, boxShadow:'0 4px 20px rgba(124,58,237,0.22)', flexShrink:0 }}>
          <Icon name="ChevronLeft" size={22}/>
        </button>
        <button onClick={() => goTo(1)} disabled={activeIdx===messages.length-1}
          style={{ position:'absolute', right:-26, top:'50%', transform:'translateY(-50%)', width:48, height:48, borderRadius:'50%', background:'#fff', border:'2.5px solid #C4B5FD', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#7C3AED', opacity:activeIdx===messages.length-1?0.25:1, zIndex:20, boxShadow:'0 4px 20px rgba(124,58,237,0.22)', flexShrink:0 }}>
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

          <input className="lcp-input" placeholder="Your name" value={signerName} onChange={e=>setSignerName(e.target.value)} maxLength={60}/>

          <div style={{ position:'relative' }}>
            <textarea className="lcp-textarea" placeholder="Write your message here…" rows={3}
              value={signerMsg} onChange={e=>setSignerMsg(e.target.value)} maxLength={500}
              style={{ resize:'none', paddingRight:'2.5rem' }}/>
            <button type="button" onClick={() => { setShowEmoji(s=>!s); setShowGifPick(false); }}
              style={{ position:'absolute', bottom:8, right:8, width:32, height:32, borderRadius:'50%', background:'#F5F0FF', border:'1.5px solid #DDD6FE', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>
              😊
            </button>
            {showEmoji && (
              <div style={{ position:'absolute', bottom:'calc(100% + 4px)', right:0, zIndex:50, background:'#fff', border:'1.5px solid #EDE9FE', borderRadius:16, padding:12, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', display:'flex', flexWrap:'wrap', gap:6, maxWidth:220 }}>
                {['🎉','🥳','🎂','❤️','🙏','👏','🔥','💕','😂','✨','🌟','💪','🤩','😍','🥰','💝','🎁','🍾','🎊','🌺'].map(emoji => (
                  <button key={emoji} type="button" onClick={() => { setSignerMsg(m=>m+emoji); setShowEmoji(false); }}
                    style={{ width:34, height:34, borderRadius:8, border:'none', background:'#F5F0FF', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display:'flex', flexWrap:'wrap', gap:6, position:'relative' }}>
            <button type="button" onClick={() => photoInputRef.current?.click()}
              style={{ background:signerPhoto?'#EDE9FE':'#F5F0FF', border:`1.5px solid ${signerPhoto?'#A78BFA':'#DDD6FE'}`, borderRadius:12, padding:'6px 12px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:'0.8125rem', color:'#7C3AED', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6 }}>
              {signerPhoto ? 'Change photo' : 'Add photo'}
            </button>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f=e.target.files?.[0]; if(f) setSignerPhoto({ url:URL.createObjectURL(f), file:f }); }}/>
            {signerPhoto && (
              <button type="button" onClick={() => setSignerPhoto(null)}
                aria-label="Remove photo"
                style={{ background:'none', border:'none', cursor:'pointer', color:'#DC2626', fontWeight:700, alignSelf:'center', display:'inline-flex', alignItems:'center', justifyContent:'center' }}><Icon name="X" size={14} /></button>
            )}

            <button type="button" onClick={() => { setShowGifPick(s=>!s); setShowEmoji(false); }}
              style={{ background:signerGif?'#EDE9FE':'#F5F0FF', border:`1.5px solid ${signerGif?'#A78BFA':'#DDD6FE'}`, borderRadius:12, padding:'6px 12px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:'0.8125rem', color:'#7C3AED', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6 }}>
              {signerGif ? 'Change GIF' : 'Add a GIF'}
            </button>
            {signerGif && (
              <button type="button" onClick={() => setSignerGif('')}
                aria-label="Remove GIF"
                style={{ background:'none', border:'none', cursor:'pointer', color:'#DC2626', fontWeight:700, alignSelf:'center', display:'inline-flex', alignItems:'center', justifyContent:'center' }}><Icon name="X" size={14} /></button>
            )}

            <VoiceRecorder onRecorded={f => {
              setSignerMsg(m => m + (m ? ' ' : '') + '🎤');
            }}/>

            {showGifPick && (
              <div style={{ width:'100%', marginTop:4, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                {GIPHY_OPTIONS.map(g => (
                  <button key={g.url} type="button"
                    onClick={() => { setSignerGif(g.url); setShowGifPick(false); }}
                    style={{ position:'relative', borderRadius:10, overflow:'hidden', border:`2.5px solid ${signerGif===g.url?'#7C3AED':'transparent'}`, cursor:'pointer', padding:0, lineHeight:0 }}>
                    <img src={g.url} alt={g.label} style={{ width:'100%', height:60, objectFit:'cover', display:'block' }} loading="lazy"/>
                    <span style={{ position:'absolute', bottom:3, left:0, right:0, textAlign:'center', fontSize:10, fontWeight:700, color:'#fff', textShadow:'0 1px 3px rgba(0,0,0,0.6)' }}>{g.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {signerPhoto && (
            <div style={{ borderRadius:12, overflow:'hidden', lineHeight:0 }}>
              <img src={signerPhoto.url} alt="Your photo" style={{ width:'100%', height:90, objectFit:'cover', display:'block', borderRadius:12 }}/>
            </div>
          )}
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
          <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'0.875rem', color:'#166534', margin:'0 0 0.75rem' }}>
            Your message is on page {activeIdx + 1}. Ready to create your own?
          </p>
          <Link to={ctaPath} className="btn-primary w-full text-center py-3 inline-flex items-center justify-center gap-2">
            <Icon name="Sparkles" size={15}/>{ctaLabel}
          </Link>
        </div>
      )}
    </div>
  );
};

/* ─── Sample card grid (image 1) ──────────────────────────────────────── */
const SampleCardGrid = ({ messages }) => (
  <>
    {/* Desktop: staggered 2-col grid */}
    <div className="hidden lg:grid grid-cols-2 gap-4 mt-8" style={{ maxWidth: 660 }}>
      {messages.map((m, i) => (
        <div key={m.name}
          className="bg-white rounded-3xl border-2 border-purple-100 overflow-hidden shadow-md hover:shadow-lg transition-shadow"
          style={{ marginTop: i % 2 === 1 ? 44 : 0, minHeight: 400 }}>
          {m.media === 'photo' && (
            <div style={{ height:160, overflow:'hidden' }}>
              <img src={m.photoUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} loading="lazy"/>
            </div>
          )}
          {m.media === 'gif' && (
            <div style={{ height:160, overflow:'hidden', background:'#1A1035' }}>
              <img src={m.gifUrl} alt="GIF" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} loading="lazy"/>
            </div>
          )}
          {m.media === 'voice' && (
            <div style={{ height:100, background:'linear-gradient(135deg,#EDE9FE,#F5F0FF)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, padding:'0 16px' }}>
              <div style={{ display:'flex', gap:3, alignItems:'flex-end', height:36 }}>
                {Array.from({length:20},(_,i)=>(
                  <div key={i} style={{ width:3, borderRadius:2, background:'#7C3AED', height:10+Math.sin(i*0.7)*16, opacity:0.6+Math.sin(i)*0.4 }}/>
                ))}
              </div>
              <span style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:11, fontWeight:700, color:'#7C3AED' }}>Voice note · 0:34</span>
            </div>
          )}
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

    {/* Mobile: compact 2-col */}
    <div className="lg:hidden grid grid-cols-2 gap-3 mt-4 max-w-sm mx-auto">
      {messages.map(m => (
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
  </>
);

/* ─── Feature mini-cards (image 3 — Group Card + Memory Movie, no Photo Wall) */
const FeatureMiniCards = ({ ctaPath }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 max-w-lg mx-auto lg:mx-0">
    <Link to={ctaPath}
      className="rounded-2xl p-4 text-left border-2 transition-all hover:shadow-md hover:-translate-y-0.5"
      style={{ background:'#F5F0FF', borderColor:'#DDD6FE' }}>
      <p className="font-extrabold text-warm-900 text-sm leading-tight mb-1">Group Card</p>
      <p className="text-xs text-warm-500 leading-snug">One link, everyone signs. Messages, photos, voice notes, GIFs and a pooled gift. Delivered at exactly the right moment.</p>
      <p className="text-xs font-bold mt-2" style={{ color:'#7C3AED' }}>Everyone signs, one link →</p>
    </Link>
    <Link to="/memory-movie"
      className="rounded-2xl p-4 text-left border-2 transition-all hover:shadow-md hover:-translate-y-0.5"
      style={{ background:'#0d0020', borderColor:'#4B1D8E' }}>
      <p className="font-extrabold text-white text-sm leading-tight mb-1">Memory Movie™</p>
      <p className="text-xs text-white/60 leading-snug">Every message, photo &amp; voice note auto-assembled into a cinematic MP4 with music.</p>
      <p className="text-xs font-bold mt-2 text-purple-300">See how it works →</p>
    </Link>
  </div>
);

/* ─── Main export ─────────────────────────────────────────────────────── */
export default function HeroShowcase({ sampleMessages, demoMessages, ctaPath, ctaLabel }) {
  return (
    <section className="section-dots gc-font py-10 md:py-14 px-2 sm:px-4 overflow-visible"
      style={{ background: 'linear-gradient(180deg,#F5F0FF 0%,#FDFCFF 100%)' }}>
      <style>{HERO_FONT_INJECT}</style>
      <div className="relative max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-16 items-start">

          {/* Left column: sample card grid + feature mini-cards */}
          <div className="text-center lg:text-left">
            <SampleCardGrid messages={sampleMessages} />
            <FeatureMiniCards ctaPath={ctaPath} />
          </div>

          {/* Right column: interactive flipbook */}
          <div className="lcp-outer-wrap" style={{ paddingTop:'0.5rem', paddingLeft:'1.5rem', paddingRight:'1.5rem' }}>
            <LiveCardPreview demoMessages={demoMessages} ctaPath={ctaPath} ctaLabel={ctaLabel} />
          </div>

        </div>
      </div>
    </section>
  );
}
