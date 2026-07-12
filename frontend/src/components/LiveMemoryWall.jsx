/**
 * LiveMemoryWall.jsx
 * The 📸 Memory Wall tab shown inside SignCard and CardView.
 * Contributors upload photos/videos with a short caption.
 * Posts appear in real-time chronological order.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from './ui/Icon';
import QRButton from './QRButton';

// Match the rest of the app: relative '/api' base so Vercel's rewrite proxies
// to the Railway backend. A hardcoded domain would bypass the proxy.
const API = import.meta.env.VITE_API_URL || '/api';

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const mediaIcon = { image: 'Photo', video: 'Video', gif: 'GIF' };

// ── Single wall post card ─────────────────────────────────────────────────────
function WallPost({ post }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-purple-100 bg-white shadow-sm">
      {post.media_url && post.media_type === 'video' && (
        <video src={post.media_url} controls
          className="w-full max-h-72 object-cover bg-black"
          playsInline preload="metadata" />
      )}
      {post.media_url && post.media_type !== 'video' && (
        <img src={post.media_url} alt={post.caption || 'Memory Wall photo'}
          className="w-full max-h-72 object-cover" loading="lazy" />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm flex-shrink-0">
            {post.author_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-warm-900 text-sm truncate">{post.author_name}</p>
            <p className="text-xs text-warm-400">{timeAgo(post.created_at)}</p>
          </div>
          {post.media_type && (
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-lg bg-purple-100 text-primary-600 flex-shrink-0">{mediaIcon[post.media_type] || post.media_type}</span>
          )}
        </div>
        {post.caption && (
          <p className="text-sm text-warm-700 leading-relaxed">"{post.caption}"</p>
        )}
      </div>
    </div>
  );
}

// ── Upload form ───────────────────────────────────────────────────────────────
function UploadForm({ slug, onPosted, defaultName = '', defaultEmail = '' }) {
  const [name,    setName]    = useState(defaultName);
  const [caption, setCaption] = useState('');
  const [file,    setFile]    = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (!file && !caption.trim()) return;
    setLoading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append('author_name', name.trim());
      if (defaultEmail) fd.append('author_email', defaultEmail);
      if (caption.trim()) fd.append('caption', caption.trim());
      if (file) fd.append('media', file);

      const res = await fetch(`${API}/wall/${slug}`, { method: 'POST', body: fd });
      let data = {};
      try { data = await res.json(); } catch { /* non-JSON error body */ }
      if (!res.ok) throw new Error(data.error || 'Upload failed. Please try again.');
      onPosted(data.post);
      setCaption('');
      setFile(null);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-primary-100 bg-primary-50 p-4 mb-6">
      <p className="font-bold text-warm-900 text-sm mb-3">📸 Add to the Memory Wall</p>

      {!defaultName && (
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-xl border border-purple-200 px-3 py-2.5 text-sm mb-3 focus:outline-none focus:border-primary-400 bg-white" />
      )}

      {preview && (
        <div className="relative mb-3 rounded-xl overflow-hidden">
          {file?.type?.startsWith('video/') ? (
            <video src={preview} className="w-full max-h-48 object-cover rounded-xl" controls />
          ) : (
            <img src={preview} className="w-full max-h-48 object-cover rounded-xl" alt="preview" />
          )}
          <button onClick={() => { setFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
            <Icon name="X" size={14} />
          </button>
        </div>
      )}

      <textarea value={caption} onChange={e => setCaption(e.target.value)}
        placeholder="Add a caption (optional)..."
        rows={2}
        className="w-full rounded-xl border border-purple-200 px-3 py-2.5 text-sm resize-none mb-3 focus:outline-none focus:border-primary-400 bg-white" />

      <div className="flex gap-2">
        <input type="file" ref={fileRef} accept="image/*,video/*" className="hidden" onChange={handleFile} />
        <button onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-purple-200 bg-white text-sm font-semibold text-warm-600 hover:border-primary-300 transition-colors">
          <Icon name="Image" size={15} />
          {file ? 'Change' : 'Photo / Video'}
        </button>
        <button onClick={handleSubmit}
          disabled={loading || (!file && !caption.trim()) || !name.trim()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {loading ? <Icon name="Loader" size={15} className="animate-spin" /> : <Icon name="Upload" size={15} />}
          {loading ? 'Uploading…' : 'Post to Wall'}
        </button>
      </div>
      {uploadError && (
        <p className="text-red-500 text-xs mt-2 text-center">{uploadError}</p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
/**
 * @param {string}  slug          — card slug
 * @param {boolean} canUpload     — true if the event is still open
 * @param {string}  [defaultName] — pre-fill from signed-in user
 * @param {string}  [defaultEmail]
 */
export default function LiveMemoryWall({ slug, canUpload = true, defaultName = '', defaultEmail = '', wallUrl = '' }) {
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`${API}/wall/${slug}`);
      if (!res.ok) return;
      const data = await res.json();
      setPosts(data.posts || []);
    } catch { /* non-fatal */ } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Poll every 15s while the wall is open (live event feeling)
  useEffect(() => {
    if (!canUpload) return;
    const t = setInterval(fetchPosts, 15000);
    return () => clearInterval(t);
  }, [canUpload, fetchPosts]);

  const handlePosted = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const shareUrl = wallUrl || (typeof window !== 'undefined' ? `${window.location.origin}/sign/${slug}?tab=wall` : '');

  return (
    <div>
      {/* QR code banner — share with guests at the venue */}
      {canUpload && shareUrl && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-2xl border-2 border-purple-100 bg-purple-50 px-4 py-3 mb-5">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Icon name="QrCode" size={18} className="text-primary-600" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-warm-900 text-sm">Share with guests at the venue</p>
              <p className="text-xs text-warm-500 leading-snug">Guests scan the QR code to upload photos — no app, no account needed.</p>
            </div>
          </div>
          <QRButton
            url={shareUrl}
            label="Scan to add photos to the Memory Wall"
            variant="primary"
            className="flex-shrink-0 text-sm px-4 py-2"
          >
            Show QR Code
          </QRButton>
        </div>
      )}

      {canUpload && (
        <UploadForm slug={slug} onPosted={handlePosted}
          defaultName={defaultName} defaultEmail={defaultEmail} />
      )}

      {loading && (
        <div className="text-center py-10 text-warm-400 text-sm">Loading memories…</div>
      )}

      {!loading && posts.length === 0 && (
        <div className="text-center py-10">
          <div className="text-4xl mb-3">📷</div>
          <p className="text-warm-500 font-semibold text-sm">No memories yet.</p>
          {canUpload && <p className="text-warm-400 text-xs mt-1">Be the first to add a photo or video.</p>}
        </div>
      )}

      {posts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {posts.map(post => <WallPost key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}
