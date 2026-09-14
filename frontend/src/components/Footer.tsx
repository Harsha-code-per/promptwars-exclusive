import React from 'react';
import { Scale, ShieldCheck, Cpu, ExternalLink, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer-wrapper" role="contentinfo" aria-label="Site Footer">
      <div className="footer-inner">
        {/* Top 4-Column Grid */}
        <div className="footer-grid">
          {/* Column 1: Brand & Social Impact Mission */}
          <div className="footer-col">
            <div className="footer-brand">
              <div className="footer-logo" aria-hidden="true">
                <Scale size={20} color="#ffffff" />
              </div>
              <span className="footer-brand-name">
                LexiGuard <span className="footer-brand-ai">AI</span>
              </span>
            </div>
            <p className="footer-description">
              An open, public-good legal intelligence platform dedicated to protecting creators, independent contractors, and everyday consumers from predatory contract terms through context-grounded AI.
            </p>
            <div className="footer-badges">
              <span className="footer-chip">
                <ShieldCheck size={13} color="var(--impact-emerald)" />
                Client-Side PII Shield
              </span>
              <span className="footer-chip">
                <Sparkles size={13} color="var(--brand-primary)" />
                Gemini 3.8 Cascade
              </span>
              <span className="footer-chip">
                <Cpu size={13} color="var(--brand-secondary)" />
                WCAG 2.1 AA
              </span>
            </div>
          </div>

          {/* Column 2: Analysis Capabilities */}
          <div className="footer-col">
            <h4 className="footer-heading">Analysis Capabilities</h4>
            <ul className="footer-links">
              <li><a href="#radar">5-Dimension Risk Radar</a></li>
              <li><a href="#demystifier">Clause Demystifier & Voice Reader</a></li>
              <li><a href="#chat">Grounded Legal Q&A Co-Pilot</a></li>
              <li><a href="#compare">Comparative Redline Diff Studio</a></li>
              <li><a href="#dossier">Attorney Consultation Dossier</a></li>
              <li><span>Top 3 "Before You Sign" Gotchas</span></li>
            </ul>
          </div>

          {/* Column 3: Trust, Privacy & Ethics */}
          <div className="footer-col">
            <h4 className="footer-heading">Trust & Zero-Trust Privacy</h4>
            <ul className="footer-links">
              <li><span>Client-Side PII Sanitization</span></li>
              <li><span>Ephemeral Key Auto-Deletion</span></li>
              <li><span>Statutory Fairness Taxonomy</span></li>
              <li><span>Zero Contract Data Retention</span></li>
              <li><span>Deterministic Local NLP Fallback</span></li>
              <li><span>Web Speech Audio Accessibility</span></li>
            </ul>
          </div>

          {/* Column 4: Platform & Hackathon */}
          <div className="footer-col">
            <h4 className="footer-heading">Platform & Event</h4>
            <ul className="footer-links">
              <li>
                <a 
                  href="https://github.com/Harsha-code-per/promptwars-exclusive" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  GitHub Repository <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a 
                  href="https://lexiguard-ai-self.vercel.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  Live Application <ExternalLink size={12} />
                </a>
              </li>
              <li><span>Hack2skill Prompt Wars Virtual</span></li>
              <li><span>Top 400 Exclusive Round</span></li>
              <li><span>Vertical: AI for Legal Assistance</span></li>
              <li><span>System Status: Fully Operational</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <span>© {new Date().getFullYear()} LexiGuard AI. Built for public good and legal empowerment.</span>
          </div>

          <div className="footer-bottom-right">
            <span>Important Notice: LexiGuard AI provides automated legal information and triage. It does not provide formal legal advice or create an attorney-client relationship.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
