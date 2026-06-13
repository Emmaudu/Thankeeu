import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

// GIPHY public beta key — works out of the box for low-volume/demo usage.
// For production, set VITE_GIPHY_API_KEY to your own free GIPHY API key
// (https://developers.giphy.com/) to avoid shared-key rate limits.
const GIPHY_KEY = import.meta.env.VITE_GIPHY_API_KEY || 'dc6zaTOxFJmzC';
const GIPHY_BASE = 'https://api.giphy.com/v1/gifs';

// Quick-filter chips for common card-signing occasions — tapping one
// searches GIPHY for that term so signers always have "many many many"
// celebration GIFs to choose from.
const CATEGORIES = [
  'Celebration', 'Happy Birthday', 'Congratulations', 'Party',
  'Cheers', 'Confetti', 'Dancing', 'Love', 'Thank You', 'High Five',
  'Hug', 'Good Luck',
];

const GifPicker = ({ onSelect, onClose }) => {
  const [query, setQuery]     = useState('');
  const [gifs, setGifs]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(null); // id of gif being downloaded
  const [activeCat, setActiveCat] = useState('Celebration');
  const [offset, setOffset]   = useState(0);
  const ref = useRef();
  const debounceRef = useRef();

  const fetchGifs = useCallback(async (term, append = false, nextOffset = 0) => {
    setLoading(true);
    try {
      const endpoint = term?.trim()
        ? `${GIPHY_BASE}/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(term.trim())}&limit=24&offset=${nextOffset}&rating=g&bundle=messaging_non_clips`
        : `${GIPHY_BASE}/trending?api_key=${GIPHY_KEY}&limit=24&offset=${nextOffset}&rating=g&bundle=messaging_non_clips`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('GIPHY request failed');
      const data = await res.json();
      const results = data?.data || [];
      setGifs(prev => append ? [...prev, ...results] : results);
      setOffset(nextOffset);
    } catch {
      if (!append) setGifs([]);
      toast.error('Could not load GIFs right now — please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load — default to "Celebration"
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

  // Download the chosen GIF and turn it into a File so it slots into the
  // existing media upload pipeline (addMediaFiles -> 'media'/'media_gallery_N')
  const handleSelectGif = async (gif) => {
    const url = gif.images?.original?.url || gif.images?.downsized?.url;
    if (!url) return toast.error('This GIF is unavailable, please pick another.');
    setDownloading(gif.id);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('download failed');
      const blob = await res.blob();
      if (blob.size > 50 * 1024 * 1024) { toast.error('That GIF is too large (max 50MB)'); return; }
      const file = new File([blob], `${gif.slug || 'gif'}.gif`, { type: 'image/gif' });
      onSelect(file);
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
      <div className="p-2 border-b border-purple-50">
        <input
          type="text"
          value={query}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Search GIFs (e.g. birthday, congrats, dance)..."
          className="input text-sm py-2"
        />
      </div>
      <div className="flex gap-1.5 px-2 py-2 border-b border-purple-50 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} type="button" onClick={() => handleCategoryClick(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeCat === cat ? 'bg-pink-500 text-white' : 'bg-pink-50 text-pink-600 hover:bg-pink-100'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="p-2 max-h-72 overflow-y-auto">
        {loading && gifs.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
          </div>
        ) : gifs.length === 0 ? (
          <p className="text-center text-sm text-warm-400 py-8">No GIFs found. Try a different search.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-1.5">
              {gifs.map(gif => {
                const thumb = gif.images?.fixed_width_small?.url || gif.images?.preview_gif?.url || gif.images?.original?.url;
                return (
                  <button key={gif.id} type="button" onClick={() => handleSelectGif(gif)}
                    disabled={downloading !== null}
                    className="relative rounded-xl overflow-hidden aspect-square bg-purple-50 hover:ring-2 hover:ring-pink-400 transition-all disabled:opacity-50">
                    <img src={thumb} alt={gif.title || 'GIF'} loading="lazy" className="w-full h-full object-cover" />
                    {downloading === gif.id && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
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
