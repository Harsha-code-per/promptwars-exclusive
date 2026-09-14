/**
 * PII Sanitizer & Data Shield Service
 * Cleans sensitive personal, financial, and identifying data from legal documents
 * before dispatching to LLM APIs to safeguard client confidentiality.
 */

export interface SanitizationReport {
  originalLength: number;
  sanitizedLength: number;
  totalRedactions: number;
  breakdown: {
    category: string;
    count: number;
    placeholder: string;
  }[];
  sanitizedText: string;
}

export class PIISanitizer {
  // Common PII Regular Expressions
  private static emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  private static phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  private static ssnTaxRegex = /\b\d{3}-\d{2}-\d{4}\b|\b\d{2}-\d{7}\b/g;
  private static creditCardRegex = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;
  private static currencyRegex = /\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\b\d{1,3}(?:,\d{3})+(?:\.\d{2})?\s?(?:USD|EUR|GBP|INR|CAD)\b/gi;
  private static addressPattern = /\b\d{1,5}\s+[A-Za-z0-9\s,.'-]{2,40}\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Terrace|Ter|Place|Pl|Square|Sq|Highway|Hwy)\b/gi;

  /**
   * Sanitizes input legal text by replacing sensitive data with compliance-safe placeholders.
   */
  public static sanitize(text: string): SanitizationReport {
    if (!text) {
      return {
        originalLength: 0,
        sanitizedLength: 0,
        totalRedactions: 0,
        breakdown: [],
        sanitizedText: '',
      };
    }

    let sanitized = text;
    let emailCount = 0;
    let phoneCount = 0;
    let ssnCount = 0;
    let ccCount = 0;
    let currencyCount = 0;
    let addressCount = 0;

    // Emails
    sanitized = sanitized.replace(this.emailRegex, () => {
      emailCount++;
      return '[REDACTED_EMAIL]';
    });

    // SSN / Tax IDs
    sanitized = sanitized.replace(this.ssnTaxRegex, () => {
      ssnCount++;
      return '[REDACTED_TAX_OR_SSN_ID]';
    });

    // Credit Card / Account Numbers
    sanitized = sanitized.replace(this.creditCardRegex, () => {
      ccCount++;
      return '[REDACTED_FINANCIAL_ACCOUNT]';
    });

    // Phone Numbers
    sanitized = sanitized.replace(this.phoneRegex, () => {
      phoneCount++;
      return '[REDACTED_PHONE_NUMBER]';
    });

    // Physical Addresses
    sanitized = sanitized.replace(this.addressPattern, () => {
      addressCount++;
      return '[REDACTED_STREET_ADDRESS]';
    });

    // Specific Dollar / Currency Figures
    sanitized = sanitized.replace(this.currencyRegex, () => {
      currencyCount++;
      return '[CONFIDENTIAL_SUM]';
    });

    const totalRedactions = emailCount + phoneCount + ssnCount + ccCount + currencyCount + addressCount;

    const breakdown = [
      { category: 'Email Addresses', count: emailCount, placeholder: '[REDACTED_EMAIL]' },
      { category: 'Phone Numbers', count: phoneCount, placeholder: '[REDACTED_PHONE_NUMBER]' },
      { category: 'SSN & Tax Identifiers', count: ssnCount, placeholder: '[REDACTED_TAX_OR_SSN_ID]' },
      { category: 'Financial Accounts', count: ccCount, placeholder: '[REDACTED_FINANCIAL_ACCOUNT]' },
      { category: 'Monetary Sums & Compensation', count: currencyCount, placeholder: '[CONFIDENTIAL_SUM]' },
      { category: 'Physical Addresses', count: addressCount, placeholder: '[REDACTED_STREET_ADDRESS]' },
    ].filter((b) => b.count > 0);

    return {
      originalLength: text.length,
      sanitizedLength: sanitized.length,
      totalRedactions,
      breakdown,
      sanitizedText: sanitized,
    };
  }
}
