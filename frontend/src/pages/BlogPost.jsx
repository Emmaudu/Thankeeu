import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Clock, Eye, Tag, ChevronRight, Twitter, Facebook, Link2, ArrowLeft, BookOpen } from 'lucide-react';
import { blogApi } from '../utils/api';
import { format } from 'date-fns';
import { marked } from 'marked';
import { clsx } from 'clsx';
import SEO from '../components/seo/SEO';
import toast from 'react-hot-toast';

// Configure marked — safe heading IDs for TOC anchors
const renderer = new marked.Renderer();
renderer.heading = function(text, level) {
  const id = String(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  return `<h${level} id="${id}">${text}</h${level}>`;
};
marked.setOptions({ breaks: true, gfm: true, renderer });

const CATEGORY_COLORS = {
  'Product News':    'bg-rose-100 text-rose-700',
  'For Taskers':     'bg-blue-100 text-blue-700',
  'For Businesses':  'bg-violet-100 text-violet-700',
  'Africa Insights': 'bg-orange-100 text-orange-700',
  'How-to Guides':   'bg-amber-100 text-amber-700',
  'Comparisons':     'bg-teal-100 text-teal-700',
  'Guides':          'bg-green-100 text-green-700',
  'Safety & Health': 'bg-red-100 text-red-700',
  'General':         'bg-gray-100 text-gray-600',
};

function RelatedCard({ post }) {
  const catColor = CATEGORY_COLORS[post.category] || CATEGORY_COLORS['General'];
  return (
    <Link to={`/blog/${post.slug}`}
      className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
      <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
        {post.cover_image_url
          ? <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><BookOpen size={18} className="text-gray-300" /></div>}
      </div>
      <div className="flex-1 min-w-0">
        <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', catColor)}>{post.category}</span>
        <p className="font-semibold text-sm text-gray-800 leading-snug mt-1.5 line-clamp-2 group-hover:text-rose-600 transition-colors">
          {post.title}
        </p>
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <Clock size={10} /> {post.reading_time_minutes} min read
        </p>
      </div>
    </Link>
  );
}

export default function BlogPost() {
  const { slug }   = useParams();
  const navigate   = useNavigate();
  const [post, setPost]       = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await blogApi.getPost(slug);
        setPost(data.post);
        setRelated(data.related || []);
      } catch (err) {
        if (err.response?.status === 404) navigate('/blog', { replace: true });
      } finally { setLoading(false); }
    };
    load();
  }, [slug]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://taskeeu.com/blog/${slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => toast.error('Could not copy link'));
  };

  if (loading) return (
    <div className="pt-20 min-h-screen bg-white">
      <div className="container-xl py-12" style={{ maxWidth: 900 }}>
        <div className="animate-pulse space-y-5">
          <div className="h-4 bg-gray-100 rounded-full w-40" />
          <div className="h-8 bg-gray-200 rounded-full w-4/5" />
          <div className="h-8 bg-gray-200 rounded-full w-3/5" />
          <div className="h-5 bg-gray-100 rounded-full w-32" />
          <div className="h-80 bg-gray-100 rounded-3xl mt-6" />
          <div className="space-y-3 pt-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={clsx('h-4 bg-gray-100 rounded-full', i % 4 === 3 ? 'w-2/3' : 'w-full')} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (!post) return null;

  const catColor = CATEGORY_COLORS[post.category] || CATEGORY_COLORS['General'];
  const htmlContent = marked.parse(post.content || '');

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    image: post.og_image_url || post.cover_image_url || 'https://taskeeu.com/og-default.png',
    url: `https://taskeeu.com/blog/${post.slug}`,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { '@type': 'Person', name: post.author_name || 'Taskeeu Team' },
    publisher: {
      '@type': 'Organization',
      name: 'Taskeeu Technologies Ltd',
      url: 'https://taskeeu.com',
      logo: { '@type': 'ImageObject', url: 'https://taskeeu.com/logo.svg' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://taskeeu.com/blog/${post.slug}` },
    ...(post.tags?.length && { keywords: post.tags.join(', ') }),
    articleSection: post.category,
    wordCount: post.content?.split(/\s+/).length || 0,
    timeRequired: `PT${post.reading_time_minutes}M`,
    inLanguage: 'en-NG',
  };

  // Extract headings for ToC
  const tocHeadings = post.content?.match(/^#{2,3}\s.+$/gm)?.map(h => ({
    level: h.match(/^(#{2,3})/)[0].length,
    text: h.replace(/^#{2,3}\s/, ''),
    id: h.replace(/^#{2,3}\s/, '').toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim(),
  })) || [];

  return (
    <>
      <SEO
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt}
        canonical={`https://taskeeu.com/blog/${post.slug}`}
        ogImage={post.og_image_url || post.cover_image_url}
        ogType="article" keywords={post.tags?.join(', ')}
        structuredData={articleSchema}
        breadcrumbs={[
          { name: 'Home', url: 'https://taskeeu.com' },
          { name: 'Blog', url: 'https://taskeeu.com/blog' },
          { name: post.title, url: `https://taskeeu.com/blog/${post.slug}` },
        ]}
      >
        <meta property="article:published_time" content={post.published_at} />
        <meta property="article:modified_time" content={post.updated_at} />
        <meta property="article:section" content={post.category} />
        {post.tags?.map(tag => <meta key={tag} property="article:tag" content={tag} />)}
        <meta property="article:author" content={post.author_name || 'Taskeeu Team'} />
      </SEO>

      <article className="pt-20 min-h-screen bg-white">

        {/* ── Hero cover ───────────────────────────────────── */}
        {post.cover_image_url ? (
          <div className="w-full overflow-hidden bg-gray-100" style={{ maxHeight: 460 }}>
            <img src={post.cover_image_url} alt={post.cover_image_alt || post.title}
              className="w-full object-cover" style={{ maxHeight: 460, objectPosition: 'center 30%' }}
              onError={(e) => { e.target.parentElement.style.display = 'none'; }} />
          </div>
        ) : (
          <div className="w-full h-16 bg-gradient-to-r from-rose-50 to-rose-100" />
        )}

        <div className="container-xl py-10 md:py-14">
          <div className="flex flex-col lg:flex-row gap-10 xl:gap-14">

            {/* ── Article body ─────────────────────────────── */}
            <div className="flex-1 min-w-0" style={{ maxWidth: 700 }}>

              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
                <Link to="/" className="hover:text-rose-500 transition-colors">Home</Link>
                <ChevronRight size={11} />
                <Link to="/blog" className="hover:text-rose-500 transition-colors">Blog</Link>
                <ChevronRight size={11} />
                <span className="text-gray-500 truncate">{post.title}</span>
              </nav>

              {/* Category */}
              <div className="flex items-center gap-2 flex-wrap mb-5">
                <Link to={`/blog?category=${encodeURIComponent(post.category)}`}
                  className={clsx('text-xs font-bold px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity', catColor)}>
                  {post.category}
                </Link>
                {post.featured && (
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">Featured</span>
                )}
              </div>

              {/* Title */}
              <h1 className="font-heading text-2xl md:text-3xl lg:text-4xl font-black text-dark leading-tight mb-6" style={{ letterSpacing: '-0.03em' }}>
                {post.title}
              </h1>

              {/* Author + meta row */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-gray-100 mb-8">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white text-xs font-black">
                      {(post.author_name || 'T')[0]}
                    </div>
                    <span className="font-semibold text-sm text-gray-700">{post.author_name || 'Taskeeu Team'}</span>
                  </div>
                  {post.published_at && (
                    <span className="text-sm text-gray-400">{format(new Date(post.published_at), 'MMMM d, yyyy')}</span>
                  )}
                  <span className="flex items-center gap-1 text-sm text-gray-400">
                    <Clock size={13} /> {post.reading_time_minutes} min read
                  </span>
                  {post.views > 0 && (
                    <span className="items-center gap-1 text-sm text-gray-400 hidden sm:flex">
                      <Eye size={13} /> {post.views.toLocaleString()} views
                    </span>
                  )}
                </div>

                {/* Share buttons */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400 mr-1">Share:</span>
                  <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
                    target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-blue-50 flex items-center justify-center text-gray-500 hover:text-blue-500 transition-colors">
                    <Twitter size={13} />
                  </a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-blue-50 flex items-center justify-center text-gray-500 hover:text-blue-600 transition-colors">
                    <Facebook size={13} />
                  </a>
                  <a href={`https://wa.me/?text=${encodeURIComponent(post.title + ' ' + shareUrl)}`}
                    target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-green-50 flex items-center justify-center text-gray-500 hover:text-green-600 transition-colors">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </a>
                  <button onClick={copyLink}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-rose-50 flex items-center justify-center text-gray-500 hover:text-rose-500 transition-colors">
                    <Link2 size={13} />
                  </button>
                </div>
              </div>

              {/* ── Prose content ───────────────────────────── */}
              <div
                className="prose prose-base max-w-none
                  prose-headings:font-heading prose-headings:font-black prose-headings:text-dark prose-headings:leading-tight
                  prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                  prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                  prose-h4:text-lg prose-h4:mt-6 prose-h4:mb-2
                  prose-p:text-gray-600 prose-p:leading-8 prose-p:mb-5
                  prose-a:text-rose-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-dark prose-strong:font-bold
                  prose-code:bg-rose-50 prose-code:text-rose-700 prose-code:px-2 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-2xl prose-pre:p-6 prose-pre:overflow-x-auto
                  prose-blockquote:not-italic prose-blockquote:border-l-4 prose-blockquote:border-rose-400 prose-blockquote:bg-rose-50 prose-blockquote:rounded-r-2xl prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:my-8
                  prose-blockquote:text-gray-700
                  prose-ul:space-y-2 prose-ol:space-y-2
                  prose-li:text-gray-600 prose-li:leading-7
                  prose-img:rounded-2xl prose-img:shadow-md
                  prose-table:text-sm prose-th:bg-gray-50 prose-th:font-semibold prose-th:text-gray-700 prose-td:text-gray-600
                  prose-hr:border-gray-100 prose-hr:my-10
                " dangerouslySetInnerHTML={{ __html: htmlContent }}
              />

              {/* Tags */}
              {post.tags?.length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-100">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                    <Tag size={12} /> Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map(tag => (
                      <Link key={tag} to={`/blog?tag=${encodeURIComponent(tag)}`}
                        className="text-sm bg-gray-100 hover:bg-rose-100 text-gray-500 hover:text-rose-700 px-4 py-1.5 rounded-full transition-colors font-medium">
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Back */}
              <div className="mt-10">
                <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-rose-600 transition-colors">
                  <ArrowLeft size={15} /> Back to Blog
                </Link>
              </div>
            </div>

            {/* ── Sidebar ──────────────────────────────────── */}
            <aside className="lg:w-72 xl:w-80 flex-shrink-0">
              <div className="sticky top-24 space-y-5">

                {/* Table of contents */}
                {tocHeadings.length > 2 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow: '0 1px 8px rgba(18,9,26,0.05)' }}>
                    <h3 className="font-heading font-black text-gray-800 text-sm mb-4 flex items-center gap-2">In This Article
                    </h3>
                    <nav className="space-y-1">
                      {tocHeadings.map((h, i) => (
                        <a key={i} href={`#${h.id}`}
                          className={clsx(
                            'block text-sm hover:text-rose-600 transition-colors leading-snug py-0.5',
                            h.level === 2 ? 'text-gray-700 font-semibold' : 'text-gray-400 pl-4 text-xs',
                          )}>
                          {h.level === 2 ? '→ ' : '• '}{h.text}
                        </a>
                      ))}
                    </nav>
                  </div>
                )}

                {/* Related posts */}
                {related.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow: '0 1px 8px rgba(18,9,26,0.05)' }}>
                    <h3 className="font-heading font-black text-gray-800 text-sm mb-4">Related Posts</h3>
                    <div className="space-y-1">
                      {related.map(p => <RelatedCard key={p.id} post={p} />)}
                    </div>
                  </div>
                )}

                {/* Errand CTA */}
                <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a0d2e 0%, #2d1148 100%)' }}>
                  <div className="p-5">
                    <p className="font-heading font-black text-white text-sm mb-1">Need an Errand Done?</p>
                    <p className="text-gray-400 text-xs leading-relaxed mb-1">Lagos · Abuja · Port Harcourt · All 36 States</p>
                    <p className="text-gray-500 text-xs leading-relaxed mb-4">Post any errand in 2 minutes. Verified Taskers bid. Escrow-protected.</p>
                    <div className="space-y-2">
                      <Link to="/errands" className="flex items-center justify-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors">
                        Post an Errand <ArrowLeft size={12} className="rotate-180" />
                      </Link>
                      <Link to="/tasker/signup" className="flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors">
                        Become a Tasker
                      </Link>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-1.5">
                      <Link to="/errands/lagos" className="block text-xs text-gray-400 hover:text-rose-400 transition-colors">→ Errand Service Lagos</Link>
                      <Link to="/errands/abuja" className="block text-xs text-gray-400 hover:text-rose-400 transition-colors">→ Errand Service Abuja</Link>
                      <Link to="/diaspora" className="block text-xs text-gray-400 hover:text-rose-400 transition-colors">→ For Nigerians Abroad</Link>
                    </div>
                  </div>
                </div>

              </div>
            </aside>
          </div>
        </div>
      </article>
    </>
  );
}
