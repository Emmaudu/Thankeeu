const ThankeeuLogo = ({ size = 32, textSize = 'text-xl', className = '' }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <div
      className="rounded-xl flex items-center justify-center flex-shrink-0"
      style={{
        width: size, height: size,
        background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
      }}>
      <span style={{ fontSize: size * 0.55 }}>💌</span>
    </div>
    <span className={`font-display font-bold ${textSize}`} style={{ color: '#1A1035' }}>
      Thank<span style={{ color: '#7C3AED' }}>eeu</span>
    </span>
  </div>
);

export default ThankeeuLogo;
