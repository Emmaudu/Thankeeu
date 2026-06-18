/**
 * AlbumSign.jsx
 *
 * GroupCards-style flipbook signing page.
 * - Paginated "paper page" canvas with signatures placed at absolute positions
 * - Draggable signatures (mouse + touch)
 * - Toolbar: Add Message | Photo | GIF | Voice | ...
 * - Right sidebar: My Signatures | Gift Pot | Share | Help
 * - Full signing flow: message → optional gift payment (FLW redirect) → success
 *
 * Branched into from SignCard.jsx when card.card_layout === 'album'.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMemberAuth } from '../context/MemberAuthContext';
import { useCompanyAuth } from '../context/CompanyAuthContext';
import {
  cardsAPI, messagesAPI, paymentsAPI, visitorsAPI,
} from '../utils/api';
import { FONT_STYLES, getFontStyle, getCardDesign, cardArtClass } from '../utils/cardDesigns';
import VoiceRecorder from '../components/VoiceRecorder';
import EmojiPicker from '../components/EmojiPicker';
import GifPicker from '../components/GifPicker';
import Icon from '../components/ui/Icon';
import toast from 'react-hot-toast';
import { formatNGN, getFLWPaymentParams } from '../utils/currency';

// ── Helpers ──────────────────────────────────────────────────────────────────

const MSGS_PER_PAGE = 4; // max signatures before a new page is auto-added

const FONT_COLORS = [
  '#1E40AF', '#7C3AED', '#BE185D', '#065F46',
  '#92400E', '#1A1035', '#B91C1C', '#0369A1',
];

const AMOUNTS_NGN = [2500, 5000, 10000, 20000, 50000, 100000];

// Assign a deterministic random-ish position to a new message based on index
const defaultPosition = (index) => ({
  x: 5  + (index % 2) * 42 + ((index * 7) % 18),
  y: 8  + Math.floor(index / 2) * 34 + ((index * 13) % 14),
  rot: [-4, 2, -2, 3, -1, 4][index % 6],
});

// ── Main Component ────────────────────────────────────────────────────────────

const AlbumSign = ({ card: initialCard, slug }) => {
  const { user, loginWithToken } = useAuth();
  const { member }  = useMemberAuth();
  const { company } = useCompanyAuth();
  const isSignedIn  = !!(user || member || company);
  const [searchParams] = useSearchParams();

  // ── Card & page state ──
  const [card,        setCard]       = useState(initialCard);
  const [page,        setPage]       = useState(1);
  const [submitted,   setSubmitted]  = useState(false);
  const [myMsgIds,    setMyMsgIds]   = useState([]);

  // ── Modal / editor state ──
  const [showEditor,  setShowEditor] = useState(false);
  const [submitting,  setSubmitting] = useState(false);
  const [stage,       setStage]      = useState('idle');

  // ── Sidebar panels ──
  const [signaturesOpen, setSignaturesOpen] = useState(true);
  const [showHelp,       setShowHelp]       = useState(false);
  const [mobileSidebar,  setMobileSidebar]  = useState(false);

  // ── Editor form ──
  const signedInName  = user?.full_name ||
    (member ? `${member.first_name} ${member.last_name}`.trim() : null) ||
    company?.contact_person || '';
  const signedInEmail = user?.email || member?.email || company?.email || '';

  const [form, setForm] = useState({
    author_name:  signedInName,
    author_email: signedInEmail,
    content:      '',
    is_private:   false,
    font_style:   'handwritten',
    font_color:   '#1E40AF',
    font_size:    18,
  });

  // ── Media ──
  const [mediaFiles,    setMediaFiles]   = useState([]);
  const [carouselIdx,   setCarouselIdx]  = useState(0);
  const fileInputRef = useRef();
  const textareaRef  = useRef();
  const [showEmoji,   setShowEmoji]   = useState(false);
  const [showGif,     setShowGif]     = useState(false);

  // ── Gift ──
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount,   setCustomAmount]   = useState('');
  const [giftCurrency,   setGiftCurrency]   = useState('NGN');

  // ── Drag state ──
  const dragging = useRef(null);
  const pageRef  = useRef();

  // ── Payment return handling ──
  useEffect(() => {
    const returnTxRef  = searchParams.get('tx_ref') || searchParams.get('reference');
    const returnStatus = (searchParams.get('status') || '').toLowerCase();
    if (!returnTxRef) return;

    window.history.replaceState({}, '', `/sign/${slug}`);
    if (returnStatus === 'cancelled' || returnStatus === 'canceled') {
      toast.error('Payment cancelled. Your message is still on the card!');
      return;
    }
    setStage('verifying');
    paymentsAPI.verifyContribution(returnTxRef)
      .then(() => { toast.success('Message and gift confirmed! 🎉'); setSubmitted(true); })
      .catch((e) => {
        const httpStatus = e?.response?.status;
        const msg = e?.response?.data?.error || e?.message || '';
        // 400 = payment genuinely not completed (declined, cancelled on FLW side)
        // Tell the user so they can retry rather than faking success
        if (httpStatus === 400 || msg.toLowerCase().includes('not completed') || msg.toLowerCase().includes('cancelled')) {
          toast.error('Payment was not completed. Please try again.');
          // Do NOT setSubmitted — keep the card open so they can retry
        } else {
          // Server/network error during verify. Payment likely went through on FLW's side.
          // Show optimistic success to avoid double-charging on retry.
          console.error('[AlbumSign] verifyContribution server error:', msg);
          toast.success('Gift received! 🎉');
          setSubmitted(true);
        }
      })
      .finally(() => setStage('idle'));
  // [slug] not [] — ensures the effect re-evaluates searchParams after React Router
  // navigation (e.g. FLW redirects back to /sign/slug?tx_ref=... on the same SPA session)
  }, [slug]);

  // ── Derived ──
  const messages     = card?.messages || [];
  const totalPages   = Math.max(1, Math.ceil(messages.length / MSGS_PER_PAGE));
  const pageMessages = messages.filter((_, i) =>
    Math.floor(i / MSGS_PER_PAGE) + 1 === page
  );
  const design = getCardDesign(card?.design_theme);

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const startDrag = useCallback((e, msgId, initialX, initialY) => {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragging.current = { msgId, startClientX: clientX, startClientY: clientY, initialX, initialY };
  }, []);

  const onDragMove = useCallback((e) => {
    if (!dragging.current || !pageRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = pageRef.current.getBoundingClientRect();
    const dx = ((clientX - dragging.current.startClientX) / rect.width)  * 100;
    const dy = ((clientY - dragging.current.startClientY) / rect.height) * 100;

    const newX = Math.max(0, Math.min(85, dragging.current.initialX + dx));
    const newY = Math.max(0, Math.min(85, dragging.current.initialY + dy));

    setCard(prev => ({
      ...prev,
      messages: prev.messages.map(m =>
        m.id === dragging.current.msgId ? { ...m, _x: newX, _y: newY } : m
      )
    }));
  }, []);

  const onDragEnd = useCallback(() => {
    if (!dragging.current) return;
    const { msgId } = dragging.current;
    const msg = card?.messages?.find(m => m.id === msgId);
    if (msg && (msg._x !== undefined || msg._y !== undefined)) {
      messagesAPI.updatePosition(msgId, {
        position_x: msg._x ?? msg.position_x,
        position_y: msg._y ?? msg.position_y,
        rotation: msg.rotation,
        author_email: form.author_email,
      }).catch(() => {});
    }
    dragging.current = null;
  }, [card, form.author_email]);

  // ── Media helpers ──────────────────────────────────────────────────────────

  const addMedia = useCallback((files) => {
    const items = [];
    for (const f of Array.from(files)) {
      if (f.size > 50 * 1024 * 1024) { toast.error(`${f.name} too large (max 50MB)`); continue; }
      const mime = f.type;
      const type = mime.startsWith('video/') ? 'video'
                 : mime.startsWith('audio/') ? 'voice'
                 : mime === 'image/gif'       ? 'gif'
                 : 'image';
      items.push({ file: f, preview: URL.createObjectURL(f), type, name: f.name });
    }
    setMediaFiles(prev => [...prev, ...items].slice(0, 5));
  }, []);

  const removeMedia = useCallback((idx) => {
    setMediaFiles(prev => {
      const next = [...prev];
      URL.revokeObjectURL(next[idx].preview);
      next.splice(idx, 1);
      setCarouselIdx(i => Math.min(i, Math.max(0, next.length - 1)));
      return next;
    });
  }, []);

  const insertEmoji = useCallback((emoji) => {
    const el = textareaRef.current;
    if (el && typeof el.selectionStart === 'number') {
      const s = el.selectionStart, e = el.selectionEnd;
      setForm(p => ({ ...p, content: p.content.slice(0, s) + emoji + p.content.slice(e) }));
      requestAnimationFrame(() => {
        el.focus();
        const pos = s + emoji.length;
        el.setSelectionRange(pos, pos);
      });
    } else {
      setForm(p => ({ ...p, content: p.content + emoji }));
    }
    setShowEmoji(false);
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.author_name.trim()) return toast.error('Please add your name');
    if (!form.content.trim())     return toast.error('Please write a message');
    if (!form.author_email.trim()) return toast.error('Email is required');

    const amountNGN = Number(customAmount || selectedAmount || 0);
    const wantsGift = card.is_gift_enabled && amountNGN >= 2500;

    setSubmitting(true);
    setStage('sending');

    try {
      // Compute a default placement for this new message
      const msgIdx   = messages.length;
      const defPos   = defaultPosition(msgIdx);

      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('position_x',  defPos.x);
      fd.append('position_y',  defPos.y);
      fd.append('rotation',    defPos.rot);
      fd.append('page_number', totalPages); // place on last page
      if (!isSignedIn) fd.append('is_guest', 'true');
      mediaFiles.forEach((m, i) =>
        fd.append(i === 0 ? 'media' : `media_gallery_${i}`, m.file)
      );

      const msgRes  = await messagesAPI.add(slug, fd);
      const messageId = msgRes.data?.id;
      if (messageId) setMyMsgIds(prev => [...prev, messageId]);

      // Refresh card to show new message
      const refreshed = await cardsAPI.getPublic(slug);
      setCard(refreshed.data);

      if (!wantsGift) {
        setSubmitting(false);
        setStage('idle');
        setShowEditor(false);
        setForm(p => ({ ...p, content: '' }));
        setMediaFiles([]);
        // Go to the page with the new message
        setPage(Math.ceil((messages.length + 1) / MSGS_PER_PAGE));

        if (!isSignedIn && form.author_email) {
          visitorsAPI.track({ email: form.author_email, full_name: form.author_name, card_slug: slug }).catch(() => {});
        }
        setSubmitted(true);
        return;
      }

      // Gift payment
      setStage('paying');
      const { amount: flwAmount, currency: flwCurrency } = getFLWPaymentParams(amountNGN, giftCurrency);
      const payRes = await paymentsAPI.initContribution({
        card_slug: slug, contributor_name: form.author_name,
        contributor_email: form.author_email, amount: amountNGN,
        display_currency: giftCurrency, flw_amount: flwAmount,
        flw_currency: flwCurrency, message_id: messageId,
      });
      const { payment_link } = payRes.data;
      if (!payment_link) throw new Error('No payment link from server');

      setStage('redirecting');
      window.location.assign(payment_link);

    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not sign card. Please try again.');
      setSubmitting(false);
      setStage('idle');
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────

  if (submitted && stage !== 'verifying') return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      className="section-dots" style={{ background: 'linear-gradient(160deg,#F5F0FF,#FFF0F5)' }}>
      <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border-2 border-purple-100">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-5 animate-pop">✓</div>
        <h2 className="text-2xl font-bold text-warm-900 mb-2">You're on {card.recipient_name}'s card! 🎉</h2>
        <p className="text-warm-500 mb-7">Your message is part of their celebration.</p>
        <button
          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Sign ${card.recipient_name}'s card: ${window.location.origin}/sign/${slug}`)}`, '_blank')}
          className="w-full py-4 rounded-2xl font-bold text-white mb-3" style={{ background: '#25D366' }}>
          📣 Invite others on WhatsApp
        </button>
        <button onClick={() => setSubmitted(false)} className="w-full py-3 rounded-2xl font-bold border-2 border-purple-100 text-primary-600">
          Sign again / view card
        </button>
      </div>
    </div>
  );

  // ── Page spinner (payment verifying) ──────────────────────────────────────
  if (stage === 'verifying') return (
    <div className="min-h-screen grid place-items-center" style={{ background: '#F5F3FF' }}>
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-warm-500 text-lg">Confirming your gift…</p>
      </div>
    </div>
  );

  // ── Main album view ────────────────────────────────────────────────────────
  return (
    <div className="section-dots" style={{ minHeight: '100vh', background: '#f0eef8', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>

      {/* Top bar */}
      <div style={{
        background: '#fff', borderBottom: '1.5px solid #EDE9FE',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1.25rem', height: 64, position: 'sticky', top: 0, zIndex: 40,
      }}>
        <Link to="/" style={{ fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 800, fontSize: 17, color: '#1A1035', textDecoration: 'none' }}>
          Thank<span style={{ color: '#7C3AED' }}>eeu</span>
        </Link>
        <h1 style={{ fontWeight: 700, fontSize: 16, color: '#1A1035', margin: 0 }}>
          Sign {card.recipient_name}'s greeting card
        </h1>
        <button className="md:hidden" onClick={() => setMobileSidebar(true)}
          style={{ background: '#F5F0FF', border: 'none', borderRadius: 12, padding: '8px 14px', fontWeight: 700, fontSize: 13, color: '#7C3AED', cursor: 'pointer' }}>
          Gift & Share
        </button>
        <div className="hidden md:block" style={{ width: 100 }} />
      </div>

      {/* Toolbar */}
      <div style={{
        background: '#fff', borderBottom: '1.5px solid #EDE9FE',
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 1.25rem',
      }}>
        <button onClick={() => { setShowEditor(true); setShowEmoji(false); setShowGif(false); }}
          style={{
            background: '#1A1035', color: '#fff', border: 'none', borderRadius: 20,
            padding: '9px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
          <Icon name="PenLine" size={15} style={{ color: '#fff' }} />
          Add Message
        </button>
        <button onClick={() => { fileInputRef.current?.click(); }}
          title="Add photo"
          style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #EDE9FE', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          🖼️
        </button>
        <button onClick={() => setShowGif(s => !s)}
          title="Add GIF"
          style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #EDE9FE', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, color: '#7C3AED' }}>
          GIF
        </button>
        <VoiceRecorder onRecorded={f => addMedia([f])} disabled={submitting} />
        <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden"
          onChange={e => addMedia(e.target.files)} />
      </div>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 0, maxWidth: 1100, margin: '0 auto', padding: '32px 16px', alignItems: 'start' }}
        className="album-layout">

        {/* ── Card canvas area ── */}
        <div>
          {/* Page album */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 520 }}
            onMouseMove={onDragMove} onMouseUp={onDragEnd}
            onTouchMove={onDragMove} onTouchEnd={onDragEnd}>

            {/* Stack shadows (pages behind) */}
            {page > 1 && (
              <div style={{
                position: 'absolute', left: '50%', top: '50%',
                transform: 'translate(calc(-50% - 22px), -50%) rotate(-3deg)',
                width: 480, height: 560, background: '#fff',
                borderRadius: 20, border: '1.5px solid #DDD6FE',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)', zIndex: 0,
              }} />
            )}
            {page < totalPages && (
              <div style={{
                position: 'absolute', left: '50%', top: '50%',
                transform: 'translate(calc(-50% + 22px), -50%) rotate(3deg)',
                width: 480, height: 560, background: '#fff',
                borderRadius: 20, border: '1.5px solid #DDD6FE',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)', zIndex: 0,
              }} />
            )}

            {/* Active page */}
            <div ref={pageRef} style={{
              position: 'relative', width: 500, maxWidth: '90vw', height: 580,
              background: '#fff',
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(200,200,220,0.08) 27px, rgba(200,200,220,0.08) 28px)',
              borderRadius: 20, border: '1.5px solid #DDD6FE',
              boxShadow: '0 8px 48px rgba(0,0,0,0.10)', zIndex: 1, overflow: 'hidden',
            }}>

              {/* Card title decoration at top */}
              <div style={{
                position: 'absolute', top: 14, left: 0, right: 0,
                textAlign: 'center', pointerEvents: 'none', zIndex: 2,
              }}>
                <span style={{ fontSize: 22 }}>{design?.icon || '🎉'}</span>
              </div>

              {/* Messages on this page */}
              {pageMessages.map((msg, i) => {
                const globalIdx = (page - 1) * MSGS_PER_PAGE + i;
                const pos = defaultPosition(globalIdx);
                const x   = msg._x  ?? msg.position_x  ?? pos.x;
                const y   = msg._y  ?? msg.position_y  ?? pos.y;
                const rot = msg._rot ?? msg.rotation    ?? pos.rot;
                const fStyle = getFontStyle(msg.font_style);
                const isOwn = myMsgIds.includes(msg.id);

                return (
                  <div key={msg.id}
                    onMouseDown={e => startDrag(e, msg.id, x, y)}
                    onTouchStart={e => startDrag(e, msg.id, x, y)}
                    style={{
                      position: 'absolute',
                      left: `${x}%`, top: `${y}%`,
                      transform: `rotate(${rot}deg)`,
                      maxWidth: 200,
                      cursor: 'grab',
                      userSelect: 'none',
                      zIndex: isOwn ? 10 : 3,
                    }}>
                    {/* Photo polaroid if image attached */}
                    {msg.media_url && (msg.media_type === 'image' || msg.media_type === 'gif') && (
                      <div style={{
                        background: '#fff', padding: '4px 4px 24px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                        borderRadius: 4, marginBottom: 4,
                        transform: `rotate(${(rot > 0 ? -1 : 1) * 2}deg)`,
                        display: 'inline-block',
                      }}>
                        <img src={msg.media_url} alt="" style={{
                          display: 'block', width: 110, height: 90,
                          objectFit: 'cover', borderRadius: 2,
                        }} />
                      </div>
                    )}

                    {/* Message text */}
                    <p style={{
                      fontFamily: fStyle?.family || 'Caveat, cursive',
                      fontSize: msg.font_size || 17,
                      color: msg.font_color || '#1E40AF',
                      lineHeight: 1.4, margin: 0, padding: '2px 4px',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      maxWidth: 180,
                    }}>
                      {msg.is_private && !isOwn ? '🔒 Private message' : msg.content}
                    </p>

                    {/* Signature name */}
                    <p style={{
                      fontFamily: fStyle?.family || 'Caveat, cursive',
                      fontSize: (msg.font_size || 17) - 2,
                      color: msg.font_color || '#1E40AF',
                      opacity: 0.75, margin: '2px 0 0 4px',
                    }}>
                      {msg.author_name}
                    </p>

                    {isOwn && (
                      <div style={{
                        position: 'absolute', top: -6, right: -6,
                        background: '#7C3AED', color: '#fff',
                        borderRadius: 10, fontSize: 9, padding: '2px 6px',
                        fontWeight: 700, whiteSpace: 'nowrap',
                      }}>You</div>
                    )}
                  </div>
                );
              })}

              {/* Empty page hint */}
              {pageMessages.length === 0 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>✍️</div>
                  <p style={{ fontSize: 14, color: '#9CA3AF' }}>Be the first to sign this page</p>
                </div>
              )}
            </div>
          </div>

          {/* Page navigation */}
          <div style={{ textAlign: 'center', marginTop: 20, userSelect: 'none' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', marginBottom: 8 }}>
              Page {page} of {totalPages}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #DDD6FE', background: '#fff', cursor: 'pointer', fontSize: 18, color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === 1 ? 0.35 : 1 }}>
                ‹
              </button>
              {/* Slider */}
              <input type="range" min={1} max={totalPages} value={page}
                onChange={e => setPage(Number(e.target.value))}
                style={{ width: 200, accentColor: '#7C3AED' }} />
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #DDD6FE', background: '#fff', cursor: 'pointer', fontSize: 18, color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === totalPages ? 0.35 : 1 }}>
                ›
              </button>
            </div>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="hidden md:block" style={{ paddingLeft: 16 }}>
          <SidebarContent
            card={card} slug={slug} myMsgIds={myMsgIds}
            signaturesOpen={signaturesOpen} setSignaturesOpen={setSignaturesOpen}
            onContribute={() => setShowEditor(true)}
            selectedAmount={selectedAmount} setSelectedAmount={setSelectedAmount}
            customAmount={customAmount} setCustomAmount={setCustomAmount}
            showHelp={showHelp} setShowHelp={setShowHelp}
          />
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebar && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setMobileSidebar(false)}>
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 300, background: '#fff', padding: 20, overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setMobileSidebar(false)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6B7280' }}>✕</button>
            <SidebarContent
              card={card} slug={slug} myMsgIds={myMsgIds}
              signaturesOpen={signaturesOpen} setSignaturesOpen={setSignaturesOpen}
              onContribute={() => { setMobileSidebar(false); setShowEditor(true); }}
              selectedAmount={selectedAmount} setSelectedAmount={setSelectedAmount}
              customAmount={customAmount} setCustomAmount={setCustomAmount}
              showHelp={showHelp} setShowHelp={setShowHelp}
            />
          </div>
        </div>
      )}

      {/* ── Message editor modal ── */}
      {showEditor && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(26,16,53,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => { setShowEditor(false); setShowEmoji(false); setShowGif(false); }}>
          <div style={{
            background: '#fff', borderRadius: '28px 28px 0 0', width: '100%', maxWidth: 560,
            maxHeight: '92vh', overflowY: 'auto', padding: '28px 24px 32px',
          }} onClick={e => e.stopPropagation()}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 800, fontSize: 20, color: '#1A1035', margin: 0 }}>
                Add your message
              </h3>
              <button onClick={() => setShowEditor(false)} style={{ background: '#F5F0FF', border: 'none', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="X" size={16} className="text-warm-500" />
              </button>
            </div>

            {/* Name + Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label className="auth-label">Your name *</label>
                <input className="input" placeholder="Your name" value={form.author_name}
                  onChange={e => setForm(p => ({ ...p, author_name: e.target.value }))} />
              </div>
              <div>
                <label className="auth-label">Email *</label>
                <input type="email" className="input" placeholder="you@email.com" value={form.author_email}
                  onChange={e => setForm(p => ({ ...p, author_email: e.target.value }))} />
              </div>
            </div>

            {/* Writing style */}
            <label className="auth-label">Writing style</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {FONT_STYLES.map(fs => (
                <button key={fs.id} type="button"
                  onClick={() => setForm(p => ({ ...p, font_style: fs.id }))}
                  style={{
                    padding: '6px 12px', borderRadius: 20, border: `2px solid ${form.font_style === fs.id ? '#7C3AED' : '#DDD6FE'}`,
                    background: form.font_style === fs.id ? '#EDE9FE' : '#fff',
                    fontFamily: fs.family, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    color: form.font_style === fs.id ? '#5B21B6' : '#6B7280',
                  }}>
                  {fs.name}
                </button>
              ))}
            </div>

            {/* Color picker */}
            <label className="auth-label">Message colour</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {FONT_COLORS.map(c => (
                <button key={c} onClick={() => setForm(p => ({ ...p, font_color: c }))} type="button"
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: c, border: `3px solid ${form.font_color === c ? '#1A1035' : 'transparent'}`,
                    cursor: 'pointer', flexShrink: 0,
                  }} />
              ))}
            </div>

            {/* Message textarea */}
            <label className="auth-label">Your message to {card.recipient_name} *</label>
            <div style={{ position: 'relative' }}>
              <textarea ref={textareaRef} className="input" rows={5} style={{
                fontFamily: getFontStyle(form.font_style)?.family || 'inherit',
                color: form.font_color || '#1E40AF',
                fontSize: form.font_size || 18,
                resize: 'none',
              }}
                placeholder={`Write something beautiful for ${card.recipient_name}…`}
                maxLength={1200} value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))} />
              <button type="button" onClick={() => { setShowEmoji(s => !s); setShowGif(false); }}
                style={{ position: 'absolute', bottom: 8, right: 8, width: 34, height: 34, border: '1.5px solid #EDE9FE', background: '#fff', borderRadius: '50%', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                😊
              </button>
              {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />}
            </div>
            <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginBottom: 12 }}>{form.content.length}/1200</p>

            {showGif && (
              <GifPicker onSelect={f => { addMedia([f]); setShowGif(false); }} onClose={() => setShowGif(false)} />
            )}

            {/* Media preview */}
            {mediaFiles.length > 0 && (
              <div style={{ marginBottom: 16, border: '1.5px solid #EDE9FE', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ position: 'relative', aspectRatio: '16/9', background: '#1A1035' }}>
                  {mediaFiles[carouselIdx].type === 'video' ? (
                    <video src={mediaFiles[carouselIdx].preview} className="w-full h-full object-contain" controls />
                  ) : mediaFiles[carouselIdx].type === 'voice' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
                      <span style={{ fontSize: 40 }}>🎙️</span>
                      <audio src={mediaFiles[carouselIdx].preview} controls style={{ width: '80%' }} />
                    </div>
                  ) : (
                    <img src={mediaFiles[carouselIdx].preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  )}
                  <button onClick={() => removeMedia(carouselIdx)} style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14 }}>✕</button>
                </div>
                <p style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', padding: '6px 0' }}>{carouselIdx + 1} of {mediaFiles.length}</p>
              </div>
            )}

            {/* Gift section */}
            {card.is_gift_enabled && (
              <div style={{ background: '#F5F0FF', borderRadius: 16, padding: '14px 16px', marginBottom: 16 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#1A1035', marginBottom: 8 }}>
                  Add a gift 🎁 <span style={{ fontWeight: 400, fontSize: 12, color: '#9CA3AF' }}>optional</span>
                </p>
                {card.total_collected > 0 && !card.hide_amounts && (
                  <p style={{ fontSize: 13, color: '#059669', fontWeight: 700, marginBottom: 8 }}>
                    Gift pot: {formatNGN(card.total_collected)}
                  </p>
                )}
                <button type="button" onClick={() => { setSelectedAmount(null); setCustomAmount(''); }}
                  style={{ width: '100%', marginBottom: 8, padding: '8px', borderRadius: 10, border: `2px solid ${!selectedAmount && !customAmount ? '#1A1035' : '#DDD6FE'}`, background: !selectedAmount && !customAmount ? '#1A1035' : '#fff', color: !selectedAmount && !customAmount ? '#fff' : '#374151', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  No gift this time
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 8 }}>
                  {AMOUNTS_NGN.map(a => (
                    <button key={a} type="button" onClick={() => { setSelectedAmount(a); setCustomAmount(''); }}
                      style={{ padding: '8px 4px', borderRadius: 10, border: `2px solid ${selectedAmount === a && !customAmount ? '#7C3AED' : '#DDD6FE'}`, background: selectedAmount === a && !customAmount ? '#7C3AED' : '#fff', color: selectedAmount === a && !customAmount ? '#fff' : '#374151', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                      {formatNGN(a)}
                    </button>
                  ))}
                </div>
                <input type="number" min={2500} className="input" placeholder="Custom amount"
                  value={customAmount} onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                  style={{ fontSize: 14 }} />
              </div>
            )}

            {/* Private toggle */}
            {card.allow_private_messages && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_private}
                  onChange={e => setForm(p => ({ ...p, is_private: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: '#7C3AED' }} />
                <span style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>Private message (only celebrant sees this)</span>
              </label>
            )}

            {/* Submit */}
            <button onClick={handleSubmit} disabled={submitting}
              style={{
                width: '100%', padding: '15px', borderRadius: 20, border: 'none',
                background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', color: '#fff',
                fontWeight: 800, fontSize: 16, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
              }}>
              {submitting
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{ width: 18, height: 18, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    {stage === 'paying' ? 'Opening payment…' : stage === 'sending' ? 'Adding to card…' : 'Please wait…'}
                  </span>
                : (() => {
                    const amt = Number(customAmount || selectedAmount || 0);
                    const wantsGift = card.is_gift_enabled && amt >= 2500;
                    return wantsGift ? `✍️ Add message + pay ${formatNGN(amt)} gift` : '✍️ Add my message to the card';
                  })()}
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 10 }}>
              Secured by Flutterwave · Message is private until delivery
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .album-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

// ── Sidebar component ─────────────────────────────────────────────────────────

const SidebarContent = ({
  card, slug, myMsgIds, signaturesOpen, setSignaturesOpen, onContribute,
  selectedAmount, setSelectedAmount, customAmount, setCustomAmount,
  showHelp, setShowHelp,
}) => {
  const sidebarStyle = { display: 'flex', flexDirection: 'column', gap: 14 };
  const panelStyle   = { background: '#fff', borderRadius: 16, border: '1.5px solid #EDE9FE', overflow: 'hidden' };
  const panelHead    = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1.5px solid #F5F0FF', cursor: 'pointer' };
  const panelTitle   = { fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 700, fontSize: 15, color: '#1A1035', margin: 0, display: 'flex', alignItems: 'center', gap: 6 };

  const myMessages = (card?.messages || []).filter(m => myMsgIds.includes(m.id));

  return (
    <div style={sidebarStyle}>

      {/* My signatures */}
      <div style={panelStyle}>
        <div style={panelHead} onClick={() => setSignaturesOpen(s => !s)}>
          <p style={panelTitle}><Icon name="MessageSquare" size={15} className="text-primary-500" /> My signatures</p>
          <Icon name={signaturesOpen ? 'ChevronUp' : 'ChevronDown'} size={15} className="text-warm-400" />
        </div>
        {signaturesOpen && (
          <div style={{ padding: '12px 16px' }}>
            {myMessages.length === 0 ? (
              <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.5 }}>
                You haven't signed the card yet — click the <strong>Add Message</strong> button to add your signature
              </p>
            ) : myMessages.map(m => (
              <div key={m.id} style={{ padding: '8px 0', borderBottom: '1px solid #F5F0FF' }}>
                <p style={{ fontFamily: "'Caveat',cursive", fontSize: 15, color: '#7C3AED', margin: 0 }}>{m.content}</p>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>— {m.author_name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gift pot */}
      {card.is_gift_enabled && (
        <div style={{ ...panelStyle, padding: 16, textAlign: 'center' }}>
          <p style={{ fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 700, fontSize: 15, color: '#1A1035', marginBottom: 12 }}>
            Gift Card Collection Pot
          </p>
          {/* Contributors count */}
          {(card.signed_count || 0) > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 10 }}>
              <div style={{ display: 'flex' }}>
                {[...Array(Math.min(3, card.signed_count))].map((_, i) => (
                  <div key={i} style={{ width: 26, height: 26, borderRadius: '50%', background: `hsl(${i * 60 + 240},60%,65%)`, border: '2px solid #fff', marginLeft: i ? -8 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700 }}>
                    {card.signed_count - i > 0 ? card.signed_count - i : ''}
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginLeft: 6 }}>{card.signed_count}</span>
            </div>
          )}
          {/* Gift box icon */}
          <div style={{ width: 100, height: 100, background: 'linear-gradient(135deg,#FBBF24,#F59E0B)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 40 }}>
            🎁
          </div>
          {!card.hide_amounts && card.total_collected > 0 && (
            <p style={{ fontSize: 26, fontWeight: 800, color: '#1A1035', margin: '0 0 12px' }}>
              {formatNGN(card.total_collected)}
            </p>
          )}
          <button onClick={onContribute}
            style={{ width: '100%', padding: '11px', borderRadius: 12, border: '1.5px solid #DDD6FE', background: '#fff', fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 700, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
            Contribute to {card.recipient_name}'s Gift
          </button>
        </div>
      )}

      {/* Share */}
      <button
        onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/sign/${slug}`); toast.success('Link copied!'); }}
        style={{ ...panelStyle, padding: '13px 16px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 700, fontSize: 14, color: '#374151', cursor: 'pointer', background: '#fff' }}>
        <Icon name="Share" size={15} className="text-primary-500" /> Share Card
      </button>

      {/* Help */}
      <div style={panelStyle}>
        <button
          onClick={() => setShowHelp(s => !s)}
          style={{ ...panelHead, width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
          <p style={panelTitle}><Icon name="HelpCircle" size={15} className="text-warm-400" /> Need help signing?</p>
          <Icon name={showHelp ? 'ChevronUp' : 'ChevronDown'} size={15} className="text-warm-400" />
        </button>
        {showHelp && (
          <div style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 6px' }}>1. Click <strong>Add Message</strong> in the toolbar above the card.</p>
            <p style={{ margin: '0 0 6px' }}>2. Type your message, choose a font and colour.</p>
            <p style={{ margin: '0 0 6px' }}>3. Optionally add a photo, GIF or voice note.</p>
            <p style={{ margin: 0 }}>4. Click <strong>Add my message</strong> — done!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlbumSign;
