import React, { useState, useEffect } from 'react';
import { Shield, Key, Scale, CheckCircle2, Lock, Sparkles, Cpu, AlertCircle, Trash2 } from 'lucide-react';
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
      GeminiService.setStoredApiKey(''); // Ensure not persisted
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

  return (
    <header className="sticky-header">
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        
        {/* Brand & Social Mission Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div 
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--brand-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
              flexShrink: 0
            }}
            aria-hidden="true"
          >
            <Scale size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--font-h2)', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                LexiGuard AI
              </span>
              <span className="badge badge-info" style={{ fontSize: '0.675rem' }}>
                Legal Co-Pilot
              </span>

              {/* GenAI Engine Status Pill */}
              {isLiveActive ? (
                <span className="badge badge-low" title={`Live GenAI active via ${keySource}`}>
                  <Sparkles size={11} /> Gemini 3.8 Cascade Live
                </span>
              ) : (
                <span className="badge badge-info" title="Dual-Engine: Deterministic Legal NLP Active">
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
            {piiRedactionEnabled ? <Shield size={14} color="#ffffff" /> : <Lock size={14} />}
            <span>PII Shield: {piiRedactionEnabled ? 'ACTIVE' : 'OFF'}</span>
          </button>

          {/* Gemini API Key Button */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowApiKeyModal(true)}
            id="btn-api-key"
            title="Configure Gemini API Key or View Cascade Status"
          >
            <Key size={14} />
            <span>API Settings</span>
          </button>
        </div>
      </div>

      {/* API Key Configuration Modal */}
      {showApiKeyModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
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
              maxWidth: '540px', 
              width: '100%', 
              padding: 'var(--space-lg)', 
              background: '#ffffff',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
              <h2 id="api-modal-title" style={{ fontSize: 'var(--font-h3)', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', margin: 0, color: 'var(--text-primary)' }}>
                <Key size={18} color="var(--brand-primary)" />
                GenAI & Gemini 3.8 Cascade Setup
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

            {/* Vercel Environment Variable Explanation Notice */}
            <div style={{ background: '#f8fafc', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: 'var(--space-md)', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand-primary)', fontWeight: 700, marginBottom: '0.2rem' }}>
                <AlertCircle size={14} /> Vercel Deployment Tip:
              </div>
              When adding <code>VITE_GEMINI_API_KEY</code> in Vercel Project Settings, select the <strong>"Config"</strong> radio button (not "Secret"). Client build frameworks bundle VITE variables for client execution.
            </div>

            {/* Active Cascade Status */}
            <div style={{ background: 'var(--bg-subtle)', padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-md)', border: '1px solid var(--border-subtle)', fontSize: 'var(--font-xs)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Cascade LLM Status:</span>
              <span className={`badge ${isLiveActive ? 'badge-low' : 'badge-info'}`}>
                {isLiveActive ? `Live Active (${keySource})` : 'Local Heuristic Engine Active'}
              </span>
            </div>

            <form onSubmit={handleSaveApiKey}>
              <label htmlFor="gemini-api-key-input" style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-3xs)' }}>
                Google Gemini API Key:
              </label>
              <input
                id="gemini-api-key-input"
                type="password"
                className="input-custom"
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                style={{ marginBottom: 'var(--space-sm)' }}
              />

              {/* One-Time Ephemeral Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--space-md)', background: '#ecfdf5', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #a7f3d0' }}>
                <input
                  type="checkbox"
                  id="ephemeral-check"
                  checked={isEphemeralInput}
                  onChange={(e) => setIsEphemeralInput(e.target.checked)}
                  style={{ accentColor: 'var(--impact-emerald)' }}
                />
                <label htmlFor="ephemeral-check" style={{ fontSize: 'var(--font-xs)', color: '#065f46', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Trash2 size={13} />
                  <strong>One-Time Use (Auto-delete after query)</strong>: Purges key from memory immediately after execution for maximum privacy.
                </label>
              </div>

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
