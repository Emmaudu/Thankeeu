/**
 * SampleCard.jsx — /sample
 *
 * Full editable demo — no backend calls needed.
 * Board view (masonry) + Card/Flipbook view toggle.
 * Inline sign modal: name, message, GIFs, photos, videos, voice notes.
 * Gift area: demo accepts any amount and shows success (no FLW redirect).
 * Thankeeu purple theme background — no Thankbox sky-blue.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';
import VoiceRecorder from '../components/VoiceRecorder';
import EmojiPicker from '../components/EmojiPicker';
import GifPicker from '../components/GifPicker';
import { FONT_STYLES, getFontStyle } from '../utils/cardDesigns';
import toast from 'react-hot-toast';

/* ─── Google fonts ──────────────────────────────────────────────────── */
const FONT_INJECT = `
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Patrick+Hand&family=Architects+Daughter&family=Indie+Flower&family=Kalam:wght@400;700&family=Permanent+Marker&family=Dancing+Script:wght@400;700&family=Shadows+Into+Light&display=swap');
`;

const HANDWRITTEN = [
  { id:'caveat',       family:"'Caveat',cursive",               size:'1.3rem',  lh:'1.6' },
  { id:'patrick',      family:"'Patrick Hand',cursive",          size:'1.1rem',  lh:'1.65'},
  { id:'architects',   family:"'Architects Daughter',cursive",   size:'0.98rem', lh:'1.65'},
  { id:'indie',        family:"'Indie Flower',cursive",          size:'1.1rem',  lh:'1.65'},
  { id:'kalam',        family:"'Kalam',cursive",                 size:'1.15rem', lh:'1.6' },
  { id:'marker',       family:"'Permanent Marker',cursive",      size:'0.92rem', lh:'1.7' },
  { id:'dancing',      family:"'Dancing Script',cursive",        size:'1.2rem',  lh:'1.65'},
  { id:'shadows',      family:"'Shadows Into Light',cursive",    size:'1.1rem',  lh:'1.7' },
];
const getFont = id => HANDWRITTEN.find(f=>f.id===id) || HANDWRITTEN[0];

const AMOUNTS = [2500,5000,10000,20000,50000];
const formatNGN = n => `₦${Number(n).toLocaleString('en-NG')}`;

const GIPHY_PRESETS = [
  { url:'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',  label:'🎉 Party' },
  { url:'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',  label:'🌟 Star'  },
  { url:'https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif',   label:'🎂 Cake'  },
  { url:'https://media.giphy.com/media/3o7abGQa0aRJUurpII/giphy.gif',  label:'👏 Clap'  },
  { url:'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif',        label:'💜 Love'  },
  { url:'https://media.giphy.com/media/RrVzUOXldFe8M/giphy.gif',        label:'🎊 Confetti'},
];

/* ─── Seed messages ─────────────────────────────────────────────────── */
const SEED = [
  { id:1,  name:'Adaeze O.',   font:'caveat',      color:'#1e3a5f', bg:'#f0f4ff',
    text:'Chisom! 3 years of working with you has been a highlight. Your energy in the open office — this place will feel different without you. Wishing you everything! 🎉',
    media:{ type:'gif', url:'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif' } },
  { id:2,  name:'Emeka T.',    font:'patrick',     color:'#1a1035', bg:'#fff8f0',
    text:'I still remember the day you walked in with those slides and owned the entire room. Go show the world what we already know. Good luck Chisom! You\'ll be a star.',
    media:{ type:'photo', url:'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80' } },
  { id:3,  name:'Kemi B.',     font:'architects',  color:'#1e3a5f', bg:'#f0fff8',
    text:'Enjoy your travels and new job. I hope you see many beautiful places. All the best 🔥',
    media:{ type:'photo', url:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80' } },
  { id:4,  name:'Jimmy P.',    font:'kalam',       color:'#3d1a6e', bg:'#1e1e3e', dark:true,
    text:'My favourite coffee bud! What am I gonna do without you 😭! All the very best at the new place!',
    media:{ type:'photo', url:'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80' } },
  { id:5,  name:'Tunde A.',    font:'indie',       color:'#1e3a5f', bg:'#fff0f5',
    text:'Dear Chisom, can\'t believe you\'re going, but I know adventure calls you! Enjoy every moment of the new chapter.',
    media:{ type:'gif', url:'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif' } },
  { id:6,  name:'Fatima M.',   font:'shadows',     color:'#1e3a5f', bg:'#f5f0ff',
    text:'YOU\'RE SIMPLY THE BEST! Three years, a hundred presentations, one unforgettable farewell party.',
    media:{ type:'gif', url:'https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif' }, bigText:true },
  { id:7,  name:'Dr. Nkechi E.',font:'dancing',    color:'#1a3d1a', bg:'#f0fff4',
    text:'Watching you grow from a brilliant newcomer to a leader who shapes this organisation has been a privilege. You are not just talented — you make every space more human. 🌟',
    media:null },
  { id:8,  name:'Victor O.',   font:'caveat',      color:'#3d1a00', bg:'#fffbf0',
    text:'Happy farewell to the most diplomatically skilled human I have ever encountered. This is going to be extraordinary for you.',
    media:{ type:'gif', url:'https://media.giphy.com/media/3o7abGQa0aRJUurpII/giphy.gif' } },
  { id:9,  name:'Blessing O.', font:'kalam',       color:'#1e3a5f', bg:'#f0f8ff',
    text:'THANK YOU FOR BEING AWESOME CHISOM. I LEARNED A LOT FROM YOU. PLEASE KEEP IN TOUCH! 🐱',
    media:{ type:'photo', url:'https://images.unsplash.com/photo-1516571748831-5d81767b788d?w=600&q=80' }, allCaps:true },
  { id:10, name:'Remi F.',     font:'patrick',     color:'#1e1a3e', bg:'#fdf0ff',
    text:'You expand the possible. Every room you enter leaves thinking bigger. Go show the world.',
    media:{ type:'photo', url:'https://images.unsplash.com/photo-1536936459024-2cded18fce68?w=600&q=80' } },
  { id:11, name:'Olu A.',      font:'architects',  color:'#1e3a5f', bg:'#fff8f0',
    text:'Happy farewell to the person who actually reads the IT security memos! Working with you has been a masterclass in excellence. Good luck! 😄',
    media:null },
  { id:12, name:'Amara O.',    font:'indie',       color:'#1a3d1a', bg:'#f0fff4',
    text:'You were the first senior person to sit with me and just talk. That conversation gave me more confidence than any training ever could. Thank you Chisom. 🌸',
    media:null },
];

/* ─── Board tile ─────────────────────────────────────────────────────── */
function BoardTile({ msg }) {
  const f = getFont(msg.font);
  return (
    <div style={{ background:msg.bg||'#fff', borderRadius:16, overflow:'hidden', marginBottom:14, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', breakInside:'avoid' }}>
      {msg.media?.type==='gif'   && <img src={msg.media.url}   alt="" style={{ width:'100%', display:'block', maxHeight:200, objectFit:'cover' }} loading="lazy"/>}
      {msg.media?.type==='photo' && <img src={msg.media.url}   alt="" style={{ width:'100%', display:'block', maxHeight:200, objectFit:'cover' }} loading="lazy"/>}
      {msg.media?.type==='video' && <video src={msg.media.url} style={{ width:'100%', display:'block', maxHeight:200 }} controls/>}
      {msg.media?.type==='voice' && (
        <div style={{ background:'linear-gradient(135deg,#EDE9FE,#F5F0FF)', padding:'14px 16px', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:24 }}>🎙️</span>
          <audio src={msg.media.url} controls style={{ flex:1, height:32 }}/>
        </div>
      )}
      {msg.media?.type==='localImg' && <img src={msg.media.url} alt="" style={{ width:'100%', display:'block', maxHeight:200, objectFit:'cover' }}/>}
      <div style={{ padding:'14px 16px 12px' }}>
        {msg.bigText
          ? <p style={{ fontFamily:f.family, fontSize:f.size, lineHeight:f.lh, color:msg.dark?'#e0d8ff':msg.color||'#1e3a5f', margin:'0 0 8px', fontWeight:700 }}>{msg.text.split('!').slice(1).join('!').trim()}</p>
          : <p style={{ fontFamily:f.family, fontSize:f.size, lineHeight:f.lh, color:msg.dark?'#e0d8ff':msg.color||'#1e3a5f', margin:'0 0 8px', textTransform:msg.allCaps?'uppercase':'none', fontWeight:msg.allCaps?700:400, letterSpacing:msg.allCaps?'0.04em':'normal' }}>{msg.text}</p>
        }
        <p style={{ fontFamily:f.family, fontSize:'1rem', fontWeight:700, color:msg.dark?'#a89cff':'#374151', margin:0, textAlign:'right' }}>{msg.name}</p>
      </div>
    </div>
  );
}

/* ─── Flipbook card view ─────────────────────────────────────────────── */
function FlipCard({ messages, onAddMessage }) {
  const [idx,      setIdx]      = useState(0);
  const [flipping, setFlipping] = useState(false);
  const total = messages.length;
  if (!total) return null;

  const goTo = dir => {
    if (flipping) return;
    setFlipping(true);
    setTimeout(() => { setIdx(i => Math.max(0,Math.min(total-1,i+dir))); setFlipping(false); }, 220);
  };

  const msg = messages[idx];
  const f   = getFont(msg.font);

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
      {/* Stack */}
      <div style={{ position:'relative', width:'100%', maxWidth:540 }}>
        <div style={{ position:'absolute', left:'50%', transform:'translate(calc(-50% - 20px), 8px) rotate(-3deg)', width:'calc(100% - 28px)', height:'100%', background:'#fff', borderRadius:20, border:'1.5px solid #DDD6FE', zIndex:0 }}/>
        <div style={{ position:'absolute', left:'50%', transform:'translate(calc(-50% + 20px), 5px) rotate(2.5deg)', width:'calc(100% - 14px)', height:'100%', background:'#fff', borderRadius:20, border:'1.5px solid #DDD6FE', zIndex:0 }}/>

        {/* Active page */}
        <div style={{ position:'relative', zIndex:1, background:msg.bg||'#F5F0FF', borderRadius:20, border:'2px solid #DDD6FE', padding:'1.5rem 1.75rem 3.5rem', boxShadow:'0 8px 40px rgba(124,58,237,0.12)', minHeight:420, display:'flex', flexDirection:'column', overflow:'hidden', transform:flipping?'rotateY(90deg)':'rotateY(0)', opacity:flipping?0:1, transition:'transform 0.22s,opacity 0.22s' }}>

          {/* Signer header */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14, flexShrink:0 }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:'#7C3AED', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.875rem', flexShrink:0 }}>
              {msg.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div>
              <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:'0.9375rem', color:'#1A1035', margin:0, lineHeight:1.3 }}>{msg.name}</p>
              <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'0.75rem', color:'#7C5CBF', margin:0 }}>signed this card</p>
            </div>
          </div>

          {/* Media */}
          {msg.media?.type==='gif'      && <div style={{ borderRadius:12, overflow:'hidden', marginBottom:12, flexShrink:0, lineHeight:0 }}><img src={msg.media.url} alt="" style={{ width:'100%', height:180, objectFit:'cover', display:'block' }} loading="lazy"/></div>}
          {msg.media?.type==='photo'    && <div style={{ borderRadius:12, overflow:'hidden', marginBottom:12, flexShrink:0, lineHeight:0 }}><img src={msg.media.url} alt="" style={{ width:'100%', height:180, objectFit:'cover', display:'block' }} loading="lazy"/></div>}
          {msg.media?.type==='localImg' && <div style={{ borderRadius:12, overflow:'hidden', marginBottom:12, flexShrink:0, lineHeight:0 }}><img src={msg.media.url} alt="" style={{ width:'100%', height:180, objectFit:'cover', display:'block' }}/></div>}
          {msg.media?.type==='video'    && <div style={{ borderRadius:12, overflow:'hidden', marginBottom:12, flexShrink:0 }}><video src={msg.media.url} style={{ width:'100%', height:180, objectFit:'cover', display:'block' }} controls/></div>}
          {msg.media?.type==='voice'    && (
            <div style={{ borderRadius:12, background:'linear-gradient(135deg,#EDE9FE,#F5F0FF)', marginBottom:12, padding:'12px 16px', flexShrink:0, display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:28 }}>🎙️</span>
              <audio src={msg.media.url} controls style={{ flex:1 }}/>
            </div>
          )}

          {/* Message */}
          <p style={{ fontFamily:f.family, fontSize:f.size, lineHeight:f.lh, color:msg.dark?'#c4b5fd':(msg.color||'#1e3a5f'), margin:'0 0 auto', flex:1, textTransform:msg.allCaps?'uppercase':'none' }}>
            {msg.bigText ? msg.text.split('!').slice(1).join('!').trim() : msg.text}
          </p>

          {/* Dots */}
          <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:12, flexShrink:0 }}>
            {messages.map((_,i) => (
              <button key={i} onClick={()=>setIdx(i)} style={{ width:i===idx?22:8, height:8, borderRadius:i===idx?4:'50%', background:i===idx?'#7C3AED':'#DDD6FE', border:'none', cursor:'pointer', padding:0, transition:'all 0.2s' }}/>
            ))}
          </div>

          {/* Arrows */}
          <button onClick={()=>goTo(-1)} disabled={idx===0} style={{ position:'absolute', left:-20, top:'50%', transform:'translateY(-50%)', width:38, height:38, borderRadius:'50%', background:'#fff', border:'1.5px solid #DDD6FE', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#7C3AED', opacity:idx===0?0.3:1, zIndex:10, boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}>
            <Icon name="ChevronLeft" size={18}/>
          </button>
          <button onClick={()=>goTo(1)} disabled={idx===total-1} style={{ position:'absolute', right:-20, top:'50%', transform:'translateY(-50%)', width:38, height:38, borderRadius:'50%', background:'#fff', border:'1.5px solid #DDD6FE', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#7C3AED', opacity:idx===total-1?0.3:1, zIndex:10, boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}>
            <Icon name="ChevronRight" size={18}/>
          </button>
        </div>

        {/* Counter */}
        <div style={{ position:'absolute', top:-14, right:16, background:'#fff', border:'1.5px solid #DDD6FE', borderRadius:20, padding:'3px 12px', fontSize:'0.75rem', fontWeight:700, color:'#7C3AED', zIndex:2, display:'flex', alignItems:'center', gap:5 }}>
          <Icon name="FileText" size={12}/> {idx+1} / {total}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ background:'rgba(26,16,53,0.88)', backdropFilter:'blur(12px)', borderRadius:40, width:'100%', maxWidth:540, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 18px', gap:8 }}>
        <button onClick={onAddMessage} style={{ background:'linear-gradient(135deg,#7C3AED,#5B21B6)', color:'#fff', border:'none', borderRadius:24, padding:'10px 18px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:13, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, display:'inline-flex', alignItems:'center', gap:6 }}>
          ✍️ Add my message
        </button>
        <button onClick={()=>{navigator.clipboard.writeText(window.location.href); toast.success('Link copied!');}} style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.12)', border:'none', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon name="Share" size={16} style={{color:'#fff'}}/>
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:6, flex:1, justifyContent:'flex-end', minWidth:0 }}>
          <Icon name="ChevronLeft" size={18} style={{ color:'#fff', cursor:'pointer', flexShrink:0 }} onClick={()=>goTo(-1)}/>
          <input type="range" min={0} max={total-1} value={idx} onChange={e=>setIdx(Number(e.target.value))} style={{ flex:1, accentColor:'#7C3AED', maxWidth:120 }}/>
          <Icon name="ChevronRight" size={18} style={{ color:'#fff', cursor:'pointer', flexShrink:0 }} onClick={()=>goTo(1)}/>
        </div>
      </div>
    </div>
  );
}

/* ─── Main SampleCard ────────────────────────────────────────────────── */
export default function SampleCard() {
  const [view,         setView]        = useState('board');
  const [messages,     setMessages]    = useState(SEED);
  const [showModal,    setShowModal]   = useState(false);
  const [signDone,     setSignDone]    = useState(false);
  const [giftDone,     setGiftDone]    = useState(false);
  const [giftAmount,   setGiftAmount]  = useState(null);
  const [customGift,   setCustomGift]  = useState('');
  const [showGiftArea, setShowGiftArea]= useState(false);

  // Sign form state
  const [name,        setName]        = useState('');
  const [fontId,      setFontId]      = useState('caveat');
  const [msgText,     setMsgText]     = useState('');
  const [mediaFiles,  setMediaFiles]  = useState([]);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [showEmoji,   setShowEmoji]   = useState(false);
  const [showGifPick, setShowGifPick] = useState(false);
  const [showGifFull, setShowGifFull] = useState(false);
  const [isPrivate,   setIsPrivate]   = useState(false);

  const fileRef     = useRef();
  const textareaRef = useRef();

  const openModal = () => { setShowModal(true); setSignDone(false); setGiftDone(false); setShowGiftArea(false); setName(''); setMsgText(''); setMediaFiles([]); setGiftAmount(null); setCustomGift(''); };

  const addMedia = useCallback(files => {
    const items = [];
    for (const f of Array.from(files)) {
      if (f.size > 50*1024*1024) { toast.error(`${f.name} too large`); continue; }
      const type = f.type.startsWith('video/')?'video':f.type.startsWith('audio/')?'voice':f.type==='image/gif'?'gif':'localImg';
      items.push({ file:f, url:URL.createObjectURL(f), type });
    }
    setMediaFiles(p => [...p,...items].slice(0,5));
  }, []);

  const removeMedia = i => {
    setMediaFiles(p => { const n=[...p]; URL.revokeObjectURL(n[i].url); n.splice(i,1); setCarouselIdx(idx=>Math.min(idx,Math.max(0,n.length-1))); return n; });
  };

  const insertEmoji = useCallback(emoji => {
    const el = textareaRef.current;
    if (el && typeof el.selectionStart==='number') {
      const s=el.selectionStart, e=el.selectionEnd;
      setMsgText(t => t.slice(0,s)+emoji+t.slice(e));
      requestAnimationFrame(()=>{ el.focus(); const p=s+emoji.length; el.setSelectionRange(p,p); });
    } else setMsgText(t=>t+emoji);
    setShowEmoji(false);
  },[]);

  const handleSign = () => {
    if (!name.trim()) return toast.error('Please enter your name');
    if (!msgText.trim() && mediaFiles.length===0) return toast.error('Add a message or media');
    const media = mediaFiles[0] ? { type:mediaFiles[0].type, url:mediaFiles[0].url } : null;
    setMessages(p => [...p, {
      id: Date.now(), name:name.trim(), font:fontId,
      color:'#1e3a5f', bg:'#F5F0FF', text:msgText.trim(), media,
    }]);
    setSignDone(true);
  };

  const handleGift = () => {
    const amt = Number(customGift||giftAmount||0);
    if (amt < 100) return toast.error('Minimum gift is ₦100');
    toast.success(`Demo gift of ${formatNGN(amt)} accepted! 🎉 (No real payment on demo)`);
    setGiftDone(true);
  };

  return (
    <>
      <style>{FONT_INJECT}</style>
      <Navbar/>

      {/* ── Top action bar ── */}
      <div style={{ background:'#fff', borderBottom:'1.5px solid #EDE9FE', position:'sticky', top:0, zIndex:30, display:'flex', alignItems:'center', justifyContent:'center', padding:'10px 20px', gap:8, flexWrap:'wrap' }}>
        <button onClick={openModal} style={{ display:'inline-flex', alignItems:'center', gap:7, border:'2px solid #7C3AED', background:'#fff', color:'#7C3AED', borderRadius:24, padding:'9px 20px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:14, cursor:'pointer', whiteSpace:'nowrap' }}>
          <span style={{ fontSize:16, fontWeight:900 }}>+</span> Add a message
        </button>
        <div style={{ display:'flex', background:'#f0f0f8', borderRadius:24, padding:4, gap:2 }}>
          {[{id:'board',icon:<><rect x="0" y="0" width="7" height="7" rx="1.5"/><rect x="9" y="0" width="7" height="7" rx="1.5"/><rect x="0" y="9" width="7" height="7" rx="1.5"/><rect x="9" y="9" width="7" height="7" rx="1.5"/></>,label:'Board'},
            {id:'card', icon:<><rect x="0" y="0" width="7" height="16" rx="1.5"/><rect x="9" y="0" width="7" height="16" rx="1.5"/></>,label:'Card'}
          ].map(b => (
            <button key={b.id} onClick={()=>setView(b.id)} style={{ padding:'8px 20px', borderRadius:20, border:'none', cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:14, background:view===b.id?'linear-gradient(135deg,#7C3AED,#5B21B6)':'transparent', color:view===b.id?'#fff':'#6B7280', display:'inline-flex', alignItems:'center', gap:6, transition:'all 0.15s' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">{b.icon}</svg>
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main background — Thankeeu purple theme ── */}
      <div className="section-dots" style={{ minHeight:'100vh', background:'linear-gradient(160deg,#F5F0FF 0%,#EDE5FF 35%,#F8F0FF 65%,#FFF0F8 100%)', position:'relative', overflow:'hidden' }}>
        {/* Dot grid */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(124,58,237,0.10) 1.5px,transparent 1.5px)', backgroundSize:'30px 30px', pointerEvents:'none', zIndex:0 }}/>
        {/* Glow */}
        <div style={{ position:'absolute', top:-100, left:'50%', transform:'translateX(-50%)', width:700, height:400, background:'radial-gradient(ellipse,rgba(139,92,246,0.20) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none', zIndex:0 }}/>
        {/* Floating emojis */}
        {['🎂','💜','🎉','✨','🎁','🌟','🎊','💐'].map((e,i) => (
          <div key={i} style={{ position:'absolute', left:`${5+i*12}%`, top:`${3+(i%3)*6}%`, fontSize:24+(i%3)*6, opacity:0.14, pointerEvents:'none', userSelect:'none', animation:`float ${5+i}s ${i*0.4}s ease-in-out infinite` }}>{e}</div>
        ))}

        {/* Hero header */}
        <div style={{ position:'relative', zIndex:2, paddingTop:36, paddingBottom:20, paddingLeft:40 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:14, background:'rgba(255,255,255,0.75)', backdropFilter:'blur(8px)', border:'1.5px solid rgba(124,58,237,0.15)', borderRadius:20, padding:'12px 22px' }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#7C3AED,#EC4899)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>👋</div>
            <div>
              <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:18, color:'#1A1035', margin:0, lineHeight:1.2 }}>Chisom Obi,</p>
              <p style={{ fontFamily:"'Caveat',cursive", fontSize:26, fontWeight:700, color:'#7C3AED', margin:0, lineHeight:1.1 }}>Farewell, We'll Miss You 🎉</p>
            </div>
          </div>
          <div style={{ marginTop:8, paddingLeft:8 }}>
            <span style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:13, color:'#4A3A7A', fontWeight:600 }}>
              From The Nexus Technologies Team 💚 · <span style={{ color:'#7C3AED', fontWeight:700 }}>{messages.length} messages</span>
            </span>
          </div>
        </div>

        {/* Action bar */}
        <div style={{ display:'flex', justifyContent:'center', gap:10, marginBottom:24, position:'relative', zIndex:3 }}>
          <button onClick={()=>setShowGiftArea(s=>!s)} style={{ background:'linear-gradient(135deg,#7C3AED,#5B21B6)', color:'#fff', border:'none', borderRadius:28, padding:'11px 24px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer', boxShadow:'0 4px 20px rgba(124,58,237,0.4)', display:'inline-flex', alignItems:'center', gap:8 }}>
            🎁 Gift pot · {formatNGN(487500)}
          </button>
          {[{icon:'Share',action:()=>{navigator.clipboard.writeText(window.location.href);toast.success('Link copied!');}},{icon:'Download',action:()=>toast.success('Download feature on real cards!')},{icon:'Reply',action:()=>openModal()}].map(b => (
            <button key={b.icon} onClick={b.action} style={{ width:44, height:44, borderRadius:'50%', border:'none', background:'rgba(255,255,255,0.85)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.10)' }}>
              <Icon name={b.icon} size={18} style={{ color:'#374151' }}/>
            </button>
          ))}
        </div>

        {/* Gift area (expandable demo) */}
        {showGiftArea && (
          <div style={{ maxWidth:480, margin:'0 auto 24px', background:'rgba(255,255,255,0.92)', borderRadius:20, border:'1.5px solid #DDD6FE', padding:'20px 24px', position:'relative', zIndex:3 }}>
            {!giftDone ? (
              <>
                <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:17, color:'#1A1035', marginBottom:4 }}>🎁 Contribute to Chisom's gift</p>
                <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:13, color:'#7A6CA8', marginBottom:14 }}>34 contributors · {formatNGN(487500)} raised · Demo mode — no real payment</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:10 }}>
                  {AMOUNTS.map(a => (
                    <button key={a} onClick={()=>{setGiftAmount(a);setCustomGift('');}} style={{ padding:'10px 4px', borderRadius:12, border:`2px solid ${giftAmount===a&&!customGift?'#7C3AED':'#DDD6FE'}`, background:giftAmount===a&&!customGift?'#7C3AED':'#fff', color:giftAmount===a&&!customGift?'#fff':'#374151', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                      {formatNGN(a)}
                    </button>
                  ))}
                </div>
                <input className="input" type="number" placeholder="Custom amount" value={customGift} onChange={e=>{setCustomGift(e.target.value);setGiftAmount(null);}} style={{ marginBottom:10 }}/>
                <button onClick={handleGift} style={{ width:'100%', padding:'13px', borderRadius:16, border:'none', background:'linear-gradient(135deg,#7C3AED,#5B21B6)', color:'#fff', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:15, cursor:'pointer' }}>
                  🎁 Contribute (Demo)
                </button>
              </>
            ) : (
              <div style={{ textAlign:'center', padding:'12px 0' }}>
                <div style={{ fontSize:44, marginBottom:8 }}>🎉</div>
                <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:18, color:'#1A1035', marginBottom:6 }}>Gift accepted! (Demo)</p>
                <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:14, color:'#7A6CA8' }}>On a real card, this would process via Flutterwave.</p>
              </div>
            )}
          </div>
        )}

        {/* Board / Card content */}
        <div style={{ position:'relative', zIndex:2, padding:'0 24px 80px', maxWidth:1500, margin:'0 auto' }}>
          {view==='board' ? (
            <div style={{ columns:'var(--bc,5) 200px', columnGap:14 }}>
              <style>{`
                @media(max-width:1400px){:root{--bc:4}}
                @media(max-width:1100px){:root{--bc:3}}
                @media(max-width:720px){:root{--bc:2}}
                @media(max-width:480px){:root{--bc:1}}
              `}</style>
              {/* Info tile */}
              <div style={{ background:'#fffde7', borderRadius:16, padding:'18px 20px', marginBottom:14, boxShadow:'0 2px 8px rgba(0,0,0,0.05)', breakInside:'avoid', fontSize:14, color:'#374151', lineHeight:1.6 }}>
                <p style={{ margin:'0 0 6px', display:'flex', alignItems:'flex-start', gap:6 }}><span style={{ color:'#3B82F6', fontWeight:700, flexShrink:0 }}>ℹ</span> Your group can attach photos, GIFs, videos and voice notes to their messages.</p>
                <p style={{ margin:'0 0 6px' }}>To be even more personalised you can choose a Premium Thankeeu card that unlocks extra custom fonts!</p>
                <p style={{ margin:0, fontWeight:700, color:'#7C3AED', fontFamily:"'Caveat',cursive", fontSize:16 }}>Thankeeu Sample</p>
              </div>
              {messages.map(msg => <BoardTile key={msg.id} msg={msg}/>)}
            </div>
          ) : (
            <div style={{ maxWidth:600, margin:'0 auto', paddingLeft:24, paddingRight:24 }}>
              <FlipCard messages={messages} onAddMessage={openModal}/>
            </div>
          )}
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ background:'#fff', padding:'60px 24px', textAlign:'center' }}>
        <h2 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:28, color:'#1A1035', marginBottom:8 }}>Create a card like this for someone special</h2>
        <p style={{ color:'#6B7280', marginBottom:32, fontSize:16 }}>Beautiful group cards with gift pots. From ₦5,000. Pay only when you send.</p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <Link to="/card/new" style={{ background:'linear-gradient(135deg,#7C3AED,#5B21B6)', color:'#fff', padding:'14px 32px', borderRadius:24, fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:16, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:8 }}>✨ Create a card — it's free</Link>
          <Link to="/signup" style={{ background:'#F5F0FF', color:'#7C3AED', border:'2px solid #DDD6FE', padding:'14px 32px', borderRadius:24, fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:16, textDecoration:'none' }}>Get started free →</Link>
        </div>
      </div>

      <Footer/>

      {/* ── Sign modal ── */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, zIndex:80, background:'rgba(26,16,53,0.65)', backdropFilter:'blur(8px)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}
          onClick={()=>setShowModal(false)}>
          <div style={{ background:'#fff', borderRadius:'28px 28px 0 0', width:'100%', maxWidth:560, padding:'28px 24px 40px', maxHeight:'94vh', overflowY:'auto' }}
            onClick={e=>e.stopPropagation()}>
            {!signDone ? (
              <>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                  <h3 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:20, color:'#1A1035', margin:0 }}>Sign this demo card ✍️</h3>
                  <button onClick={()=>setShowModal(false)} style={{ background:'#F5F0FF', border:'none', width:34, height:34, borderRadius:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon name="X" size={16} className="text-warm-400"/>
                  </button>
                </div>
                <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:13, color:'#7A6CA8', marginBottom:16 }}>
                  This is a demo — your message appears here locally, no account needed.
                </p>

                {/* Name */}
                <label style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:13, fontWeight:700, color:'#5B4B8A', display:'block', marginBottom:6 }}>Your name *</label>
                <input className="input" placeholder="e.g. Kemi Adeyemi" value={name} onChange={e=>setName(e.target.value)} style={{ marginBottom:14 }} maxLength={60}/>

                {/* Font style */}
                <label style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:13, fontWeight:700, color:'#5B4B8A', display:'block', marginBottom:8 }}>Writing style</label>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
                  {FONT_STYLES.map(f => (
                    <button key={f.id} onClick={()=>setFontId(f.id)} style={{ padding:'6px 12px', borderRadius:20, border:`2px solid ${fontId===f.id?'#7C3AED':'#DDD6FE'}`, background:fontId===f.id?'#EDE9FE':'#fff', fontFamily:f.family, fontSize:13, fontWeight:600, cursor:'pointer', color:fontId===f.id?'#5B21B6':'#6B7280' }}>
                      {f.name}
                    </button>
                  ))}
                </div>

                {/* Message */}
                <label style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:13, fontWeight:700, color:'#5B4B8A', display:'block', marginBottom:6 }}>Message</label>
                <div style={{ position:'relative', marginBottom:4 }}>
                  <textarea ref={textareaRef} className="input" rows={5} style={{ resize:'none', fontFamily:getFont(fontId).family, fontSize:getFont(fontId).size }} placeholder="Write something heartfelt for Chisom…" maxLength={1200} value={msgText} onChange={e=>setMsgText(e.target.value)}/>
                  <button type="button" onClick={()=>{setShowEmoji(s=>!s);setShowGifPick(false);setShowGifFull(false);}} style={{ position:'absolute', bottom:8, right:8, width:34, height:34, border:'1.5px solid #EDE9FE', background:'#fff', borderRadius:'50%', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>😊</button>
                  {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={()=>setShowEmoji(false)}/>}
                </div>
                <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:11, color:'#9CA3AF', textAlign:'right', marginBottom:14 }}>{msgText.length}/1200</p>

                {/* Media buttons */}
                <div style={{ position:'relative', display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
                  <button type="button" onClick={()=>fileRef.current?.click()} className="voice-record-button">📷 Photos/video</button>
                  <button type="button" onClick={()=>{setShowGifPick(s=>!s);setShowGifFull(false);setShowEmoji(false);}} className="voice-record-button">🎞️ Quick GIF</button>
                  <button type="button" onClick={()=>{setShowGifFull(s=>!s);setShowGifPick(false);setShowEmoji(false);}} className="voice-record-button">🔍 Search GIFs</button>
                  <VoiceRecorder onRecorded={f=>addMedia([f])}/>
                  <input ref={fileRef} type="file" accept="image/*,video/*,audio/*" multiple className="hidden" onChange={e=>addMedia(e.target.files)}/>

                  {/* Quick GIF picker */}
                  {showGifPick && (
                    <div style={{ position:'absolute', top:'100%', left:0, zIndex:20, background:'#fff', borderRadius:16, border:'1.5px solid #EDE9FE', padding:12, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, width:280, marginTop:6 }}>
                      {GIPHY_PRESETS.map(g => (
                        <button key={g.url} onClick={()=>{ setMediaFiles(p=>[...p,{file:null,url:g.url,type:'gif'}].slice(0,5)); setShowGifPick(false); }} style={{ borderRadius:10, overflow:'hidden', border:'none', cursor:'pointer', padding:0, lineHeight:0 }}>
                          <img src={g.url} alt={g.label} style={{ width:'100%', height:56, objectFit:'cover', display:'block' }} loading="lazy"/>
                        </button>
                      ))}
                    </div>
                  )}
                  {showGifFull && <div style={{ width:'100%', marginTop:6 }}><GifPicker onSelect={f=>{ addMedia([f]); setShowGifFull(false); }} onClose={()=>setShowGifFull(false)}/></div>}
                </div>

                {/* Media carousel */}
                {mediaFiles.length > 0 && (
                  <div style={{ borderRadius:16, overflow:'hidden', border:'1.5px solid #EDE9FE', marginBottom:14 }}>
                    <div style={{ position:'relative', aspectRatio:'16/9', background:'#1A1035' }}>
                      {mediaFiles[carouselIdx].type==='video'  ? <video src={mediaFiles[carouselIdx].url} className="w-full h-full object-contain" controls/> :
                       mediaFiles[carouselIdx].type==='voice'  ? <div className="w-full h-full flex flex-col items-center justify-center gap-3"><span style={{fontSize:40}}>🎙️</span><audio src={mediaFiles[carouselIdx].url} controls style={{width:'80%'}}/></div> :
                       <img src={mediaFiles[carouselIdx].url} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }}/>}
                      <button onClick={()=>removeMedia(carouselIdx)} style={{ position:'absolute', top:6, right:6, width:26, height:26, borderRadius:'50%', background:'rgba(0,0,0,0.6)', color:'#fff', border:'none', cursor:'pointer', fontSize:14 }}>✕</button>
                      {mediaFiles.length>1 && <>
                        <button onClick={()=>setCarouselIdx(i=>(i-1+mediaFiles.length)%mediaFiles.length)} style={{ position:'absolute', left:4, top:'50%', transform:'translateY(-50%)', width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.5)', color:'#fff', border:'none', cursor:'pointer', fontSize:16 }}>‹</button>
                        <button onClick={()=>setCarouselIdx(i=>(i+1)%mediaFiles.length)} style={{ position:'absolute', right:4, top:'50%', transform:'translateY(-50%)', width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.5)', color:'#fff', border:'none', cursor:'pointer', fontSize:16 }}>›</button>
                      </>}
                    </div>
                    <p style={{ textAlign:'center', fontSize:11, color:'#9CA3AF', padding:'6px 0' }}>{carouselIdx+1} of {mediaFiles.length}</p>
                  </div>
                )}

                {/* Private toggle */}
                <label style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18, cursor:'pointer' }}>
                  <input type="checkbox" checked={isPrivate} onChange={e=>setIsPrivate(e.target.checked)} style={{ width:18, height:18, accentColor:'#7C3AED' }}/>
                  <span style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:14, color:'#374151', fontWeight:600 }}>Private message (only recipient sees this)</span>
                </label>

                <button onClick={handleSign} disabled={!name.trim()||(!msgText.trim()&&mediaFiles.length===0)}
                  style={{ width:'100%', padding:'14px', borderRadius:20, border:'none', background:'linear-gradient(135deg,#7C3AED,#5B21B6)', color:'#fff', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:16, cursor:'pointer', opacity:(!name.trim()||(!msgText.trim()&&mediaFiles.length===0))?0.5:1 }}>
                  ✍️ Add my message to the card
                </button>
                <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:12, color:'#9CA3AF', textAlign:'center', marginTop:10 }}>
                  On a real card you can also add a gift contribution via Flutterwave.
                </p>
              </>
            ) : (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:56, marginBottom:12 }}>🎉</div>
                <h3 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:22, color:'#1A1035', marginBottom:8 }}>You signed it!</h3>
                <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:15, color:'#7A6CA8', marginBottom:20 }}>
                  Your message is on the {view==='card'?'flipbook card':'board'} now.
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <Link to="/card/new" style={{ background:'linear-gradient(135deg,#7C3AED,#5B21B6)', color:'#fff', padding:'14px 28px', borderRadius:20, fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:15, textDecoration:'none', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    ✨ Create a card — it's free
                  </Link>
                  <button onClick={()=>setShowModal(false)} style={{ background:'#F5F0FF', border:'2px solid #DDD6FE', padding:'12px 28px', borderRadius:20, fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:15, color:'#7C3AED', cursor:'pointer' }}>
                    Back to card
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}`}</style>
    </>
  );
}
