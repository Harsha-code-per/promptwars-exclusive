import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { LexiGuardLogo } from './components/LexiGuardLogo';
import { UploadPage } from './pages/UploadPage';
import { AnalysisPage } from './pages/AnalysisPage';

/**
 * LexiGuard AI — Accessible App Shell with Light Dante Peak Design
 */
function App() {
  return (
    <BrowserRouter>
      {/* Accessibility Skip Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Accessible Navigation Header */}
      <header className="navbar" role="banner">
        <div className="navbar-inner">
          {/* Brand */}
          <Link to="/" className="navbar-brand" aria-label="LexiGuard AI — Contract Risk Intelligence Home">
            <LexiGuardLogo size={36} />
            <div className="brand-text-group">
              <span className="brand-title">LexiGuard AI</span>
              <span className="brand-badge">Legal Empowerment Platform</span>
            </div>
          </Link>

          {/* Accessible Nav Links */}
          <nav className="navbar-nav" role="navigation" aria-label="Primary page navigation">
            <a href="/#how-it-works" className="nav-item">
              How It Works
            </a>
            <a href="/#features" className="nav-item">
              Features
            </a>
            <a href="/#disclaimer-section" className="nav-item">
              Legal Safety
            </a>
          </nav>

          {/* Quick Actions & Status */}
          <div className="navbar-actions">
            <div className="nav-status-indicator" aria-label="Engine status: Gemini 2.5 Flash active">
              <span className="status-dot" aria-hidden="true"></span>
              <span className="status-text">Gemini Ready</span>
            </div>

            <a href="/#upload-section" className="btn btn-sm btn-primary" aria-label="Go to contract upload box">
              <ShieldCheck size={15} aria-hidden="true" />
              Audit Agreement
            </a>
          </div>
        </div>
      </header>

      {/* Main Page Landmark */}
      <main id="main-content" role="main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/analysis/:id" element={<AnalysisPage />} />
        </Routes>
      </main>

      {/* Accessible Footer */}
      <footer className="footer-container" role="contentinfo">
        <div className="container footer-content">
          <div className="footer-brand-summary">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LexiGuardLogo size={24} />
              <strong style={{ color: '#000000', fontSize: 'var(--font-size-sm)' }}>LexiGuard AI</strong>
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', marginTop: '6px', color: '#262626' }}>
              Intelligent clause-by-clause contract risk auditing & automated counter-drafting.
            </p>
          </div>

          <div className="footer-disclaimer-text">
            <p>
              <strong>Informational analysis only — not legal advice.</strong> LexiGuard AI does not offer formal legal representation. Always consult a licensed attorney prior to executing binding agreements.
            </p>
            <p style={{ marginTop: '4px', fontSize: 'var(--font-size-xs)', color: '#404040' }}>
              Built for AI for Legal Assistance & Access • Powered by Google Gemini 2.5 Flash & pgvector
            </p>
          </div>
        </div>
      </footer>
    </BrowserRouter>
  );
}

export default App;
