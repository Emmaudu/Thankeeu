import { normalizeCoverLayout } from '../utils/coverLayout';

/**
 * "Show on cover" switch for one cover text (title / recipient / sender).
 * Turning it off removes that text from the card cover completely — in the
 * builder preview, the delivered card and the signing page.
 *
 * Props: field, layout (form.cover_layout), onChange(nextLayout)
 */
export default function CoverFieldToggle({ field, layout, onChange }) {
  const L = normalizeCoverLayout(layout);
  const on = L[field].show;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange({ ...L, [field]: { ...L[field], show: !on } })}
      className="inline-flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] font-bold text-warm-500 hover:text-primary-600"
      title={on ? 'Shown on the card cover — click to remove it' : 'Removed from the card cover — click to show it'}
      style={{ minHeight: 0 }}
    >
      <span className={`relative inline-block h-4 w-7 flex-shrink-0 rounded-full transition-colors ${on ? 'bg-primary-500' : 'bg-gray-300'}`}>
        <span className={`absolute left-0 top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
      </span>
      {on ? 'On cover' : 'Hidden'}
    </button>
  );
}
