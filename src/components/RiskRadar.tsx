import React from 'react';
import { 
  Clock, 
  CheckSquare
} from 'lucide-react';
import { ContractAnalysis, LegalDimension } from '../types/legal';

interface RiskRadarProps {
  analysis: ContractAnalysis;
  onSelectDimension?: (dim: LegalDimension) => void;
}

export const RiskRadar: React.FC<RiskRadarProps> = ({ analysis, onSelectDimension }) => {
  const { overallScore, overallRating, executiveSummary, dimensionScores, timelines, checklist } = analysis;

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      {/* Top Executive Health Scorecard */}
      <section 
        className="glass-panel" 
        style={{ 
          padding: '1.75rem',
          borderLeft: `5px solid ${ratingColor}`,
          boxShadow: overallScore < 50 ? 'var(--shadow-critical-glow)' : 'var(--shadow-glow)',
        }}
        aria-labelledby="executive-summary-title"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'center' }}>
          
          {/* Circular Score Gauge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div 
              style={{
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                background: `conic-gradient(${ratingColor} ${overallScore * 3.6}deg, var(--bg-surface-elevated) 0deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 20px ${ratingColor}33`,
                flexShrink: 0
              }}
              aria-label={`Legal Health Score: ${overallScore} out of 100`}
            >
              <div 
                style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: '50%',
                  background: 'var(--bg-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: ratingColor, lineHeight: 1 }}>
                  {overallScore}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Health / 100
                </span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span className={`badge ${getRatingBadgeClass(overallScore)}`} style={{ fontSize: '0.8rem' }}>
                  {overallRating.replace('_', ' ')}
                </span>
              </div>
              <h2 id="executive-summary-title" style={{ fontSize: '1.35rem', marginBottom: '0.25rem' }}>
                Contract Risk Triage
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: 0 }}>
                Evaluated across 5 statutory legal dimensions
              </p>
            </div>
          </div>

          {/* Executive Summary Narrative */}
          <div>
            <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {executiveSummary}
            </p>
          </div>
        </div>
      </section>

      {/* 5 Legal Dimension Cards Grid */}
      <section aria-labelledby="dimensions-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 id="dimensions-heading" style={{ fontSize: '1.15rem' }}>
            5-Dimension Risk Matrix
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            Click any dimension to filter clauses
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {(Object.keys(dimensionScores) as LegalDimension[]).map((dimKey) => {
            const dim = dimensionScores[dimKey];
            const color = getRatingColor(dim.score);

            return (
              <div
                key={dim.dimension}
                className="glass-panel"
                onClick={() => onSelectDimension && onSelectDimension(dim.dimension)}
                style={{
                  padding: '1.25rem',
                  cursor: onSelectDimension ? 'pointer' : 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `3px solid ${color}`,
                  transition: 'transform var(--transition-fast), border-color var(--transition-fast)',
                }}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectDimension && onSelectDimension(dim.dimension);
                  }
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{dim.label}</strong>
                    <span className={`badge ${getRatingBadgeClass(dim.score)}`} style={{ fontSize: '0.7rem' }}>
                      {dim.score}/100
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.45 }}>
                    {dim.summary}
                  </p>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ height: '6px', width: '100%', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${dim.score}%`, background: color, borderRadius: 'var(--radius-full)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                    <span>Exposure: {dim.riskCount > 0 ? `${dim.riskCount} Hazard Flags` : 'Balanced'}</span>
                    <span>{dim.riskLevel}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Deadlines & Actionable Checklist 2-Column Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Critical Dates & Timelines */}
        <section className="glass-panel" style={{ padding: '1.5rem' }} aria-labelledby="timelines-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Clock size={19} color="var(--brand-primary)" />
            <h3 id="timelines-heading" style={{ fontSize: '1.1rem', margin: 0 }}>
              Critical Timelines & Trapdoors
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {timelines.map((item, idx) => (
              <div 
                key={idx}
                style={{
                  padding: '0.85rem',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.event}</strong>
                  <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                    {item.timeline}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {item.consequence}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Actionable Next Steps Checklist */}
        <section className="glass-panel" style={{ padding: '1.5rem' }} aria-labelledby="checklist-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <CheckSquare size={19} color="#10b981" />
            <h3 id="checklist-heading" style={{ fontSize: '1.1rem', margin: 0 }}>
              Actionable Negotiation Checklist
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {checklist.map((item) => (
              <div 
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  padding: '0.75rem',
                  background: 'var(--bg-surface)',
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
                <label htmlFor={item.id} style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.45 }}>
                  <span className={`badge badge-${item.priority === 'HIGH' ? 'critical' : 'medium'}`} style={{ fontSize: '0.65rem', marginRight: '0.4rem' }}>
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
