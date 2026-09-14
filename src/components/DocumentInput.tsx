import React, { useState } from 'react';
import { FileText, Upload, Sparkles, ShieldCheck } from 'lucide-react';
import { SAMPLE_CONTRACTS } from '../data/sampleContracts';
import { SampleContract } from '../types/legal';
import { PIISanitizer, SanitizationReport } from '../services/piiSanitizer';

interface DocumentInputProps {
  onAnalyze: (text: string, title: string) => void;
  piiRedactionEnabled: boolean;
  isAnalyzing: boolean;
}

export const DocumentInput: React.FC<DocumentInputProps> = ({
  onAnalyze,
  piiRedactionEnabled,
  isAnalyzing,
}) => {
  const [selectedSampleId, setSelectedSampleId] = useState<string>('predatory-freelance');
  const [contractText, setContractText] = useState<string>(SAMPLE_CONTRACTS[0].content);
  const [contractTitle, setContractTitle] = useState<string>(SAMPLE_CONTRACTS[0].title);
  const [sanitizationReport, setSanitizationReport] = useState<SanitizationReport | null>(null);

  const handleSelectSample = (sample: SampleContract) => {
    setSelectedSampleId(sample.id);
    setContractText(sample.content);
    setContractTitle(sample.title);
    if (piiRedactionEnabled) {
      const rep = PIISanitizer.sanitize(sample.content);
      setSanitizationReport(rep);
    } else {
      setSanitizationReport(null);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContractText(text);
    if (piiRedactionEnabled) {
      const rep = PIISanitizer.sanitize(text);
      setSanitizationReport(rep);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractText.trim()) return;

    let textToAnalyze = contractText;
    if (piiRedactionEnabled) {
      const report = PIISanitizer.sanitize(contractText);
      textToAnalyze = report.sanitizedText;
    }

    onAnalyze(textToAnalyze, contractTitle);
  };

  return (
    <section className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }} aria-labelledby="input-heading">
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 id="input-heading" style={{ fontSize: '1.35rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={22} color="var(--brand-primary)" />
          Contract Ingestion & Analysis Hub
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Select a benchmark legal scenario below or paste any custom contract to generate risk radar scores, plain-English demystification, and redline negotiation strategies.
        </p>
      </div>

      {/* Benchmark Presets */}
      <div style={{ marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.6rem' }}>
          Quick Benchmark Scenarios (1-Click Evaluation):
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
          {SAMPLE_CONTRACTS.map((sample) => {
            const isSelected = selectedSampleId === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className={`btn btn-secondary`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--brand-primary-light)' : 'var(--bg-surface-elevated)',
                  borderColor: isSelected ? 'var(--brand-primary)' : 'var(--border-subtle)',
                  boxShadow: isSelected ? '0 0 12px rgba(99, 102, 241, 0.25)' : 'none',
                  transition: 'all var(--transition-fast)',
                }}
                id={`sample-btn-${sample.id}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{sample.title}</strong>
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
                <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                  {sample.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Upload and Text Input Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <label htmlFor="contract-editor" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Contract Text (Plain text or markdown):
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label 
              htmlFor="file-upload-input" 
              className="btn btn-secondary btn-sm"
              style={{ cursor: 'pointer', margin: 0 }}
            >
              <Upload size={14} />
              <span>Upload Document</span>
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

        <textarea
          id="contract-editor"
          className="textarea-custom"
          rows={9}
          value={contractText}
          onChange={handleTextChange}
          placeholder="Paste agreements, terms of service, employment contracts, or NDAs here..."
          aria-label="Contract content input"
          required
        />

        {/* PII Redaction Live Summary */}
        {piiRedactionEnabled && (
          <div 
            style={{ 
              marginTop: '0.75rem', 
              padding: '0.65rem 1rem', 
              background: 'rgba(16, 185, 129, 0.08)', 
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.825rem',
              color: 'var(--text-secondary)',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={17} color="#10b981" />
              <span>
                <strong>Privacy Shield Active:</strong> Sensitive PII (emails, phone numbers, SSNs, financial figures) will be automatically sanitized before sending to the AI model.
              </span>
            </div>
            {sanitizationReport && sanitizationReport.totalRedactions > 0 && (
              <span className="badge badge-low">
                {sanitizationReport.totalRedactions} Items Masked
              </span>
            )}
          </div>
        )}

        {/* Action Button */}
        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={isAnalyzing || !contractText.trim()}
            id="btn-analyze-contract"
            style={{ width: '100%', maxWidth: '320px' }}
          >
            {isAnalyzing ? (
              <>
                <div className="animate-pulse" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} />
                  <span>Evaluating Legal Risk Matrix...</span>
                </div>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Run LexiGuard Legal Triage</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};
