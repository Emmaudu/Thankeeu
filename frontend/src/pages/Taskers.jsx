import { cpath } from '../utils/market';
import { useState, useEffect, useCallback, useRef } from 'react';
import SEO from '../components/seo/SEO';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Star, MapPin } from 'lucide-react';
import { taskersApi } from '../utils/api';
import TaskerCard from '../components/ui/TaskerCard';
import { clsx } from 'clsx';

const NIGERIAN_STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT Abuja','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];

const SKILLS_LIST = ['Delivery','Errand','Shopping','Courier','Logistics','Photography','Cleaning','Tech','Printing','Banking','Admin','Pickup'];

function SkeletonCard() {
  return (
    <>
    <div className="card p-5 space-y-4">
      <div className="flex gap-4">
        <div className="skeleton w-14 h-14 rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
          <div className="skeleton h-3 w-2/3" />
        </div>
      </div>
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-4/5" />
      <div className="flex gap-2">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
        <div className="skeleton h-6 w-14 rounded-full" />
      </div>
    </div>
  
    </>);
}

export default function Taskers() {
  const [searchParams] = useSearchParams();
  const [taskers, setTaskers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [search, setSearch]           = useState(searchParams.get('search') || '');
  const debounceRef = useRef(null);
  const [cityInput, setCityInput]   = useState(searchParams.get('city') || '');
  const [city, setCity]             = useState(searchParams.get('city') || '');
  const [state, setState]           = useState(searchParams.get('state') || '');
  const [sort, setSort]             = useState('rating');
  const [page, setPage]             = useState(1);
  const cityDebounceRef             = useRef(null);

  const activeFilters = [city, state].filter(Boolean).length;

  const loadTaskers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 18, sort };
      if (search) params.search = search;
      if (city) params.city = city;
      if (state) params.state = state;
      const { data } = await taskersApi.list(params);
      setTaskers(data.taskers || []);
      setPagination(data.pagination || {});
    } catch (err) {
      console.error('Failed to load taskers:', err?.response?.data?.message || err?.message);
      setTaskers([]);
    } finally { setLoading(false); }
  }, [search, city, state, sort, page]);

  useEffect(() => { loadTaskers(); }, [loadTaskers]);

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setCityInput('');
    setCity('');
    setState('');
    setPage(1);
  };

  const handleSearchChange = (val) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 400);
  };

  const handleCityChange = (val) => {
    setCityInput(val);
    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
    cityDebounceRef.current = setTimeout(() => { setCity(val); setPage(1); }, 400);
  };

  return (
      <>
      <SEO
        title="Find Verified Taskers Across Africa" description="Hire KYC-verified, background-checked taskers across Africa. Trusted field agents for deliveries, errands, inspections, verifications and more. All rated and reviewed." canonical="https://taskeeu.com/taskers" keywords="verified taskers Africa  hire field agents, delivery agents, KYC agents, trusted taskers" breadcrumbs={[{name:'Home',url:'https://taskeeu.com'},{name:'Find Taskers',url:'https://taskeeu.com/taskers'}]}
      />
    <div className="pt-20 min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-xl py-8">
          <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold text-dark">Find Taskers </h1>
              <p className="text-muted mt-1">
                {pagination.total
                  ? `${pagination.total.toLocaleString()} verified taskers across Africa`
                  : 'Browse verified, KYC-approved taskers near you'}
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" placeholder="Search by name, city, skill..." value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (debounceRef.current) clearTimeout(debounceRef.current);
                      setSearch(searchInput);
                      setPage(1);
                    }
                  }}
                  className="input pl-9 py-2.5"/>
              </div>
              <button onClick={() => { if (debounceRef.current) clearTimeout(debounceRef.current); setSearch(searchInput); setPage(1); }} className="btn-primary btn-sm">Search</button>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm transition-colors',
                  filterOpen || activeFilters > 0
                    ? 'bg-rose-50 border-rose-300 text-rose-700': 'bg-white border-gray-200 text-gray-600 hover:border-gray-300')}
              >
                <SlidersHorizontal size={16} />
                Filters
                {activeFilters > 0 && (
                  <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center">
                    {activeFilters}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filter panel */}
          {filterOpen && (
            <div className="mt-5 p-5 bg-surface rounded-2xl border border-gray-200 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">City</label>
                  <input
                    type="text" placeholder="e.g. Lekki, Wuse..." value={cityInput}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="input py-2.5"/>
                </div>
                <div>
                  <label className="label">State</label>
                  <select value={state} onChange={(e) => setState(e.target.value)} className="input py-2.5">
                    <option value="">All States</option>
                    {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Sort By</label>
                  <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="input py-2.5">
                    <option value="rating">Highest Rating</option>
                    <option value="tasks">Most Tasks Done</option>
                    <option value="newest">🆕 Newest Members</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button onClick={() => { setPage(1); setFilterOpen(false); }} className="btn-primary btn-sm">
                  Apply Filters
                </button>
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

      {/* Trust banner */}
      <div style={{background:"var(--loveeu-rose)"}}>
        <div className="container-xl py-3">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1 text-white text-sm">
            <span>Full KYC Verified</span>
            <span>Photo ID Checked</span>
            <span>Address Confirmed</span>
            <span>Bank Details on File</span>
            <span>Community Rated</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container-xl py-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(9)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : taskers.length === 0 ? (
          <div className="empty-state">
            <div className="text-6xl mb-4"></div>
            <h3 className="font-heading text-xl font-bold text-gray-700 mb-2">No taskers found</h3>
            <p className="text-muted mb-6 max-w-sm">
              Try a different city or state. Our tasker network is growing every day!
            </p>
            <button onClick={clearFilters} className="btn-outline btn-sm">Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {taskers.map((tasker) => (
                <TaskerCard key={tasker.user_id || tasker.id} tasker={tasker} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300 disabled:opacity-40 transition-colors">
                  ← Prev
                </button>
                {[...Array(Math.min(pagination.pages, 7))].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={clsx(
                      'w-10 h-10 rounded-xl text-sm font-semibold transition-colors',
                      page === i + 1
                        ? 'bg-rose-500 text-white': 'border border-gray-200 text-gray-600 hover:border-gray-300')}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300 disabled:opacity-40 transition-colors">
                  Next →
                </button>
              </div>
            )}
            <p className="text-center text-muted text-sm mt-4">
              Showing {taskers.length} of {pagination.total || 0} taskers
            </p>
          </>
        )}
      </div>

      {/* Become a tasker CTA */}
      <div className="container-xl pb-16">
        <div className="rounded-3xl bg-gradient-to-br from-dark to-gray-800 p-10 text-center">
          <div className="text-5xl mb-4"></div>
          <h2 className="font-heading text-2xl font-bold text-white mb-3">Want to earn as a tasker?</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Join thousands of verified taskers earning money by helping people across Africa.
          </p>
          <Link to={cpath("/tasker/signup")} className="btn-primary btn-lg">
            Apply as a Tasker
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
