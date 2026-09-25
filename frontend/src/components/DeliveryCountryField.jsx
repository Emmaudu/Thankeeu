import { useMemo } from 'react';
import Icon from './ui/Icon';
import {
  COUNTRY_OPTIONS, getCountry, zonedToUTC, formatInZone, browserTimeZone,
} from '../utils/timezones';

/**
 * Recipient country (+ time zone for multi-zone countries). The delivery date
 * and time the creator types are read in THIS zone, so the card lands at, say,
 * 09:00 where the recipient lives. Shows the creator what that is in their own
 * time so there is no surprise.
 *
 * Props: country, timezone, onChange({ recipient_country, delivery_timezone }),
 *        sendDate, sendTime, recipientName
 */
export default function DeliveryCountryField({ country, timezone, onChange, sendDate, sendTime, recipientName }) {
  const current = getCountry(country) || COUNTRY_OPTIONS[0];
  const zones = current.zones;
  const tz = zones.some(z => z.tz === timezone) ? timezone : zones[0].tz;

  const preview = useMemo(() => {
    if (!sendDate) return null;
    const { send_date, send_time } = zonedToUTC(sendDate, sendTime || '09:00', tz);
    const iso = `${send_date}T${send_time}Z`;
    const there = formatInZone(iso, tz);
    const mine = browserTimeZone();
    const here = mine !== tz ? formatInZone(iso, mine) : null;
    return { there, here };
  }, [sendDate, sendTime, tz]);

  return (
    <div className="sm:col-span-2">
      <label className="block text-sm font-semibold text-warm-700 mb-1.5">
        Recipient's country <span className="text-warm-400 font-normal text-xs">(delivery time follows their local time)</span>
      </label>
      <div className={`grid gap-2 ${zones.length > 1 ? 'sm:grid-cols-2' : ''}`}>
        <select
          className="input"
          value={current.code}
          aria-label="Recipient's country"
          onChange={e => {
            const next = getCountry(e.target.value);
            onChange({ recipient_country: next.code, delivery_timezone: next.zones[0].tz });
          }}
        >
          {COUNTRY_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
        {zones.length > 1 && (
          <select
            className="input"
            value={tz}
            aria-label="Recipient's time zone"
            onChange={e => onChange({ recipient_country: current.code, delivery_timezone: e.target.value })}
          >
            {zones.map(z => <option key={z.tz} value={z.tz}>{z.label || z.tz}</option>)}
          </select>
        )}
      </div>
      {preview && (
        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-warm-500">
          <Icon name="Clock" size={12} className="mt-0.5 flex-shrink-0 text-primary-500" />
          <span>
            Arrives <strong className="text-warm-700">{preview.there}</strong> for {recipientName?.trim() || 'the recipient'}
            {preview.here && <> — that's {preview.here} your time</>}.
          </span>
        </p>
      )}
    </div>
  );
}
