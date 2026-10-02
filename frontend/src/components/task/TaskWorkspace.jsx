import { minAmount, minTip, money, sym } from '../../utils/market';
/* ═══════════════════════════════════════════════════════════════════════
   Task workspace — everything about ONE task, inside that task's page.

   TaskerCompletionFlow  tasker: 1) proof of work → 2) review → 3) code
   TaskAdvancePanel      tasker: request / track / withdraw an advance
                         requester: approve (or adjust) / reject, see balance
   TaskProgressForRequester  requester: live view of the tasker's 3 steps
   ProofsGallery         read-only proof files (requester, admin)

   The server enforces every rule (step order, limits, amounts). These
   components only guide the user and always re-read the server's state
   after an action, so a double click, a retry or a second device can never
   leave the screen showing something that isn't true.
   ═══════════════════════════════════════════════════════════════════════ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload, Camera, FileText, Film, File as FileIcon, Trash2, CheckCircle2, Lock, Star,
  KeyRound, PartyPopper, Wallet, ArrowDownToLine, Clock, XCircle, RefreshCw, Sparkles, ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { tasksApi, paymentsApi, reviewsApi } from '../../utils/api';
import { StarInput, StarDisplay, COMMENT_MIN, COMMENT_MAX } from '../ui/Reviews';

const naira = (n) => `${money(n || 0)}`;
const minus = (n) => (Number(n) > 0 ? `−${naira(n)}` : naira(0));
const MAX_FILES_PER_UPLOAD = 10;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_PROOFS_PER_TASK = 30;
const BLOCKED_EXT = /\.(exe|msi|bat|cmd|com|scr|ps1|vbs|js|jar|sh|apk|app|dll|reg|lnk|hta|cpl|msc|pif)$/i;

const fmtSize = (b) => {
  const n = Number(b || 0);
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
};
const kindOf = (mime = '', name = '') => {
  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|heic|bmp|svg)$/i.test(name)) return 'image';
  if (mime.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm|3gp)$/i.test(name)) return 'video';
  if (mime === 'application/pdf' || /\.pdf$/i.test(name)) return 'pdf';
  return 'file';
};
const safeDate = (d, f = 'MMM d, h:mm a') => { try { return d ? format(new Date(d), f) : ''; } catch { return ''; } };
const errMsg = (err, fallback) => err?.response?.data?.message || fallback;

/* ── Small visual pieces ─────────────────────────────────────────── */
function FileThumb({ proof, size = 76 }) {
  const kind = kindOf(proof.mime_type, proof.file_name || proof.url);
  const box = { width: size, height: size, borderRadius: 14, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  if (kind === 'image' && proof.url) {
    return <img src={proof.url} alt={proof.file_name || 'proof'} style={{ ...box, objectFit: 'cover', background: '#f3f4f6' }} loading="lazy" />;
  }
  const map = {
    video: { Icon: Film, bg: 'var(--rose)' },
    pdf: { Icon: FileText, bg: 'var(--rose)' },
    file: { Icon: FileIcon, bg: '#0284c7' },
  };
  const { Icon, bg } = map[kind] || map.file;
  return <div style={{ ...box, background: bg }}><Icon size={size * 0.4} color="white" /></div>;
}

function Tile({ label, value, tone = 'slate', hint }) {
  const tones = {
    slate: ['#f8fafc', '#e2e8f0', '#c41445'],
    green: ['#ecfdf5', '#a7f3d0', '#065f46'],
    rose: ['#fff1f2', '#fecdd3', '#c41445'],
    amber: ['#fffbeb', '#fde68a', '#92400e'],
    violet: ['#fff5f7', '#fff5f7', '#c41445'],
  };
  const [bg, border, color] = tones[tone] || tones.slate;
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 16, padding: '12px 14px' }}>
      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color, opacity: 0.75 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 900, color, marginTop: 2 }}>{value}</p>
      {hint && <p style={{ fontSize: 11, color, opacity: 0.75, marginTop: 2 }}>{hint}</p>}
    </div>
  );
}

function Spinner({ size = 16 }) { return <RefreshCw size={size} className="animate-spin" />; }

/* ═══════════════════════════════════════════════════════════════════
   Proofs gallery (read-only)
   ═══════════════════════════════════════════════════════════════════ */
export function ProofsGrid({ proofs, onDelete, deleting }) {
  if (!proofs?.length) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
      {proofs.map((p) => (
        <div key={p.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: 8, position: 'relative' }}>
          <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: 8, alignItems: 'center', textDecoration: 'none' }} title="Open file">
            <FileThumb proof={p} size={52} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#c41445', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.file_name || 'File'}</p>
              <p style={{ fontSize: 11, color: '#6b7280' }}>{fmtSize(p.size_bytes)}{p.created_at ? ` · ${safeDate(p.created_at, 'MMM d')}` : ''}</p>
            </div>
          </a>
          {onDelete && (
            <button type="button" onClick={() => onDelete(p)} disabled={!!deleting} aria-label={`Remove ${p.file_name || 'file'}`}
              style={{ position: 'absolute', top: 6, right: 6, background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 999, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: deleting ? 'default' : 'pointer' }}>
              {deleting === p.id ? <Spinner size={12} /> : <Trash2 size={13} color="#ff2d62" />}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export function ProofsGallery({ taskId, title = 'Proof of work' }) {
  const [proofs, setProofs] = useState(null);
  useEffect(() => {
    let alive = true;
    tasksApi.proofs(taskId).then((r) => { if (alive) setProofs(r.data.proofs || []); }).catch(() => { if (alive) setProofs([]); });
    return () => { alive = false; };
  }, [taskId]);
  if (!proofs) return null;
  return (
    <div className="card p-5">
      <p className="font-black text-base mb-3 flex items-center gap-2" style={{ color: '#c41445' }}><Camera size={18} color="#ff2d62" /> {title} <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>({proofs.length})</span></p>
      {proofs.length ? <ProofsGrid proofs={proofs} /> : <p className="text-sm text-gray-500">No proof files uploaded.</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Stepper header
   ═══════════════════════════════════════════════════════════════════ */
const STEPS = [
  { n: 1, title: 'Proof of work', sub: 'Photos, videos or files', Icon: Camera, color: '#ff2d62', grad: 'var(--rose)' },
  { n: 2, title: 'Rate & review', sub: 'Requester and Taskeeu', Icon: Star, color: '#d97706', grad: '#f59e0b' },
  { n: 3, title: 'Completion code', sub: 'Get paid', Icon: KeyRound, color: '#059669', grad: '#059669' },
];

function Stepper({ done, current, onPick }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }} role="list" aria-label="Completion steps">
      {STEPS.map((s, i) => {
        const isDone = done[i];
        const isCurrent = current === s.n;
        const reachable = s.n === 1 || done[i - 1];
        return (
          <div key={s.n} role="listitem" style={{ flex: 1, display: 'flex', alignItems: 'flex-start' }}>
            <button type="button" onClick={() => reachable && onPick(s.n)} disabled={!reachable}
              aria-current={isCurrent ? 'step' : undefined}
              style={{ flex: '0 0 auto', background: 'none', border: 'none', padding: 0, cursor: reachable ? 'pointer' : 'not-allowed', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 92 }}>
              <span style={{
                width: 46, height: 46, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isDone ? '#059669' : isCurrent ? s.grad : '#f1f5f9',
                color: isDone || isCurrent ? 'white' : '#94a3b8',
                boxShadow: isCurrent ? `0 0 0 5px ${s.color}22` : 'none', transition: 'all .2s',
              }}>
                {isDone ? <CheckCircle2 size={22} /> : reachable ? <s.Icon size={20} /> : <Lock size={18} />}
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, marginTop: 6, color: isCurrent ? s.color : isDone ? '#065f46' : '#64748b', textAlign: 'center', lineHeight: 1.2 }}>{s.n}. {s.title}</span>
              <span style={{ fontSize: 10.5, color: '#94a3b8', textAlign: 'center' }}>{isDone ? 'Done' : s.sub}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 4, borderRadius: 4, marginTop: 21, background: done[i] ? '#059669' : '#e2e8f0', transition: 'all .3s' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Tasker: 3-step completion flow
   ═══════════════════════════════════════════════════════════════════ */
export function TaskerCompletionFlow({ task, requesterName, onCompleted, balance }) {
  const taskId = task.id;
  const isCompleted = task.status === 'completed';
  const [loaded, setLoaded] = useState(false);
  const [proofs, setProofs] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [myPlatform, setMyPlatform] = useState(null);
  const [step, setStep] = useState(1);
  const pickedStep = useRef(false);

  const load = useCallback(async () => {
    const [p, r] = await Promise.allSettled([tasksApi.proofs(taskId), reviewsApi.forTask(taskId)]);
    const nextProofs = p.status === 'fulfilled' ? (p.value.data.proofs || []) : null;
    if (nextProofs) setProofs(nextProofs);
    if (r.status === 'fulfilled') {
      setMyReview(r.value.data.my_review || null);
      setMyPlatform(r.value.data.my_platform_feedback || null);
    }
    setLoaded(true);
    return { proofs: nextProofs, review: r.status === 'fulfilled' ? r.value.data.my_review : undefined };
  }, [taskId]);

  useEffect(() => { pickedStep.current = false; load(); }, [load]);

  const done = [proofs.length > 0, !!myReview, isCompleted];
  const firstOpen = done[0] ? (done[1] ? 3 : 2) : 1;

  // Follow the first unfinished step until the user picks one themselves.
  useEffect(() => {
    if (loaded && !pickedStep.current) setStep(firstOpen);
  }, [loaded, firstOpen]);
  const pick = (n) => { pickedStep.current = true; setStep(n); };
  const advanceTo = (n) => { pickedStep.current = false; setStep(n); };

  if (!loaded) {
    return <div className="card p-8 flex justify-center"><div className="w-8 h-8 border-4 border-rose-200 border-t-violet-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="card overflow-hidden" style={{ border: '1px solid #ffd1dc' }}>
      <div style={{ background: 'var(--rose)', padding: '18px 20px', color: 'white' }}>
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.85 }}>Finish this task</p>
        <p style={{ fontSize: 20, fontWeight: 900, marginTop: 2 }}>
          {isCompleted ? 'All done — great work! 🎉' : `3 quick steps to get paid · ${done.filter(Boolean).length}/3`}
        </p>
      </div>
      <div className="p-5" style={{ background: '#fff5f7' }}>
        <Stepper done={done} current={isCompleted ? 0 : step} onPick={pick} />
      </div>

      <div className="p-5" style={{ borderTop: '1px solid #f1f5f9' }}>
        {isCompleted ? (
          <CompletedPanel balance={balance} proofs={proofs.length} review={myReview} />
        ) : step === 1 ? (
          <ProofStep taskId={taskId} proofs={proofs} setProofs={setProofs} reload={load}
            onNext={() => advanceTo(done[1] ? 3 : 2)} />
        ) : step === 2 ? (
          <ReviewStep taskId={taskId} requesterName={requesterName} myReview={myReview} myPlatform={myPlatform}
            locked={!done[0]} onSaved={async () => { await load(); advanceTo(3); }} onBack={() => pick(1)} />
        ) : (
          <CodeStep task={task} locked={!done[0] || !done[1]} missing={!done[0] ? 1 : 2}
            onGoTo={(n) => pick(n)} reload={load} onCompleted={onCompleted} />
        )}
      </div>
    </div>
  );
}

/* ── Step 1: proof of work ─────────────────────────────────────────── */
function ProofStep({ taskId, proofs, setProofs, reload, onNext }) {
  const [staged, setStaged] = useState([]); // { key, file, preview }
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deleting, setDeleting] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const stagedRef = useRef(staged);
  stagedRef.current = staged;

  // Free preview URLs when the step unmounts.
  useEffect(() => () => stagedRef.current.forEach((s) => s.preview && URL.revokeObjectURL(s.preview)), []);

  const room = Math.max(0, MAX_PROOFS_PER_TASK - proofs.length);

  const addFiles = (list) => {
    const incoming = Array.from(list || []);
    if (!incoming.length) return;
    const next = [...staged];
    for (const f of incoming) {
      if (BLOCKED_EXT.test(f.name)) { toast.error(`"${f.name}" can't be uploaded — programs and scripts are not allowed.`); continue; }
      if (f.size === 0) { toast.error(`"${f.name}" is empty.`); continue; }
      if (f.size > MAX_FILE_BYTES) { toast.error(`"${f.name}" is larger than 25 MB.`); continue; }
      if (next.some((s) => s.file.name === f.name && s.file.size === f.size && s.file.lastModified === f.lastModified)) continue;
      if (next.length >= room) { toast.error(`This task can hold ${MAX_PROOFS_PER_TASK} proof files in total.`); break; }
      next.push({ key: `${f.name}-${f.size}-${f.lastModified}-${Math.random()}`, file: f, preview: kindOf(f.type, f.name) === 'image' ? URL.createObjectURL(f) : null });
    }
    setStaged(next);
    if (inputRef.current) inputRef.current.value = '';
  };

  const unstage = (key) => setStaged((prev) => {
    const gone = prev.find((s) => s.key === key);
    if (gone?.preview) URL.revokeObjectURL(gone.preview);
    return prev.filter((s) => s.key !== key);
  });

  const save = async () => {
    if (saving || !staged.length) return;
    setSaving(true); setProgress(0);
    const batches = [];
    for (let i = 0; i < staged.length; i += MAX_FILES_PER_UPLOAD) batches.push(staged.slice(i, i + MAX_FILES_PER_UPLOAD));
    let savedCount = 0;
    try {
      for (let b = 0; b < batches.length; b++) {
        const fd = new FormData();
        batches[b].forEach((s) => fd.append('files', s.file, s.file.name));
        const { data } = await tasksApi.uploadProofs(taskId, fd, (e) => {
          if (e.total) setProgress(Math.round(((b + e.loaded / e.total) / batches.length) * 100));
        });
        savedCount += data?.proofs?.length || 0;
        // Remove the uploaded batch from the staging area straight away, so a
        // failure in a later batch can never cause these files to be sent twice.
        const sentKeys = new Set(batches[b].map((s) => s.key));
        setStaged((prev) => {
          prev.filter((s) => sentKeys.has(s.key)).forEach((s) => s.preview && URL.revokeObjectURL(s.preview));
          return prev.filter((s) => !sentKeys.has(s.key));
        });
      }
      toast.success(`${savedCount} proof file${savedCount === 1 ? '' : 's'} saved ✓`);
      const res = await reload();
      if (res?.proofs?.length) onNext();
    } catch (err) {
      toast.error(errMsg(err, err?.response ? 'Could not save your proofs.' : 'Network problem — some files may not have been saved. Check the list below.'));
      await reload();
    } finally { setSaving(false); setProgress(0); }
  };

  const remove = async (p) => {
    if (deleting) return;
    if (!window.confirm(`Remove "${p.file_name || 'this file'}" from your proofs?`)) return;
    setDeleting(p.id);
    try {
      await tasksApi.deleteProof(taskId, p.id);
      setProofs((prev) => prev.filter((x) => x.id !== p.id));
      toast.success('Proof removed');
    } catch (err) { toast.error(errMsg(err, 'Could not remove the file.')); }
    finally { setDeleting(null); reload(); }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="font-black text-lg" style={{ color: '#c41445' }}>Step 1 · Show your finished work</p>
        <p className="text-sm" style={{ color: '#6b7280' }}>Upload photos, videos, PDFs or any document that proves the job is done. Add as many as you need (up to {MAX_PROOFS_PER_TASK}), then tap <strong>Save proofs</strong>.</p>
      </div>

      <label htmlFor={`proof-input-${taskId}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '26px 16px', borderRadius: 20, cursor: room ? 'pointer' : 'not-allowed',
          border: `2px dashed ${dragOver ? '#ff2d62' : '#ffd1dc'}`, background: dragOver ? '#fff5f7' : '#fff5f7', textAlign: 'center',
        }}>
        <span style={{ width: 54, height: 54, borderRadius: 18, background: 'var(--rose)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Upload size={24} color="white" />
        </span>
        <span style={{ fontWeight: 800, color: '#c41445' }}>Tap to choose files or drag them here</span>
        <span style={{ fontSize: 12, color: '#ff2d62' }}>Any file type · up to 25 MB each · {room} more allowed</span>
        <input id={`proof-input-${taskId}`} ref={inputRef} type="file" multiple disabled={!room || saving}
          onChange={(e) => addFiles(e.target.files)} style={{ display: 'none' }} data-testid="proof-input" />
      </label>

      {staged.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #ffd1dc', borderRadius: 18, padding: 12 }}>
          <p className="text-xs font-black uppercase tracking-wide mb-2" style={{ color: '#ff2d62' }}>Ready to save ({staged.length})</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 8 }}>
            {staged.map((s) => (
              <div key={s.key} style={{ display: 'flex', gap: 8, alignItems: 'center', border: '1px solid #f1f5f9', borderRadius: 14, padding: 6, position: 'relative' }}>
                {s.preview
                  ? <img src={s.preview} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />
                  : <FileThumb proof={{ mime_type: s.file.type, file_name: s.file.name }} size={44} />}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.file.name}</p>
                  <p style={{ fontSize: 11, color: '#6b7280' }}>{fmtSize(s.file.size)}</p>
                </div>
                {!saving && (
                  <button type="button" onClick={() => unstage(s.key)} aria-label={`Remove ${s.file.name}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}><XCircle size={16} color="#94a3b8" /></button>
                )}
              </div>
            ))}
          </div>
          {saving && (
            <div style={{ height: 8, borderRadius: 8, background: '#fff5f7', marginTop: 10, overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(progress, 5)}%`, height: '100%', background: 'var(--rose)', transition: 'width .2s' }} />
            </div>
          )}
        </div>
      )}

      {proofs.length > 0 && (
        <div>
          <p className="text-xs font-black uppercase tracking-wide mb-2" style={{ color: '#059669' }}>Saved proofs ({proofs.length})</p>
          <ProofsGrid proofs={proofs} onDelete={saving ? null : remove} deleting={deleting} />
        </div>
      )}

      <div className="flex gap-3 flex-wrap items-center">
        <button type="button" onClick={save} disabled={saving || !staged.length}
          className="btn-sm font-black flex items-center gap-2"
          style={{ background: staged.length ? 'var(--rose)' : '#e5e7eb', color: staged.length ? 'white' : '#9ca3af', border: 'none', borderRadius: 14, padding: '11px 20px', cursor: saving || !staged.length ? 'not-allowed' : 'pointer', pointerEvents: saving ? 'none' : 'auto' }}>
          {saving ? <><Spinner /> Saving {progress ? `${progress}%` : '…'}</> : <><ShieldCheck size={16} /> Save proofs{staged.length ? ` (${staged.length})` : ''}</>}
        </button>
        {proofs.length > 0 && !staged.length && (
          <button type="button" onClick={onNext} className="btn-sm font-bold" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: 14, padding: '10px 18px', cursor: 'pointer' }}>
            Next step →
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Step 2: review the requester + rate Taskeeu ───────────────────── */
// `other` = who is being rated ('requester' for the tasker's step 2, 'tasker'
// for the requester's step 1 before the completion code is released).
function ReviewStep({ taskId, requesterName, otherName, other = 'requester', stepNo = 2, myReview, myPlatform, locked, onSaved, onBack, nextLabel = 'Next step →' }) {
  const who = otherName || requesterName || `the ${other}`;
  const placeholder = other === 'tasker'
    ? 'How was the work? Quality, punctuality, communication, respect…'
    : 'How was working with them? Clear instructions, respectful, paid on time…';
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [pRating, setPRating] = useState(0);
  const [pComment, setPComment] = useState('');
  const [saving, setSaving] = useState(false);

  if (locked) {
    return (
      <div className="text-center p-6 rounded-2xl" style={{ background: '#f8fafc' }}>
        <Lock size={28} className="mx-auto mb-2 text-slate-400" />
        <p className="font-bold text-slate-700">Finish step 1 first</p>
        <p className="text-sm text-slate-500 mb-3">Upload at least one proof of work, then come back to rate.</p>
        <button type="button" onClick={onBack} className="btn-primary btn-sm">Go to step 1</button>
      </div>
    );
  }

  if (myReview) {
    return (
      <div className="space-y-3">
        <p className="font-black text-lg" style={{ color: '#92400e' }}>Step {stepNo} · Your ratings are saved ✓</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="p-4 rounded-2xl" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
            <p className="text-xs font-black uppercase tracking-wide" style={{ color: '#b45309' }}>You rated {who}</p>
            <StarDisplay value={myReview.rating} size={18} />
            <p className="text-sm mt-1" style={{ color: '#374151', whiteSpace: 'pre-wrap' }}>{myReview.comment}</p>
          </div>
          <div className="p-4 rounded-2xl" style={{ background: '#fff5f7', border: '1px solid #ffd1dc' }}>
            <p className="text-xs font-black uppercase tracking-wide" style={{ color: '#c41445' }}>You rated Taskeeu</p>
            {myPlatform ? (
              <>
                <StarDisplay value={myPlatform.rating} size={18} />
                {myPlatform.comment && <p className="text-sm mt-1" style={{ color: '#374151', whiteSpace: 'pre-wrap' }}>{myPlatform.comment}</p>}
              </>
            ) : <p className="text-sm text-gray-500">Not rated.</p>}
          </div>
        </div>
        <button type="button" onClick={onSaved} className="btn-sm font-bold" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: 14, padding: '10px 18px', cursor: 'pointer' }}>
          {nextLabel}
        </button>
      </div>
    );
  }

  const len = comment.trim().length;
  const ready = rating >= 1 && len >= COMMENT_MIN && len <= COMMENT_MAX && pRating >= 1 && pComment.trim().length <= COMMENT_MAX;

  const submit = async () => {
    if (saving) return;
    if (rating < 1) { toast.error(`Tap the stars to rate the ${other}.`); return; }
    if (len < COMMENT_MIN) { toast.error(`Write at least ${COMMENT_MIN} characters about the ${other}.`); return; }
    if (pRating < 1) { toast.error('Tap the stars to rate Taskeeu.'); return; }
    setSaving(true);
    try {
      const { data } = await reviewsApi.submit({
        task_id: taskId, rating, comment: comment.trim(),
        platform_rating: pRating, platform_comment: pComment.trim() || undefined,
      });
      toast.success(data?.already ? 'Your ratings are already saved ✓' : 'Thank you! Ratings saved ✓');
      window.dispatchEvent(new Event('reviews-submitted'));
      await onSaved();
    } catch (err) {
      toast.error(errMsg(err, 'Could not save your ratings. Please try again.'));
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="font-black text-lg" style={{ color: '#92400e' }}>Step {stepNo} · Rate your experience</p>
        <p className="text-sm text-gray-500">Your honest feedback keeps Taskeeu safe for everyone.</p>
      </div>
      <div className="p-4 rounded-2xl" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
        <p className="font-black text-sm mb-1" style={{ color: '#92400e' }}>Rate {who} <span style={{ color: '#dc2626' }}>*</span></p>
        <StarInput value={rating} onChange={setRating} disabled={saving} />
        <textarea rows={3} maxLength={COMMENT_MAX} value={comment} onChange={(e) => setComment(e.target.value)} disabled={saving}
          placeholder={placeholder} className="input resize-none mt-2" aria-label={`Comment about the ${other}`} />
        <p className="text-xs mt-1" style={{ color: len >= COMMENT_MIN ? '#059669' : '#b45309' }}>{len >= COMMENT_MIN ? '✓ Looks good' : `${COMMENT_MIN - len} more character${COMMENT_MIN - len === 1 ? '' : 's'} needed`}</p>
      </div>
      <div className="p-4 rounded-2xl" style={{ background: '#fff5f7', border: '1px solid #ffd1dc' }}>
        <p className="font-black text-sm mb-1" style={{ color: '#c41445' }}>Rate Taskeeu <span style={{ color: '#dc2626' }}>*</span></p>
        <StarInput value={pRating} onChange={setPRating} disabled={saving} />
        <textarea rows={2} maxLength={COMMENT_MAX} value={pComment} onChange={(e) => setPComment(e.target.value)} disabled={saving}
          placeholder="Anything we can do better? (optional)" className="input resize-none mt-2" aria-label="Comment about Taskeeu" />
      </div>
      <button type="button" onClick={submit} disabled={saving}
        className="btn-sm font-black flex items-center gap-2"
        style={{ background: ready ? 'var(--rose)' : '#e5e7eb', color: ready ? 'white' : '#6b7280', border: 'none', borderRadius: 14, padding: '11px 20px', cursor: saving ? 'not-allowed' : 'pointer', pointerEvents: saving ? 'none' : 'auto' }}>
        {saving ? <><Spinner /> Saving…</> : <><Sparkles size={16} /> Save ratings</>}
      </button>
    </div>
  );
}

/* ── Step 3: completion code ──────────────────────────────────────── */
function CodeStep({ task, locked, missing, onGoTo, reload, onCompleted }) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (locked) {
    return (
      <div className="text-center p-6 rounded-2xl" style={{ background: '#f8fafc' }}>
        <Lock size={28} className="mx-auto mb-2 text-slate-400" />
        <p className="font-bold text-slate-700">Finish step {missing} first</p>
        <p className="text-sm text-slate-500 mb-3">{missing === 1 ? 'Upload your proof of work.' : 'Rate the requester and Taskeeu.'} Then enter the code here.</p>
        <button type="button" onClick={() => onGoTo(missing)} className="btn-primary btn-sm">Go to step {missing}</button>
      </div>
    );
  }

  const finish = (data) => {
    setCode('');
    toast.success(data?.message || 'Task completed! Your balance is now available in Earnings. 🎉', { duration: 6000 });
    window.dispatchEvent(new Event('reviews-refresh'));
    onCompleted?.(data);
  };

  const submit = async () => {
    if (submitting) return;
    const c = code.trim();
    if (!/^\d{6}$/.test(c)) { toast.error('Enter the 6-digit completion code.'); return; }
    setSubmitting(true);
    try {
      const { data } = await tasksApi.complete(task.id, { code: c });
      finish(data);
    } catch (err) {
      if (!err.response) {
        // No answer (timeout / network). The code may have been accepted — re-check.
        toast('Checking your task status…', { icon: '⏳' });
        try {
          const { data } = await tasksApi.get(task.id);
          if ((data.task || data)?.status === 'completed') { finish(null); return; }
        } catch { /* fall through */ }
        toast.error('Network problem — please try again.');
      } else {
        const codeName = err.response.data?.code;
        toast.error(errMsg(err, 'Could not submit the code. Please try again.'));
        if (codeName === 'PROOF_REQUIRED' || codeName === 'TASKER_REVIEW_REQUIRED') {
          await reload();
          onGoTo(codeName === 'PROOF_REQUIRED' ? 1 : 2);
        } else if (err.response.status === 400 && /not ongoing/i.test(err.response.data?.message || '')) {
          // Completed from another device, or cancelled — refresh the page state.
          onCompleted?.(null);
        }
      }
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="font-black text-lg" style={{ color: '#065f46' }}>Step 3 · Enter the completion code</p>
        <p className="text-sm text-gray-500">
          Ask the requester for their 6-digit code once they are happy with the work. Entering it completes the task and releases your payment.
          {!task.is_funded && <strong style={{ color: '#b45309' }}> This task has not been funded yet — the requester gets the code after paying into escrow.</strong>}
        </p>
      </div>
      <div className="p-5 rounded-2xl flex flex-wrap items-center gap-3" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
        <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          aria-label="6-digit completion code" data-testid="completion-code-input"
          className="input text-center font-black" style={{ width: 190, fontSize: 26, letterSpacing: '0.4em', background: 'white' }} />
        <button type="button" onClick={submit} disabled={submitting || code.length !== 6}
          className="btn-sm font-black flex items-center gap-2"
          style={{ background: code.length === 6 ? '#047857' : '#d1d5db', color: 'white', border: 'none', borderRadius: 14, padding: '13px 22px', cursor: submitting || code.length !== 6 ? 'not-allowed' : 'pointer', pointerEvents: submitting ? 'none' : 'auto' }}>
          {submitting ? <><Spinner /> Checking…</> : <><CheckCircle2 size={17} /> Complete task</>}
        </button>
      </div>
    </div>
  );
}

function CompletedPanel({ balance, proofs, review }) {
  return (
    <div className="text-center p-6 rounded-3xl" style={{ background: '#fff5f7' }} data-testid="task-completed-panel">
      <div style={{ width: 64, height: 64, borderRadius: 999, margin: '0 auto 10px', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PartyPopper size={30} color="white" />
      </div>
      <p className="font-black text-xl" style={{ color: '#065f46' }}>Task completed ✓</p>
      <p className="text-sm mt-1" style={{ color: '#047857' }}>
        {balance != null ? <>You will receive <strong>{naira(balance)}</strong> when you withdraw (after Taskeeu's fee).</> : 'Your balance is ready to withdraw.'}
      </p>
      <p className="text-xs mt-2" style={{ color: '#6b7280' }}>{proofs} proof file{proofs === 1 ? '' : 's'} · {review ? `you gave ${review.rating}★` : 'reviewed'}</p>
      <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('tasker-nav', { detail: 'payments' }))}
        className="btn-sm font-black mt-4 inline-flex items-center gap-2"
        style={{ background: '#047857', color: 'white', border: 'none', borderRadius: 14, padding: '11px 22px', cursor: 'pointer' }}>
        <Wallet size={16} /> Go to Earnings
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Requester: 2 steps to release payment
   1) rate & review the tasker + rate Taskeeu (required)
   2) get the 6-digit completion code to give the tasker
   ═══════════════════════════════════════════════════════════════════ */
export function RequesterReleaseFlow({ task, taskerName }) {
  const taskId = task.id;
  const [loaded, setLoaded] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [myPlatform, setMyPlatform] = useState(null);
  const [code, setCode] = useState(null);
  const [getting, setGetting] = useState(false);
  const [step, setStep] = useState(1);

  const load = useCallback(async () => {
    try {
      const { data } = await reviewsApi.forTask(taskId);
      setMyReview(data.my_review || null);
      setMyPlatform(data.my_platform_feedback || null);
      if (data.my_review) setStep(2);
    } catch { /* keep defaults */ }
    setLoaded(true);
  }, [taskId]);
  useEffect(() => { load(); }, [load]);

  const getCode = async () => {
    if (getting) return;
    setGetting(true);
    try {
      const { data } = await tasksApi.generateCode(taskId);
      setCode(data.code);
      toast.success('Your completion code is ready — also sent to your email.', { duration: 6000 });
    } catch (err) {
      toast.error(errMsg(err, 'Could not get the code. Please try again.'));
      if (err?.response?.data?.code === 'REQUESTER_REVIEW_REQUIRED') { setMyReview(null); setStep(1); }
    } finally { setGetting(false); }
  };

  if (!loaded) return <div className="card p-8 flex justify-center"><div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" /></div>;
  const done = [!!myReview, !!code];

  return (
    <div className="card overflow-hidden" style={{ border: '1px solid #a7f3d0' }} data-testid="release-flow">
      <div style={{ background: 'var(--rose)', padding: '16px 20px', color: 'white' }}>
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.85 }}>Release payment</p>
        <p style={{ fontSize: 19, fontWeight: 900 }}>2 quick steps when you are happy with the work</p>
      </div>
      <div className="flex gap-2 p-4" style={{ background: '#f0fdfa' }}>
        {[['1', 'Rate & review'], ['2', 'Get completion code']].map(([n, label], i) => (
          <button key={n} type="button" onClick={() => (i === 0 || done[0]) && setStep(i + 1)} disabled={i === 1 && !done[0]}
            aria-current={step === i + 1 ? 'step' : undefined}
            className="flex-1 flex items-center gap-2 p-2 rounded-2xl"
            style={{ border: `2px solid ${step === i + 1 ? '#10b981' : 'transparent'}`, background: 'white', cursor: i === 1 && !done[0] ? 'not-allowed' : 'pointer' }}>
            <span style={{ width: 30, height: 30, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13,
              background: done[i] ? '#10b981' : step === i + 1 ? 'var(--rose)' : '#e2e8f0', color: done[i] || step === i + 1 ? 'white' : '#64748b' }}>
              {done[i] ? <CheckCircle2 size={16} /> : (i === 1 && !done[0]) ? <Lock size={14} /> : n}
            </span>
            <span className="text-sm font-black" style={{ color: '#c41445' }}>{label}</span>
          </button>
        ))}
      </div>
      <div className="p-5">
        {step === 1 || !done[0] ? (
          <ReviewStep taskId={taskId} other="tasker" otherName={taskerName} stepNo={1} myReview={myReview} myPlatform={myPlatform}
            nextLabel="Get my completion code →"
            onSaved={async () => { await load(); setStep(2); }} />
        ) : (
          <div className="space-y-3">
            <p className="font-black text-lg" style={{ color: '#065f46' }}>Step 2 · Your completion code</p>
            <p className="text-sm text-gray-500">Give this code to the tasker <strong>only when you are satisfied</strong> the work is done. Entering it completes the task and releases their payment.</p>
            {code ? (
              <div className="p-5 rounded-2xl text-center" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                <p className="font-black" style={{ fontSize: 34, letterSpacing: '0.35em', color: '#064e3b' }} data-testid="completion-code">{code}</p>
                <p className="text-xs mt-1" style={{ color: '#047857' }}>Also sent to your email.</p>
              </div>
            ) : (
              <button type="button" onClick={getCode} disabled={getting}
                className="btn-sm font-black flex items-center gap-2"
                style={{ background: 'var(--rose)', color: 'white', border: 'none', borderRadius: 14, padding: '12px 22px', cursor: getting ? 'not-allowed' : 'pointer', pointerEvents: getting ? 'none' : 'auto' }}>
                {getting ? <><Spinner /> Getting code…</> : <><KeyRound size={16} /> Show my completion code</>}
              </button>
            )}
            <TipPanel task={task} compact />
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Requester: tip the tasker / add money for an unforeseen cost
   Goes straight to the tasker's earnings. No platform fee.
   ═══════════════════════════════════════════════════════════════════ */
export function TipPanel({ task, compact = false }) {
  const ongoing = task.status === 'ongoing';
  const [kind, setKind] = useState(ongoing ? 'extra' : 'tip');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(!compact);

  useEffect(() => {
    let alive = true;
    paymentsApi.tipsForTask(task.id).then(({ data }) => { if (alive) setTotal(Number(data.total || 0)); }).catch(() => {});
    return () => { alive = false; };
  }, [task.id]);

  if (!['ongoing', 'completed'].includes(task.status) || !task.accepted_tasker_id) return null;

  const pay = async () => {
    if (busy) return;
    const n = Math.round(Number(amount));
    if (!n || n < minTip()) { toast.error(`Enter at least ${money(minTip())}.`); return; }
    if (kind === 'extra' && note.trim().length < 3) { toast.error('Say briefly what the extra money is for.'); return; }
    setBusy(true);
    try {
      const { data } = await paymentsApi.tip({ task_id: task.id, amount: n, kind, note: note.trim() || undefined });
      toast.success('Redirecting to payment…');
      window.location.href = data.authorization_url;
    } catch (err) {
      toast.error(errMsg(err, 'Could not start the payment. Please try again.'));
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} data-testid="tip-open"
        className="btn-sm font-bold" style={{ background: 'white', color: 'var(--primary, #ff2d62)', border: '1px solid #ffd1dc', borderRadius: 12, padding: '10px 16px', cursor: 'pointer' }}>
        Tips to the tasker? (optional)
      </button>
    );
  }

  return (
    <div className="card p-5 space-y-3" style={{ border: '1px solid #ffd1dc' }} data-testid="tip-panel">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-black text-base" style={{ color: 'var(--text, #c41445)' }}>{ongoing ? 'Add money for your tasker' : 'Tip your tasker'}</p>
          <p className="text-sm" style={{ color: 'var(--muted, #6b7280)' }}>
            {ongoing
              ? 'Sudden unforeseen cost? Add money so your tasker can withdraw it. You can also leave a tip.'
              : 'Optional. A tip is a thank-you for great work.'}
            {' '}It goes straight to the tasker's earnings with no platform fee.
          </p>
        </div>
        {total > 0 && <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: '#fff5f7', color: 'var(--primary, #ff2d62)' }}>Sent so far {naira(total)}</span>}
      </div>
      {ongoing && (
        <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Type of payment">
          {[['extra', 'Unforeseen cost'], ['tip', 'Tip']].map(([k, label]) => (
            <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)}
              className="btn-sm font-bold" style={{ borderRadius: 999, padding: '7px 14px', cursor: 'pointer',
                background: kind === k ? 'var(--primary, #ff2d62)' : 'white', color: kind === k ? 'white' : 'var(--text, #c41445)', border: '1px solid #ffd1dc' }}>
              {label}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2 flex-wrap items-end">
        <div>
          <label className="label" htmlFor={`tip-amount-${task.id}`}>Amount ({sym()})</label>
          <input id={`tip-amount-${task.id}`} type="number" min={minTip()} step="any" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 1000" className="input" style={{ width: 150 }} aria-label="Tip amount" />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label className="label" htmlFor={`tip-note-${task.id}`}>{kind === 'extra' ? 'What is it for?' : 'Message (optional)'}</label>
          <input id={`tip-note-${task.id}`} type="text" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder={kind === 'extra' ? 'e.g. The part cost more than expected' : 'e.g. Thank you for the neat work'} className="input" aria-label="Tip note" />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={pay} disabled={busy}
          className="btn-primary btn-sm" style={{ pointerEvents: busy ? 'none' : 'auto' }}>
          {busy ? 'Opening payment…' : kind === 'extra' ? 'Add money' : 'Send tip'}
        </button>
        {compact && <button type="button" onClick={() => setOpen(false)} className="btn-ghost btn-sm">Not now</button>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Requester: live view of the tasker's progress
   ═══════════════════════════════════════════════════════════════════ */
export function TaskProgressForRequester({ task }) {
  const [proofs, setProofs] = useState(null);
  const [taskerReviewed, setTaskerReviewed] = useState(false);
  useEffect(() => {
    let alive = true;
    Promise.allSettled([tasksApi.proofs(task.id), reviewsApi.forTask(task.id)]).then(([p, r]) => {
      if (!alive) return;
      setProofs(p.status === 'fulfilled' ? (p.value.data.proofs || []) : []);
      if (r.status === 'fulfilled') setTaskerReviewed(!!r.value.data.their_review_submitted);
    });
    return () => { alive = false; };
  }, [task.id, task.status]);
  if (!proofs) return null;
  const done = [proofs.length > 0, taskerReviewed, task.status === 'completed'];
  const items = [
    ['Proof of work', proofs.length ? `${proofs.length} file${proofs.length === 1 ? '' : 's'} uploaded` : 'Not uploaded yet'],
    ['Tasker review', taskerReviewed ? 'Submitted' : 'Not yet'],
    ['Completion code', task.status === 'completed' ? 'Entered — task complete' : 'Give the code when you are satisfied'],
  ];
  return (
    <div className="card overflow-hidden" style={{ border: '1px solid #ffd1dc' }}>
      <div style={{ background: 'var(--rose)', padding: '14px 20px', color: 'white' }}>
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.85 }}>Tasker progress</p>
        <p style={{ fontSize: 18, fontWeight: 900 }}>{done.filter(Boolean).length}/3 steps done</p>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid gap-2 sm:grid-cols-3">
          {items.map(([t, s], i) => (
            <div key={t} className="p-3 rounded-2xl flex items-center gap-3" style={{ background: done[i] ? '#ecfdf5' : '#f8fafc', border: `1px solid ${done[i] ? '#a7f3d0' : '#e2e8f0'}` }}>
              <span style={{ width: 30, height: 30, borderRadius: 999, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done[i] ? '#10b981' : '#e2e8f0', color: done[i] ? 'white' : '#64748b', fontWeight: 900, fontSize: 13 }}>
                {done[i] ? <CheckCircle2 size={16} /> : i + 1}
              </span>
              <div style={{ minWidth: 0 }}>
                <p className="text-sm font-black" style={{ color: '#c41445' }}>{t}</p>
                <p className="text-xs" style={{ color: '#64748b' }}>{s}</p>
              </div>
            </div>
          ))}
        </div>
        {proofs.length > 0 && (
          <div>
            <p className="text-xs font-black uppercase tracking-wide mb-2" style={{ color: '#ff2d62' }}>Proof of work — tap a file to open it</p>
            <ProofsGrid proofs={proofs} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Advance panel — lives inside the task, for both roles
   ═══════════════════════════════════════════════════════════════════ */
const ADV_BADGE = {
  pending: ['Waiting for approval', '#fffbeb', '#b45309', Clock],
  approved: ['Approved', '#ecfdf5', '#047857', CheckCircle2],
  withdrawn: ['Sent to bank', '#eff6ff', '#ff2d62', ArrowDownToLine],
  rejected: ['Rejected', '#fff1f2', '#c41445', XCircle],
};

export function TaskAdvancePanel({ task, role, onChanged }) {
  const taskId = task.id;
  const [state, setState] = useState(null); // { advances, escrow }
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(null);
  const [form, setForm] = useState({ amount: '', note: '' });
  const [approveAmt, setApproveAmt] = useState('');
  const [respNote, setRespNote] = useState('');
  const [mode, setMode] = useState(null); // requester: 'approve' | 'reject'

  const load = useCallback(async () => {
    try {
      const { data } = await paymentsApi.getAdvanceForTask(taskId);
      setState({ advances: data.advances || [], escrow: data.escrow || null });
      setErr(false);
    } catch { setErr(true); }
  }, [taskId]);
  useEffect(() => { load(); }, [load]);

  const after = async () => { await load(); onChanged?.(); };

  const esc = state?.escrow;
  const advances = useMemo(() => state?.advances || [], [state]);
  const active = advances.find((a) => a.status === 'pending' || a.status === 'approved');
  const ongoing = (esc?.task_status || task.status) === 'ongoing';
  const funded = esc && esc.funded > 0;

  if (err) return (
    <div className="card p-5 text-sm text-gray-500 flex items-center justify-between gap-3">
      Could not load the advance details. <button type="button" className="btn-ghost btn-sm" onClick={load}>Retry</button>
    </div>
  );
  if (!state) return null;
  // Nothing useful to show: never funded and no history.
  if (!funded && !advances.length) {
    if (role !== 'tasker' || task.status !== 'ongoing') return null;
    return (
      <div className="card p-5" style={{ background: '#fff5f7', border: '1px solid #ffd1dc' }}>
        <p className="font-black flex items-center gap-2" style={{ color: '#c41445' }}><Wallet size={18} /> Advance payment</p>
        <p className="text-sm mt-1" style={{ color: '#ff2d62' }}>Once the requester pays into escrow you can request up to 50% upfront here for materials or transport.</p>
      </div>
    );
  }

  /* ── actions ── */
  const requestAdvance = async () => {
    if (busy) return;
    const amount = Math.floor(Number(form.amount));
    if (!amount || amount < minAmount()) { toast.error(`Enter at least ${money(minAmount())}.`); return; }
    if (amount > esc.advance_available) { toast.error(`You can request at most ${naira(esc.advance_available)} on this task.`); return; }
    setBusy('request');
    try {
      const { data } = await paymentsApi.requestAdvance({ task_id: taskId, requested_amount: amount, note: form.note.trim() });
      toast.success(data?.message || 'Advance request sent!');
      setForm({ amount: '', note: '' });
    } catch (e) {
      if (!e.response) toast('No response — checking whether your request was sent…', { icon: '⏳' });
      else if (e.response.status === 409) toast(errMsg(e, 'You already have an active advance on this task.'), { icon: 'ℹ️' });
      else toast.error(errMsg(e, 'Could not send the request.'));
    } finally { setBusy(null); after(); }
  };

  const withdraw = async (adv) => {
    if (busy) return;
    if (!window.confirm(`Send ${naira(adv.approved_amount)} to your bank account now?`)) return;
    setBusy(adv.id);
    try {
      const { data, status } = await paymentsApi.withdrawAdvance(adv.id);
      if (status === 202 || data?.pending_confirmation) toast(data.message, { duration: 10000, icon: '⏳' });
      else toast.success(data?.message || 'Advance sent to your bank account.', { duration: 7000 });
    } catch (e) {
      if (!e.response) toast('No response — refreshing. If the status shows "Sent to bank", the money is on its way.', { duration: 8000, icon: '⏳' });
      else toast.error(errMsg(e, 'Withdrawal failed. Please try again.'));
    } finally { setBusy(null); after(); }
  };

  const respond = async (adv, decision) => {
    if (busy) return;
    const payload = { decision, response_note: respNote.trim() || undefined };
    if (decision === 'approved') {
      const amt = Math.floor(Number(approveAmt || adv.requested_amount));
      const max = Math.min(Number(adv.requested_amount), esc?.advance_available ?? Number(adv.requested_amount));
      if (!amt || amt < minAmount()) { toast.error(`Approve at least ${money(minAmount())}.`); return; }
      if (amt > max) { toast.error(`You can approve at most ${naira(max)}.`); return; }
      payload.approved_amount = amt;
    }
    setBusy(adv.id);
    try {
      const { data } = await paymentsApi.respondAdvance(adv.id, payload);
      toast.success(data?.message || (decision === 'approved' ? 'Advance approved. The tasker can now withdraw it.' : 'Advance request rejected.'), { duration: 6000 });
      setMode(null); setApproveAmt(''); setRespNote('');
    } catch (e) {
      if (e.response?.status === 409) { toast(errMsg(e, 'This request was already answered.'), { icon: 'ℹ️' }); setMode(null); }
      else toast.error(errMsg(e, 'Could not save your decision. Please try again.'));
    } finally { setBusy(null); after(); }
  };

  const reqAmount = Math.floor(Number(form.amount)) || 0;
  const pendingApprove = active?.status === 'pending' ? (Math.floor(Number(approveAmt || active.requested_amount)) || 0) : 0;

  return (
    <div className="card overflow-hidden" style={{ border: '1px solid #bfdbfe' }} data-testid="advance-panel">
      <div style={{ background: 'var(--rose)', padding: '16px 20px', color: 'white' }}>
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.85 }}>Escrow & advance</p>
        <p style={{ fontSize: 18, fontWeight: 900 }}>
          {!ongoing ? 'Money summary for this task' : role === 'tasker' ? 'Need money upfront for materials or transport?' : 'Money held safely for this task'}
        </p>
      </div>
      <div className="p-5 space-y-4">
        {esc && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Tile label={role === 'tasker' ? 'In escrow' : 'You paid'} value={naira(esc.funded)} tone="slate" />
            <Tile label="Advance paid" value={minus(esc.advance_withdrawn)} tone="rose" />
            <Tile label={ongoing ? 'Approved, not sent' : 'Pending'} value={ongoing ? minus(esc.advance_approved) : naira(0)} tone="amber"
              hint={!ongoing && esc.advance_approved > 0 ? `${naira(esc.advance_approved)} unused advance returned to balance` : undefined} />
            <Tile label="Balance" value={naira(esc.remaining)} tone="green"
              hint={ongoing ? 'Released with the completion code' : esc.payout_status === 'withdrawn' ? 'Paid out' : undefined} />
          </div>
        )}

        {/* ── Active request ── */}
        {active && role === 'tasker' && (
          <AdvanceCard adv={active} highlight>
            {active.status === 'pending' && <p className="text-sm" style={{ color: '#92400e' }}>The requester has been notified. You will be told as soon as they respond.</p>}
            {active.status === 'approved' && ongoing && (
              <button type="button" onClick={() => withdraw(active)} disabled={!!busy}
                className="btn-sm font-black flex items-center gap-2 mt-1"
                style={{ background: '#047857', color: 'white', border: 'none', borderRadius: 14, padding: '11px 20px', cursor: busy ? 'not-allowed' : 'pointer', pointerEvents: busy ? 'none' : 'auto' }}>
                {busy === active.id ? <><Spinner /> Sending to bank…</> : <><ArrowDownToLine size={16} /> Withdraw {naira(active.approved_amount)} to my bank</>}
              </button>
            )}
            {active.status === 'approved' && !ongoing && (
              <p className="text-sm text-gray-600">This advance was not withdrawn before the task ended, so it is part of your final balance.</p>
            )}
          </AdvanceCard>
        )}

        {active && role === 'requester' && (
          <AdvanceCard adv={active} highlight>
            {active.status === 'approved' && <p className="text-sm" style={{ color: '#047857' }}>Approved. The tasker can withdraw it to their bank.</p>}
            {active.status === 'pending' && ongoing && (
              mode === null ? (
                <div className="flex gap-2 flex-wrap mt-1">
                  <button type="button" onClick={() => { setMode('approve'); setApproveAmt(String(Math.min(Number(active.requested_amount), esc?.advance_available ?? Infinity))); setRespNote(''); }}
                    className="btn-sm font-black" style={{ background: '#047857', color: 'white', border: 'none', borderRadius: 12, padding: '10px 18px', cursor: 'pointer' }}>
                    ✓ Approve
                  </button>
                  <button type="button" onClick={() => { setMode('reject'); setRespNote(''); }}
                    className="btn-sm font-bold" style={{ background: '#fff1f2', color: '#c41445', border: '1px solid #fecdd3', borderRadius: 12, padding: '10px 18px', cursor: 'pointer' }}>
                    ✕ Reject
                  </button>
                </div>
              ) : mode === 'approve' ? (
                <div className="space-y-2 mt-1">
                  <label className="label">Amount to approve ({sym()}),  up to {naira(Math.min(Number(active.requested_amount), esc?.advance_available ?? Number(active.requested_amount)))}</label>
                  <input type="number" min={minAmount()} step={1} value={approveAmt} onChange={(e) => setApproveAmt(e.target.value)} className="input" style={{ maxWidth: 220 }} aria-label="Amount to approve" />
                  {esc && pendingApprove >= 100 && (
                    <p className="text-xs" style={{ color: '#166534' }}>Escrow balance after approval: <strong>{naira(Math.max(0, esc.remaining - pendingApprove))}</strong> — released to the tasker on completion.</p>
                  )}
                  <textarea rows={2} value={respNote} onChange={(e) => setRespNote(e.target.value)} placeholder="Note to the tasker (optional) — e.g. please keep the receipts." className="input resize-none" />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => respond(active, 'approved')} disabled={!!busy}
                      className="btn-sm font-black" style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: 12, padding: '10px 18px', cursor: busy ? 'not-allowed' : 'pointer', pointerEvents: busy ? 'none' : 'auto' }}>
                      {busy === active.id ? 'Approving…' : `Approve ${naira(pendingApprove)}`}
                    </button>
                    <button type="button" onClick={() => setMode(null)} className="btn-ghost btn-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 mt-1">
                  <textarea rows={2} value={respNote} onChange={(e) => setRespNote(e.target.value)} placeholder="Reason (optional) — the tasker will see it." className="input resize-none" />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => respond(active, 'rejected')} disabled={!!busy}
                      className="btn-sm font-black" style={{ background: '#ff2d62', color: 'white', border: 'none', borderRadius: 12, padding: '10px 18px', cursor: busy ? 'not-allowed' : 'pointer', pointerEvents: busy ? 'none' : 'auto' }}>
                      {busy === active.id ? 'Rejecting…' : 'Confirm rejection'}
                    </button>
                    <button type="button" onClick={() => setMode(null)} className="btn-ghost btn-sm">Cancel</button>
                  </div>
                </div>
              )
            )}
          </AdvanceCard>
        )}

        {/* ── Tasker: new request ── */}
        {role === 'tasker' && !active && ongoing && funded && (
          esc.advance_available >= 100 ? (
            <div className="p-4 rounded-2xl space-y-3" style={{ background: '#fff5f7', border: '1px solid #ffd1dc' }}>
              <p className="font-black text-sm" style={{ color: '#c41445' }}>Request an advance — up to {naira(esc.advance_available)}</p>
              <input type="number" min={minAmount()} max={esc.advance_available} step={1} placeholder={`Amount, e.g. ${minAmount() * 10}`} value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input" aria-label="Advance amount" />
              <textarea rows={2} placeholder="What is it for? e.g. paint, brushes and transport to the site" value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })} className="input resize-none" aria-label="Advance reason" />
              {reqAmount >= 100 && reqAmount <= esc.advance_available && (
                <p className="text-xs" style={{ color: '#ff2d62' }}>If approved, the escrow balance becomes <strong>{naira(esc.remaining - reqAmount)}</strong>, paid to you on completion.</p>
              )}
              <button type="button" onClick={requestAdvance} disabled={busy === 'request'}
                className="btn-sm font-black flex items-center gap-2"
                style={{ background: 'var(--rose)', color: 'white', border: 'none', borderRadius: 14, padding: '11px 20px', cursor: busy ? 'not-allowed' : 'pointer', pointerEvents: busy === 'request' ? 'none' : 'auto' }}>
                {busy === 'request' ? <><Spinner /> Sending…</> : <><Wallet size={16} /> Send request</>}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">You have received the maximum advance for this task (50% of {naira(esc.funded)}).</p>
          )
        )}

        {/* ── History ── */}
        {advances.filter((a) => a.id !== active?.id).length > 0 && (
          <div>
            <p className="text-xs font-black uppercase tracking-wide mb-2 text-gray-400">Advance history</p>
            <div className="space-y-2">
              {advances.filter((a) => a.id !== active?.id).map((a) => <AdvanceCard key={a.id} adv={a} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AdvanceCard({ adv, highlight, children }) {
  const [label, bg, color, Icon] = ADV_BADGE[adv.status] || ADV_BADGE.pending;
  const amount = adv.status === 'pending' || adv.status === 'rejected' ? adv.requested_amount : adv.approved_amount;
  return (
    <div className="p-4 rounded-2xl" style={{ background: highlight ? bg : '#fff', border: `1px solid ${highlight ? color + '44' : '#e5e7eb'}` }} data-testid={`advance-${adv.status}`}>
      <div className="flex items-center gap-3 flex-wrap">
        <span style={{ width: 36, height: 36, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}33` }}>
          <Icon size={18} color={color} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-black" style={{ color: '#c41445' }}>{naira(amount)}
            {adv.approved_amount && Number(adv.approved_amount) !== Number(adv.requested_amount) && (
              <span className="text-xs font-semibold ml-2" style={{ color: '#b45309' }}>(asked {naira(adv.requested_amount)})</span>
            )}
          </p>
          <p className="text-xs text-gray-500">{safeDate(adv.created_at)}{adv.withdrawn_at ? ` · sent ${safeDate(adv.withdrawn_at)}` : ''}</p>
        </div>
        <span className="text-xs font-black px-3 py-1 rounded-full" style={{ background: bg, color }}>{label}</span>
      </div>
      {adv.note && <p className="text-sm mt-2" style={{ color: '#374151' }}>“{adv.note}”</p>}
      {adv.response_note && <p className="text-xs mt-1" style={{ color }}>Requester: “{adv.response_note}”</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
