import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getCachedResults, setCachedResults, getCachedBlob, setCachedBlob } from '../utils/gifCache';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const CATEGORIES = [
  'Celebration', 'Happy Birthday', 'Congratulations', 'Party',
  'Cheers', 'Confetti', 'Dancing', 'Love', 'Thank You', 'High Five',
  'Hug', 'Good Luck',
];

// In-session memory cache as a fast L1 layer in front of the persistent Cache API
const sessionResultsCache = new Map();
const sessionBlobCache    = new Map();

const GifPicker = ({ onSelect, onClose }) => {
  const [query, setQuery]             = useState('');
  const [gifs, setGifs]               = useState([]);
  const [loading, setLoading]         = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [activeCat, setActiveCat]     = useState('Celebration');
  const [offset, setOffset]           = useState(0);
  const [error, setError]             = useState(null);
  const [cachedIds, setCachedIds]     = useState(new Set()); // GIF ids whose blob is cached
  const ref         = useRef();
  const debounceRef = useRef();

  const fetchGifs = useCallback(async (term, append = false, nextOffset = 0) => {
    const cacheKey = `${term || '__trending__'}:${nextOffset}`;

    // L1: in-session memory cache (instant)
    if (sessionResultsCache.has(cacheKey)) {
      const cached = sessionResultsCache.get(cacheKey);
      setGifs(prev => append ? [...prev, ...cached] : cached);
      setOffset(nextOffset);
      setError(null);
      return;
    }

    // L2: persistent Cache API (fast, survives refresh)
    const persisted = await getCachedResults(cacheKey);
    if (persisted) {
      sessionResultsCache.set(cacheKey, persisted);
      setGifs(prev => append ? [...prev, ...persisted] : persisted);
      setOffset(nextOffset);
      setError(null);
      return;
    }

    // L3: network fetch
    setLoading(true);
    setError(null);
    try {
      const endpoint = term?.trim()
        ? `${API_BASE}/gifs/search?q=${encodeURIComponent(term.trim())}&limit=24&offset=${nextOffset}`
        : `${API_BASE}/gifs/trending?limit=24&offset=${nextOffset}`;

      const res = await fetch(endpoint);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `GIF service error (${res.status})`);
      }
      const data = await res.json();
      const results = data?.data || [];

      // Store in both caches
      sessionResultsCache.set(cacheKey, results);
      setCachedResults(cacheKey, results); // async, non-blocking

      setGifs(prev => append ? [...prev, ...results] : results);
      setOffset(nextOffset);
    } catch (err) {
      if (!append) setGifs([]);
      const msg = err.message || 'Could not load GIFs right now — please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGifs('Celebration', false, 0);
  }, [fetchGifs]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose?.(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleCategoryClick = (cat) => {
    setActiveCat(cat);
    setQuery('');
    fetchGifs(cat, false, 0);
  };

  const handleSearchChange = (val) => {
    setQuery(val);
    setActiveCat(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchGifs(val || 'Celebration', false, 0);
    }, 400);
  };

  const loadMore = () => fetchGifs(query || activeCat, true, offset + 24);

  const handleSelectGif = async (gif) => {
    const url = gif.images?.original?.url || gif.images?.downsized?.url;
    if (!url) return toast.error('This GIF is unavailable, please pick another.');

    // L1: in-session blob cache
    if (sessionBlobCache.has(url)) {
      const blob = sessionBlobCache.get(url);
      onSelect(new File([blob], `${gif.slug || 'gif'}.gif`, { type: 'image/gif' }));
      onClose?.();
      return;
    }

    // L2: persistent blob cache (saved as actual file in browser cache storage)
    const persistedBlob = await getCachedBlob(url);
    if (persistedBlob) {
      sessionBlobCache.set(url, persistedBlob);
      setCachedIds(prev => new Set([...prev, gif.id]));
      onSelect(new File([persistedBlob], `${gif.slug || 'gif'}.gif`, { type: 'image/gif' }));
      onClose?.();
      return;
    }

    // L3: download from network
    setDownloading(gif.id);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      if (blob.size > 50 * 1024 * 1024) { toast.error('That GIF is too large (max 50MB)'); return; }

      // Save to both caches — next time this GIF is selected it will be instant
      sessionBlobCache.set(url, blob);
      setCachedBlob(url, blob); // async, non-blocking — saves as actual file in Cache API
      setCachedIds(prev => new Set([...prev, gif.id]));

      onSelect(new File([blob], `${gif.slug || 'gif'}.gif`, { type: 'image/gif' }));
      onClose?.();
    } catch {
      toast.error('Could not load that GIF — please try another.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div ref={ref}
      className="absolute z-30 mt-2 w-full sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border-2 border-purple-100 shadow-xl overflow-hidden"
      style={{ left: 0 }}>

      {/* Search */}
      <div className="p-2 border-b border-purple-50">
        <input type="text" value={query}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Search GIFs (e.g. birthday, congrats, dance)..."
          className="input text-sm py-2" />
      </div>

      {/* Category chips */}
      <div className="flex gap-1.5 px-2 py-2 border-b border-purple-50 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} type="button" onClick={() => handleCategoryClick(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeCat === cat ? 'bg-pink-500 text-white' : 'bg-pink-50 text-pink-600 hover:bg-pink-100'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="p-2 max-h-72 overflow-y-auto">
        {loading && gifs.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-[3px] border-pink-200 border-t-pink-500 rounded-full animate-spin"/>
          </div>
        ) : error && gifs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-warm-400 mb-3">{error}</p>
            <button type="button" onClick={() => fetchGifs(query || activeCat || 'Celebration', false, 0)}
              className="text-xs font-bold text-pink-600 bg-pink-50 px-4 py-2 rounded-xl hover:bg-pink-100">
              Try again
            </button>
          </div>
        ) : gifs.length === 0 ? (
          <p className="text-center text-sm text-warm-400 py-8">No GIFs found. Try a different search.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-1.5">
              {gifs.map(gif => {
                const thumb = gif.images?.fixed_width_small?.url || gif.images?.preview_gif?.url || gif.images?.original?.url;
                const isCached = cachedIds.has(gif.id);
                return (
                  <button key={gif.id} type="button" onClick={() => handleSelectGif(gif)}
                    disabled={downloading !== null}
                    title={isCached ? '⚡ Cached — instant' : gif.title}
                    className={`relative rounded-xl overflow-hidden aspect-square bg-purple-50 hover:ring-2 hover:ring-pink-400 transition-all disabled:opacity-50 ${isCached ? 'ring-1 ring-emerald-300' : ''}`}>
                    <img src={thumb} alt={gif.title || 'GIF'} loading="lazy" className="w-full h-full object-cover"/>
                    {isCached && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                        <span style={{ fontSize: 8, color: '#fff', fontWeight: 'bold' }}>✓</span>
                      </div>
                    )}
                    {downloading === gif.id && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={loadMore} disabled={loading}
              className="w-full mt-2 py-2 rounded-xl text-xs font-bold text-pink-600 bg-pink-50 hover:bg-pink-100 disabled:opacity-60">
              {loading ? 'Loading...' : 'Load more GIFs'}
            </button>
          </>
        )}
      </div>

      <div className="px-3 py-1.5 border-t border-purple-50 text-center">
        <span className="text-[10px] text-warm-300 font-semibold tracking-wide">Powered by GIPHY</span>
      </div>
    </div>
  );
};

export default GifPicker;
