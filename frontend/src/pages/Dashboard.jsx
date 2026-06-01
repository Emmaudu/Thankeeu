import { useSEO } from '../hooks/useSEO';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, cardsAPI, paymentsAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const statusColors = {

  draft: 'badge-draft',
  active: 'badge-active',
  sent: 'badge-sent',
  expired: 'bg-red-100 text-red-600 badge'
};

const occasionIcons = {
  birthday: '🎂', valentine: '💝', leaving: '💼', anniversary: '💍',
  wedding: '💒', baby_shower: '👶', retirement: '🏖️', congratulations: '🎉',
  christmas: '🎄', new_year: '✨', promotion: '🌟', graduation: '🎓',
  get_well: '🌷', other: '💌'
};

const StatCard = ({ label, value, sub, color = 'bg-white' }) => (
  <div className={`${color} rounded-2xl p-5 border border-gray-100`}>
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className="text-2xl font-display font-semibold text-gray-900">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const Dashboard = () => {
  useSEO({ title: 'My Dashboard', description: 'Manage your group cards and gift collections.', noIndex: true });

  const { user } = useAuth();
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchDashboard();
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      const ref = params.get('reference');
      if (ref) {
        paymentsAPI.verify(ref).then(() => toast.success('Payment confirmed! Card credits added.')).catch(() => {});
      } else {
        toast.success('Payment successful!');
      }
    }
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await dashboardAPI.get();
      setCards(res.data.all_cards || []);
      setDashData(res.data);
    } catch { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (slug) => {
    if (!confirm('Delete this card? This cannot be undone.')) return;
    try {
      await cardsAPI.delete(slug);
      setCards(prev => prev.filter(c => c.slug !== slug));
      toast.success('Card deleted');
    } catch { toast.error('Failed to delete card'); }
  };

  const handleSend = async (slug) => {
    try {
      await cardsAPI.send(slug);
      toast.success('Card sent to recipient!');
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send card');
    }
  };

  const filtered = filter === 'all' ? cards : cards.filter(c => c.status === filter);

  // Use server-computed stats from dashboardAPI
  const stats = dashData?.stats || {
    active_cards: 0, total_cards: 0, sent_cards: 0,
    total_collected: 0, credits_remaining: 0, unread_notifications: 0
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-gray-900">
              Hey, {user?.full_name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">Here's what's happening with your cards</p>
          </div>
          <Link to="/create" className="btn-primary flex items-center gap-2">
            <span>+</span> Create card
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Active cards" value={stats.active_cards} sub="currently collecting" />
          <StatCard label="Total cards" value={stats.total_cards} sub="all time" />
          <StatCard label="Cards sent" value={stats.sent_cards} sub="delivered" />
          <StatCard label="Gifts collected" value={`₦${(stats.total_collected || 0).toLocaleString()}`} sub="total volume" color="bg-primary-50" />
        </div>

        {/* Closing soon alert */}
        {dashData?.closing_soon?.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">⏰</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Cards closing soon!</p>
              <p className="text-xs text-amber-600 mt-0.5">
                {dashData.closing_soon.map(c => c.title || c.recipient_name).join(', ')} — deadline within 48 hours
              </p>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {['all', 'draft', 'active', 'sent'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f ? 'bg-primary-400 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${filter === f ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {f === 'all' ? cards.length : cards.filter(c => c.status === f).length}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-48 animate-pulse border border-gray-100" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">💌</div>
            <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">No cards yet</h3>
            <p className="text-gray-500 mb-6 text-sm">Create your first group card to get started</p>
            <Link to="/create" className="btn-primary">Create your first card</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(card => (
              <div key={card.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-xl">
                      {occasionIcons[card.occasion] || '💌'}
                    </div>
                    <div>
                      <span className={statusColors[card.status] || 'badge-draft'}>{card.status}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => navigate(`/create?edit=${card.slug}`)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 text-xs">Edit</button>
                    <button onClick={() => handleDelete(card.slug)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 text-xs">Del</button>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{card.title}</h3>
                <p className="text-sm text-gray-500 mb-4">For {card.recipient_name}</p>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span>💬 {card.messages?.[0]?.count || 0} msgs</span>
                  <span>💰 ₦{(card.total_collected || 0).toLocaleString()}</span>
                  {card.deadline && <span>⏰ {format(new Date(card.deadline), 'MMM d')}</span>}
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-gray-100 rounded-full mb-4">
                  <div className="h-full bg-primary-400 rounded-full transition-all"
                    style={{ width: `${Math.min((card.messages?.[0]?.count || 0) * 5, 100)}%` }} />
                </div>

                <div className="flex gap-2">
                  <Link to={`/sign/${card.slug}`}
                    className="flex-1 text-center py-2 text-xs font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    View card
                  </Link>
                  {card.status === 'active' && (
                    <button onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/sign/${card.slug}`);
                      toast.success('Link copied!');
                    }} className="px-3 py-2 text-xs font-medium bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors">
                      Copy link
                    </button>
                  )}
                  {card.status === 'active' && card.recipient_email && (
                    <button onClick={() => handleSend(card.slug)}
                      className="px-3 py-2 text-xs font-medium bg-pink-50 text-pink-600 rounded-xl hover:bg-pink-100 transition-colors">
                      Send
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Create new card CTA */}
            <Link to="/create" className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-5 flex flex-col items-center justify-center gap-3 hover:border-primary-300 hover:bg-primary-50/30 transition-all min-h-[200px] group">
              <div className="w-12 h-12 bg-gray-100 group-hover:bg-primary-100 rounded-xl flex items-center justify-center text-2xl transition-colors">+</div>
              <p className="text-sm text-gray-500 group-hover:text-primary-600 font-medium transition-colors">Create new card</p>
            </Link>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
