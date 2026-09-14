import { useState, useCallback } from 'react';
import { ClauseCard } from './ClauseCard';
import type { ScoredClause, RiskLevel } from '../types';

interface ClauseListProps {
  clauses: ScoredClause[];
  onClauseSelect?: (clauseIndex: number) => void;
}

type FilterOption = 'all' | RiskLevel;

/**
 * Scrollable clause list with risk-level filtering.
 * Keyboard navigable: arrow keys move between clauses.
 */
export function ClauseList({ clauses, onClauseSelect }: ClauseListProps) {
  const [filter, setFilter] = useState<FilterOption>('all');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const filteredClauses = filter === 'all'
    ? clauses
    : clauses.filter((c) => c.riskLevel === filter);

  const handleToggle = useCallback((index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
    onClauseSelect?.(index);
  }, [onClauseSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
    const items = filteredClauses;
    const currentPos = items.findIndex((c) => c.clauseIndex === currentIndex);

    if (e.key === 'ArrowDown' && currentPos < items.length - 1) {
      e.preventDefault();
      const nextClause = items[currentPos + 1];
      const el = document.getElementById(`clause-header-${nextClause.clauseIndex}`);
      el?.focus();
    }

    if (e.key === 'ArrowUp' && currentPos > 0) {
      e.preventDefault();
      const prevClause = items[currentPos - 1];
      const el = document.getElementById(`clause-header-${prevClause.clauseIndex}`);
      el?.focus();
    }
  }, [filteredClauses]);

  const counts = {
    all: clauses.length,
    Standard: clauses.filter((c) => c.riskLevel === 'Standard').length,
    Caution: clauses.filter((c) => c.riskLevel === 'Caution').length,
    Unfavorable: clauses.filter((c) => c.riskLevel === 'Unfavorable').length,
  };

  const filters: { key: FilterOption; label: string }[] = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'Standard', label: `Standard (${counts.Standard})` },
    { key: 'Caution', label: `Caution (${counts.Caution})` },
    { key: 'Unfavorable', label: `Unfavorable (${counts.Unfavorable})` },
  ];

  return (
    <div>
      {/* Filter bar */}
      <div className="filter-bar" role="toolbar" aria-label="Filter clauses by risk level">
        {filters.map((f) => (
          <button
            key={f.key}
            className={`filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            id={`filter-${f.key.toLowerCase()}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Clause list */}
      <div
        role="list"
        aria-label="Contract clauses"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}
      >
        {filteredClauses.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              No clauses match the selected filter.
            </p>
          </div>
        ) : (
          filteredClauses.map((clause) => (
            <div
              key={clause.id || clause.clauseIndex}
              role="listitem"
              onKeyDown={(e) => handleKeyDown(e, clause.clauseIndex)}
            >
              <ClauseCard
                clause={clause}
                isExpanded={expandedIndex === clause.clauseIndex}
                onToggle={() => handleToggle(clause.clauseIndex)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
