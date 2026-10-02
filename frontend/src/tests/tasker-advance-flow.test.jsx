import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// ── toast spy ──
const toastCalls = [];
vi.mock('react-hot-toast', () => {
  const t = vi.fn((m) => toastCalls.push(['info', m]));
  t.success = vi.fn((m) => toastCalls.push(['success', m]));
  t.error = vi.fn((m) => toastCalls.push(['error', m]));
  return { default: t, toast: t, Toaster: () => null };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'T', full_name: 'Tunde Tasker', role: 'tasker', email: 't@t.ng' },
    profile: {}, isApprovedTasker: true, isPendingTasker: false,
    logout: vi.fn(), refreshProfile: vi.fn(),
  }),
}));
vi.mock('../context/SocketContext', () => ({ useSocket: () => ({ socket: null, isOnline: () => false, joinRoom: vi.fn(), leaveRoom: vi.fn(), sendTyping: vi.fn() }) }));

// ── API mock: scenario state is mutated per test ──
const S = {};
const slow = (v) => new Promise(r => setTimeout(() => r(v), 40));
const calls = { requestWithdrawal: 0, requestAdvance: 0, complete: 0, myTaskerTasks: 0, withdrawAdvance: 0 };
vi.mock('../utils/api', () => {
  const any = () => new Proxy({}, { get: () => () => Promise.resolve({ data: {} }) });
  const paymentsApi = {
    history: () => Promise.resolve({ data: { payments: S.payments } }),
    refunds: () => Promise.resolve({ data: { refunds: [] } }),
    escrow: () => Promise.resolve({ data: { escrow: S.escrow, summary: S.summary } }),
    getMyAdvanceRequests: () => Promise.resolve({ data: { advances: S.advances } }),
    requestWithdrawal: () => { calls.requestWithdrawal++; return slow({ status: 200, data: { message: '₦80 is on its way to GTBank' } }); },
    requestAdvance: (d) => { calls.requestAdvance++; return slow({ status: 201, data: { message: 'Advance request sent.', advance: { id: 'new', task_id: d.task_id, status: 'pending', requested_amount: d.requested_amount } } }); },
    withdrawAdvance: () => { calls.withdrawAdvance++; return slow({ status: 200, data: { message: '₦100 is on its way' } }); },
  };
  const tasksApi = new Proxy({
    myTaskerTasks: () => { calls.myTaskerTasks++; return Promise.resolve({ data: { tasks: S.tasks } }); },
    myCancelRequests: () => Promise.resolve({ data: { requests: [] } }),
    complete: () => { calls.complete++; S.tasks = S.tasks.map(t => ({ ...t, status: 'completed' })); return slow({ data: { status: 'completed', message: 'Task completed!' } }); },
    get: (id) => Promise.resolve({ data: { task: S.tasks.find(t => t.id === id) } }),
  }, { get: (o, k) => o[k] || (() => Promise.resolve({ data: {} })) });
  const taskersApi = new Proxy({
    dashboard: () => Promise.resolve({ data: { profile: { bank_account_number: '0123456789', bank_name: 'GTBank', is_available: true }, pending_bids: [], active_tasks: S.tasks } }),
  }, { get: (o, k) => o[k] || (() => Promise.resolve({ data: {} })) });
  const chatApi = new Proxy({ getRooms: () => Promise.resolve({ data: { rooms: [] } }) }, { get: (o, k) => o[k] || (() => Promise.resolve({ data: {} })) });
  return { default: any(), reviewsApi: any(), paymentsApi, tasksApi, taskersApi, chatApi, enterpriseApi: any(), authApi: any(), referralsApi: any(), vooomApi: any(), settingsApi: any(), marketingApi: any() };
});

import TaskerDashboard from '../pages/TaskerDashboard';

const task = (status) => ({ id: 'T1', title: 'Paint fence', status, is_funded: true, funded_amount: 200, task_city: 'Lagos', task_state: 'Lagos', deadline: '2026-10-10' });
const row = (over) => ({ task_id: 'T1', title: 'Paint fence', funded: 200, advance_withdrawn: 100, advance_approved: 0, advance_pending: 0, advance_available: 0, remaining: 100, platform_fee: 20, net_payout: 80, ...over });

function mount(tab) {
  window.history.pushState({}, '', `/tasker?tab=${tab}`);
  return render(<HelmetProvider><MemoryRouter><TaskerDashboard /></MemoryRouter></HelmetProvider>);
}

beforeEach(() => {
  toastCalls.length = 0;
  Object.keys(calls).forEach(k => { calls[k] = 0; });
});

describe('Tasker — ₦200 escrow, ₦100 advance', () => {
  it('while ONGOING: balance shows ₦100 and the withdraw button is locked', async () => {
    S.tasks = [task('ongoing')];
    S.payments = [{ id: 'p1', task_id: 'T1', amount: 200, status: 'completed', payment_type: 'workmanship', task: { title: 'Paint fence', status: 'ongoing' } }];
    S.escrow = [row({ task_status: 'ongoing', payout_status: 'locked' })];
    S.summary = { available_gross: 0, platform_fee: 0, available_net: 0 };
    S.advances = [{ id: 'a1', task_id: 'T1', status: 'withdrawn', requested_amount: 100, approved_amount: 100, task: { title: 'Paint fence', status: 'ongoing' } }];
    mount('payments');

    expect(await screen.findByText(/Escrow ₦200/)).toBeInTheDocument();
    expect(screen.getByText(/Balance ₦100/)).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /Withdraw Earnings/ });
    expect(btn).toBeDisabled();
    expect(screen.getByText(/Locked until task is completed/)).toBeInTheDocument();
    fireEvent.click(btn);
    expect(calls.requestWithdrawal).toBe(0);
  });

  it('after COMPLETION: shows ₦100 balance, withdraw ₦80, double-click sends once', async () => {
    S.tasks = [task('completed')];
    S.payments = [{ id: 'p1', task_id: 'T1', amount: 200, status: 'completed', payment_type: 'workmanship', task: { title: 'Paint fence', status: 'completed' } }];
    S.escrow = [row({ task_status: 'completed', payout_status: 'available' })];
    S.summary = { available_gross: 100, platform_fee: 20, available_net: 80 };
    S.advances = [];
    mount('earnings'); // old link name must still open Earnings

    const btn = await screen.findByRole('button', { name: /Withdraw ₦80/ });
    expect(screen.getByText('₦100')).toBeInTheDocument();                // available (escrow − advance)
    expect(screen.getByText(/Advance already paid: −₦100/)).toBeInTheDocument();
    expect(screen.getByText(/You receive: ₦80/)).toBeInTheDocument();
    fireEvent.click(btn); fireEvent.click(btn); fireEvent.click(btn);
    await waitFor(() => expect(toastCalls.some(([k, m]) => k === 'success' && /on its way/.test(m))).toBe(true));
    expect(calls.requestWithdrawal).toBe(1);
    expect(toastCalls.filter(([k]) => k === 'error')).toHaveLength(0);
  });

});


