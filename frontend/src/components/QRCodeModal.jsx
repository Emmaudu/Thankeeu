/**
 * QRCodeModal.jsx
 * Renders a QR code for a card URL. Shows in-card creator flow and on CardView.
 * Uses the `qrcode` npm package to generate a data URL — no external API calls.
 *
 * Props:
 *   url        — the full URL the QR code points to
 *   label      — short label shown below the code (e.g. "Scan to sign" / "Scan to upload photos")
 *   onClose    — called when the modal is dismissed
 *   autoOpen   — if true the modal opens immediately (used on card-live screen)
 */
import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

export default function QRCodeModal({ url, label = 'Scan to open', onClose, autoOpen = false }) {
  const canvasRef = useRef(null);
  const [dataUrl, setDataUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      width: 360,
      margin: 2,
      color: { dark: '#1a0533', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).then(setDataUrl).catch(console.error);
  }, [url]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'thankeeu-qr-code.png';
    a.click();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback silent */ }
  };

  const handlePrint = () => {
    if (!dataUrl) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Thankeeu QR Code</title><style>
        body { margin: 0; display: flex; flex-direction: column; align-items: center;
               justify-content: center; min-height: 100vh; font-family: sans-serif; background: #fff; }
        img  { width: 300px; height: 300px; }
        p    { margin-top: 16px; font-size: 14px; color: #555; text-align: center; max-width: 300px; }
        small { display: block; margin-top: 6px; font-size: 11px; color: #999; word-break: break-all; }
      </style></head><body>
        <img src="${dataUrl}" />
        <p>${label}</p>
        <small>${url}</small>
      </body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,0,30,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-purple-50 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg,#1a0533,#2d1052)' }}>
          <div>
            <p className="font-bold text-white text-sm">QR Code</p>
            <p className="text-white/50 text-xs mt-0.5">{label}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center px-6 py-6">
          {dataUrl ? (
            <div className="rounded-2xl border-2 border-purple-100 p-3 shadow-sm mb-4">
              <img src={dataUrl} alt="QR code" className="w-64 h-64 block" />
            </div>
          ) : (
            <div className="w-64 h-64 rounded-2xl border-2 border-purple-100 flex items-center justify-center mb-4">
              <div className="w-8 h-8 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
            </div>
          )}

          {/* URL preview */}
          <p className="text-xs text-warm-500 text-center mb-5 max-w-xs break-all leading-relaxed">
            {url}
          </p>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2 w-full">
            <button onClick={handleDownload} disabled={!dataUrl}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 border-purple-100 hover:border-primary-300 hover:bg-purple-50 transition-all disabled:opacity-40">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span className="text-xs font-semibold text-warm-700">Save PNG</span>
            </button>
            <button onClick={handlePrint} disabled={!dataUrl}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 border-purple-100 hover:border-primary-300 hover:bg-purple-50 transition-all disabled:opacity-40">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              <span className="text-xs font-semibold text-warm-700">Print</span>
            </button>
            <button onClick={handleCopy}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 border-purple-100 hover:border-primary-300 hover:bg-purple-50 transition-all">
              {copied
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              }
              <span className="text-xs font-semibold text-warm-700">{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          <p className="text-xs text-warm-400 mt-4 text-center leading-relaxed">
            Print this on table cards, a welcome sign, or display it on screen so guests can scan and upload photos.
          </p>
        </div>
      </div>
    </div>
  );
}
