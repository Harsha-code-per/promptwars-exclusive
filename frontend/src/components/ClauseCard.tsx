import { useState, useCallback } from 'react';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { RiskBadge } from './RiskBadge';
import type { ScoredClause } from '../types';

interface ClauseCardProps {
  clause: ScoredClause;
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * Individual clause display with risk badge, expandable detail view,
 * and counter-draft copy action.
 * Full keyboard navigation: Enter/Space to expand, Tab to actions.
 */
export function ClauseCard({ clause, isExpanded, onToggle }: ClauseCardProps) {
  const [copied, setCopied] = useState(false);

  const riskClass = `risk-${clause.riskLevel.toLowerCase()}`;

  const handleCopy = useCallback(async () => {
    if (!clause.counterDraft) return;
    try {
      await navigator.clipboard.writeText(clause.counterDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = clause.counterDraft;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [clause.counterDraft]);

  return (
    <div
      className={`glass-card clause-card ${riskClass}`}
      role="article"
      aria-label={`Clause ${clause.clauseIndex + 1}: ${clause.clauseType}, risk level ${clause.riskLevel}`}
      id={`clause-${clause.clauseIndex}`}
    >
      {/* Header — click to expand */}
      <div
        className="clause-card-header"
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={`clause-body-${clause.clauseIndex}`}
        id={`clause-header-${clause.clauseIndex}`}
      >
        <div className="clause-card-title">
          <span className="clause-index">#{clause.clauseIndex + 1}</span>
          <h3>{clause.clauseType}</h3>
          <RiskBadge level={clause.riskLevel} size="sm" />
        </div>
        <ChevronDown
          className={`clause-card-expand ${isExpanded ? 'expanded' : ''}`}
          size={18}
          aria-hidden="true"
        />
      </div>

      {/* Expandable body */}
      {isExpanded && (
        <div
          className="clause-card-body"
          id={`clause-body-${clause.clauseIndex}`}
          role="region"
          aria-label={`Details for ${clause.clauseType} clause`}
        >
          {/* Original clause text */}
          <div className="clause-section">
            <div className="clause-section-label">Original Clause</div>
            <p className="clause-text">{clause.clauseText}</p>
          </div>

          {/* Risk explanation */}
          {clause.semanticDeltaExplanation && (
            <div className="clause-section">
              <div className="clause-section-label">Analysis</div>
              <p className="clause-explanation">{clause.semanticDeltaExplanation}</p>
            </div>
          )}

          {/* Benchmark comparison */}
          {clause.nearestBenchmarkText && (
            <div className="clause-section">
              <div className="clause-section-label">Market Standard Benchmark</div>
              <p className="clause-text" style={{ opacity: 0.7 }}>{clause.nearestBenchmarkText}</p>
            </div>
          )}

          {/* Counter-draft */}
          {clause.counterDraft && (
            <div className="clause-section">
              <div className="counter-draft-section">
                <div className="counter-draft-header">
                  <h4>✎ Suggested Alternative</h4>
                  <button
                    className={`copy-btn ${copied ? 'copied' : ''}`}
                    onClick={handleCopy}
                    aria-label={copied ? 'Copied to clipboard' : 'Copy counter-draft to clipboard'}
                    id={`copy-counterdraft-${clause.clauseIndex}`}
                  >
                    {copied ? (
                      <><Check size={12} aria-hidden="true" /> Copied</>
                    ) : (
                      <><Copy size={12} aria-hidden="true" /> Copy</>
                    )}
                  </button>
                </div>
                <p className="clause-text">{clause.counterDraft}</p>
                {clause.counterDraftExplanation && (
                  <p style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-tertiary)',
                    marginTop: 'var(--space-md)',
                    fontStyle: 'italic'
                  }}>
                    {clause.counterDraftExplanation}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
