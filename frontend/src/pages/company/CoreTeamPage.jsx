import { useState, useEffect, useRef } from 'react';
import CompanyLayout from '../../components/company/CompanyLayout';
import toast from 'react-hot-toast';

const BASE = import.meta.env.VITE_API_URL || '/api';
const tok  = () => localStorage.getItem('thankeeu_company_token');
const hdr  = () => ({ Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' });

const PERMISSIONS = [
  { value:'full',    label:'Full Access',    desc:'Can manage everything: occasions, team, settings, billing', color:'#7C3AED' },
  { value:'medium',  label:'Medium Access',  desc:'Can manage occasions and view team data',                   color:'#0EA5E9' },
  { value:'limited', label:'Limited Access', desc:'View-only: see occasions, cannot make changes',             color:'#6B7280' },
];

const TITLE_PRESETS = ['CEO','CFO','COO','CTO','HR Director','HR Manager','HR Assistant','Department Head','Other'];

export default function CoreTeamPage() {
  const [team,       setTeam]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [form,       setForm]       = useState({ email:'', full_name:'', title:'', permission_level:'medium', include_in_celebrations:true });
  const [inviting,   setInviting]   = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [bulkText,   setBulkText]   = useState('');
  const [bulkMode,   setBulkMode]   = useState(false);
  const [sending,    setSending]    = useState(false);
  const fileRef = useRef();

  const load = async () => {
    try {
      const r = await fetch(`${BASE}/core-team`, { headers: hdr() });
      const d = await r.json();
      setTeam(Array.isArray(d) ? d : []);
    } catch { toast.error('Failed to load core team'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const invite = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) return toast.error('Email is required');
    setInviting(true);
    try {
      const r = await fetch(`${BASE}/core-team/invite`, {
        method:'POST', headers: hdr(), body: JSON.stringify(form)
      });
      const d = await r.json();
      if (!r.ok) return toast.error(d.error || 'Invite failed');
      toast.success(d.message || 'Invitation sent! ✓');
      setForm({ email:'', full_name:'', title:'', permission_level:'medium', include_in_celebrations:true });
      setShowForm(false);
      load();
    } catch { toast.error('Invite failed'); }
    finally { setInviting(false); }
  };

  const bulkInvite = async () => {
    if (!bulkText.trim()) return toast.error('Paste CSV data first');
    setSending(true);
    try {
      const lines   = bulkText.split('\n').map(l=>l.trim()).filter(l=>l && !l.startsWith('#'));
      const headers = lines[0].split(',').map(h=>h.trim());
      const members = lines.slice(1).map(line => {
        const vals = line.split(',');
        return Object.fromEntries(headers.map((h,i) => [h, vals[i]?.trim()||'']));
      }).filter(m => m.email);

      const r = await fetch(`${BASE}/core-team/bulk-invite`, {
        method:'POST', headers: hdr(), body: JSON.stringify({ members })
      });
      const d = await r.json();
      if (!r.ok) return toast.error(d.error);
      toast.success(d.message);
      setBulkText(''); setBulkMode(false);
      load();
    } catch { toast.error('Bulk invite failed'); }
    finally { setSending(false); }
  };

  const remove = async (id, name) => {
    if (!confirm(`Remove ${name} from your core team?`)) return;
    try {
      await fetch(`${BASE}/core-team/${id}`, { method:'DELETE', headers: hdr() });
      toast.success('Removed');
      setTeam(p => p.filter(m => m.id !== id));
    } catch { toast.error('Failed'); }
  };

  const updatePermission = async (id, permission_level) => {
    try {
      await fetch(`${BASE}/core-team/${id}`, {
        method:'PUT', headers: hdr(), body: JSON.stringify({ permission_level })
      });
      setTeam(p => p.map(m => m.id === id ? {...m, permission_level} : m));
      toast.success('Permission updated');
    } catch { toast.error('Failed'); }
  };

  const toggleCelebrations = async (id, val) => {
    try {
      await fetch(`${BASE}/core-team/${id}`, {
        method:'PUT', headers: hdr(), body: JSON.stringify({ include_in_celebrations: val })
      });
      setTeam(p => p.map(m => m.id === id ? {...m, include_in_celebrations: val} : m));
    } catch { toast.error('Failed'); }
  };

  const BULK_TEMPLATE = `email,full_name,title,permission_level
ceo@company.com,John Adeyemi,CEO,full
cfo@company.com,Sarah Okafor,CFO,full
hr@company.com,Kemi Bello,HR Manager,medium`;

  const permColor = (level) => PERMISSIONS.find(p=>p.value===level)?.color || '#888';

  return (
    <CompanyLayout title="Core Team 🏢" subtitle="Invite your senior team with tailored access levels">

      {/* Actions bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button onClick={() => { setShowForm(!showForm); setBulkMode(false); }}
          className="btn-primary text-sm py-2.5 px-5">
          ➕ Invite someone
        </button>
        <button onClick={() => { setBulkMode(!bulkMode); setShowForm(false); }}
          className="btn-secondary text-sm py-2.5 px-5">
          📥 Bulk invite (CSV)
        </button>
      </div>

      {/* Single invite form */}
      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-primary-200 p-5 mb-6 max-w-2xl">
          <h3 className="font-bold text-warm-900 text-base mb-4">Invite a core team member</h3>
          <form onSubmit={invite} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-warm-700 mb-1.5">Email address *</label>
                <input type="email" className="input text-base" placeholder="ceo@company.com"
                  value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-warm-700 mb-1.5">Full name</label>
                <input className="input text-base" placeholder="John Adeyemi"
                  value={form.full_name} onChange={e => setForm(p=>({...p,full_name:e.target.value}))} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-warm-700 mb-1.5">Title / Role</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {TITLE_PRESETS.map(t => (
                    <button type="button" key={t} onClick={() => setForm(p=>({...p,title:t}))}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${form.title===t ? 'bg-primary-100 border-primary-400 text-primary-700' : 'border-purple-200 text-warm-600 hover:border-primary-300'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <input className="input text-sm" placeholder="Or type custom title"
                  value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm font-bold text-warm-700 mb-1.5">Access level</label>
                <div className="space-y-2">
                  {PERMISSIONS.map(perm => (
                    <label key={perm.value} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.permission_level === perm.value ? 'border-primary-400 bg-primary-50' : 'border-purple-100 hover:border-primary-200'}`}>
                      <input type="radio" name="permission_level" value={perm.value} checked={form.permission_level === perm.value}
                        onChange={() => setForm(p=>({...p,permission_level:perm.value}))} className="mt-0.5 accent-violet-600" />
                      <div>
                        <p className="text-sm font-bold" style={{color:perm.color}}>{perm.label}</p>
                        <p className="text-xs text-warm-500">{perm.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <label className="flex items-center gap-3">
              <input type="checkbox" checked={form.include_in_celebrations}
                onChange={e => setForm(p=>({...p,include_in_celebrations:e.target.checked}))} className="w-5 h-5 accent-violet-600" />
              <span className="text-sm text-warm-700">Include in company celebration notifications (birthday emails, etc.)</span>
            </label>

            <div className="flex gap-3">
              <button type="submit" disabled={inviting} className="btn-primary py-2.5 px-6">
                {inviting ? '⏳ Sending...' : '📧 Send invite'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary py-2.5 px-4">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk invite */}
      {bulkMode && (
        <div className="bg-white rounded-2xl border-2 border-purple-200 p-5 mb-6 max-w-2xl">
          <h3 className="font-bold text-warm-900 text-base mb-2">Bulk invite via CSV</h3>
          <p className="text-sm text-warm-400 mb-3">Format: <code className="bg-purple-50 px-1.5 py-0.5 rounded text-xs">email, full_name, title, permission_level</code></p>
          <button onClick={() => setBulkText(BULK_TEMPLATE)} className="text-xs text-primary-500 font-semibold mb-3 hover:underline">
            Load example template
          </button>
          <textarea className="input font-mono text-sm h-40 resize-none mb-4" placeholder={BULK_TEMPLATE}
            value={bulkText} onChange={e => setBulkText(e.target.value)} />
          <div className="flex gap-3">
            <button onClick={bulkInvite} disabled={sending} className="btn-primary py-2.5 px-6">
              {sending ? '⏳ Sending...' : '📧 Send all invites'}
            </button>
            <button onClick={() => setBulkMode(false)} className="btn-secondary py-2.5 px-4">Cancel</button>
          </div>
        </div>
      )}

      {/* Core team table */}
      <div className="bg-white rounded-2xl border-2 border-purple-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-purple-100">
          <p className="font-semibold text-warm-900 text-base">Core team ({team.length})</p>
        </div>

        {loading ? (
          <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-primary-300 border-t-transparent rounded-full animate-spin mx-auto"/></div>
        ) : team.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl mb-3">🏢</div>
            <p className="font-semibold text-warm-900 text-base">No core team members yet</p>
            <p className="text-sm text-warm-400 mt-1">Invite your CEO, CFO, HR team and other key people above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-purple-50 text-xs font-semibold text-warm-500 uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Member</th>
                  <th className="text-left px-4 py-3">Title</th>
                  <th className="text-left px-4 py-3">Access Level</th>
                  <th className="text-left px-4 py-3">Celebrations</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {team.map(m => (
                  <tr key={m.id} className="hover:bg-purple-50/40">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-warm-900">{m.full_name || m.email}</p>
                      <p className="text-xs text-warm-400">{m.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-warm-600">{m.title || '—'}</td>
                    <td className="px-4 py-3">
                      <select value={m.permission_level}
                        onChange={e => updatePermission(m.id, e.target.value)}
                        className="text-sm border border-purple-200 rounded-lg px-2 py-1.5 font-semibold"
                        style={{color: permColor(m.permission_level)}}>
                        {PERMISSIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleCelebrations(m.id, !m.include_in_celebrations)}
                        className={`w-9 h-5 rounded-full relative transition-all ${m.include_in_celebrations ? 'bg-primary-500' : 'bg-gray-300'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${m.include_in_celebrations ? 'left-4' : 'left-0.5'}`}/>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${m.invite_accepted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {m.invite_accepted ? '✓ Accepted' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => remove(m.id, m.full_name || m.email)}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-sm text-amber-700">
          💡 <strong>How it works:</strong> When you invite someone, they receive an email with a link to set their password. After setting their password, they can log in at <a href="/member/login" className="underline font-semibold">/member/login</a> and access the team dashboard based on their permission level.
        </p>
      </div>
    </CompanyLayout>
  );
}
