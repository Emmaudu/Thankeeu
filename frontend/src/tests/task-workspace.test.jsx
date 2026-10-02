import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const toastCalls = [];
vi.mock('react-hot-toast', () => {
  const t = vi.fn((m) => toastCalls.push(['info', m]));
  t.success = vi.fn((m) => toastCalls.push(['success', m]));
  t.error = vi.fn((m) => toastCalls.push(['error', m]));
  return { default: t, toast: t, Toaster: () => null };
});

const S = {};
const calls = {};
const count = (k) => { calls[k] = (calls[k] || 0) + 1; };
const slow = (v) => new Promise((r) => setTimeout(() => r(v), 30));
vi.mock('../utils/api', () => ({
  tasksApi: {
    proofs: () => Promise.resolve({ data: { proofs: S.proofs } }),
    uploadProofs: (id, fd) => { count('upload'); const files = fd.getAll('files'); const saved = files.map((f, i) => ({ id: 'np' + i + (calls.upload || 0), file_name: f.name, mime_type: f.type, size_bytes: f.size, url: 'https://x/' + f.name })); S.proofs = [...S.proofs, ...saved]; return slow({ data: { proofs: saved } }); },
    deleteProof: (id, pid) => { count('del'); S.proofs = S.proofs.filter((p) => p.id !== pid); return slow({ data: {} }); },
    complete: (id, d) => { count('complete'); if (d.code !== '123456') return Promise.reject({ response: { status: 400, data: { message: 'Invalid completion code.' } } }); S.status = 'completed'; return slow({ data: { message: 'Task completed!' } }); },
    get: () => Promise.resolve({ data: { task: { id: 'T1', status: S.status } } }),
  },
  reviewsApi: {
    forTask: () => Promise.resolve({ data: { my_review: S.review, my_platform_feedback: S.platform, their_review_submitted: !!S.theirs } }),
    submit: (d) => { count('review'); S.review = { rating: d.rating, comment: d.comment }; S.platform = { rating: d.platform_rating, comment: d.platform_comment || null }; S.lastReview = d; return slow({ data: { message: 'ok' } }); },
  },
  paymentsApi: {
    getAdvanceForTask: () => Promise.resolve({ data: { advances: S.advances, escrow: S.escrow } }),
    requestAdvance: (d) => { count('request'); S.advances = [{ id: 'a1', status: 'pending', requested_amount: d.requested_amount, note: d.note }]; return slow({ status: 201, data: { message: 'Advance request sent.' } }); },
    respondAdvance: (id, d) => { count('respond'); S.lastRespond = d; S.advances = S.advances.map((a) => ({ ...a, status: d.decision, approved_amount: d.approved_amount ?? null })); if (d.decision === 'approved') S.escrow = { ...S.escrow, advance_approved: d.approved_amount, remaining: S.escrow.remaining - d.approved_amount, advance_available: 0 }; return slow({ data: { message: 'Advance approved.' } }); },
    withdrawAdvance: () => { count('withdraw'); S.advances = S.advances.map((a) => ({ ...a, status: 'withdrawn' })); return slow({ status: 200, data: { message: '₦100 is on its way' } }); },
  },
}));

import { TaskerCompletionFlow, TaskAdvancePanel, TaskProgressForRequester } from '../components/task/TaskWorkspace';

const esc = (over) => ({ task_status: 'ongoing', funded: 200, advance_withdrawn: 0, advance_approved: 0, advance_pending: 0, advance_available: 100, remaining: 200, payout_status: 'locked', ...over });
const task = (status = 'ongoing') => ({ id: 'T1', title: 'Paint fence', status, is_funded: true });

beforeEach(() => {
  toastCalls.length = 0;
  Object.keys(calls).forEach((k) => delete calls[k]);
  Object.assign(S, { proofs: [], review: null, platform: null, theirs: false, status: 'ongoing', advances: [], escrow: esc(), lastReview: null, lastRespond: null });
  window.confirm = () => true;
  URL.createObjectURL = () => 'blob:x'; URL.revokeObjectURL = () => {};
});

describe('Tasker 3-step completion flow', () => {
  it('starts on step 1 with steps 2 and 3 locked', async () => {
    render(<TaskerCompletionFlow task={task()} />);
    expect(await screen.findByText(/Step 1 · Show your finished work/)).toBeInTheDocument();
    expect(screen.getByText(/0\/3/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /3\. Completion/ })).toBeDisabled();
  });

  it('proofs: blocks programs, uploads several files once on double-click, then moves to step 2', async () => {
    render(<TaskerCompletionFlow task={task()} />);
    const input = await screen.findByTestId('proof-input');
    fireEvent.change(input, { target: { files: [new File(['x'], 'bad.exe'), new File(['img'], 'wall.png', { type: 'image/png' }), new File(['pdf'], 'receipt.pdf', { type: 'application/pdf' })] } });
    expect(toastCalls.some(([k, m]) => k === 'error' && /bad\.exe/.test(m))).toBe(true);
    const save = screen.getByRole('button', { name: /Save proofs \(2\)/ });
    fireEvent.click(save); fireEvent.click(save);
    expect(await screen.findByText(/Step 2 · Rate your experience/)).toBeInTheDocument();
    expect(calls.upload).toBe(1);
    expect(S.proofs.map((p) => p.file_name)).toEqual(['wall.png', 'receipt.pdf']);
  });

  it('review: needs both star ratings, sends Taskeeu rating with the review, then opens step 3', async () => {
    S.proofs = [{ id: 'p1', file_name: 'a.png', url: 'u' }];
    render(<TaskerCompletionFlow task={task()} requesterName="@rita" />);
    await screen.findByText(/Step 2 · Rate your experience/);
    fireEvent.click(screen.getByRole('button', { name: /Save ratings/ }));
    expect(calls.review).toBeUndefined();
    const groups = screen.getAllByRole('radiogroup');
    fireEvent.click(groups[0].querySelectorAll('[role=radio]')[4]);
    fireEvent.change(screen.getByLabelText('Comment about the requester'), { target: { value: 'Very clear and kind.' } });
    fireEvent.click(screen.getByRole('button', { name: /Save ratings/ }));
    expect(calls.review).toBeUndefined(); // Taskeeu rating still missing
    fireEvent.click(groups[1].querySelectorAll('[role=radio]')[3]);
    fireEvent.click(screen.getByRole('button', { name: /Save ratings/ }));
    expect(await screen.findByText(/Step 3 · Enter the completion code/)).toBeInTheDocument();
    expect(S.lastReview).toMatchObject({ task_id: 'T1', rating: 5, platform_rating: 4 });
  });

  it('code: wrong code keeps the box; right code (double-click) submits once and hands over to the page', async () => {
    S.proofs = [{ id: 'p1', file_name: 'a.png', url: 'u' }];
    S.review = { rating: 5, comment: 'Great person here' };
    const onCompleted = vi.fn();
    render(<TaskerCompletionFlow task={task()} onCompleted={onCompleted} />);
    const box = await screen.findByTestId('completion-code-input');
    fireEvent.change(box, { target: { value: '999999' } });
    fireEvent.click(screen.getByRole('button', { name: /Complete task/ }));
    await waitFor(() => expect(toastCalls.some(([k, m]) => k === 'error' && /Invalid/.test(m))).toBe(true));
    expect(onCompleted).not.toHaveBeenCalled();
    fireEvent.change(box, { target: { value: '123456' } });
    const btn = screen.getByRole('button', { name: /Complete task/ });
    fireEvent.click(btn); fireEvent.click(btn);
    await waitFor(() => expect(onCompleted).toHaveBeenCalledTimes(1));
    expect(calls.complete).toBe(2); // one wrong + one right
  });

  it('completed task shows the finished panel and no code box', async () => {
    S.proofs = [{ id: 'p1', file_name: 'a.png', url: 'u' }];
    S.review = { rating: 5, comment: 'Great person here' };
    render(<TaskerCompletionFlow task={task('completed')} balance={100} />);
    expect(await screen.findByTestId('task-completed-panel')).toHaveTextContent('₦100');
    expect(screen.queryByTestId('completion-code-input')).toBeNull();
  });
});

describe('Advance panel inside the task', () => {
  it('tasker: request double-click sends once, then shows "Waiting for approval"', async () => {
    render(<TaskAdvancePanel task={task()} role="tasker" />);
    fireEvent.change(await screen.findByLabelText('Advance amount'), { target: { value: '100' } });
    const btn = screen.getByRole('button', { name: /Send request/ });
    fireEvent.click(btn); fireEvent.click(btn);
    expect(await screen.findByTestId('advance-pending')).toBeInTheDocument();
    expect(calls.request).toBe(1);
  });

  it('tasker: cannot ask for more than 50% of escrow', async () => {
    render(<TaskAdvancePanel task={task()} role="tasker" />);
    fireEvent.change(await screen.findByLabelText('Advance amount'), { target: { value: '150' } });
    fireEvent.click(screen.getByRole('button', { name: /Send request/ }));
    expect(calls.request).toBeUndefined();
    expect(toastCalls.some(([k, m]) => k === 'error' && /at most ₦100/.test(m))).toBe(true);
  });

  it('requester: approves an adjusted amount once and the balance updates', async () => {
    S.escrow = esc({ funded: 400, remaining: 400, advance_available: 200 });
    S.advances = [{ id: 'a1', status: 'pending', requested_amount: 150, note: 'Paint' }];
    render(<TaskAdvancePanel task={task()} role="requester" />);
    fireEvent.click(await screen.findByRole('button', { name: /Approve/ }));
    fireEvent.change(screen.getByLabelText('Amount to approve'), { target: { value: '200' } });
    fireEvent.click(screen.getByRole('button', { name: /Approve ₦200/ }));
    expect(calls.respond).toBeUndefined(); // more than requested
    fireEvent.change(screen.getByLabelText('Amount to approve'), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: /Approve ₦50/ }));
    expect(calls.respond).toBeUndefined(); // below the ₦100 minimum
    fireEvent.change(screen.getByLabelText('Amount to approve'), { target: { value: '120' } });
    expect(screen.getByText('₦280')).toBeInTheDocument(); // preview of balance after approval
    const btn = screen.getByRole('button', { name: /Approve ₦120/ });
    fireEvent.click(btn); fireEvent.click(btn);
    expect(await screen.findByTestId('advance-approved')).toBeInTheDocument();
    expect(calls.respond).toBe(1);
    expect(S.lastRespond).toMatchObject({ decision: 'approved', approved_amount: 120 });
  });

  it('tasker: approved advance withdraws once and flips to "Sent to bank"', async () => {
    S.advances = [{ id: 'a1', status: 'approved', requested_amount: 100, approved_amount: 100 }];
    S.escrow = esc({ advance_approved: 100, remaining: 100, advance_available: 0 });
    render(<TaskAdvancePanel task={task()} role="tasker" />);
    const btn = await screen.findByRole('button', { name: /Withdraw ₦100 to my bank/ });
    fireEvent.click(btn); fireEvent.click(btn);
    expect(await screen.findByTestId('advance-withdrawn')).toBeInTheDocument();
    expect(calls.withdraw).toBe(1);
  });

  it('completed task: approved-but-unused advance has no withdraw button', async () => {
    S.advances = [{ id: 'a1', status: 'approved', requested_amount: 100, approved_amount: 100 }];
    S.escrow = esc({ task_status: 'completed', advance_approved: 100, remaining: 200, advance_available: 0, payout_status: 'available' });
    render(<TaskAdvancePanel task={task('completed')} role="tasker" />);
    expect(await screen.findByText(/part of your final balance/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Withdraw/ })).toBeNull();
  });
});

describe('Requester view of tasker progress', () => {
  it('shows steps done and the proof files', async () => {
    S.proofs = [{ id: 'p1', file_name: 'wall.png', mime_type: 'image/png', url: 'https://x/wall.png' }];
    S.theirs = true;
    render(<TaskProgressForRequester task={task()} />);
    expect(await screen.findByText('2/3 steps done')).toBeInTheDocument();
    expect(screen.getByText('wall.png').closest('a')).toHaveAttribute('href', 'https://x/wall.png');
  });
});
