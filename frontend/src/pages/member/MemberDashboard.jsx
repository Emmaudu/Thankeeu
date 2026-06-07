import { formatNGN } from '../../utils/currency';
import { useSEO } from '../../hooks/useSEO';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { memberAPI, cardsAPI } from '../../utils/api';
import { useMemberAuth } from '../../context/MemberAuthContext';
import MemberLayout from '../../components/member/MemberLayout';
import toast from 'react-hot-toast';

const StatCard = ({ icon, label, value, color = 'bg-white' }) => (
  <div className={`${color} rounded-3xl p-5 border border-purple-100`}>
    <div className="text-2xl mb-2">{icon}</div>
    <p className="text-2xl font-display font-semibold text-warm-900">{value}</p>
    <p className="text-sm text-warm-500 mt-0.5">{label}</p>
  </div>
);

const MemberDashboard = () => {
  useSEO({ title: 'My Occasions — Thankeeu for Teams', noIndex: true });

  const { member } = useMemberAuth();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const isLeader = member?.role === 'team_leader';

  useEffect(() => {
    memberAPI.getDashboard()
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const occasionIcon = (name) => ({
    birthday: '🎂', leaving: '👋', work_anniversary: '🏆', promotion: '🌟',
    wedding: '💍', valentines_day: '💝', womens_day: '👩', mens_day: '👨',
    workers_day: '✊', graduation: '🎓', new_baby: '👶', retirement: '🏖️',
  }[name] || '🎉');

  return (
    <MemberLayout
      title={`Hello, ${member?.first_name}! 👋`}
      subtitle={`${member?.department} · ${isLeader ? 'Team Leader' : 'Team Member'} · ${member?.company?.name}`}>

      {/* Leader pending approvals banner */}
      {isLeader && data?.stats?.pending_approvals > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-semibold text-amber-800 text-sm">{data.stats.pending_approvals} member{data.stats.pending_approvals > 1 ? 's' : ''} awaiting your approval</p>
              <p className="text-xs text-amber-600 mt-0.5">Review and approve team member requests for your department</p>
            </div>
          </div>
          <Link to="/member/approvals" className="bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-amber-600 transition-colors whitespace-nowrap">
            Review now →
          </Link>
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white rounded-3xl animate-pulse border border-purple-100" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard icon="👥" label="Dept members"     value={data?.stats?.dept_size || 0} />
          <StatCard icon="🎉" label="Upcoming occasions" value={data?.stats?.upcoming_occasions || 0} color="bg-primary-50" />
          <StatCard icon="💌" label="Active cards"      value={data?.stats?.active_cards || 0} />
          {isLeader && <StatCard icon="⏳" label="Pending approvals" value={data?.stats?.pending_approvals || 0} color="bg-amber-50" />}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">

        {/* Upcoming occasions */}
        <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-warm-900">Upcoming occasions</h3>
            <Link to="/member/occasions" className="text-xs text-primary-400 hover:text-primary-600">All →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              [...Array(4)].map((_, i) => <div key={i} className="h-14 animate-pulse bg-warm-100 m-3 rounded-xl" />)
            ) : (data?.upcoming_occasions || []).length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-warm-400">No upcoming occasions in 30 days</div>
            ) : (
              (data?.upcoming_occasions || []).slice(0, 6).map(m => (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                    {occasionIcon(m.occasion_types?.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-warm-900 truncate">{m.first_name} {m.last_name}</p>
                    <p className="text-xs text-warm-400">{m.occasion_types?.label} · {m.department}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                    m.days_until <= 2 ? 'bg-red-100 text-red-600' :
                    m.days_until <= 7 ? 'bg-amber-100 text-amber-600' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {m.days_until === 1 ? 'Tomorrow' : m.days_until === 0 ? 'Today! 🎉' : `${m.days_until}d`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent cards */}
        <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-warm-900">Active cards to sign</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              [...Array(4)].map((_, i) => <div key={i} className="h-14 animate-pulse bg-warm-100 m-3 rounded-xl" />)
            ) : (data?.recent_cards || []).length === 0 ? (
              <div className="px-5 py-8 text-center">
                <div className="text-4xl mb-2">💌</div>
                <p className="text-sm text-warm-400">No active cards right now</p>
                {isLeader && (
                  <Link to="/member/occasions" className="text-xs text-primary-400 mt-2 inline-block">Create a card for a colleague →</Link>
                )}
              </div>
            ) : (
              (data?.recent_cards || []).map(card => (
                <div key={card.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-9 h-9 bg-pink-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">💌</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-warm-900 truncate">{card.title || `${card.recipient_name}'s card`}</p>
                    <p className="text-xs text-warm-400">
                      {(card.total_collected || 0) > 0 ? `${formatNGN(card.total_collected)} collected · ` : ''}
                      {card.status}
                    </p>
                  </div>
                  <a href={`/sign/${card.slug}`} target="_blank" rel="noreferrer"
                    className="text-xs bg-pink-50 text-pink-600 px-3 py-1.5 rounded-lg hover:bg-pink-100 transition-colors whitespace-nowrap">
                    Sign card →
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Cards I created — history */}
      {(data?.my_created_cards || []).length > 0 && (
        <div className="mt-6 bg-white rounded-3xl border border-purple-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-warm-900">Cards you created</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {(data.my_created_cards).map(card => (
              <div key={card.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">🎉</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-warm-900 truncate">{card.title || `${card.recipient_name}'s card`}</p>
                  <p className="text-xs text-primary-500 mt-0.5">{card.signed_count || 0} signed</p>
                  <p className="text-xs text-warm-400">
                    For {card.recipient_name} · {card.occasion?.replace('_', ' ')}
                    {(card.total_collected || 0) > 0 ? ` · ${formatNGN(card.total_collected)} collected` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    card.status === 'active' ? 'bg-green-100 text-green-700' :
                    card.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-50 text-warm-500'
                  }`}>{card.status}</span>
                  <a href={`/card/${card.slug}`} target="_blank" rel="noreferrer"
                    className="text-xs text-primary-400 hover:text-primary-600 px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors">
                    View →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dept members (leader only) */}
      {isLeader && (
        <div className="mt-6 bg-white rounded-3xl border border-purple-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-warm-900">Your department — {member?.department}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-100 bg-warm-100">
                  {['Member','Role','Email','Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={4} className="p-4"><div className="h-8 bg-purple-50 rounded animate-pulse" /></td></tr>
                ) : (data?.dept_members || []).length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-warm-400">No approved members in your department yet</td></tr>
                ) : (
                  (data?.dept_members || []).map(m => (
                    <tr key={m.id} className="hover:bg-warm-100 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {m.profile_picture_url
                            ? <img src={m.profile_picture_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                            : <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-xs font-bold">{m.first_name?.[0]}{m.last_name?.[0]}</div>
                          }
                          <span className="text-sm font-medium text-warm-800">{m.first_name} {m.last_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${m.role === 'team_leader' ? 'bg-amber-100 text-amber-700' : 'bg-primary-100 text-primary-600'}`}>
                          {m.role === 'team_leader' ? '👑 Leader' : '👤 Member'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-warm-500">{m.email}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Approved</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </MemberLayout>
  );
};

export default MemberDashboard;
