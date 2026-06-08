import { useSEO } from '../../hooks/useSEO';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { memberAPI } from '../../utils/api';
import { useMemberAuth } from '../../context/MemberAuthContext';
import MemberLayout from '../../components/member/MemberLayout';
import toast from 'react-hot-toast';
import { formatNGN } from '../../utils/currency';

const occasionEmoji = { birthday:'🎂',leaving:'👋',promotion:'🌟',anniversary:'💍',graduation:'🎓',other:'🎉' };

const MemberDashboard = () => {
  useSEO({ title: 'Team Dashboard — Thankeeu for Teams', noIndex: true });
  const { member } = useMemberAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    memberAPI.getDashboard()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};
  const upcoming = data?.upcoming_occasions || [];
  const activeCards = data?.recent_cards || [];
  const myCards = data?.my_created_cards || [];
  const isLeader = member?.role === 'team_leader';

  return (
    <MemberLayout title={`Hey ${member?.first_name || 'there'} 👋`} subtitle={`${member?.department || ''} · ${isLeader ? '👑 Team Leader' : '👤 Team Member'}`}>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {loading
          ? [...Array(4)].map((_,i) => <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: '#EDE9FF' }} />)
          : [
              { icon: '👥', label: 'Dept members', value: stats.dept_size || 0 },
              { icon: '🎉', label: 'Upcoming', value: stats.upcoming_occasions || 0, sub: 'next 30 days' },
              { icon: '💌', label: 'Active cards', value: stats.active_cards || 0 },
              { icon: '⏳', label: 'Pending approvals', value: stats.pending_approvals || 0, accent: (stats.pending_approvals||0)>0 },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 border-2"
                style={{ background: s.accent ? 'rgba(124,110,255,0.06)' : '#fff', borderColor: s.accent ? 'rgba(124,110,255,0.22)' : '#EDE9FF' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: '#7A7898' }}>{s.label}</p>
                    <p className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk,sans-serif', color: s.accent ? '#5B4BDF' : '#1A1730' }}>{s.value}</p>
                    {s.sub && <p className="text-xs mt-0.5" style={{ color: '#9490C8' }}>{s.sub}</p>}
                  </div>
                  <span className="text-2xl">{s.icon}</span>
                </div>
              </div>
            ))
        }
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Upcoming occasions in dept */}
        <div className="rounded-2xl border-2 overflow-hidden" style={{ background: '#fff', borderColor: '#EDE9FF' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #EDE9FF' }}>
            <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 600, fontSize: '0.9rem', color: '#1A1730' }}>
              🎉 Department occasions
            </h3>
            <Link to="/member/occasions" className="text-xs font-medium" style={{ color: '#7C6EFF' }}>View all →</Link>
          </div>
          {loading ? (
            <div className="p-4 space-y-2">{[...Array(4)].map((_,i) => <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: '#F5F3FF' }} />)}</div>
          ) : upcoming.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">📅</div>
              <p className="text-sm" style={{ color: '#7A7898' }}>No upcoming occasions this month</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#EDE9FF' }}>
              {upcoming.slice(0,5).map((occ, i) => {
                const days = occ.days_until ?? 0;
                const urgent = days <= 3;
                return (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: urgent ? 'rgba(239,68,68,0.08)' : '#F5F3FF' }}>
                      {occasionEmoji[occ.occasion] || '🎉'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#1A1730' }}>
                        {occ.first_name} {occ.last_name}
                      </p>
                      <p className="text-xs capitalize" style={{ color: '#7A7898' }}>{occ.occasion?.replace('_',' ')}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-bold px-2 py-1 rounded-full"
                        style={{ background: urgent ? 'rgba(239,68,68,0.1)' : 'rgba(124,110,255,0.1)', color: urgent ? '#dc2626' : '#5B4BDF' }}>
                        {days === 0 ? 'Today 🎉' : `${days}d`}
                      </span>
                      <Link to="/member/occasions" className="text-xs font-semibold px-2.5 py-1 rounded-xl"
                        style={{ background: 'linear-gradient(135deg,#7C6EFF,#5B4BDF)', color: '#fff' }}>
                        Create card
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active cards to sign */}
        <div className="rounded-2xl border-2 overflow-hidden" style={{ background: '#fff', borderColor: '#EDE9FF' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #EDE9FF' }}>
            <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 600, fontSize: '0.9rem', color: '#1A1730' }}>
              ✍️ Cards pending your signature
            </h3>
          </div>
          {loading ? (
            <div className="p-4 space-y-2">{[...Array(3)].map((_,i) => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: '#F5F3FF' }} />)}</div>
          ) : activeCards.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">💌</div>
              <p className="text-sm" style={{ color: '#7A7898' }}>No cards waiting for your signature right now</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#EDE9FF' }}>
              {activeCards.map(card => (
                <div key={card.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: '#F5F3FF' }}>
                    {occasionEmoji[card.occasion] || '💌'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: '#1A1730' }}>{card.title || `${card.recipient_name}'s card`}</p>
                    <p className="text-xs" style={{ color: '#7A7898' }}>For {card.recipient_name}</p>
                  </div>
                  <a href={`/sign/${card.slug}`}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#7C6EFF,#5B4BDF)', color: '#fff' }}>
                    Sign ✍️
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cards I created */}
      {myCards.length > 0 && (
        <div className="mt-5 rounded-2xl border-2 overflow-hidden" style={{ background: '#fff', borderColor: '#EDE9FF' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #EDE9FF' }}>
            <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 600, fontSize: '0.9rem', color: '#1A1730' }}>
              🎉 Cards you created
            </h3>
          </div>
          <div className="divide-y" style={{ borderColor: '#EDE9FF' }}>
            {myCards.slice(0, 5).map(card => (
              <div key={card.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: '#F5F3FF' }}>
                  {occasionEmoji[card.occasion] || '🎉'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: '#1A1730' }}>{card.title || `${card.recipient_name}'s card`}</p>
                  <p className="text-xs" style={{ color: '#7A7898' }}>
                    {card.occasion?.replace('_',' ')} · {card.status}
                    {(card.total_collected||0) > 0 && ` · ${formatNGN(card.total_collected)} collected`}
                  </p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: card.status==='active'?'#dcfce7':card.status==='sent'?'#dbeafe':'#f3e8ff', color: card.status==='active'?'#166534':card.status==='sent'?'#1e40af':'#6b21a8' }}>
                  {card.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </MemberLayout>
  );
};

export default MemberDashboard;
