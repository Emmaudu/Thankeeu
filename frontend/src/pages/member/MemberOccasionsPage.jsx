import { useSEO } from '../../hooks/useSEO';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { memberAPI, memberCardsAPI, deductionsAPI } from '../../utils/api';
import { useMemberAuth } from '../../context/MemberAuthContext';
import MemberLayout from '../../components/member/MemberLayout';
import toast from 'react-hot-toast';

const OCCASION_ICONS = {
  birthday: '🎂', leaving: '👋', work_anniversary: '🏆', promotion: '🌟',
  wedding: '💍', valentines_day: '💝', womens_day: '👩', mens_day: '👨',
  workers_day: '✊', graduation: '🎓', new_baby: '👶', retirement: '🏖️', other: '🎉',
};

const MemberOccasionsPage = () => {
  useSEO({ title: 'Occasions — Thankeeu for Teams', noIndex: true });

  const { member } = useMemberAuth();
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating]     = useState(false);
  const [cardForm, setCardForm]     = useState({
    recipient_name: '', recipient_email: '', occasion: 'birthday',
    title: '', is_gift_enabled: true, notification_scope: 'department',
  });

  useEffect(() => {
    memberAPI.getDashboard()
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load occasions'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateCard = async (e) => {
    e.preventDefault();
    if (!cardForm.recipient_name.trim()) return toast.error('Recipient name is required');
    setCreating(true);
    try {
      const title = cardForm.title || `${cardForm.recipient_name}'s ${cardForm.occasion.replace('_', ' ')} Card`;

      // If cross-dept scope, it will need HR approval — handled server-side
      const res = await memberCardsAPI.create({
        ...cardForm, title,
        company_id: member.company_id,
        created_by_member_id: member.id,
        status: 'active',
        design_theme: 'rose_love',
        background_color: '#FBEAF0',
        allow_private_messages: true,
        send_reminders: true,
      });

      const slug = res.data.slug;

      // If cross-dept, submit approval request automatically
      if (cardForm.notification_scope === 'company_wide') {
        try {
          await deductionsAPI.requestCrossDept({ card_id: res.data.id, reason: `Card created by ${member.first_name} ${member.last_name} for ${cardForm.recipient_name}` });
          toast.success('Card created! Company-wide notification request sent to HR for approval.');
        } catch {
          toast.success('Card created! Sent to your department.');
        }
      } else {
        toast.success('Card created! Your department has been notified to sign.');
      }

      // Copy link to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/sign/${slug}`).catch(() => {});
      setShowCreate(false);
      setCardForm({ recipient_name: '', recipient_email: '', occasion: 'birthday', title: '', is_gift_enabled: true, notification_scope: 'department' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create card');
    } finally { setCreating(false); }
  };

  const upcoming = data?.upcoming_occasions || [];

  return (
    <MemberLayout title="Occasions" subtitle={`Upcoming celebrations in your company · ${member?.department}`}>

      {/* Create card CTA */}
      <div className="bg-gradient-to-r from-primary-50 to-pink-50 border border-primary-100 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900 mb-1">🎉 Create a card for any colleague</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            You can create a group card for any colleague — or even for yourself! The rest of the team will be notified to sign and contribute.
            <br /><span className="text-xs text-gray-400">No account needed to sign a card. Creating a card requires your team account.</span>
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="btn-pink text-sm py-2.5 px-6 whitespace-nowrap flex-shrink-0">
          + Create card
        </button>
      </div>

      {/* Upcoming occasions */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-gray-900">Upcoming occasions — next 30 days</h3>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}</div>
        ) : upcoming.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-sm text-gray-400">No upcoming occasions in the next 30 days</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {upcoming.map(m => (
              <div key={m.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-11 h-11 bg-primary-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                  {OCCASION_ICONS[m.occasion_types?.name] || '🎉'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{m.first_name} {m.last_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {m.occasion_types?.label} · {m.department} ·{' '}
                    {new Date(m.occasion_date).toLocaleDateString('en', { day: 'numeric', month: 'long' })}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    m.days_until === 0 ? 'bg-pink-100 text-pink-700' :
                    m.days_until <= 2 ? 'bg-red-100 text-red-600' :
                    m.days_until <= 7 ? 'bg-amber-100 text-amber-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {m.days_until === 0 ? '🎉 Today!' : m.days_until === 1 ? 'Tomorrow' : `${m.days_until} days`}
                  </span>
                  {m.card_slug ? (
                    <a href={`/sign/${m.card_slug}`} target="_blank" rel="noreferrer"
                      className="text-xs bg-pink-50 text-pink-600 hover:bg-pink-100 px-3 py-1.5 rounded-xl transition-colors font-medium">
                      Sign card →
                    </a>
                  ) : (
                    <button
                      onClick={() => {
                        setCardForm(p => ({
                          ...p,
                          recipient_name: `${m.first_name} ${m.last_name}`,
                          recipient_email: m.email,
                          occasion: m.occasion_types?.name || 'other',
                          title: `Happy ${m.occasion_types?.label}, ${m.first_name}! ${m.occasion_types?.icon || '🎉'}`,
                        }));
                        setShowCreate(true);
                      }}
                      className="text-xs bg-primary-50 text-primary-600 hover:bg-primary-100 px-3 py-1.5 rounded-xl transition-colors font-medium">
                      Create card
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create card modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl font-semibold text-gray-900">Create a card</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleCreateCard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Who is this card for? <span className="text-red-400">*</span></label>
                <input className="input" placeholder="e.g. Amaka Okafor" value={cardForm.recipient_name}
                  onChange={e => setCardForm(p => ({ ...p, recipient_name: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Their email <span className="text-gray-400 font-normal text-xs">(to deliver card)</span></label>
                <input type="email" className="input" placeholder="amaka@company.com" value={cardForm.recipient_email}
                  onChange={e => setCardForm(p => ({ ...p, recipient_email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Occasion</label>
                <select className="input" value={cardForm.occasion} onChange={e => setCardForm(p => ({ ...p, occasion: e.target.value }))}>
                  {Object.entries(OCCASION_ICONS).map(([k, v]) => (
                    <option key={k} value={k}>{v} {k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Card title <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
                <input className="input" placeholder={`Happy ${cardForm.occasion.replace(/_/g,' ')} ${cardForm.recipient_name || ''}!`}
                  value={cardForm.title} onChange={e => setCardForm(p => ({ ...p, title: e.target.value }))} />
              </div>

              {/* Notification scope */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Who should be notified?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'department', icon: '👥', label: 'Department only', desc: 'Your dept members' },
                    { id: 'company_wide', icon: '🏢', label: 'Entire company', desc: 'Needs HR approval' },
                  ].map(opt => (
                    <button key={opt.id} type="button" onClick={() => setCardForm(p => ({ ...p, notification_scope: opt.id }))}
                      className={`rounded-2xl p-3 text-left border-2 transition-all ${cardForm.notification_scope === opt.id ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="text-lg mb-1">{opt.icon}</div>
                      <p className="text-xs font-semibold text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </button>
                  ))}
                </div>
                {cardForm.notification_scope === 'company_wide' && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <span>⚠️</span> This requires HR approval before company-wide emails are sent
                  </p>
                )}
              </div>

              {/* Gift pot */}
              <div className="flex items-center justify-between py-3 border-t border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-800">Enable gift pot</p>
                  <p className="text-xs text-gray-500">Colleagues can contribute money when they sign</p>
                </div>
                <button type="button" onClick={() => setCardForm(p => ({ ...p, is_gift_enabled: !p.is_gift_enabled }))}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${cardForm.is_gift_enabled ? 'bg-primary-400' : 'bg-gray-200'}`}>
                  <span className={`absolute w-5 h-5 bg-white rounded-full shadow transition-transform ${cardForm.is_gift_enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
                <span>💡</span>
                <span>A signing link will be copied to your clipboard. Share it on WhatsApp with your colleagues — they do <strong>not</strong> need an account to sign!</span>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary flex-1 py-3">
                  {creating
                    ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</span>
                    : '🎉 Create card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MemberLayout>
  );
};

export default MemberOccasionsPage;
