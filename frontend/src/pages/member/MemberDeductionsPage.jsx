import { useSEO } from '../../hooks/useSEO';
import { useState, useEffect } from 'react';
import { deductionsAPI } from '../../utils/api';
import MemberLayout from '../../components/member/MemberLayout';

const MemberDeductionsPage = () => {
  useSEO({ title: 'Deductions — Thankeeu for Teams', noIndex: true });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    deductionsAPI.getPending()
      .then(r => setRequests(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <MemberLayout title="Deduction Requests" subtitle="View and manage gift pot deduction requests">
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse border border-gray-100" />)}</div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-3">💰</div>
          <h3 className="font-semibold text-gray-900 mb-1">No deduction requests</h3>
          <p className="text-sm text-gray-400">Gift pot deduction requests from your team will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-lg">💰</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{r.reason || 'Deduction request'}</p>
                <p className="text-xs text-gray-400">Amount: ₦{(r.amount || 0).toLocaleString()}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                r.status === 'approved' ? 'bg-green-100 text-green-700' :
                r.status === 'rejected' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}>{r.status || 'pending'}</span>
            </div>
          ))}
        </div>
      )}
    </MemberLayout>
  );
};

export default MemberDeductionsPage;
