/**
 * timezones.js — recipient country → time zone, and exact wall-clock ⇄ UTC
 * conversion in ANY time zone (not just the browser's).
 *
 * The card is delivered at the time the creator types, in the RECIPIENT's
 * time zone: "09:00" for a recipient in Nairobi means 09:00 EAT, even when
 * the creator is in Lagos. send_date is still stored as UTC, so the delivery
 * engine needs no changes; delivery_timezone records which zone was used so
 * editing shows the same wall-clock time back.
 *
 * DST-safe: offsets are computed by Intl for the actual date, and the result
 * is re-checked once so a time near a DST switch lands correctly.
 */

// Countries with more than one common zone list them; the first is the default.
export const COUNTRIES = [
  { code: 'NG', name: 'Nigeria', zones: ['Africa/Lagos'] },
  { code: 'GB', name: 'United Kingdom', zones: ['Europe/London'] },
  { code: 'US', name: 'United States', zones: [
    ['America/New_York', 'Eastern (New York)'], ['America/Chicago', 'Central (Chicago)'],
    ['America/Denver', 'Mountain (Denver)'], ['America/Phoenix', 'Arizona (Phoenix)'],
    ['America/Los_Angeles', 'Pacific (Los Angeles)'], ['America/Anchorage', 'Alaska'],
    ['Pacific/Honolulu', 'Hawaii'],
  ] },
  { code: 'CA', name: 'Canada', zones: [
    ['America/Toronto', 'Eastern (Toronto)'], ['America/Winnipeg', 'Central (Winnipeg)'],
    ['America/Edmonton', 'Mountain (Edmonton)'], ['America/Vancouver', 'Pacific (Vancouver)'],
    ['America/Halifax', 'Atlantic (Halifax)'], ['America/St_Johns', 'Newfoundland'],
    ['America/Regina', 'Saskatchewan'],
  ] },
  { code: 'DE', name: 'Germany', zones: ['Europe/Berlin'] },
  { code: 'FR', name: 'France', zones: ['Europe/Paris'] },
  { code: 'NL', name: 'Netherlands', zones: ['Europe/Amsterdam'] },
  { code: 'FI', name: 'Finland', zones: ['Europe/Helsinki'] },
  { code: 'CN', name: 'China', zones: ['Asia/Shanghai'] },
  { code: 'KE', name: 'Kenya', zones: ['Africa/Nairobi'] },
  { code: 'RW', name: 'Rwanda', zones: ['Africa/Kigali'] },
  { code: 'MU', name: 'Mauritius', zones: ['Indian/Mauritius'] },
  { code: 'MY', name: 'Malaysia', zones: ['Asia/Kuala_Lumpur'] },
  { code: 'PH', name: 'Philippines', zones: ['Asia/Manila'] },
  { code: 'SA', name: 'Saudi Arabia', zones: ['Asia/Riyadh'] },
  { code: 'BD', name: 'Bangladesh', zones: ['Asia/Dhaka'] },
  { code: 'GH', name: 'Ghana', zones: ['Africa/Accra'] },
  { code: 'ZA', name: 'South Africa', zones: ['Africa/Johannesburg'] },
  { code: 'EG', name: 'Egypt', zones: ['Africa/Cairo'] },
  { code: 'UG', name: 'Uganda', zones: ['Africa/Kampala'] },
  { code: 'TZ', name: 'Tanzania', zones: ['Africa/Dar_es_Salaam'] },
  { code: 'ET', name: 'Ethiopia', zones: ['Africa/Addis_Ababa'] },
  { code: 'CM', name: 'Cameroon', zones: ['Africa/Douala'] },
  { code: 'SN', name: 'Senegal', zones: ['Africa/Dakar'] },
  { code: 'CI', name: "Côte d'Ivoire", zones: ['Africa/Abidjan'] },
  { code: 'ZM', name: 'Zambia', zones: ['Africa/Lusaka'] },
  { code: 'ZW', name: 'Zimbabwe', zones: ['Africa/Harare'] },
  { code: 'MA', name: 'Morocco', zones: ['Africa/Casablanca'] },
  { code: 'IE', name: 'Ireland', zones: ['Europe/Dublin'] },
  { code: 'ES', name: 'Spain', zones: ['Europe/Madrid'] },
  { code: 'IT', name: 'Italy', zones: ['Europe/Rome'] },
  { code: 'PT', name: 'Portugal', zones: ['Europe/Lisbon'] },
  { code: 'BE', name: 'Belgium', zones: ['Europe/Brussels'] },
  { code: 'CH', name: 'Switzerland', zones: ['Europe/Zurich'] },
  { code: 'AT', name: 'Austria', zones: ['Europe/Vienna'] },
  { code: 'SE', name: 'Sweden', zones: ['Europe/Stockholm'] },
  { code: 'NO', name: 'Norway', zones: ['Europe/Oslo'] },
  { code: 'DK', name: 'Denmark', zones: ['Europe/Copenhagen'] },
  { code: 'PL', name: 'Poland', zones: ['Europe/Warsaw'] },
  { code: 'TR', name: 'Turkey', zones: ['Europe/Istanbul'] },
  { code: 'AE', name: 'United Arab Emirates', zones: ['Asia/Dubai'] },
  { code: 'QA', name: 'Qatar', zones: ['Asia/Qatar'] },
  { code: 'IN', name: 'India', zones: ['Asia/Kolkata'] },
  { code: 'PK', name: 'Pakistan', zones: ['Asia/Karachi'] },
  { code: 'SG', name: 'Singapore', zones: ['Asia/Singapore'] },
  { code: 'ID', name: 'Indonesia', zones: [['Asia/Jakarta', 'Western (Jakarta)'], ['Asia/Makassar', 'Central (Bali)'], ['Asia/Jayapura', 'Eastern (Jayapura)']] },
  { code: 'JP', name: 'Japan', zones: ['Asia/Tokyo'] },
  { code: 'KR', name: 'South Korea', zones: ['Asia/Seoul'] },
  { code: 'HK', name: 'Hong Kong', zones: ['Asia/Hong_Kong'] },
  { code: 'AU', name: 'Australia', zones: [
    ['Australia/Sydney', 'Sydney / Melbourne'], ['Australia/Brisbane', 'Brisbane'],
    ['Australia/Adelaide', 'Adelaide'], ['Australia/Darwin', 'Darwin'], ['Australia/Perth', 'Perth'],
  ] },
  { code: 'NZ', name: 'New Zealand', zones: ['Pacific/Auckland'] },
  { code: 'BR', name: 'Brazil', zones: [['America/Sao_Paulo', 'Brasília / São Paulo'], ['America/Manaus', 'Amazon (Manaus)']] },
  { code: 'MX', name: 'Mexico', zones: [['America/Mexico_City', 'Central (Mexico City)'], ['America/Tijuana', 'Pacific (Tijuana)']] },
  { code: 'JM', name: 'Jamaica', zones: ['America/Jamaica'] },
  { code: 'TT', name: 'Trinidad and Tobago', zones: ['America/Port_of_Spain'] },
].map(c => ({
  ...c,
  zones: c.zones.map(z => (Array.isArray(z) ? { tz: z[0], label: z[1] } : { tz: z, label: null })),
}));

const BY_CODE = Object.fromEntries(COUNTRIES.map(c => [c.code, c]));
export const getCountry = (code) => BY_CODE[code] || null;

/** Countries sorted for a dropdown (Nigeria first — the home market). */
export const COUNTRY_OPTIONS = [COUNTRIES[0], ...COUNTRIES.slice(1).sort((a, b) => a.name.localeCompare(b.name))];

export const browserTimeZone = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
};

export const isValidTimeZone = (tz) => {
  if (!tz || typeof tz !== 'string') return false;
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch { return false; }
};

/** Best guess of the creator's own country from the browser's zone. */
export const guessCountryFromBrowser = () => {
  const tz = browserTimeZone();
  const hit = COUNTRIES.find(c => c.zones.some(z => z.tz === tz));
  return hit ? { country: hit.code, timezone: tz } : { country: 'NG', timezone: 'Africa/Lagos' };
};

// Offset (ms) of `tz` from UTC at instant `ms`.
const offsetAt = (ms, tz) => {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = Object.fromEntries(dtf.formatToParts(new Date(ms)).map(x => [x.type, x.value]));
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return asUTC - Math.floor(ms / 1000) * 1000;
};

/**
 * Wall-clock date ("YYYY-MM-DD") + time ("HH:MM[:SS]") in `tz` → UTC, in the
 * same { send_date, send_time } shape the backend already expects.
 * Invalid input is returned unchanged, as the old helper did.
 */
export const zonedToUTC = (dateStr, timeStr, tz) => {
  if (!dateStr) return { send_date: dateStr, send_time: timeStr };
  const zone = isValidTimeZone(tz) ? tz : browserTimeZone();
  const [y, mo, d] = String(dateStr).slice(0, 10).split('-').map(Number);
  const [h, mi, s] = String(timeStr || '09:00').split(':').map(Number);
  if ([y, mo, d, h, mi].some(n => !Number.isFinite(n))) return { send_date: dateStr, send_time: timeStr };
  const wall = Date.UTC(y, mo - 1, d, h, mi, Number.isFinite(s) ? s : 0);
  let utc = wall - offsetAt(wall, zone);
  // Re-check at the candidate instant (DST boundary between the two).
  const second = wall - offsetAt(utc, zone);
  if (second !== utc) utc = second;
  const iso = new Date(utc).toISOString();
  return { send_date: iso.slice(0, 10), send_time: iso.slice(11, 19) };
};

/** UTC instant → wall-clock { date, time } in `tz` (for filling the inputs back). */
export const utcToZoned = (utcIso, tz) => {
  const ms = new Date(utcIso).getTime();
  if (isNaN(ms)) return { date: '', time: '' };
  const zone = isValidTimeZone(tz) ? tz : browserTimeZone();
  const local = new Date(ms + offsetAt(ms, zone)).toISOString();
  return { date: local.slice(0, 10), time: local.slice(11, 16) };
};

/** "Fri 3 Oct, 09:00 WAT" — how an instant reads in a zone. */
export const formatInZone = (utcIso, tz, opts = {}) => {
  const ms = new Date(utcIso).getTime();
  if (isNaN(ms)) return '';
  try {
    return new Date(ms).toLocaleString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      timeZoneName: 'short', timeZone: isValidTimeZone(tz) ? tz : undefined, ...opts,
    });
  } catch { return new Date(ms).toLocaleString(); }
};
