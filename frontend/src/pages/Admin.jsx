import { format } from 'date-fns';
import { useSEO } from '../hooks/useSEO';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI, adminCompanyAPI, adminSupportAPI, demoAPI, blogAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { formatNGN } from '../utils/currency';

// ── Mini helpers ──────────────────────────────────────────────────────────────
const Badge = ({ children, color = 'purple' }) => {
  const cls = {
    purple: 'bg-purple-100 text-purple-700',
    amber:  'bg-amber-100 text-amber-700',
    green:  'bg-green-100 text-green-700',
    blue:   'bg-blue-100 text-blue-700',
    red:    'bg-red-100 text-red-600',
    gray:   'bg-warm-100 text-warm-500',
  }[color] || 'bg-purple-100 text-purple-700';
  return <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${cls}`}>{children}</span>;
};

const Stat = ({ icon, label, value, sub, accent }) => (
  <div className="bg-white rounded-2xl border border-purple-100 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className="text-2xl">{icon}</div>
      {sub && <span className="text-xs text-warm-400 font-medium">{sub}</span>}
    </div>
    <p className="text-2xl font-display font-bold text-warm-900">{value}</p>
    <p className="text-xs text-warm-500 mt-1">{label}</p>
  </div>
);

const EmptyState = ({ icon, title, sub }) => (
  <div className="bg-white rounded-2xl border border-purple-100 p-14 text-center">
    <div className="text-5xl mb-4">{icon}</div>
    <p className="font-bold text-warm-900 text-base mb-1">{title}</p>
    {sub && <p className="text-sm text-warm-400">{sub}</p>}
  </div>
);

const PalTicketRow = ({ ticket, onReply }) => {
  const [reply, setReply] = useState(ticket.admin_reply || '');
  const [open, setOpen] = useState(false);
  const STATUS_COLOR = { open:'bg-amber-100 text-amber-700', answered:'bg-green-100 text-green-700', closed:'bg-gray-100 text-gray-600' };

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <p className="font-medium text-warm-900 text-sm">{ticket.group_name} — {ticket.subject}</p>
          <p className="text-xs text-warm-400 mt-0.5">{ticket.message}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 capitalize ${STATUS_COLOR[ticket.status]||STATUS_COLOR.open}`}>{ticket.status}</span>
      </div>
      {ticket.admin_reply && !open && (
        <div className="mt-2 p-2.5 bg-green-50 rounded-lg border-l-2 border-green-400">
          <p className="text-xs text-green-800">{ticket.admin_reply}</p>
        </div>
      )}
      {open ? (
        <div className="mt-2 flex gap-2">
          <input value={reply} onChange={e=>setReply(e.target.value)} placeholder="Type a reply..." className="input flex-1 text-sm"/>
          <button onClick={()=>{ onReply(ticket.id, reply); setOpen(false); }} className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold">Send</button>
        </div>
      ) : (
        <button onClick={()=>setOpen(true)} className="mt-2 text-xs text-primary-600 font-semibold">
          {ticket.admin_reply ? 'Edit reply' : 'Reply'}
        </button>
      )}
    </div>
  );
};

const ticketColor = { open:'amber', in_progress:'blue', resolved:'green', closed:'gray' };
const demoColor  = { new:'amber', contacted:'blue', scheduled:'purple', converted:'green', declined:'gray' };

// ── Admin component ───────────────────────────────────────────────────────────
const Admin = () => {
  useSEO({ title: 'Admin Panel — Thankeeu', noIndex: true });

  const { user } = useAuth();
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState('overview');

  // Core data
  const [stats, setStats]               = useState({});
  const [users, setUsers]               = useState([]);
  const [cards, setCards]               = useState([]);

  // Lazy-loaded tabs
  const [companies, setCompanies]       = useState([]);
  const [companiesLoading, setCompanieLoading] = useState(false);
  const [companyMembers, setCompanyMembers] = useState({});
  const [openCompany, setOpenCompany]   = useState(null);

  const [tickets, setTickets]           = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [openTicket, setOpenTicket]     = useState(null);
  const [replyText, setReplyText]       = useState('');
  const [replying, setReplying]         = useState(false);

  const [demos, setDemos]               = useState([]);
  const [demosLoading, setDemosLoading] = useState(false);
  const [editDemoId, setEditDemoId]     = useState(null);
  const [demoNote, setDemoNote]         = useState('');

  const [visitors, setVisitors]         = useState([]);
  const [visitorsLoading, setVisitorsLoading] = useState(false);
  const [visitorStats, setVisitorStats] = useState(null);

  const [blogPosts, setBlogPosts]       = useState([]);
  const [blogLoading, setBlogLoading]   = useState(false);
  const [blogEditing, setBlogEditing]   = useState(null);

  const [vendors,       setVendors]       = useState([]);
  const [vendorOrders,  setVendorOrders]  = useState([]);
  const [vendorsLoading,setVendorsLoading]= useState(false);
  const [blogForm, setBlogForm]         = useState({
    title:'', excerpt:'', content:'', category:'General',
    tags:'', status:'draft', is_featured:false, cover_image:'',
    author_name:'Thankeeu Team',
  });
  const [blogSaving, setBlogSaving]     = useState(false);

  // ── Loaders ───────────────────────────────────────────────────────────────
  useEffect(() => { fetchCore(); }, []);

  useEffect(() => {
    if (tab === 'support'   && !tickets.length)       fetchTickets();
    if (tab === 'companies' && !companies.length)     fetchCompanies();
    if (tab === 'demos'     && !demos.length)         fetchDemos();
    if (tab === 'visitors'  && !visitors.length && !visitorStats) fetchVisitors();
    if (tab === 'blog'      && !blogPosts.length)     fetchBlog();
    if (tab === 'vendors'   && !vendors.length)      fetchVendors();
    if (tab === 'pals'      && !palApplications.length) fetchPals();
  }, [tab]);

  const fetchCore = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, cardsRes] = await Promise.all([
        adminAPI.getStats(), adminAPI.getUsers(), adminAPI.getCards(),
      ]);
      setStats(statsRes.data || {});
      setUsers(usersRes.data || []);
      setCards(cardsRes.data || []);
    } catch { toast.error('Failed to load admin data'); }
    finally { setLoading(false); }
  };

  const fetchTickets = async () => {
    setTicketsLoading(true);
    try { const r = await adminSupportAPI.getAll(); setTickets(r.data || []); }
    catch { toast.error('Failed to load tickets'); }
    finally { setTicketsLoading(false); }
  };

  const fetchCompanies = async () => {
    setCompanieLoading(true);
    try { const r = await adminCompanyAPI.getAll(); setCompanies(r.data || []); }
    catch { toast.error('Failed to load companies'); }
    finally { setCompanieLoading(false); }
  };

  const fetchDemos = async () => {
    setDemosLoading(true);
    try { const r = await demoAPI.getAll(); setDemos(Array.isArray(r.data) ? r.data : []); }
    catch (err) { toast.error('Failed to load demos'); setDemos([]); }
    finally { setDemosLoading(false); }
  };

  const fetchVisitors = async () => {
    setVisitorsLoading(true);
    try {
      const tok  = localStorage.getItem('thankeeu_token');
      const base = import.meta.env.VITE_API_URL || '/api';
      // Visitors route is at /api/admin/visitors
      const r = await fetch(`${base}/admin/visitors`, { headers:{ Authorization:`Bearer ${tok}` } });
      if (!r.ok) throw new Error((await r.json())?.error || 'Failed');
      const data = await r.json();
      setVisitors(Array.isArray(data) ? data : []);

      // Also fetch visitor stats
      const rs = await fetch(`${base}/visitors/stats`, { headers:{ Authorization:`Bearer ${tok}` } });
      if (rs.ok) setVisitorStats(await rs.json());
    } catch (err) {
      console.error('fetchVisitors:', err);
      toast.error('Failed to load visitors');
      setVisitors([]);
    } finally { setVisitorsLoading(false); }
  };

  const fetchPals = async () => {
    try {
      const base = import.meta.env.VITE_API_URL || '/api';
      const hdr  = { Authorization: `Bearer ${localStorage.getItem('thankeeu_token')}` };
      const [pRes, tRes] = await Promise.all([
        fetch(`${base}/admin/pals`, { headers: hdr }).then(r => r.json()),
        fetch(`${base}/admin/pals/tickets`, { headers: hdr }).then(r => r.json()).catch(() => []),
      ]);
      setPalApplications(Array.isArray(pRes) ? pRes : []);
      setPalTickets(Array.isArray(tRes) ? tRes : []);
    } catch { toast.error('Failed to load Pals data'); }
  };

  const approvePal = async (id, name) => {
    const base = import.meta.env.VITE_API_URL||'/api';
    const res = await fetch(`${base}/admin/pals/${id}/approve`, { method:'POST', headers:{Authorization:`Bearer ${localStorage.getItem('thankeeu_token')}`} });
    const d = await res.json();
    if (!res.ok) return toast.error(d.error||'Failed');
    toast.success(d.message || `${name} approved!`);
    fetchPals();
  };

  const rejectPal = async () => {
    if (!rejectReason.trim()) return toast.error('Please provide a reason');
    const base = import.meta.env.VITE_API_URL||'/api';
    const res = await fetch(`${base}/admin/pals/${rejectModal.id}/reject`, {
      method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${localStorage.getItem('thankeeu_token')}`},
      body: JSON.stringify({ reason: rejectReason })
    });
    const d = await res.json();
    if (!res.ok) return toast.error(d.error||'Failed');
    toast.success(d.message);
    setRejectModal(null); setRejectReason('');
    fetchPals();
  };

  const replyPalTicket = async (id, reply) => {
    const base = import.meta.env.VITE_API_URL||'/api';
    const res = await fetch(`${base}/admin/pals/tickets/${id}/reply`, {
      method:'PUT', headers:{'Content-Type':'application/json',Authorization:`Bearer ${localStorage.getItem('thankeeu_token')}`},
      body: JSON.stringify({ reply })
    });
    const d = await res.json();
    if (!res.ok) return toast.error(d.error||'Failed');
    toast.success('Reply sent!');
    fetchPals();
  };

  const fetchVendors = async () => {
    try {
      const base = import.meta.env.VITE_API_URL || '/api';
      const hdr  = { Authorization: `Bearer ${localStorage.getItem('thankeeu_token')}` };
      const [vRes, oRes] = await Promise.all([
        fetch(`${base}/vendor/admin/vendors`, { headers: hdr }).then(r => r.json()),
        fetch(`${base}/vendor/admin/orders`,  { headers: hdr }).then(r => r.json()).catch(() => []),
      ]);
      setVendors(Array.isArray(vRes) ? vRes : []);
      setVendorOrders(Array.isArray(oRes) ? oRes : []);
    } catch { toast.error('Failed to load vendor data'); }
  };

  const fetchBlog = async () => {
    setBlogLoading(true);
    try { const r = await blogAPI.admin.getPosts('all'); setBlogPosts(r.data || []); }
    catch { toast.error('Failed to load blog posts'); }
    finally { setBlogLoading(false); }
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const updateDemoStatus = async (id, status) => {
    try {
      await demoAPI.updateStatus(id, status, demoNote || undefined);
      setDemos(prev => prev.map(d => d.id === id ? { ...d, status, admin_note: demoNote || d.admin_note } : d));
      setEditDemoId(null); setDemoNote('');
      toast.success('Status updated');
    } catch { toast.error('Update failed'); }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !openTicket) return;
    setReplying(true);
    try {
      await adminSupportAPI.reply(openTicket.id, replyText);
      setReplyText(''); setOpenTicket(null);
      toast.success('Reply sent');
    } catch { toast.error('Reply failed'); }
    finally { setReplying(false); }
  };

  const saveBlogPost = async () => {
    if (!blogForm.title?.trim()) return toast.error('Title required');
    setBlogSaving(true);
    try {
      if (blogEditing) {
        await blogAPI.admin.updatePost(blogEditing.id, blogForm);
        setBlogPosts(prev => prev.map(p => p.id === blogEditing.id ? { ...p, ...blogForm } : p));
        toast.success('Post updated');
      } else {
        const r = await blogAPI.admin.createPost(blogForm);
        setBlogPosts(prev => [r.data, ...prev]);
        toast.success('Post created');
      }
      setBlogEditing(null);
      setBlogForm({ title:'', excerpt:'', content:'', category:'General', tags:'', status:'draft', is_featured:false, cover_image:'', author_name:'Thankeeu Team' });
    } catch { toast.error('Save failed'); }
    finally { setBlogSaving(false); }
  };

  if (!user || user.role !== 'admin') return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#F5F3FF' }}>
      <div className="text-center">
        <div className="text-5xl mb-4">🔒</div>
        <p className="text-warm-700 font-semibold">Admin access only</p>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen grid place-items-center" style={{ background:'#F5F3FF' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-warm-500">Loading admin panel...</p>
      </div>
    </div>
  );

  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress');
  const newDemos    = demos.filter(d => d.status === 'new');

  const TABS = [
    { id:'overview',  label:'📊 Overview' },
    { id:'users',     label:`👥 Users (${users.length})` },
    { id:'cards',     label:`🃏 Cards (${cards.length})` },
    { id:'companies', label:`🏢 Companies` },
    { id:'support',   label:`💬 Support${openTickets.length ? ` · ${openTickets.length}` : ''}` },
    { id:'demos',     label:`📅 Demos${newDemos.length ? ` · ${newDemos.length} new` : ''}` },
    { id:'visitors',  label:`👤 Visitors${visitors.length ? ` (${visitors.length})` : ''}` },
    { id:'blog',      label:`✍️ Blog` },
    { id:'vendors',   label:`🏪 Vendors` },
    { id:'pals',      label:`👥 Pals${palApplications.filter(p=>p.status==='pending').length ? ` · ${palApplications.filter(p=>p.status==='pending').length} new` : ''}` },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg,#F5F0FF 0%,#FDFCFF 40%)' }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center text-white font-bold text-lg">🛡️</div>
              <h1 className="font-display text-3xl font-bold text-warm-900">Admin Panel</h1>
            </div>
            <p className="text-warm-500 text-sm ml-13">Welcome back, {user?.full_name}</p>
          </div>
          <button onClick={fetchCore}
            className="flex items-center gap-2 btn-secondary text-sm py-2.5 px-4">
            ↻ Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat icon="👥" label="Total users"    value={(stats.total_users  || 0).toLocaleString()} />
          <Stat icon="🃏" label="Total cards"    value={(stats.total_cards  || 0).toLocaleString()} sub={`${stats.active_cards || 0} active`} />
          <Stat icon="✅" label="Cards sent"     value={(stats.sent_cards   || 0).toLocaleString()} />
          <Stat icon="💰" label="Gift volume"    value={formatNGN(stats.total_gift_volume || 0)} sub={`${formatNGN(stats.platform_revenue || 0)} platform`} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-purple-100 mb-6 overflow-x-auto pb-0" style={{ scrollbarWidth:'none' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                tab === t.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-warm-400 hover:text-warm-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ─────────────── OVERVIEW ─────────────── */}
        {tab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recent signups */}
            <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-purple-50 flex items-center justify-between">
                <p className="font-bold text-warm-900 text-sm">Recent signups</p>
                <Badge color="purple">{users.length} total</Badge>
              </div>
              <div className="divide-y divide-purple-50">
                {users.slice(0, 8).map(u => (
                  <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-purple-50/30">
                    <div className="w-8 h-8 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 text-xs font-bold flex-shrink-0">
                      {u.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-warm-800 truncate">{u.full_name}</p>
                      <p className="text-xs text-warm-400 truncate">{u.email}</p>
                    </div>
                    <Badge color={u.role === 'admin' ? 'purple' : 'gray'}>{u.role}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent cards */}
            <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-purple-50 flex items-center justify-between">
                <p className="font-bold text-warm-900 text-sm">Recent cards</p>
                <Badge color="green">{cards.filter(c=>c.status==='sent').length} sent</Badge>
              </div>
              <div className="divide-y divide-purple-50">
                {cards.slice(0, 8).map(c => (
                  <div key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-purple-50/30">
                    <div className="w-8 h-8 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600 text-sm flex-shrink-0">💌</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-warm-800 truncate">{c.title || `For ${c.recipient_name}`}</p>
                      <p className="text-xs text-warm-400 truncate">{c.occasion} · {c.creator_name}</p>
                    </div>
                    <Badge color={c.status==='sent'?'green':c.status==='active'?'blue':'gray'}>{c.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────── USERS ─────────────── */}
        {tab === 'users' && (
          <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background:'#F8F6FF' }}>
                  <tr>{['Name','Email','Role','Signed up','Actions'].map(h=>(
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-warm-500 uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-purple-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-600">{u.full_name?.[0]||'?'}</div>
                          <span className="text-sm font-semibold text-warm-800">{u.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-warm-500">{u.email}</td>
                      <td className="px-4 py-3"><Badge color={u.role==='admin'?'purple':'gray'}>{u.role}</Badge></td>
                      <td className="px-4 py-3 text-xs text-warm-400">{u.created_at ? format(new Date(u.created_at),'MMM d, yyyy') : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={async()=>{
                            if(!confirm(`Change ${u.full_name} to ${u.role==='admin'?'user':'admin'}?`)) return;
                            await adminAPI.updateRole(u.id, u.role==='admin'?'user':'admin');
                            setUsers(p=>p.map(x=>x.id===u.id?{...x,role:x.role==='admin'?'user':'admin'}:x));
                          }} className="text-xs bg-primary-50 text-primary-600 px-2 py-1 rounded-lg hover:bg-primary-100">
                            {u.role==='admin'?'↓ user':'↑ admin'}
                          </button>
                          <button onClick={async()=>{
                            if(!confirm(`Delete ${u.full_name}? This is irreversible.`)) return;
                            await adminAPI.deleteUser(u.id);
                            setUsers(p=>p.filter(x=>x.id!==u.id));
                            toast.success('User deleted');
                          }} className="text-xs text-red-400 hover:bg-red-50 px-2 py-1 rounded-lg">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─────────────── CARDS ─────────────── */}
        {tab === 'cards' && (
          <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background:'#F8F6FF' }}>
                  <tr>{['Card','Creator','Occasion','Status','Gift','Created',''].map(h=>(
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-warm-500 uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-purple-50">
                  {cards.map(c => (
                    <tr key={c.id} className="hover:bg-purple-50/30">
                      <td className="px-4 py-3 text-sm font-semibold text-warm-800 max-w-[180px] truncate">{c.title || `For ${c.recipient_name}`}</td>
                      <td className="px-4 py-3 text-xs text-warm-500">{c.creator_name}</td>
                      <td className="px-4 py-3 text-xs text-warm-500 capitalize">{c.occasion?.replace('_',' ')}</td>
                      <td className="px-4 py-3"><Badge color={c.status==='sent'?'green':c.status==='active'?'blue':'gray'}>{c.status}</Badge></td>
                      <td className="px-4 py-3 text-xs font-semibold text-green-700">{c.total_collected ? formatNGN(c.total_collected) : '—'}</td>
                      <td className="px-4 py-3 text-xs text-warm-400">{c.created_at ? format(new Date(c.created_at),'MMM d') : '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={async()=>{
                          if(!confirm('Delete this card?')) return;
                          await adminAPI.deleteCard(c.id);
                          setCards(p=>p.filter(x=>x.id!==c.id));
                          toast.success('Card deleted');
                        }} className="text-xs text-red-400 hover:bg-red-50 px-2 py-1 rounded-lg">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─────────────── COMPANIES ─────────────── */}
        {tab === 'companies' && (
          <div className="space-y-3">
            {companiesLoading ? [...Array(4)].map((_,i)=><div key={i} className="h-20 rounded-2xl animate-pulse bg-purple-50"/>)
            : companies.length === 0 ? <EmptyState icon="🏢" title="No companies yet" sub="Companies appear here when HR teams sign up" />
            : companies.map(co => (
              <div key={co.id} className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-purple-50/30"
                  onClick={async () => {
                    if (openCompany === co.id) { setOpenCompany(null); return; }
                    setOpenCompany(co.id);
                    if (!companyMembers[co.id]) {
                      const r = await adminCompanyAPI.getMembers(co.id).catch(()=>({data:[]}));
                      setCompanyMembers(p=>({...p,[co.id]: r.data||[]}));
                    }
                  }}>
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg flex-shrink-0">
                    {co.name?.[0]||'?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-warm-900 text-sm">{co.name}</p>
                    <p className="text-xs text-warm-400">{co.email} · {co.industry || 'No industry'}</p>
                  </div>
                  <Badge color={co.subscription_status==='active'?'green':'gray'}>
                    {co.subscription_status==='active' ? `✓ ${co.subscription_plan}` : 'free'}
                  </Badge>
                  <span className="text-warm-400 text-sm">{openCompany===co.id?'▲':'▼'}</span>
                </div>
                {openCompany===co.id && (
                  <div className="border-t border-purple-50 px-5 py-4 bg-purple-50/30 space-y-4">
                    <p className="text-xs font-semibold text-warm-500">
                      {(companyMembers[co.id]||[]).length} team members
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(companyMembers[co.id]||[]).slice(0,10).map(m=>(
                        <span key={m.id} className="text-xs bg-white border border-purple-100 px-2 py-1 rounded-lg text-warm-700">
                          {m.first_name} {m.last_name}
                        </span>
                      ))}
                      {(companyMembers[co.id]||[]).length > 10 && (
                        <span className="text-xs text-warm-400">+{(companyMembers[co.id]||[]).length - 10} more</span>
                      )}
                    </div>

                    {/* ── Pricing Multiplier ──────────────────────────── */}
                    <div className="bg-white border border-purple-100 rounded-xl p-4">
                      <p className="text-xs font-bold text-warm-700 mb-2">💰 Set pricing multiplier</p>
                      <p className="text-xs text-warm-400 mb-3">Rate per employee per month. 0 = free plan. Leave blank = "get a quote" shown to HR.</p>
                      <div className="flex gap-2 items-center">
                        <span className="text-sm text-warm-500">₦</span>
                        <input type="number" min="0" placeholder="e.g. 2000"
                          defaultValue={co.pricing_multiplier ?? ''}
                          id={`mult-${co.id}`}
                          className="flex-1 border border-purple-200 rounded-lg px-3 py-1.5 text-sm text-warm-900 focus:outline-none focus:border-primary-400" />
                        <button
                          onClick={async () => {
                            const val = document.getElementById(`mult-${co.id}`)?.value;
                            if (val === '' || val === null) return toast.error('Enter a value (0 for free)');
                            try {
                              const r = await fetch(`${import.meta.env.VITE_API_URL||'/api'}/admin/companies/${co.id}/set-multiplier`, {
                                method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('thankeeu_token')}`},
                                body: JSON.stringify({ multiplier: Number(val) })
                              });
                              const d = await r.json();
                              if (!r.ok) throw new Error(d.error);
                              toast.success(d.message);
                            } catch(e) { toast.error(e.message); }
                          }}
                          className="bg-primary-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-primary-600">
                          Set
                        </button>
                      </div>
                      {co.pricing_multiplier === 0 && <p className="text-xs text-green-600 font-semibold mt-1">✓ Currently FREE</p>}
                      {co.pricing_multiplier > 0 && <p className="text-xs text-primary-600 font-semibold mt-1">✓ Currently ₦{co.pricing_multiplier?.toLocaleString('en-NG')}/employee/month</p>}
                    </div>

                    {/* ── Pilot Period ─────────────────────────────────── */}
                    <div className="bg-white border border-purple-100 rounded-xl p-4">
                      <p className="text-xs font-bold text-warm-700 mb-2">🧪 Grant pilot period</p>
                      <p className="text-xs text-warm-400 mb-3">Company gets free access for the chosen duration. Automation stops after pilot ends.</p>
                      {co.pilot_ends_at && new Date(co.pilot_ends_at) > new Date() && (
                        <p className="text-xs text-green-600 font-semibold mb-2">
                          ✓ Pilot active until {new Date(co.pilot_ends_at).toLocaleDateString('en-NG')}
                        </p>
                      )}
                      <div className="flex gap-2">
                        {[14, 30].map(days => (
                          <button key={days}
                            onClick={async () => {
                              if (!confirm(`Grant ${days}-day pilot to ${co.name}?`)) return;
                              try {
                                const r = await fetch(`${import.meta.env.VITE_API_URL||'/api'}/admin/companies/${co.id}/grant-pilot`, {
                                  method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('thankeeu_token')}`},
                                  body: JSON.stringify({ days })
                                });
                                const d = await r.json();
                                if (!r.ok) throw new Error(d.error);
                                toast.success(d.message);
                              } catch(e) { toast.error(e.message); }
                            }}
                            className="text-xs font-bold border border-primary-200 text-primary-600 px-4 py-1.5 rounded-lg hover:bg-primary-50">
                            {days}-day pilot
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─────────────── SUPPORT ─────────────── */}
        {tab === 'support' && (
          <div className="space-y-3">
            {ticketsLoading ? [...Array(3)].map((_,i)=><div key={i} className="h-20 rounded-2xl animate-pulse bg-purple-50"/>)
            : tickets.length === 0 ? <EmptyState icon="💬" title="No support tickets" sub="All clear!" />
            : tickets.map(t => (
              <div key={t.id} className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
                <div className="flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-purple-50/30" onClick={()=>setOpenTicket(openTicket?.id===t.id?null:t)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-warm-900 text-sm">{t.subject}</p>
                      <Badge color={ticketColor[t.status]||'gray'}>{t.status?.replace('_',' ')}</Badge>
                    </div>
                    <p className="text-xs text-warm-400">{t.user_name} · {t.user_email}</p>
                    <p className="text-xs text-warm-400 mt-0.5">{t.created_at ? format(new Date(t.created_at),'MMM d, yyyy · h:mm a') : '—'}</p>
                  </div>
                </div>
                {openTicket?.id===t.id && (
                  <div className="border-t border-purple-50 px-5 py-4 space-y-3">
                    <div className="bg-warm-50 rounded-xl p-3">
                      <p className="text-sm text-warm-700 leading-relaxed">{t.message}</p>
                    </div>
                    {t.replies?.map((r,i)=>(
                      <div key={i} className={`rounded-xl p-3 ${r.from_admin?'bg-primary-50 ml-4':'bg-warm-50 mr-4'}`}>
                        <p className="text-xs font-semibold text-warm-500 mb-1">{r.from_admin?'Admin':'User'} · {r.created_at ? format(new Date(r.created_at),'MMM d, h:mm a') : ''}</p>
                        <p className="text-sm text-warm-700">{r.message}</p>
                      </div>
                    ))}
                    <textarea className="input h-24 text-sm resize-none" placeholder="Write a reply..."
                      value={replyText} onChange={e=>setReplyText(e.target.value)} />
                    <div className="flex gap-2">
                      <button onClick={handleReply} disabled={replying||!replyText.trim()} className="btn-primary text-sm py-2 px-5">
                        {replying?'Sending…':'Send reply'}
                      </button>
                      <button onClick={()=>setOpenTicket(null)} className="btn-secondary text-sm py-2 px-4">Close</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─────────────── DEMOS ─────────────── */}
        {tab === 'demos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {['new','contacted','scheduled','converted','declined'].map(s=>(
                  <Badge key={s} color={demoColor[s]||'gray'}>
                    {s} ({demos.filter(d=>d.status===s).length})
                  </Badge>
                ))}
              </div>
              <button onClick={fetchDemos} className="btn-secondary text-xs py-2 px-3">↻ Refresh</button>
            </div>

            {demosLoading ? [...Array(3)].map((_,i)=><div key={i} className="h-24 rounded-2xl animate-pulse bg-purple-50"/>)
            : demos.length === 0 ? (
              <EmptyState icon="📅" title="No demo requests yet" sub="Requests appear when companies fill in the Book Demo form on the homepage or pricing page" />
            ) : demos.map(d => (
              <div key={d.id} className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-bold text-warm-900 text-sm">{d.company_name}</p>
                      <Badge color={demoColor[d.status]||'gray'}>{d.status}</Badge>
                      {d.team_size && <Badge color="gray">{d.team_size} employees</Badge>}
                    </div>
                    <p className="text-xs text-warm-600 font-medium">{d.contact_name} · {d.email}{d.phone?` · ${d.phone}`:''}</p>
                    {d.message && <p className="text-xs text-warm-400 mt-1 line-clamp-2">{d.message}</p>}
                    {d.admin_note && (
                      <div className="mt-2 bg-primary-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-primary-700"><strong>Note:</strong> {d.admin_note}</p>
                      </div>
                    )}
                    <p className="text-xs text-warm-400 mt-1.5">{d.created_at ? format(new Date(d.created_at),'MMM d, yyyy · h:mm a') : '—'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    <a href={`mailto:${d.email}?subject=Thankeeu for Teams Demo - ${d.company_name}`}
                      className="text-xs bg-primary-50 text-primary-600 hover:bg-primary-100 px-3 py-2 rounded-xl font-semibold transition-colors">
                      📧 Email
                    </a>
                    <button onClick={()=>{setEditDemoId(editDemoId===d.id?null:d.id); setDemoNote(d.admin_note||'');}}
                      className="text-xs border border-purple-200 text-warm-600 hover:bg-warm-100 px-3 py-2 rounded-xl transition-colors">
                      ✏️ Update
                    </button>
                  </div>
                </div>
                {editDemoId===d.id && (
                  <div className="border-t border-purple-50 bg-purple-50/30 px-5 py-4 space-y-3">
                    <p className="text-xs font-semibold text-warm-600">Update status for {d.company_name}</p>
                    <div className="flex flex-wrap gap-2">
                      {['new','contacted','scheduled','converted','declined'].map(s=>(
                        <button key={s} onClick={()=>updateDemoStatus(d.id,s)}
                          className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-all capitalize ${
                            d.status===s ? 'bg-primary-500 text-white border-primary-500' : 'bg-white border-purple-200 text-warm-600 hover:bg-purple-50'
                          }`}>{s}</button>
                      ))}
                    </div>
                    <textarea className="input text-sm resize-none h-16" placeholder="Admin note (optional)"
                      value={demoNote} onChange={e=>setDemoNote(e.target.value)} />
                    <button onClick={()=>updateDemoStatus(d.id, d.status)} className="btn-primary text-xs py-2 px-4">Save note</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─────────────── VISITORS ─────────────── */}
        {tab === 'visitors' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-warm-900">Guest Visitors</h3>
                <p className="text-sm text-warm-400">People who signed cards without creating an account</p>
              </div>
              <button onClick={fetchVisitors} className="btn-secondary text-sm py-2 px-4">🔄 Refresh</button>
            </div>

            {/* Visitor stats */}
            {visitorStats && (
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-purple-100 p-4 text-center">
                  <p className="text-2xl font-bold text-warm-900">{visitorStats.total || 0}</p>
                  <p className="text-xs text-warm-400 mt-1">Total visitors</p>
                </div>
                <div className="bg-white rounded-2xl border border-purple-100 p-4 text-center">
                  <p className="text-2xl font-bold text-green-700">{visitorStats.converted || 0}</p>
                  <p className="text-xs text-warm-400 mt-1">Converted to users</p>
                </div>
                <div className="bg-white rounded-2xl border border-purple-100 p-4 text-center">
                  <p className="text-2xl font-bold text-primary-600">
                    {visitorStats.total ? Math.round(((visitorStats.converted||0) / visitorStats.total) * 100) : 0}%
                  </p>
                  <p className="text-xs text-warm-400 mt-1">Conversion rate</p>
                </div>
              </div>
            )}

            {visitorsLoading ? <div className="h-32 rounded-2xl animate-pulse bg-purple-50" />
            : visitors.length === 0 ? (
              <EmptyState icon="👤" title="No guest visitors yet" sub="Guests who sign cards without creating accounts appear here. Run database/migration_all_fixes.sql if the visitors table doesn't exist." />
            ) : (
              <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead style={{ background:'#F8F6FF' }}>
                      <tr>{['Name / Email','Card signed','Occasion','Status','Nudge emails','Joined'].map(h=>(
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-warm-500 uppercase tracking-wide">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-purple-50">
                      {visitors.map(v => (
                        <tr key={v.id} className="hover:bg-purple-50/30">
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-warm-900">{v.full_name || v.author_name || '—'}</p>
                            <p className="text-xs text-warm-400">{v.email || v.author_email}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-warm-500">/{v.card_slug || '—'}</td>
                          <td className="px-4 py-3">
                            <Badge color="purple">{(v.occasion||'—').replace('_',' ')}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge color={v.converted||v.converted_to_user ? 'green' : 'amber'}>
                              {v.converted||v.converted_to_user ? '✓ Converted' : '○ Guest'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-warm-600">{v.nudge_count || v.emails_sent || 0} / 4</td>
                          <td className="px-4 py-3 text-xs text-warm-400">
                            {v.created_at ? format(new Date(v.created_at),'MMM d, yyyy') : '—'}
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

        {/* ─────────────── BLOG ─────────────── */}
        {tab === 'pals' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { l:'Total Groups',  v: palApplications.length },
                { l:'Approved',      v: palApplications.filter(p=>p.status==='approved').length },
                { l:'Pending',       v: palApplications.filter(p=>p.status==='pending').length },
                { l:'Open Tickets',  v: palTickets.filter(t=>t.status==='open').length },
              ].map(s=>(
                <div key={s.l} className="bg-white rounded-2xl border border-purple-100 p-4">
                  <p className="text-xs text-warm-400 mb-1">{s.l}</p>
                  <p className="text-2xl font-bold text-warm-900">{s.v}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-purple-50 font-semibold text-warm-900">Pals Group Applications</div>
              {palApplications.length === 0 ? (
                <EmptyState icon="👥" title="No Pals applications yet" sub="Groups that apply for a Thankeeu Pals account will appear here." />
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-purple-50 text-xs uppercase text-warm-500">
                    <tr>{['Group','Username','Email','Size','Status','Action'].map(h=>(
                      <th key={h} className="px-4 py-3 text-left">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-purple-50">
                    {palApplications.map(p=>(
                      <tr key={p.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-warm-900">{p.group_name}</p>
                          {p.description && <p className="text-xs text-warm-400 line-clamp-1 max-w-xs">{p.description}</p>}
                        </td>
                        <td className="px-4 py-3 text-warm-600">@{p.group_username}</td>
                        <td className="px-4 py-3 text-warm-600">{p.email}</td>
                        <td className="px-4 py-3 text-warm-600">{p.group_size}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                            p.status==='approved' ? 'bg-green-100 text-green-700' :
                            p.status==='pending'  ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-600'}`}>
                            {p.status}{p.status==='approved' && !p.is_verified ? ' (unverified)' : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {p.status === 'pending' && (
                            <div className="flex gap-2">
                              <button onClick={()=>approvePal(p.id, p.group_name)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-semibold">
                                Approve
                              </button>
                              <button onClick={()=>setRejectModal(p)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-semibold">
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {palTickets.length > 0 && (
              <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-purple-50 font-semibold text-warm-900">💬 Pals Support Tickets</div>
                <div className="divide-y divide-purple-50">
                  {palTickets.map(t => (
                    <PalTicketRow key={t.id} ticket={t} onReply={replyPalTicket} />
                  ))}
                </div>
              </div>
            )}

            {/* Reject modal */}
            {rejectModal && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
                  <h3 className="font-bold text-warm-900 mb-3">Reject "{rejectModal.group_name}"</h3>
                  <textarea rows={3} className="input w-full mb-4" placeholder="Reason (will be emailed to the applicant)..."
                    value={rejectReason} onChange={e=>setRejectReason(e.target.value)} />
                  <div className="flex gap-3">
                    <button onClick={()=>{setRejectModal(null); setRejectReason('');}} className="flex-1 py-2.5 rounded-xl border border-purple-200 text-sm font-semibold text-warm-600">Cancel</button>
                    <button onClick={rejectPal} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold">Reject & notify</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

                {tab === 'vendors' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { l:'Total Vendors',   v: vendors.length },
                { l:'Approved',        v: vendors.filter(v=>v.status==='approved').length },
                { l:'Pending Review',  v: vendors.filter(v=>v.status==='pending').length },
                { l:'Gift Orders',     v: vendorOrders.length },
              ].map(s=>(
                <div key={s.l} className="bg-white rounded-2xl border border-purple-100 p-4">
                  <p className="text-xs text-warm-400 mb-1">{s.l}</p>
                  <p className="text-2xl font-bold text-warm-900">{s.v}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-purple-50 font-semibold text-warm-900">Vendors</div>
              <table className="w-full text-sm">
                <thead className="bg-purple-50 text-xs uppercase text-warm-500">
                  <tr>
                    {['Store','Category','Status','Verified','Action'].map(h=>(
                      <th key={h} className="px-4 py-3 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50">
                  {vendors.map(v=>(
                    <tr key={v.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-warm-900">{v.business_name}</p>
                        <p className="text-xs text-warm-400">{v.email}</p>
                      </td>
                      <td className="px-4 py-3 capitalize text-warm-600">{v.category}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                          v.status==='approved' ? 'bg-green-100 text-green-700' :
                          v.status==='pending'  ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-600'}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {v.is_verified
                          ? <span className="text-xs font-semibold text-green-600 flex items-center gap-1">✅ Verified</span>
                          : <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">⏳ Unverified</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {/* Verify & Activate — shown if not yet verified OR not approved */}
                          {(!v.is_verified || v.status !== 'approved') && (
                            <button onClick={async () => {
                              const base = import.meta.env.VITE_API_URL||'/api';
                              const hdr  = {'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('thankeeu_token')}`};
                              try {
                                const r = await fetch(`${base}/vendor/admin/vendors/${v.id}/verify-activate`, { method:'POST', headers: hdr });
                                const d = await r.json();
                                if (!r.ok) throw new Error(d.error);
                                toast.success(d.message);
                                fetchVendors();
                              } catch(e) { toast.error(e.message); }
                            }} className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-semibold border border-green-200">
                              ✅ Verify &amp; Activate
                            </button>
                          )}

                          {/* Resend verification — only if not yet verified */}
                          {!v.is_verified && (
                            <button onClick={async () => {
                              const base = import.meta.env.VITE_API_URL||'/api';
                              const hdr  = {'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('thankeeu_token')}`};
                              try {
                                const r = await fetch(`${base}/vendor/admin/vendors/${v.id}/resend-verify`, { method:'POST', headers: hdr });
                                const d = await r.json();
                                if (!r.ok) throw new Error(d.error);
                                toast.success(d.message);
                              } catch(e) { toast.error(e.message); }
                            }} className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold border border-amber-200">
                              📧 Resend link
                            </button>
                          )}

                          {/* Suspend if currently approved */}
                          {v.status === 'approved' && (
                            <button onClick={async () => {
                              const base = import.meta.env.VITE_API_URL||'/api';
                              const hdr  = {'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('thankeeu_token')}`};
                              try {
                                await fetch(`${base}/vendor/admin/vendors/${v.id}/status`, { method:'PUT', headers: hdr, body: JSON.stringify({status:'suspended'}) });
                                fetchVendors(); toast.success('Vendor suspended');
                              } catch(e) { toast.error(e.message); }
                            }} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-semibold border border-red-200">
                              Suspend
                            </button>
                          )}

                          <a href={`/c/${v.slug}`} target="_blank" rel="noopener noreferrer"
                            className="text-xs px-3 py-1.5 rounded-lg bg-purple-50 text-primary-600 hover:bg-purple-100 font-semibold border border-purple-200">
                            View store
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {vendorOrders.length > 0 && (
              <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-purple-50 font-semibold text-warm-900">🎂 Gift Orders via Thankeeu</div>
                <table className="w-full text-sm">
                  <thead className="bg-purple-50 text-xs uppercase text-warm-500">
                    <tr>
                      {['Order','Vendor','Customer','Total','Fee','Status'].map(h=>(
                        <th key={h} className="px-4 py-3 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-50">
                    {vendorOrders.slice(0,50).map(o=>(
                      <tr key={o.id}>
                        <td className="px-4 py-3 font-mono text-xs">#{o.id.slice(0,8).toUpperCase()}</td>
                        <td className="px-4 py-3 text-warm-700">{o.vendor_name||'—'}</td>
                        <td className="px-4 py-3">
                          <p className="text-warm-900">{o.customer_name}</p>
                          {o.card_slug && <p className="text-xs text-primary-500">Card: {o.card_slug}</p>}
                        </td>
                        <td className="px-4 py-3 font-semibold">₦{(o.total_amount||0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-pink-600 font-semibold">₦{(o.platform_fee||5000).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                            o.status==='delivered' ? 'bg-green-100 text-green-700' :
                            o.status==='shipped'   ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'}`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

                {tab === 'blog' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {['all','published','draft'].map(s=>(
                  <Badge key={s} color={s==='published'?'green':s==='draft'?'amber':'gray'}>
                    {s} ({s==='all' ? blogPosts.length : blogPosts.filter(p=>p.status===s).length})
                  </Badge>
                ))}
              </div>
              <button onClick={()=>{ setBlogEditing(null); setBlogForm({ title:'',excerpt:'',content:'',category:'General',tags:'',status:'draft',is_featured:false,cover_image:'',author_name:'Thankeeu Team' }); }}
                className="btn-primary text-sm py-2 px-4">+ New post</button>
            </div>

            {/* Blog editor */}
            {(blogEditing !== null || blogForm.title !== undefined) && (
              <div className="bg-white rounded-2xl border border-purple-100 p-6 space-y-4">
                <h3 className="font-bold text-warm-900">{blogEditing ? 'Edit post' : 'New post'}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium text-warm-500 block mb-1">Title *</label>
                    <input className="input text-sm" value={blogForm.title} onChange={e=>setBlogForm(p=>({...p,title:e.target.value}))} /></div>
                  <div><label className="text-xs font-medium text-warm-500 block mb-1">Category</label>
                    <input className="input text-sm" value={blogForm.category} onChange={e=>setBlogForm(p=>({...p,category:e.target.value}))} /></div>
                </div>
                <div><label className="text-xs font-medium text-warm-500 block mb-1">Excerpt</label>
                  <textarea className="input text-sm resize-none h-16" value={blogForm.excerpt} onChange={e=>setBlogForm(p=>({...p,excerpt:e.target.value}))} /></div>
                <div><label className="text-xs font-medium text-warm-500 block mb-1">Content (Markdown)</label>
                  <textarea className="input text-sm resize-none h-40 font-mono" value={blogForm.content} onChange={e=>setBlogForm(p=>({...p,content:e.target.value}))} /></div>
                <div className="flex items-center gap-3 flex-wrap">
                  <select className="input text-sm w-auto" value={blogForm.status} onChange={e=>setBlogForm(p=>({...p,status:e.target.value}))}>
                    <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm text-warm-700 cursor-pointer">
                    <input type="checkbox" checked={blogForm.is_featured} onChange={e=>setBlogForm(p=>({...p,is_featured:e.target.checked}))} />
                    Featured
                  </label>
                  <button onClick={saveBlogPost} disabled={blogSaving} className="btn-primary text-sm py-2 px-5">{blogSaving?'Saving…':'Save post'}</button>
                  <button onClick={()=>setBlogEditing(null)} className="btn-secondary text-sm py-2 px-4">Cancel</button>
                </div>
              </div>
            )}

            {blogLoading ? [...Array(3)].map((_,i)=><div key={i} className="h-20 rounded-2xl animate-pulse bg-purple-50"/>)
            : blogPosts.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-purple-100 flex items-center gap-4 px-5 py-4 hover:shadow-sm transition-shadow">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-warm-900 text-sm truncate">{p.title}</p>
                    {p.is_featured && <Badge color="amber">⭐ Featured</Badge>}
                    <Badge color={p.status==='published'?'green':p.status==='draft'?'amber':'gray'}>{p.status}</Badge>
                  </div>
                  <p className="text-xs text-warm-400">{p.category} · {p.created_at ? format(new Date(p.created_at),'MMM d, yyyy') : '—'}</p>
                </div>
                <button onClick={()=>{ setBlogEditing(p); setBlogForm({...p, tags: Array.isArray(p.tags)?p.tags.join(', '):p.tags||''}); }}
                  className="text-xs text-primary-500 hover:bg-primary-50 px-3 py-1.5 rounded-lg">Edit</button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Admin;
