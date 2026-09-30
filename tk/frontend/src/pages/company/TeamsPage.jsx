import { useSEO } from '../../hooks/useSEO';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { occasionsAPI, subscriptionAPI, hrisAPI } from '../../utils/api';
import CompanyLayout from '../../components/company/CompanyLayout';
import toast from 'react-hot-toast';
import Icon from '../../components/ui/Icon';
import { asArray } from '../../utils/asArray';

const daysUntil = (dateStr) => {
  const today = new Date();
  const d = new Date(dateStr);
  const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next - today) / 86400000);
};

const TeamsPage = () => {
  useSEO({ title: 'Team Occasions — Thankeeu for Teams', description: 'Manage all employee occasions.', noIndex: true });
  const [types, setTypes]               = useState([]);
  const [selected, setSelected]         = useState(null);
  const [members, setMembers]           = useState([]);
  const [sub, setSub]                   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [importing, setImporting]       = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [search, setSearch]             = useState('');
  const [deptFilter, setDeptFilter]     = useState('');
  const fileRef = useRef();

  useEffect(() => {
    Promise.all([occasionsAPI.getTypes(), subscriptionAPI.get()])
      .then(([t, s]) => {
        setTypes(asArray(t.data));
        setSub(s.data);
        if (t.data?.length > 0) setSelected(t.data[0]);
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (selected) fetchMembers(); }, [selected, search, deptFilter]);

  const fetchMembers = async () => {
    setMembersLoading(true);
    try {
      const res = await occasionsAPI.getMembers(selected.id, { search, department: deptFilter });
      setMembers(asArray(res.data));
    } catch { toast.error('Failed to load members'); }
    finally { setMembersLoading(false); }
  };

  const handleDownload = async () => {
    try {
      const res = await occasionsAPI.downloadTemplate(selected.name);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `thankeeu_${selected.name}_template.xlsx`; a.click();
      URL.revokeObjectURL(url); toast.success('Template downloaded!');
    } catch { toast.error('Download failed'); }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/)) return toast.error('Upload an Excel file (.xlsx or .xls)');
    setImporting(true); setImportResult(null);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await occasionsAPI.importMembers(selected.id, fd);
      setImportResult(res.data);
      toast.success(`Imported ${res.data.imported} members!`);
      fetchMembers();
    } catch (err) { toast.error(err.response?.data?.error || 'Import failed'); }
    finally { setImporting(false); e.target.value = ''; }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove ${name}?`)) return;
    try { await occasionsAPI.deleteMember(selected.id, id); setMembers(p => p.filter(m => m.id !== id)); toast.success('Removed'); }
    catch { toast.error('Failed'); }
  };

  const isSubscribed = sub?.status === 'active';
  const departments  = [...new Set(members.map(m => m.department))].sort();
  const filtered     = members.filter(m => {
    const s = !search || `${m.first_name} ${m.last_name} ${m.email}`.toLowerCase().includes(search.toLowerCase());
    const d = !deptFilter || m.department === deptFilter;
    return s && d;
  });

  const dateColName = (name) => ({
    birthday: 'Birthday (DD-MM-YY)', leaving: 'Last Day (DD-MM-YYYY)',
    work_anniversary: 'Start Date (DD-MM-YYYY)', retirement: 'Retirement Date (DD-MM-YYYY)',
  }[name] || 'Date (DD-MM-YYYY)');

  return (
    <CompanyLayout title="Occasion Tables" subtitle="Manage employee data for each celebration occasion">
      {!loading && !isSubscribed && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800 text-sm">Import is free. Subscribe to activate automated emails.</p>
              <p className="text-xs text-amber-600 mt-0.5">Once subscribed, the system sends cards automatically for every occasion.</p>
            </div>
          </div>
          <Link to="/company/subscription" className="btn-primary text-sm py-2 px-5 whitespace-nowrap">Subscribe →</Link>
        </div>
      )}

      {/* HRIS quick sync banner */}
      <div className="bg-gradient-to-r from-blue-50 to-primary-50 border border-blue-100 rounded-3xl p-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔗</span>
          <div>
            <p className="font-semibold text-warm-800 text-sm">Connect your HRIS to auto-populate all occasion tables</p>
            <p className="text-xs text-warm-500 mt-0.5">SeamlessHR, BambooHR, Zoho People, SAP SuccessFactors, WorkPay — one sync fills everything</p>
          </div>
        </div>
        <Link to="/company/hris" className="bg-primary-400 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap flex-shrink-0">
          🔗 Connect HRIS →
        </Link>
      </div>

      {/* Occasion type tabs */}
      <div className="flex flex-wrap gap-2 mb-6 pb-1">
        {loading ? [...Array(6)].map((_, i) => <div key={i} className="h-10 w-32 bg-purple-50 rounded-xl animate-pulse flex-shrink-0" />) : (
          types.map(ot => (
            <button key={ot.id} onClick={() => { setSelected(ot); setImportResult(null); setSearch(''); setDeptFilter(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all border flex-shrink-0 ${
                selected?.id === ot.id ? 'bg-primary-400 text-white border-primary-400' : 'bg-white text-warm-600 border-purple-100 hover:border-primary-300'
              }`}>
              <span>{ot.icon}</span> {ot.label}
              {ot.member_count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${selected?.id === ot.id ? 'bg-white/20 text-white' : 'bg-purple-50 text-warm-500'}`}>
                  {ot.member_count}
                </span>
              )}
            </button>
          ))
        )}
      </div>

      {selected && (
        <>
          {/* Header row */}
          <div className="bg-white border border-purple-100 rounded-3xl p-5 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-50 rounded-3xl flex items-center justify-center text-2xl">{selected.icon}</div>
              <div>
                <h2 className="font-semibold text-warm-900">{selected.label}</h2>
                <p className="text-xs text-warm-500 mt-0.5">
                  {selected.default_scope === 'company_wide' ? 'Company-wide' : 'Department'} notifications ·
                  {selected.notify_days_before}d notice ·
                  {members.length} members
                  {selected.gender_filter ? ` · ${selected.gender_filter}s only` : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={handleDownload} className="flex items-center gap-2 border border-purple-100 bg-white text-warm-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-warm-100 transition-colors">
                📥 Template
              </button>
              <button onClick={() => fileRef.current.click()} disabled={importing}
                className="flex items-center gap-2 bg-primary-400 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-60">
                {importing ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Importing...</> : <><span>📤</span> Import Data</>}
              </button>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
            </div>
          </div>

          {/* Template guide (empty state) */}
          {!membersLoading && members.length === 0 && (
            <div className="bg-primary-50 rounded-3xl p-5 mb-5 border border-primary-100">
              <p className="text-sm font-semibold text-primary-700 mb-3">📋 {selected.label} template columns</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {['First Name', 'Last Name', 'Email Address', 'Department',
                  ...(selected.gender_filter ? ['Gender (male/female)'] : []),
                  dateColName(selected.name), 'Notes (optional)'].map(c => (
                  <span key={c} className="text-xs bg-white text-primary-600 px-2.5 py-1.5 rounded-lg border border-primary-200 font-medium">{c}</span>
                ))}
              </div>
              <p className="text-xs text-primary-500">Unlimited employees. Data import is always free.</p>
            </div>
          )}

          {/* Import result */}
          {importResult && (
            <div className="mb-5 bg-green-50 border border-green-200 rounded-3xl p-4">
              <p className="text-sm font-semibold text-green-800 mb-1">✅ {importResult.imported} imported to {selected.label}</p>
              {importResult.skipped > 0 && <p className="text-xs text-amber-600">{importResult.skipped} rows skipped</p>}
              {(importResult.row_errors || []).map((e, i) => <p key={i} className="text-xs text-red-500 mt-0.5">⚠ {e}</p>)}
            </div>
          )}

          {/* Search/filter */}
          {members.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input className="input flex-1" placeholder={`Search ${selected.label} members...`} value={search} onChange={e => setSearch(e.target.value)} />
              <select className="input sm:w-44" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                <option value="">All departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden">
            {membersLoading ? (
              <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-warm-100 rounded-xl animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-5xl mb-3">{selected.icon}</div>
                <p className="text-sm font-medium text-warm-700 mb-1">No {selected.label} data yet</p>
                <p className="text-xs text-warm-400 mb-5">Download the template, fill it in, then upload it back here</p>
                <button type="button" onClick={handleDownload} className="btn-primary inline-flex items-center gap-2 text-sm py-2.5 px-6"><Icon name="Download" size={15} />Download template</button>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-0">
                <table className="w-full" style={{minWidth:"600px"}}>
                  <thead>
                    <tr className="border-b border-purple-100 bg-warm-100">
                      {['Employee','Department','Email','Date','Days Away','Status',''].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(m => {
                      const days = daysUntil(m.occasion_date);
                      return (
                        <tr key={m.id} className="hover:bg-warm-100 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-xs font-bold flex-shrink-0">
                                {m.first_name[0]}{m.last_name[0]}
                              </div>
                              <span className="text-sm font-medium text-warm-900 whitespace-nowrap">{m.first_name} {m.last_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3"><span className="text-xs bg-primary-50 text-primary-600 px-2.5 py-1 rounded-full font-medium">{m.department}</span></td>
                          <td className="px-4 py-3 text-sm text-warm-500 max-w-[160px] truncate">{m.email}</td>
                          <td className="px-4 py-3 text-sm text-warm-700 whitespace-nowrap">
                            {new Date(m.occasion_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                              days === 0 ? 'bg-pink-100 text-pink-700' : days <= 2 ? 'bg-red-100 text-red-600' :
                              days <= 7 ? 'bg-amber-100 text-amber-600' : 'bg-purple-50 text-warm-500'
                            }`}>{days === 0 ? '🎉 Today!' : days === 1 ? 'Tomorrow' : `${days} days`}</span>
                          </td>
                          <td className="px-4 py-3">
                            {m.celebrant_notified_at
                              ? <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">✓ Sent</span>
                              : m.card_slug
                              ? <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">🔄 Active</span>
                              : <span className="text-xs text-warm-400">Pending</span>}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleDelete(m.id, `${m.first_name} ${m.last_name}`)}
                              className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors">
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </CompanyLayout>
  );
};

export default TeamsPage;
