import { describe, it, expect } from 'vitest';
import { LegalAnalyzer } from '../services/legalAnalyzer';
import { SAMPLE_CONTRACTS } from '../data/sampleContracts';

describe('LegalAnalyzer Risk Assessment & Demystifier Engine', () => {
  it('should accurately detect critical risk in predatory freelancer contract', () => {
    const predatory = SAMPLE_CONTRACTS[0];
    const analysis = LegalAnalyzer.analyzeContract(predatory.content, predatory.title);

    expect(analysis.overallScore).toBeLessThan(45);
    expect(analysis.overallRating).toBe('CRITICAL_RISK');
    expect(analysis.clauses.length).toBeGreaterThanOrEqual(5);

    // Verify critical clauses were flagged
    const criticalClauses = analysis.clauses.filter((c) => c.riskLevel === 'CRITICAL');
    expect(criticalClauses.length).toBeGreaterThan(0);

    // Verify 5 dimensions are present
    expect(analysis.dimensionScores.LIABILITY).toBeDefined();
    expect(analysis.dimensionScores.INTELLECTUAL_PROPERTY).toBeDefined();
    expect(analysis.dimensionScores.TERMINATION).toBeDefined();
    expect(analysis.dimensionScores.RESTRICTIVE_COVENANTS).toBeDefined();
    expect(analysis.dimensionScores.DISPUTE_RESOLUTION).toBeDefined();
  });

  it('should rate standard commercial NDA as balanced and safe', () => {
    const standardNDA = SAMPLE_CONTRACTS[3];
    const analysis = LegalAnalyzer.analyzeContract(standardNDA.content, standardNDA.title);

    expect(analysis.overallScore).toBeGreaterThanOrEqual(80);
    expect(analysis.overallRating).toBe('BALANCED_AND_SAFE');
    expect(analysis.dimensionScores.LIABILITY.riskLevel).toBe('LOW');
  });

  it('should extract critical deadlines and timelines accurately', () => {
    const predatory = SAMPLE_CONTRACTS[0];
    const analysis = LegalAnalyzer.analyzeContract(predatory.content, predatory.title);

    expect(analysis.timelines.length).toBeGreaterThan(0);
    const hasNet90 = analysis.timelines.some((t) => t.timeline.includes('Net-90'));
    expect(hasNet90).toBe(true);
  });

  it('should generate structured attorney briefing points and counsel questions', () => {
    const predatory = SAMPLE_CONTRACTS[0];
    const analysis = LegalAnalyzer.analyzeContract(predatory.content, predatory.title);

    expect(analysis.attorneyBrief.topRedFlags.length).toBeGreaterThan(0);
    expect(analysis.attorneyBrief.questionsForCounsel.length).toBe(5);
    expect(analysis.attorneyBrief.negotiationPriorities.length).toBeGreaterThan(0);
  });

  it('should adjust scoring sensitivity based on user persona context', () => {
    const contract = SAMPLE_CONTRACTS[0];
    
    // Freelancer persona prioritizes IP and termination
    const freelancerAnalysis = LegalAnalyzer.analyzeContract(
      contract.content, 
      contract.title, 
      'FREELANCER', 
      'freelance_services'
    );
    expect(freelancerAnalysis.overallRating).toBe('CRITICAL_RISK');

    // Tenant persona focuses on lease habitability
    const tenantAnalysis = LegalAnalyzer.analyzeContract(
      SAMPLE_CONTRACTS[3].content, 
      SAMPLE_CONTRACTS[3].title, 
      'TENANT', 
      'residential_lease'
    );
    expect(tenantAnalysis.overallScore).toBeGreaterThanOrEqual(70);
  });

  it('should flag severe non-compete for EMPLOYEE persona', () => {
    const employeeContract = SAMPLE_CONTRACTS[2];
    const analysis = LegalAnalyzer.analyzeContract(
      employeeContract.content,
      employeeContract.title,
      'EMPLOYEE',
      'employment_agreement'
    );

    expect(analysis.dimensionScores.RESTRICTIVE_COVENANTS).toBeDefined();
    expect(analysis.clauses.some(c => c.riskLevel === 'CRITICAL' || c.riskLevel === 'HIGH')).toBe(true);
  });
});
