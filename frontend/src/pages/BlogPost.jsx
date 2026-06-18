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

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1513530534585-c7b1394c6d51?w=1200&q=70';

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
            src={post.cover_image || FALLBACK_COVER}
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
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-warm-500 mb-6">
                <Link to="/" className="hover:text-primary-500 transition-colors">Home</Link>
                <span>›</span>
                <Link to="/blog" className="hover:text-primary-500 transition-colors">Blog</Link>
                <span>›</span>
                <span className="text-warm-700 line-clamp-1">{post.title}</span>
              </nav>

              {/* Category + tags */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Link to={`/blog?category=${encodeURIComponent(post.category)}`}
                  className="bg-primary-100 text-primary-600 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-primary-200 transition-colors">
                  <span className="inline-flex items-center gap-1.5"><Icon name={CATEGORY_ICONS[post.category] || 'File'} size={12}/> {post.category}</span>
                </Link>
                {(post.tags || []).map(tag => (
                  <span key={tag} className="bg-purple-50 text-warm-600 text-xs px-2.5 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
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
                <p className="font-semibold text-lg mb-2">Try Thankeeu</p>
                <p className="text-primary-100 text-sm mb-4 leading-relaxed">
                  Create a beautiful group card and Flutterwave gift pot for your next team occasion.
                </p>
                <Link to="/card/new"
                  className="block bg-white text-primary-600 font-semibold text-sm px-4 py-3 rounded-xl text-center hover:bg-primary-50 transition-colors mb-2">
                  Create a card →
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
