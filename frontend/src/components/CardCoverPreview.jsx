import { useRef, useCallback, useState } from 'react';
import Icon from './ui/Icon';
import { CoverArtwork } from '../utils/coverArtwork.jsx';
import { normalizeCoverLayout, COVER_FIELDS } from '../utils/coverLayout';

const withTint = (design, coverColor) => {
  if (!coverColor || !coverColor.startsWith('#')) return design?.background || '#f5f0ff';
  const overlay = `${coverColor}26`;
  return `linear-gradient(145deg, ${overlay}, transparent 62%), ${design?.background || coverColor}`;
};

const FIELD_LABEL = { title: 'Title', recipient: 'Name', sender: 'Sender' };

/**
 * CardCoverPreview
 *
 * Static rendering (preview / recipient view) and an interactive editor share
 * the exact same layout maths, so what the creator arranges is what everyone
 * sees.
 *
 * New props:
 *   layout      cover-text layout object (title/recipient/sender)
 *   editable    when true, texts are draggable + selectable; emits onLayoutChange
 *   selected    currently-selected field id (editor)
 *   onSelect    (field) => void
 *   onLayoutChange (nextLayout) => void
 */
const CardCoverPreview = ({
  design,
  occasionLabel,
  recipientName,
  title,
  senderName,
  coverColor,
  textColor,
  fontFamily,
  compact = false,
  layout,
  editable = false,
  selected = null,
  onSelect,
  onLayoutChange,
}) => {
  const boxRef = useRef(null);
  const dragRef = useRef(null);
  const [, force] = useState(0);

  if (!design) return null;

  const hasArtwork = Boolean(design.artwork);
  const hasImage = Boolean(design.image);
  const ink = textColor || design.ink || '#172033';
  const accent = design.accent || '#7c3aed';
  const displayRecipient = recipientName?.trim() || 'Recipient name';
  const displayTitle = title?.trim() || design.coverTitle || 'A card made together';
  const displaySender = senderName?.trim() || 'Your name';

  const L = normalizeCoverLayout(layout);
  const values = {
    recipient: displayRecipient,
    title: displayTitle,
    sender: L.sender ? `From ${displaySender}` : displaySender,
  };

  const resolveColor = (c) => (!c || c === 'auto' ? (textColor || ink) : c);

  // ── Drag handling (editor only) ────────────────────────────────────────────
  const onPointerDown = useCallback((e, field) => {
    if (!editable) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(field);
    const rect = boxRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { field, rect };
  }, [editable, onSelect]);

  const onPointerMove = useCallback((e) => {
    const d = dragRef.current;
    if (!d) return;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    const nx = Math.min(96, Math.max(4, ((cx - d.rect.left) / d.rect.width) * 100));
    const ny = Math.min(96, Math.max(4, ((cy - d.rect.top) / d.rect.height) * 100));
    const next = { ...L, [d.field]: { ...L[d.field], x: nx, y: ny } };
    onLayoutChange?.(next);
    force((n) => n + 1);
  }, [L, onLayoutChange]);

  const onPointerUp = useCallback(() => { dragRef.current = null; }, []);

  // Reference width for responsive font sizing: the cover renders at whatever
  // width the container gives it; sizes are expressed relative to a 210u board.
  const fontScale = compact ? 0.9 : 1;

  const renderText = (field) => {
    const cfg = L[field];
    if (!cfg.show) return null;
    const isSel = editable && selected === field;
    const col = resolveColor(cfg.color);
    return (
      <div
        key={field}
        onMouseDown={(e) => onPointerDown(e, field)}
        onTouchStart={(e) => onPointerDown(e, field)}
        style={{
          position: 'absolute',
          left: `${cfg.x}%`,
          top: `${cfg.y}%`,
          transform: 'translate(-50%, -50%)',
          width: '86%',
          textAlign: 'center',
          color: col,
          fontFamily,
          fontWeight: field === 'sender' ? 600 : 800,
          fontSize: `${(cfg.size * fontScale / 210) * 100}cqw`,
          lineHeight: 1.08,
          letterSpacing: field === 'sender' ? '0.04em' : '-0.01em',
          wordBreak: 'break-word',
          textShadow: (() => {
            // Per-field shadow from cover_layout takes priority
            if (cfg.shadow) {
              const color = cfg.shadowColor || '#000000';
              const op = cfg.shadowOpacity ?? 0.55;
              const r = parseInt(color.slice(1,3),16), g = parseInt(color.slice(3,5),16), b = parseInt(color.slice(5,7),16);
              return `0 2px 8px rgba(${r},${g},${b},${op}), 0 1px 3px rgba(${r},${g},${b},${Math.min(1,op+0.2)})`;
            }
            // Fallback: subtle auto-shadow on image/artwork covers for readability
            if (hasImage || hasArtwork) {
              return col.toLowerCase() === '#ffffff'
                ? '0 2px 12px rgba(0,0,0,0.45)'
                : '0 1px 8px rgba(255,255,255,0.45)';
            }
            return 'none';
          })(),
          cursor: editable ? 'grab' : 'default',
          userSelect: 'none',
          padding: '2px 4px',
          borderRadius: 6,
          outline: isSel ? `1.5px dashed ${accent}` : 'none',
          outlineOffset: 3,
          background: isSel ? 'rgba(124,58,237,0.06)' : 'transparent',
          zIndex: isSel ? 5 : 3,
          touchAction: 'none',
        }}
      >
        {values[field]}
        {isSel && (
          <span
            style={{
              position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)',
              background: accent, color: '#fff', fontSize: 8, fontWeight: 800,
              padding: '1px 6px', borderRadius: 20, whiteSpace: 'nowrap',
              fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: 0,
            }}
          >
            {FIELD_LABEL[field]}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      ref={boxRef}
      className="relative overflow-hidden w-full shadow-[0_24px_65px_rgba(31,23,62,0.18)]"
      style={{
        aspectRatio: '210 / 297',
        containerType: 'inline-size',
        maxHeight: compact ? undefined : '70vh',
        borderRadius: 6,
        background: hasArtwork ? design.background : withTint(design, coverColor),
        color: ink,
        border: `1px solid ${design.dark ? 'rgba(255,255,255,0.18)' : 'rgba(23,32,51,0.12)'}`,
      }}
      onMouseMove={editable ? onPointerMove : undefined}
      onMouseUp={editable ? onPointerUp : undefined}
      onMouseLeave={editable ? onPointerUp : undefined}
      onTouchMove={editable ? onPointerMove : undefined}
      onTouchEnd={editable ? onPointerUp : undefined}
    >
      {/* Artwork layer */}
      {hasArtwork && (
        <div className="absolute inset-0">
          <CoverArtwork scene={design.artwork.scene} palette={design.artwork.palette} seed={design.artwork.seed} />
        </div>
      )}
      {hasImage && !hasArtwork && (
        <>
          <img src={design.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: ink === '#ffffff' ? 'linear-gradient(180deg, transparent 34%, rgba(7,17,30,0.55) 100%)' : 'linear-gradient(180deg, transparent 30%, rgba(255,255,255,0.5) 100%)' }} />
        </>
      )}

      {/* Occasion chip (kept subtle, not part of movable texts) */}
      {!compact && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[9px] sm:text-[11px] font-extrabold uppercase tracking-[0.2em] z-[2]"
          style={{
            color: hasArtwork && design.dark ? design.soft : accent,
            background: design.dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(6px)',
          }}
        >
          {occasionLabel}
        </div>
      )}

      {/* Decorative icon medallion for non-artwork, non-image covers */}
      {!hasArtwork && !hasImage && !compact && (
        <div
          className="absolute top-[14%] left-1/2 -translate-x-1/2 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full border z-[2]"
          style={{ borderColor: `${accent}66`, background: design.dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.72)', color: accent }}
        >
          <Icon name={design.icon || 'Sparkles'} size={compact ? 20 : 28} />
        </div>
      )}

      {/* Movable text fields */}
      {compact
        ? (
          // Compact thumbnails: show a lightweight static title only so the grid stays legible
          <div className="absolute inset-0 flex items-end justify-center p-2 pointer-events-none">
            <p
              className="text-[10px] font-extrabold text-center leading-tight break-words w-full"
              style={{ color: resolveColor(L.recipient.color), fontFamily, textShadow: hasArtwork || hasImage ? '0 1px 6px rgba(0,0,0,0.35)' : 'none' }}
            >
              {design.name || displayRecipient}
            </p>
          </div>
        )
        : COVER_FIELDS.map(renderText)}
    </div>
  );
};

export default CardCoverPreview;
