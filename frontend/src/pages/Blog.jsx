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

// ── Per-slug cover images (synced with seed_blog_posts.sql) ─────────────────
// Every post has a unique, context-appropriate Unsplash photo so the blog
// always looks varied even when cover_image isn't stored in the DB yet.
const SLUG_COVERS = {
  'best-online-group-cards-nigeria-2025':              'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=70',
  'thankbox-vs-thankeeu-nigeria-2025':                 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=70',
  'automate-birthday-anniversary-cards-nigeria-hr':    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=70',
  'kudoboard-alternatives-nigeria-africa-2025':        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=70',
  'birthday-card-messages-colleagues-nigeria':         'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=70',
  'farewell-card-ideas-nigeria-colleagues':            'https://images.unsplash.com/photo-1524863479829-916d8e77f114?w=800&q=70',
  'work-anniversary-messages-nigeria-employees':       'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=70',
  'group-cards-nigerian-banks-fintechs':               'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=70',
  'womens-day-cards-nigerian-office-2025':             'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&q=70',
  'groupgreeting-vs-thankeeu-nigeria':                 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=70',
  'best-online-group-cards-uk-2025':                   'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=70',
  'thankbox-vs-kudoboard-vs-thankeeu-uk-2025':         'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=70',
  'automate-birthday-anniversary-cards-uk-hr-2025':    'https://images.unsplash.com/photo-1573497491208-6b1acb260507?w=800&q=70',
  'farewell-card-messages-uk-colleagues-2025':         'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=70',
  'hibob-vs-bamboohr-birthday-cards-uk-2025':          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=70',
  'birthday-card-messages-uk-colleagues-2025':         'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&q=70',
  'work-anniversary-recognition-uk-2025':              'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=70',
  'remote-hybrid-team-group-cards-uk-2025':            'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=800&q=70',
  'tribute-vs-thankeeu-uk-farewell-2025':              'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=70',
  'collect-money-colleague-gift-uk-2025':              'https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=800&q=70',
  'best-online-group-cards-us-2025':                   'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=70',
  'kudoboard-vs-thankeeu-us-hr-2025':                  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=70',
  'automate-birthday-cards-us-bamboohr-rippling-gusto':'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=70',
  'online-farewell-cards-us-employees-2025':           'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=70',
  'adp-workforce-now-birthday-cards-us':               'https://images.unsplash.com/photo-1556155092-490a1ba16284?w=800&q=70',
  'employee-recognition-statistics-us-2025':           'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=70',
  'work-from-home-teams-us-remote-celebration':        'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=800&q=70',
  'rippling-vs-gusto-employee-birthday-recognition-us':'https://images.unsplash.com/photo-1554774853-719586f82d77?w=800&q=70',
  'group-card-ideas-us-workplace-occasions':           'https://images.unsplash.com/photo-1543269664-56d93c1b41a6?w=800&q=70',
  'gusto-vs-bamboohr-birthday-cards-us-2025':          'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=70',
  'best-online-group-cards-canada-2025':               'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=800&q=70',
  'thankbox-vs-thankeeu-canada-2025':                  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=70',
  'automate-birthday-anniversary-cards-canada-hr':     'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&q=70',
  'farewell-card-messages-canadian-colleagues-2025':   'https://images.unsplash.com/photo-1526958097901-5e6d742d3371?w=800&q=70',
  'group-cards-bilingual-canadian-teams':              'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=70',
  'work-anniversary-messages-canadian-employees':      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=70',
  'remote-work-culture-canada-distributed-teams':      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=70',
  'employee-birthday-cards-canadian-startups-tech':    'https://images.unsplash.com/photo-1543269664-647163b38060?w=800&q=70',
  'bamboohr-canada-automate-employee-celebrations':    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=70',
  'online-group-cards-global-comparison-canada-uk-us-nigeria': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=70',
};

// Category-level fallbacks — varied by theme so the grid never looks uniform
const CATEGORY_COVERS = {
  'HR':          'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=70',  // diverse team meeting
  'Comparison':  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=70',  // analytics dashboard
  'Birthday':    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=70',  // birthday celebration
  'Farewell':    'https://images.unsplash.com/photo-1524863479829-916d8e77f114?w=800&q=70', // farewell gathering
  'Anniversary': 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=70',  // milestone celebration
  'Remote':      'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=800&q=70', // remote work desk
  'Culture':     'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=70', // team culture
  'Guide':       'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=70', // planning / guide
  'Message':     'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&q=70', // writing / messages
  'General':     'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=70', // modern office
};

// Fallback pool — cycling so repeated unknowns still look varied
const FALLBACK_POOL = [
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=70',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=70',
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=70',
  'https://images.unsplash.com/photo-1573497491208-6b1acb260507?w=800&q=70',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=70',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=70',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=70',
  'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=70',
];

// Resolve the best cover for a post: DB value → slug map → category → cycling fallback
let _fallbackIdx = 0;
const getPostCover = (post) => {
  if (post.cover_image) return post.cover_image;
  if (post.slug && SLUG_COVERS[post.slug]) return SLUG_COVERS[post.slug];
  if (post.category && CATEGORY_COVERS[post.category]) return CATEGORY_COVERS[post.category];
  return FALLBACK_POOL[(_fallbackIdx++) % FALLBACK_POOL.length];
};

const PostCard = ({ post, featured = false }) => {
  const cover = getPostCover(post);
  const date  = post.published_at ? format(new Date(post.published_at), 'MMM d, yyyy') : '';

  if (featured) {
    return (
      <Link to={`/blog/${post.slug}`}
        className="group block bg-white rounded-3xl md:rounded-3xl overflow-hidden border border-purple-100 shadow-sm hover:shadow-xl transition-all duration-300 md:flex">
        <div className="md:w-1/2 h-48 md:h-auto overflow-hidden">
          <img src={cover} alt={post.cover_alt || post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="eager"
            onError={e => { e.currentTarget.src = FALLBACK_POOL[1]; e.currentTarget.onerror = null; }} />
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
          loading="lazy" width="400" height="176"
          onError={e => { e.currentTarget.src = FALLBACK_POOL[2]; e.currentTarget.onerror = null; }} />
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
    keywords:    'group card ideas Nigeria, birthday message ideas colleagues, farewell message for colleague, HR recognition tips, work anniversary wishes, thankeeu blog, workplace culture, hr tips, group cards guide',
    canonical:   '/blog',
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
        '@id':         'https://www.thankeeu.com/blog#blog',
        name:          'Thankeeu Blog',
        description:   'Workplace celebration tips, HRIS guides, and product updates.',
        url:           'https://www.thankeeu.com/blog',
        publisher:     { '@id': 'https://www.thankeeu.com/#organization' },
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
