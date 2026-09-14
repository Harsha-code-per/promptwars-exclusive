import { describe, it, expect } from 'vitest';
import { GeminiService } from '../services/geminiService';
import { SAMPLE_CONTRACTS } from '../data/sampleContracts';
import { LegalAnalyzer } from '../services/legalAnalyzer';

describe('GeminiService Dual-Engine Integration', () => {
  it('should return OFFLINE_ENGINE or custom key source', () => {
    const source = GeminiService.getApiKeySource();
    expect(['ENV_VARIABLE', 'USER_CONFIG', 'OFFLINE_ENGINE']).toContain(source);
  });

  it('should answer questions using grounded citations via heuristic fallback', async () => {
    const contract = SAMPLE_CONTRACTS[0];
    const analysis = LegalAnalyzer.analyzeContract(contract.content, contract.title);

    const response = await GeminiService.answerQuestion(
      'Can the company terminate without paying me?',
      contract.content,
      analysis.clauses
    );

    expect(response.text).toBeDefined();
    expect(response.text.length).toBeGreaterThan(50);
    expect(response.citations.length).toBeGreaterThan(0);
    expect(response.source).toBe('HEURISTIC_AI_ENGINE');
  });

  it('should generate counter-clause with negotiation points', async () => {
    const contract = SAMPLE_CONTRACTS[0];
    const analysis = LegalAnalyzer.analyzeContract(contract.content, contract.title);
    const criticalClause = analysis.clauses[1];

    const counter = await GeminiService.generateCounterClause(criticalClause, 'contractor');
    expect(counter).toContain('Counter-Proposal');
    expect(counter).toContain('Negotiation Talking Points');
  });
});
