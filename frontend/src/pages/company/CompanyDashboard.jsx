import { useSEO } from '../../hooks/useSEO';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teamsAPI, subscriptionAPI, hrMembersAPI, cardsAPI } from '../../utils/api';
import { useCompanyAuth } from '../../context/CompanyAuthContext';
import CompanyLayout from '../../components/company/CompanyLayout';
import NotificationBell from '../../components/NotificationBell';
import toast from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';
import { companyPath, getWorkspaceUrl } from '../../utils/workspace';

const statCard = (icon, label, value, sub, accent) => (
  <div key={label} className="rounded-2xl p-4 border-2 min-w-0"
    style={{ background: accent ? 'rgba(124,110,255,0.06)' : '#fff', borderColor: accent ? 'rgba(124,110,255,0.22)' : '#EDE9FF' }}>
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[11px] font-medium mb-1 leading-tight break-words" style={{ color: '#7A7898' }}>{label}</p>
        <p className="text-lg sm:text-xl font-bold leading-tight break-words" style={{ fontFamily: 'Space Grotesk,sans-serif', color: accent ? '#5B4BDF' : '#1A1730' }}>{value}</p>
        {sub && <p className="text-[11px] mt-1 leading-tight break-words" style={{ color: '#9490C8' }}>{sub}</p>}
      </div>
      <span className="text-xs font-bold rounded-lg px-2 py-1 flex-shrink-0" style={{ background: '#F5F3FF', color: '#5B4BDF' }}>{icon}</span>
    </div>
  </div>
);

const CompanyDashboard = () => {
  useSEO({ title: 'HR Dashboard - Thankeeu for Teams', noIndex: true });
  const { company } = useCompanyAuth();
  const [data, setData] = useState(null);
  const [sub, setSub] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scopeApprovals, setScopeApprovals] = useState([]);
  const [approvingScope, setApprovingScope] = useState(null);


  // Note: card fee payments now go through /create-card/verify (CardFeeVerify page)
  // No payment params need to be handled on this dashboard

  useEffect(() => {
    Promise.all([
      teamsAPI.getDashboard(),
      subscriptionAPI.get(),
      hrMembersAPI.getAll(),
      // Fetch cards pending company-wide scope approval
      cardsAPI.getCompanyMine().catch(() => ({ data: [] })),
    ])
      .then(([d, s, p, cards]) => {
        // Backend returns flat: { total_members, teams, upcoming_occasions, active_cards, ... }
        setData(d.data);
        setSub(s.data);
        setPending((p.data||[]).filter(m => m.status === 'pending'));
        const pending_scope = (cards.data || []).filter(c =>
          c.notification_scope === 'company_wide' && !c.scope_approved_at
        );
        setScopeApprovals(pending_scope);
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));

    const params = new URLSearchParams(window.location.search);
    if (params.get('sub') === 'success') {
      window.history.replaceState({}, '', companyPath('/dashboard'));
      const ref = params.get('reference');
      if (ref) {
        subscriptionAPI.verify(ref)
          .then(() => { toast.success('Subscription activated!'); subscriptionAPI.get().then(r => setSub(r.data)).catch(() => {}); })
          .catch(() => { subscriptionAPI.get().then(r => setSub(r.data)).catch(() => {}); toast('Payment received. Activating...', { icon: '...' }); });
      }
    }
  }, []);

  const isSubscribed = sub?.status === 'active';
  // expires_at is null for admin-set (free/multiplier) and pilot plans - they never expire.
  // Use Infinity so daysLeft-based warnings never fire for these plans.
  const daysLeft = sub?.expires_at ? differenceInDays(new Date(sub.expires_at), new Date()) : Infinity;
  const neverExpires = !sub?.expires_at; // free/admin plan - no expiry date
  // data is the flat response: { total_members, teams, upcoming_occasions, active_cards, total_collected }
  const stats   = data || {};
  const upcoming = stats.upcoming_occasions || [];
  const recentCards = stats.recent_cards || [];
  const workspaceUrl = company?.workspace_url || (company?.slug ? getWorkspaceUrl(company.slug) : '');
  const memberSignupUrl = workspaceUrl && company?.id
    ? `${workspaceUrl}/signup?code=${encodeURIComponent(company.id)}`
    : '';

  const approveM = async (id) => {
    try {
      await hrMembersAPI.approve(id);
      setPending(p => p.filter(m => m.id !== id));
      toast.success('Member approved');
    } catch { toast.error('Failed to approve'); }
  };

  const handleApproveScope = async (slug) => {
    setApprovingScope(slug);
    try {
      await cardsAPI.approveScope(slug);
      setScopeApprovals(prev => prev.filter(c => c.slug !== slug));
      toast.success('Company-wide notifications sent to all departments!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve');
    } finally { setApprovingScope(null); }
  };

  return (
    <CompanyLayout title={`Welcome, ${company?.contact_person?.split(' ')[0] || 'HR'}`} subtitle="Here's your team overview for today">

      {/* Company-wide card approvals */}
      {scopeApprovals.length > 0 && (
        <div className="mb-5 space-y-2">
          {scopeApprovals.map(card => (
            <div key={card.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-xs font-bold rounded-lg px-2 py-1 flex-shrink-0" style={{ background: '#FEF3C7', color: '#92400E' }}>Company</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-amber-800 text-sm">Approval needed: Company-wide notification</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  A team member wants to notify the entire company about <strong>{card.recipient_name}</strong>'s card. Approve to send emails + dashboard notifications to all departments.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap flex-shrink-0">
                <button
                  onClick={() => handleApproveScope(card.slug)}
                  disabled={approvingScope === card.slug}
                  className="text-xs font-bold px-3 py-2 rounded-xl text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors">
                  {approvingScope === card.slug ? '...' : 'Approve & Notify all'}
                </button>
                <Link to={`/card/${card.slug}`} className="text-xs font-semibold px-3 py-2 rounded-xl border border-amber-300 text-amber-700 hover:bg-amber-100 transition-colors">
                  View card
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* HR quick actions bar */}
      <div className="flex flex-wrap gap-2 mb-5">
        <Link to="/create-card" className="btn-primary text-xs py-2.5 px-4">Create Card</Link>
        <Link to={companyPath('/occasions')} className="btn-primary text-xs py-2.5 px-4">Occasions</Link>
        <Link to={companyPath('/hris')} className="btn-secondary text-xs py-2.5 px-4">HRIS &amp; Import</Link>
        <Link to={companyPath('/members')} className="btn-secondary text-xs py-2.5 px-4">Team members{pending.length > 0 && ` (${pending.length} pending)`}</Link>
      </div>

      {/* Subscription alert */}
      {!isSubscribed && (
        <div className="mb-5 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="text-xl">Tip</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#1A1730' }}>No active subscription</p>
              <p className="text-xs mt-0.5" style={{ color: '#7A7898' }}>Subscribe to activate birthday automations, HRIS sync, and team card delivery.</p>
            </div>
          </div>
          <Link to={companyPath('/subscription')} className="flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-xl"
            style={{ background: 'linear-gradient(135deg,#7C6EFF,#5B4BDF)', color: '#fff' }}>
            Subscribe now
          </Link>
        </div>
      )}
      {isSubscribed && !neverExpires && daysLeft <= 7 && daysLeft >= 0 && (
        <div className="mb-5 p-4 rounded-2xl flex items-center gap-3"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <span className="text-xl">Warning</span>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: '#1A1730' }}>Subscription expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</p>
            <p className="text-xs" style={{ color: '#7A7898' }}>Renew now to avoid interruption to automations.</p>
          </div>
          <Link to={companyPath('/subscription')} className="text-xs font-semibold px-4 py-2 rounded-xl"
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
              {pending.length} team member{pending.length > 1 ? 's' : ''} waiting approval
            </p>
            <Link to={companyPath('/members')} className="text-xs font-medium" style={{ color: '#7C6EFF' }}>View all</Link>
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
                  <p className="text-xs" style={{ color: '#7A7898' }}>{m.department} - {m.email}</p>
                </div>
                <button onClick={() => approveM(m.id)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0"
                  style={{ background: 'rgba(16,185,129,0.12)', color: '#059669', border: '1px solid rgba(16,185,129,0.25)' }}>
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
        {loading
          ? [...Array(4)].map((_,i) => <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: '#EDE9FF' }} />)
          : [
              statCard('Team', 'Total employees', stats.total_members || 0, 'all departments'),
              statCard('Dept', 'Teams / Depts', stats.teams || (stats.departments || []).length || 0, 'active departments'),
              statCard('Event', 'Upcoming occasions', upcoming.length, 'next 30 days'),
              statCard('Card', 'Active cards', stats.active_cards || 0, 'collecting now'),
              statCard('Gift', 'Gifts collected', `NGN ${((stats.total_collected||0)).toLocaleString('en-NG')}`, 'all time', true),
            ]
        }
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Upcoming occasions */}
        <div className="rounded-2xl border-2 overflow-hidden" style={{ background: '#fff', borderColor: '#EDE9FF' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #EDE9FF' }}>
            <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#1A1730' }}>
              Upcoming occasions
            </h3>
            <Link to={companyPath('/teams')} className="text-xs font-medium" style={{ color: '#7C6EFF' }}>View all</Link>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(4)].map((_,i) => <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: '#F5F3FF' }} />)}</div>
          ) : upcoming.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-base font-bold mb-2" style={{ color: '#7A7898' }}>Calendar</div>
              <p className="text-sm" style={{ color: '#7A7898' }}>No upcoming occasions in the next 30 days</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#EDE9FF' }}>
              {upcoming.slice(0, 6).map((occ, i) => {
                // occ: { name, department, occasion_type, label, occasion_date, days_until }
                const days = occ.days_until ?? occ.daysUntil ?? 0;
                const urgent = days <= 3;
                return (
                  <div key={i} className="flex items-center gap-3 px-4 sm:px-5 py-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold leading-tight text-center px-1 flex-shrink-0"
                      style={{ background: urgent ? 'rgba(239,68,68,0.08)' : '#F5F3FF' }}>
                      {occ.occasion_type === 'birthday' ? 'Birthday' : occ.occasion_type === 'leaving' ? 'Farewell' : occ.occasion_type === 'promotion' ? 'Promotion' : occ.occasion_type === 'fathers_day' ? 'Fathers Day' : occ.occasion_type === 'womens_day' ? 'Womens Day' : 'Occasion'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#1A1730' }}>{occ.name || `${occ.first_name||''} ${occ.last_name||''}`.trim()}</p>
                      <p className="text-xs truncate" style={{ color: '#7A7898' }}>{occ.label || occ.occasion_type?.replace(/_/g,' ')} - {occ.department}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ background: urgent ? 'rgba(239,68,68,0.1)' : 'rgba(124,110,255,0.1)', color: urgent ? '#dc2626' : '#5B4BDF' }}>
                      {days === 0 ? 'Today!' : `${days}d`}
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
            <p className="text-xs font-semibold mb-2" style={{ color: '#7A7898' }}>Your company invite code</p>
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
            <div className="mt-2 space-y-2"><p className="text-xs" style={{ color: '#9490C8' }}>Share this signup link with employees:</p><code className="block text-xs font-mono px-3 py-2 rounded-xl break-all" style={{ background: '#F5F3FF', color: '#5B4BDF', border: '1px solid #DDD8FF' }}>{memberSignupUrl || 'Workspace signup link loading...'}</code>{memberSignupUrl && <button onClick={() => { navigator.clipboard.writeText(memberSignupUrl); toast.success('Signup link copied!'); }} className="text-xs font-bold px-3 py-2 rounded-xl" style={{ background: 'rgba(124,110,255,0.12)', color: '#5B4BDF', border: '1px solid rgba(124,110,255,0.2)' }}>Copy signup link</button>}</div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { to: companyPath('/teams'), icon: 'Event', label: 'Manage occasions', sub: 'Add birthday dates' },
              { to: companyPath('/members'), icon: 'Team', label: 'Team members', sub: 'Import & approve' },
              { to: companyPath('/hris'), icon: 'Sync', label: 'HRIS sync', sub: 'Connect SeamlessHR' },
              { to: companyPath('/subscription'), icon: 'Billing', label: 'Subscription', sub: isSubscribed ? (neverExpires ? 'Active - No expiry' : `${daysLeft}d remaining`) : 'Not active' },
            ].map(({ to, icon, label, sub }) => (
              <Link key={to} to={to} className="rounded-2xl p-4 border-2 hover:shadow-sm transition-all block min-w-0"
                style={{ background: '#fff', borderColor: '#EDE9FF' }}>
                <span className="inline-flex max-w-full rounded-lg px-2 py-1 text-[11px] font-bold leading-tight" style={{ background: '#F5F3FF', color: '#5B4BDF' }}>{icon}</span>
                <p className="text-xs font-semibold mt-2 leading-tight break-words" style={{ color: '#1A1730' }}>{label}</p>
                <p className="text-[11px] mt-1 leading-tight break-words" style={{ color: '#9490C8' }}>{sub}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </CompanyLayout>
  );
};

export default CompanyDashboard;


