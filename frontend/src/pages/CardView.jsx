import { useSEO, SCHEMAS, BASE_URL } from '../hooks/useSEO';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { cardsAPI, messagesAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const occasionLabel = {
  birthday: 'Birthday', valentine: "Valentine's Day", leaving: 'Farewell',
  anniversary: 'Anniversary', wedding: 'Wedding', baby_shower: 'Baby Shower',
  retirement: 'Retirement', congratulations: 'Congratulations', graduation: 'Graduation',
  promotion: 'Promotion', christmas: 'Christmas', get_well: 'Get Well Soon',
  new_year: 'New Year', other: 'Special Day'
};

const MessageCard = ({ msg, onReact, isPrivate }) => {
  const [reacted, setReacted] = useState(false);
  const handleReact = async () => {
    if (reacted) return;
    setReacted(true);
    await onReact(msg.id);
  };
  return (
    <div className={`rounded-2xl p-4 border transition-shadow hover:shadow-sm ${isPrivate ? 'border-amber-200 bg-amber-50' : 'bg-white border-gray-100'}`}>
      {isPrivate && (
        <div className="flex items-center gap-2 mb-3 text-amber-700 bg-amber-100 rounded-xl px-3 py-1.5 text-xs font-medium">
          🔒 Private message — only you can see this
        </div>
      )}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-bold flex-shrink-0">
          {msg.author_name?.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{msg.author_name}</p>
          <p className="text-xs text-gray-400">{format(new Date(msg.created_at), 'MMM d · h:mm a')}</p>
        </div>
        {msg.media_type && (
          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600 font-medium">
            {msg.media_type === 'video' ? '📹 Video' : msg.media_type === 'voice' ? '🎙️ Voice' : msg.media_type === 'gif' ? '🎭 GIF' : '📷 Photo'}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-700 leading-relaxed mb-3">{msg.content}</p>
      {msg.media_url && (
        <div className="rounded-xl overflow-hidden mb-3">
          {msg.media_type === 'video' ? (
            <video src={msg.media_url} controls className="w-full max-h-48 object-cover" />
          ) : msg.media_type === 'voice' ? (
            <audio src={msg.media_url} controls className="w-full" />
          ) : (
            <img src={msg.media_url} alt="Message media" className="w-full max-h-48 object-cover" />
          )}
        </div>
      )}
      <button onClick={handleReact}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all ${reacted ? 'bg-pink-100 text-pink-600' : 'bg-gray-50 text-gray-500 hover:bg-pink-50 hover:text-pink-500'}`}>
        ❤️ <span>{(msg.reactions?.heart || 0) + (reacted ? 1 : 0)}</span>
      </button>
    </div>
  );
};

const CardView = () => {
  // Dynamic SEO — updates when card data loads
  useSEO({
    title:      card ? `${card.title || `${card.recipient_name}'s ${card.occasion} Card`}` : 'View Card',
    description: card
      ? `A group card for ${card.recipient_name} on Thankeeu — signed by ${messages?.length || 0} people. ${card.is_gift_enabled ? 'A gift pot was collected.' : ''}`
      : 'View a group card on Thankeeu.',
    ogType:    'article',
    twitterCard: 'summary_large_image',
    noIndex:   false,
    jsonLd:    card ? [
      SCHEMAS.organization,
      SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }, { name: card.recipient_name || 'Card', url: `/card/${card.slug}` }]),
      SCHEMAS.cardEvent(card, messages?.length || 0),
    ] : null,
  });

  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

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

  const handleReact = async (messageId) => {
    try { await messagesAPI.react(messageId, { emoji: 'heart' }); }
    catch {}
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setReplyLoading(true);
    try {
      await messagesAPI.reply(slug, { content: replyText });
      toast.success('Thank you reply sent to everyone! 💜');
      setReplyText('');
    } catch { toast.error('Failed to send reply'); }
    finally { setReplyLoading(false); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Card link copied!');
  };

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`Check out my special card! ${window.location.href}`)}`;
    window.open(url, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Opening your card...</p>
      </div>
    </div>
  );

  if (!card) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-6xl mb-4">💌</div>
        <h2 className="font-display text-2xl font-semibold text-gray-900 mb-2">Card not found</h2>
        <p className="text-gray-500">This card may have expired or the link is invalid.</p>
      </div>
    </div>
  );

  const messages = card.messages || [];
  const displayMessages = showAll ? messages : messages.slice(0, 6);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero banner */}
      <div className="py-16 text-center" style={{ background: card.background_color || '#FBEAF0' }}>
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-6xl mb-4">
            {{ birthday: '🎂', valentine: '💝', leaving: '💼', anniversary: '💍', wedding: '💒',
               baby_shower: '👶', retirement: '🏖️', congratulations: '🎉', graduation: '🎓',
               promotion: '🌟', christmas: '🎄', get_well: '🌷', new_year: '✨', other: '💌'
            }[card.occasion] || '💌'}
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-gray-900 mb-3">
            Happy {occasionLabel[card.occasion]}, {card.recipient_name}!
          </h1>
          <p className="text-gray-600 mb-6">
            {messages.length} {messages.length === 1 ? 'person' : 'people'} came together to celebrate you 💜
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span>💬 {messages.length} messages</span>
            {card.total_collected > 0 && <span>🎁 ₦{card.total_collected.toLocaleString()} gift</span>}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Gift banner */}
        {card.total_collected > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center text-2xl">🎁</div>
              <div>
                <p className="font-semibold text-green-800">A gift was collected for you!</p>
                <p className="text-sm text-green-600">Redeem for a Jumia voucher, spa treatment, or flowers</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-display font-bold text-green-700">₦{card.total_collected.toLocaleString()}</p>
              <button className="mt-2 text-xs bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors font-medium">
                Redeem gift
              </button>
            </div>
          </div>
        )}

        {/* Share actions */}
        <div className="flex gap-3 mb-8 overflow-x-auto scrollbar-hide">
          <button onClick={shareWhatsApp} className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#20c05a] transition-colors whitespace-nowrap">
            📲 Share on WhatsApp
          </button>
          <button onClick={copyLink} className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors whitespace-nowrap">
            🔗 Copy link
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors whitespace-nowrap">
            💾 Save card
          </button>
        </div>

        {/* Messages */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl font-semibold text-gray-900">Messages for you</h2>
            <span className="text-sm text-gray-500">{messages.length} messages</span>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <div className="text-4xl mb-3">✉️</div>
              <p className="text-gray-500">No messages yet. Check back soon!</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                {displayMessages.map(msg => (
                  <MessageCard key={msg.id} msg={msg} onReact={handleReact} isPrivate={msg.is_private && token} />
                ))}
              </div>
              {messages.length > 6 && !showAll && (
                <div className="text-center mt-6">
                  <button onClick={() => setShowAll(true)} className="btn-secondary text-sm">
                    View all {messages.length - 6} more messages →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Reply box */}
        {token && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Send a thank you back 💌</h3>
            <textarea
              className="input h-20 resize-none mb-3"
              placeholder="Write a message to everyone who signed..."
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-400">Your reply will be sent to all contributors</p>
              <button onClick={handleReply} disabled={replyLoading || !replyText.trim()} className="btn-primary text-sm py-2 px-5">
                {replyLoading ? 'Sending...' : '💌 Send reply'}
              </button>
            </div>
          </div>
        )}

        {/* Footer brand */}
        <div className="text-center py-6 border-t border-gray-100">
          <p className="text-sm text-gray-400">Made with 💜 using <span className="font-semibold text-primary-400">Thankeeu</span></p>
          <p className="text-xs text-gray-300 mt-1">Nigeria's home for group cards & gifts</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CardView;
