import { minTip, money } from '../../utils/market';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { reviewsApi, paymentsApi } from '../../utils/api';

export const COMMENT_MIN = 10;
export const COMMENT_MAX = 1000;
const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/* ── Read-only stars ─────────────────────────────────────────────── */
export function StarDisplay({ value = 0, size = 14 }) {
  const v = Number(value) || 0;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${v.toFixed(1)} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size}
          style={{ color: i <= Math.round(v) ? '#f59e0b' : '#d1d5db', fill: i <= Math.round(v) ? '#f59e0b' : 'none' }} />
      ))}
    </span>
  );
}

/* ── Compact "4.5 ★ (12)" badge ──────────────────────────────────── */
export function RatingBadge({ average = 0, count = 0, label, emptyText = 'No reviews yet' }) {
  const avg = Number(average) || 0;
  const n = Number(count) || 0;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: '#92400e', background: '#fffbeb', padding: '2px 8px', borderRadius: 8 }}>
      <Star size={12} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
      {label && <span>{label}</span>}
      {n > 0 ? <>{avg.toFixed(1)} <span style={{ color: '#b45309', fontWeight: 500 }}>({n})</span></> : <span style={{ fontWeight: 500 }}>{emptyText}</span>}
    </span>
  );
}

/* ── Clickable 1–5 star picker ───────────────────────────────────── */
export function StarInput({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Star rating">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" role="radio" aria-checked={value === i}
            aria-label={`${i} star${i > 1 ? 's' : ''} — ${LABELS[i]}`}
            disabled={disabled}
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
            style={{ background: 'none', border: 'none', padding: 2, cursor: disabled ? 'default' : 'pointer' }}>
            <Star size={34} style={{ color: i <= shown ? '#f59e0b' : '#d1d5db', fill: i <= shown ? '#f59e0b' : 'none', transition: 'all .1s' }} />
          </button>
        ))}
      </div>
      <p className="text-sm font-semibold mt-1" style={{ color: shown ? '#92400e' : '#9ca3af', minHeight: 20 }}>
        {shown ? LABELS[shown] : 'Tap a star to rate'}
      </p>
    </div>
  );
}

/* ── Compulsory review gate ──────────────────────────────────────────
   Mount once per dashboard. Loads the reviews the user owes and shows a
   form that cannot be dismissed until each one is submitted. Opens:
   on load, when the tab regains focus, on 'reviews-refresh', and when the
   server blocks an action with REVIEW_REQUIRED ('review-required').        */
export function ReviewGate() {
  const [pending, setPending] = useState([]);
  const [doneCount, setDoneCount] = useState(0);

  const load = useCallback(() => {
    reviewsApi.pending()
      .then((r) => {
        const server = r.data.pending || [];
        // Keep any voluntary review the user has open (the server list only
        // contains compulsory ones), so a refresh never wipes what they typed.
        setPending((prev) => [...server, ...prev.filter((p) => p.voluntary && !server.some((x) => x.task_id === p.task_id))]);
      })
      .catch(() => {}); // never block the dashboard because this lookup failed
  }, []);

  useEffect(() => {
    load();
    const onRefresh = () => load();
    const onRequired = (e) => {
      if (Array.isArray(e.detail) && e.detail.length) setPending(e.detail);
      else load();
    };
    // Voluntary review of an older task (not compulsory) — can be closed.
    const onOpen = (e) => {
      const item = e.detail;
      if (!item?.task_id) return;
      setPending((list) => list.some((p) => p.task_id === item.task_id) ? list : [...list, { ...item, voluntary: true }]);
    };
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    window.addEventListener('review-open', onOpen);
    window.addEventListener('reviews-refresh', onRefresh);
    window.addEventListener('review-required', onRequired);
    document.addEventListener('visibilitychange', onVisible);
    // Catch a task completed by the other side while this page is open.
    const timer = setInterval(() => { if (document.visibilityState !== 'hidden') load(); }, 60000);
    return () => {
      clearInterval(timer);
      window.removeEventListener('reviews-refresh', onRefresh);
      window.removeEventListener('review-required', onRequired);
      window.removeEventListener('review-open', onOpen);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  const current = pending[0];
  if (!current) return null;

  // key = task id → each review gets a brand-new form with empty fields.
  return (
    <ReviewForm
      key={current.task_id}
      item={current}
      position={doneCount + 1}
      total={pending.length + doneCount}
      onSubmitted={() => {
        setDoneCount((n) => n + 1);
        setPending((list) => list.filter((p) => p.task_id !== current.task_id));
        window.dispatchEvent(new CustomEvent('reviews-submitted', { detail: { task_id: current.task_id } }));
      }}
      onDismiss={() => setPending((list) => list.filter((p) => p.task_id !== current.task_id))}
      onReload={load}
    />
  );
}

function ReviewForm({ item, position, total, onSubmitted, onDismiss, onReload }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [pRating, setPRating] = useState(0);
  const [pComment, setPComment] = useState('');
  const [tip, setTip] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const submittingRef = useRef(false);

  const who = item.you_review === 'tasker' ? 'tasker' : 'requester';
  const name = item.counterpart?.name || `your ${who}`;
  const trimmed = comment.replace(/\s+/g, ' ').trim();
  const valid = rating >= 1 && rating <= 5 && trimmed.length >= COMMENT_MIN && trimmed.length <= COMMENT_MAX && pRating >= 1;

  const submit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!rating) { setError('Please choose a star rating.'); return; }
    if (trimmed.length < COMMENT_MIN) { setError(`Please write at least ${COMMENT_MIN} characters.`); return; }
    if (trimmed.length > COMMENT_MAX) { setError(`Please keep it under ${COMMENT_MAX} characters.`); return; }
    if (!pRating) { setError('Please rate Taskeeu too.'); return; }
    if (tip !== '' && Number(tip) > 0 && Number(tip) < minTip()) { setError(`A tip must be at least ${money(minTip())}, or leave it empty.`); return; }
    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      const { data } = await reviewsApi.submit({ task_id: item.task_id, rating, comment: trimmed, platform_rating: pRating, platform_comment: pComment.trim() || undefined });
      toast.success(data?.message || 'Thank you! Your review has been submitted.');
      onSubmitted();
      const tipAmount = Math.round(Number(tip));
      if (who === 'tasker' && tipAmount >= 100) {
        try {
          const { data: t } = await paymentsApi.tip({ task_id: item.task_id, amount: tipAmount, kind: 'tip' });
          window.location.href = t.authorization_url;
        } catch (e) { toast.error(e.response?.data?.message || 'Your review was saved, but the tip could not be started. You can tip from the task page.'); }
      }
    } catch (err) {
      if (!err.response) setError('No connection. Please check your internet and try again.');
      else setError(err.response.data?.message || 'Could not submit your review. Please try again.');
      if (err.response?.status === 403 || err.response?.status === 404) onReload();
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="review-gate-title"
      onKeyDown={(e) => { if (e.key === 'Escape') e.stopPropagation(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,10,25,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <form onSubmit={submit} className="card"
        style={{ width: '100%', maxWidth: 480, background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.35)' }}>
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#16a34a' }}>Task completed ✓</p>
          {total > 1 && <p className="text-xs font-semibold text-gray-400">Review {position} of {total}</p>}
        </div>
        <h2 id="review-gate-title" className="font-black text-xl text-gray-900 mb-1">How was working with {name}?</h2>
        <p className="text-sm text-gray-500 mb-4">
          Rate your {who} for <strong className="text-gray-700">“{item.title}”</strong>.
          {item.completed_at && <> Completed {format(new Date(item.completed_at), 'MMM d, yyyy')}.</>}
        </p>

        {item.counterpart && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center font-bold text-white flex-shrink-0" style={{ background: 'var(--primary, #ff2d62)' }}>
              {item.counterpart.avatar_url ? <img src={item.counterpart.avatar_url} alt="" className="w-full h-full object-cover" /> : (name.replace('@', '')[0] || '?').toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{name}</p>
              <p className="text-xs text-gray-400 capitalize">{who}</p>
            </div>
          </div>
        )}

        <StarInput value={rating} onChange={(v) => { setRating(v); setError(''); }} disabled={submitting} />

        <label className="label mt-4" htmlFor="review-comment">Your comment <span className="text-red-500">*</span></label>
        <textarea id="review-comment" rows={4} maxLength={COMMENT_MAX + 50} className="input resize-none"
          placeholder={who === 'tasker'
            ? 'e.g. Arrived on time, did neat work and kept me updated.'
            : 'e.g. Clear instructions, easy to reach and paid promptly.'}
          value={comment} disabled={submitting}
          onChange={(e) => { setComment(e.target.value); setError(''); }} />
        <div className="flex justify-between text-xs mt-1">
          <span style={{ color: trimmed.length >= COMMENT_MIN ? '#16a34a' : '#9ca3af' }}>
            {trimmed.length >= COMMENT_MIN ? '✓ Looks good' : `At least ${COMMENT_MIN} characters (${Math.max(0, COMMENT_MIN - trimmed.length)} more)`}
          </span>
          <span style={{ color: trimmed.length > COMMENT_MAX ? '#dc2626' : '#9ca3af' }}>{trimmed.length}/{COMMENT_MAX}</span>
        </div>

        <div className="mt-4 p-3 rounded-xl" style={{ background: '#fff5f7', border: '1px solid #ffd1dc' }}>
          <p className="text-sm font-bold text-gray-900 mb-1">Rate Taskeeu <span className="text-red-500">*</span></p>
          <StarInput value={pRating} onChange={(v) => { setPRating(v); setError(''); }} disabled={submitting} />
          <textarea rows={2} maxLength={COMMENT_MAX} className="input resize-none mt-2" aria-label="Comment about Taskeeu"
            placeholder="Anything we can do better? (optional)" value={pComment} disabled={submitting}
            onChange={(e) => setPComment(e.target.value)} />
        </div>

        {who === 'tasker' && (
          <div className="mt-4">
            <label className="label" htmlFor="review-tip">Tips to the tasker? <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
            <input id="review-tip" type="number" min={minTip()} step="any" className="input" placeholder="Leave empty for no tip" value={tip}
              disabled={submitting} onChange={(e) => setTip(e.target.value)} aria-label="Optional tip" />
            <p className="text-xs text-gray-400 mt-1">Goes straight to the tasker with no platform fee. You will be taken to payment after submitting.</p>
          </div>
        )}

        {error && <p role="alert" className="text-sm mt-3 p-2 rounded-lg" style={{ background: '#fef2f2', color: '#b91c1c' }}>{error}</p>}

        <button type="submit" disabled={!valid || submitting}
          className="btn-primary w-full mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {submitting ? 'Submitting…' : 'Submit review'}
        </button>
        {item.voluntary ? (
          <button type="button" className="btn-ghost w-full mt-2" disabled={submitting} onClick={onDismiss}>
            Not now
          </button>
        ) : null}
        <p className="text-xs text-gray-400 text-center mt-3">
          {item.voluntary
            ? 'Reviews cannot be changed once submitted.'
            : 'Reviews are required after every completed task and cannot be changed once submitted. They help everyone on Taskeeu choose who to work with.'}
        </p>
      </form>
    </div>
  );
}

/* ── "Reviews I've received" panel ─────────────────────────────────── */
export function ReviewsReceived({ as, title }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    reviewsApi.mine(as)
      .then((r) => { setData(r.data); setFailed(false); })
      .catch(() => setFailed(true));
  }, [as]);

  useEffect(() => {
    load();
    const onSubmitted = () => load();
    window.addEventListener('reviews-submitted', onSubmitted);
    return () => window.removeEventListener('reviews-submitted', onSubmitted);
  }, [load]);

  const heading = title || (as === 'requester' ? 'Reviews from taskers' : 'Reviews from requesters');

  return (
    <div className="card p-6">
      <h3 className="font-black text-gray-900 text-lg mb-4 flex items-center gap-2"><Star size={18} style={{ color: '#f59e0b', fill: '#f59e0b' }} /> {heading}</h3>
      {failed ? (
        <p className="text-sm text-gray-500">Could not load reviews. <button type="button" className="underline" onClick={load}>Try again</button></p>
      ) : !data ? (
        <p className="text-sm text-gray-400">Loading reviews…</p>
      ) : data.count === 0 ? (
        <p className="text-sm text-gray-500">No reviews yet. Reviews appear here after you complete tasks.</p>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-44 flex-shrink-0">
            <p className="font-black text-5xl text-gray-900">{Number(data.average).toFixed(1)}</p>
            <StarDisplay value={data.average} size={16} />
            <p className="text-xs text-gray-400 mt-1">{data.count} review{data.count === 1 ? '' : 's'}</p>
            <div className="space-y-1 mt-3">
              {data.distribution.map((d) => (
                <div key={d.star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-gray-500">{d.star}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${data.count ? (d.count / data.count) * 100 : 0}%`, background: '#f59e0b' }} />
                  </div>
                  <span className="w-4 text-gray-400">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-4 max-h-96 overflow-y-auto pr-1">
            {data.reviews.map((r) => (
              <div key={r.id} className="border-b pb-3 last:border-0" style={{ borderColor: 'var(--border, #eee)' }}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm text-gray-800">{r.reviewer?.name}</p>
                  <span className="text-xs text-gray-400">{r.created_at ? format(new Date(r.created_at), 'MMM d, yyyy') : ''}</span>
                </div>
                <StarDisplay value={r.rating} />
                {r.task_title && <p className="text-xs text-gray-400 mt-0.5">Task: {r.task_title}</p>}
                <p className="text-sm text-gray-600 mt-1 leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Both reviews on one completed task ─────────────────────────────── */
export function TaskReviews({ taskId, taskTitle, otherLabel, otherName }) {
  const [data, setData] = useState(null);
  const load = useCallback(() => {
    reviewsApi.forTask(taskId).then((r) => setData(r.data)).catch(() => setData(null));
  }, [taskId]);
  useEffect(() => {
    load();
    const onSubmitted = () => load();
    window.addEventListener('reviews-submitted', onSubmitted);
    return () => window.removeEventListener('reviews-submitted', onSubmitted);
  }, [load]);
  if (!data || data.task_status !== 'completed') return null;
  const Row = ({ title, review, empty }) => (
    <div className="p-3 rounded-xl" style={{ background: 'var(--surface, #f9fafb)' }}>
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">{title}</p>
      {review ? (
        <>
          <StarDisplay value={review.rating} />
          <p className="text-sm text-gray-700 mt-1" style={{ whiteSpace: 'pre-wrap' }}>{review.comment}</p>
        </>
      ) : <p className="text-sm text-gray-500">{empty}</p>}
    </div>
  );
  return (
    <div className="card p-6 space-y-3">
      <h4 className="font-bold text-sm uppercase tracking-wide" style={{ color: 'var(--muted, #6b7280)' }}>Reviews</h4>
      <Row title="Your review" review={data.my_review}
        empty={<>Not reviewed yet. <button type="button" className="underline font-semibold" onClick={() => window.dispatchEvent(new CustomEvent('review-open', { detail: { task_id: taskId, title: taskTitle || 'this task', you_review: otherLabel.toLowerCase() === 'tasker' ? 'tasker' : 'requester', counterpart: otherName ? { name: otherName } : null } }))}>Write your review</button></>} />
      <Row title={`${otherLabel}'s review of you`} review={data.their_review}
        empty={data.their_review_submitted ? 'Submitted — visible after you write yours.' : `Waiting for the ${otherLabel.toLowerCase()} to review.`} />
    </div>
  );
}
