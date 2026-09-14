import React from 'react';
import { 
  Clock, 
  CheckSquare, 
  AlertOctagon
} from 'lucide-react';
import { ContractAnalysis, LegalDimension } from '../types/legal';

interface RiskRadarProps {
  analysis: ContractAnalysis;
  onSelectDimension?: (dim: LegalDimension) => void;
}

export const RiskRadar: React.FC<RiskRadarProps> = ({ analysis, onSelectDimension }) => {
  const { overallScore, overallRating, executiveSummary, dimensionScores, timelines, checklist, clauses } = analysis;

  const getRatingColor = (score: number) => {
    if (score < 40) return 'var(--risk-critical)';
    if (score < 65) return 'var(--risk-high)';
    if (score < 80) return 'var(--risk-medium)';
    return 'var(--risk-low)';
  };

  const getRatingBadgeClass = (score: number) => {
    if (score < 40) return 'badge-critical';
    if (score < 65) return 'badge-high';
    if (score < 80) return 'badge-medium';
    return 'badge-low';
  };

  const ratingColor = getRatingColor(overallScore);

  // Extract Top 3 "Before You Sign" Gotchas
  const topGotchas = clauses
    .filter((c) => c.riskLevel === 'CRITICAL' || c.riskLevel === 'HIGH')
    .slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }} className="animate-fade-in">
      
      {/* Top Bento Row: Executive Score & "Before You Sign" Gotchas */}
      <div className="bento-grid">
        {/* Bento Card 1: Score & Executive Summary */}
        <section 
          className="bento-col-7 glass-panel" 
          style={{ 
            padding: 'var(--space-md) var(--space-lg)', 
            borderLeft: `5px solid ${ratingColor}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: '#ffffff'
          }}
          aria-labelledby="exec-score-title"
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
              <span className={`badge ${getRatingBadgeClass(overallScore)}`} style={{ fontSize: 'var(--font-sm)' }}>
                {overallRating.replace('_', ' ')}
              </span>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                Statutory Triage Index
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)', flexWrap: 'wrap' }}>
              {/* Circular Score Gauge */}
              <div 
                style={{
                  width: '105px',
                  height: '105px',
                  borderRadius: '50%',
                  background: `conic-gradient(${ratingColor} ${overallScore * 3.6}deg, #f1f5f9 0deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 18px ${ratingColor}22`,
                  flexShrink: 0
                }}
                aria-label={`Legal Health Score: ${overallScore} out of 100`}
              >
                <div 
                  style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)'
                  }}
                >
                  <span style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: ratingColor, lineHeight: 1 }}>
                    {overallScore}
                  </span>
                  <span style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Score / 100
                  </span>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: '200px' }}>
                <h2 id="exec-score-title" style={{ fontSize: 'var(--font-h2)', marginBottom: 'var(--space-3xs)', color: 'var(--text-primary)' }}>
                  Legal Risk Health Score
                </h2>
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)', margin: 0 }}>
                  Evaluated against statutory fairness thresholds and standard commercial benchmarks.
                </p>
              </div>
            </div>

            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
              {executiveSummary}
            </p>
          </div>
        </section>

        {/* Bento Card 2: "Before You Sign" Gotchas Radar */}
        <section 
          className="bento-col-5 glass-panel" 
          style={{ 
            padding: 'var(--space-md)', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            background: '#ffffff'
          }}
          aria-labelledby="gotchas-title"
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: 'var(--space-2xs)' }}>
              <AlertOctagon size={18} color="var(--risk-critical)" />
              <h3 id="gotchas-title" style={{ fontSize: 'var(--font-h3)', margin: 0, color: 'var(--text-primary)' }}>
                "Before You Sign" Top Gotchas
              </h3>
            </div>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-sm)' }}>
              Highest risk dealbreakers requiring immediate renegotiation before signing:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              {topGotchas.length === 0 ? (
                <div style={{ padding: 'var(--space-sm)', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                  No critical dealbreakers flagged. Standard terms apply.
                </div>
              ) : (
                topGotchas.map((gotcha, idx) => (
                  <div 
                    key={gotcha.id}
                    style={{
                      padding: 'var(--space-xs) var(--space-sm)',
                      background: gotcha.riskLevel === 'CRITICAL' ? 'var(--risk-critical-bg)' : 'var(--risk-high-bg)',
                      border: `1px solid ${gotcha.riskLevel === 'CRITICAL' ? 'var(--risk-critical-border)' : 'var(--risk-high-border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 'var(--space-xs)'
                    }}
                  >
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 800, color: gotcha.riskLevel === 'CRITICAL' ? 'var(--risk-critical)' : 'var(--risk-high)', marginTop: '2px' }}>
                      #{idx + 1}
                    </span>
                    <div>
                      <strong style={{ fontSize: 'var(--font-xs)', color: 'var(--text-primary)', display: 'block' }}>
                        {gotcha.title}
                      </strong>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', lineHeight: 1.45, display: 'block' }}>
                        {gotcha.plainEnglish}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {/* 5 Legal Dimension Cards Bento Row */}
      <section aria-labelledby="dimensions-heading" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
          <h3 id="dimensions-heading" style={{ fontSize: 'var(--font-h3)', margin: 0, color: 'var(--text-primary)' }}>
            5-Dimension Statutory Risk Breakdown
          </h3>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
            Select any dimension to filter clauses in demystifier
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-sm)', width: '100%' }}>
          {(Object.keys(dimensionScores) as LegalDimension[]).map((dimKey) => {
            const dim = dimensionScores[dimKey];
            const color = getRatingColor(dim.score);

            return (
              <div
                key={dim.dimension}
                className="glass-panel"
                onClick={() => onSelectDimension && onSelectDimension(dim.dimension)}
                style={{
                  padding: 'var(--space-sm) var(--space-md)',
                  cursor: onSelectDimension ? 'pointer' : 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `3px solid ${color}`,
                  background: '#ffffff',
                }}
                tabIndex={0}
                role="button"
                aria-label={`${dim.label}: score ${dim.score} out of 100`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectDimension && onSelectDimension(dim.dimension);
                  }
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2xs)' }}>
                    <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>{dim.label}</strong>
                    <span className={`badge ${getRatingBadgeClass(dim.score)}`}>
                      {dim.score}/100
                    </span>
                  </div>
                  <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)', lineHeight: 1.45 }}>
                    {dim.summary}
                  </p>
                </div>

                <div>
                  <div style={{ height: '6px', width: '100%', background: '#e2e8f0', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${dim.score}%`, background: color, borderRadius: 'var(--radius-full)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-3xs)', fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                    <span>{dim.riskCount > 0 ? `${dim.riskCount} Flags` : 'Balanced'}</span>
                    <span>{dim.riskLevel}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Deadlines & Checklist Bento Row */}
      <div className="bento-grid">
        {/* Critical Dates & Timelines */}
        <section className="bento-col-6 glass-panel" style={{ padding: 'var(--space-md) var(--space-lg)', background: '#ffffff' }} aria-labelledby="timelines-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
            <Clock size={18} color="var(--brand-primary)" />
            <h3 id="timelines-heading" style={{ fontSize: 'var(--font-h3)', margin: 0, color: 'var(--text-primary)' }}>
              Notice Windows & Trapdoor Deadlines
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            {timelines.map((item, idx) => (
              <div 
                key={idx}
                style={{
                  padding: 'var(--space-xs) var(--space-sm)',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3xs)' }}>
                  <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>{item.event}</strong>
                  <span className="badge badge-info">
                    {item.timeline}
                  </span>
                </div>
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', margin: 0 }}>
                  {item.consequence}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Actionable Next Steps Checklist */}
        <section className="bento-col-6 glass-panel" style={{ padding: 'var(--space-md) var(--space-lg)', background: '#ffffff' }} aria-labelledby="checklist-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
            <CheckSquare size={18} color="var(--impact-emerald)" />
            <h3 id="checklist-heading" style={{ fontSize: 'var(--font-h3)', margin: 0, color: 'var(--text-primary)' }}>
              Actionable Negotiation Checklist
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            {checklist.map((item) => (
              <div 
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-xs)',
                  padding: 'var(--space-xs) var(--space-sm)',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <input 
                  type="checkbox" 
                  id={item.id} 
                  style={{ marginTop: '0.2rem', accentColor: 'var(--brand-primary)' }} 
                  aria-label={item.task}
                />
                <label htmlFor={item.id} style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.45 }}>
                  <span className={`badge badge-${item.priority === 'HIGH' ? 'critical' : 'medium'}`} style={{ marginRight: 'var(--space-xs)' }}>
                    {item.priority}
                  </span>
                  {item.task}
                </label>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
