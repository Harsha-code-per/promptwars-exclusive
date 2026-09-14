import { useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { ClauseList } from '../components/ClauseList';
import { GotchasSummary } from '../components/GotchasSummary';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { useAnalysis } from '../hooks/useAnalysis';

/**
 * Analysis page — shows clause-by-clause risk analysis, summary dashboard,
 * counter-drafts, and gotchas summary.
 */
export function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { status, analysis, error, isLoading, isAnalyzing, startAnalysis } = useAnalysis(id || null);

  // Auto-trigger analysis when document is ready
  useEffect(() => {
    if (status === 'uploaded' || status === 'processing') {
      // Wait for processing to complete, then start analysis
    }
  }, [status]);

  // When document finishes processing (status becomes 'uploaded' after ingestion)
  useEffect(() => {
    if (status === 'uploaded' && !isAnalyzing && !analysis) {
      // Short delay to ensure ingestion is fully complete
      const timer = setTimeout(() => startAnalysis(), 1000);
      return () => clearTimeout(timer);
    }
    if (status === 'analyzed' && !analysis && !isAnalyzing) {
      startAnalysis();
    }
  }, [status, isAnalyzing, analysis, startAnalysis]);

  const handleClauseClick = useCallback((clauseIndex: number) => {
    const el = document.getElementById(`clause-${clauseIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const header = document.getElementById(`clause-header-${clauseIndex}`);
      header?.focus();
    }
  }, []);

  // Loading state
  if (isLoading || isAnalyzing || (!analysis && !error)) {
    return (
      <div className="page">
        <div className="container">
          <div className="loading-overlay">
            <div className="spinner" aria-label="Analyzing document" />
            <div>
              <p style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {isAnalyzing ? 'Analyzing your contract...' : 'Processing document...'}
              </p>
              <p style={{ marginTop: 'var(--space-sm)', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
                {isAnalyzing
                  ? 'Scoring clauses, generating counter-drafts, and preparing your report'
                  : 'Extracting text and identifying clause boundaries'}
              </p>
            </div>
            <div className="progress-bar" style={{ maxWidth: '300px' }}>
              <div
                className="progress-fill"
                style={{ width: isAnalyzing ? '70%' : '30%' }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="page">
        <div className="container">
          <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-unfavorable)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
              Analysis Failed
            </p>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>{error}</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              <ArrowLeft size={16} aria-hidden="true" /> Try Another Document
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
          <button
            className="btn btn-ghost"
            onClick={() => navigate('/')}
            aria-label="Go back to upload page"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <div>
            <h1 style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
            }}>
              <FileText size={22} aria-hidden="true" style={{ color: 'var(--color-accent)' }} />
              {analysis.filename}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '2px' }}>
              {analysis.documentType === 'freelance_services' ? 'Freelance Services Agreement' : 'Residential Lease'} •{' '}
              {analysis.clauses.length} clauses analyzed
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <DisclaimerBanner compact />
        </div>

        {/* Summary Dashboard */}
        <div className="summary-dashboard" role="region" aria-label="Analysis summary">
          <div className="glass-card summary-stat stat-total">
            <div className="stat-value">{analysis.summary.total}</div>
            <div className="stat-label">Total Clauses</div>
          </div>
          <div className="glass-card summary-stat stat-standard">
            <div className="stat-value">{analysis.summary.standard}</div>
            <div className="stat-label">Standard</div>
          </div>
          <div className="glass-card summary-stat stat-caution">
            <div className="stat-value">{analysis.summary.caution}</div>
            <div className="stat-label">Caution</div>
          </div>
          <div className="glass-card summary-stat stat-unfavorable">
            <div className="stat-value">{analysis.summary.unfavorable}</div>
            <div className="stat-label">Unfavorable</div>
          </div>
        </div>

        {/* Gotchas Summary */}
        <GotchasSummary
          gotchas={analysis.gotchas}
          onClauseClick={handleClauseClick}
        />

        {/* Clause-by-clause view */}
        <section style={{ marginTop: 'var(--space-2xl)' }} aria-label="Clause-by-clause analysis">
          <h2 style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 700,
            marginBottom: 'var(--space-lg)',
          }}>
            Clause Analysis
          </h2>
          <ClauseList
            clauses={analysis.clauses}
            onClauseSelect={handleClauseClick}
          />
        </section>
      </div>
    </div>
  );
}
