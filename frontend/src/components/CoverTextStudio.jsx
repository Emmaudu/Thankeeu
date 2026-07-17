import { useMemo } from 'react';
import CardCoverPreview from './CardCoverPreview';
import Icon from './ui/Icon';
import {
  normalizeCoverLayout, DEFAULT_COVER_LAYOUT, COVER_FIELDS, COVER_TEXT_SWATCHES,
} from '../utils/coverLayout';

const FIELD_META = {
  recipient: { label: 'Recipient name', icon: 'User' },
  title: { label: 'Card title', icon: 'FileText' },
  sender: { label: 'Sender line', icon: 'PenLine' },
};

/**
 * CoverTextStudio — lets the creator drag, resize, recolour and show/hide the
 * three cover texts. Emits the full normalized layout via onChange.
 *
 * Props:
 *   design, occasionLabel, recipientName, title, senderName, coverColor,
 *   textColor, fontFamily  → passed straight to CardCoverPreview
 *   layout                 → current cover_layout (object | null)
 *   onChange(nextLayout)
 *   selected, onSelect     → controlled selected field
 */
const CoverTextStudio = ({
  design, occasionLabel, recipientName, title, senderName,
  coverColor, textColor, fontFamily,
  layout, onChange, selected, onSelect,
}) => {
  const L = useMemo(() => normalizeCoverLayout(layout), [layout]);
  const active = selected && FIELD_META[selected] ? selected : 'recipient';
  const cfg = L[active];

  const update = (field, patch) => {
    const next = { ...L, [field]: { ...L[field], ...patch } };
    onChange?.(next);
  };
  const nudge = (field, dx, dy) => {
    const c = L[field];
    update(field, {
      x: Math.min(96, Math.max(4, c.x + dx)),
      y: Math.min(96, Math.max(4, c.y + dy)),
    });
  };

  return (
    <div className="mb-5 border-t border-purple-100 pt-5">
      <p className="text-sm font-bold text-warm-700">Cover text studio</p>
      <p className="mt-0.5 text-xs text-warm-500 mb-3">
        Drag any text to reposition it, resize and recolour it, or hide it if the artwork looks better on its own.
      </p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,300px)_1fr] items-start">
        {/* Live editable preview */}
        <div className="mx-auto w-full max-w-[300px]">
          <CardCoverPreview
            design={design}
            occasionLabel={occasionLabel}
            recipientName={recipientName}
            title={title}
            senderName={senderName}
            coverColor={coverColor}
            textColor={textColor}
            fontFamily={fontFamily}
            layout={L}
            editable
            selected={active}
            onSelect={onSelect}
            onLayoutChange={onChange}
          />
          <p className="mt-1.5 text-center text-[11px] text-warm-400">Tap a text to select · drag to move</p>
        </div>

        {/* Controls */}
        <div>
          {/* Field selector + show/hide toggles */}
          <div className="space-y-2 mb-4">
            {COVER_FIELDS.map((field) => {
              const meta = FIELD_META[field];
              const isSel = active === field;
              const fc = L[field];
              return (
                <div
                  key={field}
                  className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 transition-all ${isSel ? 'border-primary-400 bg-primary-50' : 'border-purple-100 bg-white'}`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect?.(field)}
                    className="flex flex-1 items-center gap-2 text-left min-w-0"
                  >
                    <span className={isSel ? 'text-primary-500' : 'text-warm-400'}>
                      <Icon name={meta.icon} size={16} />
                    </span>
                    <span className={`text-sm font-bold truncate ${fc.show ? 'text-warm-800' : 'text-warm-400 line-through'}`}>
                      {meta.label}
                    </span>
                  </button>
                  {/* Show / hide on cover */}
                  <button
                    type="button"
                    onClick={() => update(field, { show: !fc.show })}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold transition-colors ${fc.show ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-warm-500'}`}
                    aria-pressed={fc.show}
                    title={fc.show ? 'Showing on cover — tap to hide' : 'Hidden — tap to show'}
                  >
                    <Icon name={fc.show ? 'Eye' : 'EyeOff'} size={12} />
                    {fc.show ? 'Show' : 'Hide'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Per-field size / colour / nudge for the active field */}
          {cfg.show ? (
            <div className="rounded-2xl border border-purple-100 p-3.5">
              <p className="text-xs font-extrabold uppercase tracking-wide text-warm-500 mb-2.5">
                {FIELD_META[active].label}
              </p>

              {/* Size */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-warm-600">Text size</span>
                  <span className="text-[11px] font-bold text-primary-600">{Math.round(cfg.size)}</span>
                </div>
                <input
                  type="range" min={7} max={120} step={1} value={cfg.size}
                  onChange={(e) => update(active, { size: Number(e.target.value) })}
                  className="w-full accent-primary-500"
                />
              </div>

              {/* Colour */}
              <div className="mb-3">
                <span className="text-xs font-bold text-warm-600 block mb-1.5">Text colour</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => update(active, { color: 'auto' })}
                    className={`h-8 rounded-lg border px-2.5 text-[11px] font-extrabold ${cfg.color === 'auto' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-purple-100 bg-white text-warm-600'}`}
                  >
                    Auto
                  </button>
                  {COVER_TEXT_SWATCHES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => update(active, { color: c })}
                      className={`h-8 w-8 rounded-full border-2 ${cfg.color === c ? 'ring-2 ring-primary-300 border-primary-500' : 'border-white shadow-sm'}`}
                      style={{ backgroundColor: c }}
                      aria-label={`Use ${c}`}
                    />
                  ))}
                  {/* Custom colour */}
                  <label className="h-8 w-8 rounded-full border-2 border-white shadow-sm overflow-hidden relative cursor-pointer"
                    title="Custom colour"
                    style={{ background: 'conic-gradient(from 0deg,#f87171,#fbbf24,#34d399,#60a5fa,#a78bfa,#f472b6,#f87171)' }}>
                    <input
                      type="color"
                      value={cfg.color === 'auto' ? '#7c3aed' : cfg.color}
                      onChange={(e) => update(active, { color: e.target.value })}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Fine nudge pad */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-warm-600">Nudge position</span>
                <div className="grid grid-cols-3 gap-1">
                  <span />
                  <button type="button" onClick={() => nudge(active, 0, -2)} className="h-7 w-7 rounded-lg bg-purple-50 text-primary-600 flex items-center justify-center"><Icon name="ChevronUp" size={14} /></button>
                  <span />
                  <button type="button" onClick={() => nudge(active, -2, 0)} className="h-7 w-7 rounded-lg bg-purple-50 text-primary-600 flex items-center justify-center"><Icon name="ChevronLeft" size={14} /></button>
                  <button type="button" onClick={() => update(active, { x: DEFAULT_COVER_LAYOUT[active].x, y: DEFAULT_COVER_LAYOUT[active].y })} className="h-7 w-7 rounded-lg bg-purple-50 text-primary-600 flex items-center justify-center" title="Center reset"><Icon name="Target" size={13} /></button>
                  <button type="button" onClick={() => nudge(active, 2, 0)} className="h-7 w-7 rounded-lg bg-purple-50 text-primary-600 flex items-center justify-center"><Icon name="ChevronRight" size={14} /></button>
                  <span />
                  <button type="button" onClick={() => nudge(active, 0, 2)} className="h-7 w-7 rounded-lg bg-purple-50 text-primary-600 flex items-center justify-center"><Icon name="ChevronDown" size={14} /></button>
                  <span />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-purple-200 p-4 text-center text-xs text-warm-500">
              {FIELD_META[active].label} is hidden on the cover. Tap <strong>Show</strong> above to bring it back.
            </div>
          )}

          <button
            type="button"
            onClick={() => onChange?.(DEFAULT_COVER_LAYOUT)}
            className="mt-3 text-xs font-bold text-warm-500 hover:text-primary-600 inline-flex items-center gap-1"
          >
            <Icon name="Refresh" size={13} /> Reset layout to default
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoverTextStudio;
