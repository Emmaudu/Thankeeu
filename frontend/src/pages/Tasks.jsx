import { useState, useEffect, useCallback, useRef } from 'react';
import SEO, { makeItemListSchema } from '../components/seo/SEO';
import { useSearchParams, useLocation } from 'react-router-dom';
import { marketFromPath } from '../utils/market';
import { useCountryContent } from '../components/country/content';
import CountrySEO from '../components/country/CountrySEO';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { tasksApi } from '../utils/api';
import TaskCard from '../components/ui/TaskCard';
import { clsx } from 'clsx';

const TASK_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'pickup_delivery', label: 'Pickup & Delivery' },
  { value: 'location_only', label: 'On-Location' },
  { value: 'purchase_ship', label: 'Purchase & Ship' },
  { value: 'general', label: 'General' },
];
const NIGERIAN_STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT Abuja','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 space-y-3 border border-gray-100">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
      <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
      <div className="h-3 w-5/6 bg-gray-100 rounded animate-pulse" />
    </div>
  );
}

export default function Tasks() {
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const debounceRef = useRef(null);
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [state, setState] = useState(searchParams.get('state') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [remoteOnly, setRemoteOnly] = useState(searchParams.get('remote') === '1');
  const [page, setPage] = useState(1);
  const activeFilters = [city, state, type, remoteOnly].filter(Boolean).length;
  // Each country site lists only its own tasks (Nigeria at /tasks, the UK at /uk/tasks ...).
  const mk = marketFromPath(useLocation().pathname);
  const intl = !!mk.slug;
  const countryContent = useCountryContent(mk.slug || 'none');
  const regions = intl ? (countryContent?.regions || []) : NIGERIAN_STATES;

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 18, status: 'open,bidding,ongoing' };
      if (search) params.search = search;
      if (city) params.city = city;
      if (state) params.state = state;
      if (type) params.type = type;
      if (intl) params.country = mk.slug;
      if (remoteOnly) params.remote = '1';
      const { data } = await tasksApi.list(params);
      setTasks(data.tasks || []);
      setPagination(data.pagination || {});
    } catch (err) {
      console.error('Failed to load tasks:', err?.response?.data?.message || err?.message);
      setTasks([]);
    } finally { setLoading(false); }
  }, [search, city, state, type, page, remoteOnly, intl, mk.slug]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // Scroll to top whenever page changes
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [page]);
  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setCity('');
    setState('');
    setType('');
    setRemoteOnly(false);
    setPage(1);
  };

  const handleSearchChange = (val) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 400);
  };

  return (
    <>
      {intl
        ? <CountrySEO market={mk} title={`Browse Open Tasks in ${mk.name} | Taskeeu`} description={`See tasks posted by people in ${mk.name}: moving help, cleaning, assembly, gardening, errands and remote work. Bid free and get paid in ${mk.currency}.`} path={`/${mk.slug}/tasks`} alternatesPath="/tasks" />
        : <SEO title="Browse Tasks Across Africa | Find Gigs Near You" description="Browse hundreds of open tasks across Africa. Start earning today." canonical="https://taskeeu.com/tasks" />}
      <div className="pt-20 min-h-screen" style={{ background: 'var(--surface)' }}>

        {/* Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="container-xl py-8">
            <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
              <div>
                <h1 className="text-3xl font-extrabold" style={{ color: 'var(--dark)' }}>{intl ? `Open tasks in ${mk.name}` : 'Browse Open Tasks'}</h1>
                <p className="text-gray-500 mt-1">
                  {pagination.total ? `${pagination.total.toLocaleString()} open tasks across ${intl ? mk.name : 'Africa'}` : 'Find tasks near you and start earning'}
                </p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search tasks…" value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (debounceRef.current) clearTimeout(debounceRef.current);
                        setSearch(searchInput);
                        setPage(1);
                      }
                    }}
                    className="input pl-9 py-2.5" />
                </div>
                <button onClick={() => { if (debounceRef.current) clearTimeout(debounceRef.current); setSearch(searchInput); setPage(1); }} className="btn-primary btn-sm">Search</button>
                <button onClick={() => setFilterOpen(!filterOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm transition-colors" style={filterOpen || activeFilters > 0
                    ? { background: 'var(--loveeu-rose-l)', borderColor: 'var(--loveeu-rose)', color: 'var(--loveeu-rose)' }
                    : { background: 'white', borderColor: '#e5e7eb', color: '#4b5563' }}>
                  <SlidersHorizontal size={16} />
                  Filters
                  {activeFilters > 0 && (
                    <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center" style={{ background: 'var(--loveeu-rose)' }}>{activeFilters}</span>
                  )}
                </button>
              </div>
            </div>

            {filterOpen && (
              <div className="mt-5 p-5 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label">{intl ? mk.cityLabel : 'City'}</label>
                    <input type="text" placeholder={intl ? '' : 'e.g. Lagos, Ikeja…'} value={city} onChange={(e) => setCity(e.target.value)} className="input py-2.5" />
                  </div>
                  <div>
                    <label className="label">{intl ? mk.regionLabel : 'State'}</label>
                    <select value={state} onChange={(e) => setState(e.target.value)} className="input py-2.5">
                      <option value="">{intl ? 'All' : 'All States'}</option>
                      {regions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Task Type</label>
                    <select value={type} onChange={(e) => setType(e.target.value)} className="input py-2.5">
                      {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2 mt-4 text-sm font-semibold" style={{ color: 'var(--text-2)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={remoteOnly} onChange={(e) => { setRemoteOnly(e.target.checked); setPage(1); }} style={{ accentColor: 'var(--rose)', width: 16, height: 16 }} />
                  Remote tasks only (can be done online)
                </label>
                <div className="flex items-center gap-3 mt-4">
                  <button onClick={() => { setPage(1); loadTasks(); setFilterOpen(false); }} className="btn-primary btn-sm">Apply Filters</button>
                  {activeFilters > 0 && (
                    <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700">
                      <X size={14} /> Clear All
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Task grid */}
        <div className="container-xl py-10">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(9)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-4"></div>
              <h3 className="text-xl font-extrabold text-gray-700 mb-2">No tasks found</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">Try adjusting your filters. New tasks are posted every day!</p>
              <button onClick={clearFilters} className="btn-primary btn-sm">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {tasks.map(task => <TaskCard key={task.id} task={task} />)}
              </div>
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300 disabled:opacity-40 transition-colors">
                    ← Prev
                  </button>
                  {[...Array(Math.min(pagination.pages, 7))].map((_, i) => (
                    <button key={i + 1} onClick={() => setPage(i + 1)}
                      className="w-10 h-10 rounded-xl text-sm font-semibold transition-colors border" style={page === i + 1
                        ? { background: 'var(--loveeu-rose)', color: 'white', borderColor: 'var(--loveeu-rose)' }
                        : { borderColor: '#e5e7eb', color: '#4b5563' }}>
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300 disabled:opacity-40 transition-colors">
                    Next →
                  </button>
                </div>
              )}
              <p className="text-center text-gray-400 text-sm mt-4">Showing {tasks.length} of {pagination.total} tasks</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
