import React from 'react';
import { ShieldCheck, Volume2, Scale, HeartHandshake, Eye, Sparkles } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section 
      style={{ 
        marginBottom: 'var(--space-lg)', 
        textAlign: 'center',
        padding: 'var(--space-lg) var(--space-xs)',
        position: 'relative',
      }}
      aria-labelledby="hero-mission-title"
    >
      {/* Social Impact Pill Badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)', background: 'var(--brand-primary-light)', border: '1px solid var(--border-glow)', borderRadius: 'var(--radius-full)', padding: '0.35rem 1rem', marginBottom: 'var(--space-md)' }}>
        <HeartHandshake size={15} color="var(--brand-primary)" />
        <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--brand-primary)' }}>
          Public Good & Legal Empowerment Platform
        </span>
      </div>

      {/* Hero Title with Deep Obsidian Gradient */}
      <h1 
        id="hero-mission-title" 
        className="hero-title"
        style={{ 
          maxWidth: '920px', 
          margin: '0 auto var(--space-sm)',
          color: 'var(--text-primary)',
          letterSpacing: '-0.035em'
        }}
      >
        Democratizing Legal Protection.{' '}
        <span style={{ background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Stop Predatory Contracts.
        </span>
      </h1>

      {/* High-Contrast Narrative Subtitle */}
      <p 
        style={{ 
          maxWidth: '780px', 
          margin: '0 auto var(--space-lg)', 
          fontSize: 'var(--font-body)', 
          color: 'var(--text-secondary)',
          lineHeight: 1.65 
        }}
      >
        Every year, millions of freelancers, independent contractors, and everyday consumers sign away their intellectual property or accept unlimited liabilities hidden in dense legalese. <strong>LexiGuard AI</strong> levels the playing field—translating complex legalese into plain English, spotlighting critical traps, and arming you with fair counter-clauses.
      </p>

      {/* Feature / Trust Highlights Bar */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 'var(--space-md)', 
          flexWrap: 'wrap',
          fontSize: 'var(--font-sm)',
          color: 'var(--text-tertiary)',
          fontWeight: 500
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
          <Scale size={16} color="var(--brand-primary)" />
          5-Dimension Statutory Matrix
        </span>
        <span style={{ color: 'var(--border-strong)' }}>•</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
          <Volume2 size={16} color="var(--brand-teal)" />
          Voice Legal Reader (Web Speech)
        </span>
        <span style={{ color: 'var(--border-strong)' }}>•</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
          <ShieldCheck size={16} color="var(--impact-emerald)" />
          Client-Side PII Shield
        </span>
        <span style={{ color: 'var(--border-strong)' }}>•</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
          <Eye size={16} color="var(--risk-high)" />
          Comparative Redline Diff
        </span>
        <span style={{ color: 'var(--border-strong)' }}>•</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
          <Sparkles size={16} color="var(--brand-secondary)" />
          Gemini 3.8 Cascade Engine
        </span>
      </div>
    </section>
  );
};
