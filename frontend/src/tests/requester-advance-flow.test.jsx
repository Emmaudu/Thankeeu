import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

const toastCalls = [];
vi.mock('react-hot-toast', () => {
  const t = vi.fn((m) => toastCalls.push(['info', m]));
  t.success = vi.fn((m) => toastCalls.push(['success', m]));
  t.error = vi.fn((m) => toastCalls.push(['error', m]));
  return { default: t, toast: t, Toaster: () => null };
});
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'R', full_name: 'Rita Requester', role: 'requester' }, profile: {}, logout: vi.fn(), refreshProfile: vi.fn() }),
}));
vi.mock('../context/SocketContext', () => ({ useSocket: () => ({ socket: null, isOnline: () => false, joinRoom: vi.fn(), leaveRoom: vi.fn(), sendTyping: vi.fn() }) }));

const S = {};
const calls = { respondAdvance: [], generateCode: 0 };
const slow = (v) => new Promise(r => setTimeout(() => r(v), 40));

vi.mock('../utils/api', () => {
  const fallback = { get: (o, k) => o[k] || (() => Promise.resolve({ data: {} })) };
  const any = () => new Proxy({}, { get: () => () => Promise.resolve({ data: {} }) });
  const paymentsApi = new Proxy({
    history: () => Promise.resolve({ data: { payments: [] } }),
    refunds: () => Promise.resolve({ data: { refunds: [] } }),
    escrow: () => Promise.resolve({ data: { escrow: S.escrow } }),
    getPendingAdvances: () => Promise.resolve({ data: { advances: S.pending } }),
    getAdvanceForTask: () => Promise.resolve({ data: { escrow: S.escrow[0] } }),
    respondAdvance: (id, body) => { calls.respondAdvance.push(body); S.pending = []; return slow({ data: { message: 'Advance of ₦100 approved. ₦100 remains in escrow until the task is completed.' } }); },
  }, fallback);
  const tasksApi = new Proxy({
    myRequesterTasks: () => Promise.resolve({ data: { tasks: S.tasks } }),
    get: () => Promise.resolve({ data: { task: S.tasks[0] } }),
    generateCode: () => { calls.generateCode++; return slow({ data: { code: '482913' } }); },
  }, fallback);
  const chatApi = new Proxy({ getRooms: () => Promise.resolve({ data: { rooms: [] } }) }, fallback);
  return { default: any(), reviewsApi: { forTask: () => Promise.resolve({ data: { my_review: S.reviewed ? { rating: 5, comment: 'Excellent work, thank you' } : null, my_platform_feedback: S.reviewed ? { rating: 5 } : null } }), pending: () => Promise.resolve({ data: { pending: [] } }), submit: () => Promise.resolve({ data: {} }) }, paymentsApi, tasksApi, chatApi, authApi: any(), taskersApi: any(), vooomApi: any(), referralsApi: any(), settingsApi: any(), marketingApi: any() };
});

import RequesterDashboard from '../pages/RequesterDashboard';
const mount = (tab) => { window.history.pushState({}, '', `/requester?tab=${tab}`); return render(<HelmetProvider><MemoryRouter><RequesterDashboard /></MemoryRouter></HelmetProvider>); };

beforeEach(() => {
  toastCalls.length = 0; calls.respondAdvance = []; calls.generateCode = 0;
  S.tasks = [{ id: 'T1', title: 'Paint fence', status: 'ongoing', is_funded: true, accepted_tasker_id: 'TK', accepted_tasker: { id: 'TK', username: 'tunde' }, funded_amount: 200, task_city: 'Lagos', task_state: 'Lagos', deadline: '2026-10-10' }];
  S.escrow = [{ task_id: 'T1', title: 'Paint fence', task_status: 'ongoing', funded: 200, advance_withdrawn: 0, advance_approved: 0, advance_pending: 100, advance_available: 100, remaining: 200, payout_status: 'locked' }];
  S.pending = [{ id: 'A1', task_id: 'T1', status: 'pending', requested_amount: 100, note: 'paint', task: { id: 'T1', title: 'Paint fence', funded_amount: 200, status: 'ongoing' }, tasker: { full_name: 'Tunde Tasker' }, escrow: S.escrow[0] }];
});

describe('Requester — ₦200 escrow, ₦100 advance request', () => {
  it('task detail shows Paid ₦200 · Advance −₦100 · Balance ₦100 after approval', async () => {
    S.escrow = [{ ...S.escrow[0], advance_pending: 0, advance_withdrawn: 100, advance_available: 0, remaining: 100 }];
    S.pending = [];
    mount('tasks');
    fireEvent.click((await screen.findAllByRole('button', { name: /View|Details/ }))[0]);
    expect(await screen.findByText(/Paid ₦200 · Advance −₦100 · Balance ₦100/)).toBeInTheDocument();
  });

  it('completion code is locked until the requester rates the tasker and Taskeeu', async () => {
    S.pending = []; S.reviewed = false;
    mount('tasks');
    fireEvent.click((await screen.findAllByRole('button', { name: /View|Details|Rate & release/ }))[0]);
    expect(await screen.findByText(/Step 1 · Rate your experience/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Show my completion code/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Get completion code/ })).toBeDisabled();
    expect(calls.generateCode).toBe(0);
  });

  it('after reviewing: double-click fetches the code once and shows it', async () => {
    S.pending = []; S.reviewed = true;
    mount('tasks');
    fireEvent.click((await screen.findAllByRole('button', { name: /View|Details|Rate & release/ }))[0]);
    const btn = await screen.findByRole('button', { name: /Show my completion code/ });
    fireEvent.click(btn); fireEvent.click(btn);
    expect(await screen.findByText('482913')).toBeInTheDocument();
    expect(calls.generateCode).toBe(1);
  });
});
