/**
 * ResumeDraftAlert — what a customer sees the moment they land back in the
 * dashboard with a saved draft.
 *
 * The old signal was a toast, which is gone in three seconds and easy to miss
 * on a phone. A card that is saved but unpaid is not finished, and the one
 * thing left to do should be impossible to overlook: pay, and it goes live.
 */
import { useState } from 'react';
import Icon from './ui/Icon';

const ResumeDraftAlert = ({ cardTitle, recipient, onPay }) => {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border-2 shadow-sm"
      style={{ borderColor: '#DDD6FE', background: 'linear-gradient(135deg,#FAF5FF 0%,#FDF2F8 55%,#F0F9FF 100%)' }}>
      {/* Stacked, not side-by-side. This sits inside the wizard column, which is
          far narrower than the viewport, so a `sm:flex-row` here squeezes the
          heading into three cramped lines while the media query still reports
          plenty of room. */}
      <div className="p-5">
        <div className="mb-2 flex items-start gap-3">
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl bg-white text-xl shadow-sm">
            🎉
          </span>
          <h3 className="min-w-0 flex-1 pt-1 text-lg font-bold leading-snug text-warm-900">
            Your card is saved{recipient ? ` for ${recipient}` : ''} — one step left
          </h3>
          <button type="button" onClick={() => setHidden(true)} aria-label="Dismiss"
            className="flex-shrink-0 text-warm-400 hover:text-warm-600" style={{ minHeight: 0 }}>
            <Icon name="X" size={16} />
          </button>
        </div>

        <p className="text-sm leading-relaxed text-warm-600">
          {cardTitle ? <><strong className="text-warm-800">{cardTitle}</strong> is ready. </> : null}
          Complete payment to publish it and get your sharing link, so everyone can start signing.
        </p>
        <p className="mt-1.5 text-xs text-warm-500">
          Nothing is sent until you pay — use <strong>Back</strong> and <strong>Next</strong> to check
          every detail first.
        </p>

        {onPay && (
          <button type="button" onClick={onPay}
            className="btn-primary mt-4 flex w-full items-center justify-center gap-2 py-3 font-bold">
            Continue to payment <Icon name="ArrowRight" size={15} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ResumeDraftAlert;
