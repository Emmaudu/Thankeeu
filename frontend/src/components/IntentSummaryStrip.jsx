/**
 * IntentSummaryStrip — "here's what we understood" above the wizard.
 *
 * The point is correctability. Pre-filling a form silently is how a customer
 * ends up sending a card to the wrong name on the wrong day; showing the
 * reading back, in plain words, makes a mistake obvious in one glance while
 * every field underneath stays editable.
 */
import { useState } from 'react';
import Icon from './ui/Icon';

const IntentSummaryStrip = ({ items = [] }) => {
  const [hidden, setHidden] = useState(false);
  if (!items.length || hidden) return null;

  return (
    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-purple-100 bg-purple-50/70 px-4 py-3">
      <span className="mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-white">
        <Icon name="Sparkles" size={14} className="text-primary-600" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-warm-900">Here's what we set up from your words</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {items.map((it) => (
            <span key={it.key}
              className="rounded-full border border-purple-200 bg-white px-2.5 py-1 text-xs font-semibold text-warm-700">
              {it.label}
            </span>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-warm-500">Not right? Change anything below — nothing is locked in.</p>
      </div>
      <button type="button" onClick={() => setHidden(true)} aria-label="Dismiss"
        className="flex-shrink-0 text-warm-400 hover:text-warm-600" style={{ minHeight: 0 }}>
        <Icon name="X" size={15} />
      </button>
    </div>
  );
};

export default IntentSummaryStrip;
