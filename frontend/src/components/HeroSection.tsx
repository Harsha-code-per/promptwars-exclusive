import React from 'react';
import { ShieldCheck, Volume2, Scale, ArrowDown, Cpu } from 'lucide-react';

interface HeroSectionProps {
  onExplorePresets?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExplorePresets }) => {
  return (
    <section className="hero-container" aria-labelledby="hero-title">
      <div className="hero-content">
        {/* Sleek Subtitle Label (No pill badge, clean typography) */}
        <div className="hero-category-label">
          AI-POWERED CONTRACT RISK TRIAGE & STATUTORY FAIRNESS
        </div>

        {/* Hero Title */}
        <h1 id="hero-title" className="hero-headline">
          Contract Intelligence for Everyday People.{' '}
          <span className="hero-gradient-text">
            Clarity Before You Sign.
          </span>
        </h1>

        {/* Narrative Subtitle */}
        <p className="hero-subtitle">
          Independent creators, freelancers, and small businesses unknowingly surrender their intellectual property and accept uncapped liabilities buried in dense legalese. <strong>LexiGuard AI</strong> levels the playing field—demystifying complex agreements into plain English, flagging critical traps, and arming you with fair counter-clauses.
        </p>

        {/* Clean Action Buttons */}
        <div className="hero-actions">
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={onExplorePresets}
            id="btn-hero-analyze"
            style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
          >
            <span>Analyze Contracts Below</span>
            <ArrowDown size={16} />
          </button>
          <a 
            href="https://github.com/Harsha-code-per/promptwars-exclusive#readme" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
          >
            <span>System Architecture & Docs</span>
          </a>
        </div>

        {/* Minimal Google-Style 4-Feature Metric Strip */}
        <div className="hero-feature-grid">
          <div className="hero-feature-card">
            <div className="hero-feature-icon" style={{ color: 'var(--brand-primary)' }}>
              <Scale size={22} />
            </div>
            <div>
              <div className="hero-feature-title">5-Dimension Risk Matrix</div>
              <div className="hero-feature-desc">Liability, IP rights, termination, non-competes, and dispute venues.</div>
            </div>
          </div>

          <div className="hero-feature-card">
            <div className="hero-feature-icon" style={{ color: 'var(--brand-teal)' }}>
              <Volume2 size={22} />
            </div>
            <div>
              <div className="hero-feature-title">Voice Legal Reader</div>
              <div className="hero-feature-desc">Native audio speech synthesis for visual and reading accessibility.</div>
            </div>
          </div>

          <div className="hero-feature-card">
            <div className="hero-feature-icon" style={{ color: 'var(--impact-emerald)' }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="hero-feature-title">Client-Side PII Shield</div>
              <div className="hero-feature-desc">Zero personal data leakage; automated client-side sanitization.</div>
            </div>
          </div>

          <div className="hero-feature-card">
            <div className="hero-feature-icon" style={{ color: 'var(--brand-secondary)' }}>
              <Cpu size={22} />
            </div>
            <div>
              <div className="hero-feature-title">Gemini 3.8 Cascade</div>
              <div className="hero-feature-desc">State-of-the-art multi-model failover backed by deterministic NLP.</div>
            </div>
          </div>
        </div>

        {/* Subtle Scroll Down Prompt Indicator */}
        <div 
          onClick={onExplorePresets}
          style={{ 
            marginTop: '2.5rem', 
            cursor: 'pointer', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            fontSize: '0.8rem', 
            color: 'var(--text-tertiary)',
            opacity: 0.85
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') onExplorePresets?.(); }}
        >
          <span>Scroll down to enter or test legal agreements</span>
          <ArrowDown size={14} className="animate-bounce" />
        </div>
      </div>
    </section>
  );
};
