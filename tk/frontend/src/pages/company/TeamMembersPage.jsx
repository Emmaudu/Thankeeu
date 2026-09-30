import { useState, useEffect, useCallback } from 'react';
import CompanyLayout from '../../components/company/CompanyLayout';
import toast from 'react-hot-toast';

const BASE = import.meta.env.VITE_API_URL || '/api';
const tok  = () => localStorage.getItem('thankeeu_company_token');
const hdr  = () => ({ Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' });

const fmt = (iso) => {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return null;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
const fmtShort = (iso) => {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return null;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const EMPTY = <span className="text-warm-300 text-xs">—</span>;

const Avatar = ({ fn = '', ln = '', size = 8 }) => {
  const initials = `${fn[0] || ''}${ln[0] || ''}`.toUpperCase();
  const colors = [
    'bg-purple-100 text-purple-700','bg-pink-100 text-pink-700',
    'bg-blue-100 text-blue-700','bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700','bg-rose-100 text-rose-700',
  ];
  const color = colors[(fn.charCodeAt(0) || 0) % colors.length];
  return (
    <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${color}`}>
      {initials || '?'}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    approved:   ['bg-emerald-50 text-emerald-700 ring-emerald-200', 'Active'],
    active:     ['bg-emerald-50 text-emerald-700 ring-emerald-200', 'Active'],
    pending:    ['bg-amber-50 text-amber-700 ring-amber-200',       'Pending'],
    suspended:  ['bg-red-50 text-red-700 ring-red-200',             'Suspended'],
    deactivated:['bg-gray-100 text-gray-500 ring-gray-200',         'Deactivated'],
    rejected:   ['bg-gray-100 text-gray-500 ring-gray-200',         'Rejected'],
  };
  const [cls, label] = map[status] || ['bg-gray-100 text-gray-500 ring-gray-200', status || '—'];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${cls}`}>{label}</span>;
};

const RoleBadge = ({ role }) => {
  const v = (role || '').toLowerCase();
  if (v === 'team_leader' || v === 'leader')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-primary-100 text-primary-700 ring-1 ring-primary-200">👑 Leader</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 ring-1 ring-gray-200">👤 Member</span>;
};

const SourceBadge = ({ member }) => {
  if (member.hris_employee_id)
    return <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">HRIS</span>;
  return null;
};

const Field = ({ label, value }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider font-semibold text-warm-400 mb-0.5">{label}</p>
    <p className="text-sm text-warm-800 font-medium">{value || EMPTY}</p>
  </div>
);

export default function TeamMembersPage() {
  const [members,  setMembers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [deptF,    setDeptF]    = useState('');
  const [roleF,    setRoleF]    = useState('');
  const [expanded, setExpanded] = useState(null);
  const [editing,  setEditing]  = useState(null);
  const [editData, setEditData] = useState({});
  const [saving,   setSaving]   = useState(false);
  const [page,     setPage]     = useState(1);
  const PER_PAGE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(
        `${BASE}/teams/all-members?search=${encodeURIComponent(search)}&dept=${encodeURIComponent(deptF)}&role=${encodeURIComponent(roleF)}`,
        { headers: hdr() }
      );
      if (!r.ok) throw new Error(`${r.status}`);
      const d = await r.json();
      setMembers(Array.isArray(d) ? d : (d.members || []));
      setPage(1);
    } catch (e) {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, [search, deptF, roleF]);

  useEffect(() => { load(); }, [load]);

  const departments = [...new Set(members.map(m => m.department).filter(Boolean))].sort();

  const displayed = members.filter(m => m.status !== 'deactivated');
  const paginated = displayed.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(displayed.length / PER_PAGE);

  const stats = {
    total:     displayed.length,
    active:    members.filter(m => ['approved','active'].includes(m.status)).length,
    pending:   members.filter(m => m.status === 'pending').length,
    suspended: members.filter(m => m.status === 'suspended').length,
    hris:      members.filter(m => m.hris_employee_id).length,
  };

  const startEdit = (m) => {
    setEditing(m.id);
    setEditData({
      first_name:      m.first_name || '',
      last_name:       m.last_name  || '',
      email:           m.email      || '',
      department:      m.department || '',
      role:            m.role       || 'member',
      job_title:       m.job_title  || '',
      phone:           m.phone      || '',
      gender:          m.gender     || '',
      date_of_birth:   m.date_of_birth   || '',
      resumption_date: m.resumption_date || '',
    });
  };

  const saveEdit = async (id) => {
    setSaving(true);
    try {
      const r = await fetch(`${BASE}/teams/members/${id}`, {
        method: 'PUT', headers: hdr(), body: JSON.stringify(editData),
      });
      if (!r.ok) throw new Error((await r.json()).error || 'Save failed');
      if (editData.date_of_birth || editData.resumption_date || editData.gender) {
        await fetch(`${BASE}/teams/members/${id}/sync-occasions`, {
          method: 'POST', headers: hdr(), body: JSON.stringify(editData),
        }).catch(() => {});
      }
      toast.success('Saved successfully');
      setEditing(null);
      setEditData({});
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteMember = async (id, name) => {
    if (!confirm(`Remove ${name} from your team? This cannot be undone.`)) return;
    try {
      await fetch(`${BASE}/teams/members/${id}`, { method: 'DELETE', headers: hdr() });
      toast.success(`${name} removed`);
      setMembers(p => p.filter(m => m.id !== id));
    } catch { toast.error('Failed to remove'); }
  };

  const toggleStatus = async (id, name, currentStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'approved' : 'suspended';
    const verb = currentStatus === 'suspended' ? 'Reactivate' : 'Suspend';
    if (!confirm(`${verb} ${name}?`)) return;
    try {
      await fetch(`${BASE}/teams/members/${id}/status`, {
        method: 'PATCH', headers: hdr(), body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`${name} ${newStatus === 'suspended' ? 'suspended' : 'reactivated'}`);
      setMembers(p => p.map(m => m.id === id ? { ...m, status: newStatus } : m));
    } catch { toast.error('Action failed'); }
  };

  const ed = (k, v) => setEditData(p => ({ ...p, [k]: v }));

  const isEditing = (id) => editing === id;

  return (
    <CompanyLayout title="Team Members" subtitle="Your organisation's single source of truth for all celebrations">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', val: stats.total,     color: 'text-warm-900' },
          { label: 'Active',    val: stats.active,    color: 'text-emerald-600' },
          { label: 'Pending',   val: stats.pending,   color: 'text-amber-600' },
          { label: 'Suspended', val: stats.suspended, color: 'text-red-600' },
          { label: 'From HRIS', val: stats.hris,      color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-purple-100 px-4 py-3 text-center shadow-sm">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.val}</p>
            <p className="text-xs text-warm-400 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400 text-sm">🔍</span>
          <input className="input pl-9 text-sm w-full" placeholder="Search name, email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input text-sm py-2.5" value={deptF} onChange={e => setDeptF(e.target.value)}>
          <option value="">All departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="input text-sm py-2.5" value={roleF} onChange={e => setRoleF(e.target.value)}>
          <option value="">All roles</option>
          <option value="member">Member</option>
          <option value="team_leader">Leader</option>
        </select>
        <button onClick={load} className="btn-secondary text-sm px-4 py-2.5 flex items-center gap-1.5">
          <span>↻</span> Refresh
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-sm text-warm-400">Loading team members…</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="text-5xl">👥</div>
            <p className="text-base font-semibold text-warm-800">No team members yet</p>
            <p className="text-sm text-warm-400 text-center max-w-xs">
              Import your team via the HRIS sync, general master template, or the Occasions Manager. All paths update this table.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: 1080 }}>
                <thead>
                  <tr className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                    {['Employee', 'Department', 'Job Title', 'Role', '🎂 Birthday', '📅 Joined', '⚧ Gender', '📞 Phone', 'Status', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-warm-500 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50/60">
                  {paginated.map(m => (
                    <>
                      <tr key={m.id}
                        onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                        className="hover:bg-purple-50/40 cursor-pointer transition-colors group">
                        {/* Employee */}
                        <td className="px-4 py-3">
                          {isEditing(m.id) ? (
                            <div className="flex flex-wrap gap-1.5" onClick={e => e.stopPropagation()}>
                              <input className="input text-xs py-1.5 w-24" value={editData.first_name}
                                onChange={e => ed('first_name', e.target.value)} placeholder="First" />
                              <input className="input text-xs py-1.5 w-24" value={editData.last_name}
                                onChange={e => ed('last_name', e.target.value)} placeholder="Last" />
                              <input className="input text-xs py-1.5 w-40" value={editData.email}
                                onChange={e => ed('email', e.target.value)} placeholder="Email" />
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar fn={m.first_name} ln={m.last_name} size={9} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="text-sm font-semibold text-warm-900 truncate">
                                    {m.first_name} {m.last_name}
                                  </span>
                                  <SourceBadge member={m} />
                                </div>
                                <p className="text-xs text-warm-400 truncate">{m.email}</p>
                              </div>
                            </div>
                          )}
                        </td>
                        {/* Department */}
                        <td className="px-4 py-3">
                          {isEditing(m.id) ? (
                            <input className="input text-xs py-1.5 w-32" value={editData.department}
                              onChange={e => ed('department', e.target.value)} placeholder="Dept"
                              onClick={e => e.stopPropagation()} />
                          ) : (
                            <span className="text-sm text-warm-700">{m.department || EMPTY}</span>
                          )}
                        </td>
                        {/* Job Title */}
                        <td className="px-4 py-3">
                          {isEditing(m.id) ? (
                            <input className="input text-xs py-1.5 w-32" value={editData.job_title}
                              onChange={e => ed('job_title', e.target.value)} placeholder="Job title"
                              onClick={e => e.stopPropagation()} />
                          ) : (
                            <span className="text-sm text-warm-700">{m.job_title || EMPTY}</span>
                          )}
                        </td>
                        {/* Role */}
                        <td className="px-4 py-3">
                          {isEditing(m.id) ? (
                            <select className="input text-xs py-1.5 w-28" value={editData.role}
                              onChange={e => ed('role', e.target.value)}
                              onClick={e => e.stopPropagation()}>
                              <option value="member">Member</option>
                              <option value="team_leader">Leader</option>
                            </select>
                          ) : <RoleBadge role={m.role} />}
                        </td>
                        {/* Birthday */}
                        <td className="px-4 py-3">
                          {isEditing(m.id) ? (
                            <input type="date" className="input text-xs py-1.5 w-36" value={editData.date_of_birth}
                              onChange={e => ed('date_of_birth', e.target.value)}
                              onClick={e => e.stopPropagation()} />
                          ) : m.date_of_birth ? (
                            <div>
                              <p className="text-sm font-medium text-warm-800">{fmtShort(m.date_of_birth)}</p>
                              <p className="text-[11px] text-warm-400">{m.date_of_birth.slice(0,4)}</p>
                            </div>
                          ) : EMPTY}
                        </td>
                        {/* Work Anniversary */}
                        <td className="px-4 py-3">
                          {isEditing(m.id) ? (
                            <input type="date" className="input text-xs py-1.5 w-36" value={editData.resumption_date}
                              onChange={e => ed('resumption_date', e.target.value)}
                              onClick={e => e.stopPropagation()} />
                          ) : (m.resumption_date || m.hire_date) ? (
                            <div>
                              <p className="text-sm font-medium text-warm-800">{fmtShort(m.resumption_date || m.hire_date)}</p>
                              <p className="text-[11px] text-warm-400">{(m.resumption_date || m.hire_date).slice(0,4)}</p>
                            </div>
                          ) : EMPTY}
                        </td>
                        {/* Gender */}
                        <td className="px-4 py-3">
                          {isEditing(m.id) ? (
                            <select className="input text-xs py-1.5 w-24" value={editData.gender}
                              onChange={e => ed('gender', e.target.value)}
                              onClick={e => e.stopPropagation()}>
                              <option value="">—</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                            </select>
                          ) : (
                            <span className="text-sm text-warm-700 capitalize">{m.gender || EMPTY}</span>
                          )}
                        </td>
                        {/* Phone */}
                        <td className="px-4 py-3">
                          {isEditing(m.id) ? (
                            <input className="input text-xs py-1.5 w-32" value={editData.phone}
                              onChange={e => ed('phone', e.target.value)} placeholder="+234..."
                              onClick={e => e.stopPropagation()} />
                          ) : (
                            <span className="text-sm text-warm-700">{m.phone || EMPTY}</span>
                          )}
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          <StatusBadge status={m.status} />
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isEditing(m.id) ? (
                              <>
                                <button disabled={saving} onClick={() => saveEdit(m.id)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60">
                                  {saving ? '…' : '✓ Save'}
                                </button>
                                <button onClick={() => { setEditing(null); setEditData({}); }}
                                  className="px-2 py-1.5 rounded-lg text-xs text-warm-500 hover:text-warm-800 hover:bg-gray-100">
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEdit(m)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors">
                                  Edit
                                </button>
                                <button onClick={() => toggleStatus(m.id, `${m.first_name} ${m.last_name}`, m.status)}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                    m.status === 'suspended'
                                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                  }`}>
                                  {m.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                                </button>
                                <button onClick={() => deleteMember(m.id, `${m.first_name} ${m.last_name}`)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                                  Remove
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* Expanded detail row */}
                      {expanded === m.id && !isEditing(m.id) && (
                        <tr key={`${m.id}-expand`} className="bg-purple-50/30">
                          <td colSpan={10} className="px-6 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <Field label="Full Email" value={m.email} />
                              <Field label="HRIS Employee ID" value={m.hris_employee_id} />
                              <Field label="Employment Status" value={m.employment_status} />
                              <Field label="Joined Thankeeu" value={fmt(m.created_at)} />
                              <Field label="Birthday" value={fmt(m.date_of_birth)} />
                              <Field label="Work Anniversary" value={fmt(m.resumption_date)} />
                              <Field label="Promotion Date" value={fmt(m.promotion_date)} />
                              <Field label="Leaving Date" value={fmt(m.leaving_date)} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-purple-50">
                <p className="text-xs text-warm-400">
                  Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, displayed.length)} of {displayed.length}
                </p>
                <div className="flex gap-1.5">
                  <button disabled={page === 1} onClick={() => setPage(p => p-1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-purple-100 disabled:opacity-40 hover:bg-purple-50">
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => setPage(n)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${n === page ? 'bg-primary-600 text-white' : 'border border-purple-100 hover:bg-purple-50'}`}>
                      {n}
                    </button>
                  ))}
                  <button disabled={page === totalPages} onClick={() => setPage(p => p+1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-purple-100 disabled:opacity-40 hover:bg-purple-50">
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Footer note */}
            <div className="px-5 py-3 border-t border-purple-50 bg-purple-50/30 flex items-center gap-2">
              <span className="text-[11px] text-warm-400">
                💡 This table is the <strong>single source of truth</strong> — HRIS sync, Occasions Manager, and Master Template all update it. The automation cron reads exclusively from here.
              </span>
            </div>
          </>
        )}
      </div>
    </CompanyLayout>
  );
}
