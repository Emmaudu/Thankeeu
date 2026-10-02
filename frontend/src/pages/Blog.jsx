import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Clock, Eye, ArrowRight, BookOpen } from 'lucide-react';
import { blogApi } from '../utils/api';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import SEO from '../components/seo/SEO';

const CATEGORY_COLORS = {
  'Product News':    { pill: 'bg-rose-100 text-rose-700',   dot: '#ff2d62' },
  'For Taskers':     { pill: 'bg-blue-100 text-blue-700',   dot: '#3b82f6' },
  'For Businesses':  { pill: 'bg-violet-100 text-violet-700', dot: '#8b5cf6' },
  'Africa Insights': { pill: 'bg-orange-100 text-orange-700', dot: '#f97316' },
  'How-to Guides':   { pill: 'bg-amber-100 text-amber-700', dot: '#f59e0b' },
  'Comparisons':     { pill: 'bg-teal-100 text-teal-700',   dot: '#14b8a6' },
  'Guides':          { pill: 'bg-green-100 text-green-700', dot: '#22c55e' },
  'Safety & Health': { pill: 'bg-red-100 text-red-700',     dot: '#ef4444' },
  'General':         { pill: 'bg-gray-100 text-gray-600',   dot: '#9ca3af' },
};
const getCat = (cat) => CATEGORY_COLORS[cat] || CATEGORY_COLORS['General'];

// ── Hero / Featured card ─────────────────────────────────────────────
function FeaturedCard({ post }) {
  const cat = getCat(post.category);
  return (
    <Link to={`/blog/${post.slug}`} className="group block relative overflow-hidden rounded-3xl bg-dark" style={{ minHeight: 400 }}>
      {post.cover_image_url ? (
        <img src={post.cover_image_url} alt={post.cover_image_alt || post.title}
          className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-opacity duration-500" onError={(e) => { e.target.style.display = 'none'; }} />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-rose-700 to-rose-500 opacity-80" />
      )}
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="relative h-full flex flex-col justify-end p-8 md:p-10" style={{ minHeight: 400 }}>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20">
            Featured
          </span>
          <span className={clsx('text-xs font-bold px-3 py-1.5 rounded-full', cat.pill)}>
            {post.category}
          </span>
        </div>
        <h2 className="font-heading text-2xl md:text-3xl font-black text-white leading-tight mb-3 group-hover:text-rose-200 transition-colors" style={{ maxWidth: 640 }}>
          {post.title}
        </h2>
        <p className="text-gray-300 text-sm leading-relaxed mb-5 line-clamp-2" style={{ maxWidth: 560 }}>
          {post.excerpt}
        </p>
        <div className="flex items-center gap-4 text-gray-400 text-xs">
          <span className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold text-xs">
              {(post.author_name || 'T')[0]}
            </div>
            {post.author_name || 'Taskeeu Team'}
          </span>
          {post.published_at && (
            <span>{format(new Date(post.published_at), 'MMM d, yyyy')}</span>
          )}
          <span className="flex items-center gap-1"><Clock size={11} /> {post.reading_time_minutes} min read</span>
          {post.views > 0 && <span className="flex items-center gap-1"><Eye size={11} /> {post.views.toLocaleString()}</span>}
        </div>
      </div>
    </Link>
  );
}

// ── Regular post card ────────────────────────────────────────────────
function PostCard({ post }) {
  const cat = getCat(post.category);
  return (
    <Link to={`/blog/${post.slug}`}
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300" style={{ boxShadow: '0 1px 8px rgba(18,9,26,0.06)' }}>
      {/* Image */}
      <div className="relative overflow-hidden bg-gray-100" style={{ height: 200 }}>
        {post.cover_image_url ? (
          <img src={post.cover_image_url} alt={post.cover_image_alt || post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
        ) : null}
        <div className="w-full h-full items-center justify-center bg-gradient-to-br from-rose-50 to-rose-100" style={{ display: post.cover_image_url ? 'none' : 'flex', position: post.cover_image_url ? 'absolute' : 'static', inset: 0 }}>
          <div className="text-center">
            <BookOpen size={32} className="text-rose-300 mx-auto mb-2" />
            <p className="text-xs text-rose-300 font-medium">{post.category}</p>
          </div>
        </div>
        <div className="absolute top-3 left-3">
          <span className={clsx('text-xs font-bold px-2.5 py-1 rounded-full', cat.pill)}>
            {post.category}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        <h2 className="font-heading font-bold text-gray-900 text-base leading-snug mb-2.5 group-hover:text-rose-600 transition-colors line-clamp-2">
          {post.title}
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 flex-1 mb-4">
          {post.excerpt}
        </p>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Clock size={11} /> {post.reading_time_minutes} min</span>
            {post.published_at && (
              <span>{format(new Date(post.published_at), 'MMM d')}</span>
            )}
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold text-rose-500 group-hover:gap-2 transition-all">
            Read <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="bg-gray-200" style={{ height: 200 }} />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-gray-200 rounded-full w-20" />
        <div className="h-4 bg-gray-200 rounded-full w-full" />
        <div className="h-4 bg-gray-200 rounded-full w-4/5" />
        <div className="h-3 bg-gray-100 rounded-full w-3/5" />
      </div>
    </div>
  );
}

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts]               = useState([]);
  const [categories, setCategories]     = useState([]);
  const [pagination, setPagination]     = useState({ total: 0, pages: 0, page: 1 });
  const [loading, setLoading]           = useState(true);
  const [searchInput, setSearchInput]   = useState(searchParams.get('search') || '');

  const activeCategory = searchParams.get('category') || '';
  const activeTag      = searchParams.get('tag')      || '';
  const activePage     = parseInt(searchParams.get('page') || '1');
  const activeSearch   = searchParams.get('search')   || '';

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params = { page: activePage, limit: 9 };
      if (activeCategory) params.category = activeCategory;
      if (activeTag)      params.tag = activeTag;
      if (activeSearch)   params.search = activeSearch;
      const [postsRes, catsRes] = await Promise.all([
        blogApi.listPosts(params),
        categories.length === 0 ? blogApi.getCategories() : Promise.resolve({ data: { categories } }),
      ]);
      setPosts(postsRes.data.posts || []);
      setPagination(postsRes.data.pagination || {});
      if (categories.length === 0) setCategories(catsRes.data.categories || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadPosts(); }, [activeCategory, activeTag, activeSearch, activePage]);

  const setFilter = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  const handleSearch = (e) => { e.preventDefault(); setFilter('search', searchInput); };
  const clearFilters = () => { setSearchInput(''); setSearchParams({}); };
  const hasFilters = activeCategory || activeTag || activeSearch;
  const featuredPost  = !hasFilters && activePage === 1 ? (posts.find(p => p.featured) || null) : null;
  const regularPosts  = featuredPost ? posts.filter(p => p.id !== featuredPost.id) : posts;

  const seoTitle = activeCategory
    ? `${activeCategory} | Taskeeu Blog`
    : activeSearch
    ? `"${activeSearch}" | Taskeeu Blog`
    : 'Taskeeu Blog | Errand Service Guides, Tips & News for Nigeria';

  const seoDesc = "Errand service guides, how-to articles, and insights from Taskeeu, Nigeria's #1 errand marketplace. Lagos, Abuja, Port Harcourt & all 36 states.";

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDesc}
        canonical="https://taskeeu.com/blog" keywords="errand service Nigeria blog, errand runner Lagos guide, how to hire errand runner Nigeria, errand services list Nigeria, task outsourcing Nigeria" breadcrumbs={[
          { name: 'Home', url: 'https://taskeeu.com' },
          { name: 'Blog', url: 'https://taskeeu.com/blog' },
        ]}
      />

      <div className="pt-20 min-h-screen" style={{ background: '#faf9fc' }}>

        {/* ── Header ───────────────────────────────────────── */}
        <div style={{ background: 'white', borderBottom: '1px solid #f0ecf8', paddingTop: 48, paddingBottom: 48 }}>
          <div className="container-xl">
            <div className="flex flex-col md:flex-row md:items-end gap-6 justify-between">
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-widest text-rose-500 mb-3">Taskeeu Blog
                </span>
                <h1 className="font-heading text-3xl md:text-4xl font-black text-dark leading-tight mb-3" style={{ letterSpacing: '-0.03em' }}>
                  Insights for Africa's<br className="hidden md:block" /> Gig Economy
                </h1>
                <p className="text-gray-500 leading-relaxed" style={{ maxWidth: 480 }}>
                  Tips for taskers, enterprise guides, market analysis, and platform updates: everything for Nigeria's field operations economy.
                </p>
              </div>
              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="search" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                    placeholder="Search articles..." className="input pl-10 py-2.5 text-sm w-full" />
                </div>
                <button type="submit" className="btn-primary px-5 py-2.5 text-sm whitespace-nowrap">Search</button>
              </form>
            </div>
          </div>
        </div>

        <div className="container-xl py-10 md:py-14">
          <div className="flex flex-col lg:flex-row gap-8 xl:gap-12">

            {/* ── Sidebar ───────────────────────────────────── */}
            <aside className="lg:w-60 xl:w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-5">

                {/* Categories */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow: '0 1px 8px rgba(18,9,26,0.05)' }}>
                  <h3 className="font-heading font-bold text-gray-800 text-sm mb-4 uppercase tracking-wide" style={{ letterSpacing: '0.06em', fontSize: 11 }}>
                    Categories
                  </h3>
                  <div className="space-y-0.5">
                    <button onClick={() => setFilter('category', '')}
                      className={clsx('w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between',
                        !activeCategory ? 'bg-rose-50 text-rose-700' : 'text-gray-600 hover:bg-gray-50')}>
                      <span>All Posts</span>
                      {pagination.total > 0 && <span className="text-xs text-gray-400 tabular-nums">{pagination.total}</span>}
                    </button>
                    {categories.map(cat => (
                      <button key={cat.slug} onClick={() => setFilter('category', cat.name)}
                        className={clsx('w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between',
                          activeCategory === cat.name ? 'bg-rose-50 text-rose-700' : 'text-gray-600 hover:bg-gray-50')}>
                        <span className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: getCat(cat.name).dot }} />
                          {cat.name}
                        </span>
                        {cat.post_count > 0 && (
                          <span className="text-xs text-gray-400 tabular-nums">{cat.post_count}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active filters */}
                {hasFilters && (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                    <p className="font-bold text-xs text-amber-700 mb-2.5 uppercase tracking-wide" style={{ fontSize: 10 }}>Active Filters</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {activeCategory && (
                        <span className="flex items-center gap-1 bg-white text-rose-700 text-xs px-2.5 py-1 rounded-full border border-rose-200 font-medium">
                          {activeCategory}
                          <button onClick={() => setFilter('category', '')} className="hover:text-rose-900 ml-0.5"></button>
                        </span>
                      )}
                      {activeTag && (
                        <span className="flex items-center gap-1 bg-white text-blue-700 text-xs px-2.5 py-1 rounded-full border border-blue-200 font-medium">
                          #{activeTag}
                          <button onClick={() => setFilter('tag', '')} className="hover:text-blue-900 ml-0.5"></button>
                        </span>
                      )}
                      {activeSearch && (
                        <span className="flex items-center gap-1 bg-white text-amber-700 text-xs px-2.5 py-1 rounded-full border border-amber-200 font-medium">
                          "{activeSearch}"<button onClick={() => { setSearchInput(''); setFilter('search', ''); }} className="hover:text-amber-900 ml-0.5"></button>
                        </span>
                      )}
                    </div>
                    <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-semibold">
                      Clear all
                    </button>
                  </div>
                )}

                {/* CTA */}
                <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a0d2e 0%, #2d1148 100%)' }}>
                  <div className="p-5">
                    <p className="font-heading font-black text-white text-sm mb-1">For Businesses</p>
                    <p className="text-gray-400 text-xs leading-relaxed mb-4">
                      Deploy field agents across Nigeria with GPS-verified proof of work.
                    </p>
                    <Link to="/teams" className="flex items-center justify-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors">
                      Explore for Teams <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>

              </div>
            </aside>

            {/* ── Main ─────────────────────────────────────── */}
            <main className="flex-1 min-w-0">

              {/* Results count */}
              {hasFilters && !loading && (
                <p className="text-sm text-gray-500 mb-6">
                  <span className="font-semibold text-gray-700">{pagination.total || 0} {pagination.total === 1 ? 'post' : 'posts'}</span>
                  {activeCategory && <> in <span className="text-rose-600 font-semibold">"{activeCategory}"</span></>}
                  {activeSearch && <> matching <span className="text-rose-600 font-semibold">"{activeSearch}"</span></>}
                  {activeTag && <> tagged <span className="text-rose-600 font-semibold">#{activeTag}</span></>}
                </p>
              )}

              {loading ? (
                <div className="space-y-8">
                  <div className="rounded-3xl bg-gray-200 animate-pulse" style={{ height: 400 }} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                  </div>
                </div>
              ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
                    <BookOpen size={28} className="text-gray-300" />
                  </div>
                  <h3 className="font-heading font-bold text-gray-700 text-lg mb-2">No posts found</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    {hasFilters ? 'Try adjusting your filters.' : 'No posts published yet.'}
                  </p>
                  {hasFilters && (
                    <button onClick={clearFilters} className="btn-outline btn-sm">Clear Filters</button>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Featured hero */}
                  {featuredPost && (
                    <FeaturedCard post={featuredPost} />
                  )}

                  {/* Regular grid */}
                  {regularPosts.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {regularPosts.map(post => <PostCard key={post.id} post={post} />)}
                    </div>
                  )}

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <button onClick={() => setFilter('page', String(activePage - 1))} disabled={activePage === 1}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-rose-300 disabled:opacity-40 transition-colors">
                        ← Prev
                      </button>
                      {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setFilter('page', String(p))}
                          className={clsx('w-10 h-10 rounded-xl text-sm font-semibold transition-colors',
                            p === activePage ? 'bg-rose-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-rose-300')}>
                          {p}
                        </button>
                      ))}
                      <button onClick={() => setFilter('page', String(activePage + 1))} disabled={activePage === pagination.pages}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-rose-300 disabled:opacity-40 transition-colors">
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
