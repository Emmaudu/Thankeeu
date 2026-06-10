import { useState, useEffect, useRef } from 'react';
import { companyAPI, occasionsAPI } from '../../utils/api';
import CompanyLayout from '../../components/company/CompanyLayout';
import toast from 'react-hot-toast';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const OCCASION_TABS = [
  {
    id: 'birthday',
    label: '🎂 Birthdays',
    desc: 'Annual birthday celebrations',
    importTitle: "🎂 Bulk import your team's Birthdays",
    importDesc: "Download the Birthday template, fill in each employee's Date of Birth, and upload to auto-populate the Birthday table.",
    filterNote: '📅 Relevant column: Date of Birth — applies to all genders.',
  },
  {
    id: 'work_anniversary',
    label: '🏆 Work Anniversaries',
    desc: 'Career milestones',
    importTitle: "🏆 Bulk import Work Anniversaries (Resumption Dates)",
    importDesc: "Download the Work Anniversary template, fill in each employee's Work Start Date (resumption date), and upload to auto-populate the Work Anniversary table.",
    filterNote: '📅 Relevant column: Work Start Date — the date each employee joined the company. Applies to all genders.',
  },
  {
    id: 'valentine',
    label: "💝 Valentine's Day",
    desc: 'Feb 14 — All',
    importTitle: "💝 Bulk import your team for Valentine's Day",
    importDesc: "Download the Valentine's Day template and list all employees to include. Valentine's Day applies to everyone — both male and female.",
    filterNote: "💝 No gender filter — Valentine's Day is for ALL employees.",
  },
  {
    id: 'womens_day',
    label: "👩 Women's Day",
    desc: "Mar 8 — Females only",
    importTitle: "👩 Bulk import your team's Women's Day list",
    importDesc: "Download the Women's Day template. Only female employees should appear here — rows where Gender ≠ female are automatically skipped.",
    filterNote: '⚠️ Gender filter: FEMALE only — Mar 8 every year.',
  },
  {
    id: 'mothers_day',
    label: "🌹 Mother's Day",
    desc: "May — Females only",
    importTitle: "🌹 Bulk import your team's Mother's Day list",
    importDesc: "Download the Mother's Day template. Only female employees should appear here — rows where Gender ≠ female are automatically skipped.",
    filterNote: "⚠️ Gender filter: FEMALE only — 2nd Sunday of May.",
  },
  {
    id: 'fathers_day',
    label: "👔 Father's Day",
    desc: "June — Males only",
    importTitle: "👔 Bulk import your team's Father's Day list",
    importDesc: "Download the Father's Day template. Only male employees should appear here — rows where Gender ≠ male are automatically skipped.",
    filterNote: "⚠️ Gender filter: MALE only — 3rd Sunday of June.",
  },
  {
    id: 'promotion',
    label: '⭐ Promotions',
    desc: 'Promotion milestones',
    importTitle: "⭐ Bulk import your team's Promotions",
    importDesc: "Download the Promotion template, fill in each employee's Promotion Date and (optionally) their new title and congratulatory message.",
    filterNote: '📅 Relevant column: Promotion Date — applies to all genders.',
  },
  {
    id: 'leaving',
    label: '👋 Farewells',
    desc: 'Leaving the company',
    importTitle: "👋 Bulk import your team's Farewell / Leaving dates",
    importDesc: "Download the Farewell template, fill in each departing employee's Last Working Day and (optionally) a farewell message.",
    filterNote: '📅 Relevant column: Last Working Day — applies to all genders.',
  },
  {
    id: 'new_hire',
    label: '🎉 New Hires',
    desc: 'Welcome onboarding',
    importTitle: "🎉 Bulk import your New Hire Start Dates",
    importDesc: "Download the New Hire template, fill in each new employee's Start Date to trigger a welcome card on their first day.",
    filterNote: '📅 Relevant column: Start Date — applies to all genders.',
  },
];

const SCOPE_OPTIONS = [
  { value: 'department', label: 'Department only' },
  { value: 'company',    label: 'Entire company' },
];

export default function OccasionsPage() {
  const [activeTab,         setActiveTab]         = useState('__general__');
  const [generalImporting,  setGeneralImporting]  = useState(false);
  const [typeScopes,        setTypeScopes]        = useState({});
  const [typeScopeLoading,  setTypeScopeLoading]  = useState(null);
  const [tables,            setTables]            = useState({});
  const [loading,           setLoading]           = useState(true);
  const [tabImporting,      setTabImporting]      = useState(false);
  const [editRow,           setEditRow]           = useState(null);
  const [editData,          setEditData]          = useState({});

  const generalFileRef  = useRef();
  const tabFileRef      = useRef();

  const tok = () => localStorage.getItem('thankeeu_company_token');

  const loadTables = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${BASE_URL}/occasions/tables`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      setTables(r.data || {});
    } catch { toast.error('Failed to load occasion tables'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTables(); }, []);

  // ── General master template ────────────────────────────────────────────────
  const handleGeneralDownload = () => {
    fetch(`${BASE_URL}/occasions/general-template`, { headers: { Authorization: `Bearer ${tok()}` } })
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
        method: 'POST', headers: { Authorization: `Bearer ${tok()}` }, body: fd,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Import failed');
      toast.success(`✅ ${d.imported} entries imported across all tables!`);
      loadTables();
    } catch (err) { toast.error(err.message || 'Import failed'); }
    finally { setGeneralImporting(false); if (generalFileRef.current) generalFileRef.current.value = ''; }
  };

  // ── Per-tab template download ──────────────────────────────────────────────
  const handleTabDownload = (occasionId) => {
    fetch(`${BASE_URL}/occasions/template/${occasionId}`, { headers: { Authorization: `Bearer ${tok()}` } })
      .then(r => r.blob()).then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `thankeeu_${occasionId}_template.xlsx`; a.click();
        URL.revokeObjectURL(url);
      }).catch(() => toast.error('Download failed'));
  };

  // ── Per-tab xlsx upload (uses import-by-name endpoint) ─────────────────────
  const handleTabImport = async (e, occasionId) => {
    const file = e.target.files?.[0]; if (!file) return;
    setTabImporting(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const r = await fetch(`${BASE_URL}/occasions/import-by-name/${occasionId}`, {
        method: 'POST', headers: { Authorization: `Bearer ${tok()}` }, body: fd,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Import failed');
      const errNote = d.errors?.length ? ` (${d.errors.length} skipped — check gender filter)` : '';
      toast.success(`✅ ${d.imported} records imported!${errNote}`);
      loadTables();
    } catch (err) { toast.error(err.message || 'Import failed'); }
    finally { setTabImporting(false); if (tabFileRef.current) tabFileRef.current.value = ''; }
  };

  const handleToggleTypeScope = async (typeId, currentScope) => {
    const newScope = currentScope === 'company' ? 'department' : 'company';
    setTypeScopeLoading(typeId);
    try {
      await fetch(`${BASE_URL}/occasions/types/${typeId}/scope`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ default_scope: newScope }),
      });
      setTypeScopes(p => ({ ...p, [typeId]: newScope }));
      toast.success(`Notifications: ${newScope === 'company' ? '🌍 All departments' : '🏢 Own department only'}`);
    } catch { toast.error('Failed to update scope'); }
    finally { setTypeScopeLoading(null); }
  };

  const saveEdit = async () => {
    if (!editRow) return;
    try {
      await axios.patch(`${BASE_URL}/occasions/members/${editRow.id}`, editData, {
        headers: { Authorization: `Bearer ${tok()}` },
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
        headers: { Authorization: `Bearer ${tok()}` },
      });
      toast.success('Deleted');
      loadTables();
    } catch { toast.error('Delete failed'); }
  };

  const toggleFarewell = async (row) => {
    try {
      await axios.patch(`${BASE_URL}/occasions/members/${row.id}`, { farewell: !row.farewell }, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      toast.success(row.farewell ? 'Farewell cancelled' : 'Farewell marked ✓');
      loadTables();
    } catch { toast.error('Failed'); }
  };

  const updateScope = async (id, scope) => {
    try {
      await axios.patch(`${BASE_URL}/occasions/members/${id}`, { notification_scope: scope }, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      toast.success('Notification scope updated');
      loadTables();
    } catch { toast.error('Failed'); }
  };

  const rows    = tables[activeTab] || [];
  const tabMeta = OCCASION_TABS.find(t => t.id === activeTab);

  return (
    <CompanyLayout title="Occasions Manager 🎉" subtitle="Manage all celebration schedules for your team">

      {/* ── Dynamic import bar — changes per tab ── */}
      {activeTab === '__general__' ? (
        /* General tab: master template */
        <div className="rounded-2xl border-2 border-primary-200 bg-primary-50 p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-primary-900 text-base">📥 Master Import — populate ALL occasion tables at once</p>
            <p className="text-sm text-primary-700 mt-0.5">
              Download the Master Template, fill in all employee info once, and upload to auto-populate every occasion table.
              Males go to Father's Day, females go to Women's &amp; Mother's Day, everyone goes to Valentine's Day.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0 flex-wrap w-full sm:w-auto">
            <button onClick={handleGeneralDownload} className="btn-secondary text-sm py-2.5 px-4 flex-1 sm:flex-none">
              📥 Download Master Template
            </button>
            <button onClick={() => generalFileRef.current?.click()} disabled={generalImporting}
              className="btn-primary text-sm py-2.5 px-4 flex-1 sm:flex-none">
              {generalImporting ? '⏳ Importing...' : '📤 Upload & Sync All'}
            </button>
            <input ref={generalFileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleGeneralImport} />
          </div>
        </div>
      ) : (
        /* Occasion-specific tab: tailored import bar */
        <div className="rounded-2xl border-2 border-primary-200 bg-primary-50 p-4 mb-6 flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-primary-900 text-base">{tabMeta?.importTitle}</p>
            <p className="text-sm text-primary-700 mt-0.5">{tabMeta?.importDesc}</p>
            {tabMeta?.filterNote && (
              <p className="text-xs text-primary-600 font-medium mt-1.5 bg-primary-100 rounded-lg px-3 py-1.5 inline-block">
                {tabMeta.filterNote}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0 flex-wrap w-full sm:w-auto sm:mt-0.5">
            <button onClick={() => handleTabDownload(activeTab)} className="btn-secondary text-sm py-2.5 px-4 flex-1 sm:flex-none">
              📥 Download Template
            </button>
            <button onClick={() => tabFileRef.current?.click()} disabled={tabImporting}
              className="btn-primary text-sm py-2.5 px-4 flex-1 sm:flex-none">
              {tabImporting ? '⏳ Importing...' : '📤 Upload & Sync'}
            </button>
            <input ref={tabFileRef} type="file" accept=".xlsx,.xls" className="hidden"
              onChange={(e) => handleTabImport(e, activeTab)} />
          </div>
        </div>
      )}

      {/* ── Occasion tabs ── */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth:'none', WebkitOverflowScrolling:'touch' }}>
        <button onClick={() => setActiveTab('__general__')}
          className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border-2 ${
            activeTab === '__general__'
              ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
              : 'border-transparent bg-purple-50 text-warm-600 hover:bg-white'
          }`}>
          📋 General (All Tables)
        </button>
        {OCCASION_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border-2 ${
              activeTab === t.id
                ? 'bg-white border-primary-400 text-primary-700 shadow-sm'
                : 'border-transparent bg-purple-50 text-warm-600 hover:bg-white'
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

      {/* ── General tab panel ── */}
      {activeTab === '__general__' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border-2 border-purple-100 p-6">
            <h3 className="font-display text-base font-bold text-warm-900 mb-2">📢 Notification Scope per Occasion</h3>
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      (typeScopes[tab.id] || 'department') === 'company'
                        ? 'bg-primary-50 border-primary-200 text-primary-600'
                        : 'bg-warm-50 border-warm-200 text-warm-600'
                    }`}>
                    {(typeScopes[tab.id] || 'department') === 'company' ? '🌍 All Depts' : '🏢 Own Dept Only'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Occasion-specific table ── */}
      {activeTab !== '__general__' && (
        <div className="bg-white rounded-2xl border-2 border-purple-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-purple-100 flex items-center justify-between">
            <div>
              <p className="font-semibold text-warm-900 text-base">{tabMeta?.label}</p>
              <p className="text-sm text-warm-400">{tabMeta?.desc} · {rows.length} records</p>
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
              <p className="text-sm text-warm-400">Download the template above, fill it in, and upload to populate this table.</p>
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
                              value={editData.occasion_date || row.occasion_date?.slice(0, 10) || ''}
                              onChange={e => setEditData(d => ({ ...d, occasion_date: e.target.value }))} />
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
                              className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 transition-all ${
                                row.farewell
                                  ? 'bg-amber-100 border-amber-300 text-amber-700'
                                  : 'bg-white border-gray-200 text-gray-500 hover:border-amber-300'
                              }`}>
                              {row.farewell ? '👋 Farewell YES' : '○ Not yet'}
                            </button>
                          </td>
                        )}
                        {activeTab === 'promotion' && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {Array.from({ length: 10 }).map((_, i) => (
                                  <div key={i} className={`w-3 h-3 rounded-sm ${i < (meta.promotion_level || 0) ? 'bg-amber-400' : 'bg-gray-200'}`} />
                                ))}
                              </div>
                              <span className="text-xs text-warm-600">Lvl {meta.promotion_level || 0}</span>
                              <select
                                value={meta.promotion_level || 0}
                                onChange={e => axios.patch(`${BASE_URL}/occasions/members/${row.id}`,
                                  { promotion_level: Number(e.target.value) },
                                  { headers: { Authorization: `Bearer ${tok()}` } }
                                ).then(loadTables)}
                                className="text-xs border border-purple-200 rounded px-1 py-0.5">
                                {Array.from({ length: 11 }).map((_, i) => <option key={i} value={i}>Level {i}</option>)}
                              </select>
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <>
                                <button onClick={saveEdit}
                                  className="text-xs text-green-600 font-semibold px-2.5 py-1.5 rounded-lg bg-green-50 hover:bg-green-100">Save</button>
                                <button onClick={() => { setEditRow(null); setEditData({}); }}
                                  className="text-xs text-gray-500 px-2 py-1.5">Cancel</button>
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
      )}
    </CompanyLayout>
  );
}
