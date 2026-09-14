import { ShieldCheck, AlertTriangle, XOctagon } from 'lucide-react';
import type { RiskLevel } from '../types';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md';
}

const RISK_CONFIG = {
  Standard: {
    icon: ShieldCheck,
    label: 'Standard',
    className: 'risk-badge--standard',
    ariaLabel: 'Risk level: Standard — this clause aligns with market standards',
  },
  Caution: {
    icon: AlertTriangle,
    label: 'Caution',
    className: 'risk-badge--caution',
    ariaLabel: 'Risk level: Caution — this clause has notable deviations from market standards',
  },
  Unfavorable: {
    icon: XOctagon,
    label: 'Unfavorable',
    className: 'risk-badge--unfavorable',
    ariaLabel: 'Risk level: Unfavorable — this clause significantly deviates from market standards',
  },
} as const;

/**
 * Accessible risk level indicator.
 * Uses icon + text label — never color alone.
 * WCAG AA compliant contrast ratios.
 */
export function RiskBadge({ level, size = 'md' }: RiskBadgeProps) {
  const config = RISK_CONFIG[level];
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <span
      className={`risk-badge ${config.className}`}
      role="status"
      aria-label={config.ariaLabel}
    >
      <span className="risk-icon" aria-hidden="true">
        <Icon size={iconSize} />
      </span>
      {config.label}
    </span>
  );
}
