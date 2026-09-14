import { useState, useCallback } from 'react';
import { ChevronDown, Copy, Check, GitCompare } from 'lucide-react';
import { RiskBadge } from './RiskBadge';
import type { ScoredClause } from '../types';

interface ClauseCardProps {
  clause: ScoredClause;
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * Individual clause display with risk badge, expandable detail view,
 * counter-draft copy action, and interactive Redline Diff mode.
 * Full keyboard navigation: Enter/Space to expand, Tab to actions.
 */
export function ClauseCard({ clause, isExpanded, onToggle }: ClauseCardProps) {
  const [copied, setCopied] = useState(false);
  const [showRedline, setShowRedline] = useState(false);

  const riskClass = `risk-${clause.riskLevel.toLowerCase()}`;

  const handleCopy = useCallback(async () => {
    if (!clause.counterDraft) return;
    try {
      await navigator.clipboard.writeText(clause.counterDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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
            <div className="clause-section-label">Original Clause Text</div>
            <p className="clause-text">{clause.clauseText}</p>
          </div>

          {/* Risk explanation */}
          {clause.semanticDeltaExplanation && (
            <div className="clause-section">
              <div className="clause-section-label">LexiGuard AI Assessment</div>
              <p className="clause-explanation">{clause.semanticDeltaExplanation}</p>
            </div>
          )}

          {/* Benchmark comparison */}
          {clause.nearestBenchmarkText && (
            <div className="clause-section">
              <div className="clause-section-label">Market Standard Benchmark (pgvector Cosine Retrieval)</div>
              <p className="clause-text" style={{ opacity: 0.75, fontStyle: 'italic' }}>{clause.nearestBenchmarkText}</p>
            </div>
          )}

          {/* Counter-draft */}
          {clause.counterDraft && (
            <div className="clause-section">
              <div className="counter-draft-section">
                <div className="counter-draft-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4>✎ Suggested Counter-Proposal</h4>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setShowRedline(!showRedline)}
                      aria-label="Toggle redline comparison view"
                      style={{ fontSize: '11px', padding: '2px 8px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <GitCompare size={12} />
                      <span>{showRedline ? 'View Clean' : 'View Redline'}</span>
                    </button>
                  </div>
                  <button
                    className={`copy-btn ${copied ? 'copied' : ''}`}
                    onClick={handleCopy}
                    aria-label={copied ? 'Copied to clipboard' : 'Copy counter-draft to clipboard'}
                    id={`copy-counterdraft-${clause.clauseIndex}`}
                  >
                    {copied ? (
                      <><Check size={12} aria-hidden="true" /> Copied</>
                    ) : (
                      <><Copy size={12} aria-hidden="true" /> Copy Proposal</>
                    )}
                  </button>
                </div>

                {showRedline ? (
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-md)',
                    fontSize: 'var(--font-size-sm)',
                    lineHeight: 1.6
                  }}>
                    <div style={{ color: '#dc2626', textDecoration: 'line-through', marginBottom: '8px', opacity: 0.85 }}>
                      <strong>[-] One-Sided Obligation:</strong> {clause.clauseText.slice(0, 180)}...
                    </div>
                    <div style={{ color: '#16a34a', fontWeight: 500 }}>
                      <strong>[+] Balanced Alternative:</strong> {clause.counterDraft}
                    </div>
                  </div>
                ) : (
                  <p className="clause-text">{clause.counterDraft}</p>
                )}

                {clause.counterDraftExplanation && (
                  <p style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-tertiary)',
                    marginTop: 'var(--space-md)',
                    fontStyle: 'italic'
                  }}>
                    Rationale: {clause.counterDraftExplanation}
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
