import React, { useState, useEffect } from 'react';
import { Shield, Key, Sun, Moon, Scale, CheckCircle2, Lock } from 'lucide-react';
import { GeminiService } from '../services/geminiService';

interface HeaderProps {
  piiRedactionEnabled: boolean;
  onTogglePiiRedaction: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  piiRedactionEnabled,
  onTogglePiiRedaction,
}) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    setApiKeyInput(GeminiService.getStoredApiKey());
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    GeminiService.setStoredApiKey(apiKeyInput);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setShowApiKeyModal(false);
    }, 1200);
  };

  return (
    <header className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Brand & Vertical Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div 
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--brand-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
            }}
            aria-hidden="true"
          >
            <Scale size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.35rem', margin: 0 }}>LexiGuard AI</h1>
              <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                Legal Co-Pilot
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
              AI for Legal Assistance & Access • Hack2skill Prompt Wars
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* PII Shield Toggle */}
          <button
            type="button"
            className={`btn btn-sm ${piiRedactionEnabled ? 'btn-primary' : 'btn-secondary'}`}
            onClick={onTogglePiiRedaction}
            title={piiRedactionEnabled ? 'PII Privacy Shield is ON' : 'PII Privacy Shield is OFF'}
            aria-pressed={piiRedactionEnabled}
            id="btn-pii-toggle"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {piiRedactionEnabled ? <Shield size={16} color="#10b981" /> : <Lock size={16} />}
            <span>PII Shield: {piiRedactionEnabled ? 'ACTIVE' : 'OFF'}</span>
          </button>

          {/* Gemini API Key Button */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowApiKeyModal(true)}
            id="btn-api-key"
            title="Configure Google Gemini API Key"
          >
            <Key size={15} />
            <span>API Key</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={toggleTheme}
            id="btn-theme-toggle"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle visual theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="api-modal-title"
        >
          <div 
            className="glass-panel" 
            style={{ 
              maxWidth: '480px', 
              width: '100%', 
              padding: '1.75rem', 
              background: 'var(--bg-surface-elevated)' 
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 id="api-modal-title" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={18} color="var(--brand-primary)" />
                Google Gemini API Setup
              </h2>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={() => setShowApiKeyModal(false)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              LexiGuard AI includes an instant offline legal NLP engine with 100% feature support. You can optionally connect your own <strong>Google Gemini API Key</strong> for live streaming generative legal Q&A.
            </p>

            <form onSubmit={handleSaveApiKey}>
              <label htmlFor="gemini-api-key-input" style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Gemini API Key:
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
                      <CheckCircle2 size={16} /> Saved!
                    </>
                  ) : (
                    'Save Key'
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
