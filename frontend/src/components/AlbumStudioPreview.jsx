import { useEffect, useMemo, useState } from 'react';
import CardCoverPreview from './CardCoverPreview';
import Icon from './ui/Icon';
import { getAlbumTheme, getContrastTextColor } from '../utils/albumThemes';
import { getFontStyle } from '../utils/cardDesigns';

const PAGE_LABELS = ['Cover', 'Message', 'Review'];

const AlbumStudioPreview = ({
  design,
  form,
  message,
  occasionLabel,
  activeStep,
  creatorName,
}) => {
  const [page, setPage] = useState(0);
  const theme = getAlbumTheme(form.album_background_theme);
  const coverTextColor = form.cover_text_color && form.cover_text_color !== 'auto'
    ? form.cover_text_color
    : getContrastTextColor(form.background_color, design);
  const messageFont = getFontStyle(message.font_style);

  useEffect(() => {
    if (activeStep === 3) setPage(1);
    else if (activeStep === 4) setPage(2);
    else setPage(0);
  }, [activeStep]);

  const stageBackground = useMemo(() => {
    if (theme.id !== 'cover_blur') return theme.stage;
    if (design?.image) return `url("${design.image}") center / cover no-repeat`;
    return design?.background || theme.stage;
  }, [design, theme]);

  const movePage = direction => setPage(current => Math.min(2, Math.max(0, current + direction)));
  const recipient = form.recipient_name?.trim() || 'Recipient name';
  const sender = form.cover_sender?.trim() || creatorName || 'Your name';
  const messageText = message.content?.trim() || 'Your message will appear here as you type. Add a memory, a thank-you, or a few words from the heart.';

  return (
    <div className="w-full">
      <style>{`
        @keyframes album-page-turn {
          from { opacity: .35; transform: rotateY(-7deg) translateX(-8px); }
          to { opacity: 1; transform: rotateY(0) translateX(0); }
        }
        .album-page-turn { animation: album-page-turn .38s ease-out both; transform-origin: left center; }
      `}</style>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-warm-500">Live album preview</p>
          <p className="mt-1 text-sm font-bold text-warm-900">{PAGE_LABELS[page]}</p>
        </div>
        <span className="rounded-md border border-purple-100 bg-white px-2.5 py-1 text-[10px] font-extrabold text-warm-500">Updates live</span>
      </div>

      <div
        className="relative overflow-hidden border border-black/5 shadow-[0_24px_70px_rgba(27,34,48,0.16)]"
        style={{ minHeight: 'clamp(430px, 69vh, 710px)', borderRadius: 8, background: stageBackground }}
      >
        {theme.id === 'cover_blur' && <div className="absolute inset-0 bg-white/20 backdrop-blur-xl" />}
        <div className="absolute inset-0 bg-black/5" />

        <div className="relative z-10 flex min-h-[clamp(430px,69vh,710px)] items-center justify-center p-5 sm:p-8 lg:p-10">
          {page === 0 ? (
            <div key="cover" className="album-page-turn relative w-full max-w-[360px]">
              <div className="absolute left-[12%] top-3 h-full w-[88%] rounded-md bg-white shadow-xl" />
              <div className="relative transition-transform duration-300 hover:-translate-y-1">
                <CardCoverPreview
                  design={design}
                  occasionLabel={occasionLabel}
                  recipientName={form.recipient_name}
                  title={form.title}
                  senderName={sender}
                  coverColor={form.background_color?.startsWith('#') ? form.background_color : undefined}
                  textColor={coverTextColor}
                  fontFamily={getFontStyle(form.font_style).family}
                />
              </div>
            </div>
          ) : (
            <div key={`spread-${page}`} className="album-page-turn relative w-full max-w-[820px]" style={{ perspective: '1500px' }}>
              <div className="grid grid-cols-2 overflow-hidden rounded-md shadow-2xl" style={{ background: theme.page, minHeight: 'clamp(310px, 46vw, 520px)' }}>
                <div className="relative flex flex-col border-r border-black/15 p-5 sm:p-8" style={{ color: theme.ink }}>
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] opacity-45">For {recipient}</span>
                  {page === 1 ? (
                    <div className="flex flex-1 flex-col justify-center">
                      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: `${design?.accent || '#7c3aed'}18`, color: design?.accent || '#7c3aed' }}>
                        <Icon name="PenLine" size={21} />
                      </div>
                      <p className="break-words text-lg leading-relaxed sm:text-2xl" style={{ fontFamily: messageFont.family }}>
                        {messageText}
                      </p>
                      <p className="mt-6 text-xs font-bold opacity-60">{sender}</p>
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col justify-center">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] opacity-45">Ready to bring everyone together</p>
                      <p className="mt-3 text-2xl font-extrabold leading-tight sm:text-4xl">{form.title || `${recipient}'s card`}</p>
                      <div className="mt-7 space-y-3 text-xs sm:text-sm">
                        <p className="flex items-center gap-2"><Icon name="Calendar" size={14} /> {form.send_date || 'Send whenever you are ready'}</p>
                        <p className="flex items-center gap-2"><Icon name="Gift" size={14} /> {form.is_gift_enabled ? 'Gift collection included' : 'Messages only'}</p>
                      </div>
                    </div>
                  )}
                  <span className="absolute bottom-3 left-0 right-0 text-center text-[9px] opacity-30">1</span>
                </div>

                <div className="relative flex flex-col p-5 sm:p-8" style={{ color: theme.ink }}>
                  <span className="text-right text-[9px] font-extrabold uppercase tracking-[0.18em] opacity-45">Thankeeu</span>
                  {page === 1 ? (
                    <div className="grid flex-1 grid-cols-2 gap-3 py-7">
                      {[
                        ['Image', 'Photo'], ['Mic', 'Voice note'], ['Film', 'Video'], ['Heart', 'More love'],
                      ].map(([icon, label]) => (
                        <div key={label} className="flex min-h-20 flex-col items-center justify-center rounded-md border border-dashed border-black/15 bg-black/[0.025] text-center">
                          <Icon name={icon} size={19} className="opacity-35" />
                          <span className="mt-2 text-[9px] font-bold opacity-40">{label}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col justify-center">
                      <p className="text-xs font-bold opacity-50">A quick review</p>
                      <dl className="mt-4 space-y-4 text-xs sm:text-sm">
                        <div><dt className="opacity-45">Occasion</dt><dd className="mt-1 font-bold">{occasionLabel}</dd></div>
                        <div><dt className="opacity-45">Recipient</dt><dd className="mt-1 font-bold">{recipient}</dd></div>
                        <div><dt className="opacity-45">Cover from</dt><dd className="mt-1 font-bold">{sender}</dd></div>
                        <div><dt className="opacity-45">First message</dt><dd className="mt-1 line-clamp-3 font-medium">{messageText}</dd></div>
                      </dl>
                    </div>
                  )}
                  <span className="absolute bottom-3 left-0 right-0 text-center text-[9px] opacity-30">2</span>
                </div>
              </div>
              <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-black/20 shadow-[0_0_10px_rgba(0,0,0,0.25)]" />
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto mt-4 flex w-fit items-center gap-3 rounded-full border border-purple-100 bg-white px-3 py-2 shadow-sm">
        <button type="button" onClick={() => movePage(-1)} disabled={page === 0} className="flex h-8 w-8 items-center justify-center rounded-full text-primary-600 disabled:opacity-30" aria-label="Previous album page"><Icon name="ChevronLeft" size={17} /></button>
        <div className="flex items-center gap-1.5" aria-label={`Album page ${page + 1} of 3`}>
          {PAGE_LABELS.map((label, index) => <button key={label} type="button" onClick={() => setPage(index)} className={`h-2 rounded-full transition-all ${page === index ? 'w-8 bg-primary-500' : 'w-2 bg-warm-300'}`} aria-label={`Show ${label.toLowerCase()}`} />)}
        </div>
        <button type="button" onClick={() => movePage(1)} disabled={page === 2} className="flex h-8 w-8 items-center justify-center rounded-full text-primary-600 disabled:opacity-30" aria-label="Next album page"><Icon name="ChevronRight" size={17} /></button>
      </div>
    </div>
  );
};

export default AlbumStudioPreview;
