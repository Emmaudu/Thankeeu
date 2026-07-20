import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PalLayout from './PalLayout';
import Icon from '../../components/ui/Icon';
import { palAPI } from '../../utils/api';
import { formatNGN } from '../../utils/currency';
import toast from 'react-hot-toast';

const StatCard = ({ icon, label, value, sub, color = '#7C3AED' }) => (
  <div className="min-w-0 bg-white rounded-2xl border border-purple-100 p-5 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-5"
      style={{ background: color, transform: 'translate(25%,-25%)' }} />
    <div className="flex items-start justify-between relative">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-warm-400 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-bold text-warm-900" style={{overflowWrap:'break-word'}}>{value}</p>
        {sub && <p className="text-xs text-warm-400 mt-1">{sub}</p>}
      </div>
      <div className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon name={icon} size={20} style={{ color }} />
      </div>
    </div>
  </div>
);

const OCCASION_LABEL = {
  birthday: '🎂 Birthdays', farewell: '👋 Farewells', graduation: '🎓 Graduations',
  milestone: '🎉 Milestones', promotion: '🎊 Promotions',
};

export default function PalDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    palAPI.getAnalytics()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PalLayout title="Overview"><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"/></div></PalLayout>;

  return (
    <PalLayout title="Overview" subtitle="Your group at a glance">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="Users" label="Members" value={`${data.joined_members}/${data.total_members}`}
          sub={data.pending_members ? `${data.pending_members} pending join` : 'everyone joined'} color="#7C3AED" />
        <StatCard icon="Cake" label="Cards created" value={data.total_cards} sub="for celebrations" color="#EC4899" />
        <StatCard icon="Gift" label="Total gift raised" value={formatNGN(data.total_gift_raised)} color="#10B981" />
        <StatCard icon="Percent" label="Thankeeu commission" value={formatNGN(data.thankeeu_commission)} sub={`${data.commission_pct}% of gift pot`} color="#3B82F6" />
      </div>

      {Object.keys(data.cards_by_occasion || {}).length > 0 && (
        <div className="bg-white rounded-2xl border border-purple-100 p-5 mb-6">
          <h3 className="font-semibold text-warm-900 mb-4">Cards by occasion</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(data.cards_by_occasion).map(([occ, count]) => (
              <div key={occ} className="px-4 py-2 rounded-xl bg-purple-50 text-sm font-semibold text-warm-700">
                {OCCASION_LABEL[occ] || occ}: {count}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.pending_members > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Icon name="UserPlus" size={20} className="text-amber-500" />
            <p className="text-sm text-amber-700">{data.pending_members} invited member{data.pending_members!==1 && 's'} haven't joined yet</p>
          </div>
          <Link to="/pals/dashboard/members" className="text-sm font-semibold text-amber-700 underline">View members</Link>
        </div>
      )}

      <div className="bg-gradient-to-br from-primary-50 to-pink-50 rounded-2xl border border-primary-100 p-6 mt-6">
        <h3 className="font-semibold text-warm-900 mb-3 flex items-center gap-2">
          <Icon name="Zap" size={18} className="text-primary-500" /> How Thankeeu Pals works
        </h3>
        <div className="space-y-2 text-sm text-warm-600">
          <p>• When you set a member's birthday, resignation, graduation, milestone, or promotion date, Thankeeu automatically creates a group card for that event.</p>
          <p>• Everyone in the group gets emailed the sign-card link 14, 7, 4, and 1 day(s) before — and on the day itself.</p>
          <p>• Contribution amounts are private — only the celebrant can see how much was raised, to avoid jealousy.</p>
          <p>• By 6pm on the celebration day, the gift pot (minus Thankeeu's {data.commission_pct}% fee) is sent to the celebrant's bank account.</p>
        </div>
      </div>
    </PalLayout>
  );
}
