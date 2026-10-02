import { useState, useRef, useCallback, useEffect } from 'react';
import { Download, Upload, RefreshCw, Copy, Check, Circle, Square } from 'lucide-react';
import { pwaApi, taskersApi } from '../utils/api';
import toast from 'react-hot-toast';

const SITE = 'https://taskeeu.com';
const SIZE = 480; // 1:1 aspect ratio — IG square post standard

// ── Background decorative SVG icons ──────────────────────────────
// Transparent at ~8% opacity, adds texture without distraction
const BG_ICONS = `
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 480 480" xmlns="http://www.w3.org/2000/svg" style="position:absolute;top:0;left:0;pointer-events:none;">
  <!-- Bicycle top-left -->
  <g transform="translate(28,38) rotate(-15)" opacity="0.07" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">
    <circle cx="14" cy="22" r="11"/>
    <circle cx="46" cy="22" r="11"/>
    <path d="M14 22 L26 10 L38 22"/>
    <path d="M26 10 L30 4 L36 4"/>
    <path d="M26 10 L46 22"/>
    <circle cx="30" cy="4" r="2" fill="white"/>
  </g>
  <!-- Laptop top-right -->
  <g transform="translate(392,24) rotate(12)" opacity="0.07" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="0" y="2" width="44" height="28" rx="3"/>
    <path d="M-6 30 L50 30"/>
    <line x1="12" y1="14" x2="32" y2="14"/>
    <line x1="12" y1="19" x2="28" y2="19"/>
  </g>
  <!-- Puzzle piece bottom-left -->
  <g transform="translate(22,390) rotate(10)" opacity="0.07" fill="white">
    <path d="M0 0h14a4 4 0 0 1 0 8h2v14h-8a4 4 0 0 1 0-8v2H0V14a4 4 0 0 1 8 0V0z"/>
  </g>
  <!-- Checkmark circle bottom-right -->
  <g transform="translate(408,388)" opacity="0.07" fill="none" stroke="white" stroke-width="2.5">
    <circle cx="24" cy="24" r="20"/>
    <path d="M14 24 L21 31 L34 17" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <!-- Star center-left -->
  <g transform="translate(14,200)" opacity="0.05" fill="white">
    <path d="M18 2l4.2 8.5L32 12l-7 6.8 1.6 9.4L18 23.5 9.4 28.2 11 18.8 4 12l9.8-1.5z"/>
  </g>
  <!-- Lightning center-right -->
  <g transform="translate(434,198)" opacity="0.06" fill="white">
    <path d="M13 2L3 16h8l-3 14L26 10h-9z"/>
  </g>
  <!-- Small dots scattered -->
  <circle cx="80" cy="140" r="3" opacity="0.06" fill="white"/>
  <circle cx="400" cy="160" r="2.5" opacity="0.05" fill="white"/>
  <circle cx="60" cy="300" r="2" opacity="0.06" fill="white"/>
  <circle cx="420" cy="320" r="3" opacity="0.05" fill="white"/>
  <circle cx="240" cy="30" r="2" opacity="0.05" fill="white"/>
  <circle cx="200" cy="455" r="2.5" opacity="0.05" fill="white"/>
  <circle cx="280" cy="455" r="2" opacity="0.05" fill="white"/>
</svg>`;

function PosterCanvas({ config, avatarSrc, frameRef, avatarSize = 108 }) {
  const { role, name, city, state, tagline, pin, frame } = config;
  const isCircle = frame === 'circle';
  const avTop = 68;
  const nameTop = avTop + avatarSize + 18;
  const divTop = nameTop + (role === 'tasker' && (city || state) ? 56 : 40);
  const tagTop = divTop + 12;

  return (
    <div ref={frameRef} style={{
      width: SIZE, height: SIZE,
      position: 'relative', overflow: 'hidden', flexShrink: 0,
      background: 'linear-gradient(145deg,#0f0720 0%,#1e0d33 40%,#120a20 70%,#0f0720 100%)',
      fontFamily: "'Plus Jakarta Sans',-apple-system,sans-serif",
    }}>
      {/* Glow blobs */}
      <div style={{ position:'absolute', top:-80, right:-60, width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,45,98,0.28) 0%,transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-60, left:-60, width:240, height:240, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.2) 0%,transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:'40%', left:'50%', transform:'translate(-50%,-50%)', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,45,98,0.06) 0%,transparent 70%)', pointerEvents:'none' }} />

      {/* Background decorative icons */}
      <div style={{ position:'absolute', inset:0 }} dangerouslySetInnerHTML={{ __html: BG_ICONS }} />

      {/* Logo top-right */}
      <div style={{ position:'absolute', top:20, right:20, display:'flex', alignItems:'center', gap:8, zIndex:2 }}>
        <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#ff2d62,#c41445)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="17" height="17" viewBox="0 0 14 14" fill="none">
            <rect width="14" height="4.5" rx="2" fill="white"/>
            <rect x="4.8" y="4.5" width="4.4" height="7.5" rx="2" fill="white"/>
            <path d="M2 13L5 10.5L11 6.5" stroke="#00C37E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{ color:'white', fontWeight:900, fontSize:15, letterSpacing:'-0.02em' }}>Taskeeu</span>
      </div>

      {/* Badge top-left */}
      <div style={{ position:'absolute', top:22, left:20, background:'rgba(255,45,98,0.2)', border:'1px solid rgba(255,45,98,0.45)', color:'#ff8fab', fontSize:10, fontWeight:700, padding:'4px 10px', borderRadius:20, letterSpacing:'0.07em', textTransform:'uppercase', zIndex:2 }}>
        {role === 'tasker' ? 'Verified Tasker' : 'Ambassador'}
      </div>

      {/* Avatar */}
      <div style={{ position:'absolute', top:avTop, left:'50%', transform:'translateX(-50%)', zIndex:2 }}>
        <div style={{
          width:avatarSize, height:avatarSize,
          borderRadius: isCircle ? '50%' : Math.round(avatarSize * 0.17),
          border:'3px solid #ff2d62', overflow:'hidden',
          background:'rgba(255,45,98,0.15)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:`0 0 0 6px rgba(255,45,98,0.12), 0 8px 32px rgba(255,45,98,0.3)`,
          transition:'border-radius 0.3s ease, width 0.2s, height 0.2s',
        }}>
          {avatarSrc
            ? <img src={avatarSrc} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} crossOrigin="anonymous" />
            : <span style={{ fontSize: Math.round(avatarSize * 0.41), fontWeight:900, color:'#ff2d62' }}>{(name||'T')[0].toUpperCase()}</span>
          }
        </div>
      </div>

      {/* Name */}
      <div style={{ position:'absolute', top:nameTop, left:0, right:0, textAlign:'center', padding:'0 24px', zIndex:2 }}>
        <p style={{ color:'white', fontWeight:900, fontSize:20, margin:0, letterSpacing:'-0.02em', lineHeight:1.2 }}>
          {name || 'Your Name'}
        </p>
        {role === 'tasker' && (city||state) && (
          <p style={{ color:'rgba(255,255,255,0.55)', fontSize:12, fontWeight:600, margin:'5px 0 0', letterSpacing:'0.03em' }}>
            {[city,state].filter(Boolean).join(', ')}
          </p>
        )}
      </div>

      {/* Divider */}
      <div style={{ position:'absolute', top:divTop, left:44, right:44, height:1, background:'linear-gradient(90deg,transparent,rgba(255,45,98,0.55),transparent)', zIndex:2 }} />

      {/* Tagline */}
      <div style={{ position:'absolute', top:tagTop, left:0, right:0, padding:'0 32px', zIndex:2, textAlign:'center' }}>
        <p style={{ color:'rgba(255,255,255,0.9)', fontSize:14, fontWeight:600, margin:0, lineHeight:1.7 }}>
          {tagline}
        </p>
      </div>

      {/* Requester PIN block */}
      {role === 'requester' && pin && (
        <div style={{ position:'absolute', top:318, left:28, right:28, zIndex:2, background:'rgba(255,45,98,0.13)', border:'1px solid rgba(255,45,98,0.38)', borderRadius:12, padding:'8px 16px', textAlign:'center' }}>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:8.5, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', margin:'0 0 3px' }}>Use my code when signing up</p>
          <p style={{ color:'#ff6b8f', fontSize:26, fontWeight:900, letterSpacing:'0.22em', margin:0 }}>{pin}</p>
        </div>
      )}

      {/* Tasker: stats row to fill empty space */}
      {role === 'tasker' && (
        <div style={{ position:'absolute', top:340, left:28, right:28, zIndex:2, display:'flex', gap:12 }}>
          {[
            { svg:'<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>', label:'Fast delivery' },
            { svg:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>', label:'Escrow safe' },
            { svg:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>', label:'Verified' },
          ].map(({ svg, label }) => (
            <div key={label} style={{ flex:1, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 6px', textAlign:'center' }}>
              <div style={{ margin:'0 auto 3px', width:14, height:14 }} dangerouslySetInnerHTML={{ __html: svg }} />
              <p style={{ margin:0, color:'rgba(255,255,255,0.7)', fontSize:9.5, fontWeight:700, letterSpacing:'0.04em' }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* CTA button */}
      <div style={{ position:'absolute', bottom:30, left:28, right:28, zIndex:2 }}>
        <div style={{
          background: role === 'tasker'? 'linear-gradient(135deg,#ff2d62,#c41445)': 'linear-gradient(135deg,#7c3aed,#5b21b6)',
          borderRadius:13, padding:'13px 20px', textAlign:'center',
        }}>
          <p style={{ margin:0, color:'white', fontWeight:900, fontSize:13, letterSpacing:'0.01em' }}>
            {role === 'tasker' ? 'Book me on taskeeu.com' : 'Join me on taskeeu.com'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MarketingPosterTab({ user, profile, role }) {
  const frameRef = useRef(null);       // scaled preview (what user sees)
  const printRef = useRef(null);       // hidden full-size poster (what we download)
  const fileInputRef = useRef(null);
  const [avatarSrc, setAvatarSrc] = useState(user?.avatar_url || null);
  const [frame, setFrame] = useState('circle');
  const [avatarScale, setAvatarScale] = useState(108); // avatar size in px
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const defaultTagline = role === 'tasker'? `I am based in ${profile?.task_city || 'your city'}, ${profile?.task_state || 'Nigeria'}. I handle errands quickly and reliably. DMs open.`
    : 'I outsource my errands on Taskeeu and get things done anywhere in Nigeria. You should too.';

  const [tagline, setTagline] = useState(defaultTagline);
  const [name, setName] = useState(user?.full_name || '');
  const [city, setCity] = useState(profile?.task_city || '');
  const [stateVal, setStateVal] = useState(profile?.task_state || '');

  const pin = user?.referral_pin;
  // Posters are for the outside world, so they always use the public domain,
  // with the tasker's permanent profile link from the server.
  const [taskerPath, setTaskerPath] = useState(null);
  useEffect(() => {
    if (role !== 'tasker') return;
    taskersApi.myProfileLink().then(r => setTaskerPath(r.data?.path || null)).catch(() => {});
  }, [role, user?.id]);
  const profileLink = role === 'tasker'
    ? `${SITE}${taskerPath || (user?.username ? `/tasker/${user.username}` : `/taskers/${user?.id || ''}`)}`
    : `${SITE}/auth?ref=${user?.referral_slug || ''}`;

  const config = { role, name, city, state: stateVal, tagline, pin, frame };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error('Image must be under 8MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => setAvatarSrc(ev.target.result);
    reader.readAsDataURL(file);
  };

  const downloadPoster = useCallback(async () => {
    // IMPORTANT: we capture printRef (the hidden full-size poster at true SIZE px),
    // NOT frameRef (the CSS-scaled preview). This ensures the download matches exactly
    // what the user sees — no drift, no element shifting, no compression artifacts.
    const el = printRef.current;
    if (!el) return;
    setDownloading(true);
    try {
      // Make it briefly visible so html2canvas can render it correctly
      // Element is already positioned offscreen with visibility:hidden
      // Just make it visible for capture
      el.style.visibility = 'visible';

      if (!window.html2canvas) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }

      // Wait one frame for layout
      await new Promise(r => requestAnimationFrame(() => setTimeout(r, 80)));

      const canvas = await window.html2canvas(el, {
        scale: 3,           // 480 * 3 = 1440px output — perfect for IG
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        width: SIZE,
        height: SIZE,
        windowWidth: SIZE,
        windowHeight: SIZE,
      });

      el.style.visibility = 'hidden';

      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png', 1.0);
      a.download = `taskeeu-poster-${role}.png`;
      a.click();
      toast.success('Poster downloaded — share on WhatsApp status, Instagram, Twitter!');
      pwaApi.posterEvent({ event: 'download', role }).catch(() => {});
    } catch (err) {
      console.warn('Download error:', err);
      if (printRef.current) printRef.current.style.visibility = 'hidden';
      toast('Right-click the poster and save as image', { icon: '', duration: 5000 });
    } finally { setDownloading(false); }
  }, [role]);

  const copyLink = () => {
    navigator.clipboard.writeText(profileLink)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        toast.success('Link copied!');
        pwaApi.posterEvent({ event: 'copy_link', role }).catch(() => {});
      })
      .catch(() => toast.error('Could not copy — please copy the link manually'));
  };

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontWeight: 900, fontSize: 21, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.02em' }}>Marketing Poster</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13.5, lineHeight: 1.65 }}>
          {role === 'requester'? 'Create your ambassador poster (Instagram square 1:1). Share on WhatsApp status, Instagram posts, Twitter. When people sign up using your code you earn 10% commission on their completed tasks.': 'Create a poster (Instagram square 1:1) to promote your tasker services. Share on WhatsApp status, Instagram, Twitter — anywhere your potential clients are.'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* ── Editor ── */}
        <div style={{ flex: 1, minWidth: 260, maxWidth: 360 }}>
          <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Avatar upload */}
            <div>
              <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 10 }}>Your photo</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 56, height: 56, overflow: 'hidden', flexShrink: 0,
                  borderRadius: frame === 'circle' ? '50%' : 10,
                  border: '2px solid var(--rose)', background: 'var(--surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'border-radius 0.25s ease',
                }}>
                  {avatarSrc
                    ? <img src={avatarSrc} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <span style={{ fontSize:20, fontWeight:900, color:'var(--rose)' }}>{(name||user?.full_name||'T')[0].toUpperCase()}</span>
                  }
                </div>
                <div>
                  <button onClick={() => fileInputRef.current?.click()}
                    style={{ display:'inline-flex', alignItems:'center', gap:7, background:'var(--surface)', border:'1px solid var(--border-light)', borderRadius:10, padding:'8px 14px', cursor:'pointer', fontWeight:700, fontSize:13, color:'var(--text)' }}>
                    <Upload size={14} /> Upload photo
                  </button>
                  <p style={{ fontSize:11, color:'var(--muted)', marginTop:5 }}>JPG or PNG, max 8MB. Fills frame perfectly.</p>
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display:'none' }} />
            </div>

            {/* Frame toggle */}
            <div>
              <p style={{ fontWeight:700, fontSize:13, color:'var(--text)', marginBottom:8 }}>Photo frame</p>
              <div style={{ display:'flex', gap:8 }}>
                {[['circle','Circle',Circle],['square','Square',Square]].map(([val,label,Icon]) => (
                  <button key={val} onClick={() => setFrame(val)}
                    style={{
                      display:'flex', alignItems:'center', gap:7,
                      padding:'8px 16px', borderRadius:10, cursor:'pointer', fontWeight:700, fontSize:13,
                      background: frame === val ? 'var(--rose)' : 'var(--surface)',
                      color: frame === val ? 'white' : 'var(--text)',
                      border: frame === val ? 'none' : '1px solid var(--border-light)',
                      transition:'all 0.2s',
                    }}>
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Avatar size slider */}
            <div>
              <label style={{ fontWeight:700, fontSize:13, color:'var(--text)', display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span>Photo size</span>
                <span style={{ fontWeight:400, color:'var(--muted)' }}>{avatarScale}px</span>
              </label>
              <input type="range" min={70} max={180} step={5} value={avatarScale}
                onChange={e => setAvatarScale(Number(e.target.value))}
                style={{ width:'100%', accentColor:'var(--rose)' }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--muted)', marginTop:2 }}>
                <span>Small</span><span>Large</span>
              </div>
            </div>

            {/* Name */}
            <div>
              <label style={{ fontWeight:700, fontSize:13, color:'var(--text)', display:'block', marginBottom:6 }}>Display name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="input" placeholder="Your full name" maxLength={36} />
            </div>

            {/* City + state — tasker only */}
            {role === 'tasker' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label style={{ fontWeight:700, fontSize:13, color:'var(--text)', display:'block', marginBottom:6 }}>City</label>
                  <input value={city} onChange={e => setCity(e.target.value)} className="input" placeholder="e.g. Ikeja" maxLength={24} />
                </div>
                <div>
                  <label style={{ fontWeight:700, fontSize:13, color:'var(--text)', display:'block', marginBottom:6 }}>State</label>
                  <input value={stateVal} onChange={e => setStateVal(e.target.value)} className="input" placeholder="e.g. Lagos" maxLength={24} />
                </div>
              </div>
            )}

            {/* Tagline */}
            <div>
              <label style={{ fontWeight:700, fontSize:13, color:'var(--text)', display:'block', marginBottom:6 }}>
                Message <span style={{ fontWeight:400, color:'var(--muted)', fontSize:12 }}>({tagline.length}/130)</span>
              </label>
              <textarea value={tagline} onChange={e => setTagline(e.target.value.slice(0,130))}
                rows={3} className="input" style={{ resize:'vertical' }} />
              <button onClick={() => setTagline(defaultTagline)}
                style={{ fontSize:11, color:'var(--muted)', background:'none', border:'none', cursor:'pointer', padding:'3px 0', display:'flex', alignItems:'center', gap:4, marginTop:3 }}>
                <RefreshCw size={10} /> Reset
              </button>
            </div>

            {/* PIN — requester */}
            {role === 'requester' && (
              <div style={{ background:'#fff0f4', border:'1px solid #fecdd3', borderRadius:12, padding:14 }}>
                <p style={{ fontWeight:800, fontSize:12, color:'#be123c', marginBottom:3 }}>Your 4-pin referral code</p>
                {pin
                  ? <p style={{ fontFamily:'monospace', fontSize:26, fontWeight:900, color:'#ff2d62', letterSpacing:'0.2em', margin:'2px 0' }}>{pin}</p>
                  : <p style={{ fontSize:12, color:'#be123c' }}>Generating… refresh if not shown.</p>}
              </div>
            )}

            {/* Actions */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, paddingTop:2 }}>
              <button onClick={downloadPoster} disabled={downloading} className="btn-primary" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'12px 0' }}>
                <Download size={15} /> {downloading ? 'Preparing…' : 'Download poster (PNG)'}
              </button>
            </div>
          </div>

          {/* Profile link card */}
          <div className="card" style={{ padding:18, marginTop:14 }}>
            <p style={{ fontWeight:800, fontSize:13, color:'var(--text)', marginBottom:10 }}>
              {role === 'tasker' ? 'Your Taskeeu profile link' : 'Your referral link'}
            </p>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div style={{ flex:1, background:'var(--surface)', border:'1px solid var(--border-light)', borderRadius:10, padding:'9px 12px', fontSize:12, color:'var(--muted)', wordBreak:'break-all', lineHeight:1.5, fontFamily:'monospace' }}>
                {profileLink}
              </div>
              <button onClick={copyLink}
                style={{ flexShrink:0, display:'flex', alignItems:'center', gap:6, background: copied ? '#f0fdf4' : 'var(--surface)', border:`1px solid ${copied ? '#86efac' : 'var(--border-light)'}`, borderRadius:10, padding:'9px 14px', cursor:'pointer', fontWeight:700, fontSize:13, color: copied ? '#16a34a' : 'var(--text)', transition:'all 0.2s' }}>
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p style={{ fontSize:11, color:'var(--muted)', marginTop:8, lineHeight:1.5 }}>
              {role === 'tasker'? 'Share on WhatsApp bio, Instagram, LinkedIn. Clients can book you directly.': 'Share anywhere. When people sign up through it you earn commission.'}
            </p>
          </div>
        </div>

        {/* ── Live poster preview ── */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.07em', margin:0 }}>Live preview — 1:1 IG square</p>
          <div style={{ width:360, height:360, position:'relative', overflow:'hidden', borderRadius:16, flexShrink:0, background:'#0f0720' }}>
            <div style={{ position:'absolute', top:0, left:0, transform:`scale(${360/SIZE})`, transformOrigin:'top left' }}>
              <PosterCanvas config={config} avatarSrc={avatarSrc} frameRef={frameRef} avatarSize={avatarScale} />
            </div>
          </div>
          <p style={{ fontSize:11.5, color:'var(--muted)', textAlign:'center', maxWidth:320, lineHeight:1.5 }}>
            Downloaded PNG is 1440 x 1440px. Perfect for Instagram posts, WhatsApp status, and Twitter.
          </p>
        </div>
      </div>

      {/* Hidden full-size poster for pixel-perfect download.
          Must use visibility:hidden NOT display:none — html2canvas cannot capture
          display:none elements (they have no layout), causing blank downloads. */}
      <div style={{ position:'fixed', top:'-9999px', left:'-9999px', visibility:'hidden', zIndex:-1, pointerEvents:'none' }}>
        <PosterCanvas config={config} avatarSrc={avatarSrc} frameRef={printRef} avatarSize={avatarScale} />
      </div>
    </div>
  );
}
