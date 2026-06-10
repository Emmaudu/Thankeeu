import { useState, useEffect } from 'react';
import CompanyLayout from '../../components/company/CompanyLayout';
import { companyAxios } from '../../utils/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ACTION_ICONS = {
  created: '✨', updated: '✏️', deleted: '🗑️', approved: '✅',
  rejected: '❌', invited: '📨', imported: '📥', subscribed: '💳',
  transferred: '➡️', signed: '✍️', delivered: '📬', logged_in: '🔐',
};

const ACTOR_COLORS = {
  hr: 'bg-purple-100 text-purple-700',
  core_team: 'bg-blue-100 text-blue-700',
  member: 'bg-warm-100 text-warm-500',
};

export default function ActivityLogPage() {
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('');
  const [actorFilter, setActorFilter] = useState('');

  useEffect(() => {
    companyAxios.get('/activity-log?limit=200')
      .then(r => setLogs(r.data || []))
      .catch(() => toast.error('Failed to load activity log'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    (!filter     || l.action?.toLowerCase().includes(filter.toLowerCase()) || l.entity_name?.toLowerCase().includes(filter.toLowerCase())) &&
    (!actorFilter || l.actor_type === actorFilter)
  );

  return (
    <CompanyLayout title="Activity Log 📋" subtitle="Track all actions by HR and Core Team">
      <div className="flex flex-wrap gap-3 mb-6">
        <input className="input text-sm w-full sm:flex-1 sm:min-w-48" placeholder="🔍 Search action or name…"
          value={filter} onChange={e => setFilter(e.target.value)} />
        <select className="input text-sm w-auto" value={actorFilter} onChange={e => setActorFilter(e.target.value)}>
          <option value="">All actors</option>
          <option value="hr">HR only</option>
          <option value="core_team">Core Team only</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_,i)=><div key={i} className="h-14 rounded-xl animate-pulse bg-purple-50"/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-purple-100">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-warm-500">No activity recorded yet. Actions will appear here as HR and Core Team use the dashboard.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
          <div className="divide-y divide-purple-50">
            {filtered.map(log => (
              <div key={log.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-purple-50/30 transition-colors">
                <span className="text-xl flex-shrink-0 mt-0.5">{ACTION_ICONS[log.action?.split('_')[0]] || '📌'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${ACTOR_COLORS[log.actor_type] || ACTOR_COLORS.member}`}>
                      {log.actor_type?.replace('_',' ')}
                    </span>
                    <p className="text-sm text-warm-800">
                      <strong>{log.actor_name}</strong>{' '}
                      <span className="text-warm-600">{log.action?.replace(/_/g,' ')}</span>
                      {log.entity_name && <span className="text-warm-900"> <strong>{log.entity_name}</strong></span>}
                    </p>
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <p className="text-xs text-warm-400 mt-0.5 break-words">
                      {Object.entries(log.details).map(([k,v]) => `${k}: ${v}`).join(' · ')}
                    </p>
                  )}
                </div>
                <span className="text-xs text-warm-400 flex-shrink-0 whitespace-nowrap">
                  {log.created_at ? format(new Date(log.created_at), 'MMM d, h:mm a') : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </CompanyLayout>
  );
}
