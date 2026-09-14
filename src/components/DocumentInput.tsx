import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  ShieldCheck, 
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { SAMPLE_CONTRACTS } from '../data/sampleContracts';
import { SampleContract, UserPersona, DocumentType } from '../types/legal';
import { PIISanitizer, SanitizationReport } from '../services/piiSanitizer';

interface DocumentInputProps {
  onAnalyze: (text: string, title: string, persona?: UserPersona, docType?: DocumentType) => void;
  piiRedactionEnabled: boolean;
  isAnalyzing: boolean;
}

export const DocumentInput: React.FC<DocumentInputProps> = ({
  onAnalyze,
  piiRedactionEnabled,
  isAnalyzing,
}) => {
  const [contractText, setContractText] = useState<string>(SAMPLE_CONTRACTS[0].content);
  const [contractTitle, setContractTitle] = useState<string>(SAMPLE_CONTRACTS[0].title);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(SAMPLE_CONTRACTS[0].id);
  const [selectedPersona, setSelectedPersona] = useState<UserPersona>('FREELANCER');
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('freelance_services');
  const [sanitizationReport, setSanitizationReport] = useState<SanitizationReport | null>(null);

  const wordCount = contractText.trim() ? contractText.trim().split(/\s+/).length : 0;
  const charCount = contractText.length;

  const handleSelectSample = (sample: SampleContract) => {
    setSelectedSampleId(sample.id);
    setContractText(sample.content);
    setContractTitle(sample.title);

    if (sample.id.includes('freelance')) {
      setSelectedPersona('FREELANCER');
      setSelectedDocType('freelance_services');
    } else if (sample.id.includes('saas')) {
      setSelectedPersona('MSME_VENDOR');
      setSelectedDocType('vendor_msa');
    } else if (sample.id.includes('employee')) {
      setSelectedPersona('EMPLOYEE');
      setSelectedDocType('employment_agreement');
    } else if (sample.id.includes('nda')) {
      setSelectedPersona('FREELANCER');
      setSelectedDocType('freelance_services');
    }

    if (piiRedactionEnabled) {
      const report = PIISanitizer.sanitize(sample.content);
      setSanitizationReport(report);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContractText(val);
    setSelectedSampleId('custom-text');

    if (piiRedactionEnabled && val.length > 20) {
      const report = PIISanitizer.sanitize(val);
      setSanitizationReport(report);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setContractTitle(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setContractText(content);
      setSelectedSampleId('custom-upload');
      if (piiRedactionEnabled) {
        setSanitizationReport(PIISanitizer.sanitize(content));
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    setContractText('');
    setContractTitle('Untitled Agreement');
    setSelectedSampleId('');
    setSanitizationReport(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractText.trim()) return;

    let textToAnalyze = contractText;
    if (piiRedactionEnabled) {
      const report = PIISanitizer.sanitize(contractText);
      textToAnalyze = report.sanitizedText;
    }

    onAnalyze(textToAnalyze, contractTitle, selectedPersona, selectedDocType);
  };

  return (
    <section className="glass-panel" style={{ padding: '2rem', width: '100%' }} aria-labelledby="input-heading">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 id="input-heading" style={{ fontSize: '1.35rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--text-primary)' }}>
          <FileText size={22} color="var(--brand-primary)" />
          Contract Ingestion & Analysis Hub
        </h2>
        <p style={{ fontSize: '0.885rem', color: 'var(--text-secondary)', margin: 0 }}>
          Select an industry benchmark scenario below or paste your agreement to generate statutory risk scores, plain-English demystification, and redline negotiation strategies.
        </p>
      </div>

      {/* Target User Persona & Context Logic Selector */}
      <div style={{ marginBottom: '1.5rem', width: '100%' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.5rem' }}>
          Target User Persona (Context-Aware Risk Logic):
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem' }}>
          {[
            { id: 'FREELANCER', label: 'Freelancer / Creator', docType: 'freelance_services', desc: 'Prioritizes IP ownership, Net-30 payment, Kill fee' },
            { id: 'TENANT', label: 'Tenant / Renter', docType: 'residential_lease', desc: 'Prioritizes Deposit escrow, 24h entry notice, repair rights' },
            { id: 'EMPLOYEE', label: 'Employee / Engineer', docType: 'employment_agreement', desc: 'Prioritizes FTC non-compete, personal hobby IP' },
            { id: 'MSME_VENDOR', label: 'MSME / Business Owner', docType: 'vendor_msa', desc: 'Prioritizes Bilateral indemnity, liability cap' },
          ].map((item) => {
            const isSelected = selectedPersona === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedPersona(item.id as UserPersona);
                  setSelectedDocType(item.docType as DocumentType);
                }}
                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'left',
                  border: isSelected ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                }}
                id={`persona-btn-${item.id}`}
              >
                <span style={{ fontWeight: 600, fontSize: '0.825rem' }}>{item.label}</span>
                <span style={{ fontSize: '0.7rem', opacity: isSelected ? 0.9 : 0.6, marginTop: '2px', lineHeight: 1.3 }}>{item.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Benchmark Presets in a Responsive Grid */}
      <div style={{ marginBottom: '1.75rem', width: '100%' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.75rem' }}>
          Industry Benchmark Contracts (1-Click Instant Evaluation):
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', width: '100%' }}>
          {SAMPLE_CONTRACTS.map((sample) => {
            const isSelected = selectedSampleId === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  padding: '1rem 1.15rem',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--brand-primary-light)' : '#ffffff',
                  borderColor: isSelected ? 'var(--brand-primary)' : 'var(--border-subtle)',
                  boxShadow: isSelected ? '0 0 0 2px var(--brand-primary)' : 'var(--shadow-sm)',
                  transition: 'all var(--transition-fast)',
                  height: '100%',
                  whiteSpace: 'normal',
                }}
                id={`sample-btn-${sample.id}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <strong style={{ fontSize: '0.865rem', color: 'var(--text-primary)' }}>{sample.title}</strong>
                  <span
                    className={`badge badge-${
                      sample.estimatedRisk === 'CRITICAL'
                        ? 'critical'
                        : sample.estimatedRisk === 'HIGH'
                        ? 'high'
                        : sample.estimatedRisk === 'MEDIUM'
                        ? 'medium'
                        : 'low'
                    }`}
                  >
                    {sample.estimatedRisk}
                  </span>
                </div>
                <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {sample.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Upload and Text Input Form */}
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        {/* Editor Toolbar Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <label htmlFor="contract-editor" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Contract Document Text:
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', background: 'var(--bg-subtle)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
              {wordCount} words • {charCount} characters
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {contractText && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleClear}
                title="Clear text editor"
              >
                <RotateCcw size={13} />
                <span>Clear</span>
              </button>
            )}

            <label 
              htmlFor="file-upload-input" 
              className="btn btn-secondary btn-sm"
              style={{ cursor: 'pointer', margin: 0 }}
            >
              <Upload size={14} />
              <span>Upload File</span>
              <input
                id="file-upload-input"
                type="file"
                accept=".txt,.md,.doc,.pdf"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {/* Full-Width Robust Textarea */}
        <div style={{ width: '100%', marginBottom: '0.85rem' }}>
          <textarea
            id="contract-editor"
            className="textarea-custom"
            rows={10}
            value={contractText}
            onChange={handleTextChange}
            placeholder="Paste raw agreements, terms of service, employment contracts, or NDAs here..."
            aria-label="Contract content input"
            required
            style={{
              width: '100%',
              minHeight: '260px',
              display: 'block',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* PII Redaction Live Summary */}
        {piiRedactionEnabled && (
          <div 
            style={{ 
              marginBottom: '1.25rem',
              padding: '0.65rem 1rem', 
              background: '#ecfdf5', 
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              color: '#065f46',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <ShieldCheck size={16} color="var(--impact-emerald)" />
              <span>
                <strong>Privacy Shield Active:</strong> Sensitive PII (names, emails, phone numbers, SSNs, financial figures) will be automatically sanitized before model processing.
              </span>
            </div>
            {sanitizationReport && sanitizationReport.totalRedactions > 0 && (
              <span className="badge badge-low" style={{ background: '#d1fae5', color: '#065f46' }}>
                <CheckCircle2 size={12} />
                {sanitizationReport.totalRedactions} Items Masked
              </span>
            )}
          </div>
        )}

        {/* Action Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isAnalyzing || !contractText.trim()}
            id="btn-analyze-contract"
            style={{ minWidth: '280px', padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
          >
            {isAnalyzing ? (
              <div className="animate-pulse" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} />
                <span>Evaluating Legal Risk Matrix...</span>
              </div>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} />
                <span>Run LexiGuard Legal Triage</span>
              </div>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};
