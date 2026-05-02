interface LogoProps {
  size?: number;
  showText?: boolean;
  textSize?: string;
}

export function Logo({ size = 32, showText = false, textSize = "text-[15px]" }: LogoProps) {
  const id = `lh-${size}`;
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="60%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="white" stopOpacity="0.18" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`${id}-glow`} cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background card */}
        <rect width="48" height="48" rx="12" fill={`url(#${id}-bg)`} />
        <rect width="48" height="48" rx="12" fill={`url(#${id}-glow)`} />
        <rect width="48" height="24" rx="12" fill={`url(#${id}-shine)`} />

        {/* Bookmark ribbon */}
        <path
          d="M14 9h20c1.1 0 2 .9 2 2v28l-12-6-12 6V11c0-1.1.9-2 2-2z"
          fill="white"
          fillOpacity="0.13"
          stroke="white"
          strokeOpacity="0.35"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />

        {/* Link chain - left oval */}
        <rect x="12" y="20" width="10" height="6" rx="3" stroke="white" strokeWidth="2" fill="none" />
        {/* Link chain - right oval */}
        <rect x="26" y="20" width="10" height="6" rx="3" stroke="white" strokeWidth="2" fill="none" />
        {/* Chain connector */}
        <line x1="21" y1="23" x2="27" y2="23" stroke="white" strokeWidth="2.2" strokeLinecap="round" />

        {/* Sparkle top-right */}
        <circle cx="35" cy="11" r="2.5" fill="white" fillOpacity="0.95" />
        <circle cx="35" cy="11" r="1.2" fill="white" />

        {/* Small dot accent */}
        <circle cx="13" cy="11" r="1.5" fill="white" fillOpacity="0.5" />
      </svg>

      {showText && (
        <span className={`font-bold tracking-tight text-white ${textSize}`}>
          Link Haven
        </span>
      )}
    </div>
  );
}
