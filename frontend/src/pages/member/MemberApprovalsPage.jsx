import { useSEO } from '../../hooks/useSEO';
import { useState, useEffect } from 'react';
import { memberAPI } from '../../utils/api';
import MemberLayout from '../../components/member/MemberLayout';
import toast from 'react-hot-toast';

const MemberApprovalsPage = () => {
  useSEO({ title: 'Approvals — Thankeeu for Teams', noIndex: true });
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    memberAPI.getDeptPending()
      .then(r => setMembers(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <MemberLayout title="Pending Approvals" subtitle="Approve team members in your department">
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse border border-gray-100" />)}</div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-3">✅</div>
          <h3 className="font-semibold text-gray-900 mb-1">No pending approvals</h3>
          <p className="text-sm text-gray-400">New team members in your department will appear here for approval.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map(m => (
            <div key={m.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-sm font-bold text-primary-600">
                {m.first_name?.[0]}{m.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{m.first_name} {m.last_name}</p>
                <p className="text-xs text-gray-400">{m.email} · {m.department}</p>
              </div>
              <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">Pending</span>
            </div>
          ))}
        </div>
      )}
    </MemberLayout>
  );
};

export default MemberApprovalsPage;
