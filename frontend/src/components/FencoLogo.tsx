import type { SVGProps } from 'react';

interface FencoLogoProps extends SVGProps<SVGSVGElement> {
  size?: number;
  variant?: 'mark' | 'full';
}

/**
 * Fenco — Custom Blackish Legal-Tech Emblem
 * Combines an iconic shield, precision radar waves, and stylized 'F' scales of justice.
 */
export function FencoLogo({ size = 32, variant = 'mark', className, ...props }: FencoLogoProps) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }} className={className}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        {...props}
      >
        {/* Outer Dark Shield / Hex Badge */}
        <defs>
          <linearGradient id="fencoDarkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#18181b" />
            <stop offset="50%" stopColor="#09090b" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>
          <linearGradient id="fencoSilverAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#d4d4d8" />
          </linearGradient>
          <filter id="fencoShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Shield Body */}
        <path
          d="M24 4L7 10.5V23.5C7 33.5 14.5 42 24 44.5C33.5 42 41 33.5 41 23.5V10.5L24 4Z"
          fill="url(#fencoDarkGradient)"
          stroke="#27272a"
          strokeWidth="1.5"
          filter="url(#fencoShadow)"
        />

        {/* Inner Radar Arcs (Subtle dark-grey glow) */}
        <path
          d="M17 19C19 17 21.5 16 24 16C26.5 16 29 17 31 19"
          stroke="#52525b"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M13 15C16 12 20 10.5 24 10.5C28 10.5 32 12 35 15"
          stroke="#3f3f46"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Stylized 'F' Monogram / Scales Pillar */}
        {/* Vertical stem of F */}
        <rect x="18" y="17" width="3.5" height="19" rx="1.75" fill="url(#fencoSilverAccent)" />

        {/* Top bar of F (with scale tilt) */}
        <path
          d="M18 18.5H31C31.8 18.5 32.5 19.2 32.5 20C32.5 20.8 31.8 21.5 31 21.5H18V18.5Z"
          fill="url(#fencoSilverAccent)"
        />

        {/* Middle bar of F */}
        <path
          d="M18 25H27C27.8 25 28.5 25.7 28.5 26.5C28.5 27.3 27.8 28 27 28H18V25Z"
          fill="url(#fencoSilverAccent)"
        />

        {/* Precision Target Point / Balance Fulcrum */}
        <circle cx="24" cy="33.5" r="2" fill="#10b981" />
      </svg>

      {variant === 'full' && (
        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#000000', letterSpacing: '-0.02em' }}>
          Fenco
        </span>
      )}
    </div>
  );
}
