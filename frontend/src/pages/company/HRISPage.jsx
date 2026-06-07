import { useSEO } from '../../hooks/useSEO';
import { useState, useEffect } from 'react';
import { hrisAPI } from '../../utils/api';
import CompanyLayout from '../../components/company/CompanyLayout';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const PROVIDERS = [
  {
    id:       'seamlesshr',
    name:     'SeamlessHR',
    logo:     '🔵',
    color:    'bg-blue-50 border-blue-200',
    desc:     'Leading HR platform',
    fields:   [{ key: 'api_key', label: 'API Key', type: 'password', help: 'Found in SeamlessHR Settings → API Access' }],
    popular:  true,
  },
  {
    id:       'bamboohr',
    name:     'BambooHR',
    logo:     '🟢',
    color:    'bg-green-50 border-green-200',
    desc:     'Popular global HRIS used by growing companies',
    fields:   [
      { key: 'subdomain', label: 'Company Subdomain', type: 'text', placeholder: 'e.g. mycompany (from mycompany.bamboohr.com)', help: 'Your BambooHR subdomain' },
      { key: 'api_key',   label: 'API Key',            type: 'password', help: 'BambooHR → Account → API Keys → Add API Key' },
    ],
  },
  {
    id:       'zoho_people',
    name:     'Zoho People',
    logo:     '🔴',
    color:    'bg-red-50 border-red-200',
    desc:     'Comprehensive HR suite for businesses of all sizes',
    fields:   [
      { key: 'api_key',      label: 'Client ID',     type: 'text',     help: 'Zoho API Console → Client ID' },
      { key: 'api_secret',   label: 'Client Secret', type: 'password', help: 'Zoho API Console → Client Secret' },
      { key: 'access_token', label: 'Access Token',  type: 'password', help: 'OAuth 2.0 access token from Zoho' },
    ],
  },
  {
    id:       'workpay',
    name:     'WorkPay',
    logo:     '🟡',
    color:    'bg-yellow-50 border-yellow-200',
    desc:     'Pan-African HR & payroll platform',
    fields:   [{ key: 'api_key', label: 'API Key', type: 'password', help: 'WorkPay Dashboard → Settings → API Keys' }],
  },
  {
    id:       'sap_successfactors',
    name:     'SAP SuccessFactors',
    logo:     '🔷',
    color:    'bg-sky-50 border-sky-200',
    desc:     'Enterprise-grade HR platform from SAP',
    fields:   [
      { key: 'company_code', label: 'Company ID',    type: 'text',     help: 'Your SuccessFactors Company ID' },
      { key: 'api_key',      label: 'Username',      type: 'text',     help: 'SuccessFactors API username' },
      { key: 'api_secret',   label: 'Password',      type: 'password', help: 'SuccessFactors API password' },
      { key: 'base_url',     label: 'Data Center URL',type:'text',     placeholder:'https://api4.successfactors.com', help: 'Your SuccessFactors data center URL' },
    ],
  },
];

const STATUS_STYLES = {
  success: 'bg-green-100 text-green-700',
  partial: 'bg-amber-100 text-amber-700',
  failed:  'bg-red-100 text-red-600',
  never:   'bg-purple-50 text-warm-500',
  running: 'bg-blue-100 text-blue-700',
};

const HRISPage = () => {
  useSEO({ title: 'HRIS Integration — Thankeeu for Teams', noIndex: true });

  const [connections, setConnections] = useState([]);
  const [logs, setLogs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [formData, setFormData]       = useState({});
  const [autoSync, setAutoSync]       = useState(false);
  const [syncing, setSyncing]         = useState(null);
  const [testing, setTesting]         = useState(null);
  const [saving, setSaving]           = useState(false);
  const [testResult, setTestResult]   = useState(null);
  const [syncResult, setSyncResult]   = useState(null);
  const [tab, setTab]                 = useState('integrations');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [connRes, logRes] = await Promise.all([hrisAPI.getConnections(), hrisAPI.getSyncLogs()]);
      setConnections(connRes.data || []);
      setLogs(logRes.data || []);
    } catch { toast.error('Failed to load HRIS data'); }
    finally { setLoading(false); }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await hrisAPI.saveConnection({
        provider:     selectedProvider.id,
        display_name: selectedProvider.name,
        auto_sync:    autoSync,
        ...formData,
      });
      toast.success(`${selectedProvider.name} connection saved!`);
      setSelectedProvider(null);
      setFormData({});
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save connection');
    } finally { setSaving(false); }
  };

  const handleTest = async (connectionId, name) => {
    setTesting(connectionId);
    setTestResult(null);
    try {
      const res = await hrisAPI.testConnection(connectionId);
      setTestResult({ id: connectionId, ...res.data });
      toast.success(`${name} connected successfully!`);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to connect to ${name}`);
      setTestResult({ id: connectionId, error: err.response?.data?.error || 'Connection failed' });
    } finally { setTesting(null); }
  };

  const handleSync = async (connectionId, name) => {
    setSyncing(connectionId);
    setSyncResult(null);
    try {
      const res = await hrisAPI.syncHRIS(connectionId);
      setSyncResult({ id: connectionId, ...res.data });
      toast.success(`${name} sync complete! ${res.data.total_employees} employees processed.`);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || `Sync failed for ${name}`);
    } finally { setSyncing(null); }
  };

  const handleDelete = async (connectionId, name) => {
    if (!confirm(`Disconnect ${name}? Your previously synced data will remain.`)) return;
    try {
      await hrisAPI.deleteConnection(connectionId);
      toast.success(`${name} disconnected`);
      setConnections(prev => prev.filter(c => c.id !== connectionId));
    } catch { toast.error('Failed to disconnect'); }
  };

  const connectedProviderIds = connections.map(c => c.provider);

  return (
    <CompanyLayout title="HRIS Integration" subtitle="Connect your HR system to auto-populate all celebration occasion tables">

      {/* Tabs */}
      <div className="flex gap-0 border-b border-purple-100 mb-6">
        {[
          { id: 'integrations', label: '🔗 Integrations' },
          { id: 'sync_history', label: `📋 Sync History (${logs.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-primary-500 text-primary-600 font-bold' : 'border-transparent text-warm-500 hover:text-warm-800'
            }`}>{t.label}</button>
        ))}
      </div>

      {/* ── Integrations tab ── */}
      {tab === 'integrations' && (
        <>
          {/* How it works banner */}
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100 rounded-3xl p-5 mb-6">
            <p className="font-semibold text-primary-800 mb-2">🚀 How HRIS sync works</p>
            <div className="grid sm:grid-cols-4 gap-3 text-xs text-primary-700">
              {[
                { n: '1', t: 'Connect',   d: 'Enter your HRIS API credentials below and test the connection' },
                { n: '2', t: 'Test',      d: 'Verify the connection fetches employee data correctly' },
                { n: '3', t: 'Sync once', d: 'One click populates Birthday, Anniversary, Women\'s Day, Men\'s Day, Valentine\'s, Workers\' Day, and Promotions tables' },
                { n: '4', t: 'Auto-sync', d: 'Enable daily auto-sync to keep data current as employees join or leave' },
              ].map(s => (
                <div key={s.n} className="bg-white/60 rounded-xl p-3">
                  <div className="w-6 h-6 bg-primary-400 text-white rounded-full flex items-center justify-center text-xs font-bold mb-1">{s.n}</div>
                  <p className="font-semibold">{s.t}</p>
                  <p className="text-primary-600 leading-relaxed mt-0.5">{s.d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What gets synced */}
          <div className="bg-white border border-purple-100 rounded-3xl p-5 mb-6">
            <p className="font-semibold text-warm-800 mb-3 text-sm">📊 What gets populated from a single HRIS sync</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {[
                { icon: '🎂', table: 'Birthday',     rule: 'All employees with DOB' },
                { icon: '🏆', table: 'Work Anniversary', rule: 'Based on hire date (yearly)' },
                { icon: '👩', table: "Women's Day",  rule: 'Female employees only (Mar 8)' },
                { icon: '👨', table: "Men's Day",    rule: 'Male employees only (Nov 19)' },
                { icon: '💝', table: "Valentine's Day", rule: 'All employees (Feb 14)' },
                { icon: '✊', table: "Workers' Day", rule: 'All employees (May 1)' },
                { icon: '🌟', table: 'Promotions',   rule: 'Employees with recent promo date' },
                { icon: '🎉', table: 'New Hire Welcome', rule: 'New employees starting within 30 days' },
                { icon: '👋', table: 'Farewell/Leaving', rule: 'Employees leaving within 90 days' },
                { icon: '🔕', table: 'Deactivation', rule: 'Terminated employees are muted' },
              ].map(r => (
                <div key={r.table} className="bg-warm-100 rounded-xl p-2.5 flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">{r.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-warm-800">{r.table}</p>
                    <p className="text-xs text-warm-500 leading-tight mt-0.5">{r.rule}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Connected providers */}
          {connections.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-warm-700 mb-3">Connected integrations</p>
              <div className="space-y-3">
                {connections.map(conn => {
                  const provider = PROVIDERS.find(p => p.id === conn.provider) || {};
                  return (
                    <div key={conn.id} className="bg-white border border-purple-100 rounded-3xl overflow-hidden">
                      <div className="flex items-center gap-4 px-5 py-4">
                        <div className={`w-12 h-12 rounded-3xl border-2 ${provider.color || 'bg-warm-100 border-purple-100'} flex items-center justify-center text-2xl flex-shrink-0`}>
                          {provider.logo || '🔗'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-semibold text-warm-900 text-sm">{conn.display_name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conn.is_verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              {conn.is_verified ? '✓ Verified' : '⚠ Unverified'}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[conn.last_sync_status] || STATUS_STYLES.never}`}>
                              {conn.last_sync_status === 'success' ? `✓ Last sync: ${conn.last_sync_count} employees` :
                               conn.last_sync_status === 'failed' ? '✕ Last sync failed' :
                               conn.last_sync_status === 'partial' ? '⚠ Partial sync' : 'Never synced'}
                            </span>
                          </div>
                          <p className="text-xs text-warm-400">
                            {conn.last_synced_at ? `Last synced ${format(new Date(conn.last_synced_at), 'MMM d, yyyy · h:mm a')}` : 'Not yet synced'}
                            {conn.auto_sync ? ' · Auto-sync ON' : ''}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => handleTest(conn.id, conn.display_name)} disabled={testing === conn.id}
                            className="text-xs border border-purple-100 text-warm-600 hover:bg-warm-100 px-3 py-2 rounded-xl transition-colors disabled:opacity-50">
                            {testing === conn.id ? <span className="flex items-center gap-1"><span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />Testing...</span> : 'Test'}
                          </button>
                          <button onClick={() => handleSync(conn.id, conn.display_name)} disabled={syncing === conn.id}
                            className="text-xs bg-primary-400 text-white hover:bg-primary-600 px-3 py-2 rounded-xl transition-colors disabled:opacity-50 font-medium">
                            {syncing === conn.id ? <span className="flex items-center gap-1"><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Syncing...</span> : '↻ Sync now'}
                          </button>
                          <button onClick={() => handleDelete(conn.id, conn.display_name)}
                            className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors">
                            Disconnect
                          </button>
                        </div>
                      </div>

                      {/* Sync result inline */}
                      {syncResult?.id === conn.id && (
                        <div className="border-t border-purple-100 bg-green-50 px-5 py-4">
                          <p className="text-sm font-semibold text-green-800 mb-3">
                            ✅ Sync complete — {syncResult.total_employees} employees processed
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            {[
                              { label: 'Birthday', val: syncResult.synced?.birthday },
                              { label: 'Work Anniversary', val: syncResult.synced?.anniversary },
                              { label: "Women's Day", val: syncResult.synced?.womens_day },
                              { label: "Men's Day", val: syncResult.synced?.mens_day },
                              { label: "Valentine's Day", val: syncResult.synced?.valentines },
                              { label: "Workers' Day", val: syncResult.synced?.workers_day },
                              { label: 'Promotions', val: syncResult.synced?.promotions },
                              { label: 'Deactivated', val: syncResult.synced?.deactivated },
                            ].map(s => (
                              <div key={s.label} className="bg-white rounded-lg px-3 py-2">
                                <p className="font-semibold text-warm-800">{s.val ?? 0}</p>
                                <p className="text-warm-500">{s.label}</p>
                              </div>
                            ))}
                          </div>
                          {syncResult.errors?.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-semibold text-amber-700 mb-1">Warnings ({syncResult.errors.length}):</p>
                              {syncResult.errors.slice(0, 5).map((e, i) => (
                                <p key={i} className="text-xs text-amber-600">⚠ {e}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Test result inline */}
                      {testResult?.id === conn.id && !syncResult && (
                        <div className={`border-t border-purple-100 px-5 py-4 ${testResult.error ? 'bg-red-50' : 'bg-green-50'}`}>
                          {testResult.error
                            ? <p className="text-sm text-red-600">✕ {testResult.error}</p>
                            : (
                              <div>
                                <p className="text-sm font-semibold text-green-800 mb-2">
                                  ✓ Connected — {testResult.total_employees} employees found
                                </p>
                                {testResult.sample?.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {testResult.sample.map((s, i) => (
                                      <div key={i} className="bg-white rounded-lg px-3 py-1.5 text-xs">
                                        <span className="font-medium text-warm-800">{s.name}</span>
                                        <span className="text-warm-400 ml-1">({s.department})</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available providers to connect */}
          <p className="text-sm font-semibold text-warm-700 mb-3">
            {connections.length > 0 ? 'Add another integration' : 'Connect your HRIS'}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROVIDERS.map(p => {
              const isConnected = connectedProviderIds.includes(p.id);
              const isSelected  = selectedProvider?.id === p.id;
              return (
                <div key={p.id} className={`relative rounded-3xl border-2 transition-all ${isSelected ? 'border-primary-400' : isConnected ? 'border-green-300' : 'border-purple-100 hover:border-purple-200'}`}>
                  {p.popular && !isConnected && (
                    <div className="absolute -top-3 left-4 bg-primary-400 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Popular worldwide
                    </div>
                  )}
                  {isConnected && (
                    <div className="absolute -top-3 left-4 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      ✓ Connected
                    </div>
                  )}
                  <button
                    className="w-full p-5 text-left"
                    onClick={() => {
                      if (isSelected) { setSelectedProvider(null); setFormData({}); }
                      else { setSelectedProvider(p); setFormData({}); setTestResult(null); setSyncResult(null); }
                    }}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{p.logo}</span>
                      <p className="font-semibold text-warm-900">{p.name}</p>
                    </div>
                    <p className="text-xs text-warm-500 leading-relaxed">{p.desc}</p>
                  </button>

                  {/* Expanded connection form */}
                  {isSelected && (
                    <form onSubmit={handleConnect} className="border-t border-purple-100 p-5 space-y-3 bg-warm-100 rounded-b-2xl">
                      {p.fields.map(field => (
                        <div key={field.key}>
                          <label className="block text-xs font-medium text-warm-700 mb-1">{field.label}</label>
                          <input
                            type={field.type}
                            className="input text-sm"
                            placeholder={field.placeholder || ''}
                            value={formData[field.key] || ''}
                            onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                            required
                            autoComplete="off"
                          />
                          {field.help && <p className="text-xs text-warm-400 mt-1">{field.help}</p>}
                        </div>
                      ))}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setAutoSync(!autoSync)}
                            className={`w-10 h-5 rounded-full transition-colors relative ${autoSync ? 'bg-primary-400' : 'bg-gray-300'}`}>
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${autoSync ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </button>
                          <span className="text-xs text-warm-600">Daily auto-sync</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => { setSelectedProvider(null); setFormData({}); }} className="btn-secondary flex-1 text-sm py-2">Cancel</button>
                        <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm py-2">
                          {saving ? 'Saving...' : 'Save & continue'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Sync History tab ── */}
      {tab === 'sync_history' && (
        <div className="space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white rounded-3xl border border-purple-100 animate-pulse" />)
          ) : logs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-purple-100 p-12 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-sm text-warm-500">No sync history yet</p>
              <p className="text-xs text-warm-400 mt-1">Connect an HRIS provider and run a sync to see history here</p>
            </div>
          ) : logs.map(log => (
            <div key={log.id} className="bg-white rounded-3xl border border-purple-100 p-5">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                  log.status === 'success' ? 'bg-green-100' :
                  log.status === 'failed'  ? 'bg-red-100' :
                  log.status === 'partial' ? 'bg-amber-100' : 'bg-blue-100'
                }`}>
                  {log.status === 'success' ? '✅' : log.status === 'failed' ? '❌' : log.status === 'running' ? '🔄' : '⚠️'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-warm-900 text-sm capitalize">{log.provider?.replace('_', ' ')}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[log.status]}`}>{log.status}</span>
                    {log.duration_ms && <span className="text-xs text-warm-400">{(log.duration_ms / 1000).toFixed(1)}s</span>}
                  </div>
                  <p className="text-xs text-warm-400 mb-3">
                    {format(new Date(log.started_at), 'MMM d, yyyy · h:mm a')}
                    {log.total_employees > 0 ? ` · ${log.total_employees} employees` : ''}
                  </p>
                  {log.status !== 'failed' && log.total_employees > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {[
                        ['🎂', 'Birthday',     log.birthday_synced],
                        ['🏆', 'Anniversary',  log.anniversary_synced],
                        ['👩', "Women's Day",  log.womens_day_synced],
                        ['👨', "Men's Day",    log.mens_day_synced],
                        ['💝', "Valentine's",  log.valentines_synced],
                        ['✊', "Workers' Day", log.workers_day_synced],
                        ['🌟', 'Promotions',   log.promotions_synced],
                        ['🎉', 'New Hire',      log.new_hire_synced],
                        ['👋', 'Farewell',      log.leaving_synced],
                        ['🔕', 'Deactivated',  log.deactivated_count],
                      ].map(([icon, label, val]) => (
                        <div key={label} className="text-center">
                          <p className="text-sm font-bold text-warm-800">{val ?? 0}</p>
                          <p className="text-xs text-warm-500 leading-tight">{icon} {label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {log.errors?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-amber-600">{log.error_count} warning(s): {log.errors[0]}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </CompanyLayout>
  );
};

export default HRISPage;
