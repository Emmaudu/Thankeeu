import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Navbar  from '../components/Navbar';
import Footer  from '../components/Footer';
import Icon from '../components/ui/Icon';
import { blogAPI } from '../utils/api';
import { useSEO, SCHEMAS, BASE_URL } from '../hooks/useSEO';
import { format } from 'date-fns';

// ── Minimal markdown-like HTML sanitizer / renderer ──────────────────────────
// We trust admin-entered content and render it as HTML directly.
// A real production app would use DOMPurify; here we output content as-is.

const CATEGORY_ICONS = {
  'Workplace Culture': 'Building',
  'HR & Technology':   'Link',
  'Gifting':           'Gift',
  'Product Updates':   'Rocket',
  'Occasions':         'Cake',
  'General':           'Message',
};

// Slug-based cover image lookup — same map as Blog.jsx so the hero
// always shows the right contextual photo even without a DB cover_image.
const SLUG_COVERS = {
  'best-online-group-cards-nigeria-2025':              'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&q=80',
  'thankbox-vs-thankeeu-nigeria-2025':                 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&q=80',
  'automate-birthday-anniversary-cards-nigeria-hr':    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&q=80',
  'kudoboard-alternatives-nigeria-africa-2025':        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80',
  'birthday-card-messages-colleagues-nigeria':         'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
  'farewell-card-ideas-nigeria-colleagues':            'https://images.unsplash.com/photo-1524863479829-916d8e77f114?w=1200&q=80',
  'work-anniversary-messages-nigeria-employees':       'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&q=80',
  'group-cards-nigerian-banks-fintechs':               'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80',
  'womens-day-cards-nigerian-office-2025':             'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1200&q=80',
  'groupgreeting-vs-thankeeu-nigeria':                 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80',
  'best-online-group-cards-uk-2025':                   'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
  'thankbox-vs-kudoboard-vs-thankeeu-uk-2025':         'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80',
  'automate-birthday-anniversary-cards-uk-hr-2025':    'https://images.unsplash.com/photo-1573497491208-6b1acb260507?w=1200&q=80',
  'farewell-card-messages-uk-colleagues-2025':         'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=80',
  'hibob-vs-bamboohr-birthday-cards-uk-2025':          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80',
  'birthday-card-messages-uk-colleagues-2025':         'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200&q=80',
  'work-anniversary-recognition-uk-2025':              'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80',
  'remote-hybrid-team-group-cards-uk-2025':            'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=1200&q=80',
  'tribute-vs-thankeeu-uk-farewell-2025':              'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&q=80',
  'collect-money-colleague-gift-uk-2025':              'https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=1200&q=80',
  'best-online-group-cards-us-2025':                   'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80',
  'kudoboard-vs-thankeeu-us-hr-2025':                  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80',
  'automate-birthday-cards-us-bamboohr-rippling-gusto':'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&q=80',
  'online-farewell-cards-us-employees-2025':           'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&q=80',
  'adp-workforce-now-birthday-cards-us':               'https://images.unsplash.com/photo-1556155092-490a1ba16284?w=1200&q=80',
  'employee-recognition-statistics-us-2025':           'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80',
  'work-from-home-teams-us-remote-celebration':        'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=1200&q=80',
  'rippling-vs-gusto-employee-birthday-recognition-us':'https://images.unsplash.com/photo-1554774853-719586f82d77?w=1200&q=80',
  'group-card-ideas-us-workplace-occasions':           'https://images.unsplash.com/photo-1543269664-56d93c1b41a6?w=1200&q=80',
  'gusto-vs-bamboohr-birthday-cards-us-2025':          'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&q=80',
  'best-online-group-cards-canada-2025':               'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=1200&q=80',
  'thankbox-vs-thankeeu-canada-2025':                  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=80',
  'automate-birthday-anniversary-cards-canada-hr':     'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&q=80',
  'farewell-card-messages-canadian-colleagues-2025':   'https://images.unsplash.com/photo-1526958097901-5e6d742d3371?w=1200&q=80',
  'group-cards-bilingual-canadian-teams':              'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=1200&q=80',
  'work-anniversary-messages-canadian-employees':      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&q=80',
  'remote-work-culture-canada-distributed-teams':      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80',
  'employee-birthday-cards-canadian-startups-tech':    'https://images.unsplash.com/photo-1543269664-647163b38060?w=1200&q=80',
  'bamboohr-canada-automate-employee-celebrations':    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80',
  'online-group-cards-global-comparison-canada-uk-us-nigeria': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80',
};
const FALLBACK_COVER = 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&q=80';
const getPostCover = (post) =>
  post?.cover_image || (post?.slug && SLUG_COVERS[post.slug]) || FALLBACK_COVER;

// ── Social share helper ───────────────────────────────────────────────────────
const ShareButton = ({ url, title }) => {
  const encoded = encodeURIComponent(url);
  const text    = encodeURIComponent(`${title} via @thankeeu_ng`);
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-warm-500 font-medium">Share:</span>
      <a href={`https://twitter.com/intent/tweet?url=${encoded}&text=${text}`} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs bg-purple-50 hover:bg-gray-200 text-warm-700 px-3 py-1.5 rounded-lg transition-colors">
        𝕏 Twitter
      </a>
      <a href={`https://wa.me/?text=${text}%20${encoded}`} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg transition-colors">
        WhatsApp
      </a>
      <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encoded}&title=${encodeURIComponent(title)}`}
        target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg transition-colors">
        LinkedIn
      </a>
      <button onClick={() => navigator.clipboard?.writeText(url).then(() => {})}
        className="flex items-center gap-1.5 text-xs bg-purple-50 hover:bg-gray-200 text-warm-700 px-3 py-1.5 rounded-lg transition-colors">
        <Icon name="Link" size={12}/> Copy link
      </button>
    </div>
  );
};

// ── Blog post page ────────────────────────────────────────────────────────────
const BlogPost = () => {
  const { slug }                 = useParams();
  const navigate                 = useNavigate();
  const [post,    setPost]       = useState(null);
  const [related, setRelated]    = useState([]);
  const [loading, setLoading]    = useState(true);

  useEffect(() => {
    setLoading(true);
    blogAPI.getPost(slug)
      .then(r => {
        setPost(r.data.post);
        setRelated(r.data.related || []);
      })
      .catch(() => navigate('/blog', { replace: true }))
      .finally(() => setLoading(false));
  }, [slug]);

  // ── SEO — updates on every render with real post data ──────────────────────
  const seoTitle = post
    ? (post.meta_title || post.title)
    : 'Loading article — Thankeeu Blog';

  const seoDesc = post
    ? (post.meta_description || post.excerpt || '').slice(0, 160)
    : 'Read this article on the Thankeeu blog.';

  const seoImage = post?.og_image || post?.cover_image || null;

  useSEO({
    title:       seoTitle,
    description: seoDesc,
    canonical:   `/blog/${slug}`,
    ogImage:     seoImage,
    ogType:      'article',
    twitterCard: 'summary_large_image',
    keywords:    post ? (post.tags || []).join(', ') : '',
    jsonLd: post ? [
      SCHEMAS.organization,
      SCHEMAS.breadcrumb([
        { name: 'Home',  url: '/' },
        { name: 'Blog',  url: '/blog' },
        { name: post.title, url: `/blog/${post.slug}` },
      ]),
      // Article schema — full spec
      {
        '@type':           'Article',
        '@id':             `${BASE_URL}/blog/${post.slug}#article`,
        headline:          post.title,
        description:       seoDesc,
        url:               `${BASE_URL}/blog/${post.slug}`,
        image: post.cover_image ? {
          '@type':         'ImageObject',
          url:             post.cover_image,
          alt:             post.cover_alt || post.title,
          width:           1200,
          height:          630,
        } : undefined,
        datePublished:     post.published_at,
        dateModified:      post.updated_at,
        author: {
          '@type':         'Person',
          name:            post.author_name,
          url:             `${BASE_URL}/blog`,
        },
        publisher: {
          '@id':           `${BASE_URL}/#organization`,
        },
        mainEntityOfPage: {
          '@type':         'WebPage',
          '@id':           `${BASE_URL}/blog/${post.slug}`,
        },
        keywords:          (post.tags || []).join(', '),
        articleSection:    post.category,
        inLanguage:        'en',
        timeRequired:      `PT${post.read_time || 3}M`,
        wordCount:         Math.round((post.read_time || 3) * 200),
        isAccessibleForFree: true,
      },
      // Blog this article is part of
      {
        '@type':           'Blog',
        '@id':             `${BASE_URL}/blog#blog`,
        name:              'Thankeeu Blog',
        url:               `${BASE_URL}/blog`,
        publisher:         { '@id': `${BASE_URL}/#organization` },
      },
      SCHEMAS.webPage(
        seoTitle,
        seoDesc,
        `/blog/${post.slug}`,
        { datePublished: post.published_at, dateModified: post.updated_at }
      ),
    ] : null,
  });

  // Loading skeleton
  if (loading) return (
    <div className="min-h-screen bg-warm-100">
      <Navbar />
      <div className="section-container py-10 md:py-16 max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-6  bg-gray-200 rounded-full w-32" />
        <div className="h-10 bg-gray-200 rounded-xl w-3/4" />
        <div className="h-6  bg-gray-200 rounded-full w-48" />
        <div className="h-64 bg-gray-200 rounded-3xl w-full" />
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`h-4 bg-gray-200 rounded-full ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );

  if (!post) return null;

  const publishedDate = post.published_at ? format(new Date(post.published_at), 'MMMM d, yyyy') : '';
  const updatedDate   = post.updated_at   ? format(new Date(post.updated_at),   'MMM d, yyyy')   : '';
  const postUrl       = `${BASE_URL}/blog/${post.slug}`;

  // ── Occasion-aware CTA — route sympathy/pet-loss readers to the right landing
  // page (e.g. the pet-loss blog should funnel to the pet memorial card page).
  const blogText = `${post.slug || ''} ${(post.tags || []).join(' ')} ${post.title || ''} ${post.category || ''}`.toLowerCase();
  const isPetPost = /\bpet\b|pet-loss|pet loss|dog|cat|puppy|kitten|rainbow bridge|animal/.test(blogText);
  const isSympathyPost = /sympathy|condolence|bereavement|grief|loss of|passed away|funeral|memorial/.test(blogText);
  const ctaTarget = isPetPost
    ? { to: '/cards/pet-loss-card', title: 'Create a pet memorial card', body: 'Gather everyone who loved them into one online pet memorial card — messages, photos and a Rainbow Bridge keepsake.', btn: 'Create a pet loss card →' }
    : isSympathyPost
      ? { to: '/cards/sympathy', title: 'Send a group sympathy card', body: 'Bring everyone together in one heartfelt condolence card — messages, memories and support, from one link.', btn: 'Create a sympathy card →' }
      : { to: '/card/new', title: 'Try Thankeeu', body: 'Create a beautiful group card and gift pot for your next team occasion.', btn: 'Create a card →' };

  return (
    <div className="min-h-screen bg-warm-100">
      <Navbar />

      <article itemScope itemType="https://schema.org/Article">
        {/* Hidden machine-readable meta */}
        <meta itemProp="headline"       content={post.title} />
        <meta itemProp="datePublished"  content={post.published_at || ''} />
        <meta itemProp="dateModified"   content={post.updated_at || ''} />
        <meta itemProp="author"         content={post.author_name} />
        {post.cover_image && <meta itemProp="image" content={post.cover_image} />}

        {/* Cover image — full width hero */}
        <div className="w-full h-48 sm:h-64 md:h-80 lg:h-96 overflow-hidden bg-gray-200">
          <img
            src={getPostCover(post)}
            alt={post.cover_alt || post.title}
            className="w-full h-full object-cover"
            loading="eager" fetchpriority="high"
            itemProp="image"
          />
        </div>

        {/* Content column */}
        <div className="section-container max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8 py-8 md:py-12">

            {/* Main content */}
            <div className="min-w-0">
              {/* Breadcrumb */}
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-warm-500 mb-6 flex-nowrap overflow-hidden">
                <Link to="/" className="hover:text-primary-500 transition-colors whitespace-nowrap">Home</Link>
                <span className="flex-shrink-0">›</span>
                <Link to="/blog" className="hover:text-primary-500 transition-colors whitespace-nowrap">Blog</Link>
                <span className="flex-shrink-0">›</span>
                <span className="text-warm-700 truncate min-w-0">{post.title}</span>
              </nav>

              {/* Category only — tags moved to end of article */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Link to={`/blog?category=${encodeURIComponent(post.category)}`}
                  className="bg-primary-100 text-primary-600 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-primary-200 transition-colors">
                  <span className="inline-flex items-center gap-1.5"><Icon name={CATEGORY_ICONS[post.category] || 'File'} size={12}/> {post.category}</span>
                </Link>
              </div>

              {/* Title */}
              <h1 className="font-display text-2xl sm:text-3xl md:text-2xl sm:text-4xl font-semibold text-warm-900 leading-tight mb-5"
                itemProp="headline">
                {post.title}
              </h1>

              {/* Author + meta */}
              <div className="flex flex-wrap items-center gap-4 pb-5 mb-6 border-b border-purple-100"
                itemProp="author" itemScope itemType="https://schema.org/Person">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold flex-shrink-0">
                    {post.author_name?.charAt(0) || 'T'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-warm-900" itemProp="name">{post.author_name}</p>
                    <p className="text-xs text-warm-500">Thankeeu Team</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-warm-500">
                  <time dateTime={post.published_at || ''} itemProp="datePublished" className="inline-flex items-center gap-1"><Icon name="Calendar" size={12}/> {publishedDate}</time>
                  <span className="inline-flex items-center gap-1"><Icon name="Clock" size={12}/> {post.read_time} min read</span>
                  <span className="inline-flex items-center gap-1"><Icon name="Eye" size={12}/> {(post.views || 0).toLocaleString()} views</span>
                </div>
              </div>

              {/* Post content — rendered HTML */}
              <div
                className="prose-blog"
                itemProp="articleBody"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags footer */}
              <div className="mt-8 pt-6 border-t border-purple-100">
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <span className="text-xs text-warm-500 font-medium">Tags:</span>
                  {(post.tags || []).map(tag => (
                    <Link key={tag} to={`/blog?tag=${tag}`}
                      className="bg-purple-50 hover:bg-primary-50 hover:text-primary-600 text-warm-600 text-xs px-2.5 py-1 rounded-full transition-colors">
                      #{tag}
                    </Link>
                  ))}
                </div>
                <ShareButton url={postUrl} title={post.title} />
              </div>

              {/* Author bio box */}
              <div className="mt-8 bg-primary-50 rounded-3xl p-5 md:p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-400 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {post.author_name?.charAt(0) || 'T'}
                </div>
                <div>
                  <p className="font-semibold text-warm-900 mb-1">{post.author_name}</p>
                  <p className="text-sm text-warm-600 leading-relaxed">
                    The Thankeeu team writes about workplace celebrations, HR best practices, group gifting, and building better cultures at companies worldwide.
                  </p>
                  <Link to="/blog" className="text-primary-500 text-sm font-medium hover:underline mt-1 inline-block">
                    View all articles →
                  </Link>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* CTA card */}
              <div className="bg-primary-400 rounded-3xl p-5 text-white sticky top-20">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-2"><Icon name="Heart" size={22} className="text-white"/></div>
                <p className="font-semibold text-lg mb-2">{ctaTarget.title}</p>
                <p className="text-primary-100 text-sm mb-4 leading-relaxed">
                  {ctaTarget.body}
                </p>
                <Link to={ctaTarget.to}
                  className="block bg-white text-primary-600 font-semibold text-sm px-4 py-3 rounded-xl text-center hover:bg-primary-50 transition-colors mb-2">
                  {ctaTarget.btn}
                </Link>
                <Link to="/company/signup"
                  className="block border border-white/40 text-white font-medium text-sm px-4 py-3 rounded-xl text-center hover:bg-white/10 transition-colors">
                  Teams & HRIS →
                </Link>
              </div>

              {/* Related posts */}
              {related.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-warm-700 mb-3">Related articles</p>
                  <div className="space-y-3">
                    {related.map(rp => (
                      <Link key={rp.id} to={`/blog/${rp.slug}`}
                        className="block bg-white rounded-xl p-3 border border-purple-100 hover:border-primary-200 hover:shadow-sm transition-all group">
                        {rp.cover_image && (
                          <img src={rp.cover_image} alt={rp.title}
                            className="w-full h-28 object-cover rounded-lg mb-2" loading="lazy" />
                        )}
                        <p className="text-sm font-medium text-warm-800 group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
                          {rp.title}
                        </p>
                        <p className="text-xs text-warm-400 mt-1">{rp.read_time} min read</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>

          </div>
        </div>
      </article>

      {/* Related posts (mobile — below article) */}
      {related.length > 0 && (
        <section className="section-container pb-10 md:pb-16 lg:hidden">
          <h2 className="text-lg font-semibold text-warm-800 mb-4">More articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
            {related.map(rp => (
              <Link key={rp.id} to={`/blog/${rp.slug}`}
                className="bg-white rounded-3xl p-4 border border-purple-100 hover:shadow-md transition-all group">
                <p className="text-xs text-primary-500 font-medium mb-1">{rp.category}</p>
                <p className="text-sm font-semibold text-warm-800 group-hover:text-primary-600 line-clamp-2 mb-1">{rp.title}</p>
                <p className="text-xs text-warm-400">{rp.read_time} min read</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default BlogPost;
