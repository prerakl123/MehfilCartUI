export default function AppLogo({ className = "" }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" className={className}>
            <defs>
                <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F3EFFF" />
                    <stop offset="100%" stopColor="#E0D4FF" />
                </linearGradient>

                <linearGradient id="iconGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#7C52D6" />
                    <stop offset="100%" stopColor="#4F2EB3" />
                </linearGradient>

                <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#4F2EB3" floodOpacity="0.15" />
                </filter>
            </defs>

            <rect x="60" y="30" width="280" height="280" rx="60" fill="url(#bgGrad)" filter="url(#shadow)" />

            <path d="M 120 220 L 120 140 L 200 190 L 280 140 L 280 220" fill="none" stroke="url(#iconGrad)" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />

            <path d="M 200 110 L 200 170" stroke="url(#iconGrad)" strokeWidth="10" strokeLinecap="round" />
            <path d="M 188 110 L 188 135 M 200 110 L 200 135 M 212 110 L 212 135" stroke="url(#iconGrad)" strokeWidth="5" strokeLinecap="round" />
            <path d="M 185 135 Q 200 155 215 135" fill="none" stroke="url(#iconGrad)" strokeWidth="6" strokeLinecap="round" />

            <path d="M 110 230 L 290 230 L 270 260 L 130 260 Z" fill="url(#iconGrad)" opacity="0.15" />
            <path d="M 100 230 L 300 230" stroke="url(#iconGrad)" strokeWidth="10" strokeLinecap="round" />

            <circle cx="150" cy="275" r="12" fill="url(#iconGrad)" />
            <circle cx="250" cy="275" r="12" fill="url(#iconGrad)" />

            <circle cx="120" cy="110" r="14" fill="url(#iconGrad)" />
            <circle cx="280" cy="110" r="14" fill="url(#iconGrad)" />
            <circle cx="200" cy="80" r="16" fill="url(#iconGrad)" />

            <text x="200" y="365" fontFamily="system-ui, -apple-system, sans-serif" fontSize="32" fontWeight="800" fill="#7C52D6" textAnchor="middle" letterSpacing="1.5">MEHFILCART</text>
        </svg>
    );
}
