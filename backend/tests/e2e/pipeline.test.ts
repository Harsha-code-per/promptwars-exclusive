/**
 * End-to-end pipeline test using a sample contract with known planted issues.
 * Tests the full flow: text extraction → clause splitting → (mocked) scoring → counter-draft → gotchas.
 * 
 * Planted issues in the sample contract:
 * - Unilateral indemnification (should flag as Unfavorable)
 * - 90-day payment terms with no late fees (should flag as Caution/Unfavorable)
 * - 24-month nationwide non-compete (should flag as Unfavorable)
 * - Immediate termination by Client only (should flag as Unfavorable)
 * - Unlimited contractor liability (should flag as Unfavorable)
 */

import fs from 'fs';
import path from 'path';
import { splitClauses } from '../../src/modules/ingestion/clauseSplitter';
import { extractText } from '../../src/modules/ingestion/textExtractor';
import { ClauseType, RiskLevel, DocumentType } from '../../src/types';
import { contentHash } from '../../src/utils';

// Mock external services
jest.mock('../../src/db/connection', () => ({
  query: jest.fn().mockResolvedValue([]),
  queryOne: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../src/services/redis', () => ({
  getCachedEmbedding: jest.fn().mockResolvedValue(null),
  setCachedEmbedding: jest.fn(),
  getCachedAnalysis: jest.fn().mockResolvedValue(null),
  setCachedAnalysis: jest.fn(),
}));

jest.mock('../../src/services/voyage', () => ({
  embedText: jest.fn().mockResolvedValue(new Array(768).fill(0.1)),
  embedBatch: jest.fn().mockImplementation((texts: string[]) =>
    Promise.resolve(texts.map(() => new Array(768).fill(0.1)))
  ),
}));

jest.mock('../../src/services/anthropic', () => ({
  evaluateSemanticDelta: jest.fn().mockImplementation(
    (clauseText: string, _benchmarkText: string, clauseType: string) => {
      // Simulate realistic scoring based on the planted issues
      if (clauseType === 'Indemnification' && clauseText.toLowerCase().includes('regardless of fault')) {
        return Promise.resolve({
          riskLevel: 'Unfavorable',
          explanation: 'This clause imposes unilateral indemnification on the Contractor regardless of fault, significantly deviating from the market standard of mutual indemnification.',
        });
      }
      if (clauseType === 'Termination' && clauseText.toLowerCase().includes('immediate effect')) {
        return Promise.resolve({
          riskLevel: 'Unfavorable',
          explanation: 'Client can terminate immediately without notice while Contractor cannot terminate at all. Standard benchmark allows mutual termination with 30 days notice.',
        });
      }
      if (clauseType === 'Payment Terms' && clauseText.toLowerCase().includes('ninety')) {
        return Promise.resolve({
          riskLevel: 'Caution',
          explanation: 'Payment terms of 90 days are significantly longer than the standard 30 days. No late fees removes incentive for timely payment.',
        });
      }
      return Promise.resolve({
        riskLevel: 'Standard',
        explanation: 'This clause is materially similar to market standards.',
      });
    }
  ),
  generateCounterDraft: jest.fn().mockResolvedValue({
    counterDraft: 'Improved clause text for informational purposes.',
    explanation: 'Changes made to balance the obligations.',
  }),
  generateGotchasSummary: jest.fn().mockResolvedValue([
    {
      title: 'One-sided protection',
      explanation: 'The contract heavily favors the client in multiple areas.',
      riskLevel: 'Unfavorable',
      relatedClauseIndex: 4,
    },
  ]),
  detectClauseBoundaries: jest.fn().mockResolvedValue([]),
}));

describe('E2E Pipeline Test', () => {
  const fixturePath = path.join(__dirname, '../fixtures/sample-freelance-contract.txt');

  it('should extract text from the sample contract', async () => {
    const text = await extractText(fixturePath);

    expect(text).toBeTruthy();
    expect(text.length).toBeGreaterThan(500);
    expect(text).toContain('FREELANCE SERVICES AGREEMENT');
  });

  it('should split the contract into identifiable clauses', () => {
    const text = fs.readFileSync(fixturePath, 'utf-8');
    const clauses = splitClauses(text);

    // The fixture has 15 numbered sections plus a preamble
    expect(clauses.length).toBeGreaterThanOrEqual(10);

    // Verify key clause types are detected
    const clauseTypes = clauses.map((c) => c.clauseType);

    expect(clauseTypes).toContain(ClauseType.PaymentTerms);
    expect(clauseTypes).toContain(ClauseType.ScopeOfWork);
    expect(clauseTypes).toContain(ClauseType.IntellectualProperty);
    expect(clauseTypes).toContain(ClauseType.Confidentiality);
    expect(clauseTypes).toContain(ClauseType.Indemnification);
    expect(clauseTypes).toContain(ClauseType.LimitationOfLiability);
    expect(clauseTypes).toContain(ClauseType.Termination);
  });

  it('should identify the planted unfavorable indemnification clause', () => {
    const text = fs.readFileSync(fixturePath, 'utf-8');
    const clauses = splitClauses(text);

    const indemnClause = clauses.find((c) => c.clauseType === ClauseType.Indemnification);
    expect(indemnClause).toBeTruthy();
    expect(indemnClause!.clauseText).toContain('regardless of fault');
    expect(indemnClause!.clauseText).toContain('no indemnification obligations');
  });

  it('should identify the planted unfavorable termination clause', () => {
    const text = fs.readFileSync(fixturePath, 'utf-8');
    const clauses = splitClauses(text);

    const termClause = clauses.find((c) => c.clauseType === ClauseType.Termination);
    expect(termClause).toBeTruthy();
    expect(termClause!.clauseText).toContain('immediate effect');
    expect(termClause!.clauseText).toContain('Contractor may not terminate');
  });

  it('should generate unique content hashes for distinct clauses', () => {
    const text = fs.readFileSync(fixturePath, 'utf-8');
    const clauses = splitClauses(text);
    const hashes = clauses.map((c) => contentHash(c.clauseText));

    // All hashes should be unique
    const uniqueHashes = new Set(hashes);
    expect(uniqueHashes.size).toBe(hashes.length);

    // Hashes should be 64-char hex strings (SHA-256)
    for (const hash of hashes) {
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it('should run the full scoring pipeline with mocked services', async () => {
    const { scoreClauses } = require('../../src/modules/scoring/scoringPipeline');
    const { query: mockQuery } = require('../../src/db/connection');

    const text = fs.readFileSync(fixturePath, 'utf-8');
    const splitResult = splitClauses(text);

    // Create mock extracted clauses
    const clauses = splitResult.map((split, index) => ({
      id: `clause-${index}`,
      documentId: 'test-doc',
      clauseType: split.clauseType,
      clauseText: split.clauseText,
      clauseIndex: index,
      contentHash: contentHash(split.clauseText),
      embedding: new Array(768).fill(0.1),
    }));

    // Mock pgvector search to return high similarity for all clauses
    mockQuery.mockImplementation(() =>
      Promise.resolve([
        {
          id: 'bench-1',
          clause_type: 'General',
          clause_text: 'Benchmark clause text',
          distance: 0.15, // similarity = 0.85
        },
      ])
    );

    const scored = await scoreClauses(clauses, DocumentType.FreelanceServices);

    expect(scored.length).toBe(clauses.length);

    // Every clause should have a risk level
    for (const clause of scored) {
      expect([RiskLevel.Standard, RiskLevel.Caution, RiskLevel.Unfavorable]).toContain(clause.riskLevel);
    }

    // At least some clauses should be flagged (not all Standard)
    const flagged = scored.filter((c: any) => c.riskLevel !== RiskLevel.Standard);
    expect(flagged.length).toBeGreaterThan(0);
  });

  it('should generate counter-drafts for flagged clauses', async () => {
    const { generateCounterDrafts } = require('../../src/modules/counterdraft/counterDraftGenerator');

    const mockScoredClauses = [
      {
        id: 'clause-1',
        documentId: 'doc-1',
        clauseType: ClauseType.Indemnification,
        clauseText: 'Unilateral indemnification clause',
        clauseIndex: 0,
        contentHash: 'hash-1',
        riskLevel: RiskLevel.Unfavorable,
        similarityScore: 0.85,
        nearestBenchmarkId: 'bench-1',
        nearestBenchmarkText: 'Mutual indemnification benchmark',
        semanticDeltaExplanation: 'Unilateral shift detected',
        counterDraft: null,
        counterDraftExplanation: null,
      },
      {
        id: 'clause-2',
        documentId: 'doc-1',
        clauseType: ClauseType.GoverningLaw,
        clauseText: 'Standard governing law',
        clauseIndex: 1,
        contentHash: 'hash-2',
        riskLevel: RiskLevel.Standard,
        similarityScore: 0.9,
        nearestBenchmarkId: 'bench-2',
        nearestBenchmarkText: 'Benchmark governing law',
        semanticDeltaExplanation: 'Standard',
        counterDraft: null,
        counterDraftExplanation: null,
      },
    ];

    const results = await generateCounterDrafts(mockScoredClauses);

    // Unfavorable clause should get a counter-draft
    expect(results[0].counterDraft).toBeTruthy();
    expect(results[0].counterDraftExplanation).toBeTruthy();

    // Standard clause should NOT get a counter-draft
    expect(results[1].counterDraft).toBeNull();
  });
});
