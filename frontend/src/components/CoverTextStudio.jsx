import { useMemo } from 'react';
import CardCoverPreview from './CardCoverPreview';
import Icon from './ui/Icon';
import Switch from './ui/Switch';
import {
  normalizeCoverLayout, DEFAULT_COVER_LAYOUT, COVER_FIELDS, COVER_TEXT_SWATCHES,
} from '../utils/coverLayout';

const FIELD_META = {
  // `short` is what the segmented picker shows: three full labels will not fit
  // on one row inside the wizard's ~250px control column, and letting them wrap
  // into a three-row stack is what left dead space beside the cover.
  recipient: { label: 'Recipient name', short: 'Name', icon: 'User' },
  title: { label: 'Card title', short: 'Title', icon: 'FileText' },
  sender: { label: 'Sender line', short: 'From', icon: 'PenLine' },
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
    <div className="cts mb-5 border-t border-purple-100 pt-5">
      {/*
        This panel does NOT get the viewport's width. In CardStart it lives in
        the wizard's left column (42% of the viewport, minus 128px of padding),
        so a 1366px laptop gives it ~444px and a 1280px one ~408px. Viewport
        breakpoints are therefore the wrong instrument here — `md:` fires at
        768px of viewport while this panel is still ~195px wide. We size against
        the panel's own width with a container query instead, which is also
        correct in CreateCard, where the container is a different width again.
      */}
      <style>{`
        .cts { container-type: inline-size; }
        .cts-row { display: grid; gap: 12px; align-items: start;
                   grid-template-columns: minmax(0, 170px) minmax(0, 1fr); }
        .cts-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; }
        .cts-swatches { scrollbar-width: thin;
          /* Fade the right edge so a cut-off swatch reads as "scroll me"
             rather than as a clipping bug. */
          -webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 22px), transparent 100%);
                  mask-image: linear-gradient(90deg, #000 calc(100% - 22px), transparent 100%); }
        .cts-swatches::-webkit-scrollbar { height: 4px; }
        .cts-swatches::-webkit-scrollbar-thumb { background: #E4DAFA; border-radius: 4px; }
        /* Roomier container: a bigger cover and the controls breathe out. */
        @container (min-width: 560px) {
          .cts-row { grid-template-columns: minmax(0, 212px) minmax(0, 1fr); gap: 16px; }
        }
        /* Tight column: the word "Nudge" is the first thing to go, so the
           action bar stays a single line at 1280px. */
        @container (max-width: 430px) { .cts-nudge-label { display: none; } }
        /* Very narrow (phone, or a squeezed wizard column): stack it. */
        @container (max-width: 340px) {
          .cts-row { grid-template-columns: minmax(0, 1fr); }
          .cts-cover { max-width: 212px; margin-inline: auto; }
        }
        /* No container-query support: fall back to the stacked layout, which is
           always legible, rather than a 150px column of controls. */
        @supports not (container-type: inline-size) {
          .cts-row { grid-template-columns: minmax(0, 1fr); }
          .cts-cover { max-width: 212px; margin-inline: auto; }
        }
      `}</style>
      <p className="text-sm font-bold text-warm-700">Cover text studio</p>
      <p className="mt-0.5 text-xs text-warm-500 mb-3">
        Drag any text to reposition it, resize and recolour it, or hide it if the artwork looks better on its own.
      </p>

      <div className="cts-row">
        {/* Live editable preview — deliberately compact so the controls get the
            width. It used to be 300px with a tall stacked panel beside it,
            which left a dead column on the left and pushed the page long. */}
        <div className="cts-cover w-full">
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

        {/* Controls — one horizontal toolbar that fills the space beside the
            cover instead of a tall stack underneath it. */}
        <div className="min-w-0">
          {/* Field picker — a single-row segmented control. */}
          <div className="mb-2.5 flex rounded-xl border border-purple-100 bg-purple-50/60 p-1">
            {COVER_FIELDS.map((field) => {
              const meta = FIELD_META[field];
              const isSel = active === field;
              const fc = L[field];
              return (
                <button
                  key={field}
                  type="button"
                  onClick={() => onSelect?.(field)}
                  aria-pressed={isSel}
                  title={meta.label}
                  className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-1.5 py-1.5 text-[12px] font-bold transition-all ${
                    isSel ? 'bg-white text-primary-700 shadow-sm' : 'text-warm-600 hover:text-primary-600'
                  } ${fc.show ? '' : 'line-through opacity-55'}`}
                >
                  <Icon name={meta.icon} size={13} />
                  <span className="truncate">{meta.short}</span>
                </button>
              );
            })}
          </div>

          {cfg.show ? (
            <div className="rounded-2xl border border-purple-100 p-3">
              <p className="mb-2.5 text-[11px] font-extrabold uppercase tracking-wide text-warm-500">
                {FIELD_META[active].label}
              </p>

              {/* Row 1 — size and colour sit side by side */}
              <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
                <div className="min-w-[150px] flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-bold text-warm-600">Text size</span>
                    <span className="text-[11px] font-bold text-primary-600">{Math.round(cfg.size)}</span>
                  </div>
                  <input
                    type="range" min={7} max={120} step={1} value={cfg.size}
                    onChange={(e) => update(active, { size: Number(e.target.value) })}
                    className="w-full accent-primary-500"
                  />
                </div>

                <div className="min-w-0">
                  <span className="mb-1.5 block text-xs font-bold text-warm-600">Text colour</span>
                  {/* One scrollable row: wrapping to a second row made the
                      control column taller than the cover beside it. */}
                  <div className="cts-swatches flex items-center gap-1.5 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => update(active, { color: 'auto' })}
                      className={`h-7 flex-shrink-0 rounded-lg border px-2 text-[11px] font-extrabold ${cfg.color === 'auto' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-purple-100 bg-white text-warm-600'}`}
                    >
                      Auto
                    </button>
                    {COVER_TEXT_SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => update(active, { color: c })}
                        className={`h-7 w-7 flex-shrink-0 rounded-full border-2 ${cfg.color === c ? 'ring-2 ring-primary-300 border-primary-500' : 'border-warm-200 shadow-sm'}`}
                        style={{ backgroundColor: c }}
                        aria-label={`Use ${c}`}
                      />
                    ))}
                    <label className="relative h-7 w-7 flex-shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-white shadow-sm"
                      title="Custom colour"
                      style={{ background: 'conic-gradient(from 0deg,#f87171,#fbbf24,#34d399,#60a5fa,#a78bfa,#f472b6,#f87171)' }}>
                      <input
                        type="color"
                        value={cfg.color === 'auto' ? '#7c3aed' : cfg.color}
                        onChange={(e) => update(active, { color: e.target.value })}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => update(active, { shadow: !cfg.shadow })}
                className={`mt-2.5 inline-flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 transition-colors ${cfg.shadow ? 'bg-primary-50' : 'bg-purple-50/70'}`}
                aria-pressed={cfg.shadow}
              >
                <span className="text-xs font-bold text-warm-600">Text shadow</span>
                <Switch on={!!cfg.shadow} onColor="#7C3AED" />
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-purple-200 p-4 text-center text-xs text-warm-500">
              {FIELD_META[active].label} is hidden on the cover — use <strong>Hidden</strong> below to bring it back.
            </div>
          )}
        </div>
      </div>

      {/* Shadow, nudge and reset run the FULL width beneath the cover row.
          Beside a 150px cover in the wizard's 408px column there is no room
          for them, and squeezing them there is what made this panel 470px
          tall on a 1280px laptop. */}
      {/* Visibility, nudge and reset run the FULL width beneath the cover row.
          Beside a 150px cover in the wizard's ~410px column there is no room
          for them, and squeezing them in there is what made this panel 470px
          tall on a 1280px laptop. This bar always renders: it holds the only
          control that can bring a hidden field back. */}
      <>
          <div className="cts-bar mt-3 rounded-2xl border border-purple-100 px-2.5 py-2">
          <button
            type="button"
            onClick={() => update(active, { show: !cfg.show })}
            aria-pressed={cfg.show}
            className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-colors ${cfg.show ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-warm-600'}`}
          >
            <Icon name={cfg.show ? 'Eye' : 'EyeOff'} size={13} />
            {cfg.show ? 'On cover' : 'Hidden'}
          </button>

                {cfg.show && (
                <div className="flex flex-shrink-0 items-center gap-2">
                  <span className="cts-nudge-label text-xs font-bold text-warm-600">Nudge</span>
                  {/* A 3x3 pad is tall; laid out as one row it keeps the
                      toolbar a single line high. */}
                  <div className="flex items-center gap-1">
                    {[
                      { d: [-2, 0], icon: 'ChevronLeft',  label: 'Nudge left' },
                      { d: [0, -2], icon: 'ChevronUp',    label: 'Nudge up' },
                      { d: [0, 2],  icon: 'ChevronDown',  label: 'Nudge down' },
                      { d: [2, 0],  icon: 'ChevronRight', label: 'Nudge right' },
                    ].map(({ d, icon, label }) => (
                      <button key={icon} type="button" onClick={() => nudge(active, d[0], d[1])}
                        aria-label={label} title={label}
                        className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-50 text-primary-600 transition-colors hover:bg-purple-100">
                        <Icon name={icon} size={13} />
                      </button>
                    ))}
                    <button type="button"
                      onClick={() => update(active, { x: DEFAULT_COVER_LAYOUT[active].x, y: DEFAULT_COVER_LAYOUT[active].y })}
                      aria-label="Recentre this text" title="Recentre"
                      className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-50 text-primary-600 transition-colors hover:bg-purple-100">
                      <Icon name="Target" size={12} />
                    </button>
                  </div>
                </div>
                )}

                <button
                  type="button"
                  onClick={() => onChange?.(DEFAULT_COVER_LAYOUT)}
                  className="ml-auto inline-flex flex-shrink-0 items-center gap-1 text-xs font-bold text-warm-600 hover:text-primary-600"
                >
                  <Icon name="Refresh" size={13} /> Reset
                </button>
              </div>
              {/* Shadow detail only appears once the shadow is on */}
          {cfg.show && cfg.shadow && (
                <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-3 rounded-xl bg-purple-50/70 p-3">
                  <div className="min-w-0">
                    <span className="mb-1 block text-[11px] font-bold text-warm-500">Shadow colour</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {['#000000', '#1a1035', '#7c3aed', '#be123c', '#ffffff', '#14532d'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => update(active, { shadowColor: c })}
                          className={`h-7 w-7 flex-shrink-0 rounded-full border-2 ${cfg.shadowColor === c ? 'ring-2 ring-primary-300 border-primary-500' : 'border-warm-200 shadow-sm'}`}
                          style={{ backgroundColor: c }}
                          aria-label={`Shadow colour ${c}`}
                        />
                      ))}
                      <label className="relative h-7 w-7 flex-shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-white shadow-sm"
                        title="Custom shadow colour"
                        style={{ background: 'conic-gradient(from 0deg,#f87171,#fbbf24,#34d399,#60a5fa,#a78bfa,#f472b6,#f87171)' }}>
                        <input type="color" value={cfg.shadowColor || '#000000'}
                          onChange={(e) => update(active, { shadowColor: e.target.value })}
                          className="absolute inset-0 cursor-pointer opacity-0" />
                      </label>
                    </div>
                  </div>
                  <div className="min-w-[140px] flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-warm-500">Shadow strength</span>
                      <span className="text-[11px] font-extrabold text-primary-600">{Math.round((cfg.shadowOpacity ?? 0.55) * 100)}%</span>
                    </div>
                    <input
                      type="range" min={0} max={1} step={0.05}
                      value={cfg.shadowOpacity ?? 0.55}
                      onChange={(e) => update(active, { shadowOpacity: Number(e.target.value) })}
                      className="w-full accent-primary-500"
                    />
                  </div>
                </div>
              )}
      </>
    </div>
  );
};

export default CoverTextStudio;
