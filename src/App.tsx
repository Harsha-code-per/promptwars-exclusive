import React, { useState } from 'react';
import { 
  BookOpen, 
  MessageSquare, 
  GitCompare, 
  Briefcase, 
  BarChart3,
  Scale
} from 'lucide-react';
import { Header } from './components/Header';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { DocumentInput } from './components/DocumentInput';
import { RiskRadar } from './components/RiskRadar';
import { ClauseExplorer } from './components/ClauseExplorer';
import { LegalChat } from './components/LegalChat';
import { ContractDiff } from './components/ContractDiff';
import { AttorneyDossier } from './components/AttorneyDossier';
import { SAMPLE_CONTRACTS } from './data/sampleContracts';
import { LegalAnalyzer } from './services/legalAnalyzer';
import { ContractAnalysis, LegalDimension } from './types/legal';

export const App: React.FC = () => {
  const [piiRedactionEnabled, setPiiRedactionEnabled] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'radar' | 'demystifier' | 'chat' | 'compare' | 'dossier'>('radar');
  const [selectedDimension, setSelectedDimension] = useState<LegalDimension | null>(null);

  // Initialize with the Predatory Freelancer Agreement so the dashboard is immediately populated
  const [currentText, setCurrentText] = useState<string>(SAMPLE_CONTRACTS[0].content);
  const [analysis, setAnalysis] = useState<ContractAnalysis>(() => 
    LegalAnalyzer.analyzeContract(SAMPLE_CONTRACTS[0].content, SAMPLE_CONTRACTS[0].title)
  );

  const handleAnalyze = (text: string, title: string) => {
    setIsAnalyzing(true);
    setCurrentText(text);

    // Provide smooth transition effect
    setTimeout(() => {
      const result = LegalAnalyzer.analyzeContract(text, title);
      setAnalysis(result);
      setIsAnalyzing(false);
      setActiveTab('radar');
    }, 450);
  };

  const handleSelectDimension = (dim: LegalDimension) => {
    setSelectedDimension(dim);
    setActiveTab('demystifier');
  };

  const handleNavigateToClause = (clauseId: string) => {
    setActiveTab('demystifier');
    setSelectedDimension(null);
    setTimeout(() => {
      const element = document.getElementById(clauseId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.style.outline = '3px solid var(--brand-primary)';
        setTimeout(() => {
          element.style.outline = 'none';
        }, 2500);
      }
    }, 150);
  };

  return (
    <div className="app-container">
      {/* Skip Navigation Link for Screen Readers & Keyboard Access */}
      <a 
        href="#main-content" 
        className="sr-only"
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 9999,
          background: 'var(--brand-primary)',
          color: '#ffffff',
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        Skip to main legal content
      </a>

      {/* Header */}
      <Header
        piiRedactionEnabled={piiRedactionEnabled}
        onTogglePiiRedaction={() => setPiiRedactionEnabled(!piiRedactionEnabled)}
        activeTab={activeTab}
      />

      {/* Persistent Legal Disclaimer */}
      <DisclaimerBanner />

      <main id="main-content">
        {/* Document Ingestion & Sample Preset Hub */}
        <DocumentInput
          onAnalyze={handleAnalyze}
          piiRedactionEnabled={piiRedactionEnabled}
          isAnalyzing={isAnalyzing}
        />

        {/* Feature Navigation Tabs */}
        <nav 
          className="tabs-nav" 
          role="tablist" 
          aria-label="Legal Assistant Capabilities"
          style={{ marginBottom: '1.5rem' }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'radar'}
            aria-controls="panel-radar"
            id="tab-radar"
            className={`tab-btn ${activeTab === 'radar' ? 'active' : ''}`}
            onClick={() => setActiveTab('radar')}
          >
            <BarChart3 size={17} />
            <span>Risk Radar & Scorecard</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'demystifier'}
            aria-controls="panel-demystifier"
            id="tab-demystifier"
            className={`tab-btn ${activeTab === 'demystifier' ? 'active' : ''}`}
            onClick={() => setActiveTab('demystifier')}
          >
            <BookOpen size={17} />
            <span>Clause Demystifier ({analysis.clauses.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'chat'}
            aria-controls="panel-chat"
            id="tab-chat"
            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={17} />
            <span>Grounded Q&A Co-Pilot</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'compare'}
            aria-controls="panel-compare"
            id="tab-compare"
            className={`tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
            onClick={() => setActiveTab('compare')}
          >
            <GitCompare size={17} />
            <span>Contract Comparison Studio</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'dossier'}
            aria-controls="panel-dossier"
            id="tab-dossier"
            className={`tab-btn ${activeTab === 'dossier' ? 'active' : ''}`}
            onClick={() => setActiveTab('dossier')}
          >
            <Briefcase size={17} />
            <span>Attorney Consultation Dossier</span>
          </button>
        </nav>

        {/* Tab Panel 1: Risk Radar */}
        {activeTab === 'radar' && (
          <div id="panel-radar" role="tabpanel" aria-labelledby="tab-radar">
            <RiskRadar 
              analysis={analysis} 
              onSelectDimension={handleSelectDimension} 
            />
          </div>
        )}

        {/* Tab Panel 2: Clause Demystifier */}
        {activeTab === 'demystifier' && (
          <div id="panel-demystifier" role="tabpanel" aria-labelledby="tab-demystifier">
            <ClauseExplorer
              clauses={analysis.clauses}
              selectedDimension={selectedDimension}
              onClearDimensionFilter={() => setSelectedDimension(null)}
            />
          </div>
        )}

        {/* Tab Panel 3: Grounded Q&A Assistant */}
        {activeTab === 'chat' && (
          <div id="panel-chat" role="tabpanel" aria-labelledby="tab-chat">
            <LegalChat
              contractText={currentText}
              clauses={analysis.clauses}
              onNavigateToClause={handleNavigateToClause}
            />
          </div>
        )}

        {/* Tab Panel 4: Contract Comparison & Redline */}
        {activeTab === 'compare' && (
          <div id="panel-compare" role="tabpanel" aria-labelledby="tab-compare">
            <ContractDiff />
          </div>
        )}

        {/* Tab Panel 5: Attorney Consultation Dossier */}
        {activeTab === 'dossier' && (
          <div id="panel-dossier" role="tabpanel" aria-labelledby="tab-dossier">
            <AttorneyDossier analysis={analysis} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer 
        style={{ 
          marginTop: '3.5rem', 
          padding: '1.5rem 0', 
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          fontSize: '0.8rem', 
          color: 'var(--text-tertiary)',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Scale size={16} color="var(--brand-primary)" />
          <span>LexiGuard AI • Hack2skill Prompt Wars Virtual Exclusive Round</span>
        </div>
        <div>
          <span>Vertical: AI for Legal Assistance & Access • WCAG 2.1 AA Compliant</span>
        </div>
      </footer>
    </div>
  );
};
