import Icon from './ui/Icon';

const withTint = (design, coverColor) => {
  if (!coverColor || !coverColor.startsWith('#')) return design?.background || '#f5f0ff';
  const overlay = `${coverColor}26`;
  return `linear-gradient(145deg, ${overlay}, transparent 62%), ${design?.background || coverColor}`;
};

const CardCoverPreview = ({
  design,
  occasionLabel,
  recipientName,
  title,
  senderName,
  coverColor,
  compact = false,
}) => {
  if (!design) return null;

  const hasArtwork = Boolean(design.image);
  const ink = design.ink || '#172033';
  const accent = design.accent || '#7c3aed';
  const displayRecipient = recipientName?.trim() || 'Recipient name';
  const displayTitle = title?.trim() || design.coverTitle || 'A card made together';
  const displaySender = senderName?.trim() || 'Your name';

  return (
    <div
      className="relative overflow-hidden w-full shadow-[0_24px_65px_rgba(31,23,62,0.18)]"
      style={{
        aspectRatio: '210 / 297',
        maxHeight: compact ? undefined : '70vh',
        borderRadius: 6,
        background: withTint(design, coverColor),
        color: ink,
        border: `1px solid ${design.dark ? 'rgba(255,255,255,0.18)' : 'rgba(23,32,51,0.12)'}`,
      }}
    >
      {hasArtwork ? (
        <>
          <img src={design.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: coverColor ? `linear-gradient(180deg, transparent 48%, ${coverColor}d9 100%)` : 'linear-gradient(180deg, transparent 45%, rgba(7,17,30,0.88) 100%)' }} />
          {!compact && (
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 text-white">
              <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.2em] opacity-80">{occasionLabel}</p>
              <p className="mt-2 text-2xl sm:text-4xl font-extrabold leading-tight break-words">{displayRecipient}</p>
              <p className="mt-1 text-sm sm:text-base font-semibold opacity-95 break-words">{displayTitle}</p>
              <p className="mt-4 text-xs sm:text-sm opacity-80">From {displaySender}</p>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 p-5 sm:p-8 flex flex-col text-center">
          <div className="flex items-center justify-between text-[9px] sm:text-[11px] font-extrabold uppercase tracking-[0.18em]" style={{ color: accent }}>
            <span>Thankeeu</span>
            <span>{occasionLabel}</span>
          </div>
          <div className="mt-5 sm:mt-8 mx-auto w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full border" style={{ borderColor: `${accent}66`, background: design.dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.72)', color: accent }}>
            <Icon name={design.icon || 'Sparkles'} size={compact ? 20 : 28} />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center min-h-0">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.22em] mb-3 opacity-70">Made especially for</p>
            <p className={`${compact ? 'text-lg' : 'text-3xl sm:text-5xl'} font-extrabold leading-[1.05] break-words w-full`} style={{ color: accent }}>
              {compact ? design.coverTitle : displayRecipient}
            </p>
            {!compact && (
              <>
                <div className="w-12 h-px my-4" style={{ background: `${accent}88` }} />
                <p className="text-base sm:text-2xl font-bold leading-tight break-words w-full">{displayTitle}</p>
              </>
            )}
            <p className={`${compact ? 'mt-3 text-[9px]' : 'mt-4 text-xs sm:text-sm'} leading-relaxed opacity-75 max-w-[85%]`}>
              {design.coverSubtitle}
            </p>
          </div>
          <div className="pt-4 border-t text-[10px] sm:text-xs font-semibold" style={{ borderColor: `${accent}44` }}>
            {compact ? design.name : `From ${displaySender}`}
          </div>
        </div>
      )}
    </div>
  );
};

export default CardCoverPreview;

