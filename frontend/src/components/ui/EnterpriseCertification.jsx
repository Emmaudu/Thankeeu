import { useState, useEffect, useRef } from 'react';
import { CheckCircle, Clock, Award, Download, ExternalLink, ChevronLeft, ChevronRight, BookOpen, Shield } from 'lucide-react';
import { certificationsApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { MODULES_CONTENT } from './CertificationModuleData';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

// ─── CONTENT BLOCK RENDERERS ──────────────────────────────────────

function ParagraphBlock({ text }) {
  return <p className="text-gray-700 leading-[1.85] text-[15px] mb-4">{text}</p>;
}

function CalloutBlock({ variant, title, text }) {
  const styles = {
    info:    { bg:'bg-blue-50',  border:'border-blue-300',  icon:'ℹ️', text:'text-blue-900',  head:'text-blue-800' },
    warning: { bg:'bg-amber-50', border:'border-amber-300', icon:'', text:'text-amber-900', head:'text-amber-800' },
    danger:  { bg:'bg-red-50',   border:'border-red-400',   icon:'', text:'text-red-900',   head:'text-red-800' },
    success: { bg:'bg-green-50', border:'border-green-300', icon:'', text:'text-green-900', head:'text-green-800' },
  };
  const s = styles[variant] || styles.info;
  return (
    <div className={clsx('rounded-2xl border-2 p-5 my-5', s.bg, s.border)}>
      <p className={clsx('font-bold text-sm mb-2 flex items-center gap-2', s.head)}><span>{s.icon}</span>{title}</p>
      <p className={clsx('text-sm leading-relaxed', s.text)}>{text}</p>
    </div>
  );
}

function DiagramBlock({ title, items }) {
  return (
    <div className="my-6">
      {title && <p className="font-heading font-bold text-gray-800 text-sm mb-4 flex items-center gap-2"><span className="w-6 h-0.5 bg-rose-400 inline-block"/>{title}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-rose-300 hover:shadow-sm transition-all">
            <span className="text-3xl block mb-2">{item.icon}</span>
            <p className="font-semibold text-sm text-gray-800 leading-tight mb-1">{item.label}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsRowBlock({ stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
      {stats.map((s, i) => (
        <div key={i} className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-4 text-center text-white">
          <div className="text-2xl mb-1">{s.icon}</div>
          <div className="font-heading font-black text-xl leading-none">{s.value}</div>
          <div className="text-rose-100 text-xs mt-1 leading-tight">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function NumberedStepsBlock({ title, steps }) {
  return (
    <div className="my-6">
      {title && <p className="font-heading font-bold text-gray-800 mb-4">{title}</p>}
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-4 bg-white border border-gray-100 rounded-2xl p-4 hover:border-rose-200 hover:shadow-sm transition-all">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center font-heading font-black text-sm">{step.step}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{step.icon}</span>
                <p className="font-semibold text-sm text-gray-900">{step.title}</p>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepCardsBlock({ steps }) {
  const colorMap = {
    'border-blue-400':'border-blue-400 bg-blue-50','border-green-400':'border-green-400 bg-green-50',
    'border-orange-400':'border-orange-400 bg-orange-50','border-purple-400':'border-purple-400 bg-purple-50',
    'border-amber-400':'border-amber-400 bg-amber-50','border-red-400':'border-red-400 bg-red-50',
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
      {steps.map((step, i) => (
        <div key={i} className={clsx('rounded-2xl border-2 p-5', colorMap[step.color]||'border-gray-200 bg-gray-50')}>
          <div className="flex items-center gap-3 mb-3">
            <span className="font-heading font-black text-2xl text-gray-400">{step.number}</span>
            <span className="text-2xl">{step.icon}</span>
            <span className="font-heading font-bold text-gray-900 text-sm">{step.title}</span>
          </div>
          <ul className="space-y-1.5">
            {step.points.map((point, pi) => (
              <li key={pi} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle size={13} className="text-rose-500 flex-shrink-0 mt-0.5"/>{point}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function TwoColumnBlock({ columns }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
      {columns.map((col, i) => (
        <div key={i} className={clsx('rounded-2xl border-2 p-5', col.color)}>
          <p className="font-heading font-bold text-gray-900 mb-3 text-sm">{col.title}</p>
          <ul className="space-y-2">
            {col.items.map((item, ii) => (
              <li key={ii} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle size={13} className="text-rose-500 flex-shrink-0 mt-0.5"/>{item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function DiagramListBlock({ title, icon, color, items }) {
  const colors = { blue:'bg-blue-50 border-blue-100 text-blue-700', amber:'bg-amber-50 border-amber-100 text-amber-700', green:'bg-green-50 border-green-100 text-green-700', purple:'bg-purple-50 border-purple-100 text-purple-700', red:'bg-red-50 border-red-100 text-red-700' };
  return (
    <div className="my-6">
      {title && <div className={clsx('inline-flex items-center gap-2 px-4 py-2 rounded-xl border mb-3 text-sm font-semibold', colors[color]||colors.blue)}><span>{icon}</span>{title}</div>}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-3 bg-white border border-gray-100 rounded-xl p-4 hover:border-rose-200 transition-colors">
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 font-bold text-xs text-gray-500">{i+1}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 mb-0.5">{item.label}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotoGuideBlock({ categories }) {
  return (
    <div className="space-y-4 my-6">
      {categories.map((cat, i) => (
        <div key={i} className={clsx('rounded-2xl border-2 p-5', cat.color)}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{cat.icon}</span>
            <p className="font-heading font-bold text-gray-900 text-sm">
              {cat.title}
              {cat.required && <span className="ml-2 text-xs font-normal bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Required</span>}
            </p>
          </div>
          <ul className="space-y-1.5 mb-3">
            {cat.rules.map((rule, ri) => (
              <li key={ri} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle size={13} className="text-rose-500 flex-shrink-0 mt-0.5"/>{rule}
              </li>
            ))}
          </ul>
          {cat.good_example && <div className="p-3 bg-green-50 rounded-xl border border-green-200 text-xs text-green-800"><strong>Good example:</strong> {cat.good_example}</div>}
          {cat.bad_example && <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800 mt-2"><strong>Bad example:</strong> {cat.bad_example}</div>}
        </div>
      ))}
    </div>
  );
}

function PPEGridBlock({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-6">
      {items.map((item, i) => (
        <div key={i} className={clsx('rounded-2xl border-2 p-4 text-center', item.required?'border-red-200 bg-red-50':'border-gray-200 bg-gray-50')}>
          <div className="text-3xl mb-2">{item.emoji}</div>
          <p className="font-semibold text-sm text-gray-900 mb-1">{item.name}</p>
          {item.required ? <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-semibold">Mandatory</span>
            : <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Optional</span>}
          <p className="text-xs text-gray-500 mt-2 leading-tight">{item.when}</p>
          {item.note && <p className="text-xs text-gray-400 mt-1 italic">{item.note}</p>}
        </div>
      ))}
    </div>
  );
}

function PPETableBlock({ headers, rows }) {
  const getStyle = (val) => {
    if (!val) return 'text-gray-400';
    if (val.startsWith('')) return 'text-green-700 font-semibold bg-green-50';
    if (val.startsWith('')) return 'text-amber-700 bg-amber-50';
    if (val.startsWith('')) return 'text-gray-400 bg-gray-50';
    return 'text-gray-600';
  };
  return (
    <div className="my-6 overflow-x-auto rounded-2xl border border-gray-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-900 text-white">
            {headers.map((h,i) => <th key={i} className={clsx('px-3 py-3 text-left font-semibold', i===0?'min-w-[150px]':'text-center min-w-[70px]')}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row,i) => (
            <tr key={i} className={clsx('border-t border-gray-100', i%2===0?'bg-white':'bg-gray-50')}>
              <td className="px-3 py-3 font-medium text-gray-800 text-xs leading-tight">{row.site}</td>
              <td className={clsx('px-2 py-3 text-center text-xs', getStyle(row.hardhat))}>{row.hardhat}</td>
              <td className={clsx('px-2 py-3 text-center text-xs', getStyle(row.boots))}>{row.boots}</td>
              <td className={clsx('px-2 py-3 text-center text-xs', getStyle(row.vest))}>{row.vest}</td>
              <td className={clsx('px-2 py-3 text-center text-xs', getStyle(row.gloves))}>{row.gloves}</td>
              <td className={clsx('px-2 py-3 text-center text-xs', getStyle(row.mask))}>{row.mask}</td>
              <td className={clsx('px-2 py-3 text-center text-xs', getStyle(row.eyes))}>{row.eyes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScenariosBlock({ items }) {
  return (
    <div className="space-y-3 my-6">
      {items.map((item, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
            <p className="text-sm font-semibold text-amber-900 flex items-center gap-2"><span></span>Situation: {item.situation}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm text-gray-700 leading-relaxed flex items-start gap-2">
              <span className="text-green-500 flex-shrink-0 font-bold">→</span>{item.action}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function RenderBlock({ block }) {
  switch (block.type) {
    case 'paragraph':      return <ParagraphBlock {...block}/>;
    case 'callout':        return <CalloutBlock {...block}/>;
    case 'diagram':        return <DiagramBlock {...block}/>;
    case 'stats_row':      return <StatsRowBlock {...block}/>;
    case 'numbered_steps': return <NumberedStepsBlock {...block}/>;
    case 'step_cards':     return <StepCardsBlock {...block}/>;
    case 'two_column':     return <TwoColumnBlock {...block}/>;
    case 'diagram_list':   return <DiagramListBlock {...block}/>;
    case 'photo_guide':    return <PhotoGuideBlock {...block}/>;
    case 'ppe_grid':       return <PPEGridBlock {...block}/>;
    case 'ppe_table':      return <PPETableBlock {...block}/>;
    case 'scenarios':      return <ScenariosBlock {...block}/>;
    default:               return null;
  }
}

function ProgressRing({ pct, size=90, strokeWidth=7, color='#00C37E' }) {
  const r = (size/2) - strokeWidth;
  const circ = 2*Math.PI*r;
  const offset = circ - (pct/100)*circ;
  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:'stroke-dashoffset 0.7s ease'}}/>
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" style={{fontSize:size*0.21,fontWeight:900,fill:'#1a1a2e',fontFamily:'inherit'}}>{pct}%</text>
    </svg>
  );
}


// ─── Module Reader Modal ─────────────────────────────────────────
function ModuleReader({ module, completedModuleIds, onComplete, onClose }) {
  const [sectionIndex, setSectionIndex] = useState(0);
  const [readSections, setReadSections] = useState(new Set());
  const [checkedReqs, setCheckedReqs] = useState(new Set());
  const [view, setView] = useState('content');
  const [submitting, setSubmitting] = useState(false);
  const startTime = useRef(Date.now());
  const bodyRef = useRef(null);

  const alreadyDone = completedModuleIds?.has(module.module_number);
  const sections = module.sections || [];
  const requirements = module.requirements || [];
  const currentSection = sections[sectionIndex];
  const allRead = readSections.size >= sections.length;
  const allChecked = checkedReqs.size >= requirements.length;

  const handleScroll = () => {
    if (!bodyRef.current) return;
    const el = bodyRef.current;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80)
      setReadSections(p => new Set([...p, sectionIndex]));
  };

  const goTo = (idx) => {
    setSectionIndex(idx);
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  };

  const markRead = () => setReadSections(p => new Set([...p, sectionIndex]));

  const handleSubmit = async () => {
    if (!allChecked) { toast.error('Please confirm all requirements first'); return; }
    setSubmitting(true);
    try {
      const secs = Math.round((Date.now() - startTime.current) / 1000);
      // Use module_number (1-5) so backend can look up the real DB UUID
      const { data } = await certificationsApi.completeModule(module.module_number, { time_spent_seconds: secs });
      toast.success(data.newly_certified ? 'All 5 modules complete! Enterprise Certified!' : ` Module ${module.module_number} complete!`);
      onComplete(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save progress');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:rounded-3xl sm:max-w-3xl max-h-[96vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header bar */}
        <div className="flex-shrink-0 bg-gradient-to-r from-gray-900 to-gray-800 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-3xl flex-shrink-0">{module.emoji}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-xs text-white/50 font-medium">Module {module.module_number} of 5</span>
                  {alreadyDone && <span className="text-xs bg-rose-500 text-white px-2 py-0.5 rounded-full font-semibold">Completed</span>}
                  <span className="text-xs text-white/40 flex items-center gap-1"><Clock size={10}/>{module.estimated_minutes} min</span>
                </div>
                <h2 className="font-heading font-bold text-white text-base leading-tight">{module.title}</h2>
                <p className="text-white/40 text-xs leading-tight">{module.subtitle}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 flex-shrink-0 text-lg leading-none"></button>
          </div>

          {/* Section dots + tab switcher */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-0.5">
            <button onClick={() => setView('content')}
              className={clsx('flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                view==='content'?'bg-rose-500 text-white':'bg-white/10 text-white/60 hover:bg-white/20')}>Read
            </button>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {sections.map((_,i) => (
                <button key={i} onClick={() => { setView('content'); goTo(i); }}
                  className={clsx('w-6 h-6 rounded-full text-xs font-bold transition-all flex items-center justify-center flex-shrink-0',
                    readSections.has(i)?'bg-rose-500 text-white':
                    i===sectionIndex&&view==='content'?'bg-white text-gray-900':'bg-white/20 text-white/50 hover:bg-white/30')}>
                  {readSections.has(i)?'':i+1}
                </button>
              ))}
            </div>
            <button onClick={() => setView('requirements')}
              className={clsx('flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ml-1',
                view==='requirements'?'bg-amber-500 text-white':'bg-white/10 text-white/60 hover:bg-white/20')}>Pledge {checkedReqs.size}/{requirements.length}
            </button>
          </div>
        </div>

        {/* Body */}
        <div ref={bodyRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">

          {/* ── CONTENT VIEW ── */}
          {view === 'content' && currentSection && (
            <div className="px-5 pt-6 pb-8">
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                    Section {sectionIndex+1} of {sections.length}
                  </span>
                  {readSections.has(sectionIndex) && (
                    <span className="text-xs text-rose-600 font-medium flex items-center gap-1">
                      <CheckCircle size={11}/> Read
                    </span>
                  )}
                </div>
                <h3 className="font-heading font-bold text-xl text-gray-900 leading-tight">{currentSection.heading}</h3>
              </div>

              <div>
                {currentSection.content?.map((block, i) => <RenderBlock key={i} block={block}/>)}
              </div>

              <div className="mt-6 space-y-3">
                {!readSections.has(sectionIndex) && (
                  <button onClick={markRead}
                    className="w-full py-3.5 border-2 border-dashed border-rose-300 rounded-2xl text-rose-600 font-semibold text-sm hover:bg-rose-50 transition-colors flex items-center justify-center gap-2">
                    <CheckCircle size={16}/> Mark Section as Read
                  </button>
                )}
                {readSections.has(sectionIndex) && sectionIndex < sections.length - 1 && (
                  <button onClick={() => goTo(sectionIndex+1)}
                    className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 rounded-2xl text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                    Continue to Section {sectionIndex+2} →
                  </button>
                )}
                {readSections.has(sectionIndex) && sectionIndex === sections.length - 1 && (
                  <button onClick={() => setView('requirements')}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 rounded-2xl text-white font-semibold text-sm transition-colors">All Sections Read — Take the Pledge →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── REQUIREMENTS / PLEDGE VIEW ── */}
          {view === 'requirements' && (
            <div className="px-5 pt-6 pb-8">
              <div className="mb-5">
                <h3 className="font-heading font-bold text-xl text-gray-900 mb-1">Professional Pledge</h3>
                <p className="text-sm text-muted">Confirm you understand and commit to these professional standards before completing this module.</p>
              </div>

              {!allRead && (
                <div className="mb-5 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                  <p className="text-sm font-semibold text-amber-800 mb-1">{sections.length - readSections.size} section(s) not yet read</p>
                  <p className="text-xs text-amber-700 mb-2">Please read all sections and mark each one as read before completing this module.</p>
                  <button onClick={() => { setView('content'); goTo(0); }} className="text-xs text-amber-700 underline font-medium">← Return to reading</button>
                </div>
              )}

              <div className="space-y-3 mb-6">
                {requirements.map((req, i) => (
                  <label key={i}
                    className={clsx('flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all',
                      checkedReqs.has(i)?'border-rose-500 bg-rose-50':'border-gray-200 bg-white hover:border-gray-300')}>
                    <div className={clsx('flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 transition-all',
                      checkedReqs.has(i)?'bg-rose-500 border-rose-500':'border-gray-300')}>
                      {checkedReqs.has(i) && <CheckCircle size={12} className="text-white"/>}
                    </div>
                    <input type="checkbox" className="hidden" checked={checkedReqs.has(i)}
                      onChange={e => {
                        const s = new Set(checkedReqs);
                        e.target.checked ? s.add(i) : s.delete(i);
                        setCheckedReqs(s);
                      }}/>
                    <span className={clsx('text-sm leading-relaxed select-none',
                      checkedReqs.has(i)?'text-rose-800 font-medium':'text-gray-700')}>
                      {req}
                    </span>
                  </label>
                ))}
              </div>

              {alreadyDone ? (
                <div className="text-center p-4 bg-rose-50 rounded-2xl border border-rose-200">
                  <p className="text-rose-700 font-semibold text-sm">This module is already completed</p>
                </div>
              ) : (
                <button onClick={handleSubmit}
                  disabled={submitting || !allRead || !allChecked}
                  className={clsx('w-full py-4 rounded-2xl font-bold text-base transition-all',
                    allRead && allChecked
                      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg': 'bg-gray-200 text-gray-400 cursor-not-allowed')}>
                  {submitting ? '⏳ Saving...' :
                   !allRead ? ` Read ${sections.length - readSections.size} remaining section(s) first` :
                   !allChecked ? ` Confirm ${requirements.length - checkedReqs.size} remaining item(s)` :
                   ` Complete Module ${module.module_number}`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex-shrink-0 border-t border-gray-100 px-5 py-3 bg-gray-50 flex items-center justify-between">
          <button onClick={() => sectionIndex > 0 ? goTo(sectionIndex-1) : null}
            disabled={view==='requirements' || sectionIndex===0}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft size={15}/> Prev
          </button>
          <div className="flex items-center gap-1">
            {sections.map((_,i) => (
              <button key={i} onClick={() => { setView('content'); goTo(i); }}
                className={clsx('rounded-full transition-all',
                  readSections.has(i)?'w-2 h-2 bg-rose-500':
                  i===sectionIndex&&view==='content'?'w-4 h-2 bg-gray-600':'w-2 h-2 bg-gray-300')}/>
            ))}
            <div className={clsx('rounded-full transition-all ml-1',
              view==='requirements'?'w-4 h-2 bg-amber-400':'w-2 h-2 bg-gray-200')}/>
          </div>
          <button
            onClick={() => {
              if (view==='content' && sectionIndex < sections.length-1) { markRead(); goTo(sectionIndex+1); }
              else if (view==='content') { markRead(); setView('requirements'); }
            }}
            disabled={view==='requirements'}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            Next <ChevronRight size={15}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Certificate Banner ──────────────────────────────────────────
function CertificateBanner({ certification, userId }) {
  const certUrl = userId ? certificationsApi.getCertificateUrl(userId) : '#';
  return (
    <div className="rounded-3xl overflow-hidden shadow-lg">
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-lg text-4xl"></div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1 flex-wrap">
              <span className="text-xs font-bold bg-rose-500 text-white px-3 py-1 rounded-full tracking-wide">CERTIFIED</span>
              <span className="text-xs text-white/40">Enterprise Field Agent</span>
            </div>
            <h2 className="font-heading font-black text-white text-xl leading-tight mb-1">Taskeeu Enterprise Certification</h2>
            <p className="text-white/50 text-sm mb-2">All 5 modules completed · Certificate of Achievement</p>
            <p className="text-white/30 text-xs font-mono">{certification?.certificate_number}</p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <a href={certUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold transition-colors whitespace-nowrap">
              <Download size={14}/> Download PDF
            </a>
            <a href={`/verify/${certification?.certificate_number}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors whitespace-nowrap">
              <ExternalLink size={13}/> Verify Online
            </a>
          </div>
        </div>
      </div>
      <div className="bg-rose-500/10 border-t border-rose-500/20 px-6 py-3">
        <p className="text-sm text-rose-700 text-center sm:text-left font-medium"><strong>Enterprise Badge is live</strong> — visible on your public profile and all bids you submit to company tasks
        </p>
      </div>
    </div>
  );
}


// ─── Main exported component ─────────────────────────────────────
export default function EnterpriseCertification({ userId }) {
  const { user } = useAuth();
  const [completedModuleIds, setCompletedModuleIds] = useState(new Set());
  const [isCertified, setIsCertified] = useState(false);
  const [certification, setCertification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openModule, setOpenModule] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await certificationsApi.getModules();
      // Backend returns DB modules with real UUIDs and `completed` flag.
      // We key the Set by module_number (1-5) so it matches MODULES_CONTENT.
      const ids = new Set(
        (data.modules || [])
          .filter(m => m.completed)
          .map(m => m.module_number)
      );
      setCompletedModuleIds(ids);
      setIsCertified(data.is_certified);
      setCertification(data.certification);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleComplete = (result) => {
    setOpenModule(null);
    load();
    if (result?.newly_certified) setTimeout(() => toast.success('Certificate issued! Check your email.', { duration: 7000 }), 600);
  };

  const completedCount = completedModuleIds.size;
  const totalModules = MODULES_CONTENT.length;
  const pct = Math.round((completedCount / totalModules) * 100);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"/>
      <p className="text-muted text-sm">Loading certification status...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">

      {isCertified && certification && (
        <CertificateBanner certification={certification} userId={user?.id || userId}/>
      )}

      {/* Progress overview */}
      <div className="card p-6">
        <div className="flex items-center gap-5 flex-wrap">
          <ProgressRing pct={pct} size={88}/>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-xl text-dark mb-1">Enterprise Tasker Certification</h3>
            <p className="text-muted text-sm leading-relaxed">
              Complete all 5 modules to earn your <strong>Enterprise Badge</strong> and a downloadable PDF certificate. Certified taskers are prioritised for high-value company assignments.
            </p>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <span className="text-sm font-semibold text-rose-600">{completedCount} / {totalModules} modules done</span>
              {!isCertified && completedCount > 0 && (
                <span className="text-muted text-sm">{totalModules - completedCount} remaining</span>
              )}
            </div>
            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden max-w-xs">
              <div className="h-full bg-rose-500 rounded-full transition-all duration-700" style={{ width:`${pct}%` }}/>
            </div>
          </div>
          {!isCertified && (
            <div className="hidden lg:flex flex-col gap-2 text-xs text-muted">
              <span className="flex items-center gap-1.5"><Shield size={12} className="text-rose-500"/>Higher company bid rate</span>
              <span className="flex items-center gap-1.5"><Award size={12} className="text-rose-500"/>Enterprise profile badge</span>
              <span className="flex items-center gap-1.5"><Download size={12} className="text-rose-500"/>Official PDF certificate</span>
              <span className="flex items-center gap-1.5"><BookOpen size={12} className="text-rose-500"/>Real field knowledge</span>
            </div>
          )}
        </div>
      </div>

      {/* Module list */}
      <div>
        <h3 className="font-heading font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <BookOpen size={16} className="text-rose-500"/> Training Modules
        </h3>
        <div className="space-y-3">
          {MODULES_CONTENT.map((mod, idx) => {
            const done = completedModuleIds.has(mod.id);
            const isNext = !done && idx === completedCount;
            return (
              <div key={mod.id}
                className={clsx('card overflow-hidden transition-all', done && 'border-l-4 border-rose-500', isNext && 'ring-2 ring-rose-200')}>
                <div className="p-5">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className={clsx('w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0', mod.bgLight)}>
                      {mod.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs text-muted font-semibold">Module {mod.module_number}</span>
                        {done && <span className="badge-green text-xs">Completed</span>}
                        {isNext && <span className="badge-blue text-xs">Up next</span>}
                        <span className="text-xs text-muted flex items-center gap-1"><Clock size={10}/>{mod.estimated_minutes} min</span>
                        <span className="text-xs text-muted flex items-center gap-1"><BookOpen size={10}/>{mod.sections.length} sections</span>
                      </div>
                      <h4 className="font-heading font-bold text-gray-900 leading-tight">{mod.title}</h4>
                      <p className="text-xs text-muted">{mod.subtitle}</p>
                    </div>
                    <button onClick={() => setOpenModule(mod)}
                      className={clsx('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-shrink-0',
                        done ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' :
                        isNext ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-md' :
                        'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
                      {done ? <><BookOpen size={14}/> Review</> : 'Start →'}
                    </button>
                  </div>

                  {/* Section pills */}
                  <div className="mt-3 flex flex-wrap gap-1.5 pl-1">
                    {mod.sections.map((sec, si) => (
                      <span key={si} className={clsx('text-xs px-2.5 py-1 rounded-full font-medium',
                        done ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-500')}>
                        {sec.heading.substring(0, 32)}{sec.heading.length > 32 ? '…' : ''}
                      </span>
                    ))}
                  </div>

                  {/* Requirements preview */}
                  {!done && mod.requirements?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-50">
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">Commitments in this module:</p>
                      <div className="flex flex-wrap gap-1">
                        {mod.requirements.slice(0, 2).map((r, ri) => (
                          <span key={ri} className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">
                            {r.substring(0, 48)}{r.length > 48 ? '…' : ''}
                          </span>
                        ))}
                        {mod.requirements.length > 2 && <span className="text-xs text-muted">+{mod.requirements.length - 2} more</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* All done but cert not yet issued */}
      {completedCount === totalModules && !isCertified && (
        <div className="card p-6 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-center border-0">
          <div className="text-5xl mb-3"></div>
          <h3 className="font-heading font-bold text-xl mb-2">All modules complete!</h3>
          <p className="text-rose-100 text-sm mb-4">Your certificate is being processed — check your email. It usually arrives within a minute.</p>
          <button onClick={load} className="bg-white text-rose-700 font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-rose-50 transition-colors">Refresh Status
          </button>
        </div>
      )}

      {openModule && (
        <ModuleReader
          module={openModule}
          completedModuleIds={completedModuleIds}
          onComplete={handleComplete}
          onClose={() => setOpenModule(null)}
        />
      )}
    </div>
  );
}
