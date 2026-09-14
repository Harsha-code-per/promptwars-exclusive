/**
 * Tests for the scoring classification logic.
 * Mocks Anthropic API calls for fast, deterministic tests.
 */

import { RiskLevel } from '../../src/types';
import { SIMILARITY_THRESHOLD } from '../../src/modules/scoring/retrievalScorer';

// Mock the gemini service before importing the module under test
jest.mock('../../src/services/gemini', () => ({
  evaluateSemanticDelta: jest.fn(),
  generateCounterDraft: jest.fn(),
  generateGotchasSummary: jest.fn(),
}));

jest.mock('../../src/db/connection', () => ({
  query: jest.fn().mockResolvedValue([]),
  queryOne: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../src/services/redis', () => ({
  getCachedEmbedding: jest.fn().mockResolvedValue(null),
  setCachedEmbedding: jest.fn().mockResolvedValue(undefined),
  getCachedAnalysis: jest.fn().mockResolvedValue(null),
  setCachedAnalysis: jest.fn().mockResolvedValue(undefined),
}));

import { evaluateSemanticDelta } from '../../src/services/gemini';
import { scoreClauses } from '../../src/modules/scoring/scoringPipeline';
import { DocumentType, ClauseType } from '../../src/types';
import type { ExtractedClause } from '../../src/types';
import { query } from '../../src/db/connection';

const mockEvaluateSemanticDelta = evaluateSemanticDelta as jest.MockedFunction<typeof evaluateSemanticDelta>;
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('Scoring Classification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SIMILARITY_THRESHOLD', () => {
    it('should be set to 0.65', () => {
      expect(SIMILARITY_THRESHOLD).toBe(0.65);
    });
  });

  describe('scoreClauses', () => {
    const makeClause = (
      index: number,
      type: ClauseType = ClauseType.General,
      text: string = 'Test clause text',
      hasEmbedding: boolean = true
    ): ExtractedClause => ({
      id: `clause-${index}`,
      documentId: 'doc-1',
      clauseType: type,
      clauseText: text,
      clauseIndex: index,
      contentHash: `hash-${index}`,
      embedding: hasEmbedding ? new Array(768).fill(0.1) : undefined,
    });

    it('should assign Caution to clauses without embeddings', async () => {
      const clauses = [makeClause(0, ClauseType.PaymentTerms, 'Test', false)];

      // Mock DB query for pgvector search — won't be called for no-embedding clauses
      mockQuery.mockResolvedValue([]);

      const scored = await scoreClauses(clauses, DocumentType.FreelanceServices);

      expect(scored).toHaveLength(1);
      expect(scored[0].riskLevel).toBe(RiskLevel.Caution);
      expect(scored[0].similarityScore).toBe(0);
      // Should NOT call the LLM
      expect(mockEvaluateSemanticDelta).not.toHaveBeenCalled();
    });

    it('should default to Caution when similarity is below threshold (no LLM call)', async () => {
      const clauses = [makeClause(0, ClauseType.PaymentTerms)];

      // Mock pgvector search returning low similarity
      mockQuery
        .mockResolvedValueOnce([
          {
            id: 'bench-1',
            clause_type: 'Payment Terms',
            clause_text: 'Benchmark payment text',
            distance: 0.5, // similarity = 1 - 0.5 = 0.5 < 0.65 threshold
          },
        ])
        .mockResolvedValue([]); // For the UPDATE query

      const scored = await scoreClauses(clauses, DocumentType.FreelanceServices);

      expect(scored).toHaveLength(1);
      expect(scored[0].riskLevel).toBe(RiskLevel.Caution);
      // LLM should NOT be called for below-threshold matches (efficiency optimization)
      expect(mockEvaluateSemanticDelta).not.toHaveBeenCalled();
    });

    it('should call LLM for semantic delta when similarity is above threshold', async () => {
      const clauses = [makeClause(0, ClauseType.Indemnification, 'Unilateral indemnification clause')];

      // Mock pgvector search returning high similarity
      mockQuery
        .mockResolvedValueOnce([
          {
            id: 'bench-1',
            clause_type: 'Indemnification',
            clause_text: 'Mutual indemnification benchmark',
            distance: 0.15, // similarity = 1 - 0.15 = 0.85 > 0.65 threshold
          },
        ])
        .mockResolvedValue([]); // For the UPDATE query

      // Mock LLM response
      mockEvaluateSemanticDelta.mockResolvedValueOnce({
        riskLevel: RiskLevel.Unfavorable,
        explanation: 'The clause shifts from mutual to unilateral indemnification.',
      });

      const scored = await scoreClauses(clauses, DocumentType.FreelanceServices);

      expect(scored).toHaveLength(1);
      expect(scored[0].riskLevel).toBe(RiskLevel.Unfavorable);
      expect(scored[0].semanticDeltaExplanation).toContain('unilateral');
      expect(mockEvaluateSemanticDelta).toHaveBeenCalledTimes(1);
    });

    it('should correctly handle Standard classifications from LLM', async () => {
      const clauses = [makeClause(0, ClauseType.GoverningLaw, 'Standard governing law clause')];

      mockQuery
        .mockResolvedValueOnce([
          {
            id: 'bench-1',
            clause_type: 'Governing Law',
            clause_text: 'Benchmark governing law clause',
            distance: 0.1, // similarity = 0.9
          },
        ])
        .mockResolvedValue([]);

      mockEvaluateSemanticDelta.mockResolvedValueOnce({
        riskLevel: RiskLevel.Standard,
        explanation: 'This clause is materially similar to the benchmark.',
      });

      const scored = await scoreClauses(clauses, DocumentType.FreelanceServices);

      expect(scored).toHaveLength(1);
      expect(scored[0].riskLevel).toBe(RiskLevel.Standard);
    });

    it('should process multiple clauses with mixed risk levels', async () => {
      const clauses = [
        makeClause(0, ClauseType.GoverningLaw, 'Standard clause'),
        makeClause(1, ClauseType.Indemnification, 'Unilateral indemnification'),
        makeClause(2, ClauseType.General, 'Unknown clause type', true),
      ];

      // Mock responses in order for each clause
      mockQuery
        // Clause 0: high similarity match
        .mockResolvedValueOnce([{
          id: 'bench-1', clause_type: 'Governing Law',
          clause_text: 'Benchmark', distance: 0.1,
        }])
        .mockResolvedValueOnce([]) // UPDATE
        // Clause 1: high similarity match
        .mockResolvedValueOnce([{
          id: 'bench-2', clause_type: 'Indemnification',
          clause_text: 'Benchmark', distance: 0.12,
        }])
        .mockResolvedValueOnce([]) // UPDATE
        // Clause 2: no match
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]); // UPDATE

      mockEvaluateSemanticDelta
        .mockResolvedValueOnce({ riskLevel: RiskLevel.Standard, explanation: 'Standard' })
        .mockResolvedValueOnce({ riskLevel: RiskLevel.Unfavorable, explanation: 'Unfavorable shift' });

      const scored = await scoreClauses(clauses, DocumentType.FreelanceServices);

      expect(scored).toHaveLength(3);
      expect(scored[0].riskLevel).toBe(RiskLevel.Standard);
      expect(scored[1].riskLevel).toBe(RiskLevel.Unfavorable);
      expect(scored[2].riskLevel).toBe(RiskLevel.Caution); // Default for no match
    });
  });
});
