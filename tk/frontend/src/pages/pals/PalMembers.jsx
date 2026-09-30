import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PalLayout from './PalLayout';
import Icon from '../../components/ui/Icon';
import { palAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { asArray } from '../../utils/asArray';

export default function PalMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupSize, setGroupSize] = useState(15);

  const load = () => palAPI.getMembers().then(r => setMembers(asArray(r.data))).finally(() => setLoading(false));
  useEffect(() => {
    load();
    try {
      const s = JSON.parse(localStorage.getItem('thankeeu_pal') || 'null');
      if (s?.group?.group_size) setGroupSize(s.group.group_size);
    } catch {}
  }, []);

  return (
    <PalLayout title="Members" subtitle={`${members.length + 1} of ${groupSize} spots used (including group owner)`}>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-warm-500">{members.filter(m=>m.status==='joined').length} joined · {members.filter(m=>m.status==='pending').length} pending</p>
        <Link to="/pals/dashboard/invite" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors">
          <Icon name="UserPlus" size={16} /> Invite Friends
        </Link>
      </div>

      {loading
        ? <div className="space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="h-16 bg-purple-50 rounded-2xl animate-pulse"/>)}</div>
        : members.length === 0
          ? <div className="text-center py-20 text-warm-400">
              <Icon name="Users" size={48} className="mx-auto mb-4 text-purple-200" />
              <p className="font-semibold">No members invited yet</p>
              <p className="text-sm mt-1">Invite up to {groupSize - 1} friends to join your group</p>
              <Link to="/pals/dashboard/invite" className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold">Invite friends</Link>
            </div>
          : <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
              <div className="divide-y divide-purple-50">
                {members.map(m => (
                  <Link key={m.id} to={`/pals/dashboard/members/${m.id}`}
                    className="px-5 py-4 flex items-center gap-4 hover:bg-purple-50/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-pink-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {m.profile_pic_url
                        ? <img src={m.profile_pic_url} className="w-full h-full object-cover" />
                        : <span className="text-sm font-bold text-primary-600">{m.name.charAt(0).toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-warm-900 text-sm">{m.name}</p>
                      <p className="text-xs text-warm-400">{m.email}{m.department ? ` · ${m.department}` : ''}{m.role ? ` · ${m.role}` : ''}</p>
                    </div>
                    {!m.profile_complete && m.status === 'joined' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-600 font-medium flex-shrink-0">Profile incomplete</span>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${m.status==='joined' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {m.status === 'joined' ? '✓ Joined' : 'Pending join'}
                    </span>
                    <Icon name="ChevronRight" size={16} className="text-warm-300 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
      }
    </PalLayout>
  );
}
