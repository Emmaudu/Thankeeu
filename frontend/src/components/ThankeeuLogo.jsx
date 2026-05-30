const ThankeeuLogo = ({ size = 32, showText = true, textSize = 'text-xl', className = '' }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      {/* Rounded square background */}
      <rect width="64" height="64" rx="16" fill="#7F77DD"/>
      {/* Letter T */}
      <rect x="14" y="14" width="36" height="7" rx="3.5" fill="white"/>
      <rect x="28.5" y="14" width="7" height="26" rx="3.5" fill="white"/>
      {/* Pink heart at bottom of T */}
      <path
        d="M32 50 C28.5 46.5 23 43 23 39.5 C23 36.8 25.2 35 27.5 35 C29.5 35 31 36.2 32 37.5 C33 36.2 34.5 35 36.5 35 C38.8 35 41 36.8 41 39.5 C41 43 35.5 46.5 32 50Z"
        fill="#D4537E"
      />
    </svg>

    {showText && (
      <span className={`font-display font-semibold text-gray-900 ${textSize} leading-none`}>
        Thankeeu
      </span>
    )}
  </div>
);

export default ThankeeuLogo;
