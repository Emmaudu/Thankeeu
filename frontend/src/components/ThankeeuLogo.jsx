const ThankeeuLogo = ({ size = 32, textSize = 'text-xl', className = '' }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <img
      src="/android-chrome-192x192.png"
      alt="Thankeeu"
      width={size}
      height={size}
      style={{ width: size, height: size, borderRadius: size * 0.22, flexShrink: 0 }}
    />
    <span className={`font-display font-bold ${textSize}`} style={{ color: '#1A1035' }}>
      Thank<span style={{ color: '#7C3AED' }}>eeu</span>
    </span>
  </div>
);

export default ThankeeuLogo;
