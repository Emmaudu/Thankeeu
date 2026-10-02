import { useState, useEffect } from 'react';
import { Download, Filter, Eye, MapPin, Clock, CheckCircle, X } from 'lucide-react';
import { certificationsApi, teamsApi } from '../../utils/api';
import { format } from 'date-fns';
import { clsx } from 'clsx';

export default function FileHistory({ companyId }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [departments, setDepartments] = useState([]);
  const [preview, setPreview] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    department_id: '', from_date: '', to_date: '', approved: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30 };
      if (filters.department_id) params.department_id = filters.department_id;
      if (filters.from_date) params.from_date = filters.from_date;
      if (filters.to_date) params.to_date = filters.to_date;
      if (filters.approved !== '') params.approved = filters.approved;

      const { data } = await certificationsApi.getFileHistory(companyId, params);
      setFiles(data.files || []);
      setPagination(data.pagination || {});
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    if (companyId) load();
  }, [companyId, page, filters]);

  useEffect(() => {
    if (companyId) {
      teamsApi.getDepartments(companyId).then(r => setDepartments(r.data.departments || [])).catch(() => {});
    }
  }, [companyId]);

  const PROOF_TYPE_LABELS = {
    gps_photo: 'GPS Photo', timestamp_photo: 'Timestamp Photo',
    video: 'Video', document: 'Document',
    gps_selfie: 'GPS Selfie', site_photo: 'Site Photo',
    before: '⬅️ Before', during: 'During', after: 'After',
    receipt: 'Receipt', other: 'Other',
  };

  // Group by task for display
  const taskGroups = files.reduce((acc, f) => {
    const key = f.enterprise_task_id;
    if (!acc[key]) acc[key] = { task_title: f.task_title, task_type: f.task_type_name, completed_at: f.task_completed_at, files: [] };
    acc[key].files.push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-heading font-bold text-lg text-dark">Task File History</h3>
          <p className="text-muted text-xs mt-0.5">All proof uploads from taskers for audit purposes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className={clsx('flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors',
              showFilters ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-white border-gray-200 text-gray-600')}>
            <Filter size={14}/> Filters
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-4 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="label text-xs">Department</label>
              <select value={filters.department_id} onChange={e => setFilters(f => ({...f, department_id: e.target.value}))} className="input py-2 text-sm">
                <option value="">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">From Date</label>
              <input type="date" value={filters.from_date} onChange={e => setFilters(f => ({...f, from_date: e.target.value}))} className="input py-2 text-sm"/>
            </div>
            <div>
              <label className="label text-xs">To Date</label>
              <input type="date" value={filters.to_date} onChange={e => setFilters(f => ({...f, to_date: e.target.value}))} className="input py-2 text-sm"/>
            </div>
            <div>
              <label className="label text-xs">Proof Status</label>
              <select value={filters.approved} onChange={e => setFilters(f => ({...f, approved: e.target.value}))} className="input py-2 text-sm">
                <option value="">All Proofs</option>
                <option value="true">Approved Only</option>
                <option value="false">Rejected Only</option>
              </select>
            </div>
          </div>
          <button onClick={() => setFilters({ department_id:'', from_date:'', to_date:'', approved:'' })}
            className="text-xs text-red-500 hover:text-red-700 mt-3 flex items-center gap-1">
            <X size={12}/> Clear All Filters
          </button>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Files', value: pagination.total || 0, emoji: '' },
          { label: 'Approved', value: files.filter(f => f.is_approved === true).length, emoji: '' },
          { label: 'Pending Review', value: files.filter(f => f.is_approved === null || f.is_approved === undefined).length, emoji: '⏳' },
        ].map(s => (
          <div key={s.label} className="card p-3 text-center">
            <div className="text-xl mb-1">{s.emoji}</div>
            <p className="font-heading font-bold text-lg text-dark">{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* File list */}
      {loading ? (
        <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-rose-200 border-t-rose-500 rounded-full animate-spin"/></div>
      ) : files.length === 0 ? (
        <div className="empty-state py-14">
          <div className="text-5xl mb-3"></div>
          <h3 className="font-heading font-bold text-gray-700 mb-1">No files yet</h3>
          <p className="text-muted text-sm">Proof files uploaded by taskers will appear here for audit</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(taskGroups).map(([taskId, group]) => (
            <div key={taskId} className="card overflow-hidden">
              {/* Task header */}
              <div className="px-5 py-3 bg-surface border-b border-gray-100">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{group.task_title}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted">
                      {group.task_type && <span>{group.task_type}</span>}
                      {group.completed_at && (
                        <span className="flex items-center gap-1">
                          <Clock size={11}/> Completed {(group.completed_at ? format(new Date(group.completed_at), 'MMM d, yyyy HH:mm') : '—')}
                        </span>
                      )}
                      <span>{group.files.length} file{group.files.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Files grid */}
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {group.files.map(file => (
                    <div key={file.proof_id}
                      className="group relative rounded-xl overflow-hidden border border-gray-200 hover:border-rose-300 transition-all cursor-pointer bg-gray-50" onClick={() => setPreview(file)}>
                      {/* Thumbnail */}
                      <div className="aspect-square relative">
                        {(file.proof_type === 'gps_photo' || file.proof_type === 'gps_selfie' || file.proof_type === 'site_photo' || file.proof_type === 'before' || file.proof_type === 'during' || file.proof_type === 'after') ? (
                          <img src={file.file_url} alt={file.proof_type} className="w-full h-full object-cover"/>
                        ) : file.proof_type === 'video' ? (
                          <video src={file.file_url} className="w-full h-full object-cover"/>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-100"></div>
                        )}
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye size={20} className="text-white"/>
                        </div>
                        {/* Status badge */}
                        <div className="absolute top-1.5 right-1.5">
                          {file.is_approved === true && (
                            <span className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center"><CheckCircle size={12} className="text-white"/></span>
                          )}
                          {file.is_approved === false && (
                            <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center"><X size={12} className="text-white"/></span>
                          )}
                          {(file.is_approved === null || file.is_approved === undefined) && (
                            <span className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-white text-xs font-bold">?</span>
                          )}
                        </div>
                      </div>
                      {/* File meta */}
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-700 truncate">{file.tasker_name}</p>
                        <p className="text-xs text-muted truncate">{PROOF_TYPE_LABELS[file.proof_type] || file.proof_type}</p>
                        {file.taken_at && (
                          <p className="text-xs text-muted">{(file.taken_at ? format(new Date(file.taken_at), 'MMM d, HH:mm') : '—')}</p>
                        )}
                        {file.gps_lat && (
                          <p className="text-xs text-rose-600 flex items-center gap-0.5 mt-0.5">
                            <MapPin size={10}/>{parseFloat(file.gps_lat).toFixed(4)}, {parseFloat(file.gps_lng).toFixed(4)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40 hover:border-rose-300 transition-colors">← Prev</button>
              <span className="text-sm text-muted">{page} / {pagination.pages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p+1))} disabled={page===pagination.pages}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40 hover:border-rose-300 transition-colors">Next →</button>
            </div>
          )}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <p className="font-semibold text-gray-800">{PROOF_TYPE_LABELS[preview.proof_type]}</p>
                <p className="text-xs text-muted">by {preview.tasker_name}</p>
              </div>
              <button onClick={() => setPreview(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"></button>
            </div>

            <div className="relative">
              {preview.proof_type === 'video' ? (
                <video src={preview.file_url} controls className="w-full max-h-80 object-contain bg-black"/>
              ) : (
                <img src={preview.file_url} alt="proof" className="w-full max-h-80 object-contain bg-gray-50"/>
              )}
            </div>

            <div className="p-4 space-y-2 bg-surface">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted">Tasker</p>
                  <p className="font-medium text-gray-800">{preview.tasker_name}</p>
                  <p className="text-xs text-muted">{preview.tasker_email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Upload Time</p>
                  <p className="font-medium text-gray-800">{(preview.uploaded_at ? format(new Date(preview.uploaded_at), 'MMM d, yyyy') : '—')}</p>
                  <p className="text-xs text-muted">{(preview.uploaded_at ? format(new Date(preview.uploaded_at), 'HH:mm:ss') : '—')}</p>
                </div>
              </div>
              {preview.gps_lat && (
                <div className="p-2 bg-rose-50 rounded-lg">
                  <p className="text-xs text-rose-700 font-semibold flex items-center gap-1">
                    <MapPin size={12}/> GPS Location
                  </p>
                  <p className="text-xs text-rose-600">{preview.gps_address || `${parseFloat(preview.gps_lat).toFixed(6)}, ${parseFloat(preview.gps_lng).toFixed(6)}`}</p>
                </div>
              )}
              {preview.caption && (
                <div>
                  <p className="text-xs text-muted">Caption</p>
                  <p className="text-sm text-gray-700 italic">"{preview.caption}"</p>
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className={clsx('badge text-xs',
                  preview.is_approved === true ? 'badge-green' : preview.is_approved === false ? 'badge-red' : 'badge-yellow')}>
                  {preview.is_approved === true ? 'Approved' : preview.is_approved === false ? 'Rejected' : '⏳ Pending'}
                </span>
                <a href={preview.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-medium hover:bg-rose-100 transition-colors">
                  <Download size={12}/> Download Original
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
