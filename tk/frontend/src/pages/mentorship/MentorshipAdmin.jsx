import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Icon from '../../components/ui/Icon';
import { useSEO } from '../../hooks/useSEO';
import { useAuth } from '../../context/AuthContext';
import { mentorshipAPI } from '../../utils/api';

const STATUS_COLORS = {
  new: 'bg-primary-100 text-primary-700',
  contacted: 'bg-amber-100 text-amber-700',
  enrolled: 'bg-teal-100 text-teal-700',
  closed: 'bg-warm-200 text-warm-600',
  paid: 'bg-teal-100 text-teal-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-rose-100 text-rose-600',
  replied: 'bg-teal-100 text-teal-700',
};

const fmt = (n) => '₦' + Number(n || 0).toLocaleString('en-NG');
const date = (d) => d ? format(new Date(d), 'MMM d, yyyy · h:mm a') : '—';

export default function MentorshipAdmin() {
  useSEO({ title: 'Admin — Thankeeu Mentorship', noIndex: true });
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('applications');
  const [apps, setApps] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/admin/login'); return; }
    loadAll();
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [a, c, s] = await Promise.all([
        mentorshipAPI.adminApplications('all'),
        mentorshipAPI.adminContacts(),
        mentorshipAPI.adminSubscriptions(),
      ]);
      setApps(a.data.applications || []);
      setContacts(c.data.contacts || []);
      setSubs(s.data.subscriptions || []);
    } catch {
      toast.error('Could not load data');
    } finally { setLoading(false); }
  };

  const updateAppStatus = async (id, status) => {
    try {
      await mentorshipAPI.adminUpdateApplication(id, { status });
      setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      toast.success('Updated');
    } catch { toast.error('Could not update'); }
  };

  if (!user || user.role !== 'admin') return null;

  const TABS = [
    { id: 'applications', label: 'Applications', count: apps.length, icon: 'Users' },
    { id: 'subscriptions', label: 'Subscriptions', count: subs.filter(s => s.status === 'paid').length, icon: 'CreditCard' },
    { id: 'contacts', label: 'Messages', count: contacts.length, icon: 'Mail' },
  ];

  return (
    <div className="min-h-screen bg-warm-50">
      <header className="bg-white border-b border-primary-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white">
              <Icon name="GraduationCap" size={19} />
            </span>
            <span className="font-display font-extrabold text-warm-900">Mentorship Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadAll} className="p-2 rounded-lg text-warm-500 hover:bg-primary-50" title="Refresh">
              <Icon name="RefreshCw" size={18} />
            </button>
            <button onClick={() => { logout(); navigate('/admin/login'); }}
              className="px-3 py-2 rounded-lg text-sm font-bold text-warm-600 hover:bg-primary-50 inline-flex items-center gap-1.5">
              <Icon name="LogOut" size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap inline-flex items-center gap-2 ${tab === t.id ? 'bg-primary-500 text-white' : 'bg-white text-warm-600 border border-primary-100'}`}>
              <Icon name={t.icon} size={16} /> {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-white/25' : 'bg-primary-100 text-primary-600'}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20"><Icon name="Loader" size={32} className="animate-spin text-primary-500 mx-auto" /></div>
        ) : (
          <>
            {tab === 'applications' && (
              <div className="space-y-3">
                {apps.length === 0 && <Empty label="No applications yet" />}
                {apps.map(a => (
                  <div key={a.id} className="bg-white rounded-2xl border border-primary-100 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-bold text-warm-900">{a.parent_name}</h3>
                        <p className="text-sm text-warm-500">{a.parent_email} · {a.parent_phone}</p>
                        <p className="text-sm text-warm-500">Child class: <span className="font-semibold text-warm-700">{a.child_class}</span></p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[a.status] || 'bg-warm-100'}`}>{a.status}</span>
                        <p className="text-xs text-warm-400 mt-1">{date(a.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(a.career_paths || []).map(p => (
                        <span key={p} className="text-xs px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 font-semibold">{p}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['new', 'contacted', 'enrolled', 'closed'].map(s => (
                        <button key={s} onClick={() => updateAppStatus(a.id, s)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold border ${a.status === s ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-primary-100 text-warm-500 hover:bg-primary-50'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'subscriptions' && (
              <div className="bg-white rounded-2xl border border-primary-100 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-primary-50/50 text-left text-xs text-warm-500">
                    <tr>
                      <th className="px-4 py-3">Parent</th><th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Plan</th><th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subs.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-warm-400">No subscriptions yet</td></tr>}
                    {subs.map(s => (
                      <tr key={s.id} className="border-t border-primary-50">
                        <td className="px-4 py-3 font-semibold text-warm-800">{s.parent_name || '—'}</td>
                        <td className="px-4 py-3 text-warm-500">{s.parent_email}</td>
                        <td className="px-4 py-3 capitalize">{s.plan}</td>
                        <td className="px-4 py-3">{fmt(s.amount_ngn)}</td>
                        <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status] || 'bg-warm-100'}`}>{s.status}</span></td>
                        <td className="px-4 py-3 text-warm-400 text-xs">{date(s.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'contacts' && (
              <div className="space-y-3">
                {contacts.length === 0 && <Empty label="No messages yet" />}
                {contacts.map(c => (
                  <div key={c.id} className="bg-white rounded-2xl border border-primary-100 p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-bold text-warm-900">{c.name}</h3>
                        <p className="text-sm text-warm-500">{c.email}{c.phone ? ` · ${c.phone}` : ''}</p>
                      </div>
                      <p className="text-xs text-warm-400">{date(c.created_at)}</p>
                    </div>
                    <p className="text-warm-600 text-sm leading-relaxed">{c.message}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Empty({ label }) {
  return (
    <div className="text-center py-20 text-warm-400">
      <Icon name="Mail" size={32} className="mx-auto mb-2 opacity-50" />
      <p>{label}</p>
    </div>
  );
}
