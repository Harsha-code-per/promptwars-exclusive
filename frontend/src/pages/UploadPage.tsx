import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Scan, 
  FileSearch, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  Lock, 
  Zap,
  Scale,
  FileCheck
} from 'lucide-react';
import { FileUpload } from '../components/FileUpload';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { uploadDocument } from '../services/api';
import { SAMPLE_FREELANCE_CONTRACT, SAMPLE_LEASE_CONTRACT } from '../data/sampleContracts';
import type { DocumentType } from '../types';

/**
 * Upload page — Full-width centered grand layout (not split half-half).
 * Features an enlarged, prominent file upload card, instant sample chips,
 * and comprehensive capability sections.
 */
export function UploadPage() {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Support quick-loading sample contracts for seamless testing
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedDocType, setStagedDocType] = useState<DocumentType>('freelance_services');

  const handleUpload = useCallback(async (file: File, documentType: DocumentType) => {
    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadDocument(file, documentType);
      navigate(`/analysis/${result.documentId}`);
    } catch (err) {
      setError((err as Error).message);
      setIsUploading(false);
    }
  }, [navigate]);

  const loadSample = useCallback((type: DocumentType) => {
    const isFreelance = type === 'freelance_services';
    const text = isFreelance ? SAMPLE_FREELANCE_CONTRACT : SAMPLE_LEASE_CONTRACT;
    const filename = isFreelance ? 'Sample_Freelance_Contract.txt' : 'Sample_Residential_Lease.txt';
    const file = new File([text], filename, { type: 'text/plain' });
    
    setStagedFile(file);
    setStagedDocType(type);
    setError(null);

    // Smooth scroll down to the upload card so user sees it staged
    const el = document.getElementById('upload-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  return (
    <div className="page">
      <div className="container">
        
        {/* ========================================================
            HERO INTRO SECTION: Centered & Expansive (Not half-half)
            ======================================================== */}
        <section className="hero-centered-header" aria-label="Fenco introduction">
          <div className="hero-centered-badge">
            <Sparkles size={16} color="#000000" aria-hidden="true" />
            <span>AI-Powered Contract Risk Intelligence</span>
          </div>

          <h1 className="hero-centered-title">
            Audit Any Contract Before You Sign.
          </h1>

          <p className="hero-centered-subtitle">
            Don't let unilateral indemnification, payment delays, or hidden IP transfers put you at risk. Fenco decodes contracts clause-by-clause, exposes fine-print traps in plain English, and drafts ready-to-send counter-proposals.
          </p>

          {/* Quick Demo Contract Chips */}
          <div className="hero-sample-chips" aria-label="One-click sample testing">
            <div className="sample-chips-label">
              <Zap size={14} color="#000000" aria-hidden="true" />
              <span>Instant Demo Contracts:</span>
            </div>
            <div className="sample-chips-list">
              <button
                type="button"
                className="sample-chip-btn"
                onClick={() => loadSample('freelance_services')}
                aria-label="Load pre-built sample freelance contract"
              >
                <FileText size={15} color="#000000" aria-hidden="true" />
                <span>Load Sample Freelance Contract</span>
              </button>
              <button
                type="button"
                className="sample-chip-btn"
                onClick={() => loadSample('residential_lease')}
                aria-label="Load pre-built sample residential lease contract"
              >
                <FileText size={15} color="#000000" aria-hidden="true" />
                <span>Load Sample Residential Lease</span>
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================
            ENLARGED FILE UPLOAD BOX: Prominent, Centered, Spacious
            ======================================================== */}
        <section id="upload-section" className="upload-section-centered" aria-label="Contract upload interface">
          <div className="glass-card upload-card-enlarged" id="upload-card">
            <div className="upload-card-header">
              <h2 className="upload-card-title">Drop Your Agreement to Begin Audit</h2>
              <p className="upload-card-subtitle">
                Select your contract category, then upload a PDF or plain text agreement.
              </p>
            </div>

            <FileUpload 
              onUpload={handleUpload} 
              isUploading={isUploading}
              externalFile={stagedFile}
              externalDocType={stagedDocType}
            />

            {error && (
              <div className="upload-error-box" role="alert">
                <p>{error}</p>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================
            KEY HIGHLIGHTS ROW: 4 Trust Pillars
            ======================================================== */}
        <div className="pillars-grid" role="region" aria-label="Core benefits">
          <div className="glass-card pillar-card">
            <Scale size={24} color="#000000" aria-hidden="true" />
            <div>
              <h4>32+ Market Benchmarks</h4>
              <p>Indexed via pgvector for HNSW cosine similarity comparison</p>
            </div>
          </div>

          <div className="glass-card pillar-card">
            <CheckCircle2 size={24} color="#000000" aria-hidden="true" />
            <div>
              <h4>"Before You Sign" Gotchas</h4>
              <p>Plain-language warnings that highlight one-sided obligations</p>
            </div>
          </div>

          <div className="glass-card pillar-card">
            <FileCheck size={24} color="#000000" aria-hidden="true" />
            <div>
              <h4>Ready Counter-Drafts</h4>
              <p>Balanced alternative clauses with legal reasoning ready to email</p>
            </div>
          </div>

          <div className="glass-card pillar-card">
            <Lock size={24} color="#000000" aria-hidden="true" />
            <div>
              <h4>Zero Data Retention</h4>
              <p>Parameterized SQL queries with strict client-side data privacy</p>
            </div>
          </div>
        </div>

        {/* ========================================================
            FEATURES SECTION
            ======================================================== */}
        <section id="features" className="features-section" aria-label="Key Capabilities">
          <div className="section-header">
            <h2 className="section-title">Engineered for Fair Negotiations</h2>
            <p className="section-subtitle">
              Comprehensive legal risk analysis designed for freelancers, contractors, tenants, and independent teams.
            </p>
          </div>

          <div className="features-grid">
            <div className="glass-card feature-card">
              <div className="feature-icon-wrapper">
                <Scan size={28} color="#000000" aria-hidden="true" />
              </div>
              <h3>Intelligent Clause Splitting</h3>
              <p>
                Automatically decomposes legal agreements into 16 distinct categories using high-speed regex parsing with Gemini LLM boundary fallback.
              </p>
            </div>

            <div className="glass-card feature-card">
              <div className="feature-icon-wrapper">
                <FileSearch size={28} color="#000000" aria-hidden="true" />
              </div>
              <h3>Two-Tier Benchmark Scoring</h3>
              <p>
                Evaluates similarity against market standards using 768-dim embeddings, then runs Gemini 2.5 Flash to identify unfair clause deviations.
              </p>
            </div>

            <div className="glass-card feature-card">
              <div className="feature-icon-wrapper">
                <ShieldCheck size={28} color="#000000" aria-hidden="true" />
              </div>
              <h3>Automated Counter-Drafts</h3>
              <p>
                Generates professionally drafted, balanced clauses with persuasive explanations to protect you against harsh terms and liabilities.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================
            HOW IT WORKS SECTION
            ======================================================== */}
        <section id="how-it-works" className="steps-section" aria-label="How Fenco Works in Three Steps">
          <div className="section-header">
            <h2 className="section-title">How Fenco Works</h2>
            <p className="section-subtitle">Transform complex contract legalese into negotiation leverage in seconds.</p>
          </div>

          <div className="steps-grid">
            <div className="glass-card step-card">
              <div className="step-badge">01</div>
              <h3>Upload Contract</h3>
              <p>Drop your agreement (.pdf or .txt). Text is sanitized and extracted with zero third-party retention.</p>
            </div>

            <div className="glass-card step-card">
              <div className="step-badge">02</div>
              <h3>AI Clause Analysis</h3>
              <p>Each clause is parsed, embedded, and benchmarked against standard clauses using dual-stage AI.</p>
            </div>

            <div className="glass-card step-card">
              <div className="step-badge">03</div>
              <h3>Review & Counter</h3>
              <p>Inspect flagged gotchas, understand plain-language breakdowns, and copy ready-to-send counter-proposals.</p>
            </div>
          </div>
        </section>

        {/* ========================================================
            LEGAL SAFETY & DISCLAIMER SECTION
            ======================================================== */}
        <section id="disclaimer-section" className="disclaimer-section-wrapper" aria-label="Legal Disclaimers and Limitations">
          <DisclaimerBanner />
        </section>

      </div>
    </div>
  );
}
