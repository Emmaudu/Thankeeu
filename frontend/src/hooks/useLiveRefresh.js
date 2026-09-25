import { useEffect, useRef } from 'react';

/**
 * Keep a view "live": call `refresh` every `intervalMs` while the tab is
 * visible, and immediately when the user comes back to the tab/window.
 * Paused in background tabs so it costs nothing when no one is looking.
 */
export default function useLiveRefresh(refresh, intervalMs = 15000, enabled = true) {
  const fn = useRef(refresh);
  fn.current = refresh;
  useEffect(() => {
    if (!enabled) return undefined;
    let timer = null;
    const tick = () => { if (document.visibilityState === 'visible') fn.current?.(); };
    const start = () => { clearInterval(timer); timer = setInterval(tick, intervalMs); };
    const onVisible = () => { if (document.visibilityState === 'visible') { fn.current?.(); start(); } else clearInterval(timer); };
    start();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', tick);
    };
  }, [intervalMs, enabled]);
}
