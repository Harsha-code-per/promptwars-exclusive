import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Shield, 
  Key, 
  Scale, 
  CheckCircle2, 
  Trash2,
  Lock
} from 'lucide-react';
import { GeminiService } from '../services/geminiService';

interface HeaderProps {
  piiRedactionEnabled: boolean;
  onTogglePiiRedaction: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  piiRedactionEnabled,
  onTogglePiiRedaction,
}) => {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isEphemeralInput, setIsEphemeralInput] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);

  useEffect(() => {
    setApiKeyInput(GeminiService.getStoredApiKey());
    setIsLiveActive(GeminiService.isLiveGenAiActive());
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
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setShowApiKeyModal(false);
    }, 1200);
  };

  return (
    <>
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
              {piiRedactionEnabled ? <Shield size={14} color="#059669" /> : <Lock size={14} />}
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
      </header>

      {/* API Key Modal Rendered Directly to document.body via Portal */}
      {showApiKeyModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="api-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowApiKeyModal(false);
          }}
        >
          <div className="modal-dialog">
            <div className="modal-header">
              <h2 id="api-modal-title" className="modal-title">
                <Key size={20} color="var(--brand-primary)" />
                Gemini API Key
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

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              Optionally enter your personal Google Gemini API key. With Ephemeral Use enabled, your key is purged from memory immediately after execution.
            </p>

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
                style={{ marginBottom: '1.25rem' }}
                autoFocus
              />

              {/* One-Time Ephemeral Toggle */}
              <div className="modal-ephemeral-card">
                <input
                  type="checkbox"
                  id="ephemeral-check"
                  checked={isEphemeralInput}
                  onChange={(e) => setIsEphemeralInput(e.target.checked)}
                  style={{ accentColor: 'var(--impact-emerald)', marginTop: '2px' }}
                />
                <label htmlFor="ephemeral-check" className="modal-ephemeral-label">
                  <Trash2 size={15} color="var(--impact-emerald)" style={{ flexShrink: 0 }} />
                  <span>
                    <strong>One-Time Ephemeral Use (Recommended)</strong>: Consumes and auto-deletes the key from RAM immediately after query execution. Zero local retention.
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
        </div>,
        document.body
      )}
    </>
  );
};
