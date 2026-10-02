/**
 * CardKeepsake — the group card laid out as a printed booklet, for "Download
 * PDF". Cream paper, A5 pages, in this order:
 *
 *   front cover (the card's own cover, full page)
 *   dedication page (who it is for, how many people signed)
 *   message pages (one or two messages each, never cut across pages)
 *   back cover (every signer's name)
 *
 * The browser's "Save as PDF" turns it into a file. Page margins are zero, so
 * no URL, date or page header is printed on it, and nothing is stamped on the
 * pages: no logo, no watermark.
 */
import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import CardCoverPreview from './CardCoverPreview';
import Icon from './ui/Icon';
import { getFontStyle } from '../utils/cardDesigns';

const PAPER = '#FBF6EA';      // cream
const PAPER_EDGE = '#EFE6D2';
const INK = '#2A2433';
const SOFT_INK = '#6B6275';

const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Great+Vibes&family=Caveat:wght@500;600&family=Fraunces:wght@500;600&family=Plus+Jakarta+Sans:wght@500;700&display=swap';

const PRINT_CSS = `
@page { size: 148mm 210mm; margin: 0; }
.ks-page {
  width: 148mm; height: 210mm; background: ${PAPER}; color: ${INK};
  position: relative; overflow: hidden; box-sizing: border-box;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.ks-serif { font-family: 'Cormorant Garamond', Georgia, serif; }
@media screen {
  .ks-page { margin: 0 auto 28px; box-shadow: 0 6px 30px rgba(40,30,20,0.18); border: 1px solid ${PAPER_EDGE}; }
}
@media print {
  html, body { background: ${PAPER} !important; }
  body.ks-printing > *:not(#ks-portal) { display: none !important; }
  #ks-portal { position: static !important; inset: auto !important; overflow: visible !important; background: none !important; }
  #ks-portal .ks-chrome { display: none !important; }
  #ks-portal .ks-scroll { padding: 0 !important; overflow: visible !important; height: auto !important; }
  .ks-page { margin: 0; box-shadow: none; border: 0; break-after: page; page-break-after: always; }
  .ks-page:last-child { break-after: auto; page-break-after: auto; }
}
`;

const galleryOf = (m) => {
  let g = m.media_gallery;
  if (typeof g === 'string') { try { g = JSON.parse(g); } catch { g = []; } }
  const list = [];
  if (m.media_url) list.push({ url: m.media_url, type: m.media_type || 'image' });
  if (Array.isArray(g)) for (const x of g) if (x?.media_url && x.media_url !== m.media_url) list.push({ url: x.media_url, type: x.media_type || 'image' });
  return list;
};

// Rough line count at a given number of characters per line, counting line breaks.
const linesOf = (text, perLine) => String(text || '').split('\n').reduce((n, l) => n + Math.max(1, Math.ceil(l.length / perLine)), 0);

/** One or two messages per page: anything that would not fit in half a page gets a page to itself. */
export function paginateMessages(messages) {
  const pages = [];
  let half = null;
  for (const m of messages) {
    const photos = galleryOf(m).filter(x => x.type === 'image' || x.type === 'gif').length;
    // Half a page holds about 12 lines of text, or 6 next to a photo.
    const full = photos > 1 || linesOf(m.content, 46) > (photos ? 6 : 12);
    // A long message gets its own page; a short one waiting for a partner keeps waiting.
    if (full) { pages.push([m]); continue; }
    if (half) { pages.push([half, m]); half = null; } else half = m;
  }
  if (half) pages.push([half]);
  return pages;
}

function MessageBlock({ m, roomy }) {
  const media = galleryOf(m);
  // Very long messages keep the page for the words; their photos stay on the online card.
  const longText = linesOf(m.content, 52);
  const photos = media.filter(x => x.type === 'image' || x.type === 'gif').slice(0, !roomy ? 1 : longText > 26 ? 0 : longText > 14 ? 1 : 2);
  const voice = media.some(x => x.type === 'voice');
  const video = media.some(x => x.type === 'video');
  const text = String(m.content || '');
  const family = getFontStyle(m.font_style).family;
  const size = longText > 30 ? 13 : longText > 22 ? 14.5 : longText > 14 ? 16.5 : roomy ? 21 : 19;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', minHeight: 0 }}>
      {photos.length > 0 && (
        <div style={{ display: 'flex', gap: '4mm', justifyContent: 'center', marginBottom: '5mm', flexShrink: 0 }}>
          {photos.map(p => (
            <div key={p.url} style={{ background: '#fff', padding: '2.2mm 2.2mm 6mm', boxShadow: '0 1px 4px rgba(0,0,0,0.12)', transform: `rotate(${photos.length > 1 ? (p === photos[0] ? -1.5 : 1.5) : -1}deg)` }}>
              <img src={p.url} alt=""
                style={{ display: 'block', width: photos.length > 1 ? '44mm' : roomy ? '72mm' : '54mm', height: photos.length > 1 ? '44mm' : roomy ? '62mm' : '40mm', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}
      <p style={{ fontFamily: family, fontSize: size, lineHeight: 1.45, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: INK, flex: '0 1 auto', minHeight: 0, overflow: 'hidden', textAlign: text.length < 160 ? 'center' : 'left' }}>{text}</p>
      {m.is_private && (
        <p style={{ margin: '3mm 0 0', fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: SOFT_INK, flexShrink: 0 }}>Private message</p>
      )}
      {(voice || video) && (
        <p style={{ margin: '3mm 0 0', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: SOFT_INK, flexShrink: 0 }}>
          {voice && video ? 'Also left a voice note and a video' : voice ? 'Also left a voice note' : 'Also left a video message'} on the online card
        </p>
      )}
      <p className="ks-serif" style={{ margin: '4mm 0 0', textAlign: 'right', fontSize: 15, fontWeight: 600, fontStyle: 'italic', color: INK, flexShrink: 0 }}>{m.author_name}</p>
    </div>
  );
}

function Pages({ card, messages, coverDesign, coverTextColor }) {
  const pages = useMemo(() => paginateMessages(messages), [messages]);
  const names = messages.map(m => m.author_name).filter(Boolean);
  const occasion = (card.occasion === 'other' && card.custom_occasion ? card.custom_occasion : (card.occasion || '').replace(/_/g, ' '));
  const date = new Date(card.delivered_at || card.send_date || Date.now())
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  // The back cover lists names in columns; very long lists get smaller type.
  const nameSize = names.length > 120 ? 8.5 : names.length > 60 ? 10 : 12;

  return (
    <>
      {/* Front cover */}
      <section className="ks-page">
        <div style={{ position: 'absolute', inset: 0 }}>
          <CardCoverPreview
            design={coverDesign}
            occasionLabel={occasion}
            recipientName={card.recipient_name}
            title={card.title}
            senderName={card.cover_sender}
            coverColor={card.background_color?.startsWith('#') ? card.background_color : undefined}
            textColor={coverTextColor}
            fontFamily={getFontStyle(card.font_style).family}
            layout={card.cover_layout}
            inBook
          />
        </div>
      </section>

      {/* Dedication */}
      <section className="ks-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20mm 16mm' }}>
        <div style={{ width: '18mm', borderTop: `1px solid ${SOFT_INK}`, marginBottom: '8mm' }} />
        <p className="ks-serif" style={{ margin: 0, fontSize: 13, letterSpacing: '0.3em', textTransform: 'uppercase', color: SOFT_INK }}>For</p>
        <p style={{ margin: '3mm 0 0', fontFamily: "'Great Vibes', cursive", fontSize: 52, lineHeight: 1.1, color: INK }}>{card.recipient_name}</p>
        {card.title && <p className="ks-serif" style={{ margin: '6mm 0 0', fontSize: 19, fontStyle: 'italic', color: INK }}>{card.title}</p>}
        <p className="ks-serif" style={{ margin: '10mm 0 0', fontSize: 14, lineHeight: 1.6, color: SOFT_INK, maxWidth: '95mm' }}>
          {names.length === 1 ? 'A message' : `${names.length} messages`} from the people who wanted you to know how much you mean to them.
        </p>
        <p className="ks-serif" style={{ margin: '8mm 0 0', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: SOFT_INK }}>{date}</p>
        <div style={{ width: '18mm', borderTop: `1px solid ${SOFT_INK}`, marginTop: '8mm' }} />
      </section>

      {/* Messages */}
      {pages.map((group, pi) => (
        <section key={pi} className="ks-page" style={{ padding: '16mm 15mm 14mm', display: 'flex', flexDirection: 'column' }}>
          {group.map((m, i) => (
            <div key={m.id || i} style={{
              flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column',
              ...(i === 1 ? { borderTop: `1px solid ${PAPER_EDGE}`, marginTop: '7mm', paddingTop: '7mm' } : {}),
            }}>
              <MessageBlock m={m} roomy={group.length === 1} />
            </div>
          ))}
          <p className="ks-serif" style={{ position: 'absolute', bottom: '7mm', left: 0, right: 0, textAlign: 'center', margin: 0, fontSize: 10, color: SOFT_INK }}>{pi + 3}</p>
        </section>
      ))}

      {/* Back cover */}
      <section className="ks-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '22mm 14mm 18mm', textAlign: 'center' }}>
        <p style={{ margin: 0, fontFamily: "'Great Vibes', cursive", fontSize: 44, color: INK }}>With love,</p>
        <div style={{ width: '18mm', borderTop: `1px solid ${SOFT_INK}`, margin: '6mm 0 8mm' }} />
        <div className="ks-serif" style={{ columnCount: names.length > 12 ? 3 : names.length > 5 ? 2 : 1, columnGap: '8mm', fontSize: nameSize, lineHeight: 1.7, color: INK, width: '100%', overflow: 'hidden', flex: '1 1 auto' }}>
          {names.map((n, i) => <div key={`${n}-${i}`} style={{ breakInside: 'avoid' }}>{n}</div>)}
        </div>
        <p className="ks-serif" style={{ margin: '6mm 0 0', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: SOFT_INK }}>{date}</p>
      </section>
    </>
  );
}

export default function CardKeepsake({ card, messages, coverDesign, coverTextColor, onClose }) {
  // Fonts, print rules, and the body class that hides the rest of the site when printing.
  useEffect(() => {
    if (!document.getElementById('ks-fonts')) {
      const l = document.createElement('link');
      l.id = 'ks-fonts'; l.rel = 'stylesheet'; l.href = FONTS_URL;
      document.head.appendChild(l);
    }
    const st = document.createElement('style');
    st.id = 'ks-print-css'; st.textContent = PRINT_CSS;
    document.head.appendChild(st);
    document.body.classList.add('ks-printing');
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      st.remove();
      document.body.classList.remove('ks-printing');
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const savePdf = async () => {
    // Let fonts and photos finish loading so the PDF has them.
    try { await document.fonts?.ready; } catch { /* ignore */ }
    await Promise.all([...document.querySelectorAll('#ks-portal img')].map(img => (img.complete ? null : new Promise(r => { img.onload = r; img.onerror = r; }))));
    const prevTitle = document.title;
    document.title = `${card.recipient_name || 'Group'} card`.replace(/[\\/:*?"<>|]/g, '');
    window.print();
    setTimeout(() => { document.title = prevTitle; }, 1000);
  };

  return createPortal(
    <div id="ks-portal" role="dialog" aria-modal="true" aria-label="Download the card as a PDF"
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#E9E3D6', display: 'flex', flexDirection: 'column' }}>
      <div className="ks-chrome" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', background: '#fff', borderBottom: '1px solid #E5DCC8', flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, fontWeight: 800, color: INK }}>Card as a PDF</p>
          <p style={{ margin: 0, fontSize: 12, color: SOFT_INK }}>A5 booklet on cream paper. In the print window choose “Save as PDF” as the destination.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onClose} style={{ minHeight: 0, padding: '9px 14px', borderRadius: 10, border: '1px solid #D9CFBA', background: '#fff', fontWeight: 700, color: INK }}>Close</button>
          <button type="button" onClick={savePdf} style={{ minHeight: 0, padding: '9px 16px', borderRadius: 10, border: 0, background: '#6D28D9', color: '#fff', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="Download" size={16} /> Save as PDF
          </button>
        </div>
      </div>
      <div className="ks-scroll" style={{ flex: 1, overflow: 'auto', padding: '28px 12px' }}>
        <div style={{ transformOrigin: 'top center' }}>
          <Pages card={card} messages={messages} coverDesign={coverDesign} coverTextColor={coverTextColor} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
