import React from 'react';
import { ShieldCheck, Volume2, Scale, HeartHandshake, Eye } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section 
      style={{ 
        marginBottom: 'var(--space-lg)', 
        textAlign: 'center',
        padding: 'var(--space-lg) var(--space-md)',
        position: 'relative',
        overflow: 'hidden'
      }}
      aria-labelledby="hero-mission-title"
    >
      {/* Social Impact Mission Badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid var(--border-glow)', borderRadius: 'var(--radius-full)', padding: '0.35rem 1rem', marginBottom: 'var(--space-md)' }}>
        <HeartHandshake size={15} color="var(--brand-teal)" />
        <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--brand-teal)' }}>
          Public Good & Legal Empowerment Platform
        </span>
      </div>

      {/* Fluid Hero Title */}
      <h1 
        id="hero-mission-title" 
        className="hero-title"
        style={{ 
          maxWidth: '900px', 
          margin: '0 auto var(--space-sm)',
          background: 'linear-gradient(135deg, #ffffff 30%, #a5b4fc 70%, #818cf8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Democratizing Legal Protection. Stop Predatory Contracts.
      </h1>

      {/* Narrative Subtitle */}
      <p 
        style={{ 
          maxWidth: '750px', 
          margin: '0 auto var(--space-lg)', 
          fontSize: 'var(--font-body)', 
          color: 'var(--text-secondary)',
          lineHeight: 1.6 
        }}
      >
        Every year, millions of freelancers, independent contractors, and consumers sign away their intellectual property or accept unlimited liabilities hidden in dense legalese. <strong>LexiGuard AI</strong> levels the playing field—translating legalese into plain English, flagging critical traps, and arming you with fair counter-clauses.
      </p>

      {/* Feature / Trust Highlights Bar */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 'var(--space-sm)', 
          flexWrap: 'wrap',
          fontSize: 'var(--font-sm)',
          color: 'var(--text-tertiary)'
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Scale size={15} color="var(--brand-primary)" />
          5-Dimension Risk Matrix
        </span>
        <span>•</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Volume2 size={15} color="var(--brand-teal)" />
          Voice Accessible Reader
        </span>
        <span>•</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <ShieldCheck size={15} color="var(--impact-emerald)" />
          Client-Side PII Shield
        </span>
        <span>•</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Eye size={15} color="var(--impact-gold)" />
          Comparative Redline Diff
        </span>
      </div>
    </section>
  );
};
