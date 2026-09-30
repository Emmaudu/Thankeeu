import { useState } from 'react';
import QRCodeModal from './QRCodeModal';

export default function QRButton({ url, label, variant = 'secondary', children, className = '' }) {
  const [open, setOpen] = useState(false);

  const base = 'inline-flex items-center gap-2 font-bold text-sm transition-all rounded-2xl';
  const variants = {
    primary:   'px-5 py-2.5 bg-gradient-to-r from-primary-500 to-purple-600 text-white hover:scale-105 shadow-md',
    secondary: 'px-5 py-2.5 border-2 border-primary-200 text-primary-700 hover:bg-primary-50',
    ghost:     'px-4 py-2 text-warm-500 hover:text-primary-600 hover:bg-purple-50',
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className={`${base} ${variants[variant]} ${className}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 17h.01M17 14h.01"/>
        </svg>
        {children || 'QR Code'}
      </button>
      {/* Always mounted — open prop controls visibility, prevents flicker from remount */}
      <QRCodeModal url={url} label={label} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
