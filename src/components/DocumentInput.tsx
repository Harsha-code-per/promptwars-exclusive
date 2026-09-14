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
    <section className="glass-panel" style={{ padding: 'var(--space-md) var(--space-lg)', marginBottom: 'var(--space-lg)', width: '100%' }} aria-labelledby="input-heading">
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <h2 id="input-heading" style={{ fontSize: 'var(--font-h2)', marginBottom: 'var(--space-3xs)', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', color: 'var(--text-primary)' }}>
          <FileText size={22} color="var(--brand-primary)" />
          Contract Ingestion & Analysis Hub
        </h2>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: 0 }}>
          Select a benchmark legal scenario below or paste any custom contract to generate risk radar scores, plain-English demystification, and redline negotiation strategies.
        </p>
      </div>

      {/* Benchmark Presets in a Responsive Grid (Zero Horizontal Overflow) */}
      <div style={{ marginBottom: 'var(--space-md)', width: '100%' }}>
        <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 'var(--space-xs)' }}>
          Quick Benchmark Scenarios (1-Click Evaluation):
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-xs)', width: '100%' }}>
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
                  padding: 'var(--space-sm) var(--space-md)',
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
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: 'var(--space-3xs)' }}>
                  <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>{sample.title}</strong>
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
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {sample.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Upload and Text Input Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2xs)', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
          <label htmlFor="contract-editor" style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
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
          rows={8}
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
              marginTop: 'var(--space-xs)', 
              padding: 'var(--space-xs) var(--space-sm)', 
              background: '#ecfdf5', 
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 'var(--font-xs)',
              color: '#065f46',
              flexWrap: 'wrap',
              gap: 'var(--space-xs)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} color="var(--impact-emerald)" />
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
        <div style={{ marginTop: 'var(--space-md)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={isAnalyzing || !contractText.trim()}
            id="btn-analyze-contract"
            style={{ width: '100%', maxWidth: '340px' }}
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
