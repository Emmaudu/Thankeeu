import { useState, useEffect, useRef } from 'react';
import CompanyLayout from '../../components/company/CompanyLayout';
import toast from 'react-hot-toast';

const BASE = import.meta.env.VITE_API_URL || '/api';
const tok  = () => localStorage.getItem('thankeeu_company_token');
const hdr  = () => ({ Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' });

export default function TeamMembersPage() {
  const [members,  setMembers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [deptF,    setDeptF]    = useState('');
  const [roleF,    setRoleF]    = useState('');
  const [editId,   setEditId]   = useState(null);
  const [editData, setEditData] = useState({});
  const [saving,   setSaving]   = useState(false);
  const [teamsCount, setTeamsCount] = useState(0);
  const [departmentOptions, setDepartmentOptions] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/teams/all-members?search=${encodeURIComponent(search)}&dept=${encodeURIComponent(deptF)}&role=${encodeURIComponent(roleF)}`, { headers: hdr() });
      const d = await r.json();
      const memberList = Array.isArray(d) ? d : (d.members || []);
      setMembers(memberList);
      if (!Array.isArray(d)) {
        if (d.teams_count !== undefined) setTeamsCount(d.teams_count);
        if (Array.isArray(d.departments)) setDepartmentOptions(d.departments);
      }
    } catch { toast.error('Failed to load team members'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, deptF, roleF]);

  const departments = departmentOptions.length
    ? departmentOptions
    : [...new Set(members.map(m => m.department).filter(Boolean))].sort();

  const saveEdit = async () => {
    setSaving(true);
    try {
      await fetch(`${BASE}/teams/members/${editId}`, {
        method: 'PUT', headers: hdr(), body: JSON.stringify(editData)
      });
      // Auto-sync occasion tables when birthday/gender/resumption changes
      if (editData.date_of_birth || editData.gender || editData.resumption_date) {
        await fetch(`${BASE}/teams/members/${editId}/sync-occasions`, {
          method: 'POST', headers: hdr(), body: JSON.stringify(editData)
        }).catch(() => {});
      }
      toast.success('Saved ✓');
      setEditId(null); setEditData({});
      load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const deleteMember = async (id, name) => {
    if (!confirm(`Remove ${name} from your team? They will lose dashboard access.`)) return;
    try {
      await fetch(`${BASE}/teams/members/${id}`, { method: 'DELETE', headers: hdr() });
      toast.success(`${name} removed`);
      setMembers(p => p.filter(m => m.id !== id));
    } catch { toast.error('Failed to remove'); }
  };

  const suspendMember = async (id, name, currentStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'approved' : 'suspended';
    const action    = currentStatus === 'suspended' ? 'Unsuspend' : 'Suspend';
    if (!confirm(`${action} ${name}?`)) return;
    try {
      await fetch(`${BASE}/teams/members/${id}/status`, {
        method: 'PATCH', headers: hdr(), body: JSON.stringify({ status: newStatus })
      });
      toast.success(`${name} ${newStatus === 'suspended' ? 'suspended' : 'reactivated'}`);
      setMembers(p => p.map(m => m.id === id ? {...m, status: newStatus} : m));
    } catch { toast.error('Failed'); }
  };

  const startEdit = (m) => {
    setEditId(m.id);
    setEditData({
      first_name: m.first_name, last_name: m.last_name,
      email: m.email, department: m.department || '',
      role: m.role || 'member', phone: m.phone || '',
      job_title: m.job_title || '', date_of_birth: m.date_of_birth || '',
      gender: m.gender || '', resumption_date: m.resumption_date || '',
    });
  };

  const statusBadge = (s) => ({
    approved:  'bg-green-100 text-green-700',
    pending:   'bg-amber-100 text-amber-700',
    suspended: 'bg-red-100 text-red-600',
    rejected:  'bg-gray-100 text-gray-500',
  }[s] || 'bg-gray-100 text-gray-500');

  return (
    <CompanyLayout title="Team Members 👥" subtitle="Manage your organisation's members and leaders">

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input className="input w-full sm:flex-1 sm:min-w-48 text-base" placeholder="🔍 Search name or email..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input text-base" value={deptF} onChange={e => setDeptF(e.target.value)}>
          <option value="">All departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="input text-base" value={roleF} onChange={e => setRoleF(e.target.value)}>
          <option value="">All roles</option>
          <option value="member">Member</option>
          <option value="leader">Leader</option>
        </select>
        <button onClick={load} className="btn-secondary text-sm py-2.5 px-4">🔄 Refresh</button>
      </div>

      <div className="bg-white rounded-2xl border-2 border-purple-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-purple-100 flex items-center justify-between">
          <p className="font-semibold text-warm-900 text-base">{members.length} team members</p>
          <p className="text-sm text-warm-400">
            {members.filter(m=>m.status==='approved').length} active ·{' '}
            {members.filter(m=>m.status==='pending').length} pending ·{' '}
            {members.filter(m=>m.status==='suspended').length} suspended
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto"/></div>
        ) : members.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl mb-3">👥</div>
            <p className="font-semibold text-warm-900 text-base mb-1">No team members yet</p>
            <p className="text-sm text-warm-400">Import your team using the Occasions Manager bulk import or invite them directly.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{minWidth:"700px"}}>
              <thead className="bg-purple-50 text-xs font-semibold text-warm-500 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Employee</th>
                  <th className="text-left px-4 py-3">Department / Role</th>
                  <th className="text-left px-4 py-3">🎂 Birthday</th>
                  <th className="text-left px-4 py-3">⚧ Gender</th>
                  <th className="text-left px-4 py-3">📅 Resumption</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {members.map(m => {
                  const isEditing = editId === m.id;
                  return (
                    <tr key={m.id} className="hover:bg-purple-50/40 transition-colors">
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex flex-wrap gap-1.5">
                            <input className="input text-sm py-1.5 w-28" value={editData.first_name}
                              onChange={e => setEditData(d=>({...d,first_name:e.target.value}))} placeholder="First" />
                            <input className="input text-sm py-1.5 w-28" value={editData.last_name}
                              onChange={e => setEditData(d=>({...d,last_name:e.target.value}))} placeholder="Last" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-600 flex-shrink-0">
                              {m.first_name?.[0]}{m.last_name?.[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-warm-900 truncate">
                            {m.first_name} {m.last_name}
                            {m.source === 'occasion_import' && (
                              <span className="ml-1.5 text-xs bg-amber-50 border border-amber-200 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">bulk import</span>
                            )}
                          </p>
                              <p className="text-xs text-warm-400 truncate">{m.email}</p>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex flex-col gap-1.5">
                            <input className="input text-sm py-1.5" value={editData.department}
                              onChange={e => setEditData(d=>({...d,department:e.target.value}))} placeholder="Department" />
                            <select className="input text-sm py-1.5" value={editData.role}
                              onChange={e => setEditData(d=>({...d,role:e.target.value}))}>
                              <option value="member">Member</option>
                              <option value="leader">Leader</option>
                            </select>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-warm-700 font-medium">{m.department || '—'}</p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${m.role === 'leader' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                              {m.role === 'leader' ? '👑 Leader' : '👤 Member'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input type="date" className="input text-sm py-1.5 w-40" value={editData.date_of_birth}
                            onChange={e => setEditData(d=>({...d,date_of_birth:e.target.value}))} />
                        ) : m.date_of_birth ? (
                          <div>
                            <p className="text-sm text-warm-700">{new Date(m.date_of_birth + 'T00:00:00').toLocaleDateString('en', {day:'numeric',month:'short'})}</p>
                            <p className="text-xs text-warm-400">{m.date_of_birth.slice(0,4)}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-warm-300 italic">Not set</span>
                        )}
                      </td>
                      {/* Gender */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select className="input text-sm py-1.5 w-28" value={editData.gender||''}
                            onChange={e => setEditData(d=>({...d,gender:e.target.value}))}>
                            <option value="">—</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        ) : (
                          <span className="text-xs text-warm-600 capitalize">{m.gender || <span className="text-warm-300 italic">Not set</span>}</span>
                        )}
                      </td>
                      {/* Resumption date */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input type="date" className="input text-sm py-1.5 w-40" value={editData.resumption_date||''}
                            onChange={e => setEditData(d=>({...d,resumption_date:e.target.value}))} />
                        ) : m.resumption_date ? (
                          <div>
                            <p className="text-sm text-warm-700">{new Date(m.resumption_date + 'T00:00:00').toLocaleDateString('en', {day:'numeric',month:'short'})}</p>
                            <p className="text-xs text-warm-400">{m.resumption_date.slice(0,4)}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-warm-300 italic">Not set</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${statusBadge(m.status)}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {isEditing ? (
                            <>
                              <button onClick={saveEdit} disabled={saving}
                                className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100">
                                {saving ? '...' : 'Save'}
                              </button>
                              <button onClick={() => { setEditId(null); setEditData({}); }}
                                className="text-xs px-2 py-1.5 text-gray-500 hover:text-gray-700">
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(m)}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100">
                                ✏️ Edit
                              </button>
                              <button onClick={() => suspendMember(m.id, `${m.first_name} ${m.last_name}`, m.status)}
                                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                                  m.status === 'suspended'
                                    ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                }`}>
                                {m.status === 'suspended' ? '✓ Reactivate' : '⏸ Suspend'}
                              </button>
                              <button onClick={() => deleteMember(m.id, `${m.first_name} ${m.last_name}`)}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                                🗑 Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}
