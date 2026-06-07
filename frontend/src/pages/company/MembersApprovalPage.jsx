import { useSEO } from '../../hooks/useSEO';
import { useState, useEffect } from 'react';
import { hrMembersAPI } from '../../utils/api';
import CompanyLayout from '../../components/company/CompanyLayout';
import { useCompanyAuth } from '../../context/CompanyAuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_COLORS = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
};

const MembersApprovalPage = () => {
  useSEO({ title: 'Team Members — Thankeeu for Teams', noIndex: true });

  const { company } = useCompanyAuth();
  const [members, setMembers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('pending');
  const [deptFilter, setDeptFilter] = useState('');
  const [rejectId, setRejectId]   = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing]       = useState(null);

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    try {
      const res = await hrMembersAPI.getAll();
      setMembers(res.data || []);
    } catch { toast.error('Failed to load members'); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id, name) => {
    setActing(id);
    try {
      await hrMembersAPI.approve(id);
      setMembers(prev => prev.map(m => m.id === id ? { ...m, status: 'approved' } : m));
      toast.success(`${name} approved!`);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to approve'); }
    finally { setActing(null); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return toast.error('Please provide a reason');
    setActing(rejectId);
    try {
      await hrMembersAPI.reject(rejectId, rejectReason);
      setMembers(prev => prev.map(m => m.id === rejectId ? { ...m, status: 'rejected' } : m));
      toast.success('Member rejected');
      setRejectId(null); setRejectReason('');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to reject'); }
    finally { setActing(null); }
  };

  const departments = [...new Set(members.map(m => m.department))].sort();
  const filtered = members.filter(m => {
    const matchStatus = filter === 'all' || m.status === filter;
    const matchDept   = !deptFilter || m.department === deptFilter;
    return matchStatus && matchDept;
  });

  const counts = {
    pending:  members.filter(m => m.status === 'pending').length,
    approved: members.filter(m => m.status === 'approved').length,
    rejected: members.filter(m => m.status === 'rejected').length,
  };

  // Company code for sharing
  const companyCode = company?.id;

  return (
    <CompanyLayout title="Team Members" subtitle="Manage who joins your company workspace">

      {/* Company code banner */}
      <div className="bg-primary-50 border border-primary-100 rounded-3xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-primary-800 text-sm mb-1">🔑 Your company code</p>
            <p className="text-xs text-primary-600 leading-relaxed">
              Share this code with team members and leaders so they can join your workspace at
              <strong> thankeeu.com/member/signup</strong>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <code className="bg-white text-primary-700 border border-primary-200 px-3 py-2 rounded-xl text-xs font-mono select-all">
              {companyCode}
            </code>
            <button
              onClick={() => { navigator.clipboard.writeText(companyCode); toast.success('Code copied!'); }}
              className="bg-primary-400 text-white px-3 py-2 rounded-xl text-xs font-medium hover:bg-primary-600 transition-colors">
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* Tabs + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-1 bg-purple-50 p-1 rounded-xl">
          {[
            { id: 'pending',  label: `Pending (${counts.pending})` },
            { id: 'approved', label: `Approved (${counts.approved})` },
            { id: 'rejected', label: `Rejected (${counts.rejected})` },
            { id: 'all',      label: `All (${members.length})` },
          ].map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                filter === t.id ? 'bg-white text-primary-700 shadow-sm font-bold border border-purple-100' : 'text-warm-500 hover:text-warm-800'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
        <select className="input sm:w-44 text-sm" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          <option value="">All departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Members list */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white rounded-3xl border border-purple-100 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-purple-100 p-12 text-center">
          <div className="text-5xl mb-3">👥</div>
          <p className="text-sm font-medium text-warm-700 mb-1">
            {filter === 'pending' ? 'No pending requests' : `No ${filter} members`}
          </p>
          <p className="text-xs text-warm-400">Share your company code above so employees can sign up</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-100 bg-warm-100">
                  {['Member','Role','Department','Email','Requested','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-warm-100 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {m.profile_picture_url
                          ? <img src={m.profile_picture_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                          : <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-xs font-bold flex-shrink-0">
                              {m.first_name?.[0]}{m.last_name?.[0]}
                            </div>}
                        <span className="text-sm font-medium text-warm-900 whitespace-nowrap">{m.first_name} {m.last_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${m.role === 'team_leader' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-600'}`}>
                        {m.role === 'team_leader' ? '👑 Leader' : '👤 Member'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-warm-600">{m.department}</td>
                    <td className="px-5 py-3 text-sm text-warm-500 max-w-[180px] truncate">{m.email}</td>
                    <td className="px-5 py-3 text-xs text-warm-400 whitespace-nowrap">
                      {format(new Date(m.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[m.status]}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {m.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(m.id, m.first_name)}
                            disabled={acting === m.id}
                            className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                            {acting === m.id ? '...' : '✓ Approve'}
                          </button>
                          <button
                            onClick={() => { setRejectId(m.id); setRejectReason(''); }}
                            className="text-xs bg-red-50 text-red-500 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                            Reject
                          </button>
                        </div>
                      )}
                      {m.status === 'approved' && (
                        <span className="text-xs text-warm-400">
                          {m.approved_at ? format(new Date(m.approved_at), 'MMM d') : 'Approved'}
                        </span>
                      )}
                      {m.status === 'rejected' && m.rejection_reason && (
                        <span className="text-xs text-warm-400 max-w-[120px] truncate block" title={m.rejection_reason}>
                          {m.rejection_reason}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject reason modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="font-display text-xl font-semibold text-warm-900 mb-2">Reject request</h3>
            <p className="text-sm text-warm-500 mb-5">Please provide a reason so the member knows why they were not approved.</p>
            <textarea className="input h-24 resize-none mb-4" placeholder="e.g. Email domain mismatch, duplicate account..."
              value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setRejectId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleReject} disabled={acting || !rejectReason.trim()}
                className="flex-1 bg-red-500 text-white rounded-xl py-3 text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50">
                {acting ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </CompanyLayout>
  );
};

export default MembersApprovalPage;
