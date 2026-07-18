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

// Auto-assign font by signer position so every page looks different without
// asking the signer to choose. Cycles through all 5 styles — signer 1 gets
// elegant, signer 2 gets calligraphy, etc. The card looks deliberately varied.
const FONT_STYLE_IDS = FONT_STYLES.map(f => f.id);
const autoFontForPosition = (pos) => FONT_STYLE_IDS[pos % FONT_STYLE_IDS.length];
import { getAlbumTheme, getContrastTextColor } from '../utils/albumThemes';
import CardCoverPreview from '../components/CardCoverPreview';
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

const TAPE_COLORS = ['#F59E0B','#EC4899','#8B5CF6','#10B981','#3B82F6','#EF4444'];

const defaultPosition = i => ({
  x:   8  + (i % 2) * 44 + ((i * 7)  % 14),
  y:   10 + Math.floor(i / 2) * 36 + ((i * 11) % 12),
  rot: [-5,2,-3,4,-1,5,-2,3][i % 8],
});

// ─── Anonymous-signer edit tokens (localStorage) ────────────────────────────
// Ownership of a message is proven by an opaque token issued when the signer
// creates it — never by email, which is visible to anyone viewing the card.
const EDIT_TOKENS_KEY = 'thankeeu_msg_edit_tokens';
const getStoredEditTokens = () => {
  try { return JSON.parse(localStorage.getItem(EDIT_TOKENS_KEY) || '{}'); }
  catch { return {}; }
};
const storeEditToken = (messageId, token) => {
  if (!messageId || !token) return;
  try {
    const all = getStoredEditTokens();
    all[messageId] = token;
    localStorage.setItem(EDIT_TOKENS_KEY, JSON.stringify(all));
  } catch { /* localStorage unavailable — edit-after-refresh just won't be offered */ }
};
const getEditToken = (messageId) => getStoredEditTokens()[messageId] || null;

// ─── CSS injected once ───────────────────────────────────────────────────────
const ALBUM_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Dancing+Script:wght@600;700&family=Caveat:wght@400;500;600;700&family=Kalam:wght@300;400;700&display=swap');
@keyframes albumSpin { to { transform: rotate(360deg); } }
@keyframes albumPop  { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
@keyframes album-leaf-forward { 0% { opacity:.2; transform:rotateY(-96deg) skewY(-1.5deg); filter:brightness(.72); } 58% { opacity:1; transform:rotateY(8deg) skewY(.3deg); } 100% { transform:rotateY(0); filter:brightness(1); } }
@keyframes album-leaf-back { 0% { opacity:.2; transform:rotateY(96deg) skewY(1.5deg); filter:brightness(.72); } 58% { opacity:1; transform:rotateY(-8deg) skewY(-.3deg); } 100% { transform:rotateY(0); filter:brightness(1); } }
/* Primary classes — used by the sign page */
.album-flip-forward { animation:album-leaf-forward .6s cubic-bezier(.2,.72,.15,1) both; transform-origin:left center; transform-style:preserve-3d; backface-visibility:hidden; will-change:transform; }
.album-flip-back    { animation:album-leaf-back    .6s cubic-bezier(.2,.72,.15,1) both; transform-origin:right center; transform-style:preserve-3d; backface-visibility:hidden; will-change:transform; }
/* Aliases matching AlbumStudioPreview's class names — identical animation */
.album-page-turn.forward { animation:album-leaf-forward .6s cubic-bezier(.2,.72,.15,1) both; transform-origin:left center; transform-style:preserve-3d; backface-visibility:hidden; will-change:transform; }
.album-page-turn.back    { animation:album-leaf-back    .6s cubic-bezier(.2,.72,.15,1) both; transform-origin:right center; transform-style:preserve-3d; backface-visibility:hidden; will-change:transform; }
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
@media(max-width:560px){
  .album-page{ width:100% !important; max-width:94vw !important; height:auto !important; min-height:520px !important; aspect-ratio:5/6; }
  .album-page::before{ width:22px; }
}
`;

// ─── Cover Page ──────────────────────────────────────────────────────────────
const CoverPage = ({ card, design, flipClass }) => {
  const customCoverUrl = typeof card.background_color === 'string' && /^https?:\/\//.test(card.background_color)
    ? card.background_color
    : null;
  const effectiveDesign = customCoverUrl
    ? { ...design, id:'custom_upload', image:customCoverUrl, artwork:null, background:'#1a1035', ink:'#ffffff', dark:true }
    : design;
  const coverTextColor = card.cover_text_color && card.cover_text_color !== 'auto'
    ? card.cover_text_color
    : getContrastTextColor(card.background_color, effectiveDesign);

  return (
    <div className={`album-page ${flipClass}`} style={{ position:'relative', width:424, maxWidth:'86vw' }}>
      <div style={{position:'absolute',left:'11%',top:10,width:'89%',height:'100%',borderRadius:8,background:'#fff',boxShadow:'0 18px 58px rgba(0,0,0,.2)'}}/>
      <div style={{position:'relative'}}>
        <CardCoverPreview
          design={effectiveDesign}
          occasionLabel={(card.occasion || '').replace(/_/g,' ')}
          recipientName={card.recipient_name}
          title={card.title}
          senderName={card.cover_sender}
          coverColor={card.background_color?.startsWith('#') ? card.background_color : undefined}
          textColor={coverTextColor}
          fontFamily={getFontStyle(card.font_style).family}
          layout={card.cover_layout}
        />
      </div>
    </div>
  );
};

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
      {msg.media_url&&msg.media_type==='video'&&(
        <button type="button" onClick={e=>{e.stopPropagation();window.open(msg.media_url,'_blank','noopener,noreferrer');}}
          style={{background:'#1A1035',padding:'4px 4px 24px',boxShadow:'0 2px 14px rgba(0,0,0,0.14)',borderRadius:3,transform:`rotate(${rot>0?-1.5:1.5}deg)`,marginBottom:5,display:'inline-flex',flexDirection:'column',alignItems:'center',position:'relative',width:116,border:0,cursor:'pointer'}}>
          <div style={{position:'absolute',top:-6,left:'50%',transform:'translateX(-50%)',width:34,height:12,background:tape+'BB',borderRadius:2}}/>
          <div style={{width:108,height:84,borderRadius:1,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff'}}>
            <Icon name="Play" size={22}/>
          </div>
          {msg.author_name&&<p style={{fontFamily:"'Caveat',cursive",fontSize:10,color:'#ccc',textAlign:'center',margin:'3px 0 0'}}>{msg.author_name} — tap to play</p>}
        </button>
      )}
      {msg.media_url&&(msg.media_type==='voice'||msg.media_type==='audio')&&(
        <button type="button" onClick={e=>{e.stopPropagation();new Audio(msg.media_url).play().catch(()=>window.open(msg.media_url,'_blank','noopener,noreferrer'));}}
          style={{background:'#fff',padding:'8px 10px',boxShadow:'0 2px 14px rgba(0,0,0,0.14)',borderRadius:3,transform:`rotate(${rot>0?-1.5:1.5}deg)`,marginBottom:5,display:'flex',alignItems:'center',gap:6,position:'relative',border:0,cursor:'pointer'}}>
          <div style={{position:'absolute',top:-6,left:'50%',transform:'translateX(-50%)',width:34,height:12,background:tape+'BB',borderRadius:2}}/>
          <Icon name="Mic" size={16} style={{color:theme?.accent||'#7C3AED'}}/>
          <span style={{fontFamily:"'Caveat',cursive",fontSize:11,color:'#555'}}>{msg.author_name?`${msg.author_name} — voice note`:'Voice note'}</span>
        </button>
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
const messageMediaItems = message => {
  const items = [];
  if (message?.media_url) items.push({ media_url: message.media_url, media_type: message.media_type || 'image' });
  if (message?.media_gallery) {
    try {
      const gallery = typeof message.media_gallery === 'string' ? JSON.parse(message.media_gallery) : message.media_gallery;
      if (Array.isArray(gallery)) gallery.forEach(item => {
        if (typeof item === 'string') items.push({ media_url: item, media_type: 'image' });
        else if (item?.media_url || item?.url) items.push({ media_url: item.media_url || item.url, media_type: item.media_type || item.type || 'image' });
      });
    } catch { /* Preserve rendering for older cards with malformed gallery JSON. */ }
  }
  return items.filter(item => item.media_url);
};

const SignerMediaCarousel = ({ message, accent, dark, onExpand }) => {
  const items = messageMediaItems(message);
  const [index, setIndex] = useState(0);
  const active = items[Math.min(index, Math.max(0, items.length - 1))];
  if (!active) return null;
  const type = active.media_type;
  const open = () => onExpand?.({ type: type === 'audio' ? 'voice' : type, src: active.media_url });
  return (
    <div style={{margin:'0 24px 10px 34px',borderRadius:12,overflow:'hidden',position:'relative',minHeight:type==='voice'||type==='audio'?84:185,background:dark?'rgba(255,255,255,.08)':'#f5f0ff',boxShadow:'0 6px 18px rgba(0,0,0,.14)',border:'4px solid rgba(255,255,255,.88)'}}>
      {type === 'video' ? <video src={active.media_url} controls style={{width:'100%',height:210,objectFit:'contain',display:'block',background:'#161025'}}/>
        : type === 'voice' || type === 'audio' ? <div style={{minHeight:84,display:'flex',alignItems:'center',gap:10,padding:'16px 18px',color:accent}}><Icon name="Mic" size={22}/><audio src={active.media_url} controls style={{width:'100%',height:36}}/></div>
        : <button type="button" onClick={open} style={{display:'block',width:'100%',padding:0,border:0,cursor:'zoom-in',background:'transparent'}}><img src={active.media_url} alt="Message attachment" style={{width:'100%',height:210,objectFit:'contain',display:'block'}}/></button>}
      <button type="button" onClick={open} aria-label="Open attachment larger" style={{position:'absolute',right:8,top:8,border:0,borderRadius:999,background:'rgba(17,24,39,.78)',color:'#fff',fontSize:9,fontWeight:800,padding:'6px 9px',cursor:'pointer'}}>Expand</button>
      {items.length > 1 && <div style={{position:'absolute',left:8,right:8,bottom:8,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
        <button type="button" onClick={()=>setIndex(i=>(i-1+items.length)%items.length)} aria-label="Previous attachment" style={{width:28,height:28,borderRadius:'50%',border:0,background:'rgba(17,24,39,.7)',color:'#fff',cursor:'pointer'}}>‹</button>
        <span style={{borderRadius:999,background:'rgba(17,24,39,.7)',color:'#fff',fontSize:9,fontWeight:800,padding:'5px 9px'}}>{index+1} of {items.length}</span>
        <button type="button" onClick={()=>setIndex(i=>(i+1)%items.length)} aria-label="Next attachment" style={{width:28,height:28,borderRadius:'50%',border:0,background:'rgba(17,24,39,.7)',color:'#fff',cursor:'pointer'}}>›</button>
      </div>}
    </div>
  );
};

const NewSignerPage = ({
  msg, theme, isOwn, flipClass, canEdit, editing,
  draft, onDraftChange, onStartEdit, onSaveEdit, onCancelEdit, saving,
  onMediaSelect, onMediaRemove, spread,
}) => {
  const isDark = theme?.id === 'charcoal';
  const ink    = isDark ? '#F3E8FF' : '#2a2140';
  const sub    = isDark ? '#A78BFA' : '#8b8299';
  const accentC= theme?.accent || '#7C3AED';
  const paper  = theme?.bg || '#FFFDF8';
  const fStyle = getFontStyle(editing ? (draft?.font_style || msg?.font_style) : msg?.font_style);
  const content = editing ? (draft?.content ?? '') : (msg?.content ?? '');
  const author  = editing ? (draft?.author_name ?? '') : (msg?.author_name ?? '');
  const fontColor = editing ? (draft?.font_color || msg?.font_color || ink) : (msg?.font_color || ink);
  const editMediaInputRef = useRef(null);
  const [showEditGif, setShowEditGif] = useState(false);
  const [expandedMedia, setExpandedMedia] = useState(null);
  const mediaUrl = editing
    ? (draft?.media_preview || (draft?.remove_media ? null : msg?.media_url))
    : msg?.media_url;
  const mediaType = editing
    ? (draft?.media_type || (draft?.remove_media ? null : msg?.media_type))
    : msg?.media_type;

  return (
    <div className={`album-page ${flipClass}`} style={{
      position:'relative', width:500, maxWidth: spread ? '45vw' : '92vw', height:600,
      background:paper,
      borderRadius:14,
      border:`1px solid ${isDark?'rgba(255,255,255,0.08)':'rgba(120,90,200,0.16)'}`,
      boxShadow:isDark
        ? '0 22px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)'
        : '0 22px 70px rgba(76,29,149,0.16), inset 0 1px 0 rgba(255,255,255,0.7)',
      overflow:'hidden', display:'flex', flexDirection:'column',
      transition:'background 0.4s,border-color 0.4s',
    }}>
      {/* Header band */}
      <div style={{ padding:'18px 24px 10px 34px', flexShrink:0, position:'relative', zIndex:2 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ width:9, height:9, borderRadius:'50%', background:accentC, opacity:0.7 }}/>
          {msg?.created_at && <span style={{ fontFamily:"'Kalam',cursive", fontSize:13, color:sub, fontWeight:700 }}>
            {new Date(msg.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}
          </span>}
        </div>
      </div>

      {!editing && <SignerMediaCarousel message={msg} accent={accentC} dark={isDark} onExpand={setExpandedMedia}/>} 
      {editing && mediaUrl && <SignerMediaCarousel message={{media_url:mediaUrl,media_type:mediaType}} accent={accentC} dark={isDark} onExpand={setExpandedMedia}/>} 

      {editing && (
        <div style={{margin:'0 24px 6px 34px',display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',position:'relative',zIndex:8}}>
          <input ref={editMediaInputRef} type="file" accept="image/*,video/*" hidden
            onChange={e=>{const file=e.target.files?.[0];if(file)onMediaSelect?.(file);e.target.value='';}} />
          <button type="button" onClick={()=>editMediaInputRef.current?.click()} style={{border:`1px solid ${accentC}55`,background:isDark?'rgba(255,255,255,0.08)':'#fff',color:accentC,borderRadius:999,padding:'5px 9px',fontSize:10,fontWeight:800,cursor:'pointer'}}>
            <Icon name="Image" size={11}/> Photo / video
          </button>
          <button type="button" onClick={()=>setShowEditGif(true)} style={{border:`1px solid ${accentC}55`,background:isDark?'rgba(255,255,255,0.08)':'#fff',color:accentC,borderRadius:999,padding:'5px 9px',fontSize:10,fontWeight:800,cursor:'pointer'}}>GIF</button>
          <VoiceRecorder onRecorded={file=>onMediaSelect?.(file)} disabled={saving}/>
          {mediaUrl && <button type="button" onClick={onMediaRemove} style={{border:'1px solid #FCA5A5',background:'#FEF2F2',color:'#B91C1C',borderRadius:999,padding:'5px 9px',fontSize:10,fontWeight:800,cursor:'pointer'}}>Remove media</button>}
          {showEditGif && <GifPicker onSelect={file=>{onMediaSelect?.(file);setShowEditGif(false);}} onClose={()=>setShowEditGif(false)} compact/>} 
        </div>
      )}

      {/* Message body — inline editable */}
      <div style={{ margin:'6px 24px 0 34px', position:'relative', zIndex:2 }}>
        {editing ? (
          <textarea
            className="album-inline-input"
            autoFocus
            value={content}
            onChange={e=>{
              onDraftChange({ content:e.target.value });
              // Auto-expand: grow with content, never show scrollbar
              e.target.style.height='auto';
              e.target.style.height=(e.target.scrollHeight)+'px';
            }}
            placeholder="Write your message right here…"
            style={{
              fontFamily:fStyle?.family||"'Caveat',cursive",
              fontSize:22, color:fontColor, lineHeight:'34px',
              minHeight:180, height:'auto', width:'100%',
              overflowY:'hidden', resize:'none', display:'block',
              paddingTop:2, boxSizing:'border-box',
            }}
          />
        ) : content ? (
          <p style={{
            fontFamily:fStyle?.family||"'Caveat',cursive",
            fontSize:Math.min(24,Math.max(15,24-Math.floor((content.length||0)/48))),
            color:fontColor, lineHeight:'34px', margin:0, wordBreak:'break-word',
            whiteSpace:'pre-wrap',
          }}>
            {content}
          </p>
        ) : null}
      </div>

      {/* Signature footer */}
      <div style={{ margin:'8px 24px 20px 34px', flexShrink:0, position:'relative', zIndex:2, borderTop:`1px dashed ${accentC}33`, paddingTop:12, display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
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
            <span style={{ fontSize:14 }}>💸</span>
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
      {expandedMedia && (
        <div role="dialog" aria-modal="true" onClick={()=>setExpandedMedia(null)} style={{position:'fixed',inset:0,zIndex:120,display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'rgba(0,0,0,.82)'}}>
          <div onClick={e=>e.stopPropagation()} style={{position:'relative',maxWidth:920,width:'100%',maxHeight:'88vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
            {expandedMedia.type==='video' ? <video src={expandedMedia.src} controls autoPlay style={{maxWidth:'100%',maxHeight:'86vh',borderRadius:16}}/>
              : expandedMedia.type==='voice' ? <div style={{background:'#fff',borderRadius:18,padding:28,width:'min(420px,90vw)'}}><audio src={expandedMedia.src} controls autoPlay style={{width:'100%'}}/></div>
              : <img src={expandedMedia.src} alt="" style={{maxWidth:'100%',maxHeight:'86vh',objectFit:'contain',borderRadius:16}}/>}
            <button type="button" onClick={()=>setExpandedMedia(null)} aria-label="Close media preview" style={{position:'absolute',right:-8,top:-8,width:36,height:36,borderRadius:'50%',border:0,background:'#fff',fontSize:20,cursor:'pointer'}}>×</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Legacy page (multi-sticker) ─────────────────────────────────────────────
const LegacyAlbumPage = ({ pageNum, messages, myMsgIds, theme, flipClass, onDragStart, pageRef, spread }) => {
  const isDark = theme?.id === 'charcoal';
  const accentC= theme?.accent||'#7C3AED';
  return (
    <div ref={pageRef} className={`album-page ${flipClass}`} style={{
      position:'relative',width:500,maxWidth: spread ? '45vw' : '90vw',height:600,
      background:theme?.bg||'#F5F3FF',
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
  // (mobileSidebar state removed — the side pane it opened no longer exists)
  const [showHelp,   setShowHelp]   = useState(false);
  const [signaturesOpen, setSignaturesOpen] = useState(true);
  const [flipClass,  setFlipClass]  = useState('');
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
  const [editDraft, setEditDraft] = useState(null); // copy/style + optional inline media replacement
  const [savingEdit, setSavingEdit] = useState(false);
  // Direct-on-page compose for the blank leaf
  const [inlineCompose, setInlineCompose] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const signedInName  = user?.full_name||(member?`${member.first_name} ${member.last_name}`.trim():null)||company?.contact_person||'';
  const signedInEmail = user?.email||member?.email||company?.email||'';

  const [form, setForm] = useState({
    author_name:signedInName, author_email:signedInEmail,
    content:'', is_private:false, font_style: autoFontForPosition(messages.length),
    font_color:'#1E40AF', font_size:18,
  });

  const [mediaFiles,  setMediaFiles]  = useState([]);
  const [expandedComposeMedia, setExpandedComposeMedia] = useState(null);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [showEmoji,   setShowEmoji]   = useState(false);
  const [showGif,     setShowGif]     = useState(false);

  const dragging   = useRef(null);
  const pageRef    = useRef();
  const fileInputRef = useRef();
  const textareaRef  = useRef();

  const openEditorFor = useCallback((action = 'message') => {
    // Opens direct on-page compose instead of a form modal — tapping any
    // action (message, media, gif, voice, gift) writes straight onto the
    // page itself. The old fullscreen editor modal is no longer triggered
    // anywhere in this file; its JSX is left in place further below but is
    // now unreachable dead code, kept rather than deleted to avoid
    // re-touching a large, delicate block of JSX in this file.
    setInlineCompose(true);
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
  const albumTheme = getAlbumTheme(card?.album_background_theme);

  useEffect(() => {
    setSelectedAmount(card?.is_gift_enabled ? (card?.suggested_amount || 2500) : null);
    setCustomAmount('');
  }, [card?.id]);

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
  const currentTheme = { ...albumTheme, bg:albumTheme.page, accent:design?.accent || '#7C3AED' };
  const isDark = albumTheme.id === 'midnight';
  const accentC = clampedPage===0 ? (design?.accent||'#7C3AED') : (currentTheme?.accent||'#7C3AED');
  const stageBackground = albumTheme.id === 'cover_blur'
    ? (typeof card?.background_color === 'string' && /^https?:\/\//.test(card.background_color)
      ? `url("${card.background_color}") center / cover no-repeat`
      : design?.image ? `url("${design.image}") center / cover no-repeat`
        : design?.background || albumTheme.stage)
    : albumTheme.stage;

  // ─ Page flip sound (Web Audio — a short filtered-noise "paper" swish) ─
  const audioCtxRef = useRef(null);
  const soundOnRef = useRef(true);
  useEffect(() => { soundOnRef.current = soundOn; }, [soundOn]);
  const playFlipSound = useCallback(() => {
    if (!soundOnRef.current) return;
    try {
      let ctx = audioCtxRef.current;
      if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); audioCtxRef.current = ctx; }
      if (ctx.state === 'suspended') ctx.resume();
      const dur = 0.26;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / data.length;
        // envelope: quick attack, decay — mimics a page swish
        const env = Math.pow(1 - t, 2.2) * Math.min(1, t * 12);
        data[i] = (Math.random() * 2 - 1) * env * 0.5;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 0.7;
      const gain = ctx.createGain(); gain.gain.value = 0.35;
      src.connect(bp); bp.connect(gain); gain.connect(ctx.destination);
      src.start();
    } catch { /* audio not available — silent */ }
  }, []);

  // ─ Page flip animation ─
  const flipTo = useCallback((newPage, direction='forward') => {
    if (newPage === clampedPage) return;
    playFlipSound();
    setPage(newPage);
    setFlipClass(direction==='forward' ? 'album-flip-forward' : 'album-flip-back');
    window.setTimeout(()=>{ setFlipClass(''); }, 620);
  }, [clampedPage, playFlipSound]);

  const goNext = () => { if (clampedPage < totalPages-1) flipTo(clampedPage+1,'forward'); };
  const goPrev = () => { if (clampedPage > 0) flipTo(clampedPage-1,'back'); };

  // Keyboard arrows flip pages freely (ignored while typing/editing)
  useEffect(() => {
    const onKey = (e) => {
      if (showEditor || editingMsgId || inlineCompose) return;
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clampedPage, totalPages, showEditor, editingMsgId, inlineCompose]);

  // Swipe left/right to flip on touch devices (only when not dragging a sticker/editing)
  const swipeRef = useRef(null);
  const onSwipeStart = useCallback((e) => {
    if (dragging.current || editingMsgId || inlineCompose) { swipeRef.current = null; return; }
    const t = e.touches?.[0]; if (!t) return;
    swipeRef.current = { x: t.clientX, y: t.clientY };
  }, [editingMsgId, inlineCompose]);
  const onSwipeEnd = useCallback((e) => {
    const s = swipeRef.current; swipeRef.current = null;
    if (!s) return;
    const t = e.changedTouches?.[0]; if (!t) return;
    const dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0) goNext(); else goPrev();
    }
  }, [clampedPage, totalPages]);

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
      messagesAPI.updatePosition(msgId,{position_x:msg._x??msg.position_x,position_y:msg._y??msg.position_y,rotation:msg.rotation,edit_token:getEditToken(msgId)||undefined,author_email:form.author_email}).catch(()=>{});
    }
    dragging.current=null;
  },[card,form.author_email]);

  // ─ Inline edit handlers ─
  const canEditMsg = useCallback((m) => {
    if (!m) return false;
    if (card?.isCreator) return true;              // creator edits all pages
    if (myMsgIds.includes(m.id)) return true;      // signer edits own page (this session)
    if (getEditToken(m.id)) return true;           // returning signer — this browser holds the token
    return false;
  }, [card?.isCreator, myMsgIds]);

  const startEdit = useCallback((m) => {
    if (!m) return;
    setEditingMsgId(m.id);
    setEditDraft({
      content: m.content || '',
      author_name: m.author_name || '',
      font_style: m.font_style || 'handwritten',
      font_color: m.font_color || null,
      media_type: m.media_type || null,
      media_file: null,
      media_preview: null,
      remove_media: false,
    });
  }, []);

  const clearEditDraft = useCallback(() => {
    setEditDraft(d => {
      if (d?.media_preview) URL.revokeObjectURL(d.media_preview);
      return null;
    });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingMsgId(null);
    clearEditDraft();
  }, [clearEditDraft]);

  const selectEditMedia = useCallback((file) => {
    if (!file) return;
    if (file.size > 9 * 1024 * 1024) return toast.error('Please choose a file under 9MB');
    const type = file.type.startsWith('video/') ? 'video'
      : file.type.startsWith('audio/') ? 'voice'
      : file.type === 'image/gif' ? 'gif'
      : file.type.startsWith('image/') ? 'image'
      : null;
    if (!type) return toast.error('Choose an image, GIF, video or audio file');
    setEditDraft(d => {
      if (d?.media_preview) URL.revokeObjectURL(d.media_preview);
      return { ...d, media_file:file, media_preview:URL.createObjectURL(file), media_type:type, remove_media:false };
    });
  }, []);

  const removeEditMedia = useCallback(() => {
    setEditDraft(d => {
      if (d?.media_preview) URL.revokeObjectURL(d.media_preview);
      return { ...d, media_file:null, media_preview:null, media_type:null, remove_media:true };
    });
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingMsgId || !editDraft) return;
    const originalMsg = messages.find(m => m.id === editingMsgId);
    const hasMedia = !!(editDraft.media_preview || (!editDraft.remove_media && originalMsg?.media_url));
    if (!editDraft.content.trim() && !hasMedia) return toast.error('Add a message or a photo/GIF/voice note before saving');
    setSavingEdit(true);
    try {
      const values = {
        content: editDraft.content.trim(),
        author_name: editDraft.author_name?.trim() || undefined,
        font_style: editDraft.font_style,
        ...(editDraft.font_color ? { font_color: editDraft.font_color } : {}),
        edit_token: getEditToken(editingMsgId) || undefined,
        // Legacy fallback for messages created before edit_token existed —
        // backend only honours this when the message has no edit_token stored.
        author_email: form.author_email || undefined,
        ...(editDraft.remove_media ? { remove_media:true } : {}),
      };
      let payload = values;
      if (editDraft.media_file) {
        payload = new FormData();
        Object.entries(values).forEach(([key,value])=>{ if(value !== undefined) payload.append(key,value); });
        payload.append('media', editDraft.media_file);
      }
      const response = await messagesAPI.updateMessage(editingMsgId, payload);
      const saved = response.data || {};
      // optimistic local update
      setCard(prev => ({
        ...prev,
        messages: (prev.messages || []).map(m =>
          m.id === editingMsgId ? {
            ...m,
            content: editDraft.content.trim(),
            author_name: editDraft.author_name?.trim() || m.author_name,
            font_style: editDraft.font_style,
            font_color: editDraft.font_color || m.font_color,
            ...(editDraft.remove_media ? { media_url:null, media_type:null, media_gallery:null } : {}),
            ...(saved.media_url ? { media_url:saved.media_url, media_type:saved.media_type } : {}),
          } : m),
      }));
      toast.success('Saved ✓');
      setEditingMsgId(null); clearEditDraft();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save your edits');
    } finally { setSavingEdit(false); }
  }, [editingMsgId, editDraft, form.author_email, clearEditDraft, messages]);

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
      if (messageId) { setMyMsgIds(prev => [...prev, messageId]); storeEditToken(messageId, msgRes.data?.edit_token); }
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
    const amountNGN=Number(customAmount||selectedAmount||0);
    const wantsGift=card.is_gift_enabled&&amountNGN>=2500;
    // A page needs *something* on it — a written message, a photo/video/voice
    // note, or a gift — but not specifically text. Signers who just want to
    // leave a photo or a gift without writing anything can now do that.
    if(!form.content.trim() && mediaFiles.length===0 && !wantsGift) return toast.error('Add a message, a photo/GIF/voice note, or a gift before signing');
    if(!form.author_email.trim()) return toast.error('Email is required');
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
      if(messageId) { setMyMsgIds(prev=>[...prev,messageId]); storeEditToken(messageId, msgRes.data?.edit_token); }
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
  const bgColor = stageBackground || albumTheme.stage;

  // ─ Full-spread: pair pages into a left/right open-book spread (post-cover).
  // The "active" side is whichever one clampedPage points at — that's the only
  // side that gets the compose overlay / edit affordances / flip animation.
  // The other side renders the same page components in pure read-only mode,
  // so both pages are genuinely visible at once without duplicating any of
  // the interaction logic above (which is already parameterized by pageDef,
  // not by clampedPage directly).
  const spreadLeftIdx  = showingCover ? null : (clampedPage % 2 === 1 ? clampedPage : clampedPage - 1);
  const spreadRightIdx = showingCover ? null : spreadLeftIdx + 1;
  const leftDef  = spreadLeftIdx  != null && spreadLeftIdx  >= 1 && spreadLeftIdx  < totalPages ? pageList[spreadLeftIdx]  : null;
  const rightDef = spreadRightIdx != null && spreadRightIdx < totalPages ? pageList[spreadRightIdx] : null;
  const activeSide = clampedPage === spreadRightIdx ? 'right' : 'left';

  const renderLeaf = (def, idx, isActive) => {
    if (!def) {
      // Inside cover / end of book — a quiet closed-leaf placeholder rather than empty space
      return (
        <div style={{width:424,maxWidth:'44vw',minHeight:600,borderRadius:'0 16px 16px 0',background:currentTheme.bg||'#fff',
          border:'1.5px solid rgba(200,180,240,0.25)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <span style={{fontFamily:"'Caveat',cursive",fontSize:18,color:'#C4B5FD'}}>The end ✦</span>
        </div>
      );
    }
    const leafFlip = isActive ? flipClass : '';
    if (def.type==='legacy') {
      return <LegacyAlbumPage pageRef={isActive?pageRef:undefined} pageNum={def.pageNum} messages={def.msgs||[]} myMsgIds={myMsgIds} theme={currentTheme} flipClass={leafFlip} onDragStart={isActive?startDrag:undefined} spread/>;
    }
    return (
      <NewSignerPage
        msg={def?.msg||null}
        theme={currentTheme}
        isOwn={def?.msg&&myMsgIds.includes(def.msg.id)}
        flipClass={leafFlip}
        canEdit={isActive && canEditMsg(def?.msg)}
        editing={isActive && !!def?.msg && editingMsgId===def.msg.id}
        draft={editDraft}
        saving={savingEdit}
        onDraftChange={isActive?(patch)=>setEditDraft(d=>({...d,...patch})):undefined}
        onStartEdit={isActive?()=>startEdit(def?.msg):undefined}
        onSaveEdit={isActive?saveEdit:undefined}
        onCancelEdit={isActive?cancelEdit:undefined}
        onMediaSelect={isActive?selectEditMedia:undefined}
        onMediaRemove={isActive?removeEditMedia:undefined}
        spread
      />
    );
  };

  return(
    <div className="section-dots" style={{minHeight:'100vh',background:bgColor,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",transition:'background 0.4s'}}>
      <style>{ALBUM_CSS}</style>

      {/* ── Top bar — beautiful, fully centred ── */}
      <div style={{
        background: showingCover ? 'rgba(255,255,255,0.96)' : (isDark ? 'rgba(20,12,42,0.97)' : 'rgba(255,255,255,0.96)'),
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${(currentTheme.accent||'#7C3AED')}22`,
        boxShadow: '0 2px 24px rgba(0,0,0,0.07)',
        position: 'sticky', top: 0, zIndex: 40,
        transition: 'background 0.4s',
      }}>
        {/* Row 1 — brand left, card info centre, gift right */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 1.25rem',height:54}}>
          <Link to="/" style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:900,fontSize:16,color:isDark&&!showingCover?'#E9D5FF':'#1A1035',textDecoration:'none',letterSpacing:'-0.01em'}}>
            Thank<span style={{color:currentTheme.accent||'#7C3AED'}}>eeu</span>
          </Link>
          <div style={{textAlign:'center',position:'absolute',left:'50%',transform:'translateX(-50%)'}}>
            <p style={{margin:0,fontWeight:800,fontSize:14,color:isDark&&!showingCover?'#E9D5FF':'#1A1035',lineHeight:1.2}}>
              {card.recipient_name}&rsquo;s card
            </p>
            <p style={{margin:0,fontSize:11,color:isDark&&!showingCover?'rgba(200,180,240,0.7)':'#9CA3AF'}}>
              {messages.length} {messages.length===1?'message':'messages'}&nbsp;&middot;&nbsp;
              {showingCover ? 'Cover' : `Page ${clampedPage} of ${totalPages-1}`}
            </p>
          </div>
          {card.is_gift_enabled ? (
            <button onClick={()=>openEditorFor('gift')}
              style={{border:'none',borderRadius:20,padding:'7px 16px',background:'linear-gradient(135deg,#F59E0B,#D97706)',color:'#fff',fontWeight:800,fontSize:12,cursor:'pointer',boxShadow:'0 3px 10px rgba(245,158,11,0.35)',whiteSpace:'nowrap'}}>
              🎁 Gift
            </button>
          ) : <div style={{width:64}}/>}
        </div>

        {/* Row 2 — action buttons, fully centred */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'8px 1.25rem 10px',flexWrap:'wrap'}}>
          <button onClick={()=>openEditorFor('message')}
            style={{display:'inline-flex',alignItems:'center',gap:6,background:`linear-gradient(135deg,${currentTheme.accent||'#7C3AED'},${currentTheme.accent||'#7C3AED'}cc)`,color:'#fff',border:'none',borderRadius:24,padding:'9px 22px',fontWeight:800,fontSize:13,cursor:'pointer',boxShadow:`0 4px 14px ${currentTheme.accent||'#7C3AED'}44`}}>
            <Icon name="PenLine" size={14}/>Sign this card
          </button>
          <button onClick={()=>fileInputRef.current?.click()} title="Add photo"
            style={{width:38,height:38,borderRadius:'50%',border:`1.5px solid ${(currentTheme.accent||'#7C3AED')}33`,background:isDark?'rgba(255,255,255,0.08)':'rgba(124,58,237,0.06)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,transition:'background 0.15s'}}>🖼️</button>
          <button onClick={()=>openEditorFor('gif')} title="Add GIF"
            style={{width:38,height:38,borderRadius:'50%',border:`1.5px solid ${(currentTheme.accent||'#7C3AED')}33`,background:isDark?'rgba(255,255,255,0.08)':'rgba(124,58,237,0.06)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:10,color:currentTheme.accent||'#7C3AED'}}>GIF</button>
          <div style={{display:'flex',alignItems:'center'}}>
            <VoiceRecorder onRecorded={f=>addMedia([f])} disabled={submitting}/>
          </div>
          <button onClick={()=>setSoundOn(s=>!s)} title={soundOn?'Sound on':'Sound off'}
            style={{width:38,height:38,borderRadius:'50%',border:`1.5px solid ${(currentTheme.accent||'#7C3AED')}33`,background:isDark?'rgba(255,255,255,0.08)':'rgba(124,58,237,0.06)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Icon name={soundOn?'Volume2':'VolumeX'} size={14} style={{color:currentTheme.accent||'#7C3AED'}}/>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden"
            onChange={e=>{addMedia(e.target.files);e.target.value='';}}/>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div style={{maxWidth:760,margin:'0 auto',padding:'32px 16px'}} className="album-layout">

        {/* ── Book ── */}
        <div>
          <div style={{position:'relative',display:'flex',justifyContent:'center',alignItems:'center',minHeight:640,userSelect:'none'}}
            onMouseMove={onDragMove} onMouseUp={onDragEnd}
            onTouchStart={onSwipeStart}
            onTouchMove={onDragMove} onTouchEnd={(e)=>{ onDragEnd(e); onSwipeEnd(e); }}>

            {/* Stacked shadows */}
            {clampedPage>0&&[2,1].map(off=>(
              <div key={off} style={{position:'absolute',left:'50%',top:'50%',
                transform:`translate(calc(-50% - ${off*18}px),calc(-50% + ${off*4}px)) rotate(${-off*2}deg)`,
                width:500,maxWidth:'90vw',height:600,borderRadius:20,
                background:currentTheme.bg||'#fff',
                border:'1.5px solid rgba(200,180,240,0.25)',boxShadow:'0 4px 20px rgba(0,0,0,0.05)',zIndex:0}}/>
            ))}
            {clampedPage<totalPages-1&&[1,2].map(off=>(
              <div key={off} style={{position:'absolute',left:'50%',top:'50%',
                transform:`translate(calc(-50% + ${off*18}px),calc(-50% + ${off*4}px)) rotate(${off*2}deg)`,
                width:500,maxWidth:'90vw',height:600,borderRadius:20,
                background:currentTheme.bg||'#fff',
                border:'1.5px solid rgba(200,180,240,0.25)',boxShadow:'0 4px 20px rgba(0,0,0,0.05)',zIndex:0}}/>
            ))}

            {/* Active page + peek page — full open-book spread.
                perspective on this wrapper is what gives the 3D depth to the
                rotateY animation — exactly what the live preview does at line 630
                of AlbumStudioPreview.jsx. Without it the keyframes run in 2D. */}
            <div style={{position:'relative',zIndex:1,display:'flex',alignItems:'stretch',perspective:'1800px',transformStyle:'preserve-3d'}}>
              {!showingCover && activeSide==='right' && (
                <div style={{position:'relative',borderRadius:'14px 0 0 14px',overflow:'hidden',boxShadow:'inset -8px 0 20px -12px rgba(0,0,0,0.25)'}}>
                  {renderLeaf(leftDef, spreadLeftIdx, false)}
                </div>
              )}
              {!showingCover && <div style={{width:2,alignSelf:'stretch',background:'linear-gradient(90deg,rgba(0,0,0,0.08),rgba(0,0,0,0.02))',flexShrink:0}}/>}
            <div style={{position:'relative',zIndex:1,borderRadius:!showingCover?(activeSide==='left'?'0 14px 14px 0':'14px 0 0 14px'):undefined,overflow:!showingCover?'hidden':undefined,boxShadow:!showingCover?(activeSide==='left'?'inset 8px 0 20px -12px rgba(0,0,0,0.25)':'inset -8px 0 20px -12px rgba(0,0,0,0.25)'):undefined}}>
                {showingCover
                  ? <CoverPage card={card} design={design} flipClass={flipClass}/>
                  : pageDef?.type==='legacy'
                    ? <LegacyAlbumPage pageRef={pageRef} pageNum={pageDef.pageNum} messages={pageDef.msgs||[]} myMsgIds={myMsgIds} theme={currentTheme} flipClass={flipClass} onDragStart={startDrag} spread/>
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
                        onMediaSelect={selectEditMedia}
                        onMediaRemove={removeEditMedia}
                        spread={!showingCover}
                      />
                }
                {!showingCover && pageDef?.type === 'blank' && (
                  <div style={{position:'absolute',inset:0,zIndex:5,pointerEvents:'none'}}>
                    {inlineCompose ? (
                      /* Direct-on-page notebook compose */
                      <div style={{position:'absolute',inset:0,pointerEvents:'auto',display:'flex',flexDirection:'column',padding:'22px 24px 20px 34px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                          <span style={{width:9,height:9,borderRadius:'50%',background:accentC,opacity:0.7}}/>
                          <span style={{fontFamily:"'Kalam',cursive",fontSize:13,color:accentC,fontWeight:700}}>Your page — write freely</span>
                        </div>
                        {mediaFiles.length>0 && (()=>{const item=mediaFiles[Math.min(carouselIdx,mediaFiles.length-1)];return (
                          <div style={{position:'relative',height:135,flexShrink:0,marginBottom:9,borderRadius:12,overflow:'hidden',background:'rgba(26,16,53,.9)',border:`2px solid ${accentC}44`}}>
                            {item.type==='video' ? <video src={item.preview} controls style={{width:'100%',height:'100%',objectFit:'contain'}}/>
                              : item.type==='voice' ? <div style={{height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:7,background:'rgba(255,255,255,.92)'}}><span style={{fontSize:26}}>🎙️</span><audio src={item.preview} controls style={{width:'80%',height:34}}/></div>
                              : <button type="button" onClick={()=>setExpandedComposeMedia(item)} style={{width:'100%',height:'100%',padding:0,border:0,background:'transparent',cursor:'zoom-in'}}><img src={item.preview} alt="Selected attachment" style={{width:'100%',height:'100%',objectFit:'contain'}}/></button>}
                            <button type="button" onClick={()=>setExpandedComposeMedia(item)} style={{position:'absolute',right:7,top:7,border:0,borderRadius:999,background:'rgba(17,24,39,.78)',color:'#fff',fontSize:9,fontWeight:800,padding:'5px 8px',cursor:'zoom-in'}}>Expand</button>
                            {mediaFiles.length>1 && <span style={{position:'absolute',left:7,bottom:7,borderRadius:999,background:'rgba(17,24,39,.72)',color:'#fff',fontSize:9,fontWeight:800,padding:'4px 7px'}}>{carouselIdx+1}/{mediaFiles.length}</span>}
                          </div>
                        );})()}
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
                          <input
                            className="album-inline-input"
                            value={form.author_name}
                            onChange={e=>setForm(p=>({...p,author_name:e.target.value}))}
                            placeholder="your name"
                            style={{fontFamily:"'Dancing Script',cursive",fontWeight:700,fontSize:24,color:accentC,marginTop:2}}
                          />
                          <input type="email" value={form.author_email} onChange={e=>setForm(p=>({...p,author_email:e.target.value}))}
                            placeholder="Your email (for your signature)" aria-label="Your email"
                            style={{width:'100%',marginTop:6,border:`1px solid ${accentC}33`,borderRadius:8,padding:'7px 9px',fontSize:12,color:'#374151',background:'rgba(255,255,255,.75)',outline:'none'}}/>
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
                          <div style={{width:44,height:44}}><VoiceRecorder onRecorded={f=>addMedia([f])} disabled={submitting}/></div>
                          <button type="button" onClick={()=>setInlineCompose(false)}
                            style={{width:44,height:44,borderRadius:12,border:'1px solid #E5E7EB',background:'#fff',cursor:'pointer',color:'#9CA3AF'}}>✕</button>
                        </div>
                        {card.is_gift_enabled && (
                          <div id="album-gift-section" style={{background:'linear-gradient(135deg,#FFF7ED,#FEF3C7)',border:'1.5px solid #FDE68A',borderRadius:14,padding:'12px 14px',marginTop:12}}>
                            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}>
                              <span style={{fontSize:16}}>🎁</span>
                              <span style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:800,fontSize:12,color:'#92400E'}}>Add a gift (optional)</span>
                            </div>
                            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                              {[1000,2500,5000,10000].map(amt=>(
                                <button key={amt} type="button" onClick={()=>{setSelectedAmount(amt);setCustomAmount('');}}
                                  style={{border:`2px solid ${selectedAmount===amt?'#F59E0B':'#FDE68A'}`,background:selectedAmount===amt?'#FEF3C7':'#fff',borderRadius:10,padding:'6px 10px',fontSize:12,fontWeight:800,color:'#92400E',cursor:'pointer'}}>
                                  {formatNGN(amt)}
                                </button>
                              ))}
                            </div>
                            <input type="number" min="100" value={customAmount}
                              onChange={e=>{setCustomAmount(e.target.value);setSelectedAmount(null);}}
                              placeholder="Or enter a custom amount (₦)"
                              style={{width:'100%',marginTop:8,border:'1px solid #FDE68A',borderRadius:8,padding:'7px 9px',fontSize:12,outline:'none'}}/>
                          </div>
                        )}
                        {showGif && (
                          // Fixed, centered overlay — the page card this button lives in has
                          // overflow:hidden for its paper/flip-animation look, so an absolutely
                          // positioned picker anchored to the button would get silently clipped
                          // instead of showing. Escaping to a viewport-level overlay guarantees
                          // it's always visible regardless of where on the page the button sits.
                          <div style={{position:'fixed',inset:0,zIndex:150,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(26,16,53,0.55)',backdropFilter:'blur(4px)'}}
                            onClick={()=>setShowGif(false)}>
                            <div style={{position:'relative',width:'min(380px,92vw)'}} onClick={e=>e.stopPropagation()}>
                              <GifPicker onSelect={f=>{addMedia([f]);setShowGif(false);}} onClose={()=>setShowGif(false)} compact/>
                            </div>
                          </div>
                        )}
                        {mediaFiles.length>0 && (
                          <p style={{fontSize:11,color:accentC,fontWeight:700,marginTop:8}}>{mediaFiles.length} attachment{mediaFiles.length>1?'s':''} ready ✓</p>
                        )}
                      </div>
                    ) : (
                      <div style={{position:'absolute',inset:0,pointerEvents:'auto',display:'flex',flexDirection:'column',padding:'22px 24px 20px 34px',gap:12}}>
                        {/* Primary CTA — write the message */}
                        <button type="button" onClick={()=>setInlineCompose(true)}
                          style={{flex:1,minHeight:0,border:'2px dashed rgba(124,58,237,0.42)',background:'rgba(255,255,255,0.6)',borderRadius:16,fontFamily:"'Plus Jakarta Sans',sans-serif",cursor:'text',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,padding:16}}>
                          <span style={{display:'flex',width:48,height:48,borderRadius:14,alignItems:'center',justifyContent:'center',background:accentC+'18',flexShrink:0}}><Icon name="PenLine" size={23} style={{color:accentC}}/></span>
                          <span style={{fontSize:17,fontWeight:800,color:accentC}}>This page is yours</span>
                          <span style={{fontSize:12,fontWeight:600,color:'#6B7280',maxWidth:260,lineHeight:1.5,textAlign:'center'}}>Tap here to write your message. Everything below is optional.</span>
                        </button>

                        {/* Optional add-ons — icon grid, clearly secondary to the CTA above */}
                        <div style={{flexShrink:0}}>
                          <p style={{fontSize:10,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'#9CA3AF',margin:'0 0 8px 4px'}}>Optional extras</p>
                          <div style={{display:'grid',gridTemplateColumns:card.is_gift_enabled?'repeat(4,1fr)':'repeat(3,1fr)',gap:8}}>
                            {[
                              { action:'media', icon:'Image',  label:'Photo/Video', color:accentC,     bg:accentC+'12' },
                              { action:'gif',   icon:'Sparkles',label:'GIF',         color:accentC,     bg:accentC+'12' },
                              { action:'voice', icon:'Mic',     label:'Voice note',  color:accentC,     bg:accentC+'12' },
                              ...(card.is_gift_enabled ? [{ action:'gift', icon:'Gift', label:'Gift', color:'#92400E', bg:'rgba(254,243,199,0.9)' }] : []),
                            ].map(opt=>(
                              <button key={opt.action} type="button" onClick={()=>openEditorFor(opt.action)}
                                style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5,border:`1.5px solid ${opt.color}33`,background:opt.bg,borderRadius:12,padding:'10px 6px',cursor:'pointer'}}>
                                <Icon name={opt.icon} size={17} style={{color:opt.color}}/>
                                <span style={{fontSize:10,fontWeight:800,color:opt.color,textAlign:'center',lineHeight:1.2}}>{opt.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {!showingCover && activeSide==='left' && (
                <div style={{position:'relative',borderRadius:'0 14px 14px 0',overflow:'hidden',boxShadow:'inset 8px 0 20px -12px rgba(0,0,0,0.25)'}}>
                  {renderLeaf(rightDef, spreadRightIdx, false)}
                </div>
              )}
            </div>
            </div>

          {/* ── Page navigation (jump freely to any page) ── */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:22,width:'100%',minWidth:0}}>
            <button onClick={goPrev} disabled={clampedPage===0}
              style={{width:48,height:48,borderRadius:'50%',background:showingCover?(design?.accent||'#7C3AED')+'22':'#fff',border:`2px solid ${accentC}44`,display:'flex',alignItems:'center',justifyContent:'center',cursor:clampedPage===0?'not-allowed':'pointer',opacity:clampedPage===0?0.3:1,color:accentC,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
              <Icon name="ChevronLeft" size={22}/>
            </button>

            {totalPages <= 9 ? (
              /* Few pages → dots */
              <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'nowrap',justifyContent:'center',minWidth:0,overflow:'hidden'}}>
                {pageList.map((_,i)=>(
                  <button key={i} onClick={()=>flipTo(i,i>clampedPage?'forward':'back')}
                    style={{width:i===clampedPage?22:8,height:8,borderRadius:4,background:i===clampedPage?accentC:accentC+'44',border:'none',cursor:'pointer',padding:0,transition:'all 0.2s'}}
                    title={i===0?'Cover':`Page ${i}`}/>
                ))}
              </div>
            ) : (
              /* Many pages → jump-to control + first/last so any page is one tap away */
              <div style={{display:'flex',gap:6,alignItems:'center',minWidth:0,maxWidth:'calc(100% - 104px)'}}>
                <button onClick={()=>flipTo(0,'back')} disabled={clampedPage===0}
                  aria-label="Go to first page" title="First page - Cover"
                  style={{height:34,padding:'0 10px',borderRadius:999,border:`1.5px solid ${accentC}44`,background:'#fff',color:accentC,fontWeight:800,fontSize:12,cursor:clampedPage===0?'not-allowed':'pointer',opacity:clampedPage===0?0.4:1,whiteSpace:'nowrap'}}>
                  {'<< First'}
                </button>
                <label style={{display:'flex',alignItems:'center',gap:5,background:'#fff',border:`1.5px solid ${accentC}44`,borderRadius:999,padding:'4px 7px 4px 10px',minWidth:0}}>
                  <span style={{fontSize:11,fontWeight:700,color:isDark?'#A78BFA':'#6B7280',whiteSpace:'nowrap'}}>Page</span>
                  <select
                    aria-label="Jump to page"
                    value={clampedPage}
                    onChange={e=>{const t=Number(e.target.value);flipTo(t,t>clampedPage?'forward':'back');}}
                    style={{border:'none',background:'transparent',color:accentC,fontWeight:800,fontSize:12,cursor:'pointer',outline:'none',minWidth:0,maxWidth:108}}
                  >
                    {pageList.map((pd,i)=>(
                      <option key={i} value={i}>
                        {i===0?'Cover':pd.type==='blank'?'Last - Sign here':`${i} of ${totalPages-1}`}
                      </option>
                    ))}
                  </select>
                </label>
                <button onClick={()=>flipTo(totalPages-1,'forward')} disabled={clampedPage>=totalPages-1}
                  aria-label="Go to last page" title="Last page - Sign here"
                  style={{height:34,padding:'0 10px',borderRadius:999,border:`1.5px solid ${accentC}44`,background:accentC+'12',color:accentC,fontWeight:800,fontSize:12,cursor:clampedPage>=totalPages-1?'not-allowed':'pointer',opacity:clampedPage>=totalPages-1?0.4:1,whiteSpace:'nowrap'}}>
                  {'Last >>'}
                </button>
              </div>
            )}

            <button onClick={goNext} disabled={clampedPage>=totalPages-1}
              style={{width:48,height:48,borderRadius:'50%',background:'#fff',border:`2px solid ${accentC}44`,display:'flex',alignItems:'center',justifyContent:'center',cursor:clampedPage>=totalPages-1?'not-allowed':'pointer',opacity:clampedPage>=totalPages-1?0.3:1,color:accentC,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
              <Icon name="ChevronRight" size={22}/>
            </button>
          </div>

          {/* Page label */}
          <p style={{textAlign:'center',fontFamily:"'Caveat',cursive",fontSize:14,color:showingCover?(design?.accent||'#7C3AED')+'88':accentC+'88',marginTop:10}}>
            {showingCover?'Cover — flip, swipe or use ← → to browse every page':`Page ${clampedPage} of ${totalPages-1} · swipe or use ← →`}
          </p>
        </div>
      </div>

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
              {showGif && (
                // Fixed, centered overlay — the modal panel scrolls (overflowY:auto) and can
                // be tall, so a picker anchored to this button could render off the visible
                // area or get clipped depending on scroll position. A viewport-level overlay
                // guarantees it's always visible regardless of where the button sits.
                <div style={{position:'fixed',inset:0,zIndex:150,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(26,16,53,0.55)',backdropFilter:'blur(4px)'}}
                  onClick={()=>setShowGif(false)}>
                  <div style={{position:'relative',width:'min(380px,92vw)'}} onClick={e=>e.stopPropagation()}>
                    <GifPicker onSelect={f=>{addMedia([f]);setShowGif(false);}} onClose={()=>setShowGif(false)} compact/>
                  </div>
                </div>
              )}

            {mediaFiles.length>0&&(
              <div style={{marginBottom:18,border:'1.5px solid #EDE9FE',borderRadius:16,overflow:'hidden'}}>
                <div style={{position:'relative',aspectRatio:'16/9',background:'#1A1035'}}>
                  {mediaFiles[carouselIdx].type==='video'?<video src={mediaFiles[carouselIdx].preview} className="w-full h-full object-contain" controls/>:mediaFiles[carouselIdx].type==='voice'?<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:8,color:'#7C3AED'}}><Icon name="Mic" size={34} /><audio src={mediaFiles[carouselIdx].preview} controls style={{width:'80%'}}/></div>:<img src={mediaFiles[carouselIdx].preview} alt="" style={{width:'100%',height:'100%',objectFit:'contain'}}/>}
                  <button type="button" onClick={()=>removeMedia(carouselIdx)} aria-label="Remove current media" style={{position:'absolute',top:6,right:6,width:28,height:28,borderRadius:'50%',background:'rgba(0,0,0,0.65)',color:'#fff',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name="X" size={13} /></button>
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
      {expandedComposeMedia && (
        <div role="dialog" aria-modal="true" onClick={()=>setExpandedComposeMedia(null)} style={{position:'fixed',inset:0,zIndex:130,display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'rgba(0,0,0,.84)'}}>
          <div onClick={e=>e.stopPropagation()} style={{position:'relative',maxWidth:940,width:'100%',maxHeight:'88vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
            {expandedComposeMedia.type==='video' ? <video src={expandedComposeMedia.preview} controls autoPlay style={{maxWidth:'100%',maxHeight:'86vh',borderRadius:16}}/>
              : expandedComposeMedia.type==='voice' ? <div style={{background:'#fff',borderRadius:18,padding:28,width:'min(420px,90vw)'}}><audio src={expandedComposeMedia.preview} controls autoPlay style={{width:'100%'}}/></div>
              : <img src={expandedComposeMedia.preview} alt="Attachment preview" style={{maxWidth:'100%',maxHeight:'86vh',objectFit:'contain',borderRadius:16}}/>}
            <button type="button" onClick={()=>setExpandedComposeMedia(null)} aria-label="Close media preview" style={{position:'absolute',right:-8,top:-8,width:38,height:38,borderRadius:'50%',border:0,background:'#fff',fontSize:22,cursor:'pointer'}}>×</button>
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
