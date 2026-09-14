import { describe, it, expect } from 'vitest';
import { PIISanitizer } from '../services/piiSanitizer';

describe('PIISanitizer Security Shield', () => {
  it('should redact sensitive email addresses', () => {
    const raw = 'Please contact jane.doe@corporate-law.com or admin@test.org regarding terms.';
    const result = PIISanitizer.sanitize(raw);

    expect(result.sanitizedText).not.toContain('jane.doe@corporate-law.com');
    expect(result.sanitizedText).not.toContain('admin@test.org');
    expect(result.sanitizedText).toContain('[REDACTED_EMAIL]');
    expect(result.totalRedactions).toBe(2);
  });

  it('should redact SSN and Tax Identification Numbers', () => {
    const raw = 'Party A Tax ID is 12-3456789 and individual SSN is 123-45-6789.';
    const result = PIISanitizer.sanitize(raw);

    expect(result.sanitizedText).not.toContain('123-45-6789');
    expect(result.sanitizedText).not.toContain('12-3456789');
    expect(result.sanitizedText).toContain('[REDACTED_TAX_OR_SSN_ID]');
  });

  it('should redact physical street addresses', () => {
    const raw = 'Principal place of business at 742 Evergreen Terrace, Springfield, OR.';
    const result = PIISanitizer.sanitize(raw);

    expect(result.sanitizedText).not.toContain('742 Evergreen Terrace');
    expect(result.sanitizedText).toContain('[REDACTED_STREET_ADDRESS]');
  });

  it('should redact phone numbers and monetary compensation amounts', () => {
    const raw = 'Contractor fee of $25,000.00 USD payable upon call to (555) 234-5678.';
    const result = PIISanitizer.sanitize(raw);

    expect(result.sanitizedText).not.toContain('$25,000.00');
    expect(result.sanitizedText).not.toContain('(555) 234-5678');
    expect(result.sanitizedText).toContain('[CONFIDENTIAL_SUM]');
    expect(result.sanitizedText).toContain('[REDACTED_PHONE_NUMBER]');
  });

  it('should handle clean text without modifications', () => {
    const raw = 'This Agreement shall be governed by the laws of New York.';
    const result = PIISanitizer.sanitize(raw);

    expect(result.totalRedactions).toBe(0);
    expect(result.sanitizedText).toBe(raw);
    expect(result.breakdown.length).toBe(0);
  });
});
