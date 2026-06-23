import { format } from 'date-fns';
import { useSEO } from '../hooks/useSEO';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI, adminCompanyAPI, adminSupportAPI, demoAPI, blogAPI } from '../utils/api';
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

// ── Users Tab (extracted as a proper component to satisfy Rules of Hooks) ─────
const UsersTab = ({ users, setUsers }) => {
  const [giftTarget, setGiftTarget] = React.useState(null);
  const [giftAmount, setGiftAmount] = React.useState('');
  const [giftReason, setGiftReason] = React.useState('');
  const [gifting,    setGifting]    = React.useState(false);

  const openGift  = (u) => { setGiftTarget(u); setGiftAmount(''); setGiftReason(''); };
  const closeGift = ()  => { setGiftTarget(null); };
  const submitGift = async () => {
    const n = parseInt(giftAmount, 10);
    if (!n || n < 1) return toast.error('Enter a valid number of credits');
    setGifting(true);
    try {
      const res = await adminAPI.giftCredits(giftTarget.id, n, giftReason || undefined);
      toast.success(`✅ Gifted ${n} credit${n > 1 ? 's' : ''} to ${giftTarget.full_name}. New balance: ${res.data.new_balance}`);
      setUsers(prev => prev.map(u => u.id === giftTarget.id
        ? { ...u, credits_remaining: res.data.new_balance }
        : u
      ));
      closeGift();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to gift credits');
    } finally { setGifting(false); }
  };

  return (
    <>
      {/* Gift Credits Modal */}
      {giftTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="bg-white rounded-3xl shadow-2xl border border-purple-100 w-full max-w-sm p-6">
            <h3 className="font-bold text-warm-900 text-lg mb-1">Gift Credits</h3>
            <p className="text-sm text-warm-500 mb-4">
              To <strong>{giftTarget.full_name}</strong> ({giftTarget.email})<br/>
              Current balance: <strong className="text-primary-600">{giftTarget.credits_remaining} credit{giftTarget.credits_remaining !== 1 ? 's' : ''}</strong>
            </p>
            <label className="block text-xs font-bold text-warm-600 mb-1">Number of credits to gift</label>
            <input
              type="number" min="1" max="1000"
              value={giftAmount}
              onChange={e => setGiftAmount(e.target.value)}
              placeholder="e.g. 5"
              className="w-full border border-purple-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary-300"
              style={{ background: '#fff', color: '#1a1a2e' }}
            />
            <label className="block text-xs font-bold text-warm-600 mb-1">Reason (optional)</label>
            <input
              type="text"
              value={giftReason}
              onChange={e => setGiftReason(e.target.value)}
              placeholder="e.g. Promo, refund, goodwill..."
              className="w-full border border-purple-200 rounded-xl px-4 py-2.5 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-primary-300"
              style={{ background: '#fff', color: '#1a1a2e' }}
            />
            <div className="flex gap-2">
              <button onClick={closeGift} className="flex-1 py-2.5 rounded-xl border border-purple-200 text-sm font-semibold text-warm-600 hover:bg-purple-50">Cancel</button>
              <button onClick={submitGift} disabled={gifting}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: gifting ? '#C4B5FD' : 'linear-gradient(135deg,#7C3AED,#A855F7)' }}>
                {gifting ? 'Gifting…' : `Gift ${giftAmount || '—'} credit${parseInt(giftAmount) === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background:'#F8F6FF' }}>
              <tr>{['Name','Email','Role','Credits','Signed up','Actions'].map(h=>(
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
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.credits_remaining > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-warm-50 text-warm-400'}`}>
                      {u.credits_remaining} credit{u.credits_remaining !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-warm-400">{u.created_at ? format(new Date(u.created_at),'MMM d, yyyy') : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      <button onClick={() => openGift(u)}
                        className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-100 font-semibold">
                        🎁 Gift credits
                      </button>
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
    </>
  );
};

// ── Admin component ───────────────────────────────────────────────────────────
const Admin = () => {
  useSEO({ title: 'Admin Panel — Thankeeu', noIndex: true });

  const { user } = useAuth();
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Core data
  const [stats, setStats]               = useState({});
  const [users, setUsers]               = useState([]);
  const [cards, setCards]               = useState([]);
  const [redeliveringId, setRedeliveringId] = useState(null);

  // Lazy-loaded tabs
  const [companies, setCompanies]       = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
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
  const [nudging, setNudging] = useState(false);
  const [visitorStats, setVisitorStats] = useState(null);
  const [analytics, setAnalytics]       = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsDays, setAnalyticsDays] = useState(30);

  const [blogPosts, setBlogPosts]       = useState([]);
  const [blogLoading, setBlogLoading]   = useState(false);
  const [blogEditing, setBlogEditing]   = useState(null);

  const [vendors,          setVendors]          = useState([]);
  const [vendorOrders,     setVendorOrders]     = useState([]);
  const [vendorsLoading,   setVendorsLoading]   = useState(false);
  const [palApplications,  setPalApplications]  = useState([]);
  const [palLoading,       setPalLoading]        = useState(false);
  const [palTickets,       setPalTickets]        = useState([]);
  const [rejectModal,      setRejectModal]       = useState(null);
  const [rejectReason,     setRejectReason]      = useState('');
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
    if (tab === 'analytics' && !analytics) fetchAnalytics();
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
      const statsData = statsRes.data || {};
      setStats(statsData.stats || statsData); // support both {stats:{...}} and flat shape
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
    setCompaniesLoading(true);
    try { const r = await adminCompanyAPI.getAll(); setCompanies(r.data || []); }
    catch { toast.error('Failed to load companies'); }
    finally { setCompaniesLoading(false); }
  };

  const fetchDemos = async () => {
    setDemosLoading(true);
    try { const r = await demoAPI.getAll(); setDemos(Array.isArray(r.data) ? r.data : []); }
    catch (err) { toast.error('Failed to load demos'); setDemos([]); }
    finally { setDemosLoading(false); }
  };

  const fetchAnalytics = async (days = analyticsDays) => {
    setAnalyticsLoading(true);
    try {
      const base = import.meta.env.VITE_API_URL || '/api';
      const tok  = localStorage.getItem('thankeeu_token') || '';
      const r = await fetch(`${base}/analytics/dashboard?days=${days}`, { headers: { Authorization: `Bearer ${tok}` } });
      const d = await r.json();
      setAnalytics(d);
    } catch { toast.error('Failed to load analytics'); }
    finally { setAnalyticsLoading(false); }
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

  const sendNudge = async () => {
    if (!confirm('Send nudge emails to all eligible unconverted visitors now? This sends to visitors not nudged in 7 days and under 4 emails total.')) return;
    setNudging(true);
    try {
      const base = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${base}/admin/visitors/nudge`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('thankeeu_token')}` },
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed');
      toast.success(d.message || 'Nudge emails sent!');
      fetchVisitors(); // refresh visitor counts
    } catch (err) {
      toast.error(err.message || 'Nudge failed');
    } finally { setNudging(false); }
  };

  const fetchPals = async () => {
    setPalLoading(true);
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
    finally { setPalLoading(false); }
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
    setVendorsLoading(true);
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
    finally { setVendorsLoading(false); }
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
    { id:'overview',  label:'Overview' },
    { id:'users',     label:`Users (${users.length})` },
    { id:'cards',     label:`Cards (${cards.length})` },
    { id:'companies', label:'Companies' },
    { id:'support',   label:`Support${openTickets.length ? ` · ${openTickets.length}` : ''}` },
    { id:'demos',     label:`Demos${newDemos.length ? ` · ${newDemos.length} new` : ''}` },
    { id:'analytics', label:'📊 Analytics' },
    { id:'visitors',  label:`Visitors${visitors.length ? ` (${visitors.length})` : ''}` },
    { id:'blog',      label:'Blog' },
    { id:'vendors',   label:'Vendors' },
    { id:'pals',      label:`Pals${palApplications.filter(p=>p.status==='pending').length ? ` · ${palApplications.filter(p=>p.status==='pending').length} new` : ''}` },
  ];

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#0F0B1E', color:'#fff', fontFamily:'inherit' }}>

      {/* ── DESKTOP SIDEBAR — always visible on lg+ ── */}
      <aside className="hidden lg:flex" style={{
        width:240, flexShrink:0,
        background:'linear-gradient(180deg,#1A1030 0%,#110820 100%)',
        borderRight:'1px solid rgba(139,92,246,0.15)',
        flexDirection:'column',
        position:'sticky', top:0, height:'100vh',
        overflowX:'hidden', overflowY:'auto', zIndex:50,
      }}>
        {/* Logo */}
        <div style={{ padding:'22px 14px 18px', display:'flex', alignItems:'center', gap:11, borderBottom:'1px solid rgba(139,92,246,0.12)', minHeight:72 }}>
          <img src="/android-chrome-192x192.png" alt="Thankeeu" style={{ width:36, height:36, borderRadius:9, flexShrink:0, objectFit:'cover' }} />
          <div style={{ overflow:'hidden', whiteSpace:'nowrap' }}>
            <p style={{ fontWeight:800, fontSize:15, margin:0, background:'linear-gradient(90deg,#A78BFA,#F472B6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Thankeeu</p>
            <p style={{ fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:'0.12em', textTransform:'uppercase', margin:0 }}>Admin Panel</p>
          </div>
        </div>
        <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto', overflowX:'hidden' }}>
          {[
            { id:'overview',  icon:'⚡', label:'Overview',      badge:null },
            { id:'analytics', icon:'📊', label:'Analytics',     badge:null },
            { id:'users',     icon:'👥', label:'Users',         badge:users.length||null },
            { id:'cards',     icon:'🃏', label:'Cards',         badge:cards.length||null },
            { id:'companies', icon:'🏢', label:'Companies',     badge:null },
            { id:'support',   icon:'🎧', label:'Support',       badge:openTickets.length||null },
            { id:'demos',     icon:'🚀', label:'Demo Requests', badge:newDemos.length||null },
            { id:'visitors',  icon:'👣', label:'Visitors',      badge:visitors.length||null },
            { id:'blog',      icon:'✍️', label:'Blog',          badge:null },
            { id:'vendors',   icon:'🏪', label:'Vendors',       badge:null },
            { id:'pals',      icon:'🤝', label:'Pals',          badge:palApplications.filter(p=>p.status==='pending').length||null },
          ].map(item => {
            const active = tab === item.id;
            const isAlert = (item.id==='support'||item.id==='demos') && item.badge > 0;
            return (
              <button key={item.id} onClick={() => setTab(item.id)}
                style={{
                  width:'100%', display:'flex', alignItems:'center', gap:10,
                  padding:'9px 12px', borderRadius:10, border:'none', cursor:'pointer', marginBottom:2,
                  background: active ? 'rgba(124,58,237,0.25)' : 'transparent',
                  color: active ? '#C4B5FD' : 'rgba(255,255,255,0.45)',
                  boxShadow: active ? 'inset 0 0 0 1px rgba(139,92,246,0.3)' : 'none',
                  transition:'all .12s', textAlign:'left', position:'relative',
                }}>
                {active && <div style={{ position:'absolute', left:0, top:'18%', bottom:'18%', width:3, borderRadius:'0 3px 3px 0', background:'linear-gradient(180deg,#7C3AED,#EC4899)' }} />}
                <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
                <span style={{ fontSize:13, fontWeight:active?700:500, flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.label}</span>
                {item.badge > 0 && <span style={{ background:isAlert?'#EF4444':'rgba(139,92,246,0.55)', color:'#fff', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:20, flexShrink:0 }}>{item.badge}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── MOBILE/TABLET SIDEBAR — hamburger drawer on < lg ── */}
      {mobileSidebarOpen && (
        <div onClick={() => setMobileSidebarOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:49, backdropFilter:'blur(2px)' }}
          className="lg:hidden" />
      )}
      <aside className="lg:hidden" style={{
        position:'fixed', top:0, left: mobileSidebarOpen ? 0 : '-280px',
        width:260, height:'100vh', zIndex:50,
        background:'linear-gradient(180deg,#1A1030 0%,#110820 100%)',
        borderRight:'1px solid rgba(139,92,246,0.15)',
        display:'flex', flexDirection:'column',
        transition:'left .28s cubic-bezier(.4,0,.2,1)',
        overflowX:'hidden', overflowY:'auto',
      }}>
        <div style={{ padding:'22px 14px 18px', display:'flex', alignItems:'center', gap:11, borderBottom:'1px solid rgba(139,92,246,0.12)' }}>
          <img src="/android-chrome-192x192.png" alt="Thankeeu" style={{ width:36, height:36, borderRadius:9, flexShrink:0, objectFit:'cover' }} />
          <div>
            <p style={{ fontWeight:800, fontSize:15, margin:0, background:'linear-gradient(90deg,#A78BFA,#F472B6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Thankeeu</p>
            <p style={{ fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:'0.12em', textTransform:'uppercase', margin:0 }}>Admin Panel</p>
          </div>
          <button onClick={() => setMobileSidebarOpen(false)} style={{ marginLeft:'auto', background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:20, cursor:'pointer', padding:4 }}>✕</button>
        </div>
        <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
          {[
            { id:'overview',  icon:'⚡', label:'Overview',      badge:null },
            { id:'analytics', icon:'📊', label:'Analytics',     badge:null },
            { id:'users',     icon:'👥', label:'Users',         badge:users.length||null },
            { id:'cards',     icon:'🃏', label:'Cards',         badge:cards.length||null },
            { id:'companies', icon:'🏢', label:'Companies',     badge:null },
            { id:'support',   icon:'🎧', label:'Support',       badge:openTickets.length||null },
            { id:'demos',     icon:'🚀', label:'Demo Requests', badge:newDemos.length||null },
            { id:'visitors',  icon:'👣', label:'Visitors',      badge:visitors.length||null },
            { id:'blog',      icon:'✍️', label:'Blog',          badge:null },
            { id:'vendors',   icon:'🏪', label:'Vendors',       badge:null },
            { id:'pals',      icon:'🤝', label:'Pals',          badge:palApplications.filter(p=>p.status==='pending').length||null },
          ].map(item => {
            const active = tab === item.id;
            const isAlert = (item.id==='support'||item.id==='demos') && item.badge > 0;
            return (
              <button key={item.id} onClick={() => { setTab(item.id); setMobileSidebarOpen(false); }}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, border:'none', cursor:'pointer', marginBottom:2, background:active?'rgba(124,58,237,0.25)':'transparent', color:active?'#C4B5FD':'rgba(255,255,255,0.55)', textAlign:'left', position:'relative' }}>
                {active && <div style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:3, borderRadius:'0 3px 3px 0', background:'linear-gradient(180deg,#7C3AED,#EC4899)' }} />}
                <span style={{ fontSize:16 }}>{item.icon}</span>
                <span style={{ fontSize:13, fontWeight:active?700:500, flex:1 }}>{item.label}</span>
                {item.badge > 0 && <span style={{ background:isAlert?'#EF4444':'rgba(139,92,246,0.55)', color:'#fff', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:20 }}>{item.badge}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* MAIN */}
      <main style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', background:'linear-gradient(160deg,#F8F5FF 0%,#FDFCFF 100%)' }}>

        {/* Mobile/tablet topbar — hamburger, hidden on desktop */}
        <div className="lg:hidden" style={{ padding:'12px 16px', borderBottom:'1px solid #EDE9FF', background:'rgba(255,255,255,0.98)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:30 }}>
          <button onClick={() => setMobileSidebarOpen(true)} style={{ width:40, height:40, borderRadius:10, border:'none', background:'linear-gradient(135deg,#7C3AED,#EC4899)', color:'white', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>☰</button>
          <span style={{ fontWeight:800, fontSize:15, color:'#1a1a2e' }}>Admin Panel</span>
          <button onClick={fetchCore} style={{ width:40, height:40, borderRadius:10, border:'1px solid #DDD6FE', background:'white', color:'#7C3AED', fontSize:16, cursor:'pointer' }}>↻</button>
        </div>

        {/* Desktop topbar — tab title + actions, hidden on mobile/tablet */}
        <div className="hidden lg:flex" style={{ padding:'14px 28px', borderBottom:'1px solid #EDE9FF', background:'rgba(255,255,255,0.96)', backdropFilter:'blur(8px)', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:30 }}>
          <div>
            <h1 style={{ margin:0, fontSize:19, fontWeight:800, color:'#1a1a2e' }}>
              {({'overview':'Overview','analytics':'Analytics','users':'Users','cards':'Cards','companies':'Companies','support':'Support','demos':'Demo Requests','visitors':'Visitors','blog':'Blog','vendors':'Vendors','pals':'Pals'})[tab] || tab}
            </h1>
            <p style={{ margin:'2px 0 0', fontSize:11, color:'#9CA3AF' }}>Signed in as {user?.full_name}</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={fetchCore} style={{ padding:'8px 14px', borderRadius:10, border:'1px solid #DDD6FE', background:'white', color:'#7C3AED', fontSize:12, fontWeight:700, cursor:'pointer' }}>↻ Refresh</button>
            <button onClick={() => { localStorage.removeItem('thankeeu_token'); localStorage.removeItem('thankeeu_user'); window.location.href='/admin/login'; }}
              style={{ padding:'8px 14px', borderRadius:10, border:'none', background:'#FEE2E2', color:'#DC2626', fontSize:12, fontWeight:700, cursor:'pointer' }}>Sign out</button>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ padding:'10px 16px', background:'white', borderBottom:'1px solid #F3EEFF', display:'flex', gap:10, overflowX:'auto' }} className='md:flex-wrap md:px-28'>
          {[
            { icon:'👥', val:(stats.total_users||0).toLocaleString(),        label:'Users',       color:'#7C3AED' },
            { icon:'🃏', val:(stats.total_cards||0).toLocaleString(),        label:'Cards',       color:'#2563EB' },
            { icon:'✅', val:(stats.sent_cards||0).toLocaleString(),         label:'Sent',        color:'#059669' },
            { icon:'✍️', val:(stats.total_messages||0).toLocaleString(),     label:'Messages',    color:'#0891B2' },
            { icon:'💰', val:formatNGN(stats.total_gift_volume||0),          label:'Gift volume', color:'#D97706' },
          ].map(s => (
            <div key={s.label} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderRadius:12, background:'#FAFAFF', border:'1px solid #EDE9FF', flex:'1 1 140px' }}>
              <span style={{ fontSize:20 }}>{s.icon}</span>
              <div>
                <p style={{ margin:0, fontSize:17, fontWeight:800, color:s.color, lineHeight:1 }}>{s.val}</p>
                <p style={{ margin:0, fontSize:11, color:'#9CA3AF', marginTop:1 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex:1, padding:'16px', overflowY:'auto' }} className="admin-content md:p-7">
          <style>{`
            .admin-content .input{background:white;border:1px solid #DDD6FE;border-radius:10px;padding:8px 12px;font-size:14px;outline:none;width:100%;color:#1a1a2e;}
            .admin-content .input:focus{border-color:#7C3AED;box-shadow:0 0 0 3px rgba(124,58,237,0.1);}
            .admin-content .btn-secondary{background:white;border:1px solid #DDD6FE;border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;color:#6D28D9;cursor:pointer;}
            .admin-content .btn-secondary:hover{background:#F5F3FF;}
            .admin-content table{width:100%;border-collapse:collapse;}
            .admin-content th{text-align:left;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.08em;padding:10px 14px;border-bottom:2px solid #F3EEFF;background:white;}
            .admin-content td{padding:11px 14px;border-bottom:1px solid #F9F7FF;font-size:13px;color:#374151;vertical-align:middle;}
            .admin-content tr:hover td{background:#FDFCFF;}
            .admin-content .card-box{background:white;border-radius:16px;border:1px solid #EDE9FF;overflow:hidden;margin-bottom:20px;}
            .admin-content h2{font-size:18px;font-weight:800;color:#1a1a2e;margin:0 0 16px;}
            .admin-content h3{font-size:15px;font-weight:700;color:#1a1a2e;margin:0 0 12px;}
            .admin-content .bg-white{background:white;}
            .admin-content .rounded-2xl{border-radius:16px;}
            .admin-content .border{border:1px solid #EDE9FF;}
            .admin-content .border-warm-100{border-color:#EDE9FF;}
            .admin-content .p-5{padding:20px;}
            .admin-content .space-y-6>*+*{margin-top:24px;}
            .admin-content .space-y-4>*+*{margin-top:16px;}
            .admin-content .space-y-3>*+*{margin-top:12px;}
            .admin-content .space-y-2>*+*{margin-top:8px;}
            .admin-content .text-warm-900{color:#1a1a2e;}
            .admin-content .text-warm-700{color:#374151;}
            .admin-content .text-warm-500{color:#6B7280;}
            .admin-content .text-warm-400{color:#9CA3AF;}
          `}</style>
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
        {tab === 'users' && <UsersTab users={users} setUsers={setUsers} />}

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
                      <td className="px-4 py-3">
                        <Badge color={c.status==='sent'?'green':c.status==='active'?'blue':'gray'}>{c.status}</Badge>
                        {c.redelivery_count > 0 && (
                          <span className="ml-1.5 text-[10px] font-semibold text-warm-400" title={c.last_redelivered_at ? `Last re-delivered ${format(new Date(c.last_redelivered_at), 'MMM d, h:mma')}` : undefined}>
                            ↻{c.redelivery_count}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-green-700">{c.total_collected ? formatNGN(c.total_collected) : '—'}</td>
                      <td className="px-4 py-3 text-xs text-warm-400">{c.created_at ? format(new Date(c.created_at),'MMM d') : '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {c.status === 'sent' && (
                          <button
                            disabled={redeliveringId === c.id}
                            title="Re-deliver to recipient with any new signatures & gifts"
                            onClick={async () => {
                              if (!confirm(`Re-deliver "${c.title || `For ${c.recipient_name}`}" to ${c.recipient_email || 'the recipient'}?\n\nThis sends a fresh email including any new signatures and gift money that came in since the last delivery.`)) return;
                              setRedeliveringId(c.id);
                              try {
                                const res = await adminAPI.redeliverCard(c.id);
                                const { new_messages = 0, new_gift_amount = 0, redelivery_count, last_redelivered_at } = res.data || {};
                                setCards(prev => prev.map(x => x.id === c.id ? { ...x, redelivery_count, last_redelivered_at } : x));
                                const extras = [];
                                if (new_messages) extras.push(`${new_messages} new message${new_messages===1?'':'s'}`);
                                if (new_gift_amount) extras.push(`${formatNGN(new_gift_amount)} in new gifts`);
                                toast.success(extras.length ? `Re-delivered — included ${extras.join(' & ')}` : 'Re-delivered to recipient');
                              } catch (err) {
                                toast.error(err.response?.data?.error || 'Could not re-deliver this card');
                              } finally {
                                setRedeliveringId(null);
                              }
                            }}
                            className="text-xs text-primary-600 hover:bg-primary-50 px-2 py-1 rounded-lg disabled:opacity-40 mr-1"
                          >
                            {redeliveringId === c.id ? '…' : '🔁'}
                          </button>
                        )}
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

                    {/* ── Delete Company ───────────────────────────────── */}
                    <div className="bg-white border border-red-100 rounded-xl p-4">
                      <p className="text-xs font-bold text-red-700 mb-1">🗑️ Delete company account</p>
                      <p className="text-xs text-warm-400 mb-3">
                        Permanently deletes the company and ALL associated data — team members,
                        cards, occasions, subscriptions, HRIS connections. This cannot be undone.
                        HR can then re-register with the same email without duplicate issues.
                      </p>
                      <button
                        onClick={async () => {
                          const confirm1 = window.confirm(`⚠️ Delete "${co.name}"?\n\nThis will permanently remove:\n• All team members\n• All cards and messages\n• All occasion settings\n• All subscriptions and HRIS connections\n\nHR can re-register afterwards with the same email.\n\nType the company name to confirm in the next prompt.`);
                          if (!confirm1) return;
                          const typed = window.prompt(`Type the company name exactly to confirm deletion:\n\n"${co.name}"`);
                          if (typed !== co.name) { toast.error('Company name did not match — deletion cancelled.'); return; }
                          try {
                            const r = await fetch(`${import.meta.env.VITE_API_URL||'/api'}/admin/companies/${co.id}`, {
                              method: 'DELETE',
                              headers: { Authorization: `Bearer ${localStorage.getItem('thankeeu_token')}` },
                            });
                            const d = await r.json();
                            if (!r.ok) throw new Error(d.error);
                            toast.success(d.message);
                            setCompanies(prev => prev.filter(c => c.id !== co.id));
                            setOpenCompany(null);
                          } catch(e) { toast.error(e.message || 'Failed to delete company'); }
                        }}
                        className="text-xs font-bold bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">
                        🗑️ Delete company &amp; all data
                      </button>
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
        {tab === 'analytics' && (
          <div className="space-y-6">
            {/* Header + range picker */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-warm-900">Website Analytics</h2>
                <p className="text-sm text-warm-400">Page views and unique visitors to thankeeu.com</p>
              </div>
              <div className="flex gap-2">
                {[7,14,30,90].map(d => (
                  <button key={d}
                    onClick={() => { setAnalyticsDays(d); setAnalytics(null); fetchAnalytics(d); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${analyticsDays===d ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-warm-600 border-warm-200 hover:border-primary-300'}`}>
                    {d}d
                  </button>
                ))}
                <button onClick={() => fetchAnalytics(analyticsDays)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border bg-white text-warm-600 border-warm-200 hover:border-primary-300 transition-colors">
                  ↻ Refresh
                </button>
              </div>
            </div>

            {analyticsLoading && <div className="text-center py-16 text-warm-400">Loading analytics…</div>}

            {analytics && !analyticsLoading && (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[
                    { label: 'Today views',      val: analytics.summary.todayViews,    color: 'text-blue-600',   bg: 'bg-blue-50' },
                    { label: 'Today visitors',   val: analytics.summary.todayUnique,   color: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: 'Yesterday views',  val: analytics.summary.yesterdayViews,color: 'text-warm-600',   bg: 'bg-warm-50' },
                    { label: `${analyticsDays}d views`,  val: analytics.summary.totalViews,    color: 'text-emerald-600',bg: 'bg-emerald-50' },
                    { label: `${analyticsDays}d visitors`,val: analytics.summary.totalUnique,   color: 'text-pink-600',   bg: 'bg-pink-50' },
                  ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
                      <p className={`text-2xl font-extrabold ${s.color}`}>{s.val?.toLocaleString()}</p>
                      <p className="text-xs text-warm-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Daily bar chart — pure CSS/HTML, no library needed */}
                <div className="bg-white rounded-2xl border border-warm-100 p-5">
                  <h3 className="text-sm font-bold text-warm-700 mb-4">Daily Unique Visitors</h3>
                  <div className="overflow-x-auto">
                    <div style={{ minWidth: Math.max(600, analytics.chartData.length * 26), height: 160 }}
                      className="flex items-end gap-1 pb-6 relative">
                      {/* Y-axis guide lines */}
                      {[25,50,75,100].map(pct => {
                        const maxVal = Math.max(1, ...analytics.chartData.map(d => d.unique));
                        const lineVal = Math.round(maxVal * pct / 100);
                        return (
                          <div key={pct} className="absolute left-0 right-0 border-t border-warm-100 text-[9px] text-warm-300"
                            style={{ bottom: `${pct}%` }}>
                            <span className="pl-1">{lineVal}</span>
                          </div>
                        );
                      })}
                      {analytics.chartData.map((d, i) => {
                        const maxVal = Math.max(1, ...analytics.chartData.map(x => x.unique));
                        const heightPct = (d.unique / maxVal) * 100;
                        const isToday = d.day === new Date().toISOString().split('T')[0];
                        return (
                          <div key={i} className="flex flex-col items-center flex-1 group relative">
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10">
                              <div className="bg-warm-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap">
                                {d.label}: {d.unique} visitors / {d.views} views
                              </div>
                            </div>
                            {/* Bar */}
                            <div className={`w-full rounded-t-sm transition-all ${isToday ? 'bg-primary-500' : 'bg-primary-200 group-hover:bg-primary-400'}`}
                              style={{ height: `${Math.max(2, heightPct)}%` }} />
                            {/* Label — show every nth */}
                            {(i % Math.ceil(analytics.chartData.length / 10) === 0 || isToday) && (
                              <span className={`text-[8px] mt-1 rotate-45 origin-left whitespace-nowrap ${isToday ? 'text-primary-600 font-bold' : 'text-warm-400'}`}>
                                {isToday ? 'Today' : d.label}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Views vs Visitors legend */}
                  <div className="flex gap-4 mt-2 text-xs text-warm-500">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary-500 inline-block" /> Unique visitors (blue)</span>
                    <span className="text-warm-300">Hover bars for full data</span>
                  </div>
                </div>

                {/* Top pages + Top countries side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Top pages */}
                  <div className="bg-white rounded-2xl border border-warm-100 p-5">
                    <h3 className="text-sm font-bold text-warm-700 mb-4">Top Pages</h3>
                    <div className="space-y-2">
                      {analytics.topPages.map((p, i) => {
                        const maxCount = analytics.topPages[0]?.count || 1;
                        const pct = Math.round((p.count / maxCount) * 100);
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-xs text-warm-400 w-5 text-right">{i+1}.</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-xs font-medium text-warm-700 truncate">{p.path || '/'}</span>
                                <span className="text-xs font-bold text-warm-900 ml-2 flex-shrink-0">{p.count.toLocaleString()}</span>
                              </div>
                              <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary-400 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {analytics.topPages.length === 0 && (
                        <p className="text-sm text-warm-400 text-center py-4">No data yet — deploy the tracker first.</p>
                      )}
                    </div>
                  </div>

                  {/* Top countries */}
                  <div className="bg-white rounded-2xl border border-warm-100 p-5">
                    <h3 className="text-sm font-bold text-warm-700 mb-4">🌍 Top Countries</h3>
                    <div className="space-y-2">
                      {(analytics.topCountries || []).map((c, i) => {
                        const maxCount = analytics.topCountries[0]?.count || 1;
                        const pct = Math.round((c.count / maxCount) * 100);
                        const flag = c.country ? String.fromCodePoint(
                          ...[...c.country.toUpperCase()].slice(0,2).map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65)
                        ) : '🌐';
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-base w-6 flex-shrink-0">{flag}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-xs font-medium text-warm-700 truncate">{c.country || 'Unknown'}</span>
                                <span className="text-xs font-bold text-warm-900 ml-2 flex-shrink-0">{c.count.toLocaleString()}</span>
                              </div>
                              <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {!(analytics.topCountries?.length) && (
                        <p className="text-sm text-warm-400 text-center py-4">Country data starts appearing after first visitors.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Avg per day */}
                <p className="text-xs text-warm-400 text-center">
                  Average {analytics.summary.avgPerDay} views/day over the last {analyticsDays} days.
                  Tracking started counting from your next deployment.
                </p>
              </>
            )}

            {!analytics && !analyticsLoading && (
              <div className="text-center py-16 text-warm-400">
                <p className="text-4xl mb-3">📊</p>
                <p className="font-medium">Click Refresh to load analytics</p>
              </div>
            )}
          </div>
        )}

        {tab === 'visitors' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-warm-900">Guest Visitors</h3>
                <p className="text-sm text-warm-400">People who signed cards without creating an account</p>
              </div>
              <div className="flex gap-2">
                <button onClick={sendNudge} disabled={nudging}
                  className="btn-secondary text-sm py-2 px-4 flex items-center gap-1.5"
                  title="Send conversion nudge emails to eligible unconverted visitors (max 4 per visitor, 7-day cooldown)">
                  {nudging ? '⏳ Sending…' : '📧 Send Nudge Emails'}
                </button>
                <button onClick={fetchVisitors} className="btn-secondary text-sm py-2 px-4">🔄 Refresh</button>
              </div>
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
      </main>
    </div>
  );
};

export default Admin;
