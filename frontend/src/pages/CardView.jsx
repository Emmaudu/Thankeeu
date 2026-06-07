import { useSEO } from '../hooks/useSEO';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { cardsAPI, memberCardsAPI, messagesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useMemberAuth } from '../context/MemberAuthContext';
import { cardArtClass, getCardDesign, getFontStyle } from '../utils/cardDesigns';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { formatNGN } from '../utils/currency';

const occasionLabel = {
  birthday: 'Birthday', valentine: "Valentine's Day", leaving: 'Farewell',
  anniversary: 'Anniversary', wedding: 'Wedding', baby_shower: 'Baby Shower',
  retirement: 'Retirement', congratulations: 'Congratulations', graduation: 'Graduation',
  promotion: 'Promotion', christmas: 'Christmas', get_well: 'Get Well Soon',
  new_year: 'New Year', other: 'Special Day',
};

const Media = ({ message, large = false }) => {
  if (!message.media_url) return null;
  if (message.media_type === 'video') return <video src={message.media_url} controls className={`w-full rounded-2xl object-cover ${large ? 'max-h-[60vh]' : 'h-36'}`} />;
  if (message.media_type === 'voice') return (
    <div className="rounded-2xl bg-white/75 border border-white p-3 flex items-center gap-3">
      <span className="text-2xl">{'\uD83C\uDFA7'}</span>
      <audio src={message.media_url} controls className="w-full" />
    </div>
  );
  return <img src={message.media_url} alt={`From ${message.author_name}`} className={`w-full rounded-2xl object-cover ${large ? 'max-h-[60vh]' : 'h-36'}`} />;
};

const MessageCard = ({ message, index, design, canViewPrivate, onOpen, onReact }) => {
  const [reacted, setReacted] = useState(false);
  const font = getFontStyle(message.font_style);
  const longMessage = message.content?.length > 120 || (message.content?.split('\n').length || 0) > 3;
  const rotation = index % 3 === 0 ? '-.45deg' : index % 3 === 1 ? '.35deg' : '-.15deg';

  return (
    <article
      className={`message-art-card card-art ${cardArtClass(design)} rounded-[1.75rem] p-5 border border-white/70`}
      style={{ background: design.background, color: design.ink, transform: `rotate(${rotation})` }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-full grid place-items-center text-sm font-extrabold bg-white/80 shadow-sm" style={{ color: design.accent }}>
          {message.author_name?.slice(0, 2).toUpperCase() || '??'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold truncate" style={{ color: design.ink }}>{message.author_name}</p>
          <p className="text-[11px] opacity-60" style={{ color: design.ink }}>{format(new Date(message.created_at), 'MMM d, yyyy')}</p>
        </div>
        {message.is_private && canViewPrivate && <span title="Private message" className="text-lg">{'\uD83D\uDD12'}</span>}
      </div>

      <button type="button" onClick={() => onOpen(message)} className="text-left flex-1 w-full min-h-0">
        <p
          className="message-preview whitespace-pre-wrap break-words"
          style={{
            color: design.ink,
            fontFamily: font.family,
            fontSize: message.font_style === 'calligraphy' ? '1.75rem' : message.font_style === 'handwritten' ? '1.4rem' : '1rem',
            lineHeight: message.font_style === 'calligraphy' ? 1.45 : 1.65,
          }}
        >
          {message.content}
        </p>
        {longMessage && <span className="inline-block mt-2 text-xs font-extrabold underline underline-offset-4" style={{ color: design.accent }}>See more...</span>}
      </button>

      {message.media_url && (
        <div className="w-full mt-4">
          <Media message={message} />
        </div>
      )}

      <div className="mt-auto pt-4">
        {message.contributed_amount > 0 && (
          <div className="mb-3 rounded-xl bg-white/75 border border-white px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: design.ink }}>{'\uD83C\uDF81'} Gift attached</span>
            <span className="text-sm font-extrabold" style={{ color: design.accent }}>{formatNGN(message.contributed_amount)}</span>
          </div>
        )}
        <button
          type="button"
          onClick={async () => {
            if (reacted) return;
            setReacted(true);
            await onReact(message.id).catch(() => {});
          }}
          className="rounded-full bg-white/75 px-3 py-2 text-xs font-bold shadow-sm"
          style={{ color: reacted ? '#e11d48' : design.ink }}
        >
          {'\u2764\uFE0F'} {(message.reactions?.heart || 0) + (reacted ? 1 : 0)}
        </button>
      </div>
    </article>
  );
};

const CardView = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const { member } = useMemberAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [openMessage, setOpenMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  useSEO({
    title: card ? `${card.recipient_name}'s ${occasionLabel[card.occasion] || ''} Card` : 'View Card - Thankeeu',
    description: card ? `A beautiful group card for ${card.recipient_name}.` : 'View a group card on Thankeeu.',
    noIndex: false,
  });

  const fetchCard = async (silent = false) => {
    try {
      const response = token
        ? await cardsAPI.getRecipient(slug, token)
        : user
        ? await cardsAPI.getOne(slug)
        : member
        ? await memberCardsAPI.getOne(slug)
        : await cardsAPI.getPublic(slug);
      setCard(response.data);
    } catch {
      if (!silent) toast.error('Card not found or not available');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCard();
    const refresh = () => fetchCard(true);
    const interval = window.setInterval(refresh, 10000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, [slug, token, user?.id, member?.id]);

  useEffect(() => {
    const close = event => {
      if (event.key === 'Escape') setOpenMessage(null);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setReplyLoading(true);
    try {
      await messagesAPI.reply(slug, { content: replyText });
      toast.success('Your thank-you message was sent');
      setReplyText('');
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setReplyLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen grid place-items-center bg-violet-50">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-warm-500">Unwrapping your card...</p>
      </div>
    </div>
  );

  if (!card) return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">{'\uD83D\uDC8C'}</div>
        <h2 className="text-2xl text-warm-900">Card not found</h2>
      </div>
    </div>
  );

  const messages = card.messages || [];
  const displayMessages = showAll ? messages : messages.slice(0, 8);
  const totalCollected = card.total_collected || 0;
  const design = getCardDesign(card.design_theme);
  const titleFont = getFontStyle(card.font_style);
  const canViewPrivate = Boolean(token || card.isCreator || card.isRecipient);

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8ff]">
      <Navbar />

      <header className={`card-art ${cardArtClass(design)} relative px-4 py-16 sm:py-24`} style={{ background: design.background, color: design.ink }}>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <span className="inline-flex bg-white/75 rounded-full px-4 py-2 text-[11px] font-extrabold tracking-[.2em] uppercase shadow-sm mb-7" style={{ color: design.accent }}>
            A keepsake made with love
          </span>
          <div className="text-6xl sm:text-7xl mb-5 animate-float">{design.icon}</div>
          <h1 className="max-w-4xl mx-auto" style={{ color: design.ink, fontFamily: titleFont.family }}>
            {card.title || `Celebrating ${card.recipient_name}`}
          </h1>
          <p className={`max-w-2xl mx-auto mt-5 text-base sm:text-lg ${design.dark ? 'text-white/75' : 'text-warm-600'}`}>
            {messages.length} {messages.length === 1 ? 'person has' : 'people have'} filled this card with memories, laughter, and love.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-7">
            <span className="bg-white/80 rounded-full px-5 py-2.5 text-sm font-bold shadow-sm" style={{ color: design.ink }}>{'\uD83D\uDC8C'} {messages.length} messages</span>
            {totalCollected > 0 && <span className="bg-emerald-600 text-white rounded-full px-5 py-2.5 text-sm font-bold shadow-sm">{'\uD83C\uDF81'} {formatNGN(totalCollected)} gift</span>}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10 sm:py-14">
        {totalCollected > 0 && (
          <section className="card-art card-art-sunburst rounded-[2rem] bg-gradient-to-br from-emerald-700 to-teal-900 text-white p-6 sm:p-8 mb-9 shadow-xl">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/15 rounded-2xl grid place-items-center text-3xl">{'\uD83C\uDF81'}</div>
                <div>
                  <p className="text-emerald-100 text-xs font-extrabold tracking-[.18em] uppercase">A gift from everyone</p>
                  <h2 className="text-2xl sm:text-3xl text-white mt-1">{formatNGN(totalCollected)}</h2>
                  <p className="text-emerald-100 text-sm">Attached to this card for {card.recipient_name}</p>
                </div>
              </div>
              {token && !card.gift_claim && <Link to={`/gift/${slug}?token=${token}`} className="btn-white">Claim your gift</Link>}
              {token && card.gift_claim && <span className="bg-white/15 rounded-full px-4 py-2 text-sm font-bold">Claim {card.gift_claim.status}</span>}
            </div>
          </section>
        )}

        <div className="no-print flex flex-wrap gap-2 mb-9">
          <button
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`See this special Thankeeu card: ${window.location.href}`)}`, '_blank')}
            className="px-5 py-3 rounded-2xl bg-[#25D366] text-white text-sm font-bold"
          >
            Share on WhatsApp
          </button>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied'); }} className="btn-secondary">Copy link</button>
          <button onClick={() => window.print()} className="btn-secondary">Save or print</button>
        </div>

        <section>
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-extrabold tracking-[.2em] uppercase text-primary-600">The message wall</span>
              <h2 className="text-3xl text-warm-900 mt-2">Words to keep forever</h2>
            </div>
            <span className="text-xs font-bold text-warm-400">{messages.length} notes</span>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-[2rem]">
              <div className="text-5xl mb-3">{'\u2709\uFE0F'}</div>
              <p className="text-warm-500">The first beautiful message is on its way.</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
                {displayMessages.map((message, index) => (
                  <MessageCard
                    key={message.id}
                    message={message}
                    index={index}
                    design={design}
                    canViewPrivate={canViewPrivate}
                    onOpen={setOpenMessage}
                    onReact={id => messagesAPI.react(id, { emoji: 'heart' })}
                  />
                ))}
              </div>
              {messages.length > 8 && !showAll && (
                <div className="text-center mt-8">
                  <button onClick={() => setShowAll(true)} className="btn-primary">See all {messages.length} messages</button>
                </div>
              )}
            </>
          )}
        </section>

        {token && (
          <section className="glass-panel rounded-[2rem] p-6 sm:p-8 mt-10">
            <h3 className="text-2xl text-warm-900 mb-2">Send love back</h3>
            <p className="text-sm text-warm-500 mb-4">Your thank-you note goes to everyone who signed.</p>
            <textarea className="input h-28 resize-none mb-3" placeholder="Write your thank-you message..." value={replyText} onChange={event => setReplyText(event.target.value)} />
            <button onClick={handleReply} disabled={replyLoading || !replyText.trim()} className="btn-primary">{replyLoading ? 'Sending...' : 'Send thank you'}</button>
          </section>
        )}
      </main>

      {openMessage && (
        <div className="message-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setOpenMessage(null)}>
          <div
            className={`card-art ${cardArtClass(design)} celebration-shell w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] p-6 sm:p-9`}
            style={{ background: design.background, color: design.ink }}
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xl font-extrabold" style={{ color: design.ink }}>{openMessage.author_name}</p>
                <p className="text-xs opacity-60" style={{ color: design.ink }}>{format(new Date(openMessage.created_at), 'MMMM d, yyyy')}</p>
              </div>
              <button onClick={() => setOpenMessage(null)} className="w-10 h-10 rounded-full bg-white/80 font-bold" aria-label="Close">x</button>
            </div>
            <p
              className="whitespace-pre-wrap break-words mb-6"
              style={{
                color: design.ink,
                fontFamily: getFontStyle(openMessage.font_style).family,
                fontSize: openMessage.font_style === 'calligraphy' ? '2.1rem' : openMessage.font_style === 'handwritten' ? '1.65rem' : '1.1rem',
                lineHeight: 1.65,
              }}
            >
              {openMessage.content}
            </p>
            <Media message={openMessage} large />
            {openMessage.contributed_amount > 0 && (
              <div className="mt-5 bg-white/75 rounded-2xl px-4 py-3 flex justify-between font-bold" style={{ color: design.ink }}>
                <span>{'\uD83C\uDF81'} Gift attached to this message</span>
                <span style={{ color: design.accent }}>{formatNGN(openMessage.contributed_amount)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default CardView;
