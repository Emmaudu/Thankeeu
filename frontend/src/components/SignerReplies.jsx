/**
 * SignerReplies — the reply thread under one signer's message (board card,
 * album page, or the opened-message view).
 *
 * Anyone viewing the card can reply to a signer — the creator, the recipient,
 * and visitors (who add their name if they aren't signed in). Visitors can't
 * reply to private messages. Each reply is emailed to that one signer.
 *
 * Collapsed, it's a small pill in the style of the board's "Find …" search
 * pill; tapping it expands into a message box with a send button.
 * All state lives in the parent `kit` so a draft survives page turns and
 * refreshes of the card.
 *
 * kit = { byMsg, can, canModerate, role, needsName, guestName, setGuestName,
 *         open, setOpen, drafts, setDraft, send, remove, sending, isMine }
 */
import { useEffect, useRef } from 'react';

const ROLE_LABEL = { recipient: 'recipient', creator: 'organiser' };

const SignerReplies = ({ messageId, signerName, kit, ink = '#1f2937', accent = '#7C3AED', compact = false, isPrivate = false }) => {
  const inputRef = useRef(null);
  const isOpen = kit?.open === messageId;
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 60);
  }, [isOpen]);
  if (!kit) return null;

  const list = kit.byMsg?.[messageId] || [];
  const draft = kit.drafts?.[messageId] || '';
  // Visitors can't reply to a private message (the server enforces it too).
  const canReply = !!kit.can && (!isPrivate || !!kit.role);
  if (!list.length && !canReply) return null;

  const first = signerName ? String(signerName).trim().split(/\s+/)[0] : '';
  const stop = (e) => e.stopPropagation();
  const sending = kit.sending === messageId;
  const ready = draft.trim() && (!kit.needsName || (kit.guestName || '').trim());
  const submit = () => { if (ready && !sending) kit.send(messageId); };

  return (
    <div className={compact ? 'mt-2' : 'mt-3'} onClick={stop} onMouseDown={stop} onTouchStart={stop} onTouchEnd={stop} onKeyDown={stop}>
      <style>{SR_CSS}</style>

      {list.length > 0 && (
        <ul className="space-y-1.5" style={{ maxHeight: compact ? 132 : 230, overflowY: 'auto' }}>
          {list.map(r => (
            <li key={r.id} className="group flex items-start gap-2 rounded-xl px-2.5 py-1.5"
              style={{ background: `${accent}12`, border: `1px solid ${accent}26` }}>
              <span className="mt-0.5 text-[11px]" aria-hidden="true">↳</span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-extrabold leading-tight" style={{ color: accent }}>
                  {r.author_name}
                  {ROLE_LABEL[r.author_role] && <span className="ml-1 font-semibold opacity-60">· {ROLE_LABEL[r.author_role]}</span>}
                </p>
                <p className="whitespace-pre-wrap break-words text-[13px] leading-snug" style={{ color: ink }}>{r.content}</p>
              </div>
              {kit.canRemove?.(r) && (
                <button type="button" onClick={() => kit.remove(r)} title="Delete reply" aria-label="Delete reply"
                  className="flex-shrink-0 text-[11px] font-bold opacity-40 hover:opacity-90" style={{ color: ink, minHeight: 0 }}>✕</button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canReply && !isOpen && (
        <button type="button" onClick={() => kit.setOpen(messageId)} className="sr-pill"
          style={{ '--sr-accent': accent, color: accent, borderColor: `${accent}33`, background: `${accent}0F`, minHeight: 0 }}
          aria-label={`Reply to ${signerName || 'this message'}`}>
          <span aria-hidden="true" style={{ fontSize: 13 }}>💬</span>
          <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: 15, fontWeight: 700 }}>
            Reply{first ? ` to ${first}` : ''}…
          </span>
          <span className="sr-hint">tap to reply</span>
        </button>
      )}

      {canReply && isOpen && (
        <div className="sr-open mt-1.5" style={{ '--sr-accent': accent }}>
          <div className="sr-glow" aria-hidden="true" style={{ background: `linear-gradient(135deg, ${accent}, #EC4899, ${accent})` }} />
          <div className="relative rounded-2xl bg-white p-2 shadow-[0_4px_20px_rgba(0,0,0,0.10)]">
            {kit.needsName && (
              <input
                value={kit.guestName || ''}
                onChange={e => kit.setGuestName(e.target.value)}
                maxLength={60}
                placeholder="Your name"
                aria-label="Your name"
                className="mb-1.5 w-full rounded-lg border border-purple-100 bg-purple-50/40 px-2.5 py-1.5 text-[13px] text-warm-900 outline-none focus:border-purple-300"
                style={{ fontSize: 16 }}
              />
            )}
            <div className="flex items-end gap-1.5">
              <span className="pb-2 pl-1 text-[15px] opacity-60" aria-hidden="true">💬</span>
              <textarea
                ref={inputRef}
                rows={2}
                maxLength={1000}
                value={draft}
                onChange={e => kit.setDraft(messageId, e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
                  if (e.key === 'Escape') kit.setOpen(null);
                }}
                placeholder={`Write to ${first || 'them'}…`}
                aria-label={`Reply to ${signerName || 'this message'}`}
                className="min-w-0 flex-1 resize-none bg-transparent px-1 py-1.5 leading-snug text-warm-900 outline-none"
                style={{ fontSize: 16, border: 'none', boxShadow: 'none', outline: 'none' }}
              />
              <button type="button" onClick={submit} disabled={!ready || sending} aria-label="Send reply"
                className="mb-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white shadow transition hover:scale-105 disabled:opacity-40"
                style={{ background: accent, minHeight: 0 }}>
                {sending
                  ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>}
              </button>
            </div>
            <div className="flex items-center justify-between px-1 pt-0.5">
              <span className="text-[10px] text-warm-400">Goes to {first || 'them'} only · Enter to send</span>
              <button type="button" onClick={() => kit.setOpen(null)} className="text-[10px] font-bold text-warm-400 hover:text-warm-600" style={{ minHeight: 0 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SR_CSS = `
.sr-pill { margin-top: 6px; display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px;
  border-width: 1.5px; border-style: solid; cursor: pointer; transition: transform .2s ease, background .2s ease;
  animation: sr-pulse 3.2s ease infinite; backdrop-filter: blur(6px); max-width: 100%; }
.sr-pill:hover { transform: scale(1.04); animation-play-state: paused; }
.sr-hint { font-size: 10px; opacity: .5; font-style: italic; font-family: system-ui, sans-serif; white-space: nowrap; }
@keyframes sr-pulse { 0%,100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--sr-accent) 28%, transparent); } 50% { box-shadow: 0 0 0 6px transparent; } }
.sr-open { position: relative; animation: sr-expand .28s cubic-bezier(.34,1.56,.64,1); }
.sr-glow { position: absolute; inset: -2px; border-radius: 18px; background-size: 200% 200% !important; filter: blur(3px); opacity: .5;
  animation: sr-shift 3s ease infinite; }
@keyframes sr-expand { from { transform: scaleX(.6); opacity: .6; } to { transform: scaleX(1); opacity: 1; } }
@keyframes sr-shift { 0% { background-position: 0% 50% } 50% { background-position: 100% 50% } 100% { background-position: 0% 50% } }
@media (prefers-reduced-motion: reduce) { .sr-pill, .sr-open, .sr-glow { animation: none; } }
`;

export default SignerReplies;
