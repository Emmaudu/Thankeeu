import { useState, useEffect, useRef } from 'react';
import { companyAPI, occasionsAPI } from '../../utils/api';
import CompanyLayout from '../../components/company/CompanyLayout';
import toast from 'react-hot-toast';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const OCCASION_TABS = [
  { id:'birthday',         label:'🎂 Birthdays',        desc:'Annual birthday celebrations' },
  { id:'work_anniversary', label:'🏆 Work Anniversaries', desc:'Career milestones' },
  { id:'valentine',        label:'💝 Valentine\'s Day',  desc:'Feb 14 — All' },
  { id:'womens_day',       label:'👩 Women\'s Day',      desc:'Mar 8 — Females' },
  { id:'mothers_day',      label:'🌹 Mother\'s Day',     desc:'May — Females' },
  { id:'fathers_day',      label:'👔 Father\'s Day',     desc:'June — Males' },
  { id:'promotion',        label:'⭐ Promotions',         desc:'Level-based milestones' },
  { id:'leaving',          label:'👋 Farewells',          desc:'Leaving the company' },
  { id:'new_hire',         label:'🎉 New Hires',         desc:'Welcome onboarding' },
];

const SCOPE_OPTIONS = [
  { value:'department', label:'Department only' },
  { value:'company',    label:'Entire company' },
];

export default function OccasionsPage() {
  const [activeTab, setActiveTab] = useState('__general__'); // Start on General tab
  const [generalImporting, setGeneralImporting] = useState(false);
  const [typeScopes, setTypeScopes]   = useState({}); // occasionTypeId -> scope
  const [typeScopeLoading, setTypeScopeLoading] = useState(null);
  const generalFileRef = useRef();
  const [tables, setTables]       = useState({});
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing]     = useState(false);
  const [editRow, setEditRow]     = useState(null);
  const [editData, setEditData]   = useState({});
  const fileRef = useRef();

  const tok = () => localStorage.getItem('thankeeu_company_token');

  const loadTables = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${BASE_URL}/occasions/tables`, {
        headers: { Authorization: `Bearer ${tok()}` }
      });
      setTables(r.data || {});
    } catch (e) {
      toast.error('Failed to load occasion tables');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadTables(); }, []);


  const handleGeneralDownload = () => {
    fetch(`${BASE_URL}/occasions/general-template`, { headers:{ Authorization:`Bearer ${tok()}` } })
      .then(r => r.blob()).then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'thankeeu_master_template.xlsx'; a.click();
        URL.revokeObjectURL(url);
      }).catch(() => toast.error('Download failed'));
  };

  const handleGeneralImport = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setGeneralImporting(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const r = await fetch(`${BASE_URL}/occasions/import-general`, {
        method:'POST', headers:{ Authorization:`Bearer ${tok()}` }, body: fd,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Import failed');
      toast.success(`✅ ${d.imported} employees imported across all tables!`);
      loadTables();
    } catch (err) { toast.error(err.message || 'Import failed'); }
    finally { setGeneralImporting(false); if (generalFileRef.current) generalFileRef.current.value=''; }
  };

  const handleToggleTypeScope = async (typeId, currentScope) => {
    const newScope = currentScope === 'company' ? 'department' : 'company';
    setTypeScopeLoading(typeId);
    try {
      await fetch(`${BASE_URL}/occasions/types/${typeId}/scope`, {
        method:'PUT', headers:{ Authorization:`Bearer ${tok()}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ default_scope: newScope }),
      });
      setTypeScopes(p => ({ ...p, [typeId]: newScope }));
      toast.success(`Notifications: ${newScope === 'company' ? '🌍 All departments' : '🏢 Own department only'}`);
    } catch { toast.error('Failed to update scope'); }
    finally { setTypeScopeLoading(null); }
  };

  const handleDownloadTemplate = () => {
    const a = document.createElement('a');
    a.href = `${BASE_URL}/occasions/bulk-template`;
    a.download = 'thankeeu-team-import-template.xlsx';
    // Add auth header via anchor doesn't work — use fetch
    fetch(a.href, { headers:{ Authorization:`Bearer ${tok()}` } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        a.href = url; a.click(); URL.revokeObjectURL(url);
      }).catch(() => toast.error('Download failed'));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Parse CSV
      const text = await file.text();
      const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
      if (lines.length < 2) { toast.error('CSV is empty or only has headers'); return; }
      const headers = lines[0].split(',').map(h => h.trim());
      const employees = lines.slice(1).map(line => {
        const vals = line.split(',');
        return Object.fromEntries(headers.map((h, i) => [h, vals[i]?.trim() || '']));
      }).filter(e => e.email && e.first_name);

      toast(`Parsed ${employees.length} employees. Syncing...`);
      setSyncing(true);

      const r = await axios.post(`${BASE_URL}/occasions/bulk-sync`, { employees }, {
        headers: { Authorization:`Bearer ${tok()}`, 'Content-Type':'application/json' }
      });

      toast.success(r.data.message || 'Sync complete!');
      loadTables();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Sync failed');
    } finally { setUploading(false); setSyncing(false); e.target.value = ''; }
  };

  const saveEdit = async () => {
    if (!editRow) return;
    try {
      await axios.patch(`${BASE_URL}/occasions/members/${editRow.id}`, editData, {
        headers: { Authorization:`Bearer ${tok()}` }
      });
      toast.success('Saved');
      setEditRow(null); setEditData({});
      loadTables();
    } catch { toast.error('Save failed'); }
  };

  const deleteRow = async (id) => {
    if (!confirm('Remove this record?')) return;
    try {
      await axios.delete(`${BASE_URL}/occasions/members/${id}/bulk`, {
        headers: { Authorization:`Bearer ${tok()}` }
      });
      toast.success('Deleted');
      loadTables();
    } catch { toast.error('Delete failed'); }
  };

  const toggleFarewell = async (row) => {
    try {
      await axios.patch(`${BASE_URL}/occasions/members/${row.id}`, { farewell: !row.farewell }, {
        headers: { Authorization:`Bearer ${tok()}` }
      });
      toast.success(row.farewell ? 'Farewell cancelled' : 'Farewell marked ✓');
      loadTables();
    } catch { toast.error('Failed'); }
  };

  const updateScope = async (id, scope) => {
    try {
      await axios.patch(`${BASE_URL}/occasions/members/${id}`, { notification_scope: scope }, {
        headers: { Authorization:`Bearer ${tok()}` }
      });
      toast.success('Notification scope updated');
      loadTables();
    } catch { toast.error('Failed'); }
  };

  const rows = tables[activeTab] || [];
  const tab  = OCCASION_TABS.find(t => t.id === activeTab);

  return (
    <CompanyLayout title="Occasions Manager 🎉" subtitle="Manage all celebration schedules for your team">

      {/* Bulk import bar */}
      <div className="rounded-2xl border-2 border-primary-200 bg-primary-50 p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-primary-900 text-base">📥 Bulk import your team</p>
          <p className="text-sm text-primary-700 mt-0.5">Download our CSV template, fill in your team's info, and upload to auto-populate all occasion tables.</p>
        </div>
        <div className="flex gap-2 flex-shrink-0 flex-wrap">
          <button onClick={handleDownloadTemplate} className="btn-secondary text-sm py-2.5 px-4">
            📥 Download template
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="btn-primary text-sm py-2.5 px-4">
            {uploading ? '⏳ Syncing...' : '📤 Upload & sync'}
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />
        </div>
      </div>

      {/* Occasion tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth:'none' }}>
        <button onClick={() => setActiveTab('__general__')}
            className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border-2 ${
              activeTab === '__general__' ? 'bg-primary-500 text-white border-primary-500 shadow-sm' : 'border-transparent bg-purple-50 text-warm-600 hover:bg-white'
            }`}>
            📋 General (All Tables)
          </button>
          {OCCASION_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border-2 ${
              activeTab === t.id ? 'bg-white border-primary-400 text-primary-700 shadow-sm' : 'border-transparent bg-purple-50 text-warm-600 hover:bg-white'
            }`}>
            {t.label}
            {(tables[t.id]?.length > 0) && (
              <span className="ml-2 text-xs bg-primary-100 text-primary-600 px-1.5 py-0.5 rounded-full font-bold">
                {tables[t.id].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* General tab panel */}
      {activeTab === '__general__' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border-2 border-purple-100 p-6">
            <h3 className="font-display text-base font-bold text-warm-900 mb-2">📋 Master Import Template</h3>
            <p className="text-warm-500 text-sm mb-5 leading-relaxed">
              Download the master Excel workbook. Fill in your team's info once and upload to automatically populate <strong>all occasion tables</strong> — Birthday, Women's Day, Men's Day, Valentine's Day, and more. Males auto-populate Father's/Men's Day. Females auto-populate Women's Day. Everyone gets Valentine's Day.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={handleGeneralDownload} className="btn-primary text-sm py-2.5 px-5">📥 Download Master Template</button>
              <button onClick={() => generalFileRef.current?.click()} disabled={generalImporting} className="btn-secondary text-sm py-2.5 px-5">
                {generalImporting ? '⏳ Importing...' : '📤 Upload & Sync All Tables'}
              </button>
              <input ref={generalFileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleGeneralImport} />
            </div>
          </div>
          <div className="bg-white rounded-2xl border-2 border-purple-100 p-6">
            <h3 className="font-display text-base font-bold text-warm-900 mb-1">📢 Notification Scope per Occasion</h3>
            <p className="text-warm-500 text-sm mb-4">Control who receives reminder emails for each occasion type.</p>
            <div className="divide-y divide-purple-50">
              {OCCASION_TABS.map(tab => (
                <div key={tab.id} className="flex items-center gap-3 py-3">
                  <span className="text-xl">{tab.label.split(' ')[0]}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-warm-800">{tab.label.replace(/^[^ ]+ /, '')}</p>
                    <p className="text-xs text-warm-400">{tab.desc}</p>
                  </div>
                  <button
                    disabled={typeScopeLoading === tab.id}
                    onClick={() => handleToggleTypeScope(tab.id, typeScopes[tab.id] || 'department')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${(typeScopes[tab.id]||'department') === 'company' ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-warm-50 border-warm-200 text-warm-600'}`}>
                    {(typeScopes[tab.id]||'department') === 'company' ? '🌍 All Depts' : '🏢 Own Dept Only'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab !== '__general__' && (
      <div>{/* Table */}
      <div className="bg-white rounded-2xl border-2 border-purple-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-purple-100 flex items-center justify-between">
          <div>
            <p className="font-semibold text-warm-900 text-base">{tab?.label}</p>
            <p className="text-sm text-warm-400">{tab?.desc} · {rows.length} records</p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="font-semibold text-warm-900 text-base mb-1">No records yet</p>
            <p className="text-sm text-warm-400">Upload the bulk import template to populate this table.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-purple-50 text-xs font-semibold text-warm-500 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Employee</th>
                  <th className="text-left px-4 py-3">Department</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Notify scope</th>
                  {activeTab === 'leaving'   && <th className="text-left px-4 py-3">Farewell</th>}
                  {activeTab === 'promotion' && <th className="text-left px-4 py-3">Level</th>}
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {rows.map(row => {
                  const meta = typeof row.meta === 'string' ? JSON.parse(row.meta || '{}') : (row.meta || {});
                  const isEditing = editRow?.id === row.id;
                  return (
                    <tr key={row.id} className="hover:bg-purple-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-600 flex-shrink-0">
                            {row.first_name?.[0]}{row.last_name?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-warm-900 truncate">{row.first_name} {row.last_name}</p>
                            <p className="text-xs text-warm-400 truncate">{row.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-warm-600">{row.department}</td>
                      <td className="px-4 py-3 text-sm text-warm-700 font-medium">
                        {isEditing ? (
                          <input type="date" className="input text-sm py-1.5"
                            value={editData.occasion_date || row.occasion_date?.slice(0,10) || ''}
                            onChange={e => setEditData(d=>({...d, occasion_date: e.target.value}))} />
                        ) : row.occasion_date?.slice(0, 10) || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={row.notification_scope || 'department'}
                          onChange={e => updateScope(row.id, e.target.value)}
                          className="text-sm border border-purple-200 rounded-lg px-2 py-1.5 bg-white text-warm-700 font-medium">
                          {SCOPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </td>
                      {activeTab === 'leaving' && (
                        <td className="px-4 py-3">
                          <button onClick={() => toggleFarewell(row)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 transition-all ${row.farewell ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-white border-gray-200 text-gray-500 hover:border-amber-300'}`}>
                            {row.farewell ? '👋 Farewell YES' : '○ Not yet'}
                          </button>
                        </td>
                      )}
                      {activeTab === 'promotion' && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {Array.from({length:10}).map((_,i) => (
                                <div key={i} className={`w-3 h-3 rounded-sm ${i < (meta.promotion_level||0) ? 'bg-amber-400' : 'bg-gray-200'}`} />
                              ))}
                            </div>
                            <span className="text-xs text-warm-600">Lvl {meta.promotion_level || 0}</span>
                            <select
                              value={meta.promotion_level || 0}
                              onChange={e => axios.patch(`${BASE_URL}/occasions/members/${row.id}`, { promotion_level: Number(e.target.value) }, { headers:{Authorization:`Bearer ${tok()}`} }).then(loadTables)}
                              className="text-xs border border-purple-200 rounded px-1 py-0.5">
                              {Array.from({length:11}).map((_,i) => <option key={i} value={i}>Level {i}</option>)}
                            </select>
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <button onClick={saveEdit} className="text-xs text-green-600 font-semibold px-2.5 py-1.5 rounded-lg bg-green-50 hover:bg-green-100">Save</button>
                              <button onClick={() => { setEditRow(null); setEditData({}); }} className="text-xs text-gray-500 px-2 py-1.5">Cancel</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setEditRow(row); setEditData({}); }}
                                className="text-xs text-primary-600 font-semibold px-2.5 py-1.5 rounded-lg bg-primary-50 hover:bg-primary-100">Edit</button>
                              <button onClick={() => deleteRow(row.id)}
                                className="text-xs text-red-500 font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100">Delete</button>
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
      </div>)}
    </CompanyLayout>
  );
}
