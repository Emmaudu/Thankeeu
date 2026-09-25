import { describe, it, expect } from 'vitest';
import { zonedToUTC, utcToZoned, getCountry, COUNTRY_OPTIONS } from '../utils/timezones';
import { splitHeroTitle, resolveHero, DEFAULT_HERO } from '../utils/heroDefaults';

describe('recipient time zone → UTC', () => {
  it('09:00 in Lagos is 08:00 UTC; in Nairobi 06:00 UTC', () => {
    expect(zonedToUTC('2026-10-03', '09:00', 'Africa/Lagos')).toEqual({ send_date: '2026-10-03', send_time: '08:00:00' });
    expect(zonedToUTC('2026-10-03', '09:00', 'Africa/Nairobi')).toEqual({ send_date: '2026-10-03', send_time: '06:00:00' });
  });
  it('follows daylight saving (New York summer vs winter)', () => {
    expect(zonedToUTC('2026-07-01', '09:00', 'America/New_York').send_time).toBe('13:00:00');
    expect(zonedToUTC('2026-12-01', '09:00', 'America/New_York').send_time).toBe('14:00:00');
  });
  it('crosses the date line correctly', () => {
    expect(zonedToUTC('2026-10-03', '00:30', 'Asia/Kolkata')).toEqual({ send_date: '2026-10-02', send_time: '19:00:00' });
  });
  it('round-trips for editing', () => {
    for (const tz of ['Africa/Lagos', 'Europe/London', 'Australia/Sydney', 'America/Los_Angeles']) {
      const { send_date, send_time } = zonedToUTC('2026-11-20', '18:45', tz);
      expect(utcToZoned(`${send_date}T${send_time}Z`, tz)).toEqual({ date: '2026-11-20', time: '18:45' });
    }
  });
  it('leaves an empty date alone', () => {
    expect(zonedToUTC('', '09:00', 'Africa/Lagos')).toEqual({ send_date: '', send_time: '09:00' });
  });
  it('every country zone is a real IANA zone', () => {
    for (const c of COUNTRY_OPTIONS) for (const z of c.zones) {
      expect(() => new Intl.DateTimeFormat('en', { timeZone: z.tz })).not.toThrow();
    }
    expect(getCountry('NG').zones[0].tz).toBe('Africa/Lagos');
  });
});

describe('hero title helpers', () => {
  it('splits around {word}', () => {
    expect(splitHeroTitle('Send a {word} card today')).toEqual({ before: 'Send a', after: 'card today', hasWord: true });
    expect(splitHeroTitle('No token here').hasWord).toBe(false);
  });
  it('empty overrides fall back to defaults', () => {
    expect(resolveHero({ title: '  ', subtitle: null })).toEqual(DEFAULT_HERO);
  });
});
