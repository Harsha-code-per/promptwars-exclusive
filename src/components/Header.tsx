import React, { useState, useEffect } from 'react';
import { Shield, Key, Sun, Moon, Scale, CheckCircle2, Lock, Sparkles, Cpu } from 'lucide-react';
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
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [keySource, setKeySource] = useState<string>('OFFLINE_ENGINE');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    setApiKeyInput(GeminiService.getStoredApiKey());
    setIsLiveActive(GeminiService.isLiveGenAiActive());
    setKeySource(GeminiService.getApiKeySource());
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    GeminiService.setStoredApiKey(apiKeyInput);
    setIsLiveActive(GeminiService.isLiveGenAiActive());
    setKeySource(GeminiService.getApiKeySource());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setShowApiKeyModal(false);
    }, 1200);
  };

  return (
    <header className="glass-panel" style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        
        {/* Brand & Social Mission Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div 
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--brand-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.45)',
              flexShrink: 0
            }}
            aria-hidden="true"
          >
            <Scale size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--font-h2)', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                LexiGuard AI
              </span>
              <span className="badge badge-info" style={{ fontSize: '0.675rem' }}>
                Legal Co-Pilot
              </span>

              {/* GenAI Engine Status Pill */}
              {isLiveActive ? (
                <span className="badge badge-low" title={`Live GenAI active via ${keySource}`}>
                  <Sparkles size={11} /> Gemini 2.0 Live
                </span>
              ) : (
                <span className="badge badge-info" title="Dual-Engine: Intelligent Heuristic NLP Active">
                  <Cpu size={11} /> Local NLP Active
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
              AI for Legal Assistance & Access • Hack2skill Prompt Wars Virtual
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
          {/* PII Shield Toggle */}
          <button
            type="button"
            className={`btn btn-sm ${piiRedactionEnabled ? 'btn-primary' : 'btn-secondary'}`}
            onClick={onTogglePiiRedaction}
            title={piiRedactionEnabled ? 'PII Privacy Shield is ACTIVE' : 'PII Privacy Shield is OFF'}
            aria-pressed={piiRedactionEnabled}
            id="btn-pii-toggle"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {piiRedactionEnabled ? <Shield size={15} color="var(--impact-emerald)" /> : <Lock size={15} />}
            <span>PII Shield: {piiRedactionEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Gemini API Key Button */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowApiKeyModal(true)}
            id="btn-api-key"
            title="Configure Gemini API Key or View Env Var Status"
          >
            <Key size={14} />
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
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-md)',
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="api-modal-title"
        >
          <div 
            className="glass-panel" 
            style={{ 
              maxWidth: '520px', 
              width: '100%', 
              padding: 'var(--space-lg)', 
              background: 'var(--bg-surface-elevated)' 
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
              <h2 id="api-modal-title" style={{ fontSize: 'var(--font-h3)', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', margin: 0 }}>
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

            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
              LexiGuard AI supports production environment variables (<strong>VITE_GEMINI_API_KEY</strong>) in Vercel or local <code>.env</code>. You can also supply a custom API key below.
            </p>

            {/* Current Active Status */}
            <div style={{ background: 'var(--bg-surface)', padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-md)', border: '1px solid var(--border-subtle)', fontSize: 'var(--font-xs)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Current Status:</span>
              <span className={`badge ${isLiveActive ? 'badge-low' : 'badge-info'}`}>
                {isLiveActive ? `Live Active (${keySource})` : 'Local Heuristic Engine Active'}
              </span>
            </div>

            <form onSubmit={handleSaveApiKey}>
              <label htmlFor="gemini-api-key-input" style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, marginBottom: 'var(--space-2xs)' }}>
                Enter Custom Gemini API Key:
              </label>
              <input
                id="gemini-api-key-input"
                type="password"
                className="input-custom"
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                style={{ marginBottom: 'var(--space-md)' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-xs)' }}>
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
