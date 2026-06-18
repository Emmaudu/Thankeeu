import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';

/* ─── Fonts ──────────────────────────────────────────────────────────────── */
const FONT_INJECT = `
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Patrick+Hand&family=Architects+Daughter&family=Indie+Flower&family=Shadows+Into+Light&family=Coming+Soon&family=Kalam:wght@400;700&family=Permanent+Marker&family=Dancing+Script:wght@400;700&family=Courgette&display=swap');
`;

const HANDWRITTEN = [
  { id: 'caveat',      family: "'Caveat', cursive",              size: '1.25rem', lh: '1.6' },
  { id: 'patrick',    family: "'Patrick Hand', cursive",         size: '1.1rem',  lh: '1.65' },
  { id: 'architects', family: "'Architects Daughter', cursive",  size: '1rem',    lh: '1.65' },
  { id: 'indie',      family: "'Indie Flower', cursive",         size: '1.1rem',  lh: '1.65' },
  { id: 'shadows',    family: "'Shadows Into Light', cursive",   size: '1.1rem',  lh: '1.7' },
  { id: 'kalam',      family: "'Kalam', cursive",                size: '1.15rem', lh: '1.6' },
  { id: 'marker',     family: "'Permanent Marker', cursive",     size: '0.95rem', lh: '1.7' },
  { id: 'dancing',    family: "'Dancing Script', cursive",       size: '1.2rem',  lh: '1.65' },
  { id: 'courgette',  family: "'Courgette', cursive",            size: '1rem',    lh: '1.65' },
];

/* ─── Data — Nigerian office team, farewell for Chisom ───────────────────── */
const MESSAGES = [
  {
    id: 1, name: 'Adaeze O.', font: 'caveat', color: '#1e3a5f',
    text: 'Chisom! Working with you for 3 years has been the highlight of my career here. Your energy, your ideas, your laugh in the open office — this place will feel different without you. Wishing you all the best at the new job! 🎉',
    media: { type: 'gif', url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif' },
    bgColor: '#f0f4ff',
  },
  {
    id: 2, name: 'Emeka T.', font: 'patrick', color: '#1a1035',
    text: 'I still remember the day you walked in with those slides and just owned the entire room. Three years later and you haven\'t stopped being that person. Go show the world what we already know. Good luck Chisom, you will be missed a lot. You\'ll also be a star. Adios xxxx',
    media: { type: 'photo', url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80' },
    bgColor: '#fff8f0',
  },
  {
    id: 3, name: 'Kemi B.', font: 'architects', color: '#1e3a5f',
    text: 'Enjoy your travels and new job Chisom, here\'s a beautiful place. I hope you see many more like it. All the best 🔥',
    media: { type: 'photo', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80' },
    bgColor: '#f0fff8',
  },
  {
    id: 4, name: 'Jimmy P.', font: 'kalam', color: '#3d1a6e',
    text: 'My favourite coffee bud! What am I gonna do without you 😭! All the very best at the new place, take care!',
    media: { type: 'photo', url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80' },
    bgColor: '#1e1e3e', dark: true,
  },
  {
    id: 5, name: 'Tunde A.', font: 'indie', color: '#1e3a5f',
    text: 'Dear Chisom, can\'t believe you\'re going, but I know adventure calls you! Enjoy every moment of the new chapter. The team won\'t be the same without your morning energy!',
    media: { type: 'gif', url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif' },
    bgColor: '#fff0f5',
  },
  {
    id: 6, name: 'Fatima M.', font: 'shadows', color: '#1e3a5f',
    text: 'YOU\'RE SIMPLY THE BEST! Three years, a hundred presentations, one unforgettable farewell party. Go conquer the world Chisom!',
    media: { type: 'gif', url: 'https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif' },
    bgColor: '#f5f0ff',
    bigText: true,
  },
  {
    id: 7, name: 'Dr. Nkechi E.', font: 'dancing', color: '#1a3d1a',
    text: 'Watching you grow from a brilliant newcomer to a leader who shapes this organisation has been one of the privileges of my career. You are not just talented — you make every space more human. Go and be great! 🌟',
    media: null,
    bgColor: '#f0fff4',
  },
  {
    id: 8, name: 'Victor O.', font: 'caveat', color: '#3d1a00',
    text: 'Happy farewell to the most diplomatically skilled human I have ever encountered. Contract negotiations, restructuring communications, that town hall in March — you always delivered. This is going to be extraordinary for you.',
    media: { type: 'gif', url: 'https://media.giphy.com/media/3o7abGQa0aRJUurpII/giphy.gif' },
    bgColor: '#fffbf0',
  },
  {
    id: 9, name: 'Blessing O.', font: 'kalam', color: '#1e3a5f',
    text: 'THANK YOU FOR BEING AWESOME CHISOM. I LEARNED A LOT FROM YOU DURING MY INTERNSHIP. I WISH YOU THE BEST OF LUCK. PLEASE KEEP IN TOUCH! 🐱',
    media: { type: 'photo', url: 'https://images.unsplash.com/photo-1516571748831-5d81767b788d?w=600&q=80' },
    bgColor: '#f0f8ff',
    allCaps: true,
  },
  {
    id: 10, name: 'Remi F.', font: 'patrick', color: '#1e1a3e',
    text: 'You expand the possible. Every room you enter leaves thinking bigger. Go show the world.',
    media: { type: 'photo', url: 'https://images.unsplash.com/photo-1536936459024-2cded18fce68?w=600&q=80' },
    bgColor: '#fdf0ff',
  },
  {
    id: 11, name: 'Olu A.', font: 'architects', color: '#1e3a5f',
    text: 'Happy farewell to the person who actually reads the IT security memos! Working with you has been a masterclass in excellence with humility. Good luck! 😄',
    media: null,
    bgColor: '#fff8f0',
  },
  {
    id: 12, name: 'Amara O.', font: 'indie', color: '#1a3d1a',
    text: 'You were the first senior person to sit with me and just talk. That conversation gave me more confidence than any training ever could. Thank you Chisom. 🌸',
    media: null,
    bgColor: '#f0fff4',
  },
];

const GIFT_TOTAL = '₦487,500';
const CONTRIBUTORS = 34;

/* ─── Thankbox-style background with hot air balloons ───────────────────── */
const BALLOONS = [
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Hot_air_balloon_with_colorful_patterns.jpg/240px-Hot_air_balloon_with_colorful_patterns.jpg', x: '42%', y: '-10%', size: 180, rot: -3 },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Hot_Air_Balloon_festival_Temecula.jpg/240px-Hot_Air_Balloon_festival_Temecula.jpg', x: '72%', y: '-8%', size: 140, rot: 2 },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Hot_air_balloon_rides.jpg/240px-Hot_air_balloon_rides.jpg', x: '8%', y: '30%', size: 120, rot: -5 },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const getFont = (id) => HANDWRITTEN.find(f => f.id === id) || HANDWRITTEN[0];

/* ─── Board tile ─────────────────────────────────────────────────────────── */
function BoardTile({ msg }) {
  const f = getFont(msg.font);
  return (
    <div style={{
      background: msg.bgColor || '#fff',
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 16,
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      breakInside: 'avoid',
    }}>
      {/* Media first (like Thankbox) */}
      {msg.media?.type === 'gif' && (
        <div style={{ position: 'relative' }}>
          <img src={msg.media.url} alt="" style={{ width: '100%', display: 'block', maxHeight: 220, objectFit: 'cover' }} loading="lazy" />
          {msg.bigText && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '8px 12px',
              background: 'rgba(0,0,0,0.55)',
              fontFamily: f.family, color: '#fff',
              fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.05em',
            }}>
              {msg.text.split('!')[0].toUpperCase()}!
            </div>
          )}
        </div>
      )}
      {msg.media?.type === 'photo' && (
        <img src={msg.media.url} alt="" style={{ width: '100%', display: 'block', maxHeight: 200, objectFit: 'cover' }} loading="lazy" />
      )}

      {/* Message body */}
      <div style={{ padding: '16px 18px 14px' }}>
        {!msg.bigText && (
          <p style={{
            fontFamily: f.family, fontSize: f.size, lineHeight: f.lh,
            color: msg.dark ? '#e0d8ff' : msg.color || '#1e3a5f',
            margin: '0 0 10px',
            textTransform: msg.allCaps ? 'uppercase' : 'none',
            fontWeight: msg.allCaps ? 700 : 400,
            letterSpacing: msg.allCaps ? '0.04em' : 'normal',
          }}>
            {msg.text}
          </p>
        )}
        {msg.bigText && (
          <p style={{
            fontFamily: f.family, fontSize: f.size, lineHeight: f.lh,
            color: msg.color || '#1e3a5f', margin: '0 0 10px',
          }}>
            {msg.text.split('!').slice(1).join('!').trim()}
          </p>
        )}
        <p style={{
          fontFamily: f.family, fontSize: '1.05rem', fontWeight: 700,
          color: msg.dark ? '#a89cff' : '#374151', margin: 0,
          textAlign: 'right',
        }}>
          {msg.name}
        </p>
      </div>
    </div>
  );
}

/* ─── Card view (2-column book) ──────────────────────────────────────────── */
function CardView() {
  const [page, setPage] = useState(0);
  const pairs = [];
  for (let i = 0; i < MESSAGES.length; i += 2) {
    pairs.push([MESSAGES[i], MESSAGES[i + 1] || null]);
  }
  const total = pairs.length;
  const [left, right] = pairs[page] || [null, null];

  const CardPage = ({ msg }) => {
    if (!msg) return <div style={{ flex: 1, background: '#fff' }} />;
    const f = getFont(msg.font);
    return (
      <div style={{
        flex: 1, background: '#fff', padding: '32px 40px 28px',
        display: 'flex', flexDirection: 'column', gap: 16,
        minHeight: 560,
      }}>
        {msg.media?.type === 'gif' && (
          <div style={{ borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
            <img src={msg.media.url} alt="" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
            {msg.bigText && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 12px', background: 'rgba(0,0,0,0.55)', fontFamily: f.family, color: '#fff', fontWeight: 700, letterSpacing: '0.08em' }}>
                {msg.text.split('!')[0].toUpperCase()}!
              </div>
            )}
          </div>
        )}
        {msg.media?.type === 'photo' && (
          <div style={{ borderRadius: 12, overflow: 'hidden' }}>
            <img src={msg.media.url} alt="" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
          </div>
        )}
        <p style={{
          fontFamily: f.family, fontSize: f.size, lineHeight: f.lh,
          color: msg.color || '#1e3a5f', flex: 1, margin: 0,
          fontStyle: 'italic',
          textTransform: msg.allCaps ? 'uppercase' : 'none',
          fontWeight: msg.allCaps ? 700 : 400,
          letterSpacing: msg.allCaps ? '0.04em' : 'normal',
        }}>
          {msg.bigText ? msg.text.split('!').slice(1).join('!').trim() : msg.text}
        </p>
        <p style={{ fontFamily: f.family, fontWeight: 700, fontSize: '1.1rem', color: '#374151', margin: 0, textAlign: 'right' }}>
          {msg.name}
        </p>
      </div>
    );
  };

  return (
    <div>
      {/* Book */}
      <div style={{
        display: 'flex', maxWidth: 900, margin: '0 auto',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 8px 48px rgba(0,0,0,0.18)',
        background: '#fff',
        border: '1px solid rgba(255,255,255,0.5)',
        minHeight: 560,
      }}>
        <CardPage msg={left} />
        {/* Spine divider */}
        <div style={{ width: 1, background: 'rgba(0,0,0,0.06)', flexShrink: 0 }} />
        <CardPage msg={right} />
      </div>

      {/* Bottom bar — exactly like Thankbox Image 2 */}
      <div style={{
        position: 'sticky', bottom: 0,
        background: 'rgba(30,30,62,0.92)', backdropFilter: 'blur(12px)',
        borderRadius: 40, margin: '20px auto 0', maxWidth: 760,
        display: 'flex', alignItems: 'center', gap: 0,
        padding: '10px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        {/* Claim gift */}
        <button style={{
          background: 'linear-gradient(135deg,#11C5A0,#0DA888)',
          color: '#fff', border: 'none', borderRadius: 24,
          padding: '10px 20px', fontFamily: 'Plus Jakarta Sans,sans-serif',
          fontWeight: 700, fontSize: 14, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 7, marginRight: 10,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          🎁 Claim gift
        </button>

        {/* Share */}
        <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 24, padding: '9px 16px', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 600, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 6, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <Icon name="Share" size={14} style={{ color: '#fff' }} /> Share
        </button>
        {/* Download */}
        <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 24, padding: '9px 16px', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 600, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 6, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <Icon name="Download" size={14} style={{ color: '#fff' }} /> Download
        </button>
        {/* Reply */}
        <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 24, padding: '9px 16px', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 600, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 12, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <Icon name="Reply" size={14} style={{ color: '#fff' }} /> Reply
        </button>

        {/* Page slider */}
        <Icon name="ChevronLeft" size={18} style={{ color: '#fff', cursor: 'pointer', flexShrink: 0 }}
          onClick={() => setPage(p => Math.max(0, p - 1))} />
        <input type="range" min={0} max={total - 1} value={page}
          onChange={e => setPage(Number(e.target.value))}
          style={{ flex: 1, accentColor: '#11C5A0', margin: '0 8px' }} />
        <Icon name="ChevronRight" size={18} style={{ color: '#fff', cursor: 'pointer', flexShrink: 0 }}
          onClick={() => setPage(p => Math.min(total - 1, p + 1))} />
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function SampleCard() {
  const [view, setView] = useState('board'); // 'board' | 'card'

  return (
    <>
      <style>{FONT_INJECT}</style>
      <Navbar />

      {/* ── Top action bar — exactly Thankbox style ── */}
      <div style={{
        background: '#fff', borderBottom: '1.5px solid #e8e8f0',
        position: 'sticky', top: 64, zIndex: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '12px 20px', gap: 8,
      }}>
        {/* Add a message */}
        <Link to="/sign/sample-card"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            border: '2px solid #11C5A0', background: '#fff',
            color: '#11C5A0', borderRadius: 24, padding: '9px 20px',
            fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 700, fontSize: 14,
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#11C5A0' }}>+</span>
          Add a message
        </Link>

        {/* Board / Card toggle */}
        <div style={{ display: 'flex', background: '#f0f0f8', borderRadius: 24, padding: 4, gap: 2 }}>
          <button onClick={() => setView('board')}
            style={{
              padding: '8px 20px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 700, fontSize: 14,
              background: view === 'board' ? 'linear-gradient(135deg,#6C5CE7,#5B4BDF)' : 'transparent',
              color: view === 'board' ? '#fff' : '#6B7280',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s',
            }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="0" y="0" width="7" height="7" rx="1.5"/><rect x="9" y="0" width="7" height="7" rx="1.5"/>
              <rect x="0" y="9" width="7" height="7" rx="1.5"/><rect x="9" y="9" width="7" height="7" rx="1.5"/>
            </svg>
            Board
          </button>
          <button onClick={() => setView('card')}
            style={{
              padding: '8px 20px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 700, fontSize: 14,
              background: view === 'card' ? 'linear-gradient(135deg,#6C5CE7,#5B4BDF)' : 'transparent',
              color: view === 'card' ? '#fff' : '#6B7280',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s',
            }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="0" y="0" width="7" height="16" rx="1.5"/><rect x="9" y="0" width="7" height="16" rx="1.5"/>
            </svg>
            Card
          </button>
        </div>
      </div>

      {/* ── Main canvas — Thankbox sky-blue with balloons ── */}
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #5DADE2 0%, #7FB3D3 40%, #A9CCE3 100%)',
        position: 'relative', overflow: 'hidden',
      }}>

        {/* Hot air balloons — exact Thankbox positioning */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          {/* Centre balloon (largest) */}
          <div style={{
            position: 'absolute', left: '44%', top: '-40px', transform: 'translateX(-50%)',
            width: 200, height: 260, zIndex: 1,
          }}>
            <svg viewBox="0 0 200 260" style={{ width: '100%', height: '100%' }}>
              <ellipse cx="100" cy="100" rx="90" ry="100" fill="#C03A8C" opacity="0.92"/>
              {/* Stripes */}
              {[0,1,2,3,4].map(i => (
                <ellipse key={i} cx="100" cy="100" rx="18" ry="100" fill="rgba(255,255,255,0.12)" transform={`rotate(${i*36} 100 100)`}/>
              ))}
              {/* Basket */}
              <rect x="80" y="205" width="40" height="22" rx="5" fill="#8B5E3C"/>
              <line x1="100" y1="200" x2="80" y2="205" stroke="#8B5E3C" strokeWidth="2"/>
              <line x1="100" y1="200" x2="120" y2="205" stroke="#8B5E3C" strokeWidth="2"/>
            </svg>
          </div>
          {/* Right balloon */}
          <div style={{ position: 'absolute', right: '8%', top: '-20px', width: 140 }}>
            <svg viewBox="0 0 140 180" style={{ width: '100%', height: '100%' }}>
              <ellipse cx="70" cy="70" rx="62" ry="70" fill="#E8B4C8" opacity="0.9"/>
              {[0,1,2,3].map(i => (
                <ellipse key={i} cx="70" cy="70" rx="16" ry="70" fill="rgba(255,255,255,0.15)" transform={`rotate(${i*45} 70 70)`}/>
              ))}
              <rect x="54" y="143" width="32" height="16" rx="4" fill="#8B5E3C"/>
              <line x1="70" y1="140" x2="54" y2="143" stroke="#8B5E3C" strokeWidth="1.5"/>
              <line x1="70" y1="140" x2="86" y2="143" stroke="#8B5E3C" strokeWidth="1.5"/>
            </svg>
          </div>
          {/* Left small balloon */}
          <div style={{ position: 'absolute', left: '2%', top: '20%', width: 100 }}>
            <svg viewBox="0 0 100 130" style={{ width: '100%', height: '100%' }}>
              <ellipse cx="50" cy="50" rx="44" ry="50" fill="#F4A460" opacity="0.85"/>
              {[0,1,2].map(i => (
                <ellipse key={i} cx="50" cy="50" rx="14" ry="50" fill="rgba(255,255,255,0.12)" transform={`rotate(${i*60} 50 50)`}/>
              ))}
              <rect x="38" y="102" width="24" height="13" rx="3" fill="#8B5E3C"/>
            </svg>
          </div>
          {/* Top right small balloon */}
          <div style={{ position: 'absolute', right: '24%', top: '-10px', width: 90 }}>
            <svg viewBox="0 0 90 120" style={{ width: '100%', height: '100%' }}>
              <ellipse cx="45" cy="45" rx="40" ry="45" fill="#7EC8E3" opacity="0.88"/>
              {[0,1].map(i => (
                <ellipse key={i} cx="45" cy="45" rx="12" ry="45" fill="rgba(255,255,255,0.15)" transform={`rotate(${i*90} 45 45)`}/>
              ))}
              <rect x="34" y="92" width="22" height="11" rx="3" fill="#8B5E3C"/>
            </svg>
          </div>
        </div>

        {/* ── Hero header — Thankbox style ── */}
        <div style={{ position: 'relative', zIndex: 2, paddingTop: 36, paddingBottom: 20, textAlign: 'left', paddingLeft: 40 }}>
          {/* Recipient avatar + name */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '12px 20px' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
              👋
            </div>
            <div>
              <p style={{ fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 700, fontSize: 18, color: '#fff', margin: 0, lineHeight: 1.2 }}>
                Chisom Obi,
              </p>
              <p style={{ fontFamily: "'Caveat', cursive", fontSize: 26, fontWeight: 700, color: '#FFE066', margin: 0, lineHeight: 1.1 }}>
                Farewell, We'll Miss You 🎉
              </p>
            </div>
          </div>

          {/* From badge */}
          <div style={{ marginTop: 8, paddingLeft: 8 }}>
            <span style={{ fontFamily: 'Plus Jakarta Sans,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
              From The Nexus Technologies Team
              <span style={{ marginLeft: 6, fontSize: 16 }}>💚</span>
            </span>
          </div>
        </div>

        {/* ── Claim gift CTA (floats over content, top-centre) ── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 24, position: 'relative', zIndex: 3 }}>
          <button style={{
            background: 'linear-gradient(135deg,#11C5A0,#0DA888)', color: '#fff',
            border: 'none', borderRadius: 28, padding: '11px 24px',
            fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 700, fontSize: 15,
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(13,168,136,0.5)',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            🎁 Claim gift
          </button>
          {/* Action icon buttons */}
          {[{ icon: 'Share', title: 'Share' }, { icon: 'Download', title: 'Download' }, { icon: 'Reply', title: 'Reply' }].map(b => (
            <button key={b.icon} title={b.title} style={{
              width: 44, height: 44, borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.85)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}>
              <Icon name={b.icon} size={18} style={{ color: '#374151' }} />
            </button>
          ))}
        </div>

        {/* ── Board / Card content ── */}
        <div style={{ position: 'relative', zIndex: 2, padding: '0 24px 60px' }}>
          {view === 'board' ? (
            /* Masonry board — exactly like Thankbox Image 1 */
            <div style={{
              columns: 'var(--board-cols, 5) 200px',
              columnGap: 14,
              maxWidth: 1500, margin: '0 auto',
            }}>
              <style>{`
                @media (max-width: 1400px) { :root { --board-cols: 4; } }
                @media (max-width: 1100px) { :root { --board-cols: 3; } }
                @media (max-width: 720px)  { :root { --board-cols: 2; } }
                @media (max-width: 480px)  { :root { --board-cols: 1; } }
              `}</style>
              {/* Info tile (first tile — Thankbox style) */}
              <div style={{
                background: '#fffde7', borderRadius: 16,
                padding: '18px 20px', marginBottom: 16,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                breakInside: 'avoid', fontSize: 14, color: '#374151',
                lineHeight: 1.6,
              }}>
                <p style={{ margin: '0 0 8px', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <span style={{ color: '#3B82F6', fontWeight: 700, flexShrink: 0 }}>ℹ</span>
                  Your group can attach photos and GIFs to their messages.
                </p>
                <p style={{ margin: '0 0 6px' }}>To be even more personalised you can choose a Premium Thankeeu card that unlocks adding videos and extra custom fonts!</p>
                <p style={{ margin: 0, fontWeight: 700, color: '#6C5CE7', fontFamily: "'Caveat', cursive", fontSize: 16 }}>Thankeeu Sample</p>
              </div>

              {MESSAGES.map(msg => <BoardTile key={msg.id} msg={msg} />)}
            </div>
          ) : (
            <CardView />
          )}
        </div>
      </div>

      {/* ── CTA section ── */}
      <div style={{ background: '#fff', padding: '60px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 800, fontSize: 28, color: '#1A1035', marginBottom: 8 }}>
          Create a card like this for someone special
        </h2>
        <p style={{ color: '#6B7280', marginBottom: 32, fontSize: 16 }}>
          Beautiful group cards with gift pots. From ₦5,000. Pay only when you send.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/create-card" style={{
            background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', color: '#fff',
            padding: '14px 32px', borderRadius: 24,
            fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 700, fontSize: 16,
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            ✨ Create a card — it's free
          </Link>
          <Link to="/signup" style={{
            background: '#F5F0FF', color: '#7C3AED',
            border: '2px solid #DDD6FE', padding: '14px 32px', borderRadius: 24,
            fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 700, fontSize: 16,
            textDecoration: 'none',
          }}>
            Get started free →
          </Link>
        </div>
      </div>

      <Footer />
    </>
  );
}
