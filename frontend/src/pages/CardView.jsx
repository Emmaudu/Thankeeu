import { useSEO } from '../hooks/useSEO';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { cardsAPI, messagesAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { formatNGN } from '../utils/currency';

const occasionLabel = {
  birthday:'Birthday', valentine:"Valentine's Day", leaving:'Farewell',
  anniversary:'Anniversary', wedding:'Wedding', baby_shower:'Baby Shower',
  retirement:'Retirement', congratulations:'Congratulations', graduation:'Graduation',
  promotion:'Promotion', christmas:'Christmas', get_well:'Get Well Soon',
  new_year:'New Year', other:'Special Day',
};

const occasionEmoji = {
  birthday:'🎂', valentine:'💝', leaving:'💼', anniversary:'💍', wedding:'💒',
  baby_shower:'👶', retirement:'🏖️', congratulations:'🎉', graduation:'🎓',
  promotion:'🌟', christmas:'🎄', get_well:'🌷', new_year:'✨', other:'💌',
};

const MessageCard = ({ msg, onReact, recipientToken }) => {
  const [reacted, setReacted] = useState(false);
  return (
    <div className={`rounded-2xl p-4 border-2 ${msg.is_private && recipientToken ? 'border-amber-300 bg-amber-50' : 'bg-white border-purple-100'}`}>
      {msg.is_private && recipientToken && (
        <div className="flex items-center gap-2 mb-3 text-amber-700 bg-amber-100 rounded-xl px-3 py-1.5 text-xs font-bold">
          🔒 Private — only you see this
        </div>
      )}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-bold flex-shrink-0">
          {msg.author_name?.slice(0,2).toUpperCase() || '??'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-warm-900 truncate">{msg.author_name}</p>
          <p className="text-xs text-warm-400">{format(new Date(msg.created_at), 'MMM d · h:mm a')}</p>
        </div>
        {msg.media_type && (
          <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600 font-semibold flex-shrink-0 border border-blue-100">
            {msg.media_type==='video'?'📹 Video':msg.media_type==='voice'?'🎙️ Voice':msg.media_type==='gif'?'🎭 GIF':'📷 Photo'}
          </span>
        )}
      </div>
      <p className="text-sm text-warm-700 leading-relaxed mb-3 break-words">{msg.content}</p>
      {msg.media_url && (
        <div className="rounded-xl overflow-hidden mb-3">
          {msg.media_type==='video'
            ? <video src={msg.media_url} controls className="w-full max-h-48 object-cover" />
            : msg.media_type==='voice'
            ? <audio src={msg.media_url} controls className="w-full" />
            : <img src={msg.media_url} alt="Media" className="w-full max-h-48 object-cover" />
          }
        </div>
      )}
      <button onClick={async () => { if(reacted) return; setReacted(true); await onReact(msg.id).catch(()=>{}); }}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-semibold transition-all ${
          reacted ? 'bg-rose-100 text-rose-600' : 'bg-purple-50 text-warm-500 hover:bg-rose-50 hover:text-rose-500'
        }`}>
        ❤️ {(msg.reactions?.heart || 0) + (reacted ? 1 : 0)}
      </button>
    </div>
  );
};

const CardView = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  useSEO({
    title: card ? `${card.recipient_name}'s ${occasionLabel[card.occasion] || ''} Card 💜` : 'View Card — Thankeeu',
    description: card
      ? `A group card for ${card.recipient_name}. Signed by ${card.messages?.length || 0} people on Thankeeu.`
      : 'View a group card on Thankeeu.',
    noIndex: false,
  });

  useEffect(() => { fetchCard(); }, [slug]);

  const fetchCard = async () => {
    try {
      const res = token
        ? await cardsAPI.getOne(slug, token)
        : await cardsAPI.getPublic(slug);
      setCard(res.data);
    } catch { toast.error('Card not found or not available'); }
    finally { setLoading(false); }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setReplyLoading(true);
    try {
      await messagesAPI.reply(slug, { content: replyText });
      toast.success('Thank you message sent! 💜');
      setReplyText('');
    } catch { toast.error('Failed to send reply'); }
    finally { setReplyLoading(false); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied! 🔗');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center px-4">
        <div className="w-14 h-14 border-4 border-primary-300 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"/>
        <p className="text-warm-500 text-sm">Opening your card…</p>
      </div>
    </div>
  );

  if (!card) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">💌</div>
        <h2 className="font-display text-2xl font-bold text-warm-900 mb-3">Card not found</h2>
        <p className="text-warm-500">This card may have expired or the link is invalid.</p>
      </div>
    </div>
  );

  const messages = card.messages || [];
  const displayMessages = showAll ? messages : messages.slice(0, 8);
  const totalCollected = card.total_collected || 0;
  const emoji = occasionEmoji[card.occasion] || '💌';

  return (
    <div className="min-h-screen flex flex-col" style={{ background:'#FDFCFF' }}>
      <Navbar />

      {/* Hero banner */}
      <div className="py-12 sm:py-16 text-center px-4" style={{ background: card.background_color || 'linear-gradient(135deg,#F5F0FF,#FFF0F5)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl sm:text-7xl mb-4 animate-bounce-soft">{emoji}</div>
          <h1 className="font-display font-bold text-warm-900 mb-3 px-2" style={{ fontSize:'clamp(1.6rem,6vw,3rem)' }}>
            Happy {occasionLabel[card.occasion]},<br/>{card.recipient_name}!
          </h1>
          <p className="text-warm-600 mb-4 text-sm sm:text-base">
            {messages.length} {messages.length===1?'person':'people'} came together to celebrate you 💜
          </p>
          {/* Quick stats */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-warm-600">
            <span className="flex items-center gap-1">💬 {messages.length} messages</span>
            {totalCollected > 0 && <span className="flex items-center gap-1 font-bold text-green-700">🎁 {formatNGN(totalCollected)}</span>}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 sm:py-10">

        {/* Gift banner */}
        {totalCollected > 0 && (
          <div className="bg-green-50 border-2 border-green-200 rounded-3xl p-4 sm:p-6 mb-7">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-200 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">🎁</div>
                <div>
                  <p className="font-bold text-green-800 text-sm sm:text-base">A gift was collected for you!</p>
                  <p className="text-xs sm:text-sm text-green-600">From {messages.length} people who love you</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl sm:text-3xl font-bold text-green-700">{formatNGN(totalCollected)}</p>
              </div>
            </div>
            {token && (
              <div className="mt-4 pt-4 border-t border-green-200">
                <p className="text-sm text-green-700 font-semibold mb-3">Claim your gift 🎊</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link to={`/gift/${slug}?token=${token}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-3 rounded-2xl hover:bg-green-700 transition-colors font-bold text-sm">
                    🏦 Claim to bank account
                  </Link>
                  <Link to={`/gift/${slug}?token=${token}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-white text-green-700 border-2 border-green-300 px-5 py-3 rounded-2xl hover:bg-green-50 transition-colors font-bold text-sm">
                    🛒 Redeem as voucher
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mb-7">
          <div className="bg-white rounded-2xl border-2 border-purple-100 p-3 sm:p-4 text-center">
            <p className="font-display text-xl sm:text-2xl font-bold text-warm-900">{messages.length}</p>
            <p className="text-xs text-warm-500 mt-0.5">Messages</p>
          </div>
          <div className="bg-white rounded-2xl border-2 border-purple-100 p-3 sm:p-4 text-center">
            <p className="font-display text-xl sm:text-2xl font-bold text-warm-900">{messages.filter(m=>m.media_url).length}</p>
            <p className="text-xs text-warm-500 mt-0.5">Photos & Videos</p>
          </div>
          <div className="bg-white rounded-2xl border-2 border-purple-100 p-3 sm:p-4 text-center">
            <p className="font-display text-xl sm:text-2xl font-bold text-primary-600">{formatNGN(totalCollected)}</p>
            <p className="text-xs text-warm-500 mt-0.5">Gift Total</p>
          </div>
        </div>

        {/* Share bar */}
        <div className="flex flex-wrap gap-2 mb-7 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          <button onClick={() => { const url=`https://wa.me/?text=${encodeURIComponent(`Check out this special card! ${window.location.href}`)}`; window.open(url,'_blank'); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white whitespace-nowrap flex-shrink-0 transition-colors"
            style={{ background:'#25D366' }}>
            📲 Share on WhatsApp
          </button>
          <button onClick={copyLink}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold border-2 border-purple-200 text-warm-700 bg-white hover:bg-purple-50 whitespace-nowrap flex-shrink-0 transition-colors">
            🔗 Copy link
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold border-2 border-purple-200 text-warm-700 bg-white hover:bg-purple-50 whitespace-nowrap flex-shrink-0 transition-colors">
            💾 Save card
          </button>
        </div>

        {/* Messages */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-warm-900">Messages for you 💌</h2>
            <span className="text-xs text-warm-400 font-semibold">{messages.length} total</span>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border-2 border-purple-100">
              <div className="text-4xl mb-3">✉️</div>
              <p className="text-warm-500 font-medium">No messages yet — check back soon!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {displayMessages.map(msg => (
                  <MessageCard key={msg.id} msg={msg}
                    onReact={(id) => messagesAPI.react(id,{emoji:'heart'})}
                    recipientToken={token} />
                ))}
              </div>
              {messages.length > 8 && !showAll && (
                <div className="text-center mt-5">
                  <button onClick={() => setShowAll(true)}
                    className="btn-secondary text-sm px-6 py-3">
                    See all {messages.length - 8} more messages →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Reply box — recipient only */}
        {token && (
          <div className="bg-white rounded-3xl border-2 border-purple-100 p-5 mb-7">
            <h3 className="font-bold text-warm-900 mb-4">Send a thank you back 💌</h3>
            <textarea
              className="input h-20 resize-none mb-3"
              placeholder="Write a message to everyone who signed…"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
            />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-xs text-warm-400">Your reply goes to all contributors</p>
              <button onClick={handleReply} disabled={replyLoading||!replyText.trim()}
                className="btn-primary text-sm py-2.5 px-5 w-full sm:w-auto">
                {replyLoading ? '…' : '💌 Send thank you'}
              </button>
            </div>
          </div>
        )}

        {/* Footer brand */}
        <div className="text-center py-5 border-t border-purple-100">
          <p className="text-sm text-warm-400">Made with 💜 using <span className="font-bold text-primary-500">Thankeeu</span></p>
          <p className="text-xs text-warm-300 mt-1">Group cards & gifts for every occasion, worldwide</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CardView;
