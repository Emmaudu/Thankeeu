import { describe, it, expect } from 'vitest';
import { earliestDeliveryDate, todayInZone, scheduleProblem, zonedToUTC } from '../utils/timezones';

// 10pm on 30 Sep in New York = 02:00 UTC on 1 Oct.
const NY_EVENING = Date.parse('2026-10-01T02:00:00Z');

describe('scheduled delivery — date picker and validation', () => {
  it('lets a US creator pick "today" in the evening (UTC has already rolled over)', () => {
    expect(todayInZone('America/New_York', NY_EVENING)).toBe('2026-09-30');
    expect(earliestDeliveryDate('America/New_York', NY_EVENING)).toBe('2026-09-30');
    expect(earliestDeliveryDate('America/Los_Angeles', NY_EVENING)).toBe('2026-09-30');
  });

  it('converts US wall-clock time to the right UTC instant (EDT and EST)', () => {
    expect(zonedToUTC('2026-10-05', '09:00', 'America/New_York')).toEqual({ send_date: '2026-10-05', send_time: '13:00:00' });
    expect(zonedToUTC('2026-12-05', '21:30', 'America/Los_Angeles')).toEqual({ send_date: '2026-12-06', send_time: '05:30:00' });
  });

  it('allows delivery 5 minutes from now', () => {
    const now = Date.parse('2026-10-01T02:00:00Z');
    expect(scheduleProblem({ sendDate: '2026-09-30', sendTime: '22:05', timeZone: 'America/New_York', recipientEmail: 'a@b.com' }, now)).toBeNull();
  });

  it('rejects a time already in the past', () => {
    const now = Date.parse('2026-10-01T02:00:00Z');
    expect(scheduleProblem({ sendDate: '2026-09-30', sendTime: '21:00', timeZone: 'America/New_York', recipientEmail: 'a@b.com' }, now)).toMatch(/already passed/);
  });

  it('requires a valid recipient email when a date is set, and nothing when not scheduled', () => {
    expect(scheduleProblem({ sendDate: '2027-01-01', sendTime: '09:00', timeZone: 'UTC', recipientEmail: '' }, 0)).toMatch(/email/);
    expect(scheduleProblem({ sendDate: '2027-01-01', sendTime: '09:00', timeZone: 'UTC', recipientEmail: 'bad@' }, 0)).toMatch(/look right/);
    expect(scheduleProblem({ sendDate: '', recipientEmail: '' })).toBeNull();
  });
});
