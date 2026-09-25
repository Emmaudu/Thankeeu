/**
 * SignerReplies — the reply thread under one signer's message (board card,
 * album page, or the opened-message view).
 *
 * Everyone who can see the message sees its replies. Only the card's creator
 * or its recipient get the "Reply" button (the server enforces the same rule).
 * All state lives in the parent `kit` so a draft survives page turns and
 * refreshes of the card.
 *
 * kit = { byMsg, can, role, open, setOpen, drafts, setDraft, send, remove, sending }
 */
const SignerReplies = ({ messageId, signerName, kit, ink = '#1f2937', accent = '#7C3AED', compact = false }) => {
  if (!kit) return null;
  const list = kit.byMsg?.[messageId] || [];
  const isOpen = kit.open === messageId;
  const draft = kit.drafts?.[messageId] || '';
  if (!list.length && !kit.can) return null;

  const stop = (e) => e.stopPropagation();

  return (
    <div className={compact ? 'mt-2' : 'mt-3'} onClick={stop} onMouseDown={stop} onTouchStart={stop} onTouchEnd={stop} onKeyDown={stop}>
      {list.length > 0 && (
        <ul className="space-y-1.5" style={{ maxHeight: compact ? 120 : 220, overflowY: 'auto' }}>
          {list.map(r => (
            <li key={r.id} className="group flex items-start gap-2 rounded-xl px-2.5 py-1.5"
              style={{ background: `${accent}12`, border: `1px solid ${accent}26` }}>
              <span className="mt-0.5 text-[11px]" aria-hidden="true">↳</span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-extrabold leading-tight" style={{ color: accent }}>
                  {r.author_name}
                  <span className="ml-1 font-semibold opacity-60">{r.author_role === 'recipient' ? '· recipient' : '· organiser'}</span>
                </p>
                <p className="whitespace-pre-wrap break-words text-[13px] leading-snug" style={{ color: ink }}>{r.content}</p>
              </div>
              {kit.can && kit.role === r.author_role && (
                <button type="button" onClick={() => kit.remove(r.id)} title="Delete reply" aria-label="Delete reply"
                  className="flex-shrink-0 text-[11px] font-bold opacity-40 hover:opacity-90" style={{ color: ink, minHeight: 0 }}>✕</button>
              )}
            </li>
          ))}
        </ul>
      )}

      {kit.can && !isOpen && (
        <button type="button" onClick={() => kit.setOpen(messageId)}
          className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold"
          style={{ color: accent, background: `${accent}14`, minHeight: 0 }}>
          💬 Reply{signerName ? ` to ${String(signerName).split(' ')[0]}` : ''}
        </button>
      )}

      {kit.can && isOpen && (
        <div className="mt-1.5 rounded-xl border bg-white/90 p-2" style={{ borderColor: `${accent}44` }}>
          <textarea
            autoFocus
            rows={2}
            maxLength={1000}
            value={draft}
            onChange={e => kit.setDraft(messageId, e.target.value)}
            placeholder={`Reply to ${signerName || 'this message'}…`}
            className="w-full resize-none rounded-lg bg-transparent px-1.5 py-1 text-[13px] text-warm-900 outline-none"
            style={{ fontSize: 16 }}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-warm-400">{draft.length}/1000 · they'll get an email</span>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => kit.setOpen(null)}
                className="rounded-full px-2.5 py-1 text-[11px] font-bold text-warm-500" style={{ minHeight: 0 }}>Cancel</button>
              <button type="button" disabled={!draft.trim() || kit.sending === messageId} onClick={() => kit.send(messageId)}
                className="rounded-full px-3 py-1 text-[11px] font-extrabold text-white disabled:opacity-50"
                style={{ background: accent, minHeight: 0 }}>
                {kit.sending === messageId ? 'Sending…' : 'Send reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignerReplies;
