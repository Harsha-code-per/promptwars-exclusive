import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiService } from '../services/geminiService';
import { SAMPLE_CONTRACTS } from '../data/sampleContracts';
import { LegalAnalyzer } from '../services/legalAnalyzer';

describe('GeminiService Dual-Engine Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return valid ApiKeySource', () => {
    const source = GeminiService.getApiKeySource();
    expect(['ENV_VARIABLE', 'EPHEMERAL_USER_KEY', 'STORED_USER_CONFIG', 'OFFLINE_ENGINE']).toContain(source);
  });

  it('should support ephemeral key set and auto-wipe upon consumption', () => {
    GeminiService.setEphemeralApiKey('AIzaSyTestEphemeralKey12345');
    const active = GeminiService.getActiveApiKey();
    expect(active.isEphemeral).toBe(true);
    expect(active.source).toBe('EPHEMERAL_USER_KEY');
    expect(active.key).toBe('AIzaSyTestEphemeralKey12345');

    // Consume and auto-wipe
    const consumed = GeminiService.consumeEphemeralApiKey();
    expect(consumed).toBe('AIzaSyTestEphemeralKey12345');

    // After consume, ephemeral key must be null
    const after = GeminiService.getActiveApiKey();
    expect(after.isEphemeral).toBe(false);
    expect(after.source).not.toBe('EPHEMERAL_USER_KEY');
  });

  it('should answer questions using grounded citations via heuristic fallback when remote API fails', async () => {
    // Mock fetch to simulate network error or rate limit
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Rate limit or network unavailable'));

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
    expect(response.source).toBe('Deterministic Legal NLP Engine');
  });

  it('should succeed when Gemini API responds successfully', async () => {
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: 'Based on Section 4: Termination for Convenience, the client may terminate at any time without cause upon 24 hours notice.',
              },
            ],
          },
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const contract = SAMPLE_CONTRACTS[0];
    const analysis = LegalAnalyzer.analyzeContract(contract.content, contract.title);

    const response = await GeminiService.answerQuestion(
      'What are the termination rules?',
      contract.content,
      analysis.clauses
    );

    expect(response.text).toContain('Termination for Convenience');
    expect(response.source).toContain('Google');
  });

  it('should generate counter-clause with negotiation points', async () => {
    // Mock fetch to reject and test fallback counter-proposal
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Fetch fail'));

    const contract = SAMPLE_CONTRACTS[0];
    const analysis = LegalAnalyzer.analyzeContract(contract.content, contract.title);
    const criticalClause = analysis.clauses[1];

    const counter = await GeminiService.generateCounterClause(criticalClause, 'contractor');
    expect(counter).toContain('Counter-Proposal');
    expect(counter).toContain('Negotiation Talking Points');
  });
});


