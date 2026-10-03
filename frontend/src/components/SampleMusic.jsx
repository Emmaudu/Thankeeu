import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import api from '../utils/api';

const FALLBACK = '/card-music.mp3';
const VOLUME = 0.22;

/**
 * Soft background music for the sample card: the same soundtrack Memory
 * Movies use. Browsers block sound until the visitor interacts, so it starts
 * on the first tap, click or key press, fades in, loops, and can be muted.
 */
export default function SampleMusic() {
  const audio = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(() => {
    try { return sessionStorage.getItem('tk_sample_muted') === '1'; } catch { return false; }
  });
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    const el = new Audio(FALLBACK);
    el.loop = true; el.preload = 'none'; el.volume = 0;
    audio.current = el;
    let alive = true;
    api.get('/movie-music').then(r => {
      const url = r?.data?.url;
      if (alive && url && /^https:\/\//.test(url) && el.paused) el.src = url;
    }).catch(() => {});

    const fadeIn = () => {
      let v = 0;
      const t = setInterval(() => { v = Math.min(VOLUME, v + 0.02); el.volume = v; if (v >= VOLUME) clearInterval(t); }, 120);
    };
    const start = () => {
      if (mutedRef.current || !el.paused) return;
      el.play().then(() => { setPlaying(true); fadeIn(); }).catch(() => {
        if (el.src.endsWith(FALLBACK)) return;
        el.src = FALLBACK; el.play().then(() => { setPlaying(true); fadeIn(); }).catch(() => {});
      });
    };
    const evs = ['pointerdown', 'keydown', 'touchstart'];
    const once = () => { start(); evs.forEach(e => window.removeEventListener(e, once)); };
    evs.forEach(e => window.addEventListener(e, once, { passive: true }));
    const onVis = () => { if (document.hidden) el.pause(); else if (!mutedRef.current && playing) el.play().catch(() => {}); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      alive = false;
      evs.forEach(e => window.removeEventListener(e, once));
      document.removeEventListener('visibilitychange', onVis);
      el.pause(); el.src = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (e) => {
    e.stopPropagation();
    const el = audio.current; if (!el) return;
    const next = !(playing && !muted);
    try { sessionStorage.setItem('tk_sample_muted', next ? '0' : '1'); } catch { /* private mode */ }
    if (next) {
      setMuted(false); mutedRef.current = false;
      el.volume = VOLUME;
      el.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      setMuted(true); el.pause(); setPlaying(false);
    }
  };

  const on = playing && !muted;
  return (
    <button type="button" onClick={toggle} onPointerDown={e => e.stopPropagation()}
      aria-label={on ? 'Mute the music' : 'Play the music'} aria-pressed={on}
      className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2.5 text-sm font-bold text-primary-700 shadow-lg ring-1 ring-primary-100 backdrop-blur transition hover:bg-white">
      {on ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      {on ? 'Music on' : 'Play music'}
    </button>
  );
}
