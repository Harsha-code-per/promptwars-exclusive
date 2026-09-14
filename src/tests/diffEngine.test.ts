import { describe, it, expect } from 'vitest';
import { DiffEngine } from '../services/diffEngine';
import { SAMPLE_CONTRACTS } from '../data/sampleContracts';

describe('DiffEngine Contract Comparison', () => {
  it('should detect differences between SaaS MSA original and revised draft', () => {
    const saas = SAMPLE_CONTRACTS[1];
    expect(saas.versionBContent).toBeDefined();

    const comparison = DiffEngine.compareDocuments(
      saas.content,
      saas.versionBContent!,
      'Original MSA',
      'Revised MSA'
    );

    expect(comparison.differences.length).toBeGreaterThan(0);
    expect(comparison.overallAdvantage).toBe('DOCUMENT_B');

    // Verify favorability detection
    const favorsCustomer = comparison.differences.filter((d) => d.favorabilityShift === 'FAVORS_PARTY_B');
    expect(favorsCustomer.length).toBeGreaterThan(0);
  });

  it('should handle identical texts with neutral determination', () => {
    const sample = '1. GOVERNING LAW\nThis Agreement is governed by the laws of California.';
    const comparison = DiffEngine.compareDocuments(sample, sample, 'Doc A', 'Doc B');

    expect(comparison.differences[0].favorabilityShift).toBe('NEUTRAL');
    expect(comparison.overallAdvantage).toBe('BALANCED');
  });
});
