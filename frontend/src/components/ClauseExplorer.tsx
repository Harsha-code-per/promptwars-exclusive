import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  AlertTriangle, 
  Copy, 
  Check, 
  BookOpen, 
  Sparkles, 
  Search, 
  Filter,
  Volume2,
  VolumeX
} from 'lucide-react';
import { AnalyzedClause, LegalDimension } from '../types/legal';
import { GeminiService } from '../services/geminiService';
import { SpeechService } from '../services/speechService';

interface ClauseExplorerProps {
  clauses: AnalyzedClause[];
  selectedDimension?: LegalDimension | null;
  onClearDimensionFilter?: () => void;
}

export const ClauseExplorer: React.FC<ClauseExplorerProps> = ({
  clauses,
  selectedDimension,
  onClearDimensionFilter,
}) => {
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTabMap, setActiveTabMap] = useState<Record<string, 'plain' | 'original' | 'counter'>>({});
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [customCounterMap, setCustomCounterMap] = useState<Record<string, string>>({});
  const [speakingClauseId, setSpeakingClauseId] = useState<string | null>(null);

  // Stop speech when unmounting or switching
  useEffect(() => {
    return () => {
      SpeechService.stop();
    };
  }, []);

  const handleToggleSpeak = (clause: AnalyzedClause) => {
    if (speakingClauseId === clause.id) {
      SpeechService.stop();
      setSpeakingClauseId(null);
    } else {
      setSpeakingClauseId(clause.id);
      SpeechService.speak(
        `${clause.title}. ${clause.plainEnglish}`,
        () => setSpeakingClauseId(null),
        () => setSpeakingClauseId(null)
      );
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleGenerateCounter = async (clause: AnalyzedClause) => {
    setGeneratingId(clause.id);
    try {
      const generated = await GeminiService.generateCounterClause(clause);
      setCustomCounterMap((prev) => ({ ...prev, [clause.id]: generated }));
      setActiveTabMap((prev) => ({ ...prev, [clause.id]: 'counter' }));
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingId(null);
    }
  };

  const filteredClauses = clauses.filter((clause) => {
    if (selectedDimension && clause.dimension !== selectedDimension) return false;
    if (selectedRiskFilter !== 'ALL' && clause.riskLevel !== selectedRiskFilter) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        clause.title.toLowerCase().includes(query) ||
        clause.plainEnglish.toLowerCase().includes(query) ||
        clause.originalText.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <section aria-labelledby="clause-explorer-title" className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <div>
          <h2 id="clause-explorer-title" style={{ fontSize: 'var(--font-h2)', margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <BookOpen size={22} color="var(--brand-primary)" />
            Clause Demystifier & Voice Legal Reader
          </h2>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: 'var(--space-3xs) 0 0 0' }}>
            Simplifies complex legal language into plain English with built-in voice accessibility for non-lawyers and visually impaired users.
          </p>
        </div>

        {selectedDimension && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <span className="badge badge-info">Filtered: {selectedDimension.replace('_', ' ')}</span>
            <button 
              type="button" 
              className="btn btn-ghost btn-sm" 
              onClick={onClearDimensionFilter}
            >
              Clear Filter
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: 'var(--space-sm) var(--space-md)', 
          marginBottom: 'var(--space-md)', 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 'var(--space-sm)', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}
      >
        {/* Risk Level Filter Chips */}
        <div style={{ display: 'flex', gap: 'var(--space-2xs)', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginRight: 'var(--space-3xs)' }}>
            <Filter size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
            Risk Filter:
          </span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((risk) => (
            <button
              key={risk}
              type="button"
              className={`btn btn-sm ${selectedRiskFilter === risk ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedRiskFilter(risk)}
            >
              {risk}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', minWidth: '220px', flex: '1', maxWidth: '360px' }}>
          <Search size={15} color="var(--text-tertiary)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-custom"
            placeholder="Search clauses or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.2rem', fontSize: 'var(--font-sm)', padding: '0.45rem 0.75rem 0.45rem 2.2rem' }}
            aria-label="Search clauses"
          />
        </div>
      </div>

      {/* Clause Cards List */}
      {filteredClauses.length === 0 ? (
        <div className="glass-panel" style={{ padding: 'var(--space-2xl)', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <FileText size={40} color="var(--text-tertiary)" style={{ marginBottom: 'var(--space-sm)' }} />
          <h3>No clauses match your filter criteria</h3>
          <p style={{ fontSize: 'var(--font-sm)' }}>Try clearing your search query or selecting a different risk severity filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {filteredClauses.map((clause) => {
            const activeTab = activeTabMap[clause.id] || 'plain';
            const counterText = customCounterMap[clause.id] || clause.counterClause;
            const isCritical = clause.riskLevel === 'CRITICAL';
            const isSpeaking = speakingClauseId === clause.id;

            return (
              <article 
                key={clause.id}
                id={clause.id}
                className="glass-panel"
                style={{
                  padding: 'var(--space-md)',
                  borderLeft: `4px solid ${
                    isCritical
                      ? 'var(--risk-critical)'
                      : clause.riskLevel === 'HIGH'
                      ? 'var(--risk-high)'
                      : clause.riskLevel === 'MEDIUM'
                      ? 'var(--risk-medium)'
                      : 'var(--risk-low)'
                  }`,
                }}
              >
                {/* Clause Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: 'var(--space-3xs)' }}>
                      <span style={{ fontSize: 'var(--font-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                        Section {clause.clauseNumber || clause.id}
                      </span>
                      <span className={`badge badge-${clause.riskLevel.toLowerCase()}`}>
                        {clause.riskLevel} Risk
                      </span>
                      <span className="badge badge-info">
                        {clause.dimension.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 'var(--font-h3)', color: 'var(--text-primary)', margin: 0 }}>
                      {clause.title}
                    </h3>
                  </div>

                  {/* Sub-actions: Voice Reader & Counter-Clause */}
                  <div style={{ display: 'flex', gap: 'var(--space-xs)', alignItems: 'center' }}>
                    {/* Voice Legal Reader Button */}
                    <button
                      type="button"
                      className={`btn btn-sm ${isSpeaking ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleToggleSpeak(clause)}
                      title={isSpeaking ? 'Stop Voice Reader' : 'Listen to plain-English explanation (Web Speech)'}
                      aria-label={isSpeaking ? 'Stop reading' : 'Read clause aloud'}
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX size={14} />
                          <div className="speaking-wave" aria-hidden="true">
                            <div className="speaking-bar" />
                            <div className="speaking-bar" />
                            <div className="speaking-bar" />
                          </div>
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={14} color="var(--brand-teal)" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleGenerateCounter(clause)}
                      disabled={generatingId === clause.id}
                      title="Generate dynamic AI counter-amendment"
                    >
                      <Sparkles size={14} color="var(--brand-primary)" />
                      <span>{generatingId === clause.id ? 'Drafting...' : 'AI Counter-Clause'}</span>
                    </button>
                  </div>
                </div>

                {/* Sub-tabs */}
                <div style={{ display: 'flex', gap: 'var(--space-2xs)', borderBottom: '1px solid var(--border-subtle)', marginBottom: 'var(--space-sm)' }}>
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === 'plain' ? 'active' : ''}`}
                    onClick={() => setActiveTabMap((p) => ({ ...p, [clause.id]: 'plain' }))}
                    style={{ fontSize: 'var(--font-xs)', padding: 'var(--space-xs) var(--space-sm)' }}
                  >
                    Plain-English Demystifier
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === 'original' ? 'active' : ''}`}
                    onClick={() => setActiveTabMap((p) => ({ ...p, [clause.id]: 'original' }))}
                    style={{ fontSize: 'var(--font-xs)', padding: 'var(--space-xs) var(--space-sm)' }}
                  >
                    Original Legalese
                  </button>
                  {counterText && (
                    <button
                      type="button"
                      className={`tab-btn ${activeTab === 'counter' ? 'active' : ''}`}
                      onClick={() => setActiveTabMap((p) => ({ ...p, [clause.id]: 'counter' }))}
                      style={{ fontSize: 'var(--font-xs)', padding: 'var(--space-xs) var(--space-sm)' }}
                    >
                      Renegotiation Counter-Clause
                    </button>
                  )}
                </div>

                {/* Tab Content Display */}
                {activeTab === 'plain' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                    <div style={{ background: 'var(--bg-surface)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 'var(--space-3xs)' }}>
                        What This Actually Means:
                      </span>
                      <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', margin: 0, lineHeight: 1.6 }}>
                        {clause.plainEnglish}
                      </p>
                    </div>

                    <div style={{ background: isCritical ? 'var(--risk-critical-bg)' : 'var(--bg-surface)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)', border: `1px solid ${isCritical ? 'var(--risk-critical-border)' : 'var(--border-subtle)'}` }}>
                      <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: isCritical ? 'var(--risk-critical)' : 'var(--risk-medium)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: 'var(--space-3xs)' }}>
                        <AlertTriangle size={14} /> Practical Risk Exposure:
                      </span>
                      <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                        {clause.implications}
                      </p>
                    </div>

                    {clause.statutoryReference && (
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2xs)' }}>
                        <span>Statutory Context:</span>
                        <code style={{ background: 'var(--bg-surface-elevated)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                          {clause.statutoryReference}
                        </code>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'original' && (
                  <div style={{ background: 'var(--bg-surface)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                      {clause.originalText}
                    </pre>
                  </div>
                )}

                {activeTab === 'counter' && counterText && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                    <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glow)', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2xs)' }}>
                        <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Recommended Redlined Counter-Language:
                        </span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleCopy(clause.id, counterText)}
                          title="Copy counter-clause to clipboard"
                        >
                          {copiedId === clause.id ? <Check size={13} color="var(--impact-emerald)" /> : <Copy size={13} />}
                          <span>{copiedId === clause.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', fontSize: 'var(--font-sm)', color: 'var(--text-primary)', margin: 0, lineHeight: 1.6 }}>
                        {counterText}
                      </pre>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
