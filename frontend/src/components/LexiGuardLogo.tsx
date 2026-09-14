import type { SVGProps } from 'react';

interface LexiGuardLogoProps extends SVGProps<SVGSVGElement> {
  size?: number;
  variant?: 'mark' | 'full';
}

/**
 * LexiGuard AI — Legal Intelligence Emblem
 * Combines an iconic protective shield, legal scales of justice, and precision AI nodes.
 */
export function LexiGuardLogo({ size = 32, variant = 'mark', className, ...props }: LexiGuardLogoProps) {
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
        <defs>
          <linearGradient id="lexiDarkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <linearGradient id="lexiEmeraldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <filter id="lexiShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Shield Contour */}
        <path
          d="M24 4L7 11V23.5C7 33.5 14.5 42 24 44.5C33.5 42 41 33.5 41 23.5V11L24 4Z"
          fill="url(#lexiDarkGradient)"
          stroke="#334155"
          strokeWidth="1.5"
          filter="url(#lexiShadow)"
        />

        {/* Scales Balance Beam */}
        <path
          d="M14 20H34"
          stroke="#e2e8f0"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Vertical Scale Fulcrum */}
        <path
          d="M24 15V32"
          stroke="#e2e8f0"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Left Scale Pan */}
        <path
          d="M14 20L11 26H17L14 20Z"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.2"
        />

        {/* Right Scale Pan */}
        <path
          d="M34 20L31 26H37L34 20Z"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.2"
        />

        {/* Base Pedestal */}
        <path
          d="M19 32H29"
          stroke="#e2e8f0"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* AI Radar Node Center */}
        <circle cx="24" cy="15" r="2.5" fill="url(#lexiEmeraldAccent)" />
      </svg>

      {variant === 'full' && (
        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
          LexiGuard <span style={{ color: '#059669' }}>AI</span>
        </span>
      )}
    </div>
  );
}
