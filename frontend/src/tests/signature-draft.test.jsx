import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSignatureDraft, readSavedSignature, checkSavedSignature } from '../utils/signatureDraft';
import { KeepPageOpenNote } from '../components/SigningSafety';
import { render, screen } from '@testing-library/react';

const respond = (status) => Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, status }) });

describe('signature drafts', () => {
  beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); global.fetch = vi.fn(() => respond('draft')); });
  afterEach(() => { vi.useRealTimers(); });

  it('keeps text locally at once and saves to the server after a pause', async () => {
    const draft = { author_name: 'Bola', author_email: 'b@x.com', content: 'Happy birthday' };
    renderHook(() => useSignatureDraft('bday', draft, true));
    expect(readSavedSignature('bday').content).toBe('Happy birthday');
    expect(fetch).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(3100); });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toMatch(/\/messages\/bday\/draft$/);
    const body = JSON.parse(opts.body);
    expect(body.draft_key).toMatch(/^[a-f0-9]{32}$/);
    expect(body.content).toBe('Happy birthday');
  });

  it('saves nothing for empty text or when disabled', async () => {
    renderHook(() => useSignatureDraft('bday', { content: '  ' }, true));
    renderHook(() => useSignatureDraft('bday2', { content: 'hi' }, false));
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(fetch).not.toHaveBeenCalled();
    expect(readSavedSignature('bday2')).toBeNull();
  });

  it('after submit, the same text is not saved again and the key changes', async () => {
    const draft = { content: 'Done' };
    const { result, rerender } = renderHook(({ d }) => useSignatureDraft('bday', d, true), { initialProps: { d: draft } });
    const firstKey = result.current.draftKey();
    act(() => { result.current.markSubmitted('Done'); });
    rerender({ d: { content: 'Done' } });
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(fetch).not.toHaveBeenCalled();
    expect(readSavedSignature('bday')).toBeNull();
    expect(result.current.draftKey()).not.toBe(firstKey);
    rerender({ d: { content: 'A second message' } });
    await act(async () => { vi.advanceTimersByTime(3100); });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('a closed key is replaced and the text saved again under a new one', async () => {
    fetch.mockImplementationOnce(() => respond('posted')).mockImplementationOnce(() => respond('draft'));
    const { result } = renderHook(() => useSignatureDraft('bday', { content: 'New text' }, true));
    const k1 = result.current.draftKey();
    await act(async () => { vi.advanceTimersByTime(3100); });
    await act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); });
    expect(fetch).toHaveBeenCalledTimes(2);
    const k2 = JSON.parse(fetch.mock.calls[1][1].body).draft_key;
    expect(k2).not.toBe(k1);
    expect(result.current.draftKey()).toBe(k2);
  });

  it('checkSavedSignature reports what the server says', async () => {
    fetch.mockImplementationOnce(() => respond('posted'));
    expect(await checkSavedSignature('bday', { key: 'a'.repeat(32), content: 'x' })).toBe('posted');
  });

  it('shows the keep-open note', () => {
    vi.useRealTimers();
    render(<KeepPageOpenNote hasMedia />);
    expect(screen.getByRole('note').textContent).toMatch(/keep this page open/i);
    expect(screen.getByRole('note').textContent).toMatch(/confirmation page/);
  });
});
