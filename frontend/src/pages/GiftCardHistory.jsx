import { useState, useEffect } from 'react';
import { giftcardsAPI } from '../utils/api';
import { formatNGN } from '../utils/currency';
import Icon from '../components/ui/Icon';
import toast from 'react-hot-toast';
import { asArray } from '../utils/asArray';

const STATUS_STYLE = {
  paid:       'bg-green-100 text-green-700',
  processing: 'bg-amber-100 text-amber-700',
  pending:    'bg-blue-100  text-blue-700',
  rejected:   'bg-red-100   text-red-600',
};

const CLAIM_META = {
  giftcard: { icon: '🎫', label: 'Gift Card',      color: '#8B5CF6' },
  transfer: { icon: '🏦', label: 'Bank Transfer',  color: '#0EA5E9' },
  airtime:  { icon: '📱', label: 'Airtime Top-up', color: '#10B981' },
  shopping: { icon: '🛍️', label: 'Shopping Gift',  color: '#F59E0B' },
  spa:      { icon: '🧖', label: 'Spa Gift',       color: '#EC4899' },
  flowers:  { icon: '🌸', label: 'Flowers Gift',   color: '#F43F5E' },
  food:     { icon: '🍽️', label: 'Food Gift',      color: '#84CC16' },
};

export default function GiftCardHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(null);
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    giftcardsAPI.myHistory()
      .then(r => setHistory(asArray(r.data)))
      .catch(err => {
        const msg = err?.response?.data?.error || 'Could not load gift history';
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  const copyCode = (id, code) => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(id);
      toast.success('Code copied!');
      setTimeout(() => setCopied(null), 2000);
    }).catch(() => toast.error('Could not copy — please copy manually'));
  };

  // Unique claim types present in history for filter chips
  const presentTypes = ['all', ...new Set(history.map(h => h.claim_type).filter(Boolean))];

  const filtered = filter === 'all' ? history
    : history.filter(h => h.claim_type === filter);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"/>
    </div>
  );

  if (history.length === 0) return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">🎫</div>
      <h3 className="text-lg font-bold text-warm-900 mb-2">No gift history yet</h3>
      <p className="text-warm-500 text-sm max-w-xs mx-auto leading-relaxed">
        When you redeem a gift pot on a card — as a gift card, bank transfer, or airtime — it will appear here.
      </p>
    </div>
  );

  return (
    <div>
      {/* Filter chips */}
      {presentTypes.length > 2 && (
        <div className="flex gap-2 flex-wrap mb-5">
          {presentTypes.map(type => {
            const meta = CLAIM_META[type];
            const active = filter === type;
            return (
              <button key={type} onClick={() => setFilter(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${
                  active
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white border border-purple-100 text-warm-600 hover:border-primary-300'
                }`}>
                {type === 'all' ? `All (${history.length})` : `${meta?.icon || '🎁'} ${meta?.label || type}`}
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(item => {
          const meta     = CLAIM_META[item.claim_type] || { icon: '🎁', label: item.claim_type, color: '#7C3AED' };
          const cardTitle = item.cards?.title
            || (item.cards?.recipient_name ? `${item.cards.recipient_name}'s card` : 'Deleted card');
          const dateLabel = (item.processed_at || item.created_at)
            ? new Date(item.processed_at || item.created_at)
                .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—';
          const hasCode   = !!item.redemption_code;
          const isGiftCard = item.claim_type === 'giftcard' || item.claim_type === 'airtime';
          const isTransfer = item.claim_type === 'transfer';

          return (
            <div key={item.id}
              className="bg-white rounded-2xl border-2 border-purple-50 p-4 sm:p-5 hover:border-purple-100 transition-all">

              <div className="flex items-start justify-between gap-3">
                {/* Left */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                    style={{ background: `${meta.color}18` }}>
                    {meta.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-warm-900 text-sm">
                      {item.product_name || meta.label}
                    </p>
                    <p className="text-xs text-warm-400 mt-0.5">
                      From: <span className="text-warm-600 font-medium">{cardTitle}</span>
                    </p>
                    <p className="text-xs text-warm-300 mt-0.5">{dateLabel}</p>
                  </div>
                </div>

                {/* Right */}
                <div className="flex-shrink-0 text-right">
                  <p className="font-extrabold text-primary-600 text-base">{formatNGN(item.amount)}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mt-1 capitalize ${STATUS_STYLE[item.status] || 'bg-gray-100 text-gray-600'}`}>
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Gift card / airtime code — show whenever code exists, regardless of status */}
              {isGiftCard && hasCode && (
                <div className="mt-3 pt-3 border-t border-purple-50">
                  <p className="text-xs font-semibold text-warm-500 mb-1.5">Your code</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-purple-50 rounded-xl px-4 py-2.5 font-mono text-sm font-bold text-primary-700 tracking-widest break-all select-all">
                      {item.redemption_code}
                    </div>
                    <button onClick={() => copyCode(item.id, item.redemption_code)}
                      title="Copy code"
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2"
                      style={{
                        background:  copied === item.id ? '#D1FAE5' : '#F5F3FF',
                        borderColor: copied === item.id ? '#6EE7B7' : '#DDD6FE',
                      }}>
                      <Icon name={copied === item.id ? 'Check' : 'Copy'} size={16}
                        style={{ color: copied === item.id ? '#059669' : '#7C3AED' }}/>
                    </button>
                  </div>
                  {item.status === 'rejected' && (
                    <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2 mt-2 flex items-center gap-1.5">
                      <Icon name="AlertCircle" size={13}/>
                      This order was marked rejected (likely sandbox mode). The code above may still work — try redeeming it.
                    </p>
                  )}
                </div>
              )}

              {/* No code yet — processing or paid but Reloadly sends code by email */}
              {isGiftCard && !hasCode && (item.status === 'paid' || item.status === 'processing') && (
                <div className="mt-3 pt-3 border-t border-purple-50">
                  <p className="text-xs text-blue-700 bg-blue-50 rounded-xl px-3 py-2 flex items-center gap-1.5">
                    <Icon name="Clock" size={13}/>
                    {item.status === 'processing'
                      ? 'Processing — your code will appear here and be emailed to you.'
                      : 'Code will arrive in your email from Reloadly shortly.'}
                  </p>
                </div>
              )}

              {/* Rejected with no code — explain why */}
              {isGiftCard && !hasCode && item.status === 'rejected' && (
                <div className="mt-3 pt-3 border-t border-purple-50">
                  <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 flex items-center gap-1.5">
                    <Icon name="AlertCircle" size={13}/>
                    Order was rejected and no code was issued. This usually happens in sandbox mode — switch to Reloadly live keys to fix this.
                  </p>
                </div>
              )}

              {/* Bank transfer details */}
              {isTransfer && item.status === 'paid' && item.bank_name && (
                <div className="mt-3 pt-3 border-t border-purple-50">
                  <p className="text-xs text-warm-500 mb-1">Sent to</p>
                  <p className="text-sm font-semibold text-warm-800">
                    {item.bank_name} — {item.account_number}
                  </p>
                  {item.account_name && (
                    <p className="text-xs text-warm-500 mt-0.5">{item.account_name}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
