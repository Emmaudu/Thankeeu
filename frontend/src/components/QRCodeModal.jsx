/**
 * QRCodeModal.jsx
 * Full-screen modal with QR code. Stable, mobile-responsive, download-ready.
 * Uses the `qrcode` npm package — no external API calls.
 */
import { useEffect, useState, useCallback } from 'react';
import QRCode from 'qrcode';

export default function QRCodeModal({ url, label = 'Scan to open', onClose }) {
  const [dataUrl, setDataUrl] = useState(null);
  const [copied,  setCopied]  = useState(false);
  const [dlDone,  setDlDone]  = useState(false);

  // Generate QR once on mount
  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: { dark: '#1a0533', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    }).then(setDataUrl).catch(console.error);
  }, [url]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleDownload = useCallback(() => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'thankeeu-qr-code.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDlDone(true);
    setTimeout(() => setDlDone(false), 2000);
  }, [dataUrl]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select a hidden input
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  const handlePrint = useCallback(() => {
    if (!dataUrl) return;
    const win = window.open('', '_blank', 'width=600,height=700');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Thankeeu QR Code</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#fff;font-family:system-ui,sans-serif;padding:32px}
img{width:280px;height:280px;display:block;margin-bottom:20px}
p{font-size:14px;color:#4B3F72;text-align:center;max-width:280px;font-weight:600;margin-bottom:8px}
small{font-size:10px;color:#999;word-break:break-all;text-align:center;max-width:280px}
.logo{font-size:18px;font-weight:800;color:#7C3AED;margin-bottom:16px}
@media print{body{padding:16px}}</style></head>
<body><div class="logo">thankeeu</div><img src="${dataUrl}"/><p>${label}</p><small>${url}</small></body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 400);
  }, [dataUrl, label, url]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(10,0,30,0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 24,
          boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
          width: '100%',
          maxWidth: 400,
          overflow: 'hidden',
          // prevent content from being taller than viewport
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg,#1a0533,#2d1052)',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, margin: 0 }}>QR Code</p>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, margin: '2px 0 0' }}>{label}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 10, border: 'none',
              background: 'rgba(255,255,255,0.12)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* QR image */}
          <div style={{
            border: '3px solid #EDE9FE', borderRadius: 16, padding: 12,
            background: '#fff', marginBottom: 16,
            boxShadow: '0 4px 20px rgba(124,58,237,0.1)',
          }}>
            {dataUrl ? (
              <img
                src={dataUrl}
                alt="QR code"
                style={{ width: 220, height: 220, display: 'block', imageRendering: 'pixelated' }}
              />
            ) : (
              <div style={{
                width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: '3px solid #DDD6FE', borderTopColor: '#7C3AED',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
          </div>

          {/* URL */}
          <p style={{
            fontSize: 11, color: '#9490C8', textAlign: 'center',
            wordBreak: 'break-all', marginBottom: 20, lineHeight: 1.5,
            maxWidth: 280,
          }}>
            {url}
          </p>

          {/* Action buttons — 3 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, width: '100%', marginBottom: 16 }}>
            {[
              {
                label: dlDone ? 'Saved!' : 'Save PNG',
                icon: dlDone
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
                onClick: handleDownload,
                disabled: !dataUrl,
              },
              {
                label: 'Print',
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
                onClick: handlePrint,
                disabled: !dataUrl,
              },
              {
                label: copied ? 'Copied!' : 'Copy Link',
                icon: copied
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
                onClick: handleCopy,
                disabled: false,
              },
            ].map(({ label: btnLabel, icon, onClick, disabled }) => (
              <button
                key={btnLabel}
                onClick={onClick}
                disabled={disabled}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '12px 8px', borderRadius: 14,
                  border: '2px solid #EDE9FE', background: '#fff',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.4 : 1,
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseOver={e => { if (!disabled) { e.currentTarget.style.borderColor = '#A78BFA'; e.currentTarget.style.background = '#F5F3FF'; }}}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#EDE9FE'; e.currentTarget.style.background = '#fff'; }}
              >
                {icon}
                <span style={{ fontSize: 11, fontWeight: 600, color: '#4B3F72', whiteSpace: 'nowrap' }}>{btnLabel}</span>
              </button>
            ))}
          </div>

          <p style={{ fontSize: 11, color: '#C4B5FD', textAlign: 'center', lineHeight: 1.5 }}>
            Display at your venue · Print on table cards · Share via WhatsApp
          </p>
        </div>
      </div>
    </div>
  );
}
