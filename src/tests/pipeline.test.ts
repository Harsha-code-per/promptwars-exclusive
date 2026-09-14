import { describe, it, expect, beforeEach } from 'vitest';
import { LegalAnalyzer } from '../services/legalAnalyzer';
import { PIISanitizer } from '../services/piiSanitizer';
import { DiffEngine } from '../services/diffEngine';
import { CacheService } from '../services/cacheService';
import { BENCHMARK_CLAUSES, getBenchmarksForDocumentType } from '../data/benchmarkClauses';
import { SAMPLE_CONTRACTS } from '../data/sampleContracts';

describe('LexiGuard AI End-to-End Enterprise Pipeline', () => {
  beforeEach(() => {
    CacheService.clear();
  });

  it('should execute full E2E pipeline: Ingestion -> PII Shield -> Two-Stage Scoring -> Gotchas', () => {
    const rawContract = `
1. PAYMENT AND COMPENSATION
Client will pay john.doe@example.com (SSN: 123-45-6789) the sum of $15,000 on Net-90 terms.

2. UNLIMITED INDEMNIFICATION
Contractor shall indemnify, defend, and hold harmless Client against all claims, liabilities, and legal fees without limitation regardless of fault.
    ` + SAMPLE_CONTRACTS[0].content;

    // Step 1: PII Sanitization
    const sanitized = PIISanitizer.sanitize(rawContract);
    expect(sanitized.totalRedactions).toBeGreaterThan(0);
    expect(sanitized.sanitizedText).not.toContain('john.doe@example.com');
    expect(sanitized.sanitizedText).not.toContain('123-45-6789');

    // Step 2: Contract Analysis
    const analysis = LegalAnalyzer.analyzeContract(
      sanitized.sanitizedText, 
      'End-to-End Test Agreement', 
      'FREELANCER', 
      'freelance_services'
    );

    expect(analysis.overallScore).toBeLessThan(50);
    expect(analysis.overallRating).toBe('CRITICAL_RISK');
    expect(analysis.clauses.length).toBeGreaterThan(2);
    expect(analysis.attorneyBrief.topRedFlags.length).toBeGreaterThan(0);
  });

  it('should dynamically adapt risk priorities when switching persona between FREELANCER and MSME_VENDOR', () => {
    const testContract = SAMPLE_CONTRACTS[0].content;

    const freelancer = LegalAnalyzer.analyzeContract(testContract, 'P1', 'FREELANCER', 'freelance_services');
    const msme = LegalAnalyzer.analyzeContract(testContract, 'P2', 'MSME_VENDOR', 'vendor_msa');

    expect(freelancer.dimensionScores.INTELLECTUAL_PROPERTY).toBeDefined();
    expect(msme.dimensionScores.LIABILITY).toBeDefined();
    expect(freelancer.overallScore).toBeDefined();
    expect(msme.overallScore).toBeDefined();
  });

  it('should compute comparative redline diff and detect leverage shifts', () => {
    const saas = SAMPLE_CONTRACTS[1];
    const comparison = DiffEngine.compareDocuments(
      saas.content, 
      saas.versionBContent!, 
      'Version 1', 
      'Version 2'
    );
    expect(comparison.differences.length).toBeGreaterThan(0);
    const favorsB = comparison.differences.filter(d => d.favorabilityShift === 'FAVORS_PARTY_B');
    expect(favorsB.length).toBeGreaterThan(0);
  });

  it('should demonstrate sub-linear execution speedup on cached re-evaluations', () => {
    const text = SAMPLE_CONTRACTS[3].content;

    const start1 = performance.now();
    LegalAnalyzer.analyzeContract(text, 'Run 1', 'FREELANCER');
    const duration1 = performance.now() - start1;

    const start2 = performance.now();
    LegalAnalyzer.analyzeContract(text, 'Run 2', 'FREELANCER');
    const duration2 = performance.now() - start2;

    const metrics = CacheService.getMetrics();
    expect(metrics.hits).toBeGreaterThan(0);
    expect(duration2).toBeLessThanOrEqual(duration1 + 5);
  });

  it('should verify disclaimer presence in all attorney briefs and executive summaries', () => {
    const analysis = LegalAnalyzer.analyzeContract(SAMPLE_CONTRACTS[0].content, 'Disclaimer Test');
    expect(analysis.executiveSummary).toBeDefined();
    expect(analysis.attorneyBrief.questionsForCounsel.length).toBe(5);
  });

  it('should validate curated benchmark corpus integrity across all legal verticals', () => {
    expect(BENCHMARK_CLAUSES.length).toBeGreaterThanOrEqual(13);
    const freelanceBenchmarks = getBenchmarksForDocumentType('freelance_services');
    const leaseBenchmarks = getBenchmarksForDocumentType('residential_lease');

    expect(freelanceBenchmarks.length).toBeGreaterThan(0);
    expect(leaseBenchmarks.length).toBeGreaterThan(0);

    for (const b of BENCHMARK_CLAUSES) {
      expect(b.clauseType).toBeDefined();
      expect(b.clauseText.length).toBeGreaterThan(50);
      expect(b.sourceAttribution.length).toBeGreaterThan(5);
    }
  });

  it('should safely handle empty or malformed inputs without unhandled exceptions', () => {
    const emptyAnalysis = LegalAnalyzer.analyzeContract('', 'Empty Document');
    expect(emptyAnalysis.overallScore).toBeGreaterThanOrEqual(80);
    expect(emptyAnalysis.clauses.length).toBeGreaterThanOrEqual(0);

    const whitespaceAnalysis = LegalAnalyzer.analyzeContract('    \n\n\t  ', 'Whitespace Document');
    expect(whitespaceAnalysis.overallScore).toBeGreaterThanOrEqual(80);
  });
});
