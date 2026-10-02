import { describe, it, expect, beforeEach } from 'vitest';
import api, { paymentsApi } from '../utils/api';

// Replace the network with a counting adapter that answers after 50ms.
let sent;
beforeEach(() => {
  sent = [];
  api.defaults.adapter = (config) => new Promise((resolve) => {
    sent.push(`${config.method} ${config.url} ${config.data ?? ''} timeout=${config.timeout}`);
    setTimeout(() => resolve({ data: { ok: true, n: sent.length }, status: 200, statusText: 'OK', headers: {}, config }), 50);
  });
});

describe('double-submit guard', () => {
  it('two identical clicks send ONE request and both get the same success', async () => {
    const [a, b] = await Promise.all([
      paymentsApi.respondAdvance('adv1', { decision: 'approved', approved_amount: 100 }),
      paymentsApi.respondAdvance('adv1', { decision: 'approved', approved_amount: 100 }),
    ]);
    expect(sent).toHaveLength(1);
    expect(a.data).toEqual(b.data);
  });

  it('different bodies are sent separately', async () => {
    await Promise.all([
      paymentsApi.requestAdvance({ task_id: 't1', requested_amount: 100 }),
      paymentsApi.requestAdvance({ task_id: 't2', requested_amount: 100 }),
    ]);
    expect(sent).toHaveLength(2);
  });

  it('a new click after the first finished is sent normally', async () => {
    await paymentsApi.withdrawAdvance('adv1');
    await paymentsApi.withdrawAdvance('adv1');
    expect(sent).toHaveLength(2);
  });

  it('chat messages are never merged', async () => {
    await Promise.all([
      api.post('/chat/rooms/r1/messages', { text: 'ok' }),
      api.post('/chat/rooms/r1/messages', { text: 'ok' }),
    ]);
    expect(sent).toHaveLength(2);
  });

  it('file uploads are never merged', async () => {
    const f1 = new FormData(); const f2 = new FormData();
    await Promise.all([api.post('/upload', f1), api.post('/upload', f2)]);
    expect(sent).toHaveLength(2);
  });

  it('GET requests are untouched', async () => {
    await Promise.all([paymentsApi.escrow(), paymentsApi.escrow()]);
    expect(sent).toHaveLength(2);
  });

  it('money transfers get a 90s timeout instead of 30s', async () => {
    await paymentsApi.withdrawAdvance('x');
    await paymentsApi.requestWithdrawal();
    expect(sent.every(s => s.endsWith('timeout=90000'))).toBe(true);
  });
});
