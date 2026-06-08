import { useSEO } from '../../hooks/useSEO';
import { useState, useEffect } from 'react';
import { deductionsAPI, banksAPI } from '../../utils/api';
import { useMemberAuth } from '../../context/MemberAuthContext';
import MemberLayout from '../../components/member/MemberLayout';
import toast from 'react-hot-toast';
import { formatNGN } from '../../utils/currency';
import { format, parseISO } from 'date-fns';

const occasionEmoji = {
  birthday:'🎂',leaving:'👋',work_anniversary:'🏆',promotion:'🌟',
  anniversary:'💍',graduation:'🎓',other:'🎉',wedding:'💒',
};

const StatusBadge = ({ status }) => {
  const c = {
    pending:  'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-600 border-red-200',
  }[status] || 'bg-gray-50 text-gray-500 border-gray-200';
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${c}`}>{status}</span>;
};

const MemberDeductionsPage = () => {
  useSEO({ title: 'Deductions — Thankeeu for Teams', noIndex: true });
  const { member } = useMemberAuth();

  const [occasions,  setOccasions]  = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState('occasions');

  // Request form
  const [selectedCard, setSelectedCard] = useState(null);
  const [form,   setForm]   = useState({ amount: '', reason: '' });
  const [saving, setSaving] = useState(false);

  // Bank accounts
  const [accounts,      setAccounts]     = useState([]);
  const [bankLoading,   setBankLoading]  = useState(false);
  const [withdrawing,   setWithdrawing]  = useState(null);

  useEffect(() => {
    // Use leaderAuth routes — NOT companyAxios
    Promise.all([
      deductionsAPI.getLeaderOccasions(),
      deductionsAPI.getLeaderRequests(),
      banksAPI.getMy(),
    ]).then(([occ, req, banks]) => {
      setOccasions(occ.data || []);
      setMyRequests(req.data || []);
      setAccounts(banks.data || []);
    }).catch(err => {
      toast.error('Failed to load deductions: ' + (err.response?.data?.error || err.message));
    }).finally(() => setLoading(false));
  }, []);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!selectedCard) return toast.error('Select a card first');
    if (!form.amount || isNaN(form.amount) || Number(form.amount) < 100)
      return toast.error('Enter a valid amount (min ₦100)');
    if (!form.reason.trim()) return toast.error('Please provide a reason');
    setSaving(true);
    try {
      await deductionsAPI.request({
        card_id: selectedCard.id,
        amount: Number(form.amount),
        reason: form.reason,
      });
      toast.success('Deduction request sent to HR for approval ✓');
      setForm({ amount: '', reason: '' });
      setSelectedCard(null);
      deductionsAPI.getLeaderRequests().then(r => setMyRequests(r.data || []));
      deductionsAPI.getLeaderOccasions().then(r => setOccasions(r.data || []));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit request');
    } finally { setSaving(false); }
  };

  const handleWithdraw = async (req) => {
    if (!accounts.length) {
      toast.error('Add your bank account in Settings first');
      return;
    }
    const defaultAccount = accounts.find(a => a.is_default) || accounts[0];
    setWithdrawing(req.id);
    try {
      const res = await banksAPI.withdraw({
        amount: req.amount,
        source_type: 'deduction',
        source_id: req.id,
        bank_account_id: defaultAccount.id,
      });
      toast.success(res.data.message || `₦${req.amount.toLocaleString()} transfer initiated!`);
      deductionsAPI.getLeaderRequests().then(r => setMyRequests(r.data || []));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Withdrawal failed. Check your bank account details.');
    } finally { setWithdrawing(null); }
  };

  const approvedUnwithdrawn = myRequests.filter(r => r.status === 'approved' && !r.withdrawal_requested);

  return (
    <MemberLayout title="Deductions 💰" subtitle="Manage gift pot deductions for your department">

      {/* Approved ready-to-withdraw banner */}
      {approvedUnwithdrawn.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div className="flex-1">
            <p className="font-semibold text-green-800 text-sm">{approvedUnwithdrawn.length} deduction{approvedUnwithdrawn.length > 1 ? 's' : ''} approved and ready to withdraw!</p>
            <p className="text-xs text-green-600 mt-0.5">
              {!accounts.length ? 'Add your bank account in Settings to receive funds' : `Total: ${formatNGN(approvedUnwithdrawn.reduce((s,r) => s + r.amount, 0))}`}
            </p>
          </div>
          <button onClick={() => setTab('requests')} className="btn-primary text-xs py-2 px-4 flex-shrink-0">View →</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-purple-50 p-1 rounded-xl mb-5 overflow-x-auto scrollbar-hide">
        {[
          { id:'occasions', label:'🎉 Dept Occasions' },
          { id:'request',   label:'📝 New Request' },
          { id:'requests',  label:`📋 My Requests${myRequests.length ? ` (${myRequests.length})` : ''}` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-1 ${
              tab === t.id ? 'bg-white text-primary-700 shadow-sm' : 'text-warm-500 hover:text-warm-800'
            }`}>{t.label}</button>
        ))}
      </div>

      {/* Tab: Occasions */}
      {tab === 'occasions' && (
        loading ? <div className="space-y-3">{[...Array(4)].map((_,i) => <div key={i} className="h-20 rounded-2xl animate-pulse bg-purple-50"/>)}</div>
        : occasions.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-purple-100 p-10 text-center">
            <div className="text-5xl mb-3">💸</div>
            <p className="font-semibold text-warm-900 mb-1">No gift pots available</p>
            <p className="text-sm text-warm-500">Gift pot balances from your department's cards will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {occasions.map(card => (
              <div key={card.id} className="bg-white rounded-2xl border-2 border-purple-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-xl flex-shrink-0">
                      {occasionEmoji[card.occasion] || '💌'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-warm-900 text-sm truncate">{card.title || `${card.recipient_name}'s Card`}</p>
                      <p className="text-xs text-warm-500 capitalize">{card.occasion?.replace('_',' ')} · {card.status}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-green-700 text-sm">{formatNGN(card.wallet?.net_after_fee - (card.wallet?.total_deducted||0))}</p>
                    <p className="text-xs text-warm-400">available</p>
                  </div>
                </div>

                {/* Existing deductions for this card */}
                {card.my_deductions?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-purple-50 space-y-1.5">
                    {card.my_deductions.map(d => (
                      <div key={d.id} className="flex items-center justify-between text-xs">
                        <span className="text-warm-500">{d.reason} · {d.created_at ? format(parseISO(d.created_at),'MMM d') : ''}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-warm-800">{formatNGN(d.amount)}</span>
                          <StatusBadge status={d.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => { setSelectedCard(card); setTab('request'); }}
                  className="mt-3 w-full btn-secondary text-xs py-2">
                  📝 Request deduction from this pot
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* Tab: New Request */}
      {tab === 'request' && (
        <div className="bg-white rounded-2xl border-2 border-purple-100 p-5 max-w-lg">
          <h3 className="font-semibold text-warm-900 mb-1">Request a deduction</h3>
          <p className="text-xs text-warm-500 mb-5">HR will review and approve the amount. Once approved, you can withdraw to your bank account.</p>

          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-warm-700 mb-1.5">Card / occasion *</label>
              {selectedCard ? (
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <span className="text-xl">{occasionEmoji[selectedCard.occasion] || '💌'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-warm-900 truncate">{selectedCard.title || `${selectedCard.recipient_name}'s Card`}</p>
                    <p className="text-xs text-green-700 font-semibold">
                      {formatNGN(selectedCard.wallet?.net_after_fee - (selectedCard.wallet?.total_deducted||0))} available
                    </p>
                  </div>
                  <button type="button" onClick={() => setSelectedCard(null)} className="text-warm-400 hover:text-rose-500 text-lg">×</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {occasions.length === 0 ? (
                    <p className="text-sm text-warm-400">No cards with gift pot balance available.</p>
                  ) : occasions.map(c => (
                    <button key={c.id} type="button" onClick={() => setSelectedCard(c)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-purple-100 hover:border-primary-300 hover:bg-purple-50 transition-all text-left">
                      <span className="text-lg">{occasionEmoji[c.occasion] || '💌'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-warm-900 truncate">{c.title || `${c.recipient_name}'s Card`}</p>
                        <p className="text-xs text-green-700">{formatNGN(c.wallet?.net_after_fee - (c.wallet?.total_deducted||0))} available</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedCard && <>
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1.5">Amount (₦) *</label>
                <input type="number" className="input" placeholder={`Max ${(selectedCard.wallet?.net_after_fee - (selectedCard.wallet?.total_deducted||0)).toLocaleString()}`}
                  value={form.amount} onChange={e => setForm(p => ({...p, amount: e.target.value}))}
                  min="100" max={selectedCard.wallet?.net_after_fee - (selectedCard.wallet?.total_deducted||0)} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1.5">Reason for deduction *</label>
                <textarea className="input resize-none" rows={3}
                  placeholder="e.g. Physical celebration supplies, decorations, food..."
                  value={form.reason} onChange={e => setForm(p => ({...p, reason: e.target.value}))} required />
              </div>
              <button type="submit" disabled={saving} className="btn-primary w-full py-3">
                {saving ? 'Submitting…' : '📤 Submit to HR for approval'}
              </button>
            </>}
          </form>
        </div>
      )}

      {/* Tab: My Requests */}
      {tab === 'requests' && (
        <div className="space-y-3">
          {loading ? <div className="space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="h-20 rounded-2xl animate-pulse bg-purple-50"/>)}</div>
          : myRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-purple-100 p-10 text-center">
              <div className="text-5xl mb-3">📋</div>
              <p className="font-semibold text-warm-900 mb-1">No requests yet</p>
              <p className="text-sm text-warm-500">Your deduction requests will appear here after submission.</p>
            </div>
          ) : myRequests.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border-2 border-purple-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-warm-900 text-sm">{req.reason}</p>
                  <p className="text-xs text-warm-500">
                    {req.card?.recipient_name}'s card · {req.created_at ? format(parseISO(req.created_at),'MMM d, yyyy') : ''}
                  </p>
                  {req.note && <p className="text-xs text-primary-500 mt-1 italic">HR note: "{req.note}"</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-warm-900">{formatNGN(req.amount)}</p>
                  <StatusBadge status={req.status} />
                </div>
              </div>

              {/* Withdraw button — only shown when approved and not yet withdrawn */}
              {req.status === 'approved' && !req.withdrawal_requested && (
                <div className="mt-3 pt-3 border-t border-purple-50">
                  {!accounts.length ? (
                    <p className="text-xs text-warm-500">⚠️ Add your bank account in Settings to withdraw these funds.</p>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-warm-500">
                        Ready to withdraw to{' '}
                        <strong>{(accounts.find(a=>a.is_default)||accounts[0])?.bank_name}</strong>{' '}
                        ****{(accounts.find(a=>a.is_default)||accounts[0])?.account_number?.slice(-4)}
                      </p>
                      <button
                        onClick={() => handleWithdraw(req)}
                        disabled={!!withdrawing}
                        className="btn-primary text-xs py-2 px-4 flex-shrink-0">
                        {withdrawing === req.id ? 'Withdrawing…' : '💸 Withdraw'}
                      </button>
                    </div>
                  )}
                </div>
              )}
              {req.withdrawal_requested && (
                <div className="mt-3 pt-3 border-t border-purple-50">
                  <p className="text-xs text-green-700 font-semibold">✓ Withdrawal initiated</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </MemberLayout>
  );
};

export default MemberDeductionsPage;
