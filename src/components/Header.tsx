import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Key, 
  Scale, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  BarChart3, 
  BookOpen, 
  MessageSquare, 
  GitCompare, 
  Briefcase 
} from 'lucide-react';
import { GeminiService } from '../services/geminiService';

interface HeaderProps {
  piiRedactionEnabled: boolean;
  onTogglePiiRedaction: () => void;
  activeTab: 'radar' | 'demystifier' | 'chat' | 'compare' | 'dossier';
  onSelectTab: (tab: 'radar' | 'demystifier' | 'chat' | 'compare' | 'dossier') => void;
}

export const Header: React.FC<HeaderProps> = ({
  piiRedactionEnabled,
  onTogglePiiRedaction,
  activeTab,
  onSelectTab,
}) => {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isEphemeralInput, setIsEphemeralInput] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [keySource, setKeySource] = useState<string>('OFFLINE_ENGINE');

  useEffect(() => {
    setApiKeyInput(GeminiService.getStoredApiKey());
    setIsLiveActive(GeminiService.isLiveGenAiActive());
    setKeySource(GeminiService.getApiKeySource());
  }, []);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEphemeralInput) {
      GeminiService.setEphemeralApiKey(apiKeyInput);
      GeminiService.setStoredApiKey('');
    } else {
      GeminiService.setStoredApiKey(apiKeyInput);
    }
    setIsLiveActive(GeminiService.isLiveGenAiActive());
    setKeySource(GeminiService.getApiKeySource());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setShowApiKeyModal(false);
    }, 1200);
  };

  const navItems: { id: 'radar' | 'demystifier' | 'chat' | 'compare' | 'dossier'; label: string; icon: React.ReactNode }[] = [
    { id: 'radar', label: 'Risk Radar', icon: <BarChart3 size={15} /> },
    { id: 'demystifier', label: 'Demystifier', icon: <BookOpen size={15} /> },
    { id: 'chat', label: 'Q&A Co-Pilot', icon: <MessageSquare size={15} /> },
    { id: 'compare', label: 'Redline Diff', icon: <GitCompare size={15} /> },
    { id: 'dossier', label: 'Attorney Dossier', icon: <Briefcase size={15} /> },
  ];

  return (
    <header className="navbar-wrapper">
      <div className="navbar-inner">
        {/* Left: Minimalist Google-style Brand */}
        <div className="navbar-brand-group">
          <div className="navbar-logo" aria-hidden="true">
            <Scale size={20} color="#ffffff" />
          </div>
          <div className="navbar-title-block">
            <span className="navbar-brand-name">
              LexiGuard<span className="navbar-brand-accent">AI</span>
            </span>
            <span className="navbar-divider" aria-hidden="true">|</span>
            <span className="navbar-subtitle">Contract Intelligence</span>
          </div>
        </div>

        {/* Center: Sleek Google Cloud Console style Navigation Tabs */}
        <nav className="navbar-nav" role="navigation" aria-label="Global Quick Nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`navbar-tab-btn ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Right: Minimalist Controls */}
        <div className="navbar-actions">
          {/* PII Shield Button */}
          <button
            type="button"
            className={`navbar-action-btn ${piiRedactionEnabled ? 'active' : ''}`}
            onClick={onTogglePiiRedaction}
            title={piiRedactionEnabled ? 'Privacy Shield: Active (Personal data sanitized)' : 'Privacy Shield: Off'}
            aria-pressed={piiRedactionEnabled}
            id="btn-pii-toggle"
          >
            <Shield size={14} />
            <span>PII Shield: {piiRedactionEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Engine / API Key Status Button */}
          <button
            type="button"
            className="navbar-engine-btn"
            onClick={() => setShowApiKeyModal(true)}
            id="btn-api-key"
            title={`GenAI Status: ${isLiveActive ? 'Gemini 3.8 Active' : 'Local NLP Active'}. Click to configure.`}
          >
            <span className={`status-indicator-dot ${isLiveActive ? 'active' : 'idle'}`} aria-hidden="true" />
            <Key size={13} style={{ opacity: 0.7 }} />
            <span>{isLiveActive ? 'Gemini 3.8' : 'Local NLP'}</span>
          </button>
        </div>
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div 
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="api-modal-title"
        >
          <div className="modal-dialog">
            <div className="modal-header">
              <h2 id="api-modal-title" className="modal-title">
                <Key size={18} color="var(--brand-primary)" />
                GenAI & Gemini 3.8 Cascade Settings
              </h2>
              <button 
                type="button" 
                className="btn-modal-close" 
                onClick={() => setShowApiKeyModal(false)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {/* Vercel Environment Variable Notice */}
            <div className="modal-callout">
              <div className="modal-callout-title">
                <AlertCircle size={14} /> Vercel Deployment Key Note:
              </div>
              <p>
                In Vercel Settings, name the secret <code>GEMINI_API_KEY</code> and select <strong>Secret</strong>. LexiGuard AI uses a dedicated serverless Edge proxy so your credentials never touch client browsers.
              </p>
            </div>

            {/* Active Cascade Status */}
            <div className="modal-status-row">
              <span style={{ color: 'var(--text-secondary)' }}>Cascade Engine Status:</span>
              <span className={`badge ${isLiveActive ? 'badge-low' : 'badge-info'}`}>
                {isLiveActive ? `Live (${keySource})` : 'Deterministic NLP Engine Active'}
              </span>
            </div>

            <form onSubmit={handleSaveApiKey}>
              <label htmlFor="gemini-api-key-input" className="modal-label">
                Custom Gemini API Key:
              </label>
              <input
                id="gemini-api-key-input"
                type="password"
                className="input-custom"
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                style={{ marginBottom: '1rem' }}
              />

              {/* One-Time Ephemeral Toggle */}
              <div className="modal-ephemeral-card">
                <input
                  type="checkbox"
                  id="ephemeral-check"
                  checked={isEphemeralInput}
                  onChange={(e) => setIsEphemeralInput(e.target.checked)}
                  style={{ accentColor: 'var(--impact-emerald)' }}
                />
                <label htmlFor="ephemeral-check" className="modal-ephemeral-label">
                  <Trash2 size={14} color="var(--impact-emerald)" />
                  <span>
                    <strong>One-Time Ephemeral Use</strong>: Immediately auto-deletes key from RAM after one query. Zero local retention.
                  </span>
                </label>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => setShowApiKeyModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-sm" 
                  id="btn-save-key"
                >
                  {savedSuccess ? (
                    <>
                      <CheckCircle2 size={15} /> Saved!
                    </>
                  ) : (
                    'Apply Key'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
