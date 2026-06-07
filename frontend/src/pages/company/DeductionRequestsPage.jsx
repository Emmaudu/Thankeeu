import { formatUSD } from '../../utils/currency';
import { useSEO } from '../../hooks/useSEO';
import { useState, useEffect } from 'react';
import { deductionsAPI } from '../../utils/api';
import CompanyLayout from '../../components/company/CompanyLayout';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const statusColors = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
};

const DeductionRequestsPage = () => {
  useSEO({ title: 'Deduction Requests — Thankeeu for Teams', noIndex: true });

  const [deductions, setDeductions]   = useState([]);
  const [crossDept,  setCrossDept]    = useState([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState('deductions');
  const [acting, setActing]           = useState(null);
  const [noteFor, setNoteFor]         = useState(null);
  const [note, setNote]               = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [dRes, cRes] = await Promise.all([
        deductionsAPI.getPending(),
        deductionsAPI.getCrossDeptPending(),
      ]);
      setDeductions(dRes.data || []);
      setCrossDept(cRes.data || []);
    } catch { toast.error('Failed to load requests'); }
    finally { setLoading(false); }
  };

  const handleApproveDeduction = async (id) => {
    setActing(id);
    try {
      await deductionsAPI.approve(id, note);
      setDeductions(prev => prev.map(d => d.id === id ? { ...d, status: 'approved' } : d));
      toast.success('Deduction approved. Team leader notified.');
      setNoteFor(null); setNote('');
    } catch { toast.error('Failed to approve'); }
    finally { setActing(null); }
  };

  const handleRejectDeduction = async (id) => {
    if (!note.trim()) return toast.error('Please add a note explaining the rejection');
    setActing(id);
    try {
      await deductionsAPI.reject(id, note);
      setDeductions(prev => prev.map(d => d.id === id ? { ...d, status: 'rejected' } : d));
      toast.success('Deduction rejected. Team leader notified.');
      setNoteFor(null); setNote('');
    } catch { toast.error('Failed to reject'); }
    finally { setActing(null); }
  };

  const handleApproveCrossDept = async (id) => {
    setActing(id);
    try {
      await deductionsAPI.approveCrossDept(id);
      setCrossDept(prev => prev.filter(c => c.id !== id));
      toast.success('Company-wide notification approved!');
    } catch { toast.error('Failed to approve'); }
    finally { setActing(null); }
  };

  const pendingDeductions  = deductions.filter(d => d.status === 'pending');
  const resolvedDeductions = deductions.filter(d => d.status !== 'pending');

  const TABS = [
    { id: 'deductions', label: `Deduction Requests${pendingDeductions.length > 0 ? ` (${pendingDeductions.length})` : ''}` },
    { id: 'crossdept',  label: `Cross-Dept Approvals${crossDept.length > 0 ? ` (${crossDept.length})` : ''}` },
  ];

  return (
    <CompanyLayout title="Financial Requests" subtitle="Approve team leader deductions and company-wide notification requests">

      {/* Info card */}
      <div className="bg-blue-50 border border-blue-100 rounded-3xl p-5 mb-6">
        <div className="grid sm:grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold text-blue-800 mb-1">💰 How deductions work</p>
            <p className="text-blue-700 text-xs leading-relaxed">
              Team leaders can request to deduct an amount from a celebrant's gift pot for physical in-office celebrations (e.g. buying a cake). The 20% Thankeeu fee is taken from the gross total first. The remaining balance (minus your approved deduction) goes to the celebrant.
            </p>
          </div>
          <div>
            <p className="font-semibold text-blue-800 mb-1">📣 Cross-department notifications</p>
            <p className="text-blue-700 text-xs leading-relaxed">
              By default, occasion cards only notify the celebrant's department. Team members or leaders can request company-wide notification. These require your approval before going out to everyone.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-purple-100 mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-primary-500 text-primary-600 font-bold' : 'border-transparent text-warm-500 hover:text-warm-800'
            }`}>{t.label}</button>
        ))}
      </div>

      {/* ── Deduction requests tab ── */}
      {tab === 'deductions' && (
        <div className="space-y-4">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-28 bg-white rounded-3xl border border-purple-100 animate-pulse" />)
          ) : deductions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-purple-100 p-12 text-center">
              <div className="text-5xl mb-3">💰</div>
              <p className="text-sm text-warm-500">No deduction requests yet</p>
            </div>
          ) : (
            <>
              {/* Pending first */}
              {pendingDeductions.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-3">Awaiting your review</p>
                  {pendingDeductions.map(d => (
                    <div key={d.id} className="bg-white border border-amber-200 rounded-3xl p-5 mb-3">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-warm-900">{d.requested_by_name}</span>
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Pending</span>
                          </div>
                          <p className="text-xs text-warm-500">
                            Requested {format(new Date(d.created_at), 'MMM d, yyyy · h:mm a')}
                            {d.cards && ` · Card: ${d.cards.recipient_name}`}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xl font-bold text-warm-900">{formatUSD(d.amount || 0)}</p>
                          <p className="text-xs text-warm-400">requested deduction</p>
                        </div>
                      </div>
                      <div className="bg-warm-100 rounded-xl p-3 mb-4">
                        <p className="text-xs font-semibold text-warm-500 mb-1">Reason from team leader</p>
                        <p className="text-sm text-warm-700">{d.reason}</p>
                      </div>

                      {noteFor === d.id ? (
                        <div className="space-y-3">
                          <textarea className="input h-20 resize-none text-sm" placeholder="Add a note (required for rejection, optional for approval)..."
                            value={note} onChange={e => setNote(e.target.value)} />
                          <div className="flex gap-2">
                            <button onClick={() => { setNoteFor(null); setNote(''); }} className="btn-secondary flex-1 text-sm py-2">Cancel</button>
                            <button onClick={() => handleRejectDeduction(d.id)} disabled={acting === d.id || !note.trim()}
                              className="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50">
                              {acting === d.id ? '...' : 'Reject'}
                            </button>
                            <button onClick={() => handleApproveDeduction(d.id)} disabled={acting === d.id}
                              className="flex-1 bg-green-600 text-white rounded-xl py-2 text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50">
                              {acting === d.id ? '...' : '✓ Approve'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setNoteFor(d.id); setNote(''); }}
                          className="btn-primary w-full text-sm py-2.5">
                          Review this request
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Resolved */}
              {resolvedDeductions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-3">Resolved</p>
                  <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden">
                    <div className="divide-y divide-gray-50">
                      {resolvedDeductions.map(d => (
                        <div key={d.id} className="flex items-center gap-4 px-5 py-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-warm-900">{d.requested_by_name}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[d.status]}`}>{d.status}</span>
                            </div>
                            <p className="text-xs text-warm-400 mt-0.5">{d.reason?.slice(0, 60)}{d.reason?.length > 60 ? '...' : ''}</p>
                          </div>
                          <p className="text-sm font-bold text-warm-700 flex-shrink-0">{formatUSD(d.amount || 0)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Cross-dept tab ── */}
      {tab === 'crossdept' && (
        <div className="space-y-4">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white rounded-3xl border border-purple-100 animate-pulse" />)
          ) : crossDept.length === 0 ? (
            <div className="bg-white rounded-3xl border border-purple-100 p-12 text-center">
              <div className="text-5xl mb-3">📣</div>
              <p className="text-sm text-warm-500">No pending cross-department requests</p>
            </div>
          ) : crossDept.map(r => (
            <div key={r.id} className="bg-white border border-primary-100 rounded-3xl p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-sm font-semibold text-warm-900 mb-1">
                    {r.requested_by_name} wants to notify all departments
                  </p>
                  <p className="text-xs text-warm-500">
                    Card: <strong>{r.cards?.title || r.cards?.recipient_name}</strong> ·
                    {format(new Date(r.created_at), ' MMM d, yyyy')}
                  </p>
                </div>
                <span className="text-xs bg-primary-100 text-primary-600 px-2.5 py-1 rounded-full font-medium flex-shrink-0">
                  {r.requested_by_type}
                </span>
              </div>
              {r.reason && (
                <div className="bg-warm-100 rounded-xl p-3 mb-4">
                  <p className="text-xs font-semibold text-warm-500 mb-1">Reason</p>
                  <p className="text-sm text-warm-700">{r.reason}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => handleApproveCrossDept(r.id)} disabled={acting === r.id}
                  className="btn-primary flex-1 text-sm py-2.5 disabled:opacity-50">
                  {acting === r.id ? 'Approving...' : '✓ Approve company-wide notification'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </CompanyLayout>
  );
};

export default DeductionRequestsPage;
