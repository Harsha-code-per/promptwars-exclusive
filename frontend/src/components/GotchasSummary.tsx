import { AlertTriangle, ArrowRight } from 'lucide-react';
import { RiskBadge } from './RiskBadge';
import { DisclaimerBanner } from './DisclaimerBanner';
import type { GotchaItem } from '../types';

interface GotchasSummaryProps {
  gotchas: GotchaItem[];
  onClauseClick?: (clauseIndex: number) => void;
}

/**
 * "Before You Sign" gotchas summary.
 * Displays practical implications of flagged clauses in plain language.
 * Includes informational disclaimer.
 */
export function GotchasSummary({ gotchas, onClauseClick }: GotchasSummaryProps) {
  if (gotchas.length === 0) {
    return (
      <div className="gotchas-section">
        <h2>
          <AlertTriangle size={22} aria-hidden="true" style={{ color: 'var(--color-caution)' }} />
          Before You Sign
        </h2>
        <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
          <p style={{ color: 'var(--color-standard)', fontWeight: 600 }}>
            ✓ No significant issues detected
          </p>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-sm)', fontSize: 'var(--font-size-sm)' }}>
            All clauses appear to align with market standards. We still recommend having a licensed attorney review the full agreement.
          </p>
        </div>
        <div style={{ marginTop: 'var(--space-md)' }}>
          <DisclaimerBanner compact />
        </div>
      </div>
    );
  }

  return (
    <section className="gotchas-section" aria-label="Before You Sign summary">
      <h2>
        <AlertTriangle size={22} aria-hidden="true" style={{ color: 'var(--color-caution)' }} />
        Before You Sign
      </h2>

      <DisclaimerBanner compact />

      <div style={{ marginTop: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {gotchas.map((gotcha, index) => (
          <div
            key={index}
            className="glass-card gotcha-card"
            role="article"
            aria-label={`Gotcha: ${gotcha.title}`}
          >
            <div className="gotcha-title">
              <RiskBadge level={gotcha.riskLevel} size="sm" />
              <h3>{gotcha.title}</h3>
            </div>
            <p className="gotcha-explanation">{gotcha.explanation}</p>
            {onClauseClick && (
              <button
                className="gotcha-clause-link"
                onClick={() => onClauseClick(gotcha.relatedClauseIndex)}
                aria-label={`Jump to clause ${gotcha.relatedClauseIndex + 1}`}
              >
                <ArrowRight size={12} aria-hidden="true" />
                See Clause #{gotcha.relatedClauseIndex + 1}
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
