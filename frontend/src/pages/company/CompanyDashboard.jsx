import { useSEO } from '../../hooks/useSEO';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teamsAPI, subscriptionAPI } from '../../utils/api';
import { useCompanyAuth } from '../../context/CompanyAuthContext';
import CompanyLayout from '../../components/company/CompanyLayout';
import toast from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';

const StatCard = ({ icon, label, value, sub, color = 'bg-white' }) => (
  <div className={`${color} rounded-2xl p-5 border border-gray-100`}>
    <div className="flex items-center justify-between mb-3">
      <span className="text-2xl">{icon}</span>
    </div>
    <p className="text-2xl font-display font-semibold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const CompanyDashboard = () => {
  useSEO({ title: 'HR Dashboard — Thankeeu for Teams', description: 'Manage your team occasions.', noIndex: true });

  const { company } = useCompanyAuth();
  const [data, setData] = useState(null);
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([teamsAPI.getDashboard(), subscriptionAPI.get()])
      .then(([dashRes, subRes]) => {
        setData(dashRes.data);
        setSub(subRes.data);
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));

    // Handle subscription return from Paystack
    const params = new URLSearchParams(window.location.search);
    if (params.get('sub') === 'success') {
      const ref = params.get('reference');
      if (ref) subscriptionAPI.verify(ref).then(() => toast.success('Subscription activated!')).catch(() => {});
      else toast.success('Subscription successful!');
    }
  }, []);

  const isSubscribed = sub?.status === 'active';
  const stats = data?.stats || {};

  return (
    <CompanyLayout title={`Welcome back, ${company?.contact_person?.split(' ')[0]}! 👋`} subtitle="Here's your team celebration overview">

      {/* Subscription banner if not subscribed */}
      {!loading && !isSubscribed && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800 text-sm">No active subscription</p>
              <p className="text-xs text-amber-600 mt-0.5">Import your team for free, then subscribe to activate birthday email automations.</p>
            </div>
          </div>
          <Link to="/company/subscription" className="btn-primary text-sm py-2 px-5 whitespace-nowrap">Subscribe now →</Link>
        </div>
      )}

      {/* Today's celebrants */}
      {data?.today_celebrants?.length > 0 && (
        <div className="bg-gradient-to-r from-pink-50 to-primary-50 border border-pink-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🎂</span>
            <div>
              <p className="font-semibold text-gray-900">Birthday today!</p>
              <p className="text-sm text-gray-500">Birthday cards have been sent automatically</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {data.today_celebrants.map(m => (
              <div key={m.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm border border-pink-100">
                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-xs">
                  {m.first_name[0]}{m.last_name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.first_name} {m.last_name}</p>
                  <p className="text-xs text-gray-400">{m.department}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon="👥" label="Total employees" value={stats.total_members || 0} sub="in your team" />
          <StatCard icon="🏢" label="Departments" value={stats.departments || 0} sub="across company" />
          <StatCard icon="🎂" label="Upcoming birthdays" value={stats.upcoming_birthdays || 0} sub="next 30 days" color="bg-primary-50" />
          <StatCard icon="💌" label="Cards sent this year" value={stats.cards_sent_this_year || 0} sub="automated" color="bg-green-50" />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">

        {/* Upcoming celebrants */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900">Upcoming birthdays</h3>
            <Link to="/company/teams" className="text-xs text-primary-400 hover:text-primary-600">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              [...Array(5)].map((_, i) => <div key={i} className="h-14 animate-pulse bg-gray-50 m-3 rounded-xl" />)
            ) : data?.upcoming_celebrants?.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">No upcoming birthdays in the next 30 days</div>
            ) : (
              (data?.upcoming_celebrants || []).slice(0, 8).map(m => (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-xs flex-shrink-0">
                    {m.first_name[0]}{m.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{m.first_name} {m.last_name}</p>
                    <p className="text-xs text-gray-400">{m.department}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      m.days_until_birthday <= 2 ? 'bg-red-100 text-red-600' :
                      m.days_until_birthday <= 7 ? 'bg-amber-100 text-amber-600' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {m.days_until_birthday === 1 ? 'Tomorrow' : m.days_until_birthday <= 2 ? `${m.days_until_birthday}d` : `${m.days_until_birthday} days`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent automations */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900">Recent card automations</h3>
            <span className="text-xs text-gray-400">{new Date().getFullYear()}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              [...Array(5)].map((_, i) => <div key={i} className="h-14 animate-pulse bg-gray-50 m-3 rounded-xl" />)
            ) : data?.recent_automations?.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <div className="text-4xl mb-2">💌</div>
                <p className="text-sm text-gray-400">No automations yet</p>
                <p className="text-xs text-gray-400 mt-1">Cards will appear here once birthdays are processed</p>
              </div>
            ) : (
              (data?.recent_automations || []).map(a => (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${a.celebrant_notified_at ? 'bg-green-100' : 'bg-amber-100'}`}>
                    {a.celebrant_notified_at ? '✅' : '⏳'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {a.team_members?.first_name} {a.team_members?.last_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {a.celebrant_notified_at ? `Card delivered · ${a.total_signed} signed` : `Dept notified · collecting signatures`}
                      {a.total_gift_collected > 0 ? ` · ₦${a.total_gift_collected.toLocaleString()} gift` : ''}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 flex-shrink-0">
                    {a.department_notified_at ? format(new Date(a.department_notified_at), 'MMM d') : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: '📥', label: 'Import team data', to: '/company/teams', color: 'bg-primary-50 hover:bg-primary-100 text-primary-700' },
          { icon: '💳', label: 'Manage subscription', to: '/company/subscription', color: 'bg-amber-50 hover:bg-amber-100 text-amber-700' },
          { icon: '⚙️', label: 'Account settings', to: '/company/settings', color: 'bg-gray-50 hover:bg-gray-100 text-gray-700' },
          { icon: '💬', label: 'Contact support', to: '/company/support', color: 'bg-green-50 hover:bg-green-100 text-green-700' },
        ].map(q => (
          <Link key={q.label} to={q.to} className={`${q.color} rounded-2xl p-4 text-center transition-all`}>
            <div className="text-2xl mb-2">{q.icon}</div>
            <p className="text-xs font-medium">{q.label}</p>
          </Link>
        ))}
      </div>
    </CompanyLayout>
  );
};

export default CompanyDashboard;
