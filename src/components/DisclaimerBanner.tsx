import React from 'react';
import { AlertCircle } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <aside 
      aria-label="Legal Disclaimer"
      style={{
        background: 'var(--brand-gradient-subtle)',
        border: '1px solid var(--border-accent)',
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)'
      }}
    >
      <AlertCircle size={20} color="var(--brand-primary)" style={{ flexShrink: 0 }} aria-hidden="true" />
      <div>
        <strong style={{ color: 'var(--text-primary)' }}>Important Legal Information Notice:</strong>{' '}
        LexiGuard AI provides automated legal information, plain-English contract demystification, and risk triage. It does <strong>not</strong> provide legal advice or create an attorney-client relationship. Always consult a licensed attorney in your jurisdiction for formal legal decisions.
      </div>
    </aside>
  );
};
