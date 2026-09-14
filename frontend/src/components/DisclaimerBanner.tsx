import { Info } from 'lucide-react';

interface DisclaimerBannerProps {
  compact?: boolean;
}

/**
 * Persistent disclaimer banner.
 * Present on every screen that shows AI-generated content.
 * Required for problem-statement alignment — informational only, not legal advice.
 */
export function DisclaimerBanner({ compact = false }: DisclaimerBannerProps) {
  return (
    <div
      className="disclaimer-banner"
      role="alert"
      aria-label="Legal disclaimer"
      id="legal-disclaimer"
    >
      <Info className="disclaimer-icon" size={compact ? 16 : 20} aria-hidden="true" />
      <div>
        {compact ? (
          <p>
            <strong>Informational only</strong> — This tool provides general information, not legal advice.
            Consult a licensed attorney for guidance specific to your situation.
          </p>
        ) : (
          <>
            <p>
              <strong>Informational purposes only — not legal advice.</strong>
            </p>
            <p style={{ marginTop: '4px' }}>
              Fenco provides general information to help you understand contract language.
              It does not provide legal advice, and no attorney-client relationship is created by using this tool.
              Always consult a licensed attorney before making decisions based on contract analysis.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
