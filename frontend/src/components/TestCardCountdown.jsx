/**
 * TestCardCountdown — the five seconds between "we have your card" and
 * "your card is live".
 *
 * Deliberately theatrical: a big camera-style ring counting 5…4…3…2…1 while
 * the free credit is spent behind it. The point is that the customer sees the
 * moment happen rather than a spinner, and has a way out before it does.
 *
 * The credit is only spent when the countdown reaches zero, and only once —
 * `firedRef` guards against a re-render or a double mount spending twice.
 */
import { useEffect, useRef, useState } from 'react';

const RING = 2 * Math.PI * 54;

const TestCardCountdown = ({ seconds = 25, recipientName, onComplete, onCancel }) => {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(true);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!running) return undefined;
    if (left <= 0) {
      if (firedRef.current) return undefined;
      firedRef.current = true;          // spend exactly once
      onComplete?.();
      return undefined;
    }
    const t = window.setTimeout(() => setLeft(n => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left, running, onComplete]);

  const stop = () => { setRunning(false); onCancel?.(); };

  return (
    // Docked, not modal. The card stays editable while this runs — the whole
    // point is that they can keep adjusting and stop the timer if they want
    // longer, rather than being locked out by an overlay.
    <div className="fixed bottom-4 right-4 z-[999] w-[min(92vw,320px)] rounded-3xl p-5 shadow-2xl"
      style={{ background: 'rgba(26,16,53,0.96)', backdropFilter: 'blur(8px)' }}
      role="status" aria-live="polite"
      aria-label={`Publishing your card in ${left} seconds`}>
      <style>{`
        @keyframes tkPulse { 0%,100% { transform:scale(1) } 50% { transform:scale(1.06) } }
        .tk-count { animation: tkPulse 1s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .tk-count { animation:none } }
      `}</style>

      <div className="w-full text-center">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-purple-200">
          Free test card
        </p>
        <h2 className="mb-4 text-base font-bold leading-snug text-white">
          Publishing{recipientName ? ` ${recipientName}'s card` : ' your card'}…
        </h2>

        <div className="relative mx-auto mb-4" style={{ width: 120, height: 120 }}>
          <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="7" />
            <circle cx="60" cy="60" r="54" fill="none" stroke="#F472B6" strokeWidth="7"
              strokeLinecap="round" strokeDasharray={RING}
              strokeDashoffset={RING * (1 - left / seconds)}
              style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="tk-count font-extrabold text-white"
              style={{ fontSize: 54, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {Math.max(0, left)}
            </span>
          </div>
        </div>

        <p className="mx-auto mb-3 text-xs leading-relaxed text-purple-100">
          Using your <strong className="text-white">1 free credit</strong>. Keep editing if you
          like — this publishes when it reaches zero.
        </p>

        {/* Deliberately quiet: available, never competing with the card itself. */}
        <button type="button" onClick={stop}
          className="text-xs font-semibold text-purple-300 underline underline-offset-2 transition-colors hover:text-white"
          style={{ minHeight: 0 }}>
          Stop the timer — I'll send it myself
        </button>
      </div>
    </div>
  );
};

export default TestCardCountdown;
