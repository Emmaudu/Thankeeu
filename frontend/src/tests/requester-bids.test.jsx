import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

const toastCalls = [];
vi.mock('react-hot-toast', () => {
  const t = vi.fn((m) => toastCalls.push(['info', m]));
  t.success = vi.fn((m) => toastCalls.push(['success', m]));
  t.error = vi.fn((m) => toastCalls.push(['error', m]));
  return { default: t, toast: t, Toaster: () => null };
});
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'R', full_name: 'Rita Requester', role: 'requester' }, profile: {}, logout: vi.fn(), refreshProfile: vi.fn() }) }));
vi.mock('../context/SocketContext', () => ({ useSocket: () => ({ socket: null, isOnline: () => false, joinRoom: vi.fn(), leaveRoom: vi.fn(), sendTyping: vi.fn() }) }));

const S = {};
const calls = { accept: [], reject: [], chat: [], getRooms: 0 };
const slow = (v) => new Promise(r => setTimeout(() => r(v), 30));
vi.mock('../utils/api', () => {
  const fallback = { get: (o, k) => o[k] || (() => Promise.resolve({ data: {} })) };
  const any = () => new Proxy({}, fallback);
  const tasksApi = new Proxy({
    myRequesterTasks: () => Promise.resolve({ data: { tasks: [S.task] } }),
    get: () => Promise.resolve({ data: { task: S.task } }),
    acceptBid: (t, b) => { calls.accept.push(b); S.task = { ...S.task, status: 'ongoing', accepted_tasker_id: S.task.bids.find(x => x.id === b).tasker.id }; return slow({ data: { message: 'Tasker chosen!' } }); },
    rejectBid: (t, b) => { calls.reject.push(b); return slow({ data: { message: 'Bid declined' } }); },
    chatWithBidder: (t, b) => { calls.chat.push(b); return slow({ data: { chat_room_id: 'room-' + b, message: 'Chat opened.' } }); },
  }, fallback);
  const chatApi = new Proxy({ getRooms: () => { calls.getRooms++; return Promise.resolve({ data: { rooms: [
    { id: 'room-b1', task_id: 'T', tasker_id: 'u1', tasker: { full_name: 'Tunde Tasker' }, requester: {}, task: { title: 'Carry sofa' } },
    { id: 'room-b2', task_id: 'T', tasker_id: 'u2', tasker: { full_name: 'Sam Stranger' }, requester: {}, task: { title: 'Carry sofa' } },
  ] } }); } }, fallback);
  const paymentsApi = new Proxy({
    history: () => Promise.resolve({ data: { payments: [] } }), refunds: () => Promise.resolve({ data: { refunds: [] } }),
    escrow: () => Promise.resolve({ data: { escrow: [] } }), getPendingAdvances: () => Promise.resolve({ data: { advances: [] } }),
    getAdvanceForTask: () => Promise.resolve({ data: {} }),
  }, fallback);
  return { default: any(), reviewsApi: any(), tasksApi, chatApi, paymentsApi, authApi: any(), taskersApi: any(), vooomApi: any(), referralsApi: any(), settingsApi: any(), marketingApi: any() };
});

import RequesterDashboard from '../pages/RequesterDashboard';

const bid = (id, uid, name, price, status = 'pending') => ({ id, status, workmanship_price: price, message: `${name} can do it`, tasker: { id: uid, full_name: name, profile: {} } });
const base = (over = {}) => ({ id: 'T', title: 'Carry sofa', description: 'Carry a sofa upstairs', status: 'bidding', is_funded: false, accepted_tasker_id: null,
  task_city: 'Lagos', task_state: 'Lagos', deadline: '2026-10-10', bids: [bid('b1', 'u1', 'Tunde Tasker', 5000), bid('b2', 'u2', 'Sam Stranger', 4500)], ...over });

async function openTask() {
  window.history.pushState({}, '', '/requester?tab=tasks');
  render(<HelmetProvider><MemoryRouter><RequesterDashboard /></MemoryRouter></HelmetProvider>);
  fireEvent.click((await screen.findAllByRole('button', { name: /View|Details/ }))[0]);
  await screen.findByText('Tunde Tasker');
}
const cardOf = (name) => screen.getByText(name).closest('div.card, .card') || screen.getByText(name).parentElement.parentElement.parentElement.parentElement;

beforeEach(() => { toastCalls.length = 0; calls.accept = []; calls.reject = []; calls.chat = []; calls.getRooms = 0; });

describe('Requester can talk to several taskers', () => {
  it('before choosing: every bidder has Chat + Choose + Decline', async () => {
    S.task = base();
    await openTask();
    expect(screen.getAllByRole('button', { name: /^Chat$/ })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Choose this tasker' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Decline' })).toHaveLength(2);
  });

  it('Chat opens that tasker\'s own conversation without choosing them', async () => {
    S.task = base();
    await openTask();
    fireEvent.click(screen.getAllByRole('button', { name: /^Chat$/ })[1]);        // Sam
    await waitFor(() => expect(calls.chat).toEqual(['b2']));
    await waitFor(() => expect(calls.getRooms).toBeGreaterThan(1));             // rooms reloaded
    expect(calls.accept).toHaveLength(0);
  });

  it('after choosing one: the other can still be chatted with, and "Switch to this tasker" appears', async () => {
    S.task = base({ status: 'ongoing', accepted_tasker_id: 'u1', bids: [bid('b1', 'u1', 'Tunde Tasker', 5000, 'accepted'), bid('b2', 'u2', 'Sam Stranger', 4500)] });
    await openTask();
    expect(screen.getByText('✓ Chosen tasker')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Chat$/ })).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Pay ₦5,000/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove tasker' })).toBeInTheDocument();
    const sw = screen.getByRole('button', { name: 'Switch to this tasker' });
    fireEvent.click(sw); fireEvent.click(sw);                                    // double click
    await waitFor(() => expect(toastCalls.some(([k]) => k === 'success')).toBe(true));
    expect(calls.accept).toEqual(['b2']);
  });

  it('after payment: tasker is locked — no Switch, no Remove, chat still allowed', async () => {
    S.task = base({ status: 'ongoing', is_funded: true, accepted_tasker_id: 'u1', bids: [bid('b1', 'u1', 'Tunde Tasker', 5000, 'accepted'), bid('b2', 'u2', 'Sam Stranger', 4500)] });
    await openTask();
    expect(screen.queryByRole('button', { name: /Switch to this tasker|Choose this tasker/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Remove tasker|Decline/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Pay ₦/ })).toBeNull();
    expect(screen.getAllByRole('button', { name: /^Chat$/ })).toHaveLength(2);
  });

  it('declined bids show no actions', async () => {
    S.task = base({ bids: [bid('b1', 'u1', 'Tunde Tasker', 5000), bid('b2', 'u2', 'Sam Stranger', 4500, 'rejected')] });
    await openTask();
    expect(screen.getByText('declined')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Chat$/ })).toHaveLength(1);
  });
});
