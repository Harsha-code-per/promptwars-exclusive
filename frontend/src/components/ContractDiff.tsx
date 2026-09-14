import React, { useState } from 'react';
import { 
  GitCompare, 
  RefreshCw,
  Play
} from 'lucide-react';
import { ComparisonResult } from '../types/legal';
import { DiffEngine } from '../services/diffEngine';
import { SAMPLE_CONTRACTS } from '../data/sampleContracts';

export const ContractDiff: React.FC = () => {
  const saasSample = SAMPLE_CONTRACTS[1]; // SaaS MSA with version A and version B

  const [docAText, setDocAText] = useState<string>(saasSample.content);
  const [docBText, setDocBText] = useState<string>(saasSample.versionBContent || '');
  const [docATitle, setDocATitle] = useState<string>('CloudSync Vendor MSA (v1)');
  const [docBTitle, setDocBTitle] = useState<string>('Enterprise Customer Redline (v2)');
  const [result, setResult] = useState<ComparisonResult>(
    DiffEngine.compareDocuments(
      saasSample.content,
      saasSample.versionBContent || '',
      'CloudSync Vendor MSA (v1)',
      'Enterprise Customer Redline (v2)'
    )
  );
  const [filterShift, setFilterShift] = useState<string>('ALL');

  const handleRunComparison = () => {
    const res = DiffEngine.compareDocuments(docAText, docBText, docATitle, docBTitle);
    setResult(res);
  };

  const handleLoadSampleDiff = () => {
    setDocAText(saasSample.content);
    setDocBText(saasSample.versionBContent || '');
    setDocATitle('CloudSync Vendor MSA (v1)');
    setDocBTitle('Enterprise Customer Redline (v2)');
    setResult(
      DiffEngine.compareDocuments(
        saasSample.content,
        saasSample.versionBContent || '',
        'CloudSync Vendor MSA (v1)',
        'Enterprise Customer Redline (v2)'
      )
    );
  };

  const filteredDiffs = result.differences.filter((d) => {
    if (filterShift === 'ALL') return true;
    return d.favorabilityShift === filterShift;
  });

  return (
    <section aria-labelledby="diff-heading" className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 id="diff-heading" style={{ fontSize: '1.35rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GitCompare size={22} color="var(--brand-primary)" />
            Contract Redline & Comparative Diff Engine
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            Compare two contract versions or vendor markups side-by-side to detect leverage shifts and hidden alterations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleRunComparison}
            title="Re-run comparative diff analysis"
          >
            <Play size={14} />
            <span>Re-evaluate Comparison</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleLoadSampleDiff}
            title="Reset to benchmark SaaS MSA v1 vs v2 comparison"
          >
            <RefreshCw size={14} />
            <span>Load SaaS MSA Benchmark Diff</span>
          </button>
        </div>
      </div>

      {/* Strategic Leverage Summary Banner */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '1.5rem', 
          marginBottom: '1.5rem', 
          borderLeft: '5px solid var(--brand-primary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}
      >
        <div style={{ maxWidth: '800px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-info">
              Overall Advantage: {result.overallAdvantage.replace('_', ' ')}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              ({result.differences.length} Section Divergences Detected)
            </span>
          </div>
          <p style={{ fontSize: '0.925rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
            {result.summary}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn btn-sm ${filterShift === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterShift('ALL')}
            style={{ fontSize: '0.75rem' }}
          >
            All Changes ({result.differences.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filterShift === 'FAVORS_PARTY_B' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterShift('FAVORS_PARTY_B')}
            style={{ fontSize: '0.75rem' }}
          >
            Favors Customer ({result.differences.filter((d) => d.favorabilityShift === 'FAVORS_PARTY_B').length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filterShift === 'NEUTRAL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterShift('NEUTRAL')}
            style={{ fontSize: '0.75rem' }}
          >
            Neutral ({result.differences.filter((d) => d.favorabilityShift === 'NEUTRAL').length})
          </button>
        </div>
      </div>

      {/* Side-by-Side Clause Differences */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filteredDiffs.map((diff, idx) => {
          const favorsB = diff.favorabilityShift === 'FAVORS_PARTY_B';

          return (
            <article 
              key={idx}
              className="glass-panel" 
              style={{ padding: '1.5rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>
                  {diff.sectionTitle}
                </h3>
                <span 
                  className={`badge ${favorsB ? 'badge-low' : 'badge-info'}`}
                  style={{ fontSize: '0.75rem' }}
                >
                  {favorsB ? 'Favors Customer / Receiving Party' : 'Neutral Adjustment'}
                </span>
              </div>

              {/* Leverage Shift Explanation */}
              <div 
                style={{ 
                  background: 'var(--bg-surface)', 
                  padding: '0.85rem 1rem', 
                  borderRadius: 'var(--radius-md)', 
                  marginBottom: '1rem',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <strong style={{ color: 'var(--text-primary)', marginRight: '0.35rem' }}>Leverage Impact:</strong>
                {diff.explanation}
              </div>

              {/* Side-by-Side Comparison Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {/* Original Version */}
                <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--risk-critical)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>
                    {result.docATitle} (Prior Term)
                  </span>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
                    {diff.originalVersion}
                  </pre>
                </div>

                {/* Revised Version */}
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--risk-low)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>
                    {result.docBTitle} (Amended Redline)
                  </span>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', fontSize: '0.825rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.55 }}>
                    {diff.revisedVersion}
                  </pre>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
