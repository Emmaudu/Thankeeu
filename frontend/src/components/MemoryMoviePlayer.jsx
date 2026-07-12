/**
 * MemoryMoviePlayer.jsx
 * Displays Memory Movie status and player in CardView and Dashboard.
 * Polls the status endpoint until completed or failed.
 */
import { useState, useEffect, useCallback } from 'react';
import Icon from './ui/Icon';

// Match the rest of the app: relative '/api' base so Vercel's rewrite proxies
// to the Railway backend. A hardcoded domain here would bypass the proxy and
// break on preview deploys and any environment where the API host differs.
const API = import.meta.env.VITE_API_URL || '/api';

// Status → human label + colour
const STATUS_META = {
  none:       { label: 'Not generated',    colour: 'text-warm-400', icon: 'Film' },
  pending:    { label: 'Queued…',          colour: 'text-warm-400', icon: 'Clock' },
  queued:     { label: 'Preparing Movie…', colour: 'text-amber-500', icon: 'Clock' },
  rendering:  { label: 'Rendering…',       colour: 'text-primary-500', icon: 'Loader' },
  completed:  { label: 'Ready to watch',   colour: 'text-green-600', icon: 'CheckCircle' },
  failed:     { label: 'Generation failed', colour: 'text-red-500', icon: 'AlertCircle' },
};

/**
 * @param {string}   cardId          — card UUID
 * @param {string}   [initialStatus] — status from card row (movie_status)
 * @param {boolean}  [canGenerate]   — true if this viewer is the card owner
 * @param {string}   [accessToken]   — for authenticated requests
 */
export default function MemoryMoviePlayer({ cardId, initialStatus = 'none', canGenerate = false, accessToken }) {
  const [status,    setStatus]    = useState(initialStatus);
  const [movieUrl,  setMovieUrl]  = useState(null);
  const [thumbUrl,  setThumbUrl]  = useState(null);
  const [duration,  setDuration]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [playing,   setPlaying]   = useState(false);
  const [error,     setError]     = useState(null);

  const meta = STATUS_META[status] || STATUS_META.none;
  const isActive = status === 'queued' || status === 'rendering' || status === 'pending';

  // ── Poll while rendering ────────────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/movies/${cardId}`);
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data.status || 'none');
      if (data.movie_url)   setMovieUrl(data.movie_url);
      if (data.thumbnail_url) setThumbUrl(data.thumbnail_url);
      if (data.duration_secs) setDuration(data.duration_secs);
    } catch { /* non-fatal */ }
  }, [cardId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!isActive) return;
    const t = setInterval(fetchStatus, 5000);
    return () => clearInterval(t);
  }, [isActive, fetchStatus]);

  // ── Generate / Regenerate ───────────────────────────────────────────────────
  const handleGenerate = async (regen = false) => {
    setLoading(true);
    setError(null);
    try {
      // The app authenticates with Bearer tokens from localStorage (user or
      // company). Pick whichever is present so the card owner is recognised.
      const token = accessToken
        || localStorage.getItem('thankeeu_token')
        || localStorage.getItem('thankeeu_company_token');
      const endpoint = regen ? 'regenerate' : 'generate';
      const res = await fetch(`${API}/movies/${cardId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start generation');
      setStatus(data.status);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Format seconds to m:ss ──────────────────────────────────────────────────
  const fmtDuration = s => s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : null;

  return (
    <div className="rounded-2xl overflow-hidden border border-purple-100 bg-gradient-to-br from-[#0d0020] to-[#1a0533] text-white shadow-xl">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎥</span>
          <div>
            <p className="font-bold text-sm">Thankeeu Memory Movie™</p>
            <p className="text-xs text-white/50">A cinematic keepsake from everyone who signed</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${meta.colour}`}>
          <Icon name={meta.icon} size={14} className={isActive ? 'animate-spin' : ''} />
          {meta.label}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Player — shown when completed */}
        {status === 'completed' && movieUrl && (
          <div className="mb-4">
            {!playing ? (
              <div className="relative rounded-xl overflow-hidden cursor-pointer group"
                style={{ aspectRatio: '16/9', background: '#0d0020' }}
                onClick={() => setPlaying(true)}>
                {thumbUrl && (
                  <img src={thumbUrl} alt="Memory Movie preview"
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity" />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center
                    group-hover:scale-110 transition-transform shadow-2xl border border-white/30">
                    <Icon name="Play" size={28} className="text-white ml-1" />
                  </div>
                </div>
                {duration && (
                  <span className="absolute bottom-3 right-3 text-xs text-white/80 bg-black/50 px-2 py-0.5 rounded-full font-mono">
                    {fmtDuration(duration)}
                  </span>
                )}
              </div>
            ) : (
              <video
                src={movieUrl}
                controls autoPlay
                className="w-full rounded-xl"
                style={{ aspectRatio: '16/9', background: '#000' }}
              />
            )}

            {/* Action buttons */}
            <div className="flex gap-3 mt-3">
              <a href={movieUrl} download target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                  bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors border border-white/20">
                <Icon name="Download" size={15} /> Download MP4
              </a>
              <button onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: 'My Thankeeu Memory Movie', url: movieUrl });
                  } else {
                    navigator.clipboard.writeText(movieUrl);
                    alert('Movie link copied!');
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                  bg-primary-500 hover:bg-primary-600 text-sm font-semibold transition-colors">
                <Icon name="Share2" size={15} /> Share Movie
              </button>
            </div>
          </div>
        )}

        {/* Rendering progress */}
        {isActive && (
          <div className="py-6 text-center">
            <div className="w-12 h-12 rounded-full border-2 border-primary-400 border-t-transparent
              animate-spin mx-auto mb-3" />
            <p className="text-sm text-white/70">Creating your cinematic memory…</p>
            <p className="text-xs text-white/40 mt-1">
              This usually takes 2–5 minutes depending on photos and videos
            </p>
          </div>
        )}

        {/* Not yet generated — show generate button */}
        {status === 'none' && canGenerate && (
          <div className="py-4 text-center">
            <p className="text-sm text-white/60 mb-4">
              Turn every message, photo, video and voice note into one beautiful movie.
            </p>
            <button onClick={() => handleGenerate(false)} disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600
                hover:from-primary-600 hover:to-purple-700 font-bold text-sm transition-all
                shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Starting…' : 'Create Memory Movie'}
            </button>
          </div>
        )}

        {/* Failed state */}
        {status === 'failed' && (
          <div className="py-4 text-center">
            <p className="text-sm text-red-300 mb-3">
              Generation failed. Please try again.
            </p>
            {canGenerate && (
              <button onClick={() => handleGenerate(true)} disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold
                  transition-colors border border-white/20 disabled:opacity-50">
                {loading ? 'Starting…' : '↻ Try Again'}
              </button>
            )}
          </div>
        )}

        {error && (
          <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
        )}

        {/* Regenerate link (completed + owner) */}
        {status === 'completed' && canGenerate && (
          <p className="text-center mt-2">
            <button onClick={() => handleGenerate(true)} disabled={loading}
              className="text-xs text-white/30 hover:text-white/60 transition-colors">
              ↻ Regenerate with latest messages
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
