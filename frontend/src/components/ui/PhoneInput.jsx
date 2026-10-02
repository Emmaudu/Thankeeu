/**
 * PhoneInput — country code selector + local number input
 * Usage: <PhoneInput value={form.phone} onChange={v => set('phone', v)} />
 * Stores full string: "+234 8012345678"
 */
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export const COUNTRY_CODES = [
  { code: 'NG', dial: '+234', flag: 'NG', name: 'Nigeria' },
  { code: 'GH', dial: '+233', flag: 'GH', name: 'Ghana' },
  { code: 'KE', dial: '+254', flag: 'KE', name: 'Kenya' },
  { code: 'ZA', dial: '+27', flag: 'ZA', name: 'South Africa' },
  { code: 'TZ', dial: '+255', flag: 'TZ', name: 'Tanzania' },
  { code: 'UG', dial: '+256', flag: 'UG', name: 'Uganda' },
  { code: 'RW', dial: '+250', flag: 'RW', name: 'Rwanda' },
  { code: 'ZM', dial: '+260', flag: 'ZM', name: 'Zambia' },
  { code: 'GB', dial: '+44', flag: 'GB', name: 'United Kingdom' },
  { code: 'US', dial: '+1', flag: 'US', name: 'United States' },
  { code: 'CA', dial: '+1', flag: 'CA', name: 'Canada' },
  { code: 'DE', dial: '+49', flag: 'DE', name: 'Germany' },
  { code: 'FR', dial: '+33', flag: 'FR', name: 'France' },
  { code: 'IT', dial: '+39', flag: 'IT', name: 'Italy' },
  { code: 'ES', dial: '+34', flag: 'ES', name: 'Spain' },
  { code: 'NL', dial: '+31', flag: 'NL', name: 'Netherlands' },
  { code: 'IN', dial: '+91', flag: 'IN', name: 'India' },
  { code: 'AE', dial: '+971', flag: 'AE', name: 'UAE' },
  { code: 'SG', dial: '+65', flag: 'SG', name: 'Singapore' },
  { code: 'AU', dial: '+61', flag: 'AU', name: 'Australia' },
];

export default function PhoneInput({ value = '', onChange, required, placeholder, className }) {
  // Parse stored value — format is "+234 8012345678"
  // For +1 countries we disambiguate by defaulting to US
  const parseValue = (v) => {
    if (!v) return { dialCode: '+234', countryCode: 'NG', local: '' };
    const match = v.match(/^(\+\d+)\s?(.*)/);
    if (match) {
      const dc = match[1];
      const found = COUNTRY_CODES.find(c => c.dial === dc) || COUNTRY_CODES[0];
      return { dialCode: dc, countryCode: found.code, local: match[2] };
    }
    return { dialCode: '+234', countryCode: 'NG', local: v };
  };

  const parsed = parseValue(value);
  const [selectedCode, setSelectedCode] = useState(parsed.countryCode); // track by country code to handle +1 ambiguity
  const [local, setLocal] = useState(parsed.local);
  const current = COUNTRY_CODES.find(c => c.code === selectedCode) || COUNTRY_CODES[0];
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const emit = (dc, loc) => {
    const trimmed = loc.trim();
    onChange(trimmed ? `${dc} ${trimmed}` : '');
  };

  const handleDialChange = (code) => {
    setSelectedCode(code);
    setOpen(false);
    const c = COUNTRY_CODES.find(x => x.code === code) || COUNTRY_CODES[0];
    emit(c.dial, local);
  };

  const handleLocalChange = (e) => {
    // Allow digits, spaces, hyphens only
    const v = e.target.value.replace(/[^\d\s\-]/g, '');
    setLocal(v);
    emit(current.dial, v);
  };


  return (
    <div className={`flex ${className || ''}`} style={{ position: 'relative', width: '100%' }}>
      {/* Dial code selector */}
      <div ref={dropRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0 10px', height: '100%', minHeight: 44,
            background: 'var(--surface, #f9f9f9)',
            border: '1px solid var(--border, #e5e7eb)',
            borderRight: 'none',
            borderRadius: '12px 0 0 12px',
            cursor: 'pointer', fontSize: 14, fontWeight: 700,
            color: 'var(--text, #1a1a1a)', whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: 18 }}>{current.flag}</span>
          <span>{current.dial}</span>
          <ChevronDown size={12} style={{ color: 'var(--muted, #9ca3af)', flexShrink: 0 }} />
        </button>

        {open && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 200,
            background: 'white',
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            maxHeight: 260, overflowY: 'auto', minWidth: 220, marginTop: 4,
          }}>
            {COUNTRY_CODES.map((c, i) => (
              <button
                key={`${c.code}-${c.dial}-${i}`}
                type="button"
                onClick={() => handleDialChange(c.code)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '9px 14px', border: 'none',
                  background: selectedCode === c.code ? 'var(--rose-light, #fff0f3)' : 'transparent',
                  cursor: 'pointer', textAlign: 'left', fontSize: 13,
                  fontWeight: selectedCode === c.code ? 700 : 400,
                  color: selectedCode === c.code ? 'var(--rose, #ff2d62)' : 'var(--text, #1a1a1a)',
                }}
              >
                <span style={{ fontSize: 17, flexShrink: 0 }}>{c.flag}</span>
                <span style={{ flex: 1 }}>{c.name}</span>
                <span style={{ color: 'var(--muted, #9ca3af)', fontSize: 12, fontWeight: 600 }}>{c.dial}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Local number input */}
      <input
        type="tel"
        required={required}
        placeholder={placeholder || '8012345678'}
        value={local}
        onChange={handleLocalChange}
        className="input"
        style={{ borderRadius: '0 12px 12px 0', flex: 1, minWidth: 0, width: '100%' }}
      />
    </div>
  );
}
