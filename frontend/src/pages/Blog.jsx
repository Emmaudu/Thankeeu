import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar  from '../components/Navbar';
import Footer  from '../components/Footer';
import Icon from '../components/ui/Icon';
import { blogAPI } from '../utils/api';
import { useSEO, SCHEMAS } from '../hooks/useSEO';
import { format } from 'date-fns';

// ── Helpers ───────────────────────────────────────────────────────────────────
const CATEGORY_ICONS = {
  'All':              'Book',
  'Workplace Culture':'Building',
  'HR & Technology':  'Link',
  'Gifting':          'Gift',
  'Product Updates':  'Rocket',
  'Occasions':        'Cake',
  'General':          'Message',
};

const FALLBACK_COVERS = [
  'https://images.unsplash.com/photo-1513530534585-c7b1394c6d51?w=800&q=70',
  'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=800&q=70',
  'https://images.unsplash.com/photo-1602265585142-6b221b9b2c24?w=800&q=70',
];

const PostCard = ({ post, featured = false }) => {
  const cover = post.cover_image || FALLBACK_COVERS[0];
  const date  = post.published_at ? format(new Date(post.published_at), 'MMM d, yyyy') : '';

  if (featured) {
    return (
      <Link to={`/blog/${post.slug}`}
        className="group block bg-white rounded-3xl md:rounded-3xl overflow-hidden border border-purple-100 shadow-sm hover:shadow-xl transition-all duration-300 md:flex">
        <div className="md:w-1/2 h-48 md:h-auto overflow-hidden">
          <img src={cover} alt={post.cover_alt || post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="eager" />
        </div>
        <div className="p-5 md:p-8 md:w-1/2 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-primary-100 text-primary-600 text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Icon name={CATEGORY_ICONS[post.category] || 'File'} size={12}/> {post.category}
            </span>
            <span className="text-xs text-warm-400">Featured</span>
          </div>
          <h2 className="font-display text-xl md:text-2xl font-semibold text-warm-900 group-hover:text-primary-600 transition-colors mb-3 leading-tight">
            {post.title}
          </h2>
          <p className="text-warm-600 text-sm leading-relaxed mb-4 line-clamp-3">{post.excerpt}</p>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-600">
                {post.author_name?.charAt(0) || 'T'}
              </div>
              <div>
                <p className="text-xs font-medium text-warm-700">{post.author_name}</p>
                <p className="text-xs text-warm-400">{date} · {post.read_time} min read</p>
              </div>
            </div>
            <span className="text-primary-400 text-sm font-medium group-hover:translate-x-1 transition-transform inline-block">
              Read →
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/blog/${post.slug}`}
      className="group block bg-white rounded-3xl overflow-hidden border border-purple-100 shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="h-40 sm:h-44 overflow-hidden">
        <img src={cover} alt={post.cover_alt || post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy" width="400" height="176" />
      </div>
      <div className="p-4 md:p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs bg-purple-50 text-warm-600 px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1.5">
            <Icon name={CATEGORY_ICONS[post.category] || 'File'} size={12}/> {post.category}
          </span>
          {post.is_featured && (
            <span className="text-xs bg-primary-50 text-primary-500 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><Icon name="Star" size={10}/> Featured</span>
          )}
        </div>
        <h3 className="font-display text-base md:text-lg font-semibold text-warm-900 group-hover:text-primary-600 transition-colors mb-2 leading-snug line-clamp-2">
          {post.title}
        </h3>
        <p className="text-warm-500 text-sm leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-600">
              {post.author_name?.charAt(0) || 'T'}
            </div>
            <p className="text-xs text-warm-500">{date} · {post.read_time} min</p>
          </div>
          <p className="text-xs text-warm-400">{(post.views || 0).toLocaleString()} views</p>
        </div>
      </div>
    </Link>
  );
};

// ── Blog listing page ─────────────────────────────────────────────────────────
const Blog = () => {
  const [subEmail, setSubEmail] = useState('');
  const [subbing,  setSubbing]  = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!subEmail.trim()) return;
    setSubbing(true);
    try {
      const res = await blogAPI.subscribe({ email: subEmail.trim() });
      import('react-hot-toast').then(m => m.default.success(res.data.message || 'Check your inbox to confirm!', { duration: 6000 }));
      setSubEmail('');
    } catch (err) {
      import('react-hot-toast').then(m => m.default.error(err.response?.data?.error || 'Could not subscribe. Please try again.'));
    } finally { setSubbing(false); }
  };

  const [posts,      setPosts]      = useState([]);
  const [categories, setCategories] = useState([]);
  const [category,   setCategory]   = useState('All');
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const LIMIT = 9;

  useSEO({
    title:       'Blog — Group Card Ideas, HR Tips & Celebration Guides | Thankeeu',
    description: 'The Thankeeu blog. Ideas for birthday cards, farewell messages, work anniversary speeches, gift ideas for colleagues, and HR recognition best practices.',
    keywords:    'group card ideas Nigeria, birthday message ideas colleagues, farewell message for colleague, HR recognition tips, work anniversary wishes',
    canonical:   '/blog',
    keywords:    'thankeeu blog, workplace culture, hr tips, group cards guide, flutterwave gifting, birthday office celebrations',
    jsonLd: [
      SCHEMAS.organization,
      SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }, { name: 'Blog', url: '/blog' }]),
      SCHEMAS.webPage(
        'Blog — Tips, Guides & Updates from Thankeeu',
        'The Thankeeu blog. Guides on workplace celebrations, HRIS integration, and group gifting for companies worldwide.',
        '/blog'
      ),
      {
        '@type':       'Blog',
        '@id':         'https://thankeeu.com/blog#blog',
        name:          'Thankeeu Blog',
        description:   'Workplace celebration tips, HRIS guides, and product updates.',
        url:           'https://thankeeu.com/blog',
        publisher:     { '@id': 'https://thankeeu.com/#organization' },
        inLanguage:    'en',
      },
    ],
  });

  useEffect(() => {
    blogAPI.getCategories()
      .then(r => setCategories(r.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { limit: LIMIT, page, ...(category !== 'All' ? { category } : {}) };
    blogAPI.getPosts(params)
      .then(r => {
        setPosts(r.data.posts || []);
        setTotal(r.data.total || 0);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [category, page]);

  const totalPages = Math.ceil(total / LIMIT);
  const featured   = posts.find(p => p.is_featured);
  const rest        = posts.filter(p => !p.is_featured || posts.indexOf(p) > 0);

  return (
    <div className="min-h-screen bg-warm-100">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-50 to-white pt-10 pb-8 md:pt-16 md:pb-12 border-b border-purple-100">
        <div className="section-container">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Icon name="Book" size={13}/> Thankeeu Blog
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-3xl sm:text-5xl font-semibold text-warm-900 mb-3 leading-tight">
              Insights for modern<br className="hidden sm:block" /> modern workplaces
            </h1>
            <p className="text-warm-600 text-base md:text-lg leading-relaxed">
              Guides on workplace celebrations, HRIS integration, group gifting, and building better team cultures.
            </p>
          </div>
        </div>
      </section>

      {/* Category filter */}
      <div className="sticky top-14 md:top-16 z-30 bg-white border-b border-purple-100 shadow-sm">
        <div className="section-container">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
            {categories.map(cat => (
              <button key={cat.name} onClick={() => { setCategory(cat.name); setPage(1); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  category === cat.name
                    ? 'bg-primary-400 text-white shadow-sm'
                    : 'text-warm-600 hover:bg-warm-100'
                }`}>
                <Icon name={CATEGORY_ICONS[cat.name] || "File"} size={13}/>
                <span>{cat.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${category === cat.name ? 'bg-white/20 text-white' : 'bg-purple-50 text-warm-500'}`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="section-container py-8 md:py-12">
        {loading ? (
          <div className="space-y-6">
            <div className="h-64 bg-white rounded-3xl border border-purple-100 animate-pulse" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-72 bg-white rounded-3xl border border-purple-100 animate-pulse" />
              ))}
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4"><Icon name="File" size={28} className="text-purple-300"/></div>
            <h3 className="text-lg font-semibold text-warm-700 mb-2">No posts yet</h3>
            <p className="text-warm-500 text-sm">Check back soon — we are working on great content!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Featured post */}
            {featured && page === 1 && <PostCard post={featured} featured />}

            {/* Post grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {(featured && page === 1 ? rest : posts).map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">← Prev</button>
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)}
                      className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                        page === i + 1 ? 'bg-primary-400 text-white' : 'text-warm-600 hover:bg-purple-50'
                      }`}>{i + 1}</button>
                  ))}
                </div>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">Next →</button>
              </div>
            )}
          </div>
        )}

        {/* Newsletter CTA */}
        <div className="mt-12 md:mt-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl md:rounded-3xl p-6 md:p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-2"><Icon name="Mail" size={22} className="text-white"/></div>
          <h3 className="font-display text-xl md:text-2xl font-semibold text-white mb-2">
            Get new articles in your inbox
          </h3>
          <p className="text-primary-100 text-sm mb-5 max-w-md mx-auto">
            HR tips, product updates, and celebration ideas for teams worldwide — delivered weekly.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
            <input type="email" placeholder="your@company.com"
              value={subEmail}
              onChange={e => setSubEmail(e.target.value)}
              required
              className="input flex-1 text-sm bg-white/10 border-white/30 text-white placeholder-white/60 focus:ring-white/50" />
            <button type="submit" disabled={subbing}
              className="bg-white text-primary-600 font-semibold px-5 py-3 rounded-xl text-sm hover:bg-primary-50 transition-colors disabled:opacity-60">
              {subbing ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
          <p className="text-primary-200 text-xs mt-3">No spam. Unsubscribe any time.</p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
