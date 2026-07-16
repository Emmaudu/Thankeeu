/**
 * AlbumSign.jsx — Book-style group card with cover page + per-signer pages.
 *
 * Page model:
 *   page  0 = Cover (always first, read-only design)
 *   page  1+ = Signer pages
 *
 * Backward compat:
 *   Old cards have many messages packed onto one page (MSGS_PER_PAGE = 5).
 *   We detect "legacy" pages by checking if any page_number has >1 message.
 *   Legacy pages render the sticker/scrapbook layout as before.
 *   New cards (isNewStyle) give every signer their own page.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMemberAuth } from '../context/MemberAuthContext';
import { useCompanyAuth } from '../context/CompanyAuthContext';
import { cardsAPI, messagesAPI, paymentsAPI, visitorsAPI, vendorAPI } from '../utils/api';
import { FONT_STYLES, getFontStyle, getCardDesign } from '../utils/cardDesigns';
import { CoverArtwork } from '../utils/coverArtwork.jsx';
import { normalizeCoverLayout } from '../utils/coverLayout';
import VoiceRecorder from '../components/VoiceRecorder';
import EmojiPicker from '../components/EmojiPicker';
import GifPicker from '../components/GifPicker';
import Icon from '../components/ui/Icon';
import toast from 'react-hot-toast';
import { openFlwCheckout } from '../utils/flwInline';
import { formatNGN, getFLWPaymentParams } from '../utils/currency';

// ─── Constants ───────────────────────────────────────────────────────────────

const MSGS_PER_PAGE = 5; // legacy only

const FONT_COLORS = [
  '#1E40AF','#7C3AED','#BE185D','#065F46',
  '#92400E','#1A1035','#B91C1C','#0369A1',
  '#4A044E','#14532D','#7C2D12','#1E3A5F',
];

const AMOUNTS_NGN = [2500, 5000, 10000, 20000, 50000, 100000];

const PAGE_THEMES = [
  { id:'ivory',    label:'Ivory',    bg:'#FEFCE8', lines:'rgba(200,190,130,0.13)', accent:'#92400E' },
  { id:'blush',    label:'Blush',    bg:'#FFF1F2', lines:'rgba(230,160,180,0.13)', accent:'#BE185D' },
  { id:'lavender', label:'Lavender', bg:'#F5F3FF', lines:'rgba(150,120,220,0.13)', accent:'#7C3AED' },
  { id:'mint',     label:'Mint',     bg:'#F0FDF4', lines:'rgba(100,180,140,0.13)', accent:'#065F46' },
  { id:'sky',      label:'Sky',      bg:'#F0F9FF', lines:'rgba(100,160,220,0.13)', accent:'#0369A1' },
  { id:'peach',    label:'Peach',    bg:'#FFF7ED', lines:'rgba(220,150,100,0.13)', accent:'#92400E' },
  { id:'rose',     label:'Rose',     bg:'#FDF2F8', lines:'rgba(210,140,180,0.11)', accent:'#9D174D' },
  { id:'charcoal', label:'Dark',     bg:'#1E1B2E', lines:'rgba(255,255,255,0.05)', accent:'#A78BFA' },
];

const TAPE_COLORS = ['#F59E0B','#EC4899','#8B5CF6','#10B981','#3B82F6','#EF4444'];

const defaultPosition = i => ({
  x:   8  + (i % 2) * 44 + ((i * 7)  % 14),
  y:   10 + Math.floor(i / 2) * 36 + ((i * 11) % 12),
  rot: [-5,2,-3,4,-1,5,-2,3][i % 8],
});

// ─── CSS injected once ───────────────────────────────────────────────────────
const ALBUM_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Dancing+Script:wght@600;700&family=Caveat:wght@400;500;600;700&family=Kalam:wght@300;400;700&display=swap');
@keyframes albumSpin { to { transform: rotate(360deg); } }
@keyframes albumPop  { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
@keyframes flipOut   { 0%{transform:perspective(1600px) rotateY(0deg);opacity:1} 100%{transform:perspective(1600px) rotateY(-88deg);opacity:0.35} }
@keyframes flipIn    { 0%{transform:perspective(1600px) rotateY(88deg);opacity:0.35} 100%{transform:perspective(1600px) rotateY(0deg);opacity:1} }
@keyframes flipOutB  { 0%{transform:perspective(1600px) rotateY(0deg);opacity:1} 100%{transform:perspective(1600px) rotateY(88deg);opacity:0.35} }
@keyframes flipInB   { 0%{transform:perspective(1600px) rotateY(-88deg);opacity:0.35} 100%{transform:perspective(1600px) rotateY(0deg);opacity:1} }
.album-flip-out  { animation: flipOut  0.34s cubic-bezier(.4,0,.2,1) both; transform-origin:left center; }
.album-flip-in   { animation: flipIn   0.34s cubic-bezier(.4,0,.2,1) both; transform-origin:left center; }
.album-flip-outB { animation: flipOutB 0.34s cubic-bezier(.4,0,.2,1) both; transform-origin:right center; }
.album-flip-inB  { animation: flipInB  0.34s cubic-bezier(.4,0,.2,1) both; transform-origin:right center; }
.album-page{ position:relative; }
/* subtle inner shadow toward the spine to sell the "bound book" look */
.album-page::before{
  content:''; position:absolute; top:0; bottom:0; left:0; width:34px; pointer-events:none; z-index:6;
  background:linear-gradient(90deg, rgba(0,0,0,0.14), rgba(0,0,0,0.04) 40%, transparent);
  border-radius:14px 0 0 14px;
}
/* soft page-curl bottom-right corner */
.album-page::after{
  content:''; position:absolute; right:0; bottom:0; width:46px; height:46px; pointer-events:none; z-index:6;
  background:linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.12));
  border-radius:0 0 14px 0;
}
.album-inline-input{
  width:100%; background:transparent; border:none; outline:none; resize:none;
  font-family:inherit; color:inherit; line-height:inherit; letter-spacing:inherit;
}
.album-inline-input::placeholder{ color:currentColor; opacity:0.35; }
.album-edit-chip{
  position:absolute; top:10px; right:12px; z-index:8; display:inline-flex; align-items:center; gap:5px;
  background:rgba(124,58,237,0.95); color:#fff; border:none; border-radius:999px;
  padding:5px 11px; font-size:11px; font-weight:800; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif;
  box-shadow:0 4px 14px rgba(124,58,237,0.4); backdrop-filter:blur(4px);
}
@media(max-width:900px){ .album-layout{ grid-template-columns:1fr !important; } }
@media(max-width:560px){
  .album-page{ width:100% !important; max-width:94vw !important; height:auto !important; min-height:520px !important; aspect-ratio:5/6; }
  .album-page::before{ width:22px; }
}
`;

// ─── Cover Page ──────────────────────────────────────────────────────────────
const CoverPage = ({ card, design, flipClass }) => {
  const isDark = design?.dark;
  const occasions = {
    birthday:'🎂', farewell:'👋', leaving:'👋', retirement:'🌟',
    wedding:'💍', anniversary:'💕', baby_shower:'👶', graduation:'🎓',
    thank_you:'🙏', get_well:'💊', christmas:'🎄', promotion:'🚀',
    welcome:'👐', sympathy:'🕊️', engagement:'💍', mothers_day:'💐',
    fathers_day:'👔', teachers_day:'🍎', other:'🎉',
  };
  const occ = card.occasion || 'birthday';
  const emoji = occasions[occ] || '🎉';
  const cardTitle = card.title || `${card.recipient_name}'s Card`;
  const coverArt = design?.artwork;
  const CL = normalizeCoverLayout(card.cover_layout);
  const clColor = (field, fallback) => {
    const c = CL[field]?.color;
    return !c || c === 'auto' ? fallback : c;
  };

  return (
    <div className={`album-page ${flipClass}`} style={{
      position:'relative', width:500, maxWidth:'92vw', height:600,
      borderRadius:14, overflow:'hidden',
      background: design?.background || 'linear-gradient(145deg,#F5F0FF,#EDE9FE)',
      boxShadow:'0 22px 74px rgba(0,0,0,0.26), 0 2px 0 rgba(255,255,255,0.6) inset',
      border:`1px solid ${design?.accent || '#C4B5FD'}44`,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      userSelect:'none',
    }}>
      {/* SVG artwork backdrop for artwork designs */}
      {coverArt && (
        <div style={{position:'absolute',inset:0,zIndex:0}}>
          <CoverArtwork scene={coverArt.scene} palette={coverArt.palette} seed={coverArt.seed} style={{width:'100%',height:'100%'}}/>
          <div style={{position:'absolute',inset:0,background:design.dark?'linear-gradient(180deg,rgba(8,6,20,0.28),rgba(8,6,20,0.1))':'linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.05))'}}/>
        </div>
      )}

      {/* Top ribbon accent */}
      <div style={{position:'absolute',top:0,left:0,right:0,height:8,
        background:`linear-gradient(90deg,${design?.accent||'#7C3AED'}88,${design?.accent||'#7C3AED'}44,${design?.accent||'#7C3AED'}88)`,
        borderRadius:'20px 20px 0 0'}}/>

      {/* Main content */}
      <div style={{position:'relative',zIndex:2,textAlign:'center',padding:'0 32px'}}>
        {/* Big emoji */}
        <div style={{fontSize:72,marginBottom:16,lineHeight:1,filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.15))'}}>{emoji}</div>

        {/* Card title */}
        {CL.title.show && (
        <h1 style={{
          fontFamily:"'Great Vibes', cursive",
          fontSize:'clamp(2.2rem,8vw,3.4rem)',
          color: clColor('title', isDark ? '#fff' : (design?.ink || '#1A1035')),
          margin:'0 0 10px', lineHeight:1.15,
          textShadow: isDark ? '0 2px 20px rgba(0,0,0,0.5)' : '0 2px 12px rgba(0,0,0,0.15)',
        }}>
          {cardTitle}
        </h1>
        )}

        {/* Divider */}
        <div style={{width:80,height:3,background:`linear-gradient(90deg,transparent,${design?.accent||'#7C3AED'},transparent)`,margin:'0 auto 16px',borderRadius:2}}/>

        {/* Recipient name */}
        {CL.recipient.show && (
        <p style={{
          fontFamily:"'Dancing Script', cursive",
          fontSize:'clamp(1.3rem,4vw,1.8rem)',
          color: clColor('recipient', isDark ? 'rgba(255,255,255,0.9)' : (design?.accent || '#7C3AED')),
          margin:'0 0 8px', fontWeight:700,
          textShadow: coverArt ? (isDark?'0 1px 8px rgba(0,0,0,0.4)':'0 1px 6px rgba(255,255,255,0.5)') : 'none',
        }}>
          For {card.recipient_name}
        </p>
        )}

        {/* Sender line */}
        {card.cover_sender && CL.sender.show && (
        <p style={{
          fontFamily:"'Caveat', cursive",
          fontSize:15, fontWeight:600,
          color: clColor('sender', isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)'),
          margin:'0 0 6px',
        }}>
          From {card.cover_sender}
        </p>
        )}

        {/* Occasion label */}
        <p style={{
          fontFamily:"'Caveat', cursive",
          fontSize:16,
          color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)',
          margin:0, letterSpacing:1,
        }}>
          {occ.replace(/_/g,' ')} card
        </p>

        {/* Bottom flourish */}
        <div style={{marginTop:28,fontSize:24,opacity:0.5,letterSpacing:8}}>• • •</div>
      </div>

      {/* Bottom ribbon */}
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:8,
        background:`linear-gradient(90deg,${design?.accent||'#7C3AED'}88,${design?.accent||'#7C3AED'}44,${design?.accent||'#7C3AED'}88)`,
        borderRadius:'0 0 20px 20px'}}/>
    </div>
  );
};

// ─── Page theme picker ───────────────────────────────────────────────────────
const PageThemePicker = ({ current, onSelect }) => (
  <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
    {PAGE_THEMES.map(t=>(
      <button key={t.id} onClick={()=>onSelect(t.id)} title={t.label}
        style={{width:24,height:24,borderRadius:6,background:t.bg,
          border:`3px solid ${current===t.id ? t.accent : 'transparent'}`,
          cursor:'pointer',flexShrink:0,
          boxShadow:current===t.id ? `0 0 0 1px ${t.accent}` : '0 1px 4px rgba(0,0,0,0.1)',
          transition:'all 0.15s'}}/>
    ))}
  </div>
);

// ─── Legacy sticker (old multi-msg pages) ───────────────────────────────────
const LegacySticker = ({ msg, globalIdx, isOwn, theme, onDragStart }) => {
  const pos = defaultPosition(globalIdx);
  const x   = msg._x  ?? msg.position_x  ?? pos.x;
  const y   = msg._y  ?? msg.position_y  ?? pos.y;
  const rot = msg._rot ?? msg.rotation   ?? pos.rot;
  const fStyle = getFontStyle(msg.font_style);
  const tape   = TAPE_COLORS[globalIdx % TAPE_COLORS.length];
  return (
    <div onMouseDown={e=>onDragStart(e,msg.id,x,y)} onTouchStart={e=>onDragStart(e,msg.id,x,y)}
      style={{position:'absolute',left:`${x}%`,top:`${y}%`,
        transform:`rotate(${rot}deg)`,zIndex:isOwn?12:4+(globalIdx%5),
        cursor:'grab',userSelect:'none',maxWidth:185,
        filter:isOwn?'drop-shadow(0 4px 16px rgba(124,58,237,0.28))':'drop-shadow(0 2px 8px rgba(0,0,0,0.11))'}}>
      {msg.media_url&&(msg.media_type==='image'||msg.media_type==='gif')&&(
        <div style={{background:'#fff',padding:'4px 4px 24px',boxShadow:'0 2px 14px rgba(0,0,0,0.14)',borderRadius:3,transform:`rotate(${rot>0?-1.5:1.5}deg)`,marginBottom:5,display:'inline-block',position:'relative'}}>
          <div style={{position:'absolute',top:-6,left:'50%',transform:'translateX(-50%)',width:34,height:12,background:tape+'BB',borderRadius:2}}/>
          <img src={msg.media_url} alt="" style={{display:'block',width:108,height:84,objectFit:'cover',borderRadius:1}}/>
          {msg.author_name&&<p style={{fontFamily:"'Caveat',cursive",fontSize:10,color:'#555',textAlign:'center',margin:'3px 0 0'}}>{msg.author_name}</p>}
        </div>
      )}
      <div style={{background:theme?.id==='charcoal'?'rgba(255,255,255,0.08)':'#fff',
        border:`1.5px solid ${theme?.accent+'22'||'#EDE9FE'}`,borderRadius:12,
        padding:'9px 12px 11px',minWidth:115,position:'relative',
        boxShadow:isOwn?`0 0 0 2px ${theme?.accent||'#7C3AED'},0 4px 20px rgba(0,0,0,0.1)`:'0 2px 10px rgba(0,0,0,0.07)'}}>
        {!msg.media_url&&<div style={{position:'absolute',top:-7,left:'50%',transform:'translateX(-50%)',width:30,height:12,background:tape+'CC',borderRadius:2}}/>}
        <p style={{fontFamily:fStyle?.family||"'Caveat',cursive",fontSize:Math.min(15,Math.max(11,15-Math.floor((msg.content?.length||0)/60))),
          color:msg.font_color||(theme?.id==='charcoal'?'#E9D5FF':'#1A1035'),
          margin:'2px 0 6px',lineHeight:1.45,wordBreak:'break-word',maxHeight:95,overflow:'hidden'}}>
          {(msg.content?.length||0)>135?msg.content.slice(0,135)+'…':msg.content}
        </p>
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          <div style={{width:16,height:16,borderRadius:'50%',background:theme?.accent||'#7C3AED',color:'#fff',fontSize:7,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            {msg.author_name?.slice(0,2).toUpperCase()||'??'}
          </div>
          <span style={{fontSize:9,fontWeight:700,color:theme?.accent||'#7C3AED',opacity:0.85}}>{msg.author_name}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Spiral binding (rendered once at the book's left edge) ───────────────────
const SpiralBinding = ({ dark }) => (
  <div style={{ position:'absolute', left:-9, top:26, bottom:26, width:20, zIndex:20, display:'flex', flexDirection:'column', justifyContent:'space-between', pointerEvents:'none' }}>
    {[...Array(13)].map((_,i)=>(
      <div key={i} style={{ position:'relative', height:10 }}>
        <div style={{ position:'absolute', left:0, width:20, height:4, borderRadius:4,
          background:dark?'linear-gradient(90deg,#6b7280,#9ca3af,#4b5563)':'linear-gradient(90deg,#c7ccd6,#eef1f6,#aab0bd)',
          boxShadow:'0 1px 2px rgba(0,0,0,0.28)' }}/>
        <div style={{ position:'absolute', left:15, top:-2, width:8, height:8, borderRadius:'50%',
          background:dark?'#1f2937':'#e7e2f0', boxShadow:'inset 0 1px 2px rgba(0,0,0,0.4)' }}/>
      </div>
    ))}
  </div>
);

// ─── New-style signer page (notebook leaf) ───────────────────────────────────
// When `editing` is true the content + author become inline inputs so a signer
// can type directly on the page (notebook-style) and the creator can edit any page.
const NewSignerPage = ({
  msg, theme, isOwn, flipClass, canEdit, editing,
  draft, onDraftChange, onStartEdit, onSaveEdit, onCancelEdit, saving,
}) => {
  const isDark = theme?.id === 'charcoal';
  const ink    = isDark ? '#F3E8FF' : '#2a2140';
  const sub    = isDark ? '#A78BFA' : '#8b8299';
  const accentC= theme?.accent || '#7C3AED';
  const paper  = theme?.bg || '#FFFDF8';
  const rule   = isDark ? 'rgba(167,139,250,0.16)' : 'rgba(120,90,200,0.14)';
  const fStyle = getFontStyle(editing ? (draft?.font_style || msg?.font_style) : msg?.font_style);
  const content = editing ? (draft?.content ?? '') : (msg?.content ?? '');
  const author  = editing ? (draft?.author_name ?? '') : (msg?.author_name ?? '');
  const fontColor = editing ? (draft?.font_color || msg?.font_color || ink) : (msg?.font_color || ink);

  return (
    <div className={`album-page ${flipClass}`} style={{
      position:'relative', width:500, maxWidth:'92vw', height:600,
      background:paper,
      // ruled notebook lines + a margin rule near the spine
      backgroundImage:`repeating-linear-gradient(0deg, transparent, transparent 33px, ${rule} 33px, ${rule} 34px)`,
      backgroundPosition:'0 78px',
      borderRadius:14,
      border:`1px solid ${isDark?'rgba(255,255,255,0.08)':'rgba(120,90,200,0.16)'}`,
      boxShadow:isDark
        ? '0 22px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)'
        : '0 22px 70px rgba(76,29,149,0.16), inset 0 1px 0 rgba(255,255,255,0.7)',
      overflow:'hidden', display:'flex', flexDirection:'column',
      transition:'background 0.4s,border-color 0.4s',
    }}>
      {/* red margin rule like a real notebook */}
      <div style={{ position:'absolute', left:52, top:0, bottom:0, width:1.5, background:isDark?'rgba(248,113,113,0.28)':'rgba(230,90,110,0.4)', zIndex:1 }}/>

      {/* Header band */}
      <div style={{ padding:'16px 24px 10px 60px', flexShrink:0, position:'relative', zIndex:2 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ width:9, height:9, borderRadius:'50%', background:accentC, opacity:0.7 }}/>
          <span style={{ fontFamily:"'Kalam',cursive", fontSize:13, color:sub, fontWeight:700 }}>
            {msg?.created_at ? new Date(msg.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) : 'A note for you'}
          </span>
        </div>
      </div>

      {/* Photo (kept if present) */}
      {msg?.media_url && (msg.media_type==='image'||msg.media_type==='gif'||msg.media_type==='video') && (
        <div style={{ margin:'0 24px 8px 60px', borderRadius:10, overflow:'hidden', flexShrink:0,
          boxShadow:'0 6px 18px rgba(0,0,0,0.16)', transform:'rotate(-1.2deg)', border:'5px solid #fff' }}>
          {msg.media_type==='video'
            ? <video src={msg.media_url} style={{ width:'100%', maxHeight:200, objectFit:'cover', display:'block' }} controls/>
            : <img src={msg.media_url} alt="" style={{ width:'100%', maxHeight:200, objectFit:'cover', display:'block' }}/>}
        </div>
      )}

      {/* Message body — inline editable */}
      <div style={{ flex:1, margin:'6px 24px 0 60px', display:'flex', flexDirection:'column', minHeight:0, position:'relative', zIndex:2 }}>
        {editing ? (
          <textarea
            className="album-inline-input"
            autoFocus
            value={content}
            onChange={e=>onDraftChange({ content:e.target.value })}
            placeholder="Write your message right here…"
            style={{
              fontFamily:fStyle?.family||"'Caveat',cursive",
              fontSize:22, color:fontColor, lineHeight:'34px', flex:1, minHeight:180,
              paddingTop:2,
            }}
          />
        ) : content ? (
          <p style={{
            fontFamily:fStyle?.family||"'Caveat',cursive",
            fontSize:Math.min(24,Math.max(15,24-Math.floor((content.length||0)/48))),
            color:fontColor, lineHeight:'34px', margin:0, wordBreak:'break-word',
            flex:1, overflow:'hidden', whiteSpace:'pre-wrap',
          }}>
            {content}
          </p>
        ) : (
          <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'flex-start' }}>
            <p style={{ fontFamily:"'Caveat',cursive", fontSize:20, color:sub, opacity:0.55, margin:0 }}>
              This page is waiting for a message…
            </p>
          </div>
        )}
      </div>

      {/* Signature footer */}
      <div style={{ margin:'8px 24px 20px 60px', flexShrink:0, position:'relative', zIndex:2, borderTop:`1px dashed ${accentC}33`, paddingTop:12, display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <span style={{ fontFamily:"'Kalam',cursive", fontSize:12, color:sub }}>with love,</span>
          {editing ? (
            <input
              className="album-inline-input"
              value={author}
              onChange={e=>onDraftChange({ author_name:e.target.value })}
              placeholder="your name"
              style={{ fontFamily:"'Dancing Script',cursive", fontWeight:700, fontSize:24, color:accentC, marginTop:2 }}
            />
          ) : (
            <p style={{ fontFamily:"'Dancing Script',cursive", fontWeight:700, fontSize:24, color:accentC, margin:'2px 0 0', wordBreak:'break-word' }}>
              {author || '—'}
            </p>
          )}
        </div>
        {msg?.contributed_amount>0 && (
          <div style={{ display:'flex', alignItems:'center', gap:5, background:'#FEF3C7', border:'1.5px solid #FDE68A', borderRadius:20, padding:'5px 11px', flexShrink:0 }}>
            <span style={{ fontSize:14 }}>🎁</span>
            <span style={{ fontSize:11, fontWeight:800, color:'#92400E' }}>{formatNGN(msg.contributed_amount)}</span>
          </div>
        )}
      </div>

      {/* Editing controls */}
      {editing ? (
        <div style={{ position:'absolute', top:10, right:12, zIndex:9, display:'flex', gap:6 }}>
          <button onClick={onCancelEdit} disabled={saving}
            style={{ background:'#fff', color:'#6B7280', border:'1px solid #E5E7EB', borderRadius:999, padding:'5px 12px', fontSize:11, fontWeight:800, cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif' }}>
            Cancel
          </button>
          <button onClick={onSaveEdit} disabled={saving}
            style={{ background:'linear-gradient(135deg,#7C3AED,#5B21B6)', color:'#fff', border:'none', borderRadius:999, padding:'5px 14px', fontSize:11, fontWeight:800, cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif', display:'inline-flex', alignItems:'center', gap:5 }}>
            {saving ? 'Saving…' : <><Icon name="Check" size={12} style={{color:'#fff'}}/> Save</>}
          </button>
        </div>
      ) : canEdit && msg ? (
        <button className="album-edit-chip" onClick={onStartEdit}>
          <Icon name="PenLine" size={12} style={{color:'#fff'}}/> {isOwn ? 'Edit my note' : 'Edit'}
        </button>
      ) : null}

      {/* page number */}
      <div style={{ position:'absolute', bottom:10, right:18, fontFamily:"'Caveat',cursive", fontSize:14, color:accentC, opacity:0.4, zIndex:2 }}>
        {msg?._pageLabel || ''}
      </div>
    </div>
  );
};

// ─── Legacy page (multi-sticker) ─────────────────────────────────────────────
const LegacyAlbumPage = ({ pageNum, messages, myMsgIds, theme, flipClass, onDragStart, pageRef }) => {
  const isDark = theme?.id === 'charcoal';
  const accentC= theme?.accent||'#7C3AED';
  return (
    <div ref={pageRef} className={`album-page ${flipClass}`} style={{
      position:'relative',width:500,maxWidth:'90vw',height:600,
      background:theme?.bg||'#F5F3FF',
      backgroundImage:`repeating-linear-gradient(0deg,transparent,transparent 27px,${theme?.lines||'rgba(150,120,220,0.13)'} 27px,${theme?.lines||'rgba(150,120,220,0.13)'} 28px)`,
      borderRadius:20,border:`1.5px solid ${isDark?'rgba(255,255,255,0.1)':accentC+'30'}`,
      boxShadow:isDark?'0 12px 60px rgba(0,0,0,0.4)':'0 8px 48px rgba(0,0,0,0.1)',
      overflow:'hidden',
    }}>
      <div style={{height:6,background:`linear-gradient(90deg,${accentC}55,${accentC}22,${accentC}55)`,borderRadius:'20px 20px 0 0'}}/>
      <div style={{position:'absolute',top:16,left:0,right:0,textAlign:'center',pointerEvents:'none',zIndex:2}}>
        <p style={{fontFamily:"'Caveat',cursive",fontSize:12,color:accentC,opacity:0.5,margin:0}}>Page {pageNum}</p>
      </div>
      {messages.map((msg,i)=>(
        <LegacySticker key={msg.id} msg={msg} globalIdx={i} isOwn={myMsgIds.includes(msg.id)} theme={theme} onDragStart={onDragStart}/>
      ))}
      {messages.length===0&&(
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',opacity:0.4}}>
          <div style={{fontSize:44,marginBottom:10}}>✍️</div>
          <p style={{fontFamily:"'Caveat',cursive",fontSize:18,color:accentC}}>Be the first to sign!</p>
        </div>
      )}
      <div style={{position:'absolute',bottom:10,right:16,fontFamily:"'Caveat',cursive",fontSize:13,color:accentC,opacity:0.35,pointerEvents:'none'}}>{pageNum}</div>
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:5,background:`linear-gradient(90deg,${accentC}55,${accentC}22,${accentC}55)`,borderRadius:'0 0 20px 20px'}}/>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AlbumSign = ({ card: initialCard, slug }) => {
  const { user }    = useAuth();
  const { member }  = useMemberAuth();
  const { company } = useCompanyAuth();
  const isSignedIn  = !!(user||member||company);
  const [searchParams] = useSearchParams();

  const [card,       setCard]       = useState(initialCard);
  const [page,       setPage]       = useState(0); // 0 = cover
  const [submitted,  setSubmitted]  = useState(false);
  const [myMsgIds,   setMyMsgIds]   = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stage,      setStage]      = useState('idle');
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [showHelp,   setShowHelp]   = useState(false);
  const [signaturesOpen, setSignaturesOpen] = useState(true);
  const [flipClass,  setFlipClass]  = useState('');
  const [pageThemes, setPageThemes] = useState(['lavender']);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount,   setCustomAmount]   = useState('');
  const [giftCurrency,   setGiftCurrency]   = useState('NGN');
  const [giftMode,       setGiftMode]       = useState('money'); // 'money' | 'product'
  const [vendors,        setVendors]        = useState([]);
  const [vendorFilter,   setVendorFilter]   = useState({ country: '', category: '' });
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [selectedProduct,setSelectedProduct]= useState(null);
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [productImgIdx,  setProductImgIdx]  = useState(0);
  const [allSignersOpen, setAllSignersOpen] = useState(true);

  // ── Inline page editing (notebook direct typing) ──────────────────────────
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editDraft, setEditDraft] = useState(null); // {content, author_name, font_style, font_color}
  const [savingEdit, setSavingEdit] = useState(false);
  // Direct-on-page compose for the blank leaf
  const [inlineCompose, setInlineCompose] = useState(false);

  const signedInName  = user?.full_name||(member?`${member.first_name} ${member.last_name}`.trim():null)||company?.contact_person||'';
  const signedInEmail = user?.email||member?.email||company?.email||'';

  const [form, setForm] = useState({
    author_name:signedInName, author_email:signedInEmail,
    content:'', is_private:false, font_style:'handwritten',
    font_color:'#1E40AF', font_size:18,
  });

  const [mediaFiles,  setMediaFiles]  = useState([]);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [showEmoji,   setShowEmoji]   = useState(false);
  const [showGif,     setShowGif]     = useState(false);

  const dragging   = useRef(null);
  const pageRef    = useRef();
  const fileInputRef = useRef();
  const textareaRef  = useRef();

  const openEditorFor = useCallback((action = 'message') => {
    setShowEditor(true);
    setShowEmoji(false);
    setShowGif(false);

    window.setTimeout(() => {
      if (action === 'media') fileInputRef.current?.click();
      if (action === 'gif') setShowGif(true);
      if (action === 'message') textareaRef.current?.focus();
      if (action === 'voice') document.getElementById('album-voice-tools')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (action === 'gift') {
        setGiftMode('money');
        document.getElementById('album-gift-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
  }, []);

  // ─ Derived ─
  const messages = (card?.messages||[]).filter(Boolean);
  const design   = getCardDesign(card?.design_theme);

  // Detect legacy vs new-style:
  // Legacy = messages that were packed (page_number used sequentially per MSGS_PER_PAGE grouping).
  // We check: if any page_number value appears more than once, it's legacy.
  const pageNumCounts = {};
  messages.forEach(m => {
    const pn = m.page_number||1;
    pageNumCounts[pn] = (pageNumCounts[pn]||0)+1;
  });
  const isNewStyle = Object.values(pageNumCounts).every(c=>c<=1) && messages.length <= 200;

  // Build page list:
  // page 0 = cover (always)
  // For legacy: pages 1..N are MSGS_PER_PAGE groups
  // For new-style: each message is its own page; plus one blank "add your page" at the end
  let pageList; // array of { type:'cover'|'legacy'|'new'|'blank', msgs?, pageNum? }
  if (!isNewStyle) {
    // Legacy grouping
    const legacyPageCount = Math.max(1, Math.ceil(messages.length/MSGS_PER_PAGE));
    pageList = [
      { type:'cover' },
      ...Array.from({length:legacyPageCount},(_,i)=>({
        type:'legacy', pageNum:i+1,
        msgs: messages.filter((_,mi)=>Math.floor(mi/MSGS_PER_PAGE)===i),
      })),
      { type:'blank' }, // always one empty page to sign on
    ];
  } else {
    // New-style: one page per signer + blank
    pageList = [
      { type:'cover' },
      ...messages.map((msg,i)=>({ type:'new', msg, pageNum:i+1 })),
      { type:'blank' }, // next available page
    ];
  }

  const totalPages = pageList.length; // includes cover (index 0)
  const clampedPage = Math.min(page, totalPages-1);

  // Current page theme
  const themeIdx = Math.max(0, clampedPage-1); // cover has no theme (design handles it)
  const currentPageThemeId = pageThemes[themeIdx] || 'lavender';
  const currentTheme = PAGE_THEMES.find(t=>t.id===currentPageThemeId)||PAGE_THEMES[2];
  const isDark = currentTheme?.id==='charcoal';
  const accentC = clampedPage===0 ? (design?.accent||'#7C3AED') : (currentTheme?.accent||'#7C3AED');

  // ─ Page flip animation ─
  const flipTo = useCallback((newPage, direction='forward') => {
    if (newPage === clampedPage) return;
    const outClass = direction==='forward' ? 'album-flip-out'  : 'album-flip-outB';
    const inClass  = direction==='forward' ? 'album-flip-in'   : 'album-flip-inB';
    setFlipClass(outClass);
    setTimeout(()=>{ setPage(newPage); setFlipClass(inClass); }, 220);
    setTimeout(()=>{ setFlipClass(''); }, 440);
  }, [clampedPage]);

  const goNext = () => { if (clampedPage < totalPages-1) flipTo(clampedPage+1,'forward'); };
  const goPrev = () => { if (clampedPage > 0) flipTo(clampedPage-1,'back'); };

  // ─ Drag (legacy only) ─
  const startDrag = useCallback((e,msgId,initialX,initialY)=>{
    e.preventDefault();
    const cx=e.touches?e.touches[0].clientX:e.clientX;
    const cy=e.touches?e.touches[0].clientY:e.clientY;
    dragging.current={msgId,startClientX:cx,startClientY:cy,initialX,initialY};
  },[]);

  const onDragMove = useCallback((e)=>{
    if(!dragging.current||!pageRef.current) return;
    const cx=e.touches?e.touches[0].clientX:e.clientX;
    const cy=e.touches?e.touches[0].clientY:e.clientY;
    const rect=pageRef.current.getBoundingClientRect();
    const dx=((cx-dragging.current.startClientX)/rect.width)*100;
    const dy=((cy-dragging.current.startClientY)/rect.height)*100;
    const nx=Math.max(0,Math.min(82,dragging.current.initialX+dx));
    const ny=Math.max(0,Math.min(82,dragging.current.initialY+dy));
    setCard(prev=>({...prev,messages:(prev.messages||[]).filter(Boolean).map(m=>m.id===dragging.current.msgId?{...m,_x:nx,_y:ny}:m)}));
  },[]);

  const onDragEnd = useCallback(()=>{
    if(!dragging.current) return;
    const {msgId}=dragging.current;
    const msg=(card?.messages||[]).filter(Boolean).find(m=>m.id===msgId);
    if(msg&&(msg._x!==undefined||msg._y!==undefined)){
      messagesAPI.updatePosition(msgId,{position_x:msg._x??msg.position_x,position_y:msg._y??msg.position_y,rotation:msg.rotation,author_email:form.author_email}).catch(()=>{});
    }
    dragging.current=null;
  },[card,form.author_email]);

  // ─ Inline edit handlers ─
  const canEditMsg = useCallback((m) => {
    if (!m) return false;
    if (card?.isCreator) return true;              // creator edits all pages
    if (myMsgIds.includes(m.id)) return true;      // signer edits own page (this session)
    // author email match (returning signer)
    if (form.author_email && m.author_email &&
        form.author_email.toLowerCase().trim() === m.author_email.toLowerCase().trim()) return true;
    return false;
  }, [card?.isCreator, myMsgIds, form.author_email]);

  const startEdit = useCallback((m) => {
    if (!m) return;
    setEditingMsgId(m.id);
    setEditDraft({
      content: m.content || '',
      author_name: m.author_name || '',
      font_style: m.font_style || 'handwritten',
      font_color: m.font_color || null,
    });
  }, []);

  const cancelEdit = useCallback(() => { setEditingMsgId(null); setEditDraft(null); }, []);

  const saveEdit = useCallback(async () => {
    if (!editingMsgId || !editDraft) return;
    if (!editDraft.content.trim()) return toast.error('Message cannot be empty');
    setSavingEdit(true);
    try {
      await messagesAPI.updateMessage(editingMsgId, {
        content: editDraft.content.trim(),
        author_name: editDraft.author_name?.trim() || undefined,
        font_style: editDraft.font_style,
        ...(editDraft.font_color ? { font_color: editDraft.font_color } : {}),
        author_email: form.author_email || undefined,
      });
      // optimistic local update
      setCard(prev => ({
        ...prev,
        messages: (prev.messages || []).map(m =>
          m.id === editingMsgId ? { ...m, content: editDraft.content.trim(), author_name: editDraft.author_name?.trim() || m.author_name, font_style: editDraft.font_style, font_color: editDraft.font_color || m.font_color } : m),
      }));
      toast.success('Saved ✓');
      setEditingMsgId(null); setEditDraft(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save your edits');
    } finally { setSavingEdit(false); }
  }, [editingMsgId, editDraft, form.author_email]);

  // ─ Media ─
  const addMedia = useCallback((files)=>{
    const items=[];
    for(const f of Array.from(files)){
      if(f.size>50*1024*1024){toast.error(`${f.name} too large`);continue;}
      const type=f.type.startsWith('video/')?'video':f.type.startsWith('audio/')?'voice':f.type==='image/gif'?'gif':'image';
      items.push({file:f,preview:URL.createObjectURL(f),type,name:f.name});
    }
    setMediaFiles(prev=>[...prev,...items].slice(0,5));
  },[]);

  const removeMedia = useCallback((idx)=>{
    setMediaFiles(prev=>{const n=[...prev];URL.revokeObjectURL(n[idx].preview);n.splice(idx,1);setCarouselIdx(i=>Math.min(i,Math.max(0,n.length-1)));return n;});
  },[]);

  const insertEmoji = useCallback((emoji)=>{
    const el=textareaRef.current;
    if(el&&typeof el.selectionStart==='number'){
      const s=el.selectionStart,e=el.selectionEnd;
      setForm(p=>({...p,content:p.content.slice(0,s)+emoji+p.content.slice(e)}));
      requestAnimationFrame(()=>{el.focus();el.setSelectionRange(s+emoji.length,s+emoji.length);});
    }else{setForm(p=>({...p,content:p.content+emoji}));}
    setShowEmoji(false);
  },[]);

  // ─ Load vendors for product gifting ─
  const loadVendors = async (country = '', category = '') => {
    try {
      const base = import.meta.env.VITE_API_URL || '/api';
      const params = new URLSearchParams();
      if (country)  params.set('country', country);
      if (category) params.set('category', category);
      const res = await fetch(`${base}/vendor/public?${params}`);
      const d   = await res.json();
      setVendors(d || []);
    } catch { toast.error('Could not load gift vendors'); }
  };

  // ─ Product gift submit ─
  const handleProductGift = async () => {
    if (!selectedProduct) return toast.error('Please select a product');
    if (!selectedVendor)  return toast.error('Please select a vendor');
    if (!form.author_name.trim())  return toast.error('Please add your name');
    if (!form.author_email.trim()) return toast.error('Email is required');
    if (!form.content.trim())      return toast.error('Please write a message');
    setProductSubmitting(true);
    try {
      const newPageNum = isNewStyle ? messages.length + 1 : Math.ceil((messages.length + 1) / MSGS_PER_PAGE);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('position_x', isNewStyle ? 50 : defaultPosition(messages.length).x);
      fd.append('position_y', isNewStyle ? 50 : defaultPosition(messages.length).y);
      fd.append('rotation',   defaultPosition(messages.length).rot);
      fd.append('page_number', newPageNum);
      fd.append('gift_type', 'product');
      fd.append('product_vendor_id',   selectedVendor.id);
      fd.append('product_vendor_name', selectedVendor.business_name);
      fd.append('product_id',    selectedProduct.id);
      fd.append('product_name',  selectedProduct.name);
      fd.append('product_price', selectedProduct.price);
      if (!isSignedIn) fd.append('is_guest', 'true');
      mediaFiles.forEach((m, i) => fd.append(i === 0 ? 'media' : `media_gallery_${i}`, m.file));
      const msgRes = await messagesAPI.add(slug, fd);
      const messageId = msgRes.data?.id;
      if (messageId) setMyMsgIds(prev => [...prev, messageId]);
      const refreshed = await cardsAPI.getPublic(slug);
      setCard(refreshed.data);

      // Place order + FLW payment
      const orderRes = await vendorAPI.checkout(selectedVendor.slug, {
        items: [{ product_id: selectedProduct.id, quantity: 1 }],
        customer_name:  form.author_name.trim(),
        customer_email: form.author_email.trim(),
        card_slug:      slug,
      });
      const { payment_link } = orderRes.data;
      if (payment_link) {
        toast.success('Redirecting to pay for your gift...');
        window.location.href = payment_link;
      } else {
        toast.success('Gift order placed! The vendor will contact you to arrange delivery. 🎁');
        const newMsgs = (refreshed.data?.messages || []).filter(Boolean);
        flipTo(newMsgs.length, 'forward');
        setShowEditor(false);
        setForm(p => ({ ...p, content: '' }));
        setMediaFiles([]);
        setSubmitted(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send product gift');
    } finally { setProductSubmitting(false); }
  };

  // ─ Submit ─
  const handleSubmit = async()=>{
    if(!form.author_name.trim()) return toast.error('Please add your name');
    if(!form.content.trim())     return toast.error('Please write a message');
    if(!form.author_email.trim()) return toast.error('Email is required');
    const amountNGN=Number(customAmount||selectedAmount||0);
    const wantsGift=card.is_gift_enabled&&amountNGN>=2500;
    setSubmitting(true); setStage('sending');
    try{
      // New-style: page_number = messages.length + 1 (each signer gets own page)
      const newPageNum = isNewStyle ? messages.length+1 : Math.ceil((messages.length+1)/MSGS_PER_PAGE);
      const fd=new FormData();
      Object.entries(form).forEach(([k,v])=>fd.append(k,v));
      fd.append('position_x', isNewStyle?50:defaultPosition(messages.length).x);
      fd.append('position_y', isNewStyle?50:defaultPosition(messages.length).y);
      fd.append('rotation',   defaultPosition(messages.length).rot);
      fd.append('page_number', newPageNum);
      if(!isSignedIn) fd.append('is_guest','true');
      mediaFiles.forEach((m,i)=>fd.append(i===0?'media':`media_gallery_${i}`,m.file));
      const msgRes=await messagesAPI.add(slug,fd);
      const messageId=msgRes.data?.id;
      if(messageId) setMyMsgIds(prev=>[...prev,messageId]);
      const refreshed=await cardsAPI.getPublic(slug);
      setCard(refreshed.data);
      if(!wantsGift){
        setSubmitting(false); setStage('idle'); setShowEditor(false);
        setForm(p=>({...p,content:''})); setMediaFiles([]);
        // Flip to the new page
        const newMsgs=(refreshed.data?.messages||[]).filter(Boolean);
        flipTo(newMsgs.length,'forward'); // cover=0, page 1=first msg
        if(!isSignedIn&&form.author_email){
          visitorsAPI.track({email:form.author_email,full_name:form.author_name,card_slug:slug}).catch(()=>{});
        }
        setSubmitted(true); return;
      }
      setStage('paying');
      const{amount:flwAmount,currency:flwCurrency}=getFLWPaymentParams(amountNGN,giftCurrency);
      const payRes=await paymentsAPI.initContribution({card_slug:slug,contributor_name:form.author_name,contributor_email:form.author_email,amount:amountNGN,display_currency:giftCurrency,flw_amount:flwAmount,flw_currency:flwCurrency,message_id:messageId});
      const{tx_ref,flw_config}=payRes.data;
      if(!tx_ref||!flw_config) throw new Error('Invalid payment config');
      setStage('redirecting'); setSubmitting(false);
      await new Promise(resolve=>{
        openFlwCheckout({
          flwConfig:flw_config,
          onSuccess:async(ref)=>{
            setStage('verifying');
            try{await paymentsAPI.verifyContribution(ref||tx_ref);toast.success('Message and gift confirmed! 🎉');setSubmitted(true);}
            catch(e){const m=e?.response?.data?.error||e?.message||'';if(e?.response?.status===400||m.toLowerCase().includes('not completed')){toast.error('Payment not completed.');}else{toast.success('Gift received! 🎉');setSubmitted(true);}}
            setStage('idle');resolve();
          },
          onClose:()=>{toast('Payment cancelled. Message is on the card!',{icon:'ℹ️'});setStage('idle');resolve();},
        });
      });
    }catch(err){toast.error(err.response?.data?.error||'Could not sign card. Try again.');setSubmitting(false);setStage('idle');}
  };

  // ─ Success ─
  if(submitted&&stage!=='verifying') return(
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 section-dots" style={{background:'linear-gradient(160deg,#F5F0FF,#FFF0F5)'}}>
      <style>{ALBUM_CSS}</style>
      <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border-2 border-purple-100">
        <div style={{width:80,height:80,background:'#DCFCE7',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:40,margin:'0 auto 20px',animation:'albumPop 0.4s ease'}}>✓</div>
        <h2 className="text-2xl font-bold text-warm-900 mb-2">You're on {card.recipient_name}'s card! 🎉</h2>
        <p className="text-warm-500 mb-7">Your message has its own page.</p>
        <button onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent(`Sign ${card.recipient_name}'s card: ${window.location.origin}/sign/${slug}`)}`, '_blank')}
          className="w-full py-4 rounded-2xl font-bold text-white mb-3" style={{background:'#25D366'}}>
          📣 Invite others on WhatsApp
        </button>
        <button onClick={()=>setSubmitted(false)} className="w-full py-3 rounded-2xl font-bold border-2 border-purple-100 text-primary-600">
          Sign again / view card
        </button>
      </div>
    </div>
  );

  if(stage==='verifying') return(
    <div className="min-h-screen grid place-items-center" style={{background:'#F5F3FF'}}>
      <style>{ALBUM_CSS}</style>
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4" style={{animation:'albumSpin 0.8s linear infinite'}}/>
        <p className="text-warm-500 text-lg">Confirming your gift…</p>
      </div>
    </div>
  );

  // ─ Render current page ─
  const pageDef = pageList[clampedPage];
  const showingCover = clampedPage===0;
  const bgColor = showingCover ? (design?.soft||'#F5F3FF') : (currentTheme?.bg||'#F5F3FF');

  return(
    <div className="section-dots" style={{minHeight:'100vh',background:bgColor,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",transition:'background 0.4s'}}>
      <style>{ALBUM_CSS}</style>

      {/* ── Top bar ── */}
      <div style={{background:isDark&&!showingCover?'#14102a':'#fff',borderBottom:`1.5px solid ${showingCover?design?.accent+'30'||'#EDE9FE':'#EDE9FE'}`,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 1.25rem',height:60,position:'sticky',top:0,zIndex:40,boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
        <Link to="/" style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:800,fontSize:17,color:isDark&&!showingCover?'#E9D5FF':'#1A1035',textDecoration:'none'}}>
          Thank<span style={{color:'#7C3AED'}}>eeu</span>
        </Link>
        <div style={{textAlign:'center'}}>
          <h1 style={{fontWeight:700,fontSize:15,color:isDark&&!showingCover?'#E9D5FF':'#1A1035',margin:0,lineHeight:1.2}}>{card.recipient_name}'s card</h1>
          <p style={{fontSize:11,color:'#9CA3AF',margin:0}}>{messages.length} {messages.length===1?'message':'messages'} · {showingCover?'Cover':`Page ${clampedPage} of ${totalPages-1}`}</p>
        </div>
        <button className="md:hidden" onClick={()=>setMobileSidebar(true)}
          style={{background:'#7C3AED',border:'none',borderRadius:12,padding:'8px 14px',fontWeight:700,fontSize:13,color:'#fff',cursor:'pointer'}}>
          Gift &amp; Share
        </button>
        <div className="hidden md:block" style={{width:100}}/>
      </div>

      {/* ── Toolbar (hidden on cover) ── */}
      {!showingCover && (
        <div style={{background:isDark?'#1a1535':'#fff',borderBottom:`1.5px solid ${isDark?'rgba(255,255,255,0.08)':'#EDE9FE'}`,display:'flex',alignItems:'center',gap:8,padding:'10px 1.25rem',flexWrap:'wrap'}}>
          <button onClick={()=>openEditorFor('message')}
            style={{background:'linear-gradient(135deg,#7C3AED,#5B21B6)',color:'#fff',border:'none',borderRadius:22,padding:'10px 22px',fontWeight:800,fontSize:14,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:7,boxShadow:'0 4px 16px rgba(124,58,237,0.35)'}}>
            <Icon name="PenLine" size={15} style={{color:'#fff'}}/> Sign this card
          </button>
          <button onClick={()=>fileInputRef.current?.click()} title="Add photo"
            style={{width:40,height:40,borderRadius:'50%',border:`1.5px solid ${isDark?'rgba(255,255,255,0.15)':'#EDE9FE'}`,background:isDark?'rgba(255,255,255,0.07)':'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17}}>🖼️</button>
          <button onClick={()=>setShowGif(s=>!s)} title="Add GIF"
            style={{width:40,height:40,borderRadius:'50%',border:`1.5px solid ${isDark?'rgba(255,255,255,0.15)':'#EDE9FE'}`,background:isDark?'rgba(255,255,255,0.07)':'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:11,color:isDark?'#A78BFA':'#7C3AED'}}>GIF</button>
          <VoiceRecorder onRecorded={f=>addMedia([f])} disabled={submitting}/>
          <div style={{flex:1}}/>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:11,fontWeight:700,color:isDark?'#A78BFA':'#9CA3AF',whiteSpace:'nowrap'}}>Page colour:</span>
            <PageThemePicker current={currentPageThemeId} onSelect={themeId=>{
              setPageThemes(prev=>{const n=[...prev];while(n.length<clampedPage)n.push('lavender');n[clampedPage-1]=themeId;return n;});
            }}/>
          </div>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={e=>{addMedia(e.target.files);e.target.value='';}}/>
        </div>
      )}

      {/* ── Main layout ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:0,maxWidth:1100,margin:'0 auto',padding:'32px 16px',alignItems:'start'}} className="album-layout">

        {/* ── Book ── */}
        <div>
          <div style={{position:'relative',display:'flex',justifyContent:'center',alignItems:'center',minHeight:640,userSelect:'none'}}
            onMouseMove={onDragMove} onMouseUp={onDragEnd}
            onTouchMove={onDragMove} onTouchEnd={onDragEnd}>

            {/* Stacked shadows */}
            {clampedPage>0&&[2,1].map(off=>(
              <div key={off} style={{position:'absolute',left:'50%',top:'50%',
                transform:`translate(calc(-50% - ${off*18}px),calc(-50% + ${off*4}px)) rotate(${-off*2}deg)`,
                width:500,maxWidth:'90vw',height:600,borderRadius:20,
                background:PAGE_THEMES[(themeIdx-off+PAGE_THEMES.length)%PAGE_THEMES.length]?.bg||'#fff',
                border:'1.5px solid rgba(200,180,240,0.25)',boxShadow:'0 4px 20px rgba(0,0,0,0.05)',zIndex:0}}/>
            ))}
            {clampedPage<totalPages-1&&[1,2].map(off=>(
              <div key={off} style={{position:'absolute',left:'50%',top:'50%',
                transform:`translate(calc(-50% + ${off*18}px),calc(-50% + ${off*4}px)) rotate(${off*2}deg)`,
                width:500,maxWidth:'90vw',height:600,borderRadius:20,
                background:PAGE_THEMES[(themeIdx+off)%PAGE_THEMES.length]?.bg||'#fff',
                border:'1.5px solid rgba(200,180,240,0.25)',boxShadow:'0 4px 20px rgba(0,0,0,0.05)',zIndex:0}}/>
            ))}

            {/* Active page */}
            <div style={{position:'relative',zIndex:1}}>
                {showingCover
                  ? <CoverPage card={card} design={design} flipClass={flipClass}/>
                  : pageDef?.type==='legacy'
                    ? <LegacyAlbumPage pageRef={pageRef} pageNum={pageDef.pageNum} messages={pageDef.msgs||[]} myMsgIds={myMsgIds} theme={currentTheme} flipClass={flipClass} onDragStart={startDrag}/>
                    : <NewSignerPage
                        msg={pageDef?.msg||null}
                        theme={currentTheme}
                        isOwn={pageDef?.msg&&myMsgIds.includes(pageDef.msg.id)}
                        flipClass={flipClass}
                        canEdit={canEditMsg(pageDef?.msg)}
                        editing={!!pageDef?.msg && editingMsgId===pageDef.msg.id}
                        draft={editDraft}
                        saving={savingEdit}
                        onDraftChange={(patch)=>setEditDraft(d=>({...d,...patch}))}
                        onStartEdit={()=>startEdit(pageDef?.msg)}
                        onSaveEdit={saveEdit}
                        onCancelEdit={cancelEdit}
                      />
                }
                {!showingCover && pageDef?.type === 'blank' && (
                  <div style={{position:'absolute',inset:0,zIndex:5,pointerEvents:'none'}}>
                    {inlineCompose ? (
                      /* Direct-on-page notebook compose */
                      <div style={{position:'absolute',inset:0,pointerEvents:'auto',display:'flex',flexDirection:'column',padding:'22px 24px 20px 60px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                          <span style={{width:9,height:9,borderRadius:'50%',background:accentC,opacity:0.7}}/>
                          <span style={{fontFamily:"'Kalam',cursive",fontSize:13,color:accentC,fontWeight:700}}>Your page — write freely</span>
                        </div>
                        <textarea
                          ref={textareaRef}
                          autoFocus
                          className="album-inline-input"
                          value={form.content}
                          onChange={e=>setForm(p=>({...p,content:e.target.value}))}
                          placeholder="Dear friend…"
                          style={{flex:1,fontFamily:getFontStyle(form.font_style).family,fontSize:22,color:form.font_color,lineHeight:'34px',minHeight:150}}
                        />
                        <div style={{borderTop:`1px dashed ${accentC}33`,paddingTop:10,marginTop:6}}>
                          <span style={{fontFamily:"'Kalam',cursive",fontSize:12,color:accentC,opacity:0.7}}>with love,</span>
                          <input
                            className="album-inline-input"
                            value={form.author_name}
                            onChange={e=>setForm(p=>({...p,author_name:e.target.value}))}
                            placeholder="your name"
                            style={{fontFamily:"'Dancing Script',cursive",fontWeight:700,fontSize:24,color:accentC,marginTop:2}}
                          />
                        </div>
                        <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
                          <button type="button" onClick={handleSubmit} disabled={submitting}
                            style={{flex:'1 1 auto',background:'linear-gradient(135deg,#7C3AED,#5B21B6)',color:'#fff',border:'none',borderRadius:12,padding:'11px 16px',fontWeight:800,fontSize:14,cursor:'pointer',boxShadow:'0 4px 16px rgba(124,58,237,0.35)'}}>
                            {submitting ? 'Signing…' : (card.is_gift_enabled ? 'Sign & add gift →' : 'Add to card ✓')}
                          </button>
                          <button type="button" onClick={()=>fileInputRef.current?.click()} title="Add photo"
                            style={{width:44,height:44,borderRadius:12,border:`1.5px solid ${accentC}44`,background:'#fff',cursor:'pointer',fontSize:17}}>🖼️</button>
                          <button type="button" onClick={()=>setShowGif(s=>!s)} title="Add GIF"
                            style={{width:44,height:44,borderRadius:12,border:`1.5px solid ${accentC}44`,background:'#fff',cursor:'pointer',fontWeight:800,fontSize:11,color:accentC}}>GIF</button>
                          <button type="button" onClick={()=>setInlineCompose(false)}
                            style={{width:44,height:44,borderRadius:12,border:'1px solid #E5E7EB',background:'#fff',cursor:'pointer',color:'#9CA3AF'}}>✕</button>
                        </div>
                        {mediaFiles.length>0 && (
                          <p style={{fontSize:11,color:accentC,fontWeight:700,marginTop:8}}>{mediaFiles.length} attachment{mediaFiles.length>1?'s':''} ready ✓</p>
                        )}
                      </div>
                    ) : (
                      <>
                        <button type="button" onClick={()=>setInlineCompose(true)}
                          style={{position:'absolute',top:24,left:60,right:24,bottom:150,pointerEvents:'auto',border:'2px dashed rgba(124,58,237,0.32)',background:'rgba(255,255,255,0.35)',borderRadius:14,fontWeight:800,fontSize:16,color:accentC,cursor:'text',fontFamily:"'Caveat',cursive",display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8}}>
                          <Icon name="PenLine" size={26}/>
                          <span style={{fontSize:20}}>Tap to write your message right here</span>
                        </button>
                        <div style={{position:'absolute',left:60,right:24,bottom:64,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,pointerEvents:'auto'}}>
                          <button type="button" onClick={()=>openEditorFor('media')} style={{border:'2px dashed rgba(124,58,237,0.45)',background:'rgba(255,255,255,0.72)',borderRadius:12,padding:'9px',fontWeight:800,color:accentC,cursor:'pointer'}}>
                            Add photo / video
                          </button>
                          <button type="button" onClick={()=>openEditorFor('gif')} style={{border:'2px dashed rgba(124,58,237,0.45)',background:'rgba(255,255,255,0.72)',borderRadius:12,padding:'9px',fontWeight:800,color:accentC,cursor:'pointer'}}>
                            Add GIF
                          </button>
                        </div>
                        <div style={{position:'absolute',left:60,right:24,bottom:18,display:'flex',justifyContent:'space-between',gap:10,pointerEvents:'auto'}}>
                          <button type="button" onClick={()=>openEditorFor('voice')} style={{flex:1,border:'2px dashed rgba(124,58,237,0.35)',background:'rgba(255,255,255,0.72)',borderRadius:999,padding:'9px 12px',fontWeight:800,color:accentC,cursor:'pointer'}}>
                            Add voice note
                          </button>
                          {card.is_gift_enabled && (
                            <button type="button" onClick={()=>openEditorFor('gift')} style={{flex:1,border:'2px dashed rgba(245,158,11,0.65)',background:'rgba(254,243,199,0.86)',borderRadius:999,padding:'9px 12px',fontWeight:800,color:'#92400E',cursor:'pointer'}}>
                              Add gift
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

          {/* ── Page navigation ── */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginTop:22,flexWrap:'wrap'}}>
            <button onClick={goPrev} disabled={clampedPage===0}
              style={{width:48,height:48,borderRadius:'50%',background:showingCover?(design?.accent||'#7C3AED')+'22':'#fff',border:`2px solid ${accentC}44`,display:'flex',alignItems:'center',justifyContent:'center',cursor:clampedPage===0?'not-allowed':'pointer',opacity:clampedPage===0?0.3:1,color:accentC,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
              <Icon name="ChevronLeft" size={22}/>
            </button>

            {/* Page dots */}
            <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',justifyContent:'center',maxWidth:300}}>
              {pageList.map((_,i)=>(
                <button key={i} onClick={()=>flipTo(i,i>clampedPage?'forward':'back')}
                  style={{width:i===clampedPage?22:8,height:8,borderRadius:4,background:i===clampedPage?accentC:accentC+'44',border:'none',cursor:'pointer',padding:0,transition:'all 0.2s'}}
                  title={i===0?'Cover':`Page ${i}`}/>
              ))}
            </div>

            <button onClick={goNext} disabled={clampedPage>=totalPages-1}
              style={{width:48,height:48,borderRadius:'50%',background:'#fff',border:`2px solid ${accentC}44`,display:'flex',alignItems:'center',justifyContent:'center',cursor:clampedPage>=totalPages-1?'not-allowed':'pointer',opacity:clampedPage>=totalPages-1?0.3:1,color:accentC,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
              <Icon name="ChevronRight" size={22}/>
            </button>
          </div>

          {/* Page label */}
          <p style={{textAlign:'center',fontFamily:"'Caveat',cursive",fontSize:14,color:showingCover?(design?.accent||'#7C3AED')+'88':accentC+'88',marginTop:10}}>
            {showingCover?'Cover — flip to see messages →':`${clampedPage} of ${totalPages-1}`}
          </p>
        </div>

        {/* ── Sidebar ── */}
        <div className="hidden md:block" style={{paddingLeft:24}}>
          <SidebarContent card={card} slug={slug} myMsgIds={myMsgIds}
            signaturesOpen={signaturesOpen} setSignaturesOpen={setSignaturesOpen}
            allSignersOpen={allSignersOpen} setAllSignersOpen={setAllSignersOpen}
              onContribute={()=>openEditorFor('gift')}
            selectedAmount={selectedAmount} setSelectedAmount={setSelectedAmount}
            customAmount={customAmount} setCustomAmount={setCustomAmount}
            showHelp={showHelp} setShowHelp={setShowHelp}
            isDark={isDark&&!showingCover} accent={accentC}/>
        </div>
      </div>

      {/* Mobile sidebar */}
      {mobileSidebar&&(
        <div style={{position:'fixed',inset:0,zIndex:60,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(4px)'}} onClick={()=>setMobileSidebar(false)}>
          <div style={{position:'absolute',right:0,top:0,bottom:0,width:300,background:'#fff',padding:20,overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setMobileSidebar(false)} style={{float:'right',background:'none',border:'none',cursor:'pointer',fontSize:20,color:'#6B7280'}}>✕</button>
            <SidebarContent card={card} slug={slug} myMsgIds={myMsgIds}
              signaturesOpen={signaturesOpen} setSignaturesOpen={setSignaturesOpen}
              allSignersOpen={allSignersOpen} setAllSignersOpen={setAllSignersOpen}
                onContribute={()=>{setMobileSidebar(false);openEditorFor('gift');}}
              selectedAmount={selectedAmount} setSelectedAmount={setSelectedAmount}
              customAmount={customAmount} setCustomAmount={setCustomAmount}
              showHelp={showHelp} setShowHelp={setShowHelp}
              isDark={false} accent={accentC}/>
          </div>
        </div>
      )}

      {/* ── Editor modal ── */}
      {showEditor&&(
        <div style={{position:'fixed',inset:0,zIndex:80,background:'rgba(26,16,53,0.72)',backdropFilter:'blur(6px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>{setShowEditor(false);setShowEmoji(false);setShowGif(false);}}>
          <div style={{background:'#fff',borderRadius:'28px 28px 0 0',width:'100%',maxWidth:580,maxHeight:'92vh',overflowY:'auto',padding:'28px 24px 36px',boxShadow:'0 -8px 60px rgba(0,0,0,0.2)'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
              <div>
                <h3 style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:800,fontSize:20,color:'#1A1035',margin:0}}>Add your message ✍️</h3>
                <p style={{fontSize:13,color:'#9CA3AF',margin:'3px 0 0'}}>to {card.recipient_name}'s card — your own page</p>
              </div>
              <button onClick={()=>setShowEditor(false)} style={{background:'#F5F0FF',border:'none',width:36,height:36,borderRadius:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Icon name="X" size={16} className="text-warm-500"/>
              </button>
            </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:18}}>
                {[
                  { label:'Message', action:'message' },
                  { label:'Photo/video', action:'media' },
                  { label:'GIF', action:'gif' },
                  { label:'Voice note', action:'voice' },
                  ...(card.is_gift_enabled ? [{ label:'Gift', action:'gift' }] : []),
                ].map(item => (
                  <button key={item.action} type="button" onClick={()=>openEditorFor(item.action)}
                    style={{border:'1.5px solid #EDE9FE',background:'#F8F5FF',borderRadius:14,padding:'10px 8px',fontSize:12,fontWeight:800,color:'#5B21B6',cursor:'pointer'}}>
                    {item.label}
                  </button>
                ))}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:18}}>
              <div><label className="auth-label">Your name *</label><input className="input" placeholder="Your name" value={form.author_name} onChange={e=>setForm(p=>({...p,author_name:e.target.value}))}/></div>
              <div><label className="auth-label">Email *</label><input type="email" className="input" placeholder="you@email.com" value={form.author_email} onChange={e=>setForm(p=>({...p,author_email:e.target.value}))}/></div>
            </div>

            <label className="auth-label">Writing style</label>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
              {FONT_STYLES.map(fs=>(
                <button key={fs.id} type="button" onClick={()=>setForm(p=>({...p,font_style:fs.id}))}
                  style={{padding:'6px 12px',borderRadius:20,border:`2px solid ${form.font_style===fs.id?'#7C3AED':'#DDD6FE'}`,background:form.font_style===fs.id?'#EDE9FE':'#fff',fontFamily:fs.family,fontSize:13,fontWeight:600,cursor:'pointer',color:form.font_style===fs.id?'#5B21B6':'#6B7280'}}>
                  {fs.name}
                </button>
              ))}
            </div>

            <label className="auth-label">Message colour</label>
            <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
              {FONT_COLORS.map(c=>(
                <button key={c} onClick={()=>setForm(p=>({...p,font_color:c}))} type="button"
                  style={{width:28,height:28,borderRadius:'50%',background:c,border:`3px solid ${form.font_color===c?'#1A1035':'transparent'}`,cursor:'pointer',flexShrink:0,boxShadow:form.font_color===c?'0 0 0 1px #1A1035':'none'}}/>
              ))}
            </div>

            <label className="auth-label">Your message to {card.recipient_name} *</label>
            <div style={{position:'relative',marginBottom:4}}>
              <textarea ref={textareaRef} className="input" rows={5}
                style={{fontFamily:getFontStyle(form.font_style)?.family||'inherit',color:form.font_color||'#1E40AF',fontSize:form.font_size||18,resize:'none'}}
                placeholder={`Write something beautiful for ${card.recipient_name}…`}
                maxLength={1200} value={form.content} onChange={e=>setForm(p=>({...p,content:e.target.value}))}/>
              <button type="button" onClick={()=>{setShowEmoji(s=>!s);setShowGif(false);}}
                style={{position:'absolute',bottom:8,right:8,width:34,height:34,border:'1.5px solid #EDE9FE',background:'#fff',borderRadius:'50%',cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center'}}>😊</button>
              {showEmoji&&<EmojiPicker onSelect={insertEmoji} onClose={()=>setShowEmoji(false)}/>}
              </div>
              <p style={{fontSize:11,color:'#9CA3AF',textAlign:'right',marginBottom:14}}>{form.content.length}/1200</p>

              <div id="album-voice-tools" style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:14}}>
                <VoiceRecorder onRecorded={f=>addMedia([f])} disabled={submitting}/>
                <button type="button" onClick={()=>fileInputRef.current?.click()}
                  style={{border:'1.5px solid #EDE9FE',background:'#fff',borderRadius:999,padding:'9px 13px',fontSize:12,fontWeight:800,color:'#5B21B6',cursor:'pointer'}}>
                  Add photo/video
                </button>
                <button type="button" onClick={()=>setShowGif(s=>!s)}
                  style={{border:'1.5px solid #EDE9FE',background:'#fff',borderRadius:999,padding:'9px 13px',fontSize:12,fontWeight:800,color:'#5B21B6',cursor:'pointer'}}>
                  Add GIF
                </button>
              </div>

              {showGif&&<GifPicker onSelect={f=>{addMedia([f]);setShowGif(false);}} onClose={()=>setShowGif(false)}/>}

            {mediaFiles.length>0&&(
              <div style={{marginBottom:18,border:'1.5px solid #EDE9FE',borderRadius:16,overflow:'hidden'}}>
                <div style={{position:'relative',aspectRatio:'16/9',background:'#1A1035'}}>
                  {mediaFiles[carouselIdx].type==='video'?<video src={mediaFiles[carouselIdx].preview} className="w-full h-full object-contain" controls/>:mediaFiles[carouselIdx].type==='voice'?<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:8}}><span style={{fontSize:40}}>🎙️</span><audio src={mediaFiles[carouselIdx].preview} controls style={{width:'80%'}}/></div>:<img src={mediaFiles[carouselIdx].preview} alt="" style={{width:'100%',height:'100%',objectFit:'contain'}}/>}
                  <button onClick={()=>removeMedia(carouselIdx)} style={{position:'absolute',top:6,right:6,width:26,height:26,borderRadius:'50%',background:'rgba(0,0,0,0.6)',color:'#fff',border:'none',cursor:'pointer',fontSize:14}}>✕</button>
                </div>
                {mediaFiles.length>1&&<p style={{textAlign:'center',fontSize:11,color:'#9CA3AF',padding:'6px 0'}}>{carouselIdx+1} of {mediaFiles.length}</p>}
              </div>
            )}

            {card.is_gift_enabled&&(
                <div id="album-gift-section" style={{background:'linear-gradient(135deg,#FFF7ED,#FEF3C7)',border:'1.5px solid #FDE68A',borderRadius:18,padding:'16px 18px',marginBottom:18}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                  <span style={{fontSize:22}}>🎁</span>
                  <div>
                    <p style={{fontWeight:800,fontSize:15,color:'#92400E',margin:0}}>Add a gift to your message</p>
                    {card.total_collected>0&&!card.hide_amounts&&<p style={{fontSize:12,color:'#059669',fontWeight:700,margin:'2px 0 0'}}>Gift pot so far: {formatNGN(card.total_collected)} 🎉</p>}
                  </div>
                </div>

                {/* Gift mode toggle */}
                <div style={{display:'flex',gap:8,marginBottom:14}}>
                  <button type="button" onClick={()=>setGiftMode('money')}
                    style={{flex:1,padding:'9px 4px',borderRadius:12,fontWeight:700,fontSize:13,cursor:'pointer',
                      border:`2px solid ${giftMode==='money'?'#7C3AED':'#FDE68A'}`,
                      background:giftMode==='money'?'#EDE9FE':'#fff',
                      color:giftMode==='money'?'#5B21B6':'#92400E'}}>
                    💳 Money Gift
                  </button>
                  <button type="button" onClick={()=>{setGiftMode('product');if(!vendors.length)loadVendors();}}
                    style={{flex:1,padding:'9px 4px',borderRadius:12,fontWeight:700,fontSize:13,cursor:'pointer',
                      border:`2px solid ${giftMode==='product'?'#EC4899':'#FDE68A'}`,
                      background:giftMode==='product'?'#FDF2F8':'#fff',
                      color:giftMode==='product'?'#9D174D':'#92400E'}}>
                    🎁 Send a Gift
                  </button>
                </div>

                {/* Money gift */}
                {giftMode==='money'&&(
                  <>
                    <button type="button" onClick={()=>{setSelectedAmount(null);setCustomAmount('');}}
                      style={{width:'100%',marginBottom:8,padding:8,borderRadius:10,border:`2px solid ${!selectedAmount&&!customAmount?'#92400E':'#FDE68A'}`,background:!selectedAmount&&!customAmount?'#92400E':'#fff',color:!selectedAmount&&!customAmount?'#fff':'#92400E',fontWeight:700,fontSize:13,cursor:'pointer'}}>
                      No gift this time
                    </button>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:8}}>
                      {AMOUNTS_NGN.map(a=>(
                        <button key={a} type="button" onClick={()=>{setSelectedAmount(a);setCustomAmount('');}}
                          style={{padding:'8px 4px',borderRadius:10,border:`2px solid ${selectedAmount===a&&!customAmount?'#F59E0B':'#FDE68A'}`,background:selectedAmount===a&&!customAmount?'#F59E0B':'#fff',color:selectedAmount===a&&!customAmount?'#fff':'#92400E',fontWeight:700,fontSize:12,cursor:'pointer'}}>
                          {formatNGN(a)}
                        </button>
                      ))}
                    </div>
                    <input type="number" min={2500} className="input" placeholder="Custom amount (NGN)"
                      value={customAmount} onChange={e=>{setCustomAmount(e.target.value);setSelectedAmount(null);}} style={{fontSize:14}}/>
                  </>
                )}

                {/* Product gift vendor picker */}
                {giftMode==='product'&&(
                  <div style={{background:'rgba(255,255,255,0.7)',borderRadius:12,padding:'12px',border:'1.5px solid #FBCFE8'}}>
                    <p style={{fontSize:12,fontWeight:700,color:'#9D174D',marginBottom:10}}>Choose a gift from a vendor near the recipient</p>
                    <div style={{display:'flex',gap:6,marginBottom:10}}>
                      <select value={vendorFilter.country}
                        onChange={e=>{setVendorFilter(p=>({...p,country:e.target.value}));loadVendors(e.target.value,vendorFilter.category);}}
                        className="input" style={{flex:1,fontSize:12,padding:'6px 8px'}}>
                        <option value="">All countries</option>
                        {['Nigeria','Ghana','Kenya','South Africa','UK','USA','Canada'].map(c=><option key={c}>{c}</option>)}
                      </select>
                      <select value={vendorFilter.category}
                        onChange={e=>{setVendorFilter(p=>({...p,category:e.target.value}));loadVendors(vendorFilter.country,e.target.value);}}
                        className="input" style={{flex:1,fontSize:12,padding:'6px 8px'}}>
                        <option value="">All types</option>
                        {['cakes','flowers','chocolates','jewellery','hampers','balloons'].map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    {vendors.length===0
                      ?<p style={{fontSize:12,color:'#9CA3AF',textAlign:'center',padding:'8px 0'}}>No vendors found. Try a different filter.</p>
                      :<div style={{maxHeight:150,overflowY:'auto',display:'flex',flexDirection:'column',gap:6}}>
                        {vendors.map(v=>(
                          <button key={v.id} type="button"
                            onClick={()=>{setSelectedVendor(v);setVendorProducts([]);setSelectedProduct(null);
                              fetch(`${import.meta.env.VITE_API_URL||'/api'}/vendor/store/${v.slug}`).then(r=>r.json()).then(d=>setVendorProducts(d.products||[]));}}
                            style={{textAlign:'left',padding:'8px 10px',borderRadius:10,border:`2px solid ${selectedVendor?.id===v.id?'#EC4899':'transparent'}`,background:selectedVendor?.id===v.id?'#FDF2F8':'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
                            {v.logo_url?<img src={v.logo_url} style={{width:28,height:28,borderRadius:6,objectFit:'cover'}}/>:<div style={{width:28,height:28,borderRadius:6,background:'#FCE7F3',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>🎁</div>}
                            <div>
                              <p style={{fontSize:13,fontWeight:700,color:'#1A1035',margin:0}}>{v.business_name}</p>
                              <p style={{fontSize:10,color:'#9CA3AF',margin:0,textTransform:'capitalize'}}>{v.category} · {v.country||'International'}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    }
                    {selectedVendor&&vendorProducts.length>0&&(
                      <div style={{marginTop:10,borderTop:'1px solid #FBCFE8',paddingTop:10,maxHeight:130,overflowY:'auto',display:'flex',flexDirection:'column',gap:5}}>
                        <p style={{fontSize:11,fontWeight:700,color:'#9D174D',marginBottom:4}}>Products from {selectedVendor.business_name}</p>
                        {vendorProducts.map(p=>(
                          <button key={p.id} type="button"
                            onClick={()=>{setSelectedProduct(p);setProductImgIdx(0);}}
                            style={{textAlign:'left',padding:'7px 10px',borderRadius:10,border:`2px solid ${selectedProduct?.id===p.id?'#EC4899':'transparent'}`,background:selectedProduct?.id===p.id?'#FDF2F8':'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
                            {p.images?.[0]&&<img src={p.images[0]} style={{width:32,height:32,borderRadius:6,objectFit:'cover'}}/>}
                            <div style={{flex:1}}><p style={{fontSize:12,fontWeight:600,color:'#1A1035',margin:0}}>{p.name}</p><p style={{fontSize:11,fontWeight:800,color:'#EC4899',margin:0}}>{formatNGN(p.price)}</p></div>
                            {selectedProduct?.id===p.id&&<span style={{color:'#EC4899',fontWeight:900}}>✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedProduct?.images?.length>0&&(
                      <div style={{marginTop:10,borderTop:'1px solid #FBCFE8',paddingTop:10,textAlign:'center'}}>
                        <div style={{position:'relative',width:100,height:100,margin:'0 auto',borderRadius:12,overflow:'hidden',background:'#fff'}}>
                          <img src={selectedProduct.images[productImgIdx%selectedProduct.images.length]} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={selectedProduct.name}/>
                          {selectedProduct.images.length>1&&(
                            <>
                              <button type="button" onClick={()=>setProductImgIdx(i=>(i-1+selectedProduct.images.length)%selectedProduct.images.length)}
                                style={{position:'absolute',left:2,top:'50%',transform:'translateY(-50%)',width:20,height:20,borderRadius:'50%',background:'rgba(0,0,0,0.45)',color:'#fff',border:'none',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
                              <button type="button" onClick={()=>setProductImgIdx(i=>(i+1)%selectedProduct.images.length)}
                                style={{position:'absolute',right:2,top:'50%',transform:'translateY(-50%)',width:20,height:20,borderRadius:'50%',background:'rgba(0,0,0,0.45)',color:'#fff',border:'none',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
                            </>
                          )}
                        </div>
                        <p style={{fontSize:10,fontWeight:700,color:'#9D174D',marginTop:5}}>{selectedProduct.name} — {formatNGN(selectedProduct.price)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {card.allow_private_messages&&(
              <label style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,cursor:'pointer'}}>
                <input type="checkbox" checked={form.is_private} onChange={e=>setForm(p=>({...p,is_private:e.target.checked}))} style={{width:18,height:18,accentColor:'#7C3AED'}}/>
                <span style={{fontSize:14,color:'#374151',fontWeight:600}}>Private (only celebrant sees this)</span>
              </label>
            )}

            {card.is_gift_enabled&&giftMode==='product'
              ? <button onClick={handleProductGift} disabled={productSubmitting||!selectedProduct}
                  style={{width:'100%',padding:16,borderRadius:22,border:'none',background:'linear-gradient(135deg,#EC4899,#DB2777)',color:'#fff',fontWeight:800,fontSize:16,cursor:(productSubmitting||!selectedProduct)?'not-allowed':'pointer',opacity:(productSubmitting||!selectedProduct)?0.65:1,boxShadow:(productSubmitting||!selectedProduct)?'none':'0 4px 20px rgba(236,72,153,0.4)'}}>
                  {productSubmitting
                    ?<span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><span style={{width:18,height:18,border:'3px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'albumSpin 0.8s linear infinite'}}/>Processing...</span>
                    :selectedProduct?`🎁 Sign + send ${selectedProduct.name} (${formatNGN(selectedProduct.price)})`:'🎁 Sign + Send Gift'
                  }
                </button>
              : <button onClick={handleSubmit} disabled={submitting}
                  style={{width:'100%',padding:16,borderRadius:22,border:'none',background:'linear-gradient(135deg,#7C3AED,#5B21B6)',color:'#fff',fontWeight:800,fontSize:16,cursor:submitting?'not-allowed':'pointer',opacity:submitting?0.7:1,boxShadow:submitting?'none':'0 4px 20px rgba(124,58,237,0.4)'}}>
                  {submitting
                    ?<span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><span style={{width:18,height:18,border:'3px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'albumSpin 0.8s linear infinite'}}/>{stage==='paying'?'Opening payment…':stage==='sending'?'Adding to card…':'Please wait…'}</span>
                    :(()=>{const amt=Number(customAmount||selectedAmount||0);return card.is_gift_enabled&&amt>=2500?`✍️ Sign card + send ${formatNGN(amt)} gift`:'✍️ Sign the card';})()
                  }
                </button>
            }
            <p style={{textAlign:'center',fontSize:11,color:'#9CA3AF',marginTop:8}}>Secured by Flutterwave · Message private until delivery</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const SidebarContent = ({card,slug,myMsgIds,signaturesOpen,setSignaturesOpen,allSignersOpen,setAllSignersOpen,onContribute,selectedAmount,setSelectedAmount,customAmount,setCustomAmount,showHelp,setShowHelp,isDark,accent})=>{
  const bg=isDark?'#1a1535':'#fff';
  const border=isDark?'rgba(255,255,255,0.1)':'#EDE9FE';
  const text=isDark?'#E9D5FF':'#1A1035';
  const sub=isDark?'#A78BFA':'#9CA3AF';
  const panel={background:bg,borderRadius:18,border:`1.5px solid ${border}`,overflow:'hidden',marginBottom:12};
  const head={display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderBottom:`1.5px solid ${isDark?'rgba(255,255,255,0.06)':'#F5F0FF'}`,cursor:'pointer'};
  const allMessages=(card?.messages||[]).filter(Boolean);
  const myMessages=allMessages.filter(m=>myMsgIds.includes(m.id));
  // Other signers = not mine and not private
  const otherMessages=allMessages.filter(m=>!myMsgIds.includes(m.id)&&!m.is_private);
  return(
    <div>
      <div style={panel}>
        <div style={head} onClick={()=>setSignaturesOpen(s=>!s)}>
          <p style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:15,color:text,margin:0,display:'flex',alignItems:'center',gap:6}}>
            <Icon name="MessageSquare" size={15} style={{color:accent}}/> My signatures
          </p>
          <Icon name={signaturesOpen?'ChevronUp':'ChevronDown'} size={15} style={{color:sub}}/>
        </div>
        {signaturesOpen&&(
          <div style={{padding:'12px 16px'}}>
            {myMessages.length===0
              ?<p style={{fontSize:13,color:sub,lineHeight:1.5}}>You haven't signed yet — click <strong style={{color:accent}}>Sign this card</strong> to add your page.</p>
              :myMessages.map(m=>(
                <div key={m.id} style={{padding:'8px 0',borderBottom:`1px solid ${isDark?'rgba(255,255,255,0.06)':'#F5F0FF'}`}}>
                  <p style={{fontFamily:"'Caveat',cursive",fontSize:15,color:accent,margin:0}}>{m.content}</p>
                  <p style={{fontSize:11,color:sub,margin:'2px 0 0'}}>— {m.author_name}</p>
                </div>
              ))
            }
          </div>
        )}
      </div>

      {/* ── All other signers' messages (public only) ── */}
      {otherMessages.length>0&&(
        <div style={panel}>
          <div style={head} onClick={()=>setAllSignersOpen(s=>!s)}>
            <p style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:15,color:text,margin:0,display:'flex',alignItems:'center',gap:6}}>
              <Icon name="Users" size={15} style={{color:accent}}/> From others ({otherMessages.length})
            </p>
            <Icon name={allSignersOpen?'ChevronUp':'ChevronDown'} size={15} style={{color:sub}}/>
          </div>
          {allSignersOpen&&(
            <div style={{padding:'12px 16px',maxHeight:260,overflowY:'auto'}}>
              {otherMessages.map(m=>(
                <div key={m.id} style={{padding:'9px 0',borderBottom:`1px solid ${isDark?'rgba(255,255,255,0.06)':'#F5F0FF'}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
                    <div style={{width:24,height:24,borderRadius:'50%',background:accent,color:'#fff',fontSize:9,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      {m.author_name?.slice(0,2).toUpperCase()||'??'}
                    </div>
                    <span style={{fontWeight:700,fontSize:12,color:text}}>{m.author_name}</span>
                    {m.contributed_amount>0&&(
                      <span style={{fontSize:10,fontWeight:800,color:'#92400E',background:'#FEF3C7',padding:'1px 6px',borderRadius:10,marginLeft:'auto'}}>🎁 {formatNGN(m.contributed_amount)}</span>
                    )}
                  </div>
                  {m.media_url&&(m.media_type==='image'||m.media_type==='gif')&&(
                    <img src={m.media_url} alt="" style={{width:'100%',height:80,objectFit:'cover',borderRadius:8,marginBottom:5}}/>
                  )}
                  <p style={{fontFamily:"'Caveat',cursive",fontSize:14,color:isDark?'#E9D5FF':'#374151',margin:0,lineHeight:1.45,wordBreak:'break-word'}}>
                    {m.content&&m.content.length>120?m.content.slice(0,120)+'…':m.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {card.is_gift_enabled&&(
        <div style={{...panel,padding:18,textAlign:'center'}}>
          <div style={{width:68,height:68,background:'linear-gradient(135deg,#FBBF24,#F59E0B)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',fontSize:32,boxShadow:'0 4px 16px rgba(245,158,11,0.35)'}}>🎁</div>
          <p style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:800,fontSize:16,color:text,margin:'0 0 4px'}}>Gift Collection Pot</p>
          {card.total_collected>0&&!card.hide_amounts&&<p style={{fontSize:24,fontWeight:800,color:'#F59E0B',margin:'0 0 4px'}}>{formatNGN(card.total_collected)}</p>}
          {(card.signed_count||0)>0&&<p style={{fontSize:12,color:sub,margin:'0 0 14px'}}>{card.signed_count} people have signed</p>}
          <button onClick={onContribute} style={{width:'100%',padding:11,borderRadius:14,background:'linear-gradient(135deg,#F59E0B,#D97706)',color:'#fff',border:'none',fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:14,cursor:'pointer',boxShadow:'0 3px 12px rgba(245,158,11,0.35)'}}>
            🎁 Contribute a gift
          </button>
        </div>
      )}
      <button onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/sign/${slug}`);toast.success('Signing link copied!');}}
        style={{...panel,padding:'13px 16px',width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:14,color:accent,cursor:'pointer'}}>
        <Icon name="Share" size={15} style={{color:accent}}/> Copy signing link
      </button>
      <div style={panel}>
        <button onClick={()=>setShowHelp(s=>!s)} style={{...head,width:'100%',background:'none',border:'none',cursor:'pointer'}}>
          <p style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:15,color:text,margin:0,display:'flex',alignItems:'center',gap:6}}>
            <Icon name="HelpCircle" size={15} style={{color:sub}}/> How to sign
          </p>
          <Icon name={showHelp?'ChevronUp':'ChevronDown'} size={15} style={{color:sub}}/>
        </button>
        {showHelp&&(
          <div style={{padding:'12px 16px',fontSize:13,color:sub,lineHeight:1.65}}>
            <p style={{margin:'0 0 5px'}}>1. Click <strong style={{color:accent}}>Sign this card</strong></p>
            <p style={{margin:'0 0 5px'}}>2. Type your message, pick a font and colour</p>
            <p style={{margin:'0 0 5px'}}>3. Optionally add a photo, GIF or voice note</p>
            <p style={{margin:'0 0 5px'}}>4. Optionally contribute to the gift pot</p>
            <p style={{margin:0}}>5. Click <strong style={{color:accent}}>Sign the card</strong> — done! 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlbumSign;
