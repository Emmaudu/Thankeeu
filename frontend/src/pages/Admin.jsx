import { format } from 'date-fns';
import { useSEO } from '../hooks/useSEO';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI, adminCompanyAPI, adminSupportAPI, demoAPI, blogAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { formatNGN } from '../utils/currency';

const StatCard = ({ label, value, sub, color = 'bg-white' }) => (
  <div className={`${color} rounded-3xl p-5 border border-purple-100`}>
    <p className="text-xs text-warm-500 mb-1 uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-display font-semibold text-warm-900">{value}</p>
    {sub && <p className="text-xs text-warm-400 mt-1">{sub}</p>}
  </div>
);

const ticketColors = {
  open: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-purple-50 text-warm-500',
};

const Admin = () => {
  useSEO({ title: 'Admin Panel', description: 'Thankeeu admin panel.', noIndex: true });

  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [cards, setCards] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [openTicket, setOpenTicket] = useState(null);
  const [openCompany, setOpenCompany] = useState(null);
  const [companyMembers, setCompanyMembers] = useState({});
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [demos, setDemos] = useState([]);
  const [demosLoading, setDemosLoading] = useState(false);
  const [visitors, setVisitors] = useState(null);
  const [visitorsLoading, setVisitorsLoading] = useState(false);
  const [blogPosts, setBlogPosts] = useState([]);
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogEditing, setBlogEditing] = useState(null);
  const [blogForm, setBlogForm] = useState({ title:'', excerpt:'', content:'', category:'General', tags:'', status:'draft', is_featured:false, cover_image:'', author_name:'Thankeeu Team' });
  const [blogSaving, setBlogSaving] = useState(false);

  useEffect(() => { fetchCore(); }, []);

  useEffect(() => {
    if (tab === 'support' && tickets.length === 0) fetchTickets();
    if (tab === 'companies' && companies.length === 0) fetchCompanies();
    if (tab === 'demos'     && demos.length === 0)     fetchDemos();
    if (tab === 'visitors'  && !visitors)              fetchVisitors();
    if (tab === 'blog'      && blogPosts.length === 0) fetchBlog();
  }, [tab]);

  const fetchCore = async () => {
    try {
      const [statsRes, usersRes, cardsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getCards(),
      ]);
      setData(statsRes.data);
      setUsers(usersRes.data || []);
      setCards(cardsRes.data || []);
    } catch { toast.error('Failed to load admin data'); }
    finally { setLoading(false); }
  };

  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const res = await adminSupportAPI.getAll();
      setTickets(res.data || []);
    } catch { toast.error('Failed to load support tickets'); }
    finally { setTicketsLoading(false); }
  };

  const fetchBlog = async () => {
    setBlogLoading(true);
    try {
      const res = await blogAPI.admin.getPosts();
      setBlogPosts(res.data || []);
    } catch { }
    finally { setBlogLoading(false); }
  };

  const fetchDemos = async () => {
    setDemosLoading(true);
    try {
      const res = await demoAPI.getAll();
      setDemos(res.data || []);
    } catch { toast.error('Failed to load demo requests'); }
    finally { setDemosLoading(false); }
  };

  const fetchVisitors = async () => {
    setVisitorsLoading(true);
    try {
      const res = await import('axios').then(m => m.default.get(
        (import.meta.env.VITE_API_URL || '/api') + '/admin/visitors',
        { headers: { Authorization: `Bearer ${localStorage.getItem('thankeeu_token')}` } }
      ));
      setVisitors(res.data || []);
    } catch { toast.error('Failed to load visitors'); setVisitors([]); }
    finally { setVisitorsLoading(false); }
  };

  const fetchCompanies = async () => {
    setCompaniesLoading(true);
    try {
      const res = await adminCompanyAPI.getAll();
      setCompanies(res.data || []);
    } catch { toast.error('Failed to load companies'); }
    finally { setCompaniesLoading(false); }
  };

  const fetchCompanyMembers = async (companyId) => {
    if (companyMembers[companyId]) return;
    try {
      const res = await adminCompanyAPI.getMembers(companyId);
      setCompanyMembers(prev => ({ ...prev, [companyId]: res.data }));
    } catch {}
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(`Role updated to ${newRole}`);
    } catch { toast.error('Failed to update role'); }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!confirm(`Delete user ${name}? This will delete all their cards.`)) return;
    try {
      await adminAPI.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('User deleted');
    } catch { toast.error('Failed to delete user'); }
  };

  const handleDeleteCard = async (cardId, title) => {
    if (!confirm(`Delete card "${title}"?`)) return;
    try {
      await adminAPI.deleteCard(cardId);
      setCards(prev => prev.filter(c => c.id !== cardId));
      toast.success('Card deleted');
    } catch { toast.error('Failed to delete card'); }
  };

  const handleDeleteCompany = async (companyId, name) => {
    if (!confirm(`Delete company "${name}"? This will delete all their team data and subscription.`)) return;
    try {
      await adminCompanyAPI.delete(companyId);
      setCompanies(prev => prev.filter(c => c.id !== companyId));
      toast.success('Company deleted');
    } catch { toast.error('Failed to delete company'); }
  };

  const handleReply = async (ticketId) => {
    if (!replyText.trim()) return toast.error('Reply cannot be empty');
    setReplying(true);
    try {
      await adminSupportAPI.reply(ticketId, replyText);
      toast.success('Reply sent!');
      setReplyText('');
      setOpenTicket(null);
      fetchTickets();
    } catch { toast.error('Failed to send reply'); }
    finally { setReplying(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-warm-100 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const stats = data?.stats || {};
  const openCount = tickets.filter(t => t.status === 'open').length;

  const TABS = [
    { id: 'overview',  label: 'Overview' },
    { id: 'users',     label: `Users (${users.length})` },
    { id: 'cards',     label: `Cards (${cards.length})` },
    { id: 'companies', label: `Companies (${companies.length || '...'})` },
    { id: 'support',   label: `Support${openCount > 0 ? ` · ${openCount} open` : ''}` },
    { id: 'demos',     label: `Demos${demos.filter(d=>d.status==='new').length > 0 ? ` · ${demos.filter(d=>d.status==='new').length} new` : ''}` },
    { id: 'visitors',  label: 'Guest Visitors' },
    { id: 'blog',      label: `Blog (${blogPosts.filter(p=>p.status==='published').length} live)` },
  ];

  return (
    <div className="min-h-screen bg-warm-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-warm-900">Admin Panel</h1>
            <p className="text-warm-500 text-sm mt-1">Signed in as {user?.full_name} 🛡️</p>
          </div>
          <button onClick={fetchCore} className="btn-secondary text-sm py-2 px-4">↻ Refresh</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Total users" value={(stats.total_users || 0).toLocaleString()} />
          <StatCard label="Total cards" value={(stats.total_cards || 0).toLocaleString()} sub={`${stats.active_cards || 0} active`} />
          <StatCard label="Cards sent" value={(stats.sent_cards || 0).toLocaleString()} />
          <StatCard label="Gift volume" value={formatNGN(stats.total_gift_volume || 0)}
            sub={`${formatNGN(stats.platform_revenue || 0)} platform cut`} color="bg-primary-50" />
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-purple-100 mb-6 overflow-x-auto scrollbar-hide">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-primary-400 text-primary-600'
                  : 'border-transparent text-warm-500 hover:text-warm-800'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h3 className="font-semibold text-warm-900 text-sm">Recent signups</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {(data?.recent_users || []).slice(0, 8).map(u => (
                  <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-xs font-bold flex-shrink-0">
                      {u.full_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-warm-800 truncate">{u.full_name}</p>
                      <p className="text-xs text-warm-400 truncate">{u.email}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        u.role === 'admin' ? 'bg-primary-100 text-primary-600' : 'bg-purple-50 text-warm-500'
                      }`}>{u.role}</span>
                      <p className="text-xs text-warm-400 mt-0.5">{format(new Date(u.created_at), 'MMM d')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h3 className="font-semibold text-warm-900 text-sm">Recent cards</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {(data?.recent_cards || []).slice(0, 8).map(c => (
                  <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 bg-pink-50 rounded-xl flex items-center justify-center text-base flex-shrink-0">💌</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-warm-800 truncate">{c.title || c.slug}</p>
                      <p className="text-xs text-warm-400">{formatNGN(c.total_collected || 0)} collected</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      c.status === 'active' ? 'bg-green-100 text-green-700' :
                      c.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-purple-50 text-warm-500'
                    }`}>{c.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Users ── */}
        {tab === 'users' && (
          <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-purple-100 bg-warm-100">
                    {['User', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-warm-100 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-xs font-bold">{u.full_name?.charAt(0)}</div>
                          <span className="text-sm font-medium text-warm-800">{u.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-warm-500">{u.email}</td>
                      <td className="px-5 py-3">
                        <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                          className="text-xs border border-purple-100 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400">
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="px-5 py-3 text-xs text-warm-400">{format(new Date(u.created_at), 'MMM d, yyyy')}</td>
                      <td className="px-5 py-3">
                        {u.id !== user?.id && (
                          <button onClick={() => handleDeleteUser(u.id, u.full_name)}
                            className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Cards ── */}
        {tab === 'cards' && (
          <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-purple-100 bg-warm-100">
                    {['Card', 'Occasion', 'Creator', 'Status', 'Gift', 'Created', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cards.map(c => (
                    <tr key={c.id} className="hover:bg-warm-100 transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-warm-800 max-w-[150px] truncate">{c.title || c.slug}</p>
                        <p className="text-xs text-warm-400">For {c.recipient_name}</p>
                      </td>
                      <td className="px-5 py-3 text-sm text-warm-500 capitalize">{(c.occasion || '').replace('_', ' ')}</td>
                      <td className="px-5 py-3 text-sm text-warm-500">{c.users?.full_name || '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          c.status === 'active' ? 'bg-green-100 text-green-700' :
                          c.status === 'sent'   ? 'bg-blue-100 text-blue-700' :
                          c.status === 'draft'  ? 'bg-purple-50 text-warm-500' : 'bg-red-100 text-red-600'
                        }`}>{c.status}</span>
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-green-700">{formatNGN(c.total_collected || 0)}</td>
                      <td className="px-5 py-3 text-xs text-warm-400 whitespace-nowrap">{format(new Date(c.created_at), 'MMM d, yyyy')}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <a href={`/sign/${c.slug}`} target="_blank" rel="noreferrer"
                            className="text-xs text-primary-500 hover:text-primary-700 px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors">View</a>
                          <button onClick={() => handleDeleteCard(c.id, c.title)}
                            className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Companies ── */}
        {tab === 'companies' && (
          <div className="space-y-3">
            {companiesLoading ? (
              [...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white rounded-3xl border border-purple-100 animate-pulse" />)
            ) : companies.length === 0 ? (
              <div className="bg-white rounded-3xl border border-purple-100 p-12 text-center">
                <div className="text-4xl mb-3">🏢</div>
                <p className="text-sm text-warm-400">No company accounts yet</p>
              </div>
            ) : companies.map(co => (
              <div key={co.id} className="bg-white rounded-3xl border border-purple-100 overflow-hidden">
                <div className="flex items-start gap-4 px-5 py-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 font-bold text-sm flex-shrink-0">
                    {co.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-semibold text-warm-900 text-sm">{co.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        co.subscription?.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-purple-50 text-warm-500'
                      }`}>
                        {co.subscription?.status === 'active'
                          ? `✓ ${co.subscription.plan} plan`
                          : 'No subscription'}
                      </span>
                    </div>
                    <p className="text-xs text-warm-400">{co.email} · {co.contact_person} · {co.industry || 'No industry'}</p>
                    {co.subscription?.expires_at && (
                      <p className="text-xs text-warm-400 mt-0.5">
                        Subscription expires: {format(new Date(co.subscription.expires_at), 'MMM d, yyyy')}
                        {co.subscription?.amount ? ` · ${formatNGN(co.subscription.amount / 100)}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        const next = openCompany === co.id ? null : co.id;
                        setOpenCompany(next);
                        if (next) fetchCompanyMembers(co.id);
                      }}
                      className="text-xs text-primary-400 hover:text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors">
                      {openCompany === co.id ? 'Close ▲' : 'View team ▼'}
                    </button>
                    <button onClick={() => handleDeleteCompany(co.id, co.name)}
                      className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>

                {openCompany === co.id && (
                  <div className="border-t border-purple-100 bg-warm-100 px-5 py-4">
                    <p className="text-xs font-semibold text-warm-500 mb-3 uppercase tracking-wide">
                      Team members ({(companyMembers[co.id] || []).length})
                    </p>
                    {!companyMembers[co.id] ? (
                      <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                    ) : companyMembers[co.id].length === 0 ? (
                      <p className="text-xs text-warm-400">No team members imported yet</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-warm-400">
                              {['Name', 'Email', 'Department', 'Birthday', 'Status'].map(h => (
                                <th key={h} className="text-left py-1.5 pr-4 font-semibold uppercase tracking-wide">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {companyMembers[co.id].slice(0, 10).map(m => (
                              <tr key={m.id} className="text-warm-600">
                                <td className="py-2 pr-4 font-medium">{m.first_name} {m.last_name}</td>
                                <td className="py-2 pr-4">{m.email}</td>
                                <td className="py-2 pr-4">{m.department}</td>
                                <td className="py-2 pr-4">
                                  {new Date(m.birthday).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                                </td>
                                <td className="py-2">
                                  <span className={`px-2 py-0.5 rounded-full ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-purple-50 text-warm-500'}`}>
                                    {m.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {companyMembers[co.id].length > 10 && (
                          <p className="text-xs text-warm-400 mt-2">
                            + {companyMembers[co.id].length - 10} more members
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Blog Management ── */}
        {tab === 'visitors' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-warm-900 text-lg">Guest Visitors</h3>
                <p className="text-sm text-warm-400">People who signed cards without creating an account</p>
              </div>
              <button onClick={fetchVisitors} className="btn-secondary text-sm py-2 px-4">🔄 Refresh</button>
            </div>
            {visitorsLoading ? (
              <div className="h-32 rounded-2xl animate-pulse bg-purple-50" />
            ) : !visitors || visitors.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-purple-100 p-10 text-center">
                <div className="text-4xl mb-3">👤</div>
                <p className="font-semibold text-warm-900">No guest visitors yet</p>
                <p className="text-sm text-warm-400 mt-1">Guests who sign cards without creating accounts appear here.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border-2 border-purple-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-purple-50 text-xs font-semibold text-warm-500 uppercase">
                      <tr>
                        <th className="text-left px-4 py-3">Name / Email</th>
                        <th className="text-left px-4 py-3">Card signed</th>
                        <th className="text-left px-4 py-3">Occasion</th>
                        <th className="text-left px-4 py-3">Status</th>
                        <th className="text-left px-4 py-3">Emails sent</th>
                        <th className="text-left px-4 py-3">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-50">
                      {visitors.map(v => (
                        <tr key={v.id} className="hover:bg-purple-50/40">
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-warm-900">{v.author_name}</p>
                            <p className="text-xs text-warm-400">{v.author_email}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-warm-600">/{v.card_slug}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full capitalize font-medium">
                              {v.occasion?.replace('_',' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${v.converted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              {v.converted ? '✓ Converted' : '○ Guest'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-warm-600">{v.emails_sent || 0}/4</td>
                          <td className="px-4 py-3 text-xs text-warm-400">
                            {v.created_at ? new Date(v.created_at).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'blog' && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {['all','published','draft','archived'].map(s => (
                  <span key={s} className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize border ${
                    s==='published' ? 'bg-green-100 text-green-700 border-green-200' :
                    s==='draft'     ? 'bg-amber-100 text-amber-700 border-amber-200' :
                    s==='archived'  ? 'bg-purple-50 text-warm-500 border-purple-100' :
                    'bg-primary-50 text-primary-600 border-primary-100'
                  }`}>
                    {s} ({s==='all' ? blogPosts.length : blogPosts.filter(p=>p.status===s).length})
                  </span>
                ))}
              </div>
              <button onClick={() => { setBlogEditing('new'); setBlogForm({ title:'',excerpt:'',content:'',category:'General',tags:'',status:'draft',is_featured:false,cover_image:'',author_name:'Thankeeu Team' }); }}
                className="btn-primary text-xs py-2 px-4">+ New post</button>
            </div>

            {/* New / Edit form */}
            {blogEditing && (
              <div className="bg-white border border-purple-100 rounded-3xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-purple-100">
                  <p className="font-semibold text-warm-900 text-sm">{blogEditing === 'new' ? 'New post' : `Edit: ${blogEditing.title}`}</p>
                  <button onClick={() => setBlogEditing(null)} className="text-warm-400 hover:text-warm-600 text-lg">✕</button>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-warm-700 mb-1">Title *</label>
                      <input className="input text-sm" placeholder="How to plan the perfect office birthday..." value={blogForm.title} onChange={e=>setBlogForm(p=>({...p,title:e.target.value}))} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-warm-700 mb-1">Category</label>
                      <select className="input text-sm" value={blogForm.category} onChange={e=>setBlogForm(p=>({...p,category:e.target.value}))}>
                        {['General','Workplace Culture','HR & Technology','Gifting','Product Updates','Occasions'].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-warm-700 mb-1">Tags (comma-separated)</label>
                      <input className="input text-sm" placeholder="workplace, birthday, hr" value={blogForm.tags} onChange={e=>setBlogForm(p=>({...p,tags:e.target.value}))} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-warm-700 mb-1">Author name</label>
                      <input className="input text-sm" value={blogForm.author_name} onChange={e=>setBlogForm(p=>({...p,author_name:e.target.value}))} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-warm-700 mb-1">Cover image URL</label>
                      <input className="input text-sm" placeholder="https://..." value={blogForm.cover_image} onChange={e=>setBlogForm(p=>({...p,cover_image:e.target.value}))} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-warm-700 mb-1">Excerpt (shown in listing)</label>
                      <textarea className="input text-sm h-16 resize-none" placeholder="150-200 character summary..." value={blogForm.excerpt} onChange={e=>setBlogForm(p=>({...p,excerpt:e.target.value}))} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-warm-700 mb-1">Content (HTML)</label>
                      <textarea className="input text-sm font-mono h-64 resize-y" placeholder="<h2>Introduction</h2><p>Your content here...</p>" value={blogForm.content} onChange={e=>setBlogForm(p=>({...p,content:e.target.value}))} />
                      <p className="text-xs text-warm-400 mt-1">Write in HTML. Use &lt;h2&gt; for headings, &lt;p&gt; for paragraphs, &lt;strong&gt; for bold, &lt;ul&gt;&lt;li&gt; for lists.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="isFeatured" checked={blogForm.is_featured} onChange={e=>setBlogForm(p=>({...p,is_featured:e.target.checked}))} className="w-4 h-4 accent-primary-400" />
                      <label htmlFor="isFeatured" className="text-sm text-warm-700">Featured post</label>
                    </div>
                    <select className="input text-sm w-auto" value={blogForm.status} onChange={e=>setBlogForm(p=>({...p,status:e.target.value}))}>
                      <option value="draft">Draft</option>
                      <option value="published">Publish now</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setBlogEditing(null)} className="btn-secondary flex-1 text-sm py-2">Cancel</button>
                    <button disabled={blogSaving || !blogForm.title || !blogForm.content} onClick={async () => {
                      setBlogSaving(true);
                      try {
                        if (blogEditing === 'new') {
                          await blogAPI.admin.createPost(blogForm);
                          toast.success('Post created!');
                        } else {
                          await blogAPI.admin.updatePost(blogEditing.id, blogForm);
                          toast.success('Post updated!');
                        }
                        setBlogEditing(null);
                        fetchBlog();
                      } catch (err) { toast.error(err.response?.data?.error || 'Failed to save'); }
                      finally { setBlogSaving(false); }
                    }} className="btn-primary flex-1 text-sm py-2 disabled:opacity-50">
                      {blogSaving ? 'Saving...' : blogEditing === 'new' ? 'Create post' : 'Save changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Posts list */}
            {blogLoading ? (
              [...Array(3)].map((_,i) => <div key={i} className="h-20 bg-white rounded-3xl border border-purple-100 animate-pulse" />)
            ) : blogPosts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-purple-100 p-10 text-center">
                <div className="text-4xl mb-3">📝</div>
                <p className="text-sm text-warm-400">No posts yet. Create your first post above.</p>
              </div>
            ) : blogPosts.map(post => (
              <div key={post.id} className="bg-white rounded-3xl border border-purple-100 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-semibold text-warm-900 text-sm truncate">{post.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      post.status==='published' ? 'bg-green-100 text-green-700' :
                      post.status==='draft'     ? 'bg-amber-100 text-amber-700' :
                      'bg-purple-50 text-warm-500'
                    }`}>{post.status}</span>
                    {post.is_featured && <span className="text-xs bg-primary-50 text-primary-500 px-2 py-0.5 rounded-full">★ Featured</span>}
                  </div>
                  <p className="text-xs text-warm-400">
                    <span className="text-primary-400">{post.category}</span>
                    {post.published_at ? ` · ${format(new Date(post.published_at), 'MMM d, yyyy')}` : ' · Not published'}
                    {' '} · {(post.views||0).toLocaleString()} views · {post.read_time} min read
                  </p>
                  <p className="text-xs text-warm-400 mt-0.5 font-mono">/blog/{post.slug}</p>
                </div>
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs border border-purple-100 text-warm-600 hover:bg-warm-100 px-3 py-1.5 rounded-lg">Preview</a>
                  <button onClick={() => { setBlogEditing(post); setBlogForm({ title:post.title, excerpt:post.excerpt||'', content:post.content||'', category:post.category, tags:(post.tags||[]).join(', '), status:post.status, is_featured:post.is_featured, cover_image:post.cover_image||'', author_name:post.author_name }); }}
                    className="text-xs border border-primary-200 text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded-lg">Edit</button>
                  <button onClick={async () => {
                    const newStatus = post.status === 'published' ? 'draft' : 'published';
                    try {
                      await blogAPI.admin.setStatus(post.id, newStatus);
                      setBlogPosts(prev => prev.map(p => p.id===post.id ? {...p,status:newStatus} : p));
                      toast.success(`Post ${newStatus}`);
                    } catch { toast.error('Failed'); }
                  }} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${post.status==='published' ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                    {post.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button onClick={async () => {
                    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
                    try {
                      await blogAPI.admin.deletePost(post.id);
                      setBlogPosts(prev => prev.filter(p => p.id!==post.id));
                      toast.success('Post deleted');
                    } catch { toast.error('Failed'); }
                  }} className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Demo Requests ── */}
        {tab === 'demos' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {['new','contacted','scheduled','converted','declined'].map(s => (
                  <span key={s} className={`text-xs px-3 py-1.5 rounded-full font-medium border capitalize ${
                    s==='new'       ? 'bg-amber-100 text-amber-700 border-amber-200' :
                    s==='contacted' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    s==='scheduled' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                    s==='converted' ? 'bg-green-100 text-green-700 border-green-200' :
                    'bg-purple-50 text-warm-500 border-purple-100'
                  }`}>
                    {s} ({demos.filter(d=>d.status===s).length})
                  </span>
                ))}
              </div>
              <button onClick={fetchDemos} className="text-xs text-primary-400 hover:text-primary-600">↻ Refresh</button>
            </div>

            {demosLoading ? (
              [...Array(3)].map((_,i) => <div key={i} className="h-24 bg-white rounded-3xl border border-purple-100 animate-pulse" />)
            ) : demos.length === 0 ? (
              <div className="bg-white rounded-3xl border border-purple-100 p-12 text-center">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-sm text-warm-400">No demo requests yet</p>
                <p className="text-xs text-warm-400 mt-1">Requests appear here when companies fill the Book Demo form</p>
              </div>
            ) : demos.map(d => (
              <div key={d.id} className="bg-white rounded-3xl border border-purple-100 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-warm-900 text-sm">{d.company_name}</p>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${
                        d.status==='new'       ? 'bg-amber-100 text-amber-700' :
                        d.status==='contacted' ? 'bg-blue-100 text-blue-700' :
                        d.status==='scheduled' ? 'bg-purple-100 text-purple-700' :
                        d.status==='converted' ? 'bg-green-100 text-green-700' :
                        'bg-purple-50 text-warm-500'
                      }`}>{d.status}</span>
                      {d.team_size && <span className="text-xs bg-purple-50 text-warm-600 px-2.5 py-0.5 rounded-full">{d.team_size} employees</span>}
                    </div>
                    <p className="text-xs text-warm-500 mb-1">
                      <strong className="text-warm-700">{d.contact_name}</strong> · {d.email}
                      {d.phone ? ` · ${d.phone}` : ''}
                    </p>
                    {d.message && <p className="text-xs text-warm-400 line-clamp-2">{d.message}</p>}
                    <p className="text-xs text-warm-400 mt-1">{format(new Date(d.created_at), 'MMM d, yyyy · h:mm a')}</p>
                    {d.admin_note && (
                      <div className="mt-2 bg-primary-50 px-3 py-2 rounded-lg">
                        <p className="text-xs text-primary-700"><strong>Note:</strong> {d.admin_note}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    <a href={`mailto:${d.email}?subject=Thankeeu for Teams Demo - ${d.company_name}`}
                      className="text-xs bg-primary-50 text-primary-600 hover:bg-primary-100 px-3 py-2 rounded-lg transition-colors font-medium">
                      📧 Email
                    </a>
                    <button onClick={() => setEditDemoId(editDemoId === d.id ? null : d.id)}
                      className="text-xs border border-purple-100 text-warm-600 hover:bg-warm-100 px-3 py-2 rounded-lg transition-colors">
                      Update status
                    </button>
                  </div>
                </div>

                {editDemoId === d.id && (
                  <div className="border-t border-purple-100 bg-warm-100 px-5 py-4 space-y-3">
                    <p className="text-xs font-semibold text-warm-500">Update status for {d.company_name}</p>
                    <div className="flex flex-wrap gap-2">
                      {['new','contacted','scheduled','converted','declined'].map(s => (
                        <button key={s} onClick={async () => {
                          try {
                            await demoAPI.updateStatus(d.id, s, demoNote || undefined);
                            setDemos(prev => prev.map(x => x.id === d.id ? {...x, status: s, admin_note: demoNote || x.admin_note} : x));
                            toast.success('Status updated');
                            setEditDemoId(null); setDemoNote('');
                          } catch { toast.error('Failed to update'); }
                        }} className={`text-xs px-3 py-2 rounded-lg font-medium capitalize border-2 transition-all ${
                          d.status === s ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-purple-100 text-warm-600 hover:border-purple-200'
                        }`}>{s}</button>
                      ))}
                    </div>
                    <textarea className="input h-16 resize-none text-sm" placeholder="Add an internal note (optional)..."
                      value={demoNote} onChange={e => setDemoNote(e.target.value)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Support Tickets ── */}
        {tab === 'support' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                  <span key={s} className={`text-xs px-3 py-1.5 rounded-full font-medium border ${ticketColors[s] || 'bg-purple-50 text-warm-500 border-purple-100'}`}>
                    {s.replace('_', ' ')} ({tickets.filter(t => t.status === s).length})
                  </span>
                ))}
              </div>
              <button onClick={fetchTickets} className="text-xs text-primary-400 hover:text-primary-600 transition-colors">
                ↻ Refresh
              </button>
            </div>

            {ticketsLoading ? (
              [...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white rounded-3xl border border-purple-100 animate-pulse" />)
            ) : tickets.length === 0 ? (
              <div className="bg-white rounded-3xl border border-purple-100 p-12 text-center">
                <div className="text-4xl mb-3">🎫</div>
                <p className="text-sm text-warm-400">No support tickets yet</p>
              </div>
            ) : tickets.map(t => (
              <div key={t.id} className="bg-white rounded-3xl border border-purple-100 overflow-hidden">
                <div className="flex items-start gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-warm-900">{t.subject}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ticketColors[t.status] || 'bg-purple-50 text-warm-500'}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        t.sender_type === 'company' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {t.sender_type === 'company' ? '🏢 Company' : '👤 User'}
                      </span>
                    </div>
                    <p className="text-xs text-warm-400">
                      From <strong className="text-warm-600">{t.sender_name}</strong> ({t.sender_email}) · {format(new Date(t.created_at), 'MMM d, yyyy · h:mm a')}
                    </p>
                  </div>
                  <button
                    onClick={() => setOpenTicket(openTicket === t.id ? null : t.id)}
                    className="text-xs text-primary-400 hover:text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors flex-shrink-0">
                    {openTicket === t.id ? 'Close ▲' : 'Open ▼'}
                  </button>
                </div>

                {openTicket === t.id && (
                  <div className="border-t border-purple-100 px-5 py-4 bg-warm-100 space-y-4">
                    <div className="bg-white rounded-xl p-4 border border-purple-100">
                      <p className="text-xs font-semibold text-warm-400 mb-2">Message</p>
                      <p className="text-sm text-warm-700 leading-relaxed whitespace-pre-line">{t.message}</p>
                    </div>

                    {t.admin_reply && (
                      <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
                        <p className="text-xs font-semibold text-primary-500 mb-2">
                          Your reply · {t.admin_replied_at ? format(new Date(t.admin_replied_at), 'MMM d, yyyy') : ''}
                        </p>
                        <p className="text-sm text-warm-700 leading-relaxed whitespace-pre-line">{t.admin_reply}</p>
                      </div>
                    )}

                    {!['resolved', 'closed'].includes(t.status) && (
                      <div>
                        <textarea
                          className="input h-24 resize-none w-full text-sm mb-2"
                          placeholder={`Reply to ${t.sender_name}...`}
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                        />
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => { setOpenTicket(null); setReplyText(''); }}
                            className="btn-secondary text-xs py-2 px-4">Cancel</button>
                          <button
                            onClick={() => handleReply(t.id)}
                            disabled={replying || !replyText.trim()}
                            className="btn-primary text-xs py-2 px-5 disabled:opacity-50">
                            {replying ? 'Sending...' : '📧 Send reply'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
