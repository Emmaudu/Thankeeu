import { marked } from 'marked';
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Star, Globe, FileText, X, ChevronDown } from 'lucide-react';
import { blogApi } from '../../utils/api';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Product News', 'For Taskers', 'For Businesses',
  'Africa Insights', 'How-to Guides', 'Safety & Health', 'General',
];

const STATUS_STYLES = {
  published: 'badge-green',
  draft:     'badge-yellow',
  archived:  'badge-gray',
};

// ── Post editor (create / edit) ───────────────────────────────────
function PostEditor({ post, onSave, onCancel }) {
  const isNew = !post?.id;
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState({
    title:           post?.title || '',
    excerpt:         post?.excerpt || '',
    content:         post?.content || '',
    cover_image_url: post?.cover_image_url || '',
    cover_image_alt: post?.cover_image_alt || '',
    category:        post?.category || 'General',
    tags:            post?.tags?.join(', ') || '',
    status:          post?.status || 'draft',
    featured:        post?.featured || false,
    meta_title:      post?.meta_title || '',
    meta_description:post?.meta_description || '',
    og_image_url:    post?.og_image_url || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const wordCount = form.content.split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(1, Math.round(wordCount / 200));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || form.title.length < 5) { toast.error('Title must be at least 5 characters'); return; }
    if (!form.content.trim() || form.content.length < 50) { toast.error('Content must be at least 50 characters'); return; }

    setSaving(true);
    try {
      if (isNew) {
        await blogApi.adminCreate({ ...form });
        toast.success('Post created! ');
      } else {
        await blogApi.adminUpdate(post.id, { ...form });
        toast.success('Post updated!');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-lg text-dark">
          {isNew ? 'New Blog Post' : 'Edit Post'}
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setPreview(!preview)}
            className={clsx('btn-sm text-xs flex items-center gap-1',
              preview ? 'bg-rose-100 text-rose-700' : 'btn-ghost')}>
            <Eye size={13}/> {preview ? 'Edit Mode' : 'Preview'}
          </button>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16}/>
          </button>
        </div>
      </div>

      {preview ? (
        /* ── Preview mode ─────────────────────────────────── */
        <div className="card p-6">
          <div className="mb-3">
            <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded-full font-medium">{form.category}</span>
            {form.featured && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">⭐ Featured</span>}
          </div>
          <h1 className="font-heading text-2xl font-bold text-dark mb-3">{form.title || 'Post Title'}</h1>
          <p className="text-muted text-sm mb-5 italic">{form.excerpt || 'Excerpt will appear here...'}</p>
          <div
            className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-dark prose-p:text-gray-700 prose-a:text-rose-600 prose-strong:text-dark prose-code:bg-gray-100 prose-code:text-rose-700 prose-code:px-1 prose-code:rounded prose-blockquote:border-l-4 prose-blockquote:border-rose-400 prose-blockquote:bg-rose-50 prose-blockquote:px-4" dangerouslySetInnerHTML={{ __html: form.content ? marked.parse(form.content) : '<p class="text-muted">Start writing your content...</p>' }}
          />
        </div>
      ) : (
        /* ── Edit form ────────────────────────────────────── */
        <form onSubmit={handleSave} className="space-y-5">
          {/* Status + Featured row */}
          <div className="flex items-center gap-4 p-4 bg-surface rounded-2xl flex-wrap">
            <div>
              <label className="label text-xs">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className="input py-2 text-sm">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="label text-xs">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="input py-2 text-sm">
                {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-4">
              <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)}
                className="rounded w-4 h-4 accent-amber-500"/>
              <span className="text-sm font-medium text-gray-700">⭐ Featured post</span>
            </label>
          </div>

          {/* Title */}
          <div>
            <label className="label">Post Title * <span className="text-muted font-normal text-xs">({form.title.length}/300)</span></label>
            <input value={form.title} onChange={e => set('title', e.target.value)} required
              placeholder="e.g. How Taskeeu Is Changing Field Operations in Africa" className="input text-base font-medium" maxLength={300}/>
          </div>

          {/* Excerpt */}
          <div>
            <label className="label">Excerpt <span className="text-muted font-normal text-xs">({form.excerpt.length}/165 — shown in post cards)</span></label>
            <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={2}
              placeholder="A 1–2 sentence summary shown in the blog listing page and search results..." className="input resize-none" maxLength={300}/>
          </div>

          {/* Cover image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Cover Image URL</label>
              <input value={form.cover_image_url} onChange={e => set('cover_image_url', e.target.value)}
                placeholder="https://images.unsplash.com/photo-..." className="input text-sm"/>
              <p className="text-xs text-muted mt-1">Tip: use Unsplash — e.g. <code className="bg-gray-100 px-1 rounded">https://images.unsplash.com/photo-ID?w=1200&q=80</code></p>
            </div>
            <div>
              <label className="label">Cover Image Alt Text</label>
              <input value={form.cover_image_alt} onChange={e => set('cover_image_alt', e.target.value)}
                placeholder="Descriptive alt text for accessibility & SEO" className="input text-sm"/>
            </div>
          </div>
          {/* Live image preview */}
          {form.cover_image_url && (
            <div className="rounded-2xl overflow-hidden border border-gray-200" style={{ height: 180 }}>
              <img src={form.cover_image_url} alt={form.cover_image_alt || 'Cover preview'}
                className="w-full h-full object-cover" onError={(e) => { e.target.parentElement.innerHTML = '<div style="height:180px;display:flex;align-items:center;justify-content:center;background:#fff1f2;color:#fb7185;font-size:13px;font-weight:600;">Image URL not loading — check the URL</div>'; }} />
            </div>
          )}

          {/* Content (markdown) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Content * <span className="text-muted font-normal text-xs">(Markdown supported)</span></label>
              <span className="text-xs text-muted">{wordCount} words · ~{readMins} min read</span>
            </div>
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              {/* Markdown toolbar */}
              <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200 overflow-x-auto flex-wrap">
                {[
                  ['**Bold**', '**text**'],
                  ['*Italic*', '*text*'],
                  ['## H2', '## Heading'],
                  ['### H3', '### Heading'],
                  ['> Quote', '> '],
                  ['`Code`', '`code`'],
                  ['- List', '\n- item\n- item'],
                  ['---', '\n---\n'],
                ].map(([label, insert]) => (
                  <button key={label} type="button" onClick={() => set('content', form.content + insert)}
                    className="px-2 py-1 text-xs bg-white border border-gray-200 rounded-lg hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 transition-colors whitespace-nowrap font-mono">
                    {label}
                  </button>
                ))}
              </div>
              <textarea
                value={form.content}
                onChange={e => set('content', e.target.value)}
                required
                rows={20}
                placeholder={`# Post Title\n\nWrite your content here using Markdown...\n\n## Section Heading\n\nParagraph text goes here. You can use **bold**, *italic*, and \`code\`.\n\n## Another Section\n\n- Bullet point one\n- Bullet point two\n- Bullet point three`}
                className="w-full p-4 text-sm font-mono text-gray-700 focus:outline-none resize-y" style={{ minHeight: '400px' }}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="label">Tags <span className="text-muted font-normal text-xs">(comma-separated, lowercase)</span></label>
            <input value={form.tags} onChange={e => set('tags', e.target.value)}
              placeholder="nigeria, gig-economy, field-operations, enterprise" className="input text-sm"/>
          </div>

          {/* SEO section */}
          <details className="border border-gray-200 rounded-2xl overflow-hidden">
            <summary className="px-4 py-3 bg-surface cursor-pointer font-semibold text-sm text-gray-700 flex items-center gap-2">SEO Settings (optional — auto-generated if left blank)
              <ChevronDown size={14} className="ml-auto"/>
            </summary>
            <div className="p-4 space-y-3">
              <div>
                <label className="label text-xs">Meta Title <span className="text-muted font-normal">({form.meta_title.length}/70 chars)</span></label>
                <input value={form.meta_title} onChange={e => set('meta_title', e.target.value)}
                  placeholder="SEO title shown in Google search results (max 70 chars)" className="input text-sm" maxLength={70}/>
              </div>
              <div>
                <label className="label text-xs">Meta Description <span className="text-muted font-normal">({form.meta_description.length}/165 chars)</span></label>
                <textarea value={form.meta_description} onChange={e => set('meta_description', e.target.value)}
                  rows={2} placeholder="Google search snippet description (max 165 chars)" className="input resize-none text-sm" maxLength={165}/>
              </div>
              <div>
                <label className="label text-xs">OG/Social Image URL</label>
                <input value={form.og_image_url} onChange={e => set('og_image_url', e.target.value)}
                  placeholder="Image shown when shared on social media (1200×630px ideal)" className="input text-sm"/>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700">
                <p className="font-semibold mb-1">SEO Preview</p>
                <p className="font-medium text-blue-800">{form.meta_title || form.title || 'Post Title | Taskeeu'}</p>
                <p className="text-green-600 text-xs">taskeeu.com/blog/...</p>
                <p className="text-gray-600">{form.meta_description || form.excerpt || 'Post description will appear here in search results...'}</p>
              </div>
            </div>
          </details>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? '⏳ Saving...' : isNew ? 'Create Post' : 'Save Changes'}
            </button>
            <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
            {form.status === 'draft' && !isNew && (
              <button type="button" onClick={() => { set('status', 'published'); setTimeout(() => document.querySelector('[type=submit]').click(), 50); }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors ml-auto">
                <Globe size={14}/> Publish Now
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

// ── Main blog manager panel ───────────────────────────────────────
export default function AdminBlogManager() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | {post}
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await blogApi.adminList({ status: statusFilter || undefined, page, limit: 15 });
      setPosts(data.posts || []);
      setPagination(data.pagination || {});
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { if (!editing) load(); }, [editing, statusFilter, page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post permanently? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await blogApi.adminDelete(id);
      toast.success('Post deleted');
      load();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(null); }
  };

  const quickStatus = async (id, status) => {
    try {
      await blogApi.adminSetStatus(id, status);
      toast.success(`Post ${status}`);
      load();
    } catch { toast.error('Status change failed'); }
  };

  const toggleFeatured = async (id) => {
    try {
      const { data } = await blogApi.adminToggleFeatured(id);
      toast.success(data.featured ? 'Post featured ⭐' : 'Feature removed');
      load();
    } catch { toast.error('Failed'); }
  };

  if (editing === 'new') {
    return <PostEditor onSave={() => setEditing(null)} onCancel={() => setEditing(null)}/>;
  }
  if (editing?.id) {
    return <PostEditor post={editing} onSave={() => setEditing(null)} onCancel={() => setEditing(null)}/>;
  }

  const counts = { all: pagination.total || 0, published: posts.filter(p=>p.status==='published').length, draft: posts.filter(p=>p.status==='draft').length };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-heading font-bold text-lg text-dark">Blog Manager</h3>
          <p className="text-muted text-sm">{pagination.total || 0} total posts</p>
        </div>
        <button onClick={() => setEditing('new')} className="btn-primary flex items-center gap-2">
          <Plus size={15}/> New Post
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[['', 'All'], ['published', 'Published'], ['draft', 'Drafts'], ['archived', 'Archived']].map(([val, label]) => (
          <button key={val} onClick={() => { setStatusFilter(val); setPage(1); }}
            className={clsx('px-4 py-2 rounded-xl text-sm font-medium transition-colors border',
              statusFilter === val ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300')}>
            {label}
          </button>
        ))}
      </div>

      {/* Posts table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 sm:p-8 text-center text-muted">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <p className="text-4xl mb-3"></p>
            <h3 className="font-heading font-bold text-gray-700 mb-2">
              {statusFilter ? `No ${statusFilter} posts` : 'No posts yet'}
            </h3>
            <p className="text-muted text-sm mb-4">Create your first blog post to start building your SEO presence.</p>
            <button onClick={() => setEditing('new')} className="btn-primary btn-sm">
              <Plus size={13}/> Create First Post
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Post', 'Category', 'Status', 'Views', 'Published', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {posts.map(p => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 max-w-xs">
                        <div className="flex items-start gap-2">
                          {p.featured && <span className="text-amber-400 flex-shrink-0 mt-0.5">⭐</span>}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate">{p.title}</p>
                            <p className="text-xs text-muted truncate">/blog/{p.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{p.category}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={clsx('badge text-xs capitalize', STATUS_STYLES[p.status] || 'badge-gray')}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted text-xs">
                        {p.views?.toLocaleString() || 0}
                      </td>
                      <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">
                        {p.published_at ? format(new Date(p.published_at), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {/* Edit */}
                          <button onClick={async () => {
                            const { data } = await blogApi.adminGet(p.id);
                            setEditing(data.post);
                          }}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-500 hover:text-blue-600 transition-colors" title="Edit">
                            <Edit2 size={13}/>
                          </button>
                          {/* View (if published) */}
                          {p.status === 'published' && (
                            <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-gray-100 hover:bg-green-100 text-gray-500 hover:text-green-600 transition-colors" title="View">
                              <Eye size={13}/>
                            </a>
                          )}
                          {/* Quick publish/draft toggle */}
                          {p.status === 'draft' && (
                            <button onClick={() => quickStatus(p.id, 'published')}
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-green-100 text-gray-500 hover:text-green-600 transition-colors" title="Publish">
                              <Globe size={13}/>
                            </button>
                          )}
                          {p.status === 'published' && (
                            <button onClick={() => quickStatus(p.id, 'draft')}
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-amber-100 text-gray-500 hover:text-amber-600 transition-colors" title="Unpublish">
                              <FileText size={13}/>
                            </button>
                          )}
                          {/* Feature toggle */}
                          <button onClick={() => toggleFeatured(p.id)}
                            className={clsx('p-1.5 rounded-lg transition-colors', p.featured ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400 hover:bg-amber-50 hover:text-amber-400')}
                            title={p.featured ? 'Unfeature' : 'Feature'}>
                            <Star size={13}/>
                          </button>
                          {/* Delete */}
                          <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors" title="Delete">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40">← Prev</button>
                <span className="text-sm text-muted">{page} / {pagination.pages}</span>
                <button onClick={() => setPage(p => Math.min(pagination.pages, p+1))} disabled={page===pagination.pages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40">Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
