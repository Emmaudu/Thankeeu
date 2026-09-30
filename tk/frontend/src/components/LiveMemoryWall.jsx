/** Live Memory Wall: two-column, paginated carousel cards. */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Icon from './ui/Icon';
import QRButton from './QRButton';
import VoiceRecorder from './VoiceRecorder';

const API = import.meta.env.VITE_API_URL || '/api';
// Two columns × three rows, then pagination.
const PAGE_SIZE = 6;
const CARD_COLOURS = ['#7c3aed', '#ec4899', '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6'];

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function parseGallery(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try { return JSON.parse(value); } catch { return []; }
}

function WallPost({ post, index }) {
  const [slide, setSlide] = useState(0);
  const colour = CARD_COLOURS[index % CARD_COLOURS.length];
  const media = useMemo(() => {
    const gallery = parseGallery(post.media_gallery).map(item => typeof item === 'string' ? { url: item, type: 'image' } : item);
    const primary = post.media_url ? [{ url: post.media_url, type: post.media_type || 'image' }] : [];
    return [...primary, ...gallery.filter(item => item?.url && item.url !== post.media_url)];
  }, [post.media_gallery, post.media_type, post.media_url]);
  const active = media[slide];
  const move = d => setSlide(v => (v + d + media.length) % media.length);

  return (
    <article className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-[0_10px_30px_rgba(76,29,149,0.10)]">
      {active && (
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-warm-100">
          {active.type === 'video' && <video src={active.url} controls className="h-full w-full object-cover bg-black" playsInline preload="metadata" />}
          {active.type === 'voice' && <div className="flex w-full flex-col items-center gap-3 px-4"><span className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg" style={{ background: colour }}><Icon name="Mic" size={25} /></span><p className="text-xs font-bold text-warm-600">Voice note from {post.author_name}</p><audio src={active.url} controls className="w-full" preload="metadata" /></div>}
          {!['video', 'voice'].includes(active.type) && <img src={active.url} alt={post.caption || `Memory from ${post.author_name}`} className="h-full w-full object-cover" loading="lazy" />}
          {media.length > 1 && <>
            <button type="button" aria-label="Previous media" onClick={() => move(-1)} className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary-600 shadow"><Icon name="ChevronLeft" size={16} /></button>
            <button type="button" aria-label="Next media" onClick={() => move(1)} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary-600 shadow"><Icon name="ChevronRight" size={16} /></button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-black/30 px-2 py-1.5">{media.map((_, i) => <button key={i} type="button" aria-label={`Show media ${i + 1}`} onClick={() => setSlide(i)} className={`h-1.5 rounded-full transition-all ${i === slide ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`} />)}</div>
          </>}
        </div>
      )}
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-black text-white" style={{ background: colour }}>{post.author_name?.[0]?.toUpperCase() || '?'}</span>
          <div className="min-w-0"><p className="truncate text-sm font-bold text-warm-900">{post.author_name}</p><p className="text-[10px] text-warm-400">{timeAgo(post.created_at)}{media.length > 1 ? ` - ${slide + 1}/${media.length}` : ''}</p></div>
          {active && <span className="ml-auto rounded-lg bg-purple-50 px-2 py-0.5 text-[10px] font-extrabold capitalize text-primary-600">{active.type === 'voice' ? 'Voice note' : active.type}</span>}
        </div>
        {post.message && <p className="text-sm font-semibold leading-relaxed text-warm-800">{post.message}</p>}
        {post.caption && <p className="mt-1.5 text-xs italic leading-relaxed text-warm-500">{post.caption}</p>}
      </div>
    </article>
  );
}

function UploadForm({ slug, onPosted, defaultName = '', defaultEmail = '' }) {
  const [name, setName] = useState(defaultName);
  const [message, setMessage] = useState('');
  const [caption, setCaption] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const photoRef = useRef();
  const videoRef = useRef();

  const addFiles = files => {
    setUploadError(null);
    const remaining = Math.max(0, 5 - items.length);
    const candidates = Array.from(files || []);
    if (candidates.length > remaining) setUploadError('Each carousel card can contain up to five media items.');
    const accepted = candidates.slice(0, remaining).filter(file => {
      const supported = file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/');
      if (!supported) {
        setUploadError(`${file.name} is not a supported photo, GIF, video or audio file.`);
        return false;
      }
      const maxBytes = file.type.startsWith('image/') ? 9 * 1024 * 1024 : 50 * 1024 * 1024;
      if (file.size > maxBytes) {
        setUploadError(`${file.name} is too large. Photos/GIFs must be under 9MB; video/audio must be under 50MB.`);
        return false;
      }
      return true;
    });
    const next = accepted.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setItems(current => [...current, ...next].slice(0, 5));
  };
  const removeItem = index => setItems(current => { URL.revokeObjectURL(current[index].preview); return current.filter((_, i) => i !== index); });

  const handleSubmit = async () => {
    if (!name.trim() || (!items.length && !message.trim() && !caption.trim())) return;
    setLoading(true); setUploadError(null);
    try {
      const fd = new FormData();
      fd.append('author_name', name.trim());
      if (defaultEmail) fd.append('author_email', defaultEmail);
      if (message.trim()) fd.append('message', message.trim());
      if (caption.trim()) fd.append('caption', caption.trim());
      items.forEach((item, i) => fd.append(i === 0 ? 'media' : `media_gallery_${i}`, item.file));
      const res = await fetch(`${API}/wall/${slug}`, { method: 'POST', body: fd });
      let data = {}; try { data = await res.json(); } catch { /* non-JSON body */ }
      if (!res.ok) throw new Error(data.error || 'Upload failed. Please try again.');
      onPosted(data.post);
      items.forEach(item => URL.revokeObjectURL(item.preview));
      setItems([]); setMessage(''); setCaption('');
      if (photoRef.current) photoRef.current.value = '';
      if (videoRef.current) videoRef.current.value = '';
    } catch (err) { setUploadError(err.message || 'Upload failed. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="mb-6 rounded-2xl border-2 border-primary-100 bg-primary-50 p-4">
      <p className="mb-1 text-sm font-black text-warm-900">Add your carousel card</p>
      <p className="mb-4 text-xs text-warm-500">Your name, caption, message and up to five photos, GIFs, videos or voice notes stay together as one swipeable card.</p>
      <label className="mb-3 block"><span className="mb-1 block text-[11px] font-extrabold text-warm-600">Your name</span><input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" maxLength={80} className="w-full rounded-xl border border-purple-200 bg-white px-3 py-2.5 text-sm focus:border-primary-400 focus:outline-none" /></label>
      {items.length > 0 && <div className="mb-3 grid grid-cols-3 gap-2">{items.map((item, i) => <div key={item.preview} className="relative aspect-square overflow-hidden rounded-xl bg-white">
        {item.file.type.startsWith('video/') ? <video src={item.preview} className="h-full w-full object-cover" /> : item.file.type.startsWith('audio/') ? <div className="flex h-full flex-col items-center justify-center text-primary-600"><Icon name="Mic" size={22} /><span className="mt-1 text-[9px] font-bold">Voice note</span></div> : <img src={item.preview} className="h-full w-full object-cover" alt="Upload preview" />}
        <button type="button" onClick={() => removeItem(i)} aria-label="Remove media" className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"><Icon name="X" size={12} /></button>
      </div>)}</div>}
      <label className="mb-2 block"><span className="mb-1 block text-[11px] font-extrabold text-warm-600">Message</span><textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your message…" rows={3} maxLength={600} className="w-full resize-none rounded-xl border border-purple-200 bg-white px-3 py-2.5 text-sm focus:border-primary-400 focus:outline-none" /></label>
      <label className="mb-3 block"><span className="mb-1 block text-[11px] font-extrabold text-warm-600">Photo or video caption</span><input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Add a short caption (optional)" maxLength={300} className="w-full rounded-xl border border-purple-200 bg-white px-3 py-2.5 text-sm focus:border-primary-400 focus:outline-none" /></label>
      <input type="file" ref={photoRef} accept="image/*" multiple className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
      <input type="file" ref={videoRef} accept="video/*" multiple className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => photoRef.current?.click()} disabled={items.length >= 5} className="flex items-center gap-1.5 rounded-xl border-2 border-purple-200 bg-white px-3 py-2.5 text-xs font-bold text-warm-600 disabled:opacity-40"><Icon name="Image" size={15} />Photos / GIFs</button>
        <button type="button" onClick={() => videoRef.current?.click()} disabled={items.length >= 5} className="flex items-center gap-1.5 rounded-xl border-2 border-purple-200 bg-white px-3 py-2.5 text-xs font-bold text-warm-600 disabled:opacity-40"><Icon name="Video" size={15} />Videos</button>
        <VoiceRecorder onRecorded={file => addFiles([file])} disabled={loading || items.length >= 5} />
        <button type="button" onClick={handleSubmit} disabled={loading || (!items.length && !message.trim() && !caption.trim()) || !name.trim()} className="ml-auto flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{loading ? <Icon name="Loader" size={15} className="animate-spin" /> : <Icon name="Upload" size={15} />}{loading ? 'Uploading...' : 'Post card'}</button>
      </div>
      {uploadError && <p className="mt-2 text-center text-xs text-red-500">{uploadError}</p>}
    </div>
  );
}

export default function LiveMemoryWall({ slug, canUpload = true, defaultName = '', defaultEmail = '', wallUrl = '' }) {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/wall/${slug}?page=${page}&limit=${PAGE_SIZE}`);
      if (!res.ok) return;
      const data = await res.json();
      setPosts(data.posts || []);
      setPagination(data.pagination || { page, total: data.posts?.length || 0, totalPages: 1 });
    } catch { /* non-fatal */ } finally { setLoading(false); }
  }, [slug, page]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => { if (!canUpload) return undefined; const timer = setInterval(fetchPosts, 15000); return () => clearInterval(timer); }, [canUpload, fetchPosts]);
  const handlePosted = () => { if (page !== 1) setPage(1); else fetchPosts(); };
  const shareUrl = wallUrl || (typeof window !== 'undefined' ? `${window.location.origin}/sign/${slug}?tab=wall` : '');
  const totalPages = Math.max(1, pagination.totalPages || 1);

  return (
    <div>
      <style>{`.live-wall-scroll::-webkit-scrollbar{width:12px}.live-wall-scroll::-webkit-scrollbar-track{background:#ede9fe;border-radius:999px}.live-wall-scroll::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#7c3aed,#ec4899,#f59e0b);border:2px solid #ede9fe;border-radius:999px}`}</style>
      {canUpload && shareUrl && <div className="mb-5 flex flex-col items-start gap-3 rounded-2xl border-2 border-purple-100 bg-purple-50 px-4 py-3 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-center gap-3"><span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100"><Icon name="QrCode" size={18} className="text-primary-600" /></span><div className="min-w-0"><p className="text-sm font-bold text-warm-900">Share with guests at the venue</p><p className="text-xs leading-snug text-warm-500">Guests scan once and add their own carousel card - no app or account.</p></div></div><QRButton url={shareUrl} label="Scan to add to the Memory Wall" variant="primary" className="flex-shrink-0 px-4 py-2 text-sm">Show QR Code</QRButton></div>}
      {canUpload && <UploadForm slug={slug} onPosted={handlePosted} defaultName={defaultName} defaultEmail={defaultEmail} />}
      {loading && posts.length === 0 && <div className="py-10 text-center text-sm text-warm-400">Loading memories...</div>}
      {!loading && posts.length === 0 && <div className="py-10 text-center"><div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-500"><Icon name="Camera" size={26} /></div><p className="text-sm font-semibold text-warm-500">No memories yet.</p>{canUpload && <p className="mt-1 text-xs text-warm-400">Be the first to add a carousel card.</p>}</div>}
      {posts.length > 0 && <div className="live-wall-scroll max-h-[1050px] overflow-y-auto pr-2" style={{ scrollbarColor: '#ec4899 #ede9fe', scrollbarWidth: 'thin' }}><div className="grid grid-cols-2 gap-3 sm:gap-4">{posts.map((post, index) => <WallPost key={post.id} post={post} index={index} />)}</div></div>}
      {totalPages > 1 && <nav aria-label="Memory Wall pages" className="mt-5 flex flex-wrap items-center justify-center gap-2"><button type="button" onClick={() => setPage(1)} disabled={page === 1} className="rounded-xl border border-purple-100 bg-white px-3 py-2 text-xs font-bold text-primary-600 disabled:opacity-30">First</button><button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600 disabled:opacity-30"><Icon name="ChevronLeft" size={17} /></button><label className="flex items-center gap-2 rounded-xl border border-purple-100 bg-white px-3 py-2 text-xs font-bold text-warm-600">Page <select aria-label="Jump to wall page" value={page} onChange={e => setPage(Number(e.target.value))} className="bg-transparent font-black text-primary-600 outline-none">{Array.from({ length: totalPages }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} of {totalPages}</option>)}</select></label><button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600 disabled:opacity-30"><Icon name="ChevronRight" size={17} /></button><button type="button" onClick={() => setPage(totalPages)} disabled={page === totalPages} className="rounded-xl border border-purple-100 bg-white px-3 py-2 text-xs font-bold text-primary-600 disabled:opacity-30">Last</button></nav>}
    </div>
  );
}
