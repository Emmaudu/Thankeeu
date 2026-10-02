import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

const toastCalls = [];
vi.mock('react-hot-toast', () => {
  const t = vi.fn((m) => toastCalls.push(['info', m]));
  t.success = vi.fn((m) => toastCalls.push(['success', m]));
  t.error = vi.fn((m) => toastCalls.push(['error', m]));
  return { default: t, toast: t, Toaster: () => null };
});

let authUser = { id: 'R', full_name: 'Rita Requester', role: 'requester' };
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: authUser, profile: {}, isApprovedTasker: true, isPendingTasker: false, logout: vi.fn(), refreshProfile: vi.fn() }),
}));
vi.mock('../context/SocketContext', () => ({ useSocket: () => ({ socket: null, isOnline: () => false, joinRoom: vi.fn(), leaveRoom: vi.fn(), sendTyping: vi.fn() }) }));

const S = { pending: [], submitResult: null, mine: null, forTask: null };
// The form has two star pickers: [0] the person, [1] Taskeeu (both compulsory).
const starOf = (group, n) => within(screen.getAllByRole('radiogroup')[group]).getByRole('radio', { name: new RegExp(`^${n} star`) });
const submits = [];
vi.mock('../utils/api', () => {
  const fallback = { get: (o, k) => o[k] || (() => Promise.resolve({ data: {} })) };
  const any = () => new Proxy({}, fallback);
  const reviewsApi = {
    pending: () => Promise.resolve({ data: { pending: S.pending } }),
    submit: (body) => {
      submits.push(body);
      return new Promise((resolve, reject) => setTimeout(() => {
        const r = S.submitResult?.(body);
        if (r?.reject) reject(r.reject); else resolve({ status: 201, data: { success: true, message: 'Thank you! Your review has been submitted.' } });
      }, 40));
    },
    mine: () => Promise.resolve({ data: S.mine }),
    forTask: () => Promise.resolve({ data: S.forTask }),
    forUser: () => Promise.resolve({ data: {} }),
  };
  const tasksApi = new Proxy({
    myRequesterTasks: () => Promise.resolve({ data: { tasks: [] } }),
    myTaskerTasks: () => Promise.resolve({ data: { tasks: [] } }),
    myCancelRequests: () => Promise.resolve({ data: { requests: [] } }),
  }, fallback);
  const paymentsApi = new Proxy({
    history: () => Promise.resolve({ data: { payments: [] } }),
    refunds: () => Promise.resolve({ data: { refunds: [] } }),
    escrow: () => Promise.resolve({ data: { escrow: [], summary: { available_gross: 0, platform_fee: 0, available_net: 0 } } }),
    getPendingAdvances: () => Promise.resolve({ data: { advances: [] } }),
    getMyAdvanceRequests: () => Promise.resolve({ data: { advances: [] } }),
  }, fallback);
  const taskersApi = new Proxy({ dashboard: () => Promise.resolve({ data: { profile: {}, pending_bids: [], active_tasks: [] } }) }, fallback);
  const chatApi = new Proxy({ getRooms: () => Promise.resolve({ data: { rooms: [] } }) }, fallback);
  return { default: any(), reviewsApi, tasksApi, paymentsApi, taskersApi, chatApi, authApi: any(), enterpriseApi: any(), vooomApi: any(), referralsApi: any(), settingsApi: any(), marketingApi: any() };
});

import { ReviewGate, ReviewsReceived, TaskReviews } from '../components/ui/Reviews';
import RequesterDashboard from '../pages/RequesterDashboard';
import TaskerDashboard from '../pages/TaskerDashboard';

const item = (id, title, you_review, name) => ({ task_id: id, title, you_review, completed_at: '2026-09-28T10:00:00Z', counterpart: { id: 'x', name, avatar_url: null } });
const GOOD = 'Arrived on time and did very neat work.';

beforeEach(() => {
  toastCalls.length = 0; submits.length = 0;
  S.pending = []; S.submitResult = null; S.mine = null; S.forTask = null;
});

describe('Compulsory review form', () => {
  it('opens for an owed review, cannot be dismissed, and only submits when valid', async () => {
    S.pending = [item('T1', 'Paint fence', 'tasker', 'Tunde Tasker')];
    render(<ReviewGate />);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/How was working with Tunde Tasker\?/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /close|not now|cancel|skip/i })).toBeNull();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const submit = screen.getByRole('button', { name: /Submit review/ });
    expect(submit).toBeDisabled();                                   // nothing chosen
    fireEvent.click(starOf(0, 4));
    expect(screen.getByText('Very good')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Your comment/), { target: { value: 'Too short' } });
    expect(submit).toBeDisabled();                                   // 9 chars
    expect(screen.getByText(/1 more/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Your comment/), { target: { value: GOOD } });
    expect(submit).toBeDisabled();                                   // Taskeeu not rated yet
    fireEvent.click(starOf(1, 5));
    expect(submit).toBeEnabled();
  });

  it('double-click submits once, then closes with a success message', async () => {
    S.pending = [item('T1', 'Paint fence', 'tasker', 'Tunde Tasker')];
    render(<ReviewGate />);
    await screen.findByRole('dialog');
    fireEvent.click(starOf(0, 5));
    fireEvent.click(starOf(1, 4));
    fireEvent.change(screen.getByLabelText(/Your comment/), { target: { value: GOOD } });
    const submit = screen.getByRole('button', { name: /Submit review/ });
    fireEvent.click(submit); fireEvent.click(submit); fireEvent.click(submit);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(submits).toEqual([{ task_id: 'T1', rating: 5, comment: GOOD, platform_rating: 4, platform_comment: undefined }]);
    expect(toastCalls.some(([k, m]) => k === 'success' && /submitted/.test(m))).toBe(true);
  });

  it('several owed reviews are shown one after another', async () => {
    S.pending = [item('T1', 'Paint fence', 'tasker', 'Tunde'), item('T2', 'Fix gate', 'tasker', 'Bola')];
    render(<ReviewGate />);
    expect(await screen.findByText('Review 1 of 2')).toBeInTheDocument();
    fireEvent.click(starOf(0, 3));
    fireEvent.click(starOf(1, 5));
    fireEvent.change(screen.getByLabelText(/Your comment/), { target: { value: GOOD } });
    fireEvent.click(screen.getByRole('button', { name: /Submit review/ }));
    expect(await screen.findByText('Review 2 of 2')).toBeInTheDocument();
    expect(screen.getByText(/How was working with Bola\?/)).toBeInTheDocument();
    // form was reset for the next task
    expect(screen.getByRole('button', { name: /Submit review/ })).toBeDisabled();
    expect(screen.getByLabelText(/Your comment/)).toHaveValue('');
  });

  it('shows the server error inside the form and stays open', async () => {
    S.pending = [item('T1', 'Paint fence', 'tasker', 'Tunde')];
    S.submitResult = () => ({ reject: { response: { status: 400, data: { message: 'Please write a short comment (at least 10 characters).' } } } });
    render(<ReviewGate />);
    await screen.findByRole('dialog');
    fireEvent.click(starOf(0, 2));
    fireEvent.click(starOf(1, 3));
    fireEvent.change(screen.getByLabelText(/Your comment/), { target: { value: GOOD } });
    fireEvent.click(screen.getByRole('button', { name: /Submit review/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/at least 10 characters/);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('opens when the server blocks an action (REVIEW_REQUIRED)', async () => {
    render(<ReviewGate />);
    await act(async () => {});
    expect(screen.queryByRole('dialog')).toBeNull();
    act(() => { window.dispatchEvent(new CustomEvent('review-required', { detail: [item('T9', 'Move boxes', 'requester', 'Rita R.')] })); });
    expect(await screen.findByText(/How was working with Rita R\.\?/)).toBeInTheDocument();
    expect(screen.getByText(/Rate your requester/)).toBeInTheDocument();
  });

  it('a voluntary review of an old task can be closed with "Not now"', async () => {
    render(<ReviewGate />);
    await act(async () => {});
    act(() => { window.dispatchEvent(new CustomEvent('review-open', { detail: item('OLD', 'Old job', 'tasker', 'Ade') })); });
    fireEvent.click(await screen.findByRole('button', { name: /Not now/ }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});

describe('Review displays', () => {
  it('"reviews I received" shows average, count, breakdown and comments', async () => {
    S.mine = { as: 'requester', average: 4.5, count: 2, distribution: [{ star: 5, count: 1 }, { star: 4, count: 1 }, { star: 3, count: 0 }, { star: 2, count: 0 }, { star: 1, count: 0 }],
      reviews: [{ id: 'a', rating: 5, comment: 'Paid promptly, clear brief.', created_at: '2026-09-20T10:00:00Z', task_title: 'Paint fence', reviewer: { name: 'Tunde T.' } }] };
    render(<ReviewsReceived as="requester" />);
    expect(await screen.findByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('Reviews from taskers')).toBeInTheDocument();
    expect(screen.getByText('2 reviews')).toBeInTheDocument();
    expect(screen.getByText('Paid promptly, clear brief.')).toBeInTheDocument();
    expect(screen.getByText('Tunde T.')).toBeInTheDocument();
  });

  it('task page hides the other review until you write yours', async () => {
    S.forTask = { task_status: 'completed', my_review: null, their_review: null, their_review_submitted: true };
    render(<TaskReviews taskId="T1" taskTitle="Paint fence" otherLabel="Tasker" otherName="@tunde" />);
    expect(await screen.findByText(/Submitted — visible after you write yours/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Write your review/ })).toBeInTheDocument();
  });
});

describe('Mounted in both dashboards', () => {
  const mount = (C, path) => { window.history.pushState({}, '', path); return render(<HelmetProvider><MemoryRouter><C /></MemoryRouter></HelmetProvider>); };

  it('requester dashboard asks the requester to review the tasker', async () => {
    authUser = { id: 'R', full_name: 'Rita Requester', role: 'requester' };
    S.pending = [item('T1', 'Paint fence', 'tasker', 'Tunde Tasker')];
    mount(RequesterDashboard, '/requester');
    expect(await screen.findByText(/How was working with Tunde Tasker\?/)).toBeInTheDocument();
    expect(screen.getByText(/Rate your tasker/)).toBeInTheDocument();
  });

  it('tasker dashboard asks the tasker to review the requester', async () => {
    authUser = { id: 'T', full_name: 'Tunde Tasker', role: 'tasker', email: 't@t.ng' };
    S.pending = [item('T1', 'Paint fence', 'requester', 'Rita Requester')];
    mount(TaskerDashboard, '/tasker');
    expect(await screen.findByText(/How was working with Rita Requester\?/)).toBeInTheDocument();
    expect(screen.getByText(/Rate your requester/)).toBeInTheDocument();
  });

  it('profile tabs show the reviews each side received', async () => {
    authUser = { id: 'T', full_name: 'Tunde Tasker', role: 'tasker', email: 't@t.ng' };
    S.mine = { as: 'tasker', average: 4, count: 1, distribution: [5, 4, 3, 2, 1].map(star => ({ star, count: star === 4 ? 1 : 0 })),
      reviews: [{ id: 'b', rating: 4, comment: 'Neat and quick work, thanks!', created_at: '2026-09-21T10:00:00Z', task_title: 'Paint fence', reviewer: { name: 'Rita R.' } }] };
    mount(TaskerDashboard, '/tasker?tab=profile');
    expect(await screen.findByText('Reviews from requesters')).toBeInTheDocument();
    expect(await screen.findByText('Neat and quick work, thanks!')).toBeInTheDocument();
  });
});
