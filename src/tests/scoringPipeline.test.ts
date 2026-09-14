import { describe, it, expect, beforeEach } from 'vitest';
import { ScoringPipeline } from '../services/scoringPipeline';
import { CacheService } from '../services/cacheService';

describe('ScoringPipeline Two-Stage Architecture & Benchmark Retrieval', () => {
  beforeEach(() => {
    CacheService.clear();
  });

  it('should match freelance payment clause against benchmark with high similarity', () => {
    const clause = 'Client shall pay Contractor the agreed fee within 30 days of receiving a valid invoice.';
    const result = ScoringPipeline.evaluateStageOne(clause, 'freelance_services');

    expect(result.benchmarkMatch).toBeDefined();
    expect(result.benchmarkMatch?.clauseType).toBe('Payment Terms');
    expect(result.similarityScore).toBeGreaterThan(0.2);
  });

  it('should flag predatory indemnification terms for Stage 2 deep analysis', () => {
    const clause = 'Contractor agrees to indemnify and hold harmless Client against all claims without limitation.';
    const result = ScoringPipeline.evaluateStageOne(clause, 'freelance_services');

    expect(result.needsDeepAnalysis).toBe(true);
    expect(['CRITICAL', 'HIGH']).toContain(result.preliminaryRisk);
  });

  it('should evaluate semantic delta with persona-specific gotcha for FREELANCER', () => {
    const clause = 'Contractor assigns all right, title, and work made for hire without reservation.';
    const delta = ScoringPipeline.evaluateSemanticDelta(clause, 'FREELANCER', 'freelance_services');

    expect(delta.riskLevel).toBe('CRITICAL');
    expect(delta.gotchaWarning).toContain('Contractor forfeits');
    expect(delta.isCacheHit).toBe(false);
  });

  it('should evaluate semantic delta with persona-specific gotcha for TENANT', () => {
    const clause = 'Landlord may enter the premises at any time for any purpose.';
    const delta = ScoringPipeline.evaluateSemanticDelta(clause, 'TENANT', 'residential_lease');

    expect(delta.riskLevel).toBe('HIGH');
    expect(delta.gotchaWarning).toContain('Landlord reserves right to enter');
  });

  it('should evaluate semantic delta with persona-specific gotcha for EMPLOYEE', () => {
    const clause = 'Employee agrees to a 2-year nationwide non-compete following termination.';
    const delta = ScoringPipeline.evaluateSemanticDelta(clause, 'EMPLOYEE', 'employment_agreement');

    expect(delta.riskLevel).toBe('CRITICAL');
    expect(delta.gotchaWarning).toContain('FTC Non-Compete Rule');
  });

  it('should evaluate semantic delta with persona-specific gotcha for MSME_VENDOR', () => {
    const clause = 'Vendor assumes uncapped liability for all consequential damages.';
    const delta = ScoringPipeline.evaluateSemanticDelta(clause, 'MSME_VENDOR', 'vendor_msa');

    expect(delta.riskLevel).toBe('CRITICAL');
    expect(delta.gotchaWarning).toContain('liability cap');
  });

  it('should serve repeat clause evaluations instantly from cache (isCacheHit: true)', () => {
    const clause = 'Customer shall defend and hold harmless Vendor against all third-party claims.';

    // First call: fresh computation
    const call1 = ScoringPipeline.evaluateSemanticDelta(clause, 'MSME_VENDOR', 'vendor_msa');
    expect(call1.isCacheHit).toBe(false);

    // Second call: instant cache hit
    const call2 = ScoringPipeline.evaluateSemanticDelta(clause, 'MSME_VENDOR', 'vendor_msa');
    expect(call2.isCacheHit).toBe(true);
    expect(call2.riskLevel).toBe(call1.riskLevel);
  });
});
