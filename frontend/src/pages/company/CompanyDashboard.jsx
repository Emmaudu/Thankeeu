import { useSEO } from '../../hooks/useSEO';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teamsAPI, subscriptionAPI, hrMembersAPI } from '../../utils/api';
import { useCompanyAuth } from '../../context/CompanyAuthContext';
import CompanyLayout from '../../components/company/CompanyLayout';
import toast from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';

const statCard = (icon, label, value, sub, accent) => (
  <div key={label} className="rounded-2xl p-5 border-2"
    style={{ background: accent ? 'rgba(124,110,255,0.06)' : '#fff', borderColor: accent ? 'rgba(124,110,255,0.22)' : '#EDE9FF' }}>
    <div className="flex items-start justify-between mb-2">
      <div>
        <p className="text-xs font-medium mb-1" style={{ color: '#7A7898' }}>{label}</p>
        <p className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk,sans-serif', color: accent ? '#5B4BDF' : '#1A1730' }}>{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: '#9490C8' }}>{sub}</p>}
      </div>
      <span className="text-2xl">{icon}</span>
    </div>
  </div>
);

const CompanyDashboard = () => {
  useSEO({ title: 'HR Dashboard — Thankeeu for Teams', noIndex: true });
  const { company } = useCompanyAuth();
  const [data, setData] = useState(null);
  const [sub, setSub] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([teamsAPI.getDashboard(), subscriptionAPI.get(), hrMembersAPI.getAll()])
      .then(([d, s, p]) => { setData(d.data); setSub(s.data); setPending((p.data||[]).filter(m=>m.status==='pending')); })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));

    const params = new URLSearchParams(window.location.search);
    if (params.get('sub') === 'success') {
      window.history.replaceState({}, '', '/company/dashboard');
      const ref = params.get('reference');
      if (ref) {
        subscriptionAPI.verify(ref)
          .then(() => { toast.success('🎉 Subscription activated!'); subscriptionAPI.get().then(r => setSub(r.data)).catch(() => {}); })
          .catch(() => { subscriptionAPI.get().then(r => setSub(r.data)).catch(() => {}); toast('Payment received. Activating...', { icon: '⏳' }); });
      }
    }
  }, []);

  const isSubscribed = sub?.status === 'active';
  const daysLeft = sub?.expires_at ? differenceInDays(new Date(sub.expires_at), new Date()) : 0;
  const stats = data || {};
  const upcoming = stats.upcoming_occasions || [];
  const recentCards = stats.recent_cards || [];

  const approveM = async (id) => {
    try {
      await hrMembersAPI.approve(id);
      setPending(p => p.filter(m => m.id !== id));
      toast.success('Member approved ✓');
    } catch { toast.error('Failed to approve'); }
  };

  return (
    <CompanyLayout title={`Welcome, ${company?.contact_person?.split(' ')[0] || 'HR'} 👋`} subtitle="Here's your team overview for today">

      {/* Subscription alert */}
      {!isSubscribed && (
        <div className="mb-5 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#1A1730' }}>No active subscription</p>
              <p className="text-xs mt-0.5" style={{ color: '#7A7898' }}>Subscribe to activate birthday automations, HRIS sync, and team card delivery.</p>
            </div>
          </div>
          <Link to="/company/subscription" className="flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-xl"
            style={{ background: 'linear-gradient(135deg,#7C6EFF,#5B4BDF)', color: '#fff' }}>
            Subscribe now →
          </Link>
        </div>
      )}
      {isSubscribed && daysLeft <= 7 && daysLeft >= 0 && (
        <div className="mb-5 p-4 rounded-2xl flex items-center gap-3"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <span className="text-xl">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: '#1A1730' }}>Subscription expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</p>
            <p className="text-xs" style={{ color: '#7A7898' }}>Renew now to avoid interruption to automations.</p>
          </div>
          <Link to="/company/subscription" className="text-xs font-semibold px-4 py-2 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
            Renew
          </Link>
        </div>
      )}

      {/* Pending members alert */}
      {pending.length > 0 && (
        <div className="mb-5 p-4 rounded-2xl" style={{ background: 'rgba(124,110,255,0.06)', border: '1px solid rgba(124,110,255,0.2)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: '#1A1730' }}>
              🔔 {pending.length} team member{pending.length > 1 ? 's' : ''} waiting approval
            </p>
            <Link to="/company/members" className="text-xs font-medium" style={{ color: '#7C6EFF' }}>View all →</Link>
          </div>
          <div className="space-y-2">
            {pending.slice(0, 3).map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: '#fff', border: '1px solid #EDE9FF' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#7C6EFF,#EC4899)', color: '#fff' }}>
                  {m.first_name?.[0]}{m.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: '#1A1730' }}>{m.first_name} {m.last_name}</p>
                  <p className="text-xs" style={{ color: '#7A7898' }}>{m.department} · {m.email}</p>
                </div>
                <button onClick={() => approveM(m.id)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0"
                  style={{ background: 'rgba(16,185,129,0.12)', color: '#059669', border: '1px solid rgba(16,185,129,0.25)' }}>
                  ✓ Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {loading
          ? [...Array(4)].map((_,i) => <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: '#EDE9FF' }} />)
          : [
              statCard('👥', 'Total employees', stats.total_members || 0, 'all departments'),
              statCard('🎉', 'Upcoming occasions', upcoming.length, 'next 30 days'),
              statCard('💌', 'Active cards', stats.active_cards || 0, 'collecting now'),
              statCard('🎁', 'Gifts collected', `₦${((stats.total_collected||0)/100).toLocaleString()}`, 'all time', true),
            ]
        }
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Upcoming occasions */}
        <div className="rounded-2xl border-2 overflow-hidden" style={{ background: '#fff', borderColor: '#EDE9FF' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #EDE9FF' }}>
            <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#1A1730' }}>
              🎉 Upcoming occasions
            </h3>
            <Link to="/company/teams" className="text-xs font-medium" style={{ color: '#7C6EFF' }}>View all →</Link>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(4)].map((_,i) => <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: '#F5F3FF' }} />)}</div>
          ) : upcoming.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">📅</div>
              <p className="text-sm" style={{ color: '#7A7898' }}>No upcoming occasions in the next 30 days</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#EDE9FF' }}>
              {upcoming.slice(0, 6).map((occ, i) => {
                const days = occ.days_until ?? occ.daysUntil ?? 0;
                const urgent = days <= 3;
                return (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: urgent ? 'rgba(239,68,68,0.08)' : '#F5F3FF' }}>
                      {occ.occasion === 'birthday' ? '🎂' : occ.occasion === 'leaving' ? '👋' : occ.occasion === 'promotion' ? '🌟' : '🎉'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#1A1730' }}>{occ.full_name || `${occ.first_name} ${occ.last_name}`}</p>
                      <p className="text-xs capitalize" style={{ color: '#7A7898' }}>{occ.occasion?.replace('_',' ')} · {occ.department}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ background: urgent ? 'rgba(239,68,68,0.1)' : 'rgba(124,110,255,0.1)', color: urgent ? '#dc2626' : '#5B4BDF' }}>
                      {days === 0 ? 'Today! 🎉' : `${days}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          {/* Company code card */}
          <div className="rounded-2xl p-5 border-2" style={{ background: '#fff', borderColor: '#EDE9FF' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#7A7898' }}>🔑 Your company invite code</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono px-3 py-2 rounded-xl truncate"
                style={{ background: '#F5F3FF', color: '#5B4BDF', border: '1px solid #DDD8FF' }}>
                {company?.id || 'Loading...'}
              </code>
              <button
                onClick={() => { navigator.clipboard.writeText(company?.id||''); toast.success('Copied!'); }}
                className="text-xs font-bold px-3 py-2 rounded-xl flex-shrink-0"
                style={{ background: 'rgba(124,110,255,0.12)', color: '#5B4BDF', border: '1px solid rgba(124,110,255,0.2)' }}>
                Copy
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: '#9490C8' }}>Share this code with employees so they can join at <strong>thankeeu.com/member/signup</strong></p>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/company/teams', icon: '🎉', label: 'Manage occasions', sub: 'Add birthday dates' },
              { to: '/company/members', icon: '👥', label: 'Team members', sub: 'Import & approve' },
              { to: '/company/hris', icon: '🔗', label: 'HRIS sync', sub: 'Connect SeamlessHR' },
              { to: '/company/subscription', icon: '💳', label: 'Subscription', sub: isSubscribed ? `${daysLeft}d remaining` : 'Not active' },
            ].map(({ to, icon, label, sub }) => (
              <Link key={to} to={to} className="rounded-2xl p-4 border-2 hover:shadow-sm transition-all block"
                style={{ background: '#fff', borderColor: '#EDE9FF' }}>
                <span className="text-2xl block mb-2">{icon}</span>
                <p className="text-xs font-semibold" style={{ color: '#1A1730' }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9490C8' }}>{sub}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </CompanyLayout>
  );
};

export default CompanyDashboard;
